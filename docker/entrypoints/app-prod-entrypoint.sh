#!/bin/bash

if [ -n "$TZ" ]; then
    echo "[INFO] Application timezone set to $TZ (environment only)"
    export TZ="$TZ"
else
    echo "[WARN] No TZ provided, using default container timezone"
fi

POSTGRES_BIN=$(ls -d /usr/lib/postgresql/*/bin | head -n 1)

if [ -z "$POSTGRES_BIN" ]; then
    echo "PostgreSQL binaries not found"
    exit 1
fi

export PATH="$POSTGRES_BIN:$PATH"

if [ -z "$DATABASE_URL" ]; then
    echo "[INFO] No DATABASE_URL provided, starting internal Postgres..."

    mkdir -p "$PGDATA"
    chown -R postgres:postgres "$PGDATA"

    if [ ! -f "$PGDATA/PG_VERSION" ]; then
        echo "[INFO] Initializing database cluster..."
        if ! su postgres -c "initdb -D '$PGDATA'" > /dev/null 2>&1; then
            echo "[ERROR] initdb failed"
            exit 1
        fi
    fi

    if ! su postgres -c "pg_ctl -D '$PGDATA' \
        -o \"-c listen_addresses='localhost' -c logging_collector=on\" \
        -l $PGDATA/postgres.log -w start" > /dev/null 2>&1; then
        echo "[ERROR] PostgreSQL failed to start"
        exit 1
    fi

    until su postgres -c "pg_isready -h 127.0.0.1 -p 5432" > /dev/null 2>&1; do
        sleep 1
    done

    echo "[INFO] PostgreSQL server is up and accepting connections"

    DB_USER="${POSTGRES_USER:-portabase_user}"
    DB_PASS="${POSTGRES_PASSWORD:-JaB6b1SUtIWYvt7srnOt}"
    DB_NAME="${POSTGRES_DB:-portabase_db}"

    USER_EXISTS=$(su postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'\"" 2>/dev/null)
    if [ "$USER_EXISTS" != "1" ]; then
        if ! su postgres -c "psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\"" > /dev/null 2>&1; then
            echo "[ERROR] Failed creating user"
            exit 1
        fi
    fi

    DB_EXISTS=$(su postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\"" 2>/dev/null)
    if [ "$DB_EXISTS" != "1" ]; then
        if ! su postgres -c "psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\"" > /dev/null 2>&1; then
            echo "[ERROR] Failed creating database"
            exit 1
        fi
    fi

    export DATABASE_URL="postgres://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME"

    echo "[SUCCESS] Internal PostgreSQL started successfully"
    echo "[SUCCESS] Database: $DB_NAME | User: $DB_USER | Host: 127.0.0.1:5432"
fi


mkdir -p /data/private/uploads/tmp
echo "▶ Starting tusd server..."
tusd --base-path /tus/files/ --upload-dir /data/private/uploads/tmp --hooks-http http://127.0.0.1:3000/api/tus/hooks --port 1080 --max-size 21474836480 &

echo "▶ Starting Next.js server..."
PORT=3000 node server.js &

echo "▶ Starting nginx..."
exec nginx -g "daemon off;"


