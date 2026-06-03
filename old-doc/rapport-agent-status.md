# Rapport — Agent Status & Healthcheck

Analyse complète du système de monitoring d'agents et bases de données : fonctionnement actuel, calculs, anomalies détectées, métriques dashboard faisables.

---

## 1. Architecture actuelle

### Flux de données

```
Agent distant
    │
    │ ping périodique
    ▼
agents.last_contact  ──────────────────────────────┐
databases.last_contact                             │
    │                                              │
    ├─► ConnectionIndicator (UI temps réel)        │
    │                                              │
    └─► healthcheck_log (cron)                     │
             │                                     │
             ├─► HealthCheckGraph (grille 12h)     │
             └─► checkAgentsHealthError (alertes)  │
                      │                            │
                      └─► notification_log ◄───────┘
```

---

## 2. Tables impliquées

### `agents`

| Colonne | Type | Rôle dans le monitoring |
|---|---|---|
| `id` | uuid | identifiant |
| `last_contact` | timestamp | **dernière réception d'un ping** |
| `health_error_count` | integer | compteur d'alertes envoyées (0→3) |
| `is_archived` | boolean | exclusion des agents archivés |
| `organization_id` | uuid | scope org |

### `databases`

| Colonne | Type | Rôle dans le monitoring |
|---|---|---|
| `id` | uuid | identifiant |
| `last_contact` | timestamp | **dernière réception d'un ping** |
| `health_error_count` | integer | compteur d'alertes envoyées (0→3) |
| `agent_id` | uuid | via quel agent |
| `project_id` | uuid | scope org |

### `healthcheck_log`

| Colonne | Type | Rôle |
|---|---|---|
| `id` | uuid | identifiant |
| `kind` | enum `'database'\|'agent'` | type d'objet monitoré |
| `date` | timestamp | horodatage du check |
| `status` | enum `'success'\|'failed'` | résultat du check |
| `object_id` | uuid | ID de l'agent ou de la DB |
| `created_at` | timestamp | insertion en base |

> **Note** : `object_id` n'a pas de foreign key. Pas de cascade si l'agent est supprimé → logs orphelins jusqu'à la purge automatique 12h.

---

## 3. Logique de détection (cron `checkAgentsHealthError`)

### Seuil de détection

```
diffMinutes = (NOW - agent.last_contact) / 1000 / 60

if diffMinutes > 10:
    agent est considéré DOWN
```

### Throttle des notifications

```
if health_error_count < 3:
    health_error_count += 1
    envoyer notification
else:
    ne rien faire (silencieux)
```

Résultat : **maximum 3 notifications par incident**, puis silence total.

### Fréquence cron (env `HEALTHCHECK_CRON`)

| Env | Valeur par défaut | Fréquence |
|---|---|---|
| `development` | `* * * * *` | chaque minute |
| `production` | `0 * * * *` | **chaque heure** |

---

## 4. Anomalies identifiées

### ⚠️ Anomalie 1 — Délai de détection en production critique

**Problème** : cron toutes les heures + seuil à 10 min = délai réel jusqu'à 59 min.

```
Exemple :
  Agent tombe à 10h01
  Prochaine exécution du cron : 11h00
  Délai de détection : 59 minutes

Seuil configuré à 10 min → totalement ignoré en pratique.
```

**Fix recommandé** : passer `HEALTHCHECK_CRON` à `*/10 * * * *` en production (toutes les 10 min). Ou à `*/5 * * * *` pour une détection quasi-certaine dans le seuil.

---

### ⚠️ Anomalie 2 — `health_error_count` jamais remis à zéro

**Problème** : quand un agent revient en ligne, `health_error_count` reste à sa valeur précédente. Au prochain incident, le compteur repart de là → moins de 3 notifications, voire 0.

```
Exemple :
  Incident 1 → health_error_count = 3 (3 notifications envoyées)
  Agent revient en ligne
  Incident 2 → health_error_count est toujours 3 → 0 notification envoyée
```

**Fix recommandé** : dans la logique de mise à jour de `last_contact` (quand l'agent ping), remettre `health_error_count = 0`.

```ts
// Quand l'agent envoie un ping
await db.update(agent)
  .set({
    lastContact: new Date(),
    healthErrorCount: 0,   // ← reset ici
  })
  .where(eq(agent.id, agentId));
```

---

### ⚠️ Anomalie 3 — Incohérence ConnectionIndicator vs seuil de détection

**Problème** : `ConnectionIndicator` passe rouge dès **> 60 secondes** sans contact, mais le cron déclare l'agent DOWN seulement après **> 10 minutes**. L'UI montre rouge bien avant que l'alerte parte.

```
ConnectionIndicator :
  < 55s  → vert
  55-60s → orange
  > 60s  → rouge ← alerte visuelle immédiate

checkAgentsHealthError :
  > 10 min → alerte réelle
```

Ce n'est pas forcément un bug (l'UI est plus sensible), mais il faut documenter cette différence pour ne pas créer de confusion utilisateur ("rouge depuis 3 min mais pas encore de notification").

---

## 5. Grille de santé `HealthCheckGraph`

### Paramètres

```
WINDOW_HOURS     = 12   → fenêtre affichée
INTERVAL_MINUTES = 10   → taille d'un bucket

Nombre de buckets = (12 × 60) / 10 = 72 cases
```

### Construction des buckets

Pour chaque bucket `[start, start + 10min[` :

1. Filtrer les logs dont `date ∈ [start, end[`
2. Si aucun log ET antérieur au premier log connu → `unknown`
3. Si aucun log ET postérieur au premier log connu → `down`
4. Si logs : success seul → `healthy`, failed seul → `down`, les deux → `degraded`

