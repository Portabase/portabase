# Rapport — Treemap "Occupation du volume par base"

Référence : wireframe `dashboard.png` (bas droite), doc `treemap-detail-taille-db-storage.md`

---

## Objectif

Afficher un treemap où chaque case représente une base de données, avec une taille proportionnelle au **volume total occupé sur le stockage depuis le premier backup** (somme de tous les fichiers `.dmp`, pas seulement le dernier).

Total global affiché en haut du treemap (ex : 476,87 Go).

---

## Pourquoi la somme et pas la dernière valeur ?

La dernière taille connue représente l'état actuel de la base, pas l'espace disque réellement occupé. Si tous les fichiers `.dmp` sont conservés (restauration, audit), chacun occupe de la place physiquement. La somme alltime reflète le stockage physique total.

---

## Deux options de source

### Option A — `backups.file_size` (taille du .dmp produit)

Source directe, sans jointure supplémentaire. Correspond exactement au scénario décrit dans le doc.

### Option B — `backup_storage.size` (taille physique dans le canal de stockage)

Plus précis pour l'occupation réelle sur S3/local, mais risque de double-comptage si un backup est envoyé sur plusieurs canaux (S3 + local = 2× la taille).

**Recommandation : Option A** pour démarrer, Option B si on veut distinguer l'occupation par canal de stockage.

---

## Tables sources

### Option A

| Table | Rôle |
|---|---|
| `backups` | `file_size` + `database_id` |
| `databases` | nom de la base, `project_id` |

### Option B

| Table | Rôle |
|---|---|
| `backup_storage` | `size` physique par canal |
| `backups` | lien `backup_id` → `database_id` |
| `databases` | nom de la base |

---

## Colonnes utilisées

### Option A — Table `backups`

| Colonne | Type | Usage |
|---|---|---|
| `database_id` | uuid | groupe par base |
| `file_size` | bigint | taille en octets du fichier `.dmp` |
| `status` | enum | filtre `= 'success'` |
| `deleted_at` | timestamp | filtre `IS NULL` |

### Option A — Table `databases`

| Colonne | Type | Usage |
|---|---|---|
| `id` | uuid | jointure |
| `name` | text | label dans le treemap |
| `project_id` | uuid | filtre sur les projets de l'utilisateur |

### Option B — Table `backup_storage` (complémentaire)

| Colonne | Type | Usage |
|---|---|---|
| `backup_id` | uuid | jointure → `backups.id` |
| `size` | bigint | taille physique en octets |
| `status` | enum | filtre `= 'success'` |

---

## Calculs

### Volume total par base (Option A)

```
total_bytes(db) = SUM(backups.file_size)
                  WHERE database_id = db.id
                    AND status = 'success'
                    AND deleted_at IS NULL
```

Exemple (prod-main, 9 backups) :
```
10,20 + 10,80 + 11,40 + 13,33 + 13,90 + 14,50 + 15,10 + 14,80 + 16,20 = 120,23 Go
```

### Volume total global

```
total_global = SUM(total_bytes) pour toutes les bases
```

Exemple :
```
prod-main  : 120,23 Go
analytics  :  57,30 Go
users-db   :   3,21 Go
logs-store : 224,85 Go
reporting  :  71,28 Go

Total global = 476,87 Go
```

### Proportion treemap

```
proportion(db) = total_bytes(db) / total_global
```

La surface de chaque case dans le treemap est proportionnelle à cette valeur.

---

## Requête SQL (Option A)

```sql
SELECT
    db.id                   AS database_id,
    db.name                 AS database_name,
    SUM(b.file_size)        AS total_bytes,
    COUNT(b.id)             AS backup_count
FROM backups b
JOIN databases db ON db.id = b.database_id
WHERE b.status     = 'success'
  AND b.deleted_at IS NULL
  AND b.file_size  IS NOT NULL
  AND db.project_id IN (/* ids projets user */)
GROUP BY db.id, db.name
ORDER BY total_bytes DESC;
```

Le total global est calculé côté application :

```ts
const grandTotal = databases.reduce((sum, db) => sum + db.totalBytes, 0);
const treemapData = databases.map(db => ({
  ...db,
  proportion: db.totalBytes / grandTotal,
  totalGo: db.totalBytes / 1_073_741_824,
}));
```

---

## Conversion d'unités

```
octets → Mo  :  / 1_048_576
octets → Go  :  / 1_073_741_824
```

Afficher en Mo si < 1 Go, sinon en Go.

---

## Structure de donnée

```ts
type DatabaseVolumeStats = {
  databaseId: string;
  databaseName: string;
  totalBytes: number;
  totalGo: number;
  backupCount: number;
  proportion: number;         // 0..1, pour dimensionner le treemap
};

type TreemapData = {
  databases: DatabaseVolumeStats[];
  grandTotalBytes: number;
  grandTotalGo: number;
};
```

---

## Filtre par canal de stockage (note du wireframe)

Le PNG indique "Compacter pour changer selon le storage / base de données" → prévoir un filtre UI pour restreindre le treemap à un canal de stockage spécifique (ex : afficher uniquement ce qui est stocké sur S3).

Dans ce cas, passer à **Option B** avec un filtre sur `backup_storage.storage_channel_id`.

```sql
SELECT
    db.id, db.name,
    SUM(bs.size) AS total_bytes
FROM backup_storage bs
JOIN backups b         ON b.id  = bs.backup_id
JOIN databases db      ON db.id = b.database_id
WHERE bs.status        = 'success'
  AND bs.storage_channel_id = :channelId   -- filtre par canal
  AND db.project_id IN (/* ids projets user */)
GROUP BY db.id, db.name;
```

---

## Faisabilité

| Élément | Faisable | Remarque |
|---|---|---|
| Somme alltime par base (Option A) | ✅ | `SUM(backups.file_size)` |
| Somme par canal de stockage (Option B) | ✅ | `SUM(backup_storage.size)` + filtre channel |
| Double-comptage multi-canal | ⚠️ | Option B : additionner par canal séparément |
| Total global affiché | ✅ | somme applicative |
| Proportion treemap | ✅ | calcul applicatif trivial |
| Filtre par canal (wireframe) | ✅ | Option B + `storage_channel_id` |

**Faisabilité globale : ✅ Entièrement réalisable.**  
**Option A (plus simple) pour le cas de base, Option B pour le filtre par canal.**
