CLUSTER_SCRIPT=docker/entrypoints/app-dev-entrypoint.sh

up:
	@bash $(CLUSTER_SCRIPT)

api-test:
	pnpm test:api
