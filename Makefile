CLUSTER_SCRIPT=docker/entrypoints/app-dev-entrypoint.sh

up:
	@bash $(CLUSTER_SCRIPT)

seed-keycloak:
	@[ $$(ls -1 seeds/keycloak/*.json 2>/dev/null | wc -l) -gt 0 ] || (echo "No realm export found in seeds/keycloak. Add an export from Keycloak first."; exit 1)
	@docker compose -f docker-compose.func.yml stop keycloak >/dev/null 2>&1 || true
	@docker compose -f docker-compose.func.yml rm -f -s keycloak >/dev/null 2>&1 || true
	@docker volume rm portabase-dev-func_keycloak-data >/dev/null 2>&1 || true
	@docker compose -f docker-compose.func.yml up -d keycloak
	@echo "Keycloak seed import triggered from seeds/keycloak/*.json"

seed-pocket:
	@[ -f seeds/pocket-id/portabase.zip ] || (echo "No export found in seeds/pocket-id. Add an export from Pocket ID first."; exit 1)
	@docker compose -f docker-compose.func.yml stop pocket-id >/dev/null 2>&1 || true
	@docker compose -f docker-compose.func.yml rm -f -s pocket-id >/dev/null 2>&1 || true
	@docker volume rm portabase-dev-func_pocket-id-data >/dev/null 2>&1 || true
	@docker compose -f docker-compose.func.yml run --rm -v ./seeds/pocket-id/portabase.zip:/tmp/portabase.zip pocket-id ./pocket-id import --yes --path /tmp/portabase.zip >/dev/null
	@docker compose -f docker-compose.func.yml up -d pocket-id
	@sleep 2
	@docker compose -f docker-compose.func.yml exec pocket-id ./pocket-id one-time-access-token admin
	@echo "Pocket ID data restored from seeds/pocket-id/portabase.zip"

seed-auth: seed-keycloak seed-pocket-id

pocket-id-token:
	@docker compose -f docker-compose.func.yml exec pocket-id /app/pocket-id one-time-access-token admin
