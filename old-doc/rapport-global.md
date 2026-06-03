# Rapport Global — Dashboard KPI & Stats

Synthèse de 6 rapports d'analyse. Couvre : périmètre, calculs détaillés, colonnes exactes, faisabilité, bugs actifs, performance, plan d'implémentation.

---

## 1. Périmètre analysé

| Widget / Fonctionnalité | Rapport source |
|---|---|
| 4 cartes KPI du haut | `rapport-kpi-cards.md` |
| Graphique évolution taille DB | `rapport-evolution-taille-db.md` |
| Durée moyenne des backups | `rapport-moyenne-temps-backup.md` |
| Treemap occupation volume | `rapport-treemap-occupation-volume.md` |
| Agent status & healthcheck | `rapport-agent-status.md` |
| Stratégie cache & performance | `rapport-performance-stats.md` |

---

## 2. Tableau global de faisabilité

| # | Métrique / Widget | Faisable | Colonnes manquantes | Dépendances |
|---|---|---|---|---|
| 1 | Alertes 24h (KPI card) | ✅ | aucune | `notification_log` |
| 2 | Bases installées (KPI card) | ✅ | aucune | `databases` |
| 3 | Agents installés (KPI card) | ✅ | aucune | `agents` |
| 4 | Backup ratio 34/67 (KPI card) | ✅ | aucune | `backups.status` |
| 5 | Courbe évolution taille DB | ✅ | aucune | `backups.file_size` + `created_at` |
| 6 | Delta entre backups (purge/growth) | ✅ | aucune | calcul applicatif sur (5) |
| 7 | Hover stats (min/max/growth%) | ✅ | aucune | agrégats sur (5) |
| 8 | Durée min/max/avg par base | ⚠️ approx | `completed_at` manquant | `updated_at - created_at` |
| 9 | Moyenne globale durée | ✅ | aucune | dérivé de (8) |
| 10 | Bases "plus lentes que la normale" | ✅ | aucune | dérivé de (8) et (9) |
| 11 | Treemap volume alltime par base | ✅ | aucune | `SUM(backups.file_size)` |
| 12 | Treemap filtre par canal stockage | ✅ | aucune | `backup_storage.size` + `storage_channel_id` |
| 13 | Agents DOWN actuellement | ✅ | aucune | `agents.last_contact` |
| 14 | Uptime % 12h par agent | ✅ | aucune | `healthcheck_log` |
| 15 | Uptime moyen global | ✅ | aucune | dérivé de (14) |
| 16 | Incidents par agent (7j) | ⚠️ partiel | aucune | `notification_log.payload` jsonb non garanti |
| 17 | Secondes depuis dernier contact | ✅ | aucune | `agents.last_contact` |

