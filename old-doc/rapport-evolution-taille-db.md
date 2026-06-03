# Rapport — Graphique "Évolution du backup stocké"

Référence : wireframe `dashboard.png` (graphique multi-lignes, centre), doc `evolution-taille-db.md`

---

## Objectif

Un graphique en courbes (une ligne par base de données) montrant l'évolution de la taille du fichier `.dmp` au fil des backups. Sur le hover d'une ligne, afficher un résumé statistique de la base.

---

## Tables sources

| Table | Alias SQL | Rôle |
|---|---|---|
| `backups` | `b` | taille et date de chaque backup |
| `databases` | `db` | nom de la base |

---

## Colonnes utilisées

### Table `backups`

| Colonne | Type | Usage |
|---|---|---|
| `id` | uuid | identifiant du backup |
| `database_id` | uuid | clé étrangère → `databases.id` |
| `file_size` | bigint | taille du fichier `.dmp` en **octets** |
| `created_at` | timestamp | date d'exécution du backup (axe X du graphique) |
| `status` | enum | filtre `= 'success'` uniquement |
| `deleted_at` | timestamp | filtre `IS NULL` |

### Table `databases`

| Colonne | Type | Usage |
|---|---|---|
| `id` | uuid | jointure |
| `name` | text | label de la courbe |
| `project_id` | uuid | filtre sur les projets de l'utilisateur |

---

## Calculs

### Données brutes (point par point)

Pour chaque backup `b` d'une base `db`, on produit un point :

```
date  = b.created_at
taille_mo = b.file_size / (1024 * 1024)   -- conversion octets → Mo
```

Points triés par `b.created_at ASC` pour chaque `database_id`.

---

### Delta entre backups consécutifs

Calculé côté application (ou via window function SQL) :

```
delta_mo = taille_courante_mo - taille_precedente_mo
```

- `delta > 0` : croissance normale
- `delta < 0` : réduction (purge, optimisation)
- `delta = 0` : backup identique

---

### Statistiques par base (affichées au hover)

Pour chaque base, calculé sur l'ensemble de ses backups `status = 'success'` :

| Stat | Formule |
|---|---|
| **Taille initiale** | `file_size` du backup le plus ancien |
| **Taille actuelle** | `file_size` du backup le plus récent |
| **Min** | `MIN(file_size)` |
| **Max** | `MAX(file_size)` |
| **Croissance totale %** | `((taille_actuelle - taille_initiale) / taille_initiale) × 100` |
| **Croissance moy/backup** | `(taille_actuelle - taille_initiale) / (nb_backups - 1)` |
| **Nombre de backups** | `COUNT(*)` |

Exemple (prod-main, 9 backups, 10,20 Mo → 16,20 Mo) :
- Croissance totale : ((16,20 - 10,20) / 10,20) × 100 = **+58,8 %**
- Croissance moy/backup : (16,20 - 10,20) / 8 = **+0,75 Mo/backup**

---

### Conversion d'unités

```
file_size (octets) → Mo  :  / 1_048_576
file_size (octets) → Go  :  / 1_073_741_824
```

Afficher en Mo si < 1 Go, sinon en Go.

---

## Requête SQL de base

```sql
SELECT
    b.id,
    b.database_id,
    db.name       AS database_name,
    b.file_size,
    b.created_at
FROM backups b
JOIN databases db ON db.id = b.database_id
WHERE b.status     = 'success'
  AND b.deleted_at IS NULL
  AND db.project_id IN (/* ids projets user */)
ORDER BY b.database_id, b.created_at ASC;
```

Les calculs de delta et de stats (min/max/growth%) sont ensuite faits côté application sur les données retournées, groupées par `database_id`.

---

## Structure de donnée pour le graphique

```ts
// Un point de la courbe
type BackupPoint = {
  date: Date;
  fileSizeBytes: number;
  fileSizeMo: number;
  deltaMo: number | null; // null pour le premier point
};

// Par base de données
type DatabaseEvolution = {
  databaseId: string;
  databaseName: string;
  points: BackupPoint[];
  stats: {
    minMo: number;
    maxMo: number;
    firstMo: number;
    lastMo: number;
    growthPercent: number;
    avgGrowthPerBackupMo: number;
    backupCount: number;
  };
};
```

---

## Faisabilité

| Élément | Faisable | Remarque |
|---|---|---|
| Courbe taille par backup | ✅ | `backups.file_size` + `created_at` |
| Delta entre backups | ✅ | calcul applicatif ou LAG() SQL |
| Hover stats (min/max/growth) | ✅ | agrégats SQL ou applicatifs |
| Multi-lignes par base | ✅ | grouper par `database_id` |
| Delta négatif (purge) | ✅ | cas naturel, aucun traitement spécial |

**Faisabilité globale : ✅ Entièrement réalisable avec le schéma actuel.**
