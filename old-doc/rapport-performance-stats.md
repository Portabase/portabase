# Rapport — Performance des stats dashboard

Stack actuel : PostgreSQL (Drizzle ORM) + Next.js 16. Pas de cache, pas de pré-calcul.

---

## 1. Volume de données réel

Avant de choisir une solution, estimer le volume par requête dashboard.

| Paramètre | Estimation réaliste |
|---|---|
| Bases par organisation | 5 – 200 |
| Backups par base (rétention) | 7 – 365 |
| Lignes `backups` requêtées par org | 35 – 73 000 |
| Fréquence chargement dashboard | à chaque visite |

Pour **95 % des organisations**, le volume est < 10 000 lignes. PostgreSQL avec index correct répond en **< 5 ms** sur ce volume.

---

## 2. PostgreSQL vs ClickHouse

### PostgreSQL (situation actuelle)

**Points forts pour ce cas d'usage :**
- Données déjà là, même schéma, même connexion
- Requêtes scoped par org : filtre `project_id IN (...)` → petit sous-ensemble
- `SUM`, `AVG`, `MIN`, `MAX` sur 10 000 lignes = trivial (< 5 ms)
- Index sur `backups(database_id, status, created_at)` suffit
- Pas d'infrastructure supplémentaire
- Transactions ACID → stats cohérentes avec l'état réel