**Verdict** : 15/17 métriques faisables sans migration. 1 approximation acceptable (#8). 1 incertitude sur structure jsonb (#16).

---

## 3. Détail des calculs par widget

---

### 3.1 Carte — Alertes 24h

```
SOURCE : notification_log
FILTRE : sent_at >= NOW() - INTERVAL '24 hours'
         AND organization_id IN (org_ids)
CALCUL : COUNT(*)
UNITÉ  : entier
```

| Colonne | Table | Rôle |
|---|---|---|
| `sent_at` | `notification_log` | filtre 24h |
| `organization_id` | `notification_log` | scope org |
| `success` | `notification_log` | optionnel : filtrer succès uniquement |
| `level` | `notification_log` | optionnel : filtrer critical/warning/info |

---

### 3.2 Carte — Bases de données installées

```
SOURCE : databases
FILTRE : project_id IN (project_ids)
         AND deleted_at IS NULL
CALCUL : COUNT(*)
UNITÉ  : entier
```

| Colonne | Table | Rôle |
|---|---|---|
| `project_id` | `databases` | filtre org (via projects) |
| `deleted_at` | `databases` | exclure supprimées |

---

### 3.3 Carte — Agents installés

```
SOURCE : agents
FILTRE : organization_id IN (org_ids)
         AND is_archived = false
         AND deleted_at IS NULL
CALCUL : COUNT(*)
UNITÉ  : entier
```

| Colonne | Table | Rôle |
|---|---|---|
| `organization_id` | `agents` | scope org |
| `is_archived` | `agents` | exclure archivés |
| `deleted_at` | `agents` | exclure supprimés |

---

### 3.4 Carte — Backup ratio (ex : 34/67)

```
SOURCE  : backups
FILTRE  : database_id IN (database_ids)
          AND status IN ('success', 'failed')
          AND deleted_at IS NULL
CALCUL  :
  success_count = COUNT(*) WHERE status = 'success'
  total_count   = COUNT(*) WHERE status IN ('success', 'failed')
  affichage     = "success_count / total_count"
```

> Exclure `'waiting'` et `'ongoing'` du dénominateur : backups non terminés.

| Colonne | Table | Rôle |
|---|---|---|
| `database_id` | `backups` | jointure → filtre org |
| `status` | `backups` | numérateur (`success`) + dénominateur (`success`+`failed`) |
| `deleted_at` | `backups` | exclure supprimés |

---

### 3.5 Graphique — Évolution taille DB (courbes multi-bases)

```
SOURCE  : backups JOIN databases
FILTRE  : status = 'success'
          AND deleted_at IS NULL
          AND project_id IN (project_ids)
CALCUL  : pour chaque backup, un point (date, taille_mo)
          trié par created_at ASC par database_id
```

**Point de courbe :**
```
date      = backups.created_at
taille_mo = backups.file_size / 1_048_576
```

**Delta entre backups consécutifs :**
```
delta_mo = taille_courant_mo - taille_precedent_mo
  > 0 → croissance
  < 0 → purge / réduction
  = 0 → stable
```

**Stats hover par base :**

| Stat | Formule |
|---|---|
| Taille initiale | `file_size` du backup le plus ancien |
| Taille actuelle | `file_size` du backup le plus récent |
| Min | `MIN(file_size) / 1_048_576` |
| Max | `MAX(file_size) / 1_048_576` |
| Croissance totale % | `((last - first) / first) × 100` |
| Croissance moy/backup | `(last - first) / (nb_backups - 1)` |
| Nb backups | `COUNT(*)` |

**Exemple (prod-main, 9 backups, 10,20 Mo → 16,20 Mo) :**
```
Croissance totale  = ((16,20 - 10,20) / 10,20) × 100 = +58,8 %
Croissance moyenne = (16,20 - 10,20) / 8 = +0,75 Mo/backup
```

| Colonne | Table | Rôle |
|---|---|---|
| `database_id` | `backups` | grouper par base |
| `file_size` | `backups` | valeur Y du graphique (bigint, octets) |
| `created_at` | `backups` | valeur X du graphique (axe temps) |
| `status` | `backups` | filtre `= 'success'` |
| `deleted_at` | `backups` | filtre `IS NULL` |
| `id` | `databases` | jointure |
| `name` | `databases` | label de courbe |
| `project_id` | `databases` | scope org |

**Conversion unités :**
```
octets → Mo : / 1_048_576
octets → Go : / 1_073_741_824
Règle : Mo si < 1 Go, sinon Go
```

---

### 3.6 Durée moyenne des backups (radial chart / hover)

```
SOURCE  : backups JOIN databases
FILTRE  : status = 'success'
          AND updated_at IS NOT NULL
          AND deleted_at IS NULL
          AND project_id IN (project_ids)
CALCUL  : durée = updated_at - created_at (en secondes)
```

**⚠️ APPROXIMATION** : `updated_at` = dernière modification de la ligne, pas un `completed_at` dédié. Fiable tant que la ligne n'est pas modifiée après la complétion du backup pour une autre raison.

**Par base :**

| Stat | Formule SQL |
|---|---|
| Durée min | `MIN(EXTRACT(EPOCH FROM (updated_at - created_at)))` |
| Durée max | `MAX(EXTRACT(EPOCH FROM (updated_at - created_at)))` |
| Durée moy | `AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))` |
| Nb backups | `COUNT(*)` |

**Exemple (prod-main : 75s, 102s, 58s) :**
```
Somme    = 75 + 102 + 58 = 235s
Moyenne  = 235 / 3 = 78s (1min 18s)
Min      = 58s
Max      = 102s
```

**Moyenne globale :**
```
moy_globale = SUM(moy_par_base) / COUNT(bases)

Exemple : (78 + 269 + 36 + 498 + 132) / 5 = 203s (3min 23s)

Base "lente" = moy_base > moy_globale
→ logs-store (498s) et analytics (269s) au-dessus
```

| Colonne | Table | Rôle |
|---|---|---|
| `created_at` | `backups` | heure de départ |
| `updated_at` | `backups` | heure de fin (approximation) |
| `status` | `backups` | filtre `= 'success'` |
| `database_id` | `backups` | grouper |
| `deleted_at` | `backups` | filtre `IS NULL` |

**Colonne manquante recommandée :**
```sql
ALTER TABLE backups ADD COLUMN completed_at timestamp;
-- À setter quand status passe à 'success' ou 'failed'
```

---

### 3.7 Treemap — Occupation volume par base

```
SOURCE  : backups JOIN databases
FILTRE  : status = 'success'
          AND file_size IS NOT NULL
          AND deleted_at IS NULL
          AND project_id IN (project_ids)
CALCUL  : SUM(file_size) par database_id = volume alltime
```

> La somme alltime (tous les .dmp conservés) ≠ dernière taille connue.
> Alltime = espace disque physiquement occupé par l'historique complet.

**Par base :**
```
total_bytes(db) = SUM(backups.file_size) WHERE database_id = db.id
```

**Total global :**
```
total_global = SUM(total_bytes pour toutes les bases)
```

**Proportion treemap :**
```
proportion(db) = total_bytes(db) / total_global
surface de la case ∝ proportion
```

**Exemple :**
```
prod-main  : 120,23 Go  → proportion = 120,23 / 476,87 = 25,2 %
analytics  :  57,30 Go  → proportion = 12,0 %
users-db   :   3,21 Go  → proportion =  0,7 %
logs-store : 224,85 Go  → proportion = 47,2 %
reporting  :  71,28 Go  → proportion = 15,0 %
Total      : 476,87 Go
```

**Option B — filtre par canal de stockage :**
```sql
-- Utiliser backup_storage.size au lieu de backups.file_size
-- Filtrer sur backup_storage.storage_channel_id
-- ⚠️ risque double-comptage si backup sur S3 + local
```

| Colonne | Table | Rôle |
|---|---|---|
| `file_size` | `backups` | valeur agrégée (Option A) |
| `database_id` | `backups` | grouper |
| `status` | `backups` | filtre `= 'success'` |
| `deleted_at` | `backups` | filtre `IS NULL` |
| `name` | `databases` | label treemap |
| `project_id` | `databases` | scope org |
| `size` | `backup_storage` | valeur agrégée (Option B) |
| `storage_channel_id` | `backup_storage` | filtre par canal (Option B) |

---

### 3.8 Agent Status — Métriques dashboard

#### 3.8.1 Agents DOWN actuellement

```
SOURCE  : agents
FILTRE  : last_contact IS NOT NULL
          AND last_contact < NOW() - INTERVAL '10 minutes'
          AND is_archived = false
          AND organization_id IN (org_ids)
CALCUL  : COUNT(*)
```

#### 3.8.2 Uptime % par agent (12h)

```
SOURCE  : healthcheck_log
FENÊTRE : 12 heures
BUCKETS : 72 (1 bucket = 10 min)

Pour chaque agent :
  healthy_buckets = COUNT(DISTINCT bucket) WHERE status = 'success'
  uptime%         = (healthy_buckets / 72) × 100
```

**Bucket = arrondi à 10 min :**
```sql
date_trunc('hour', date) + INTERVAL '10 min' * FLOOR(EXTRACT(min FROM date) / 10)
```

**États par bucket :**
```
success seul  → healthy
failed seul   → down
les deux      → degraded
aucun log     → unknown (si antérieur au 1er log) ou down (si postérieur)
```

> `degraded` = non-uptime dans le calcul actuel. Ajustable selon définition SLA.

#### 3.8.3 Uptime moyen global

```
global_uptime = SUM(uptime_par_agent) / COUNT(agents)
```

| Colonne | Table | Rôle |
|---|---|---|
| `last_contact` | `agents` | seuil DOWN (10 min) |
| `health_error_count` | `agents` | compteur alertes envoyées |
| `is_archived` | `agents` | exclusion |
| `organization_id` | `agents` | scope org |
| `kind` | `healthcheck_log` | filtre `= 'agent'` ou `= 'database'` |
| `date` | `healthcheck_log` | fenêtre 12h + bucketing |
| `status` | `healthcheck_log` | `success` / `failed` |
| `object_id` | `healthcheck_log` | lien agent/db |

---

## 4. Colonnes manquantes — migrations requises

| # | Colonne | Table | Type | Raison |
|---|---|---|---|---|
| M1 | `completed_at` | `backups` | `timestamp` | Mesurer durée précise sans dépendre de `updated_at` |

**Priorité M1 : moyenne.** L'approximation `updated_at` fonctionne en pratique. Ajouter si précision requise.

**Migration minimale :**
```sql
ALTER TABLE backups ADD COLUMN completed_at timestamp;
```

**Setter dans l'app :**
```ts
// Quand backup passe à 'success' ou 'failed'
await db.update(backup)
  .set({ status: "success", completedAt: new Date(), updatedAt: new Date() })
  .where(eq(backup.id, id));
```

---

## 5. Bugs actifs (agent-status)

### BUG 1 — Délai de détection critique en production

**Sévérité : 🔴 Haute**

```
HEALTHCHECK_CRON production = "0 * * * *"  (toutes les heures)
Seuil de détection           = 10 minutes

→ Délai réel de détection : jusqu'à 59 minutes
→ Le seuil de 10 min est inutile en prod
```

**Fix :**
```
# .env production
HEALTHCHECK_CRON=*/10 * * * *
```

---

### BUG 2 — `health_error_count` jamais remis à zéro

**Sévérité : 🔴 Haute**

```
Incident 1 → health_error_count = 3 → 3 notifications envoyées
Agent revient en ligne
Incident 2 → health_error_count toujours = 3 → 0 notification envoyée
             L'agent peut tomber indéfiniment sans alerte
```

**Fix (dans la logique de ping de l'agent) :**
```ts
await db.update(agent)
  .set({ lastContact: new Date(), healthErrorCount: 0 })
  .where(eq(agent.id, agentId));
```

---

### BUG 3 — Incohérence UI / seuil alerte

**Sévérité : 🟡 Moyenne**

```
ConnectionIndicator passe rouge à :  > 60 secondes
Alerte envoyée à :                   > 10 minutes

→ L'utilisateur voit rouge pendant 9+ minutes sans notification
```

**Options :**
- Documenter ("rouge = connexion instable, alerte = agent down > 10 min")
- Ou aligner : rendre le seuil UI configurable depuis l'env

---

### Note — `healthcheck_log.object_id` sans FK

**Sévérité : 🟢 Basse**

Pas de cascade sur suppression d'agent/DB. Logs orphelins possibles. Inoffensif car purge automatique à 12h.

---

## 6. Stratégie performance

### Situation actuelle

Aucun cache, aucun pré-calcul. Toutes les stats recalculées à chaque visite. Sur < 10 000 lignes par org → acceptable, mais scalera mal.

### Index indispensables (à créer maintenant, sans migration Drizzle complexe)

```sql
-- Accélère tous les agrégats backup par base + status
CREATE INDEX idx_backups_database_status
  ON backups (database_id, status)
  INCLUDE (file_size, created_at, updated_at)
  WHERE deleted_at IS NULL;

-- Accélère le filtre par projet
CREATE INDEX idx_databases_project_id
  ON databases (project_id)
  WHERE deleted_at IS NULL;

-- Accélère les requêtes agent-status
CREATE INDEX idx_healthcheck_log_object_date
  ON healthcheck_log (object_id, kind, date);
```

### Plan de cache par phase

`unstable_cache` Next.js écarté : cache mémoire process, perdu au redémarrage, non fiable multi-instances.

| Phase | Quand | Solution | Effort | Vitesse dashboard |
|---|---|---|---|---|
| **1** | Maintenant | Vue matérialisée PostgreSQL | 1 migration SQL | < 1 ms |
| **2** | SLA strict / purge fréquente | Table `database_stats` event-driven | Migration + logique métier | < 1 ms, temps réel |

**Vue matérialisée (Phase 1) — couvre 7 métriques en 1 requête :**
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
    MIN(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)))       AS duration_min_s,
    MAX(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)))       AS duration_max_s,
    AVG(EXTRACT(EPOCH FROM (b.updated_at - b.created_at)))       AS duration_avg_s,
    MAX(b.created_at)                                            AS last_backup_at,
    MIN(b.created_at)                                            AS first_backup_at
