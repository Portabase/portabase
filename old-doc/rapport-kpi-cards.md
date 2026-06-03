# Rapport — Cartes KPI du Dashboard

Référence : wireframe `dashboard.png` (rangée du haut : 4 cartes)

---

## 1. Alertes 24h

**Objectif** : compter les alertes déclenchées dans les dernières 24 heures.

**Table source** : `notification_log`

| Colonne | Usage |
|---|---|
| `notification_log.sent_at` | filtre `>= NOW() - INTERVAL '24 hours'` |
| `notification_log.organization_id` | filtre sur les orgs de l'utilisateur |
| `notification_log.success` | optionnel : ne compter que les envois réussis |
| `notification_log.level` | optionnel : affiner par `critical` / `warning` / `info` |

**Calcul** :

```
COUNT(*)
FROM notification_log
WHERE sent_at >= NOW() - INTERVAL '24 hours'
  AND organization_id IN (ids_de_l_utilisateur)
```

**Faisabilité** : ✅ Toutes les colonnes existent.

**Note** : le PNG précise "seulement les alertes déclenchées dans les 24h" → pas de filtre sur `success`, on compte toutes les notifications envoyées (succès ET échec).

---

## 2. Bases de données installées

**Objectif** : nombre total de bases de données rattachées aux projets de l'utilisateur.

**Table source** : `databases`

| Colonne | Usage |
|---|---|
| `databases.project_id` | JOIN → `projects.organization_id` → filtre org |
| `databases.deleted_at` | filtre `IS NULL` (non supprimées) |

**Calcul** :

```
COUNT(*)
FROM databases
WHERE project_id IN (ids_des_projets_de_l_utilisateur)
  AND deleted_at IS NULL
```

**Faisabilité** : ✅

---

## 3. Agents installés

**Objectif** : nombre d'agents actifs de l'organisation.

**Table source** : `agents`

| Colonne | Usage |
|---|---|
| `agents.organization_id` | filtre sur l'org de l'utilisateur |
| `agents.is_archived` | filtre `= false` |
| `agents.deleted_at` | filtre `IS NULL` |

**Calcul** :

```
COUNT(*)
FROM agents
WHERE organization_id IN (ids_orgs_utilisateur)
  AND is_archived = false
  AND deleted_at IS NULL
```

**Faisabilité** : ✅

---

## 4. Backup (ex : 34/67)

**Objectif** : ratio `backups réussis / total backups` (hors statuts intermédiaires).

**Table source** : `backups`

| Colonne | Usage |
|---|---|
| `backups.database_id` | JOIN → `databases.project_id` → filtre org |
| `backups.status` | `'success'` / `'failed'` / `'waiting'` / `'ongoing'` |
| `backups.deleted_at` | filtre `IS NULL` |

**Calcul** :

```
-- Numérateur : backups terminés avec succès
success_count = COUNT(*) WHERE status = 'success'

-- Dénominateur : tous les backups terminés (succès + échec)
total_count   = COUNT(*) WHERE status IN ('success', 'failed')

-- Affichage : success_count / total_count  →  "34/67"
```

Exclure `'waiting'` et `'ongoing'` du dénominateur : ce sont des backups en cours, pas encore terminés.

**Faisabilité** : ✅

---

## Résumé faisabilité

| Carte | Faisable | Colonnes clés |
|---|---|---|
| Alertes 24h | ✅ | `notification_log.sent_at`, `organization_id` |
| Bases installées | ✅ | `databases.project_id`, `deleted_at` |
| Agents installés | ✅ | `agents.organization_id`, `is_archived` |
| Backup ratio | ✅ | `backups.status`, `database_id` |