**Limites :**
- Mauvais sur des milliards de lignes sans pré-calcul
- Pas de stockage en colonnes (scan complet si pas d'index)
- Calculs répétés à chaque chargement sans cache

---

### ClickHouse

**Points forts en théorie :**
- Stockage en colonnes → `SUM(file_size)` sur 1 milliard de lignes en < 1s
- Fonctions fenêtre analytiques très rapides
- Idéal pour des agrégats sur des logs temps réel (millions d'événements/seconde)

**Pourquoi c'est un mauvais choix ici :**

| Critère | Verdict |
|---|---|
| Volume actuel (< 100K lignes) | PostgreSQL largement suffisant |
| Synchronisation des données | Il faudrait dupliquer `backups` → deux sources de vérité |
| Transactions / cohérence | ClickHouse n'est pas ACID, pas de rollback |
| Complexité infra | Un service de plus à déployer, monitorer, maintenir |
| Drizzle ORM | Pas de support ClickHouse → réécriture des requêtes |
| Coût | Significatif pour un gain nul à ce volume |

**Verdict : ne pas utiliser ClickHouse.** PostgreSQL avec pré-calcul est 10× plus simple et largement suffisant pour ce cas.

---

## 3. Stratégies de pré-calcul

Le vrai problème n'est pas PostgreSQL vs ClickHouse, c'est **recalculer les mêmes agrégats à chaque visite**. Deux niveaux de solution, du plus simple au plus robuste. `unstable_cache` Next.js écarté (cache mémoire process, non fiable multi-instances, perdu au redémarrage).

---

### Niveau 1 — Vue matérialisée PostgreSQL

Pré-calcul stocké en DB, rafraîchi périodiquement ou à la demande.

```sql
CREATE MATERIALIZED VIEW stats_backup_per_database AS
SELECT
    b.database_id,
    db.name                                                      AS database_name,
    db.project_id,
    COUNT(*)                                                     AS backup_count,
    SUM(b.file_size)                                             AS total_bytes,
    MIN(b.file_size)                                             AS min_bytes,
    MAX(b.file_size)                                             AS max_bytes,
    AVG(b.file_size)                                             AS avg_bytes,
    MIN(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)))       AS duration_min_s,
    MAX(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)))       AS duration_max_s,
    AVG(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)))       AS duration_avg_s,
    MAX(b.created_at)                                            AS last_backup_at,
    MIN(b.created_at)                                            AS first_backup_at
FROM backups b
JOIN databases db ON db.id = b.database_id
WHERE b.status     = 'success'
  AND b.deleted_at IS NULL
  AND b.file_size  IS NOT NULL
GROUP BY b.database_id, db.name, db.project_id
WITH DATA;

CREATE UNIQUE INDEX ON stats_backup_per_database (database_id);
CREATE INDEX ON stats_backup_per_database (project_id);
```

**Rafraîchissement** :

```sql
-- Rafraîchissement complet (non-bloquant grâce à CONCURRENTLY)
REFRESH MATERIALIZED VIEW CONCURRENTLY stats_backup_per_database;
```

**Déclencher le refresh depuis l'app** (après chaque backup `success`) :

```ts
await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY stats_backup_per_database`);
```

Ou via un cron PostgreSQL (`pg_cron`) :

```sql
-- pg_cron : refresh toutes les 5 minutes
SELECT cron.schedule('refresh-stats', '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY stats_backup_per_database');
```

**Requête dashboard = lecture directe, < 1 ms :**

```sql
SELECT * FROM stats_backup_per_database
WHERE project_id IN (/* ids projets user */);
```

**Avantages :**
- Fonctionne sur plusieurs instances (stocké en DB)
- Survit aux redémarrages
- Requête dashboard ultra-simple et rapide

**Limites :**
- Stats pas strictement temps réel (décalage = intervalle de refresh)
- `REFRESH CONCURRENTLY` nécessite un `UNIQUE INDEX`
- Une migration à écrire et maintenir

---

### Niveau 3 — Table de stats dédiée (event-driven)

Mise à jour des stats **en temps réel** à chaque transition de statut. Zéro délai, zéro cron.

```sql
CREATE TABLE database_stats (
    database_id       uuid PRIMARY KEY REFERENCES databases(id) ON DELETE CASCADE,
    project_id        uuid NOT NULL,
    backup_count      integer NOT NULL DEFAULT 0,
    total_bytes       bigint  NOT NULL DEFAULT 0,
    min_bytes         bigint,
    max_bytes         bigint,
    duration_min_s    double precision,
    duration_max_s    double precision,
    duration_avg_s    double precision,
    last_backup_at    timestamp,
    first_backup_at   timestamp,
    updated_at        timestamp DEFAULT NOW()
);

CREATE INDEX ON database_stats (project_id);
```

**Mise à jour** dans la transaction qui marque le backup comme `success` :

```ts
// Dans l'action serveur / service qui complète un backup
await db.transaction(async (tx) => {
  // 1. Mettre à jour le statut du backup
  await tx.update(backup)
    .set({ status: "success", updatedAt: new Date() })
    .where(eq(backup.id, backupId));

  // 2. Mettre à jour les stats de la base (upsert)
  await tx.execute(sql`
    INSERT INTO database_stats (database_id, project_id, backup_count, total_bytes, ...)
    SELECT
      b.database_id,
      db.project_id,
      COUNT(*),
      SUM(b.file_size),
      ...
    FROM backups b JOIN databases db ON db.id = b.database_id
    WHERE b.database_id = ${databaseId} AND b.status = 'success'
    ON CONFLICT (database_id) DO UPDATE SET
      backup_count   = EXCLUDED.backup_count,
      total_bytes    = EXCLUDED.total_bytes,
      updated_at     = NOW()
  `);
});
```

**Requête dashboard = SELECT direct, < 1 ms :**

```ts
const stats = await db.query.databaseStats.findMany({
  where: inArray(databaseStats.projectId, projectIds),
});
```

**Avantages :**
- Stats toujours à jour (synchrone avec le backup)
- Requête la plus rapide possible
- Fonctionne multi-instances

**Limites :**
- Code à maintenir dans la logique de completion de backup
- Recalcul complet si des données historiques changent (ex : purge)
- Migration + table + logique de mise à jour

---

## 4. Comparaison des approches retenues

| Critère | Vue matérialisée | Table stats dédiée |
|---|---|---|
| Complexité impl. | Faible | Élevée |
| Migration DB | ✅ Oui (1 vue) | ✅ Oui (1 table + logique) |
| Multi-instances | ✅ Oui | ✅ Oui |
| Fraîcheur des stats | Quasi-temps réel (refresh événementiel) | Temps réel exact |
| Vitesse dashboard | < 1 ms | < 1 ms |
| Résistance restart | ✅ Oui | ✅ Oui |
| Maintenance | Faible | Moyenne |
| Recalcul si purge | ✅ Automatique (REFRESH) | ⚠️ Manuel |

---

## 5. Recommandation par phase

### Phase 1 — maintenant

**Vue matérialisée PostgreSQL** + refresh déclenché après chaque backup terminé.

- 1 migration SQL, zéro logique métier supplémentaire
- Stats quasi-temps réel (refresh après chaque backup success)
- Requête dashboard = SELECT simple, < 1 ms
- Fonctionne multi-instances, survit aux redémarrages
- Couvre tous les agrégats : total_bytes, duration, count, min, max

### Phase 2 — si SLA strict sur fraîcheur ou purge fréquente

**Table `database_stats`** mise à jour dans la transaction de completion.

- Stats synchrones avec le backup (toujours exactes)
- Nécessite de maintenir la logique de mise à jour dans le code
- Recalcul sur purge à gérer explicitement

---

## 6. Index PostgreSQL indispensables

À créer quelle que soit la phase choisie :

```sql
-- Accélère tous les agrégats backup
CREATE INDEX CONCURRENTLY idx_backups_database_status
  ON backups (database_id, status)
  INCLUDE (file_size, created_at, updated_at)
  WHERE deleted_at IS NULL;

-- Accélère le filtre par projet
CREATE INDEX CONCURRENTLY idx_databases_project_id
  ON databases (project_id)
  WHERE deleted_at IS NULL;

-- Accélère les requêtes healthcheck
CREATE INDEX CONCURRENTLY idx_healthcheck_log_object_date
  ON healthcheck_log (object_id, kind, date);
```

---

## 7. Ce qu'il ne faut pas faire

- **ClickHouse** : overhead infra disproportionné, synchronisation complexe, volume actuel ne le justifie pas.
- **`unstable_cache` Next.js** : cache mémoire process, perdu au redémarrage, ne fonctionne pas multi-instances.
- **Recalculer à chaque requête sans index** : `SELECT SUM(file_size) FROM backups` sans index sur `database_id` = seq scan complet.
- **Cron de refresh trop fréquent** : toutes les 5 min suffit pour la vue matérialisée ; toutes les 30s = overhead inutile.
