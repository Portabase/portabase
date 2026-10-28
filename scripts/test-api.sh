#!/usr/bin/env bash
set -uo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/test-api.sh [-h]
       scripts/test-api.sh --cleanup <run-id>

End-to-end validation of the Portabase API v1 and MCP server on a dev or test instance.
Builds a sandbox (organization, projects, agents, and databases seeded through SQL), calls every
OpenAPI operation with two keys, checks the access rules, runs the MCP tools when MCP is enabled,
then removes the sandbox. Existing data is only read. With KEEP_DATA=1 the sandbox stays so it can be
inspected in the dashboard; --cleanup <run-id> removes it later.

Environment:
  ADMIN_KEY       API key of an instance admin or superadmin (required)
  ORG_ADMIN_KEY   API key of a non-admin user who is owner or admin of ORG_ID (required)
  ORG_ID          organization where the ORG_ADMIN_KEY user is owner or admin (required)
  BASE_URL        dashboard URL (default: http://localhost:8887)
  PSQL_CMD        command that runs SQL read from stdin (default: psql in the portabase-dev-db-1 container)
  UPLOADS_DIR     dashboard local storage directory (default: <repo>/private/uploads)
  ALLOW_REMOTE=1  allow a BASE_URL that is not localhost
  KEEP_DATA=1     keep the sandbox at the end (deletes are then tested on throwaway copies)

A run makes about 200 requests per key; API keys allow 1000 requests per hour by default.
Requires curl and jq. Exit code: 0 when every check passes, 1 on failures, 2 on a setup error.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then usage; exit 0; fi

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${BASE_URL:-http://localhost:8887}"
BASE_URL="${BASE_URL%/}"
DEFAULT_PSQL='docker exec -i portabase-dev-db-1 sh -c '"'"'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1 -q'"'"
PSQL_CMD="${PSQL_CMD:-$DEFAULT_PSQL}"
UPLOADS_DIR="${UPLOADS_DIR:-$REPO/private/uploads}"
RUN="api-test-$(date +%s)"
TMP="$(mktemp -d)"

PASSED=0; FAILED=0; SKIPPED=0
CALLED=()
ORGS=(); PROJECTS=(); AGENTS=(); DATABASES=()

die() { echo "ERROR: $*" >&2; rm -rf "$TMP"; exit 2; }
pass() { PASSED=$((PASSED + 1)); echo "  PASS $*"; }
fail() { FAILED=$((FAILED + 1)); echo "  FAIL $*"; }
skip() { SKIPPED=$((SKIPPED + 1)); echo "  SKIP $*"; }
section() { echo; echo "== $*"; }
same() { [[ "$1" == "$2" ]] && pass "$3" || fail "$3 (expected '$1', got '$2')"; }
sql() { eval "$PSQL_CMD" <<<"$1"; }
new_id() { sql "select gen_random_uuid();"; }
data_id() { jq -r '.data.id // empty' <<<"$RESP_BODY"; }

for tool in curl jq; do command -v "$tool" >/dev/null || die "$tool is required"; done

req() {
  local method=$1 path=$2 key=$3 body=${4-}
  local args=(-s -m 60 -o "$TMP/body" -w '%{http_code}' -X "$method" "$BASE_URL$path")
  [[ -n "$key" ]] && args+=(-H "x-api-key: $key")
  [[ -n "$body" ]] && args+=(-H 'Content-Type: application/json' --data "$body")
  RESP_CODE="$(curl "${args[@]}")"
  RESP_BODY="$(cat "$TMP/body")"
  if [[ "$RESP_CODE" == "429" ]]; then
    die "an API key hit its rate limit; retry in $(jq -r '((.details.tryAgainIn // 0) / 60000) | ceil' <<<"$RESP_BODY") min or raise the key's limit"
  fi
  CALLED+=("$method $(sed -E 's#\?.*##; s#/[0-9a-fA-F-]{36}#/*#g; s#/not-a-uuid#/*#g' <<<"$path")")
}
expect() {
  local who=$1 method=$2 path=$3 key=$4 code=$5 body=${6-}
  req "$method" "$path" "$key" "$body"
  if [[ " $code " == *" $RESP_CODE "* ]]; then pass "[$who] $method $path -> $RESP_CODE"
  else fail "[$who] $method $path expected $code, got $RESP_CODE $(head -c 200 <<<"$RESP_BODY")"; fi
}
expect_error() {
  local who=$1 method=$2 path=$3 key=$4 code=$5 message=$6 body=${7-}
  req "$method" "$path" "$key" "$body"
  if [[ "$RESP_CODE" == "$code" ]] && jq -e --arg m "$message" '.error | contains($m)' >/dev/null 2>&1 <<<"$RESP_BODY"; then
    pass "[$who] $method $path -> $code \"$message\""
  else fail "[$who] $method $path expected $code \"$message\", got $RESP_CODE $(head -c 200 <<<"$RESP_BODY")"; fi
}
expect_jq() {
  local who=$1 method=$2 path=$3 key=$4 filter=$5 body=${6-}
  req "$method" "$path" "$key" "$body"
  if jq -e "$filter" >/dev/null 2>&1 <<<"$RESP_BODY"; then pass "[$who] $method $path: $filter"
  else fail "[$who] $method $path: $filter (status $RESP_CODE, body $(head -c 200 <<<"$RESP_BODY"))"; fi
}

mcp() {
  local key=$1 payload=$2
  curl -s -m 60 "$BASE_URL/api/v1/mcp" -H "x-api-key: $key" -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' -d "$payload" | sed -n 's/^data: //p'
}
mcp_call() {
  local payload
  payload="$(jq -nc --arg n "$2" --argjson a "$3" '{jsonrpc:"2.0",id:1,method:"tools/call",params:{name:$n,arguments:$a}}')"
  MCP_RESULT="$(mcp "$1" "$payload" | jq -c '.result // .error')"
  MCP_TEXT="$(jq -r '.content[0].text // .message // empty' <<<"$MCP_RESULT")"
}
tool_ok() {
  local who=$1 key=$2 name=$3 args=$4 filter=${5-}
  mcp_call "$key" "$name" "$args"
  if [[ "$(jq -r '.isError // false' <<<"$MCP_RESULT")" == "false" ]] && { [[ -z "$filter" ]] || jq -e "$filter" >/dev/null 2>&1 <<<"$MCP_TEXT"; }; then
    pass "[$who] mcp $name"
  else fail "[$who] mcp $name -> $(head -c 200 <<<"$MCP_TEXT")"; fi
}
tool_err() {
  local who=$1 key=$2 name=$3 args=$4 expected=$5
  mcp_call "$key" "$name" "$args"
  if [[ "$(jq -r '.isError // false' <<<"$MCP_RESULT")" == "true" ]] && grep -q "$expected" <<<"$MCP_TEXT"; then
    pass "[$who] mcp $name refused: $(head -c 120 <<<"$MCP_TEXT")"
  else fail "[$who] mcp $name expected error '$expected', got $(head -c 200 <<<"$MCP_RESULT")"; fi
}

id_list() { local out="" id; for id in "$@"; do out+="${out:+,}'$id'"; done; echo "${out:-NULL}"; }
purge() { # id lists: databases projects agents organizations
  sql "
delete from job_log where backup_id in (select id from backups where database_id in ($1))
  or restoration_id in (select id from restorations where database_id in ($1));
delete from restorations where database_id in ($1);
delete from backup_storage where backup_id in (select id from backups where database_id in ($1));
delete from backups where database_id in ($1);
delete from retention_policies where database_id in ($1) or project_id in ($2)
  or project_id in (select id from projects where organization_id in ($4));
delete from databases where id in ($1) or agent_id in ($3);
delete from organization_agents where agent_id in ($3);
delete from agents where id in ($3);
delete from projects where id in ($2) or organization_id in ($4);
delete from member where organization_id in ($4);
delete from organization where id in ($4);
"
}
drop_databases() { purge "$(id_list "$@")" NULL NULL NULL; }
cleanup() {
  purge "$(id_list "${DATABASES[@]}")" "$(id_list "${PROJECTS[@]}")" "$(id_list "${AGENTS[@]}")" "$(id_list "${ORGS[@]}")" >/dev/null \
    || echo "WARNING: sandbox cleanup failed; rows of run $RUN may remain" >&2
  rm -rf "${UPLOADS_DIR:?}/$RUN" "$TMP"
}
print_kept() {
  echo
  echo "Sandbox kept for inspection (run $RUN):"
  echo "  - organization \"$(sql "select name from organization where id='$ORG_ID';")\": project \"API Test $RUN p1\""
  echo "      databases $RUN-db1, $RUN-db4, $RUN-snapshots, $RUN-sync, $RUN-copy, $RUN-suspended"
  echo "      unlinked: $RUN-db2${DBM:+, $RUN-mcp-db}; agents $RUN-org-agent and $RUN-global-agent (never online)"
  echo "  - organization \"API Test $RUN\" (owner: the ADMIN_KEY user): project \"API Test $RUN p2\", database $RUN-db3"
  [[ -n "${ORG_U:-}" ]] && echo "  - organization \"API Test $RUN user\" (owner: the ORG_ADMIN_KEY user)"
  echo "  Remove it with: scripts/test-api.sh --cleanup $RUN"
}
finish() {
  if [[ "${KEEP_DATA:-}" == "1" ]]; then rm -rf "$TMP"; [[ -n "${ORG_S:-}" ]] && print_kept
  else cleanup; fi
}

if [[ "${1:-}" == "--cleanup" ]]; then
  RUN="${2:-}"
  [[ "$RUN" =~ ^api-test-[0-9]+$ ]] || die "usage: scripts/test-api.sh --cleanup api-test-<number>"
  mapfile -t ORGS < <(sql "select id from organization where slug = '$RUN' or slug like '$RUN-%';")
  mapfile -t PROJECTS < <(sql "select id from projects where name like 'API Test $RUN %';")
  mapfile -t AGENTS < <(sql "select id from agents where name like '$RUN-%';")
  mapfile -t DATABASES < <(sql "select id from databases where name like '$RUN-%';")
  echo "Removing run $RUN: ${#ORGS[@]} organizations, ${#PROJECTS[@]} projects, ${#AGENTS[@]} agents, ${#DATABASES[@]} databases"
  cleanup
  exit 0
fi

[[ -n "${ADMIN_KEY:-}" && -n "${ORG_ADMIN_KEY:-}" && -n "${ORG_ID:-}" ]] || { usage >&2; die "ADMIN_KEY, ORG_ADMIN_KEY and ORG_ID are required"; }
host="$(sed -E 's#^[a-z]+://([^/:]+).*#\1#' <<<"$BASE_URL")"
if [[ "$host" != "localhost" && "$host" != "127.0.0.1" && "${ALLOW_REMOTE:-}" != "1" ]]; then
  die "$BASE_URL is not local; set ALLOW_REMOTE=1 to run against it"
fi

seed_database() { # name agent project|NULL dbms [engine] [method_conflict]
  SEEDED="$(new_id)"; DATABASES+=("$SEEDED")
  local project="NULL" conflict="NULL"
  [[ "$3" != "NULL" ]] && project="'$3'"
  [[ -n "${6:-}" ]] && conflict="'$6'"
  sql "insert into databases (id, name, dbms, agent_id, project_id, backup_engine, method_conflict, config) values ('$SEEDED','$1','$4','$2',$project,'${5:-archive}',$conflict,'{\"host\":\"db.internal\",\"password\":\"enc:sandbox\"}'::jsonb);"
}
seed_backup() { SEEDED="$(new_id)"; sql "insert into backups (id, database_id, status) values ('$SEEDED','$1','success');"; }
seed_storage() { # backup presence file content|- [engine]
  SEEDED="$(new_id)"
  sql "insert into backup_storage (id, backup_id, storage_channel_id, status, engine, presence, path) values ('$SEEDED','$1','$LOCAL_STORAGE','success','${5:-archive}','$2','$RUN/$3');"
  if [[ "$4" != "-" && -w "$UPLOADS_DIR" ]]; then mkdir -p "$UPLOADS_DIR/$RUN" && printf '%s' "$4" > "$UPLOADS_DIR/$RUN/$3"; fi
}
seed_restoration() { SEEDED="$(new_id)"; sql "insert into restorations (id, database_id, backup_id, backup_storage_id, status) values ('$SEEDED','$1','$2','$3','failed');"; }
seed_logs() { # backup_id|restoration_id id
  sql "insert into job_log ($1, logged_at, entry_type, level, message) values ('$2', now() - interval '2 seconds', 'log', 'info', 'step 1'), ('$2', now() - interval '1 second', 'log', 'info', 'step 2');"
}

section "Preflight"
[[ "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE_URL/api/health")" == "200" ]] || die "$BASE_URL/api/health is not answering 200"
[[ "$(sql "select 1;")" == "1" ]] || die "cannot run SQL with PSQL_CMD"
req GET /api/v1/organizations "$ADMIN_KEY"; [[ "$RESP_CODE" == "200" ]] || die "ADMIN_KEY rejected ($RESP_CODE): is API_ENABLED=true?"
req GET /api/v1/organizations "$ORG_ADMIN_KEY"; [[ "$RESP_CODE" == "200" ]] || die "ORG_ADMIN_KEY rejected ($RESP_CODE)"
jq -e --arg o "$ORG_ID" '[.data[].id] | index($o) != null' >/dev/null <<<"$RESP_BODY" || die "ORG_ADMIN_KEY user is not a member of ORG_ID"
LOCAL_STORAGE="$(sql "select id from storage_channel where provider='local' order by created_at limit 1;")"
[[ -n "$LOCAL_STORAGE" ]] || die "no local storage channel found"
CALLED=()
trap finish EXIT
echo "  sandbox run: $RUN"

section "Docs and authentication"
expect anon GET /api/v1/openapi "" 200
expect anon GET /api/v1/docs "" 200
expect anon GET /api/v1/databases "" 401
expect anon GET /api/v1/databases "sk_not_a_key" 401

section "Organizations and projects"
expect_jq admin GET /api/v1/organizations "$ADMIN_KEY" '.data | type == "array"'
expect admin POST /api/v1/organizations "$ADMIN_KEY" 201 "{\"name\":\"API Test $RUN\",\"slug\":\"$RUN\"}"; ORG_S="$(data_id)"; ORGS+=("$ORG_S")
expect admin POST /api/v1/organizations "$ADMIN_KEY" 409 "{\"name\":\"API Test $RUN\",\"slug\":\"$RUN\"}"
expect org-admin POST /api/v1/organizations "$ORG_ADMIN_KEY" "201 403" "{\"name\":\"API Test $RUN user\",\"slug\":\"$RUN-user\"}"
ORG_U="$(data_id)"; [[ -n "$ORG_U" ]] && ORGS+=("$ORG_U")
expect admin GET "/api/v1/organizations/$ORG_S" "$ADMIN_KEY" 200
expect org-admin GET "/api/v1/organizations/$ORG_S" "$ORG_ADMIN_KEY" 404
expect org-admin GET "/api/v1/organizations/$ORG_ID" "$ORG_ADMIN_KEY" 200
expect org-admin GET /api/v1/organizations/not-a-uuid "$ORG_ADMIN_KEY" 404
expect_jq org-admin GET "/api/v1/organizations/$ORG_ID/projects" "$ORG_ADMIN_KEY" '.data | type == "array"'
expect org-admin POST "/api/v1/organizations/$ORG_ID/projects" "$ORG_ADMIN_KEY" 201 "{\"name\":\"API Test $RUN p1\",\"slug\":\"$RUN-p1\"}"; P1="$(data_id)"; PROJECTS+=("$P1")
expect org-admin POST "/api/v1/organizations/$ORG_ID/projects" "$ORG_ADMIN_KEY" 409 "{\"name\":\"API Test $RUN p1\",\"slug\":\"$RUN-p1\"}"
expect admin POST "/api/v1/organizations/$ORG_S/projects" "$ADMIN_KEY" 201 "{\"name\":\"API Test $RUN p2\",\"slug\":\"$RUN-p2\"}"; P2="$(data_id)"; PROJECTS+=("$P2")
expect org-admin POST "/api/v1/organizations/$ORG_S/projects" "$ORG_ADMIN_KEY" 404 "{\"name\":\"API Test $RUN x\",\"slug\":\"$RUN-x\"}"
expect_jq org-admin GET "/api/v1/projects/$P1" "$ORG_ADMIN_KEY" ".data.id == \"$P1\""
expect org-admin GET "/api/v1/projects/$P2" "$ORG_ADMIN_KEY" 404

section "Agents"
expect org-admin POST /api/v1/agents "$ORG_ADMIN_KEY" 403 "{\"name\":\"$RUN-forbidden\"}"
[[ "$RESP_CODE" == "201" ]] && { AGENTS+=("$(data_id)"); die "ORG_ADMIN_KEY belongs to an instance admin; use a regular user's key"; }
expect org-admin POST /api/v1/agents "$ORG_ADMIN_KEY" 201 "{\"name\":\"$RUN-org-agent\",\"organizationId\":\"$ORG_ID\"}"; AG_ORG="$(data_id)"; AGENTS+=("$AG_ORG")
expect admin POST /api/v1/agents "$ADMIN_KEY" 201 "{\"name\":\"$RUN-global-agent\"}"; AG_G="$(data_id)"; AGENTS+=("$AG_G")
expect admin POST "/api/v1/organizations/$ORG_S/agents" "$ADMIN_KEY" 201 "{\"agentId\":\"$AG_G\"}"
expect org-admin POST "/api/v1/organizations/$ORG_ID/agents" "$ORG_ADMIN_KEY" 403 "{\"agentId\":\"$AG_G\"}"
expect admin POST "/api/v1/organizations/$ORG_ID/agents" "$ADMIN_KEY" "404 422" "{\"agentId\":\"$AG_G\"}"
sql "insert into organization_agents (organization_id, agent_id) values ('$ORG_ID','$AG_G');"
expect_jq org-admin GET /api/v1/agents "$ORG_ADMIN_KEY" "[.data[].id] | index(\"$AG_ORG\") != null and index(\"$AG_G\") != null"
expect_jq org-admin GET "/api/v1/agents/$AG_ORG" "$ORG_ADMIN_KEY" ".data.id == \"$AG_ORG\""
expect_jq org-admin GET "/api/v1/agents/$AG_ORG/key" "$ORG_ADMIN_KEY" '.data | type == "string" and length > 20'
expect org-admin GET /api/v1/agents/not-a-uuid "$ORG_ADMIN_KEY" 404
expect_jq org-admin GET "/api/v1/organizations/$ORG_ID/agents" "$ORG_ADMIN_KEY" "[.data[].id] | index(\"$AG_ORG\") != null"
expect org-admin GET "/api/v1/organizations/$ORG_S/agents" "$ORG_ADMIN_KEY" 404

section "Sandbox databases (SQL)"
seed_database "$RUN-db1" "$AG_ORG" "$P1" postgresql; DB1="$SEEDED"
seed_database "$RUN-db2" "$AG_ORG" NULL mysql; DB2="$SEEDED"
seed_database "$RUN-db3" "$AG_G" "$P2" postgresql; DB3="$SEEDED"
seed_database "$RUN-db4" "$AG_ORG" "$P1" files; DB4="$SEEDED"
seed_backup "$DB1"; BK1="$SEEDED"; seed_backup "$DB1"; BK2="$SEEDED"
seed_storage "$BK1" present bk1.dump "content-1"; BS1="$SEEDED"
seed_storage "$BK1" missing gone.dump -; BS1M="$SEEDED"
seed_storage "$BK2" present bk2.dump "content-2"; BS2="$SEEDED"
seed_restoration "$DB1" "$BK1" "$BS1"; R1="$SEEDED"
seed_logs backup_id "$BK1"; seed_logs restoration_id "$R1"
echo "  4 databases, 2 backups, 3 stored copies, 1 restoration"

section "Databases and access scoping"
expect_jq org-admin GET /api/v1/databases "$ORG_ADMIN_KEY" "[.data[].id] | index(\"$DB1\") != null and index(\"$DB2\") != null and index(\"$DB3\") == null"
expect_jq admin GET /api/v1/databases "$ADMIN_KEY" "[.data[].id] | index(\"$DB1\") != null and index(\"$DB3\") != null"
expect_jq org-admin GET /api/v1/databases "$ORG_ADMIN_KEY" '[.data[] | has("config")] | any | not'
expect_jq org-admin GET "/api/v1/databases/$DB1" "$ORG_ADMIN_KEY" '(.data | has("config") | not) and .data.retentionPolicy == null'
expect org-admin GET "/api/v1/databases/$DB3" "$ORG_ADMIN_KEY" 403
expect admin GET "/api/v1/databases/$DB3" "$ADMIN_KEY" 200
expect org-admin GET "/api/v1/databases/$DB2" "$ORG_ADMIN_KEY" 403
expect org-admin GET /api/v1/databases/not-a-uuid "$ORG_ADMIN_KEY" 404
expect_jq org-admin GET "/api/v1/databases/$DB1/status" "$ORG_ADMIN_KEY" ".data.latestBackup != null and .data.latestRestoration.id == \"$R1\""
expect_jq org-admin GET "/api/v1/agents/$AG_G" "$ORG_ADMIN_KEY" "[.data.databases[].id] | index(\"$DB3\") == null"
expect_jq org-admin PATCH "/api/v1/databases/$DB2" "$ORG_ADMIN_KEY" ".data.projectId == \"$P1\" and (.data | has(\"config\") | not)" "{\"projectId\":\"$P1\"}"
expect_jq org-admin PATCH "/api/v1/databases/$DB2" "$ORG_ADMIN_KEY" '.data.projectId == null' '{"projectId":null}'
expect org-admin PATCH "/api/v1/databases/$DB2" "$ORG_ADMIN_KEY" 404 "{\"projectId\":\"$P2\"}"
expect org-admin PATCH "/api/v1/databases/$DB3" "$ORG_ADMIN_KEY" 403 '{"projectId":null}'

section "Policies"
RETENTION='{"type":"count","count":5,"days":30,"gfs":{"hourly":0,"daily":7,"weekly":4,"monthly":12,"yearly":3}}'
RETENTION_DEFAULT='{"count":7,"days":30,"gfs":{"hourly":0,"daily":7,"weekly":4,"monthly":12,"yearly":3}}'
expect_jq org-admin PUT "/api/v1/databases/$DB1/backup-policy" "$ORG_ADMIN_KEY" '(.data | has("config") | not) and .data.backupPolicy == "0 3 * * *"' '{"backupPolicy":"0 3 * * *"}'
expect org-admin PUT "/api/v1/databases/$DB1/backup-policy" "$ORG_ADMIN_KEY" 422 '{"backupPolicy":"every day"}'
expect org-admin PUT "/api/v1/databases/$DB3/backup-policy" "$ORG_ADMIN_KEY" 403 '{"backupPolicy":"0 3 * * *"}'
expect_jq org-admin PUT "/api/v1/projects/$P1/backup-policy" "$ORG_ADMIN_KEY" '.data.backupPolicy == "0 4 * * *"' '{"backupPolicy":"0 4 * * *"}'
expect org-admin PUT "/api/v1/projects/$P2/backup-policy" "$ORG_ADMIN_KEY" 404 '{"backupPolicy":"0 4 * * *"}'
expect_jq org-admin PUT "/api/v1/databases/$DB1/retention-policy" "$ORG_ADMIN_KEY" '.data.type == "count" and .data.count == 5' "$RETENTION"
expect org-admin PUT "/api/v1/databases/$DB4/retention-policy" "$ORG_ADMIN_KEY" 409 "$RETENTION"
expect org-admin PUT "/api/v1/databases/$DB1/retention-policy" "$ORG_ADMIN_KEY" 422 '{"type":"count","count":0,"days":30,"gfs":{"hourly":0,"daily":7,"weekly":4,"monthly":12,"yearly":3}}'
expect_jq org-admin PUT "/api/v1/projects/$P1/retention-policy" "$ORG_ADMIN_KEY" '.data.type == "gfs"' "$RETENTION_DEFAULT"
expect admin PUT "/api/v1/projects/$P2/retention-policy" "$ADMIN_KEY" 409 "$RETENTION"
expect_jq org-admin GET "/api/v1/databases/$DB1" "$ORG_ADMIN_KEY" '.data.retentionPolicy.count == 5'
expect_jq org-admin GET "/api/v1/projects/$P1" "$ORG_ADMIN_KEY" '.data.retentionPolicy.type == "gfs" and .data.backupPolicy == "0 4 * * *"'

section "Backups"
expect_jq org-admin GET "/api/v1/databases/$DB1/backup" "$ORG_ADMIN_KEY" '(.data | length) == 2'
expect_jq org-admin GET "/api/v1/databases/$DB1/backup/$BK1" "$ORG_ADMIN_KEY" '(.data.storages | length) == 2'
expect_jq org-admin GET "/api/v1/databases/$DB1/backup/$BK1/logs" "$ORG_ADMIN_KEY" '(.data | length) == 2 and .data[0].message == "step 1"'
if [[ -w "$UPLOADS_DIR" ]]; then
  expect_jq org-admin GET "/api/v1/databases/$DB1/backup/$BK1/download?backupStorageId=$BS1" "$ORG_ADMIN_KEY" '.data.url | startswith("http")'
  same "content-1" "$(curl -s -m 30 "$(jq -r '.data.url // empty' <<<"$RESP_BODY")")" "[org-admin] signed download URL serves the file"
else
  skip "download URL content: $UPLOADS_DIR is not writable from here"
fi
expect org-admin GET "/api/v1/databases/$DB1/backup/$BK1/download?backupStorageId=$BS1M" "$ORG_ADMIN_KEY" 409
expect org-admin GET "/api/v1/databases/$DB1/backup/$BK1/download" "$ORG_ADMIN_KEY" 422
expect org-admin GET "/api/v1/databases/$DB3/backup" "$ORG_ADMIN_KEY" 403
expect admin GET "/api/v1/databases/$DB3/backup" "$ADMIN_KEY" 200
expect org-admin POST "/api/v1/databases/$DB1/backup" "$ORG_ADMIN_KEY" 201
expect org-admin POST "/api/v1/databases/$DB1/backup" "$ORG_ADMIN_KEY" 409
expect org-admin DELETE "/api/v1/databases/$DB1/backup/$BK2" "$ORG_ADMIN_KEY" 204
expect org-admin GET "/api/v1/databases/$DB1/backup/$BK2" "$ORG_ADMIN_KEY" 404
expect org-admin GET "/api/v1/databases/$DB1/backup/$BK2/logs" "$ORG_ADMIN_KEY" 404
expect org-admin DELETE "/api/v1/databases/$DB1/backup/$BK2" "$ORG_ADMIN_KEY" 404
if [[ -w "$UPLOADS_DIR" ]]; then
  same "absent" "$([[ -e "$UPLOADS_DIR/$RUN/bk2.dump" ]] && echo present || echo absent)" "[org-admin] deleting a backup removes its file"
fi

section "Restorations"
expect_jq org-admin GET "/api/v1/databases/$DB1/restore" "$ORG_ADMIN_KEY" "[.data[].id] | index(\"$R1\") != null"
expect_jq org-admin GET "/api/v1/databases/$DB1/restore/$R1/logs" "$ORG_ADMIN_KEY" '(.data | length) == 2'
expect_jq org-admin POST "/api/v1/databases/$DB1/restore/$R1/rerun" "$ORG_ADMIN_KEY" '.data.status == "waiting"'
same "0" "$(sql "select count(*) from job_log where restoration_id='$R1';")" "[org-admin] rerun clears the restoration logs"
expect org-admin POST "/api/v1/databases/$DB1/restore/$R1/rerun" "$ORG_ADMIN_KEY" 409
expect org-admin POST "/api/v1/databases/$DB1/restore" "$ORG_ADMIN_KEY" 409 "{\"backupId\":\"$BK1\",\"backupStorageId\":\"$BS1\"}"
expect org-admin DELETE "/api/v1/databases/$DB1/restore/$R1" "$ORG_ADMIN_KEY" 204
expect org-admin DELETE "/api/v1/databases/$DB1/restore/$R1" "$ORG_ADMIN_KEY" 404
expect org-admin POST "/api/v1/databases/$DB1/restore" "$ORG_ADMIN_KEY" 409 "{\"backupId\":\"$BK1\",\"backupStorageId\":\"$BS1M\"}"
expect org-admin POST "/api/v1/databases/$DB1/restore" "$ORG_ADMIN_KEY" 201 "{\"backupId\":\"$BK1\",\"backupStorageId\":\"$BS1\"}"; R2="$(data_id)"
expect_jq org-admin GET "/api/v1/databases/$DB1/restore" "$ORG_ADMIN_KEY" "[.data[].id] | index(\"$R2\") != null and index(\"$R1\") == null"
expect org-admin DELETE "/api/v1/databases/$DB1/restore/$R2" "$ORG_ADMIN_KEY" 204
expect org-admin GET "/api/v1/databases/$DB3/restore" "$ORG_ADMIN_KEY" 403

section "Snapshots, replicas and suspended backups"
seed_database "$RUN-snapshots" "$AG_ORG" "$P1" files restic; DB_SNAP="$SEEDED"
seed_backup "$DB_SNAP"; BK_SNAP="$SEEDED"; seed_storage "$BK_SNAP" present snapshot-id - restic; BS_SNAP="$SEEDED"
expect_error org-admin GET "/api/v1/databases/$DB_SNAP/backup/$BK_SNAP/download?backupStorageId=$BS_SNAP" "$ORG_ADMIN_KEY" 409 "Snapshots cannot be downloaded as a file."
expect org-admin POST "/api/v1/databases/$DB_SNAP/restore" "$ORG_ADMIN_KEY" 201 "{\"backupId\":\"$BK_SNAP\",\"backupStorageId\":\"$BS_SNAP\"}"; R_SNAP="$(data_id)"
expect org-admin DELETE "/api/v1/databases/$DB_SNAP/restore/$R_SNAP" "$ORG_ADMIN_KEY" 204
REPLICA_DBS=()
for engine in sync copy; do
  seed_database "$RUN-$engine" "$AG_ORG" "$P1" files "$engine"; db="$SEEDED"; REPLICA_DBS+=("$db")
  seed_backup "$db"; bk="$SEEDED"; seed_storage "$bk" present "$engine-replica" - "$engine"; bs="$SEEDED"
  seed_restoration "$db" "$bk" "$bs"; rr="$SEEDED"
  expect_error org-admin GET "/api/v1/databases/$db/backup/$bk/download?backupStorageId=$bs" "$ORG_ADMIN_KEY" 409 "A replica cannot be downloaded as a file."
  expect_error org-admin POST "/api/v1/databases/$db/restore" "$ORG_ADMIN_KEY" 409 "A replica cannot be restored." "{\"backupId\":\"$bk\",\"backupStorageId\":\"$bs\"}"
  expect_error org-admin POST "/api/v1/databases/$db/restore/$rr/rerun" "$ORG_ADMIN_KEY" 409 "A replica cannot be restored."
done
[[ "${KEEP_DATA:-}" == "1" ]] || drop_databases "$DB_SNAP" "${REPLICA_DBS[@]}"
seed_database "$RUN-suspended" "$AG_ORG" "$P1" files archive snapshot; DB_SUS="$SEEDED"
expect_error org-admin POST "/api/v1/databases/$DB_SUS/backup" "$ORG_ADMIN_KEY" 409 "Backups are suspended"
same "0" "$(sql "select count(*) from backups where database_id='$DB_SUS';")" "[org-admin] a suspended source queues no backup"

section "MCP"
req POST /api/v1/mcp "$ORG_ADMIN_KEY" '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
if [[ "$RESP_CODE" == "404" ]]; then
  skip "MCP is disabled (set MCP_ENABLED=true to test it)"
else
  for who in admin org-admin; do
    key="$ADMIN_KEY"; [[ "$who" == "org-admin" ]] && key="$ORG_ADMIN_KEY"
    names="$(mcp "$key" '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq -r '.result.tools[].name' | sort)"
    source_names="$(grep -A1 -h 'server.tool($' -r "$REPO/src/lib/mcp/tools" | grep -o '"[a-z_]*"' | tr -d '"' | sort)"
    same "$source_names" "$names" "[$who] mcp tools/list matches the tools in src/lib/mcp/tools ($(wc -l <<<"$names" | tr -d ' ') tools)"
  done
  same 401 "$(curl -s -m 30 -o /dev/null -w '%{http_code}' "$BASE_URL/api/v1/mcp" -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')" "[anon] mcp without a key"
  seed_database "$RUN-mcp-db" "$AG_ORG" NULL postgresql; DBM="$SEEDED"
  seed_backup "$DBM"; BKM="$SEEDED"; seed_backup "$DBM"; BKM2="$SEEDED"
  seed_storage "$BKM" present mcp1.dump "mcp-content"; BSM="$SEEDED"; seed_storage "$BKM2" present mcp2.dump "mcp-content-2"
  seed_restoration "$DBM" "$BKM" "$BSM"; RM="$SEEDED"; seed_logs backup_id "$BKM"
  GFS='"gfs":{"hourly":0,"daily":7,"weekly":4,"monthly":12,"yearly":3}'
  tool_ok org-admin "$ORG_ADMIN_KEY" list_organizations '{}' "[.[].id] | index(\"$ORG_ID\") != null"
  tool_ok org-admin "$ORG_ADMIN_KEY" list_projects "{\"organizationId\":\"$ORG_ID\"}" "[.[].id] | index(\"$P1\") != null"
  tool_ok org-admin "$ORG_ADMIN_KEY" get_project "{\"id\":\"$P1\"}" ".id == \"$P1\""
  tool_ok org-admin "$ORG_ADMIN_KEY" list_agents '{}' "[.[].id] | index(\"$AG_ORG\") != null"
  tool_ok org-admin "$ORG_ADMIN_KEY" get_agent "{\"id\":\"$AG_ORG\"}" ".id == \"$AG_ORG\""
  tool_ok org-admin "$ORG_ADMIN_KEY" list_organization_agents "{\"organizationId\":\"$ORG_ID\"}" "[.[].id] | index(\"$AG_ORG\") != null"
  tool_ok org-admin "$ORG_ADMIN_KEY" list_databases '{}' "[.[].id] | index(\"$DBM\") != null"
  tool_ok org-admin "$ORG_ADMIN_KEY" attach_database_to_project "{\"id\":\"$DBM\",\"projectId\":\"$P1\"}" ".projectId == \"$P1\""
  tool_ok org-admin "$ORG_ADMIN_KEY" get_database "{\"id\":\"$DBM\"}" 'has("config") | not'
  tool_ok org-admin "$ORG_ADMIN_KEY" get_database_status "{\"id\":\"$DBM\"}" '.latestBackup != null'
  tool_ok org-admin "$ORG_ADMIN_KEY" set_database_backup_policy "{\"id\":\"$DBM\",\"backupPolicy\":\"0 3 * * *\"}" '(has("config") | not) and .backupPolicy == "0 3 * * *"'
  tool_ok org-admin "$ORG_ADMIN_KEY" set_project_backup_policy "{\"id\":\"$P1\",\"backupPolicy\":\"0 4 * * *\"}" '.backupPolicy == "0 4 * * *"'
  tool_ok org-admin "$ORG_ADMIN_KEY" set_database_retention_policy "{\"id\":\"$DBM\",\"type\":\"count\",\"count\":5,\"days\":30,$GFS}" '.type == "count"'
  tool_ok org-admin "$ORG_ADMIN_KEY" set_project_retention_policy "{\"id\":\"$P1\",\"count\":7,\"days\":30,$GFS}" '.type == "gfs"'
  tool_err org-admin "$ORG_ADMIN_KEY" set_database_retention_policy "{\"id\":\"$DBM\",\"count\":0,\"days\":30,$GFS}" "count"
  tool_ok org-admin "$ORG_ADMIN_KEY" list_backups "{\"databaseId\":\"$DBM\"}" 'length == 2'
  tool_ok org-admin "$ORG_ADMIN_KEY" get_backup "{\"databaseId\":\"$DBM\",\"backupId\":\"$BKM\"}" '(.storages | length) == 1'
  tool_ok org-admin "$ORG_ADMIN_KEY" get_backup_logs "{\"databaseId\":\"$DBM\",\"backupId\":\"$BKM\"}" 'length == 2'
  if [[ -w "$UPLOADS_DIR" ]]; then
    tool_ok org-admin "$ORG_ADMIN_KEY" get_backup_download_url "{\"databaseId\":\"$DBM\",\"backupId\":\"$BKM\",\"backupStorageId\":\"$BSM\"}" '.url | startswith("http")'
    same "mcp-content" "$(curl -s -m 30 "$(jq -r '.url // empty' <<<"$MCP_TEXT")")" "[org-admin] mcp signed download URL serves the file"
  fi
  tool_ok org-admin "$ORG_ADMIN_KEY" list_restorations "{\"databaseId\":\"$DBM\"}" "[.[].id] | index(\"$RM\") != null"
  tool_ok org-admin "$ORG_ADMIN_KEY" get_restoration_logs "{\"databaseId\":\"$DBM\",\"restorationId\":\"$RM\"}" 'type == "array"'
  tool_ok org-admin "$ORG_ADMIN_KEY" rerun_restoration "{\"databaseId\":\"$DBM\",\"restorationId\":\"$RM\"}" '.status == "waiting"'
  tool_err org-admin "$ORG_ADMIN_KEY" rerun_restoration "{\"databaseId\":\"$DBM\",\"restorationId\":\"$RM\"}" "already waiting"
  tool_err org-admin "$ORG_ADMIN_KEY" trigger_restore "{\"databaseId\":\"$DBM\",\"backupId\":\"$BKM\",\"backupStorageId\":\"$BSM\"}" "already waiting"
  tool_ok org-admin "$ORG_ADMIN_KEY" delete_restoration "{\"databaseId\":\"$DBM\",\"restorationId\":\"$RM\"}"
  tool_err org-admin "$ORG_ADMIN_KEY" delete_restoration "{\"databaseId\":\"$DBM\",\"restorationId\":\"../backup/$BKM\"}" "Invalid identifier"
  tool_err org-admin "$ORG_ADMIN_KEY" delete_restoration "{\"databaseId\":\"$DBM\",\"restorationId\":\"%2e%2e/backup/$BKM\"}" "Invalid identifier"
  same "1" "$(sql "select count(*) from backups where id='$BKM' and deleted_at is null;")" "[org-admin] a path-changing id deletes nothing"
  tool_ok org-admin "$ORG_ADMIN_KEY" trigger_backup "{\"databaseId\":\"$DBM\"}" '.status == "waiting"'
  tool_err org-admin "$ORG_ADMIN_KEY" trigger_backup "{\"databaseId\":\"$DB_SUS\"}" "Backups are suspended"
  tool_ok org-admin "$ORG_ADMIN_KEY" delete_backup "{\"databaseId\":\"$DBM\",\"backupId\":\"$BKM2\"}"
  tool_err org-admin "$ORG_ADMIN_KEY" delete_backup "{\"databaseId\":\"$DBM\",\"backupId\":\"$BKM2\"}" "Backup not found"
  tool_err org-admin "$ORG_ADMIN_KEY" attach_agent_to_organization "{\"organizationId\":\"$ORG_ID\",\"agentId\":\"$AG_G\"}" "Forbidden"
  tool_ok org-admin "$ORG_ADMIN_KEY" detach_database_from_project "{\"id\":\"$DBM\"}" '.projectId == null'
  tool_ok admin "$ADMIN_KEY" get_organization "{\"id\":\"$ORG_S\"}" ".id == \"$ORG_S\""
  tool_ok admin "$ADMIN_KEY" get_agent_key "{\"id\":\"$AG_G\"}"
  tool_ok admin "$ADMIN_KEY" create_project "{\"organizationId\":\"$ORG_S\",\"name\":\"API Test $RUN mcp\",\"slug\":\"$RUN-mcp\"}" '.id != null'
  PM="$(jq -r '.id // empty' <<<"$MCP_TEXT")"; [[ -n "$PM" ]] && PROJECTS+=("$PM")
  tool_ok admin "$ADMIN_KEY" archive_project "{\"id\":\"$PM\"}"
  tool_ok admin "$ADMIN_KEY" create_agent "{\"name\":\"$RUN-mcp-agent\"}" '.id != null'
  AGM="$(jq -r '.id // empty' <<<"$MCP_TEXT")"; [[ -n "$AGM" ]] && AGENTS+=("$AGM")
  tool_ok admin "$ADMIN_KEY" delete_agent "{\"id\":\"$AGM\"}"
  tool_ok admin "$ADMIN_KEY" create_organization "{\"name\":\"API Test $RUN mcp\",\"slug\":\"$RUN-mcp\"}" '.id != null'
  OM="$(jq -r '.id // empty' <<<"$MCP_TEXT")"; [[ -n "$OM" ]] && ORGS+=("$OM")
  tool_ok admin "$ADMIN_KEY" delete_organization "{\"id\":\"$OM\"}"
fi

section "Deletes and schedule clearing through the API"
if [[ "${KEEP_DATA:-}" == "1" ]]; then
  echo "  KEEP_DATA=1: deletes run on throwaway copies so the sandbox stays"
  T_DBS=(); T_PROJECTS=(); T_AGENTS=(); T_ORGS=()
  seed_database "$RUN-tmp-db" "$AG_ORG" "$P1" postgresql; CLR_DB="$SEEDED"; T_DBS+=("$SEEDED")
  expect org-admin POST "/api/v1/organizations/$ORG_ID/projects" "$ORG_ADMIN_KEY" 201 "{\"name\":\"API Test $RUN tmp1\",\"slug\":\"$RUN-tmp1\"}"; OWN_P="$(data_id)"; T_PROJECTS+=("$OWN_P")
  expect admin POST "/api/v1/organizations/$ORG_S/projects" "$ADMIN_KEY" 201 "{\"name\":\"API Test $RUN tmp2\",\"slug\":\"$RUN-tmp2\"}"; OTHER_P="$(data_id)"; T_PROJECTS+=("$OTHER_P")
  expect org-admin POST /api/v1/agents "$ORG_ADMIN_KEY" 201 "{\"name\":\"$RUN-tmp-org-agent\",\"organizationId\":\"$ORG_ID\"}"; DEL_AG_ORG="$(data_id)"; T_AGENTS+=("$DEL_AG_ORG")
  expect admin POST /api/v1/agents "$ADMIN_KEY" 201 "{\"name\":\"$RUN-tmp-global-agent\"}"; DEL_AG_G="$(data_id)"; T_AGENTS+=("$DEL_AG_G")
  expect admin POST "/api/v1/organizations/$ORG_S/agents" "$ADMIN_KEY" 201 "{\"agentId\":\"$DEL_AG_G\"}"
  expect admin POST /api/v1/organizations "$ADMIN_KEY" 201 "{\"name\":\"API Test $RUN tmp\",\"slug\":\"$RUN-tmp\"}"; DEL_ORG="$(data_id)"; T_ORGS+=("$DEL_ORG")
  expect org-admin PUT "/api/v1/databases/$CLR_DB/backup-policy" "$ORG_ADMIN_KEY" 200 '{"backupPolicy":"0 3 * * *"}'
  expect org-admin PUT "/api/v1/databases/$CLR_DB/retention-policy" "$ORG_ADMIN_KEY" 200 "$RETENTION"
  expect org-admin PUT "/api/v1/projects/$OWN_P/backup-policy" "$ORG_ADMIN_KEY" 200 '{"backupPolicy":"0 4 * * *"}'
else
  CLR_DB="$DB1"; OWN_P="$P1"; OTHER_P="$P2"; DEL_AG_G="$AG_G"; DEL_AG_ORG="$AG_ORG"; DEL_ORG="$ORG_S"
fi
expect org-admin PUT "/api/v1/databases/$CLR_DB/backup-policy" "$ORG_ADMIN_KEY" 200 '{"backupPolicy":""}'
expect_jq org-admin GET "/api/v1/databases/$CLR_DB" "$ORG_ADMIN_KEY" '.data.retentionPolicy == null'
expect org-admin PUT "/api/v1/projects/$OWN_P/backup-policy" "$ORG_ADMIN_KEY" 200 '{"backupPolicy":""}'
expect org-admin DELETE "/api/v1/projects/$OTHER_P" "$ORG_ADMIN_KEY" 404
expect admin DELETE "/api/v1/projects/$OTHER_P" "$ADMIN_KEY" 200
expect org-admin DELETE "/api/v1/projects/$OWN_P" "$ORG_ADMIN_KEY" 200
expect org-admin DELETE "/api/v1/organizations/$ORG_ID/agents/$DEL_AG_G" "$ORG_ADMIN_KEY" 403
expect admin DELETE "/api/v1/organizations/$ORG_S/agents/$DEL_AG_G" "$ADMIN_KEY" 200
expect org-admin DELETE "/api/v1/agents/$DEL_AG_G" "$ORG_ADMIN_KEY" 403
expect admin DELETE "/api/v1/agents/$DEL_AG_G" "$ADMIN_KEY" 204
expect org-admin DELETE "/api/v1/agents/$DEL_AG_ORG" "$ORG_ADMIN_KEY" 204
expect org-admin DELETE "/api/v1/organizations/$DEL_ORG" "$ORG_ADMIN_KEY" 404
expect admin DELETE "/api/v1/organizations/$DEL_ORG" "$ADMIN_KEY" 200
if [[ "${KEEP_DATA:-}" == "1" ]]; then
  purge "$(id_list "${T_DBS[@]}")" "$(id_list "${T_PROJECTS[@]}")" "$(id_list "${T_AGENTS[@]}")" "$(id_list "${T_ORGS[@]}")" >/dev/null
elif [[ -n "$ORG_U" ]]; then
  expect org-admin DELETE "/api/v1/organizations/$ORG_U" "$ORG_ADMIN_KEY" 200
fi

section "OpenAPI coverage"
spec_ops="$(curl -s -m 30 "$BASE_URL/api/v1/openapi" | jq -r '.paths | to_entries[] | .key as $p | .value | keys[] | "\(ascii_upcase) /api/v1\($p)"' | sed -E 's#\{[^}]+\}#*#g' | sort -u)"
called_ops="$(printf '%s\n' "${CALLED[@]}" | sort -u)"
[[ -n "$spec_ops" ]] || fail "could not read the OpenAPI specification"
missing="$(comm -23 <(printf '%s\n' "$spec_ops") <(printf '%s\n' "$called_ops"))"
if [[ -z "$missing" ]]; then pass "all $(wc -l <<<"$spec_ops" | tr -d ' ') OpenAPI operations were called"
else while read -r op; do fail "OpenAPI operation never called: $op"; done <<<"$missing"; fi

echo
echo "Result: $PASSED passed, $FAILED failed, $SKIPPED skipped"
[[ "$FAILED" -eq 0 ]]