### Calcul uptime %

```
uptime% = (buckets en status "healthy" / 72) × 100
```

> **Limitation** : seuls les buckets `healthy` comptent. `degraded` compte comme non-uptime. Discutable selon la définition SLA.

### Purge automatique des logs

`deleteHealthLogsOlderThan12h` tourne via `CLEANING_HEALTHCHECK_LOGS_CRON` (prod: `0 * * * *`).

```
Rétention réelle = max(12h, délai entre deux exécutions du cron)
En prod par défaut = jusqu'à 13h de logs possibles (cron toutes les heures)
```

---

## 6. Métriques dashboard faisables

### 6.1 — Agents DOWN actuellement

**Source** : `agents.last_contact`

**Calcul** :

```sql
SELECT COUNT(*)
FROM agents
WHERE last_contact IS NOT NULL
  AND last_contact < NOW() - INTERVAL '10 minutes'
  AND is_archived = false
  AND organization_id IN (/* ids org user */)
```

**Faisabilité** : ✅

---

### 6.2 — Uptime % par agent (12h)

**Source** : `healthcheck_log`

**Calcul** (identique à `HealthCheckGraph`, version SQL) :

```sql
-- Nombre de buckets de 10 min sur 12h = 72
-- Pour chaque agent : proportion de buckets avec au moins un 'success'

SELECT
    object_id                                   AS agent_id,
    COUNT(DISTINCT date_trunc('10 minutes', date)) FILTER (
        WHERE status = 'success'
    )                                           AS healthy_buckets,
    72                                          AS total_buckets,
    ROUND(
        COUNT(DISTINCT date_trunc('10 minutes', date)) FILTER (
            WHERE status = 'success'
        )::numeric / 72 * 100,
    1)                                          AS uptime_percent
FROM healthcheck_log
WHERE kind      = 'agent'
  AND date      >= NOW() - INTERVAL '12 hours'
  AND object_id IN (/* ids agents de l'org */)
GROUP BY object_id;
```

> **Note SQL** : `date_trunc` arrondi à 10 min nécessite une fonction custom ou un calcul :
> `date_trunc('hour', date) + INTERVAL '10 min' * FLOOR(EXTRACT(min FROM date) / 10)`

**Faisabilité** : ✅ (calcul applicatif plus simple que SQL pur)

---

### 6.3 — Uptime moyen global (toutes bases / tous agents)

**Calcul applicatif** :

```ts
const globalUptime =
  agents.reduce((sum, a) => sum + a.uptimePercent, 0) / agents.length;
```

**Faisabilité** : ✅

---

### 6.4 — Nombre d'incidents (alertes) par agent sur 7 jours

**Source** : `notification_log`

```sql
SELECT
    (payload->>'id')::uuid   AS agent_id,
    COUNT(*)                  AS incident_count
FROM notification_log
WHERE event       = 'error_health_agent'
  AND sent_at     >= NOW() - INTERVAL '7 days'
  AND organization_id IN (/* ids org */)
GROUP BY payload->>'id';
```

**Faisabilité** : ⚠️ Dépend de la structure du champ `payload` (jsonb). L'ID de l'agent est dans `payload.id` d'après `checkAgentsHealthError`.

---

### 6.5 — Temps depuis le dernier contact (par agent)

**Calcul** :

```sql
SELECT
    id,
    name,
    last_contact,
    EXTRACT(EPOCH FROM (NOW() - last_contact)) AS seconds_since_contact
FROM agents
WHERE is_archived = false
  AND organization_id IN (/* ids org */)
ORDER BY seconds_since_contact DESC;
```

**Faisabilité** : ✅

---

## 7. Structure de données dashboard

```ts
type AgentStatusSummary = {
  agentId: string;
  agentName: string;
  isDown: boolean;                  // last_contact > 10 min
  secondsSinceContact: number;
  uptimePercent12h: number;         // 0-100
  healthErrorCount: number;         // 0-3
  databaseCount: number;
};

type AgentStatusDashboard = {
  agents: AgentStatusSummary[];
  downCount: number;                // agents actuellement DOWN
  totalCount: number;
  globalUptime12h: number;          // moyenne des uptimePercent
};
```

---

## 8. Résumé faisabilité

| Métrique | Source | Faisable | Remarque |
|---|---|---|---|
| Agents DOWN actuellement | `agents.last_contact` | ✅ | seuil 10 min |
| Uptime % 12h par agent | `healthcheck_log` | ✅ | calcul applicatif recommandé |
| Uptime moyen global | dérivé | ✅ | moyenne des uptime% |
| Alertes par agent (7j) | `notification_log.payload` | ⚠️ | dépend structure payload jsonb |
| Secondes depuis dernier contact | `agents.last_contact` | ✅ | trivial |
| Grille 72 buckets (existante) | `healthcheck_log` | ✅ | déjà implémenté côté DB page |

---

## 9. Corrections prioritaires recommandées

| Priorité | Problème | Impact | Fix |
|---|---|---|---|
| 🔴 Haute | `HEALTHCHECK_CRON` prod = 1h, seuil = 10 min | Agent down 59 min sans alerte | Passer à `*/10 * * * *` |
| 🔴 Haute | `health_error_count` jamais resetté | Silencieux après 3 incidents | Reset à 0 sur chaque ping |
| 🟡 Moyenne | ConnectionIndicator rouge dès 60s, alerte à 10 min | Confusion UX | Documenter ou aligner les seuils |
| 🟢 Basse | `object_id` sans FK dans `healthcheck_log` | Logs orphelins (inoffensif, purge 12h) | Pas urgent |
