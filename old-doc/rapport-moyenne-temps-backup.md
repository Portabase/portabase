# Rapport — Durée moyenne des backups

Référence : wireframe `dashboard.png` (hover sur la courbe d'une db), doc `moyenne-temps.md`

---

## Objectif

Pour chaque base de données, calculer la durée de chaque backup (temps entre la demande et le retour "OK"), puis en déduire : min, max, moyenne par base, et une moyenne globale toutes bases confondues. Identifier les bases "plus lentes que la normale".

---

## Tables sources

| Table | Rôle |
|---|---|
| `backups` | durée de chaque backup (`created_at` → `updated_at`) |
| `databases` | nom de la base |

---

## Colonnes utilisées

### Table `backups`

| Colonne | Type | Usage |
|---|---|---|
| `id` | uuid | identifiant |
| `database_id` | uuid | jointure → `databases.id` |
| `created_at` | timestamp | **heure de départ** du backup |
| `updated_at` | timestamp | **heure de fin** du backup (dernière mise à jour du statut) |
| `status` | enum | filtre `= 'success'` uniquement |
| `deleted_at` | timestamp | filtre `IS NULL` |

### Table `databases`

| Colonne | Type | Usage |
|---|---|---|
| `id` | uuid | jointure |
| `name` | text | label |
| `project_id` | uuid | filtre sur les projets de l'utilisateur |

---

## Calcul de la durée

```
durée_secondes = EXTRACT(EPOCH FROM (updated_at - created_at))
```

- `created_at` = moment où le backup a été déclenché
- `updated_at` = moment où le statut est passé à `'success'`

> **⚠️ Approximation importante** : `updated_at` est la dernière modification de la ligne, pas un champ `completed_at` dédié. En pratique, quand `status = 'success'`, `updated_at` correspond bien à la fin du backup — mais si la ligne est modifiée pour une autre raison après coup, la mesure sera faussée.
>
> **Recommandation** : ajouter une colonne `completed_at timestamp` dans `backups` pour capturer l'heure exacte de fin, indépendamment des autres mises à jour de la ligne.

---

## Calculs par base de données

Pour chaque `database_id`, sur l'ensemble des backups `status = 'success'` :

| Stat | Formule |
|---|---|
| **Durée min** | `MIN(durée_secondes)` |
| **Durée max** | `MAX(durée_secondes)` |
| **Durée moyenne** | `AVG(durée_secondes)` = `SUM(durée_secondes) / COUNT(*)` |
| **Nombre de backups** | `COUNT(*)` |

Exemple (prod-main, 3 backups : 75s, 102s, 58s) :
- Somme : 235s
- Moyenne : 235 / 3 = **78s (1min 18s)**
- Min : **58s**
- Max : **102s**

---

## Calcul de la moyenne globale

```
moyenne_globale = (somme des moyennes par base) / (nombre de bases)
```

Exemple :
```
prod-main  : 78s
analytics  : 269s
users-db   : 36s
logs-store : 498s
reporting  : 132s

Moyenne globale = (78 + 269 + 36 + 498 + 132) / 5 = 1013 / 5 = 203s (3min 23s)
```

> Une base dont la moyenne dépasse la moyenne globale est considérée "plus lente que la normale".

---

## Requête SQL

```sql
SELECT
    db.id                                                   AS database_id,
    db.name                                                 AS database_name,
    COUNT(*)                                                AS backup_count,
    MIN(EXTRACT(EPOCH FROM (b.updated_at - b.created_at))) AS duration_min_s,
    MAX(EXTRACT(EPOCH FROM (b.updated_at - b.created_at))) AS duration_max_s,
    AVG(EXTRACT(EPOCH FROM (b.updated_at - b.created_at))) AS duration_avg_s
FROM backups b
JOIN databases db ON db.id = b.database_id
WHERE b.status     = 'success'
  AND b.deleted_at IS NULL
  AND b.updated_at IS NOT NULL
  AND db.project_id IN (/* ids projets user */)
GROUP BY db.id, db.name
ORDER BY duration_avg_s DESC;
```

La moyenne globale est calculée côté application :

```ts
const globalAvg = databases.reduce((sum, db) => sum + db.durationAvgS, 0) / databases.length;
const slowDbs   = databases.filter(db => db.durationAvgS > globalAvg);
```

---

## Conversion pour l'affichage

```ts
function secondsToDisplay(s: number): string {
  const min = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  if (min === 0) return `${sec}s`;
  return `${min}min ${String(sec).padStart(2, '0')}s`;
}
```

---

## Structure de donnée

```ts
type DatabaseDurationStats = {
  databaseId: string;
  databaseName: string;
  backupCount: number;
  durationMinS: number;
  durationMaxS: number;
  durationAvgS: number;
  isAboveGlobalAvg: boolean; // calculé après avoir la moyenne globale
};
```

---

## Faisabilité

| Élément | Faisable | Remarque |
|---|---|---|
| Durée par backup | ⚠️ | `updated_at - created_at` (approximation, pas de `completed_at`) |
| Min / Max / Avg par base | ✅ | agrégats SQL standards |
| Moyenne globale | ✅ | calcul applicatif trivial |
| Identifier bases lentes | ✅ | comparaison avg vs global_avg |
| Affichage min:ss | ✅ | conversion applicative |

**Faisabilité globale : ⚠️ Réalisable avec une approximation acceptable.**  
**Si précision requise → ajouter `completed_at` dans la table `backups`.**