FROM backups b
JOIN databases db ON db.id = b.database_id
WHERE b.status = 'success' AND b.deleted_at IS NULL AND b.file_size IS NOT NULL
GROUP BY b.database_id, db.name, db.project_id
WITH DATA;

CREATE UNIQUE INDEX ON stats_backup_per_database (database_id);
CREATE INDEX ON stats_backup_per_database (project_id);
```

---

## 7. Plan d'implémentation recommandé

### Priorité 1 — Bugs critiques (avant toute nouvelle feature)

| Tâche | Fichier | Effort |
|---|---|---|
| Corriger `HEALTHCHECK_CRON` prod | `src/env.mjs` + `.env` | < 5 min |
| Reset `health_error_count` sur ping | `src/db/services/healthcheck.ts` + route agent ping | < 30 min |

---

### Priorité 2 — Index PostgreSQL (zéro code, 0 migration Drizzle)

```sql
-- À exécuter directement en DB ou via migration SQL brute
CREATE INDEX CONCURRENTLY idx_backups_database_status ...
CREATE INDEX CONCURRENTLY idx_databases_project_id ...
CREATE INDEX CONCURRENTLY idx_healthcheck_log_object_date ...
```

Effort : < 15 min. Impact : toutes les requêtes stats accélérées immédiatement.

---

### Priorité 3 — Vue matérialisée PostgreSQL (Phase 1 cache)

1 migration SQL. Refresh déclenché après chaque backup `success`. Couvre tous les agrégats KPI en 1 SELECT.  
Effort : ~2h (migration + refresh dans le service de completion).

---

### Priorité 4 — Widgets dashboard (features)

Ordre recommandé selon effort vs valeur :

| # | Widget | Effort | Valeur |
|---|---|---|---|
| 1 | 4 cartes KPI | Faible | Haute (visible, simple) |
| 2 | Treemap volume (Option A) | Faible | Haute (1 requête SQL) |
| 3 | Agents DOWN / uptime | Moyen | Haute (sécurité) |
| 4 | Évolution taille DB (courbes) | Moyen | Haute (principal graphique) |
| 5 | Durée backups (radial) | Moyen | Moyenne |
| 6 | Vue matérialisée (Phase 1 cache) | Faible (1 migration SQL) | Haute (performance) |
| 7 | Treemap filtre par canal (Option B) | Faible | Moyenne |
| 8 | Migration `completed_at` | Faible | Basse (améliore précision #5) |

---

## 8. Vue d'ensemble des sources de données

```
backups
  ├── file_size        → évolution taille (3.5), treemap (3.7)
  ├── created_at       → axe X graphique, durée départ (3.6)
  ├── updated_at       → durée fin (approx) (3.6)
  ├── status           → ratio KPI (3.4), filtres partout
  └── database_id      → jointure → databases → projects → orgs

