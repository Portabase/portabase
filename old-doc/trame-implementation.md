# Trame d'implémentation — Dashboard KPI & Stats

> **Scope dashboard** : toutes les requêtes dashboard sont **globales** (toute l'installation Portabase).
> Pas de filtre `WHERE organization_id IN (...)` ni `WHERE project_id IN (...)`.

---

## BLOC 0 — Bugs critiques (avant tout)

### 0.1 Corriger `HEALTHCHECK_CRON` en production
- [ ] Ouvrir `src/env.mjs`
- [ ] Changer la valeur par défaut prod de `"0 * * * *"` → `"*/10 * * * *"`
- [ ] Mettre à jour `.env.example` avec la nouvelle valeur recommandée
- [ ] Vérifier que `HEALTHCHECK_CRON` est bien surchargeable via `.env`

### 0.2 Reset `health_error_count` sur ping agent
- [ ] Localiser la route / le service qui reçoit le ping de l'agent (mise à jour de `last_contact`)
- [ ] Ajouter `healthErrorCount: 0` dans le `db.update(agent)` sur chaque ping
- [ ] Faire de même pour `databases` (même logique, même bug)
- [ ] Tester : simuler 3 incidents → vérifier reset → vérifier que les notifications repartent

---

## BLOC 1 — Index PostgreSQL

### 1.1 Créer les index manquants
- [ ] Écrire une migration Drizzle (ou SQL brut) avec les 3 index :
  ```sql
  CREATE INDEX CONCURRENTLY idx_backups_database_status
    ON backups (database_id, status)
    INCLUDE (file_size, created_at, updated_at)
    WHERE deleted_at IS NULL;

  CREATE INDEX CONCURRENTLY idx_databases_deleted_at
    ON databases (deleted_at)
    WHERE deleted_at IS NULL;

  CREATE INDEX CONCURRENTLY idx_healthcheck_log_object_date
    ON healthcheck_log (object_id, kind, date);
  ```
- [ ] Appliquer en dev → vérifier via `EXPLAIN ANALYZE` que les index sont utilisés
- [ ] Appliquer en prod (CONCURRENTLY = non-bloquant)

---

## BLOC 2 — Vue matérialisée (pré-calcul stats)

### 2.1 Créer la vue matérialisée (scope global — pas de project_id)
- [ ] Écrire la migration SQL :
  ```sql
  CREATE MATERIALIZED VIEW stats_backup_per_database AS
  SELECT
      b.database_id,
      db.name                                                      AS database_name,
      db.dbms,
      COUNT(*)                                                     AS backup_count,
      SUM(b.file_size)                                             AS total_bytes,
      MIN(b.file_size)                                             AS min_bytes,
      MAX(b.file_size)                                             AS max_bytes,
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
  GROUP BY b.database_id, db.name, db.dbms
  WITH DATA;

  CREATE UNIQUE INDEX ON stats_backup_per_database (database_id);
  ```
- [ ] Appliquer la migration en dev
- [ ] Vérifier que la vue contient des données (`SELECT COUNT(*) FROM stats_backup_per_database`)

### 2.2 Brancher le refresh événementiel
- [ ] Localiser le service qui marque un backup comme `status = 'success'`
- [ ] Ajouter après la mise à jour du statut (hors transaction) :
  ```ts
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY stats_backup_per_database`);
  ```
- [ ] S'assurer que le refresh ne bloque pas la transaction principale
- [ ] Tester : déclencher un backup → vérifier que la vue est mise à jour

---

## BLOC 3 — Cartes KPI (4 cards du haut)

### 3.1 Alertes 24h
- [ ] Créer la requête (globale — sans filtre org) :
  ```ts
  // COUNT FROM notification_log WHERE sent_at >= NOW() - INTERVAL '24 hours'
  ```
- [ ] Exposer via Server Component sur la page dashboard
- [ ] Brancher le composant UI de la carte

### 3.2 Bases de données disponibles (taux %)
- [ ] Créer la requête (globale) :
  ```sql
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE last_contact >= NOW() - INTERVAL '10 minutes') AS up_count,
    ROUND(
      COUNT(*) FILTER (WHERE last_contact >= NOW() - INTERVAL '10 minutes')::numeric
      / NULLIF(COUNT(*), 0) * 100, 1
    ) AS availability_pct
  FROM databases WHERE deleted_at IS NULL
  ```
- [ ] Afficher `availability_pct` (ex: "23%") comme valeur principale
- [ ] Afficher `total` en sous-texte ("99 bases")
- [ ] Couleur : vert > 80%, orange 50-80%, rouge < 50%

### 3.3 Agents disponibles (taux %)
- [ ] Même structure que 3.2, sur `agents` :
  ```sql
  SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE last_contact >= NOW() - INTERVAL '10 minutes') AS up_count,
    ROUND(
      COUNT(*) FILTER (WHERE last_contact >= NOW() - INTERVAL '10 minutes')::numeric
      / NULLIF(COUNT(*), 0) * 100, 1
    ) AS availability_pct
  FROM agents WHERE is_archived = false AND deleted_at IS NULL
  ```
- [ ] Afficher `availability_pct` + `total` ("99 agents")
- [ ] Même composant card réutilisé que 3.2

### 3.4 Backup ratio (ex : 34/67)
- [ ] Créer la requête (globale) :
  ```sql
  SELECT
    COUNT(*) FILTER (WHERE status = 'success')              AS success_count,
    COUNT(*) FILTER (WHERE status IN ('success','failed'))  AS total_count
  FROM backups WHERE deleted_at IS NULL
  ```
- [ ] Afficher `${success_count}/${total_count}` + badge `success_rate%`

---

## BLOC 4 — Dernières notifications (widget liste)

### 4.1 Requête et composant
- [ ] Appeler `getNotificationHistory({ limit: 5 })` **sans `organizationId`** (global)
- [ ] Créer composant `<RecentNotificationsList />` léger (pas le DataTable complet)
- [ ] Badge `level` coloré : critical=rouge, warning=orange, info=bleu
- [ ] Icône canal via `getChannelIcon(provider)` (existant)
- [ ] Temps relatif via `formatDistanceToNow` (existant dans `date-formatting.ts`)
- [ ] Lien cliquable vers DB/agent via `payload.id` :
  ```ts
  const href = event?.includes("agent")
    ? `/dashboard/agents/${targetId}`
    : `/dashboard/databases/${targetId}`;
  ```

---

## BLOC 5 — Treemap occupation volume

### 5.1 Option A — volume alltime par base (sans filtre canal)
- [ ] Lire depuis la vue matérialisée (`total_bytes` par `database_id`, global)
- [ ] Calculer `grand_total = SUM(total_bytes)` côté application
- [ ] Calculer `proportion = total_bytes / grand_total` pour chaque base
- [ ] Convertir en Go : `total_bytes / 1_073_741_824`
- [ ] Couleur par `dbms` (mapping constant : postgresql=bleu, mongodb=vert, redis=rouge…)
- [ ] Brancher `recharts Treemap` ou `@visx/hierarchy` avec les données
- [ ] Tooltip hover : taille totale, nb backups, date dernier backup

### 5.2 Option B — filtre par canal de stockage (si besoin UI)
- [ ] Ajouter une requête sur `backup_storage` (globale, sans filtre projet) :
  ```sql
  SELECT db.id, db.name, db.dbms, SUM(bs.size) AS total_bytes
  FROM backup_storage bs
  JOIN backups b    ON b.id  = bs.backup_id
  JOIN databases db ON db.id = b.database_id
  WHERE bs.status = 'success'
    AND bs.storage_channel_id = :channelId
  GROUP BY db.id, db.name, db.dbms
  ```
- [ ] Ajouter sélecteur de canal dans l'UI du treemap
- [ ] Brancher le filtre (re-fetch au changement de canal)
- [ ] Légende couleur DBMS en bas (annotation wireframe)

---

## BLOC 6 — Agent status

### 6.1 Agents DOWN actuellement
- [ ] Dériver de la requête KPI 3 (`down_count`) — déjà calculé en BLOC 3.3
- [ ] Afficher badge rouge si `down_count > 0`

### 6.2 Uptime % 12h par agent
- [ ] Charger les logs globaux des 12 dernières heures :
  ```sql
  SELECT object_id, kind, date, status FROM healthcheck_log
  WHERE kind = 'agent' AND date >= NOW() - INTERVAL '12 hours'
  ```
- [ ] Réutiliser la logique `buildTimeSeries` de `health-grid.tsx` côté serveur
- [ ] Calculer `uptime% = (healthy_buckets / 72) × 100` par agent

### 6.3 Uptime moyen global
- [ ] Dériver :
  ```ts
  const globalUptime = agents.reduce((s, a) => s + a.uptimePercent, 0) / agents.length;
  ```

### 6.4 Secondes depuis dernier contact
- [ ] `EXTRACT(EPOCH FROM (NOW() - last_contact))` par agent
- [ ] Afficher via `formatDateLastContact` (existant)

---

## BLOC 7 — Graphique évolution taille DB

### 7.1 Requête des données brutes (globale)
- [ ] Charger depuis `backups JOIN databases` (sans filtre org/projet) :
  ```sql
  SELECT b.database_id, db.name, b.file_size, b.created_at, b.updated_at
  FROM backups b JOIN databases db ON db.id = b.database_id
  WHERE b.status = 'success' AND b.deleted_at IS NULL AND b.file_size IS NOT NULL
  ORDER BY b.database_id, b.created_at ASC
  ```
- [ ] Si trop de bases : limiter aux 10 plus actives (`ORDER BY MAX(b.created_at) DESC LIMIT 10`)
- [ ] Grouper par `database_id` côté application

### 7.2 Calcul des points de courbe
- [ ] Pour chaque backup : `fileSizeMo = file_size / 1_048_576`
- [ ] Calculer `deltaMo = fileSizeMo_courant - fileSizeMo_precedent` (null pour le 1er)

### 7.3 Calcul des stats hover (tooltip)
- [ ] Par base :
  - `durationMinS` = MIN(`updated_at - created_at`)
  - `durationMaxS` = MAX(`updated_at - created_at`)
  - `durationAvgS` = AVG(`updated_at - created_at`)
  - `backupCount`  = COUNT (label "Si" dans le wireframe)
  - `growthPercent` = `((lastMo - firstMo) / firstMo) × 100`

### 7.4 Brancher le graphique
- [ ] Composant multi-lignes (`recharts LineChart`, une ligne par base)
- [ ] Tooltip custom : durée Min/Max/Moy + Si (nb backups) + croissance %
- [ ] Segment rouge si `deltaMo < 0` (purge détectée)
- [ ] Unité adaptative : Mo si toutes bases < 1 Go, sinon Go

---

## BLOC 8 — Durée moyenne des backups (radial chart)

### 8.1 Requête durées (depuis vue matérialisée)
- [ ] Lire `duration_min_s`, `duration_max_s`, `duration_avg_s` depuis `stats_backup_per_database`

### 8.2 Calcul moyenne globale
- [ ] `globalAvg = SUM(duration_avg_s) / COUNT(bases)`
- [ ] Marquer les bases au-dessus : `isAboveGlobalAvg = duration_avg_s > globalAvg`

### 8.3 Affichage
- [ ] Convertir secondes → `Xmin Ys` :
  ```ts
  const min = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  ```
- [ ] Brancher `GlowingRadialChart` avec données réelles
- [ ] Mettre en évidence les bases "lentes" (au-dessus de la moyenne)

---

## BLOC 9 — Colonne `completed_at` (optionnel, basse priorité)

> Améliore la précision des durées backup. Pas bloquant : `updated_at` est une approximation valide.

- [ ] Écrire la migration : `ALTER TABLE backups ADD COLUMN completed_at timestamp`
- [ ] Setter `completed_at = new Date()` dans le service de completion du backup
- [ ] Remplacer `updated_at - created_at` par `completed_at - created_at`
- [ ] Mettre à jour la vue matérialisée pour utiliser `completed_at`

---

## Ordre d'exécution recommandé

```
BLOC 0  →  BLOC 1  →  BLOC 2  →  BLOC 3  →  BLOC 4  →  BLOC 5  →  BLOC 6  →  BLOC 7  →  BLOC 8  →  (BLOC 9)
 Bugs       Index     Vue mat.    KPI cards   Notifs    Treemap    Agents     Courbes    Radial     optional
 < 1h       < 1h       ~2h          ~2h         ~2h       ~3h        ~2h        ~4h        ~2h
```

**Total estimé : ~18h de développement**