databases
  ├── name             → labels graphiques
  ├── project_id       → scope org
  ├── last_contact     → agent status
  └── health_error_count → alertes envoyées

agents
  ├── last_contact     → seuil DOWN, seconds_since_contact
  ├── health_error_count → throttle alertes (BUG : jamais resetté)
  ├── is_archived      → exclusion
  └── organization_id  → scope org

healthcheck_log
  ├── kind             → 'agent' | 'database'
  ├── date             → bucketing 10min, fenêtre 12h
  ├── status           → healthy/down/degraded
  └── object_id        → lien vers agent ou DB (sans FK !)

notification_log
  ├── sent_at          → filtre 24h (KPI alertes)
  ├── organization_id  → scope org
  ├── event            → type d'alerte ('error_health_agent', etc.)
  └── payload          → jsonb avec agent.id (structure non garantie)

backup_storage
  ├── size             → treemap Option B (volume physique par canal)
  ├── backup_id        → jointure → backups
  └── storage_channel_id → filtre par canal
```

---

## 9. Ce qui ne nécessite PAS de migration Drizzle

- Toutes les métriques KPI (4 cartes)
- Graphique évolution taille (courbes)
- Treemap Option A
- Agent status (DOWN, uptime, seconds_since_contact)
- Tous les index (créables hors Drizzle)
- Vue matérialisée Phase 2 (migration SQL brute possible)

## Ce qui nécessite une migration

| Migration | Urgence | Impact |
|---|---|---|
| `backups.completed_at` | Faible | Durée précise (actuellement approx OK) |
| Index (3 créations) | Haute | Performance immédiate |
| Vue matérialisée `stats_backup_per_database` | Moyenne | Performance dashboard |
