# Portabase Helm Chart

## Prerequisites

- A reachable Kubernetes cluster and `kubectl`/`helm` configured against it.
- `openssl` (or any way to generate a random secret) for the steps below.

```bash
kubectl get nodes
```

## 1. Create a namespace

```bash
kubectl create namespace portabase
```

## 2. Create the required secrets

This chart never takes secret values through `values.yaml` or `--set` - every
sensitive value is read from a Kubernetes `Secret` you create yourself, so it never
passes through Helm's release history or `helm get values` in plaintext.

**App secret** (`project.existingSecretName`/`existingSecretKey`, used for
`PROJECT_SECRET`):

```bash
kubectl create secret generic portabase-secrets \
  -n portabase \
  --from-literal=project-secret="$(openssl rand -hex 32)"
```

**Database password** - pick one of the two setups below.

- Using the bundled PostgreSQL (`postgres.enabled: true`, the default):

  ```bash
  kubectl create secret generic portabase-postgres \
    -n portabase \
    --from-literal=postgres-password="$(openssl rand -hex 32)"
  ```

  This becomes both the password the bundled `postgres` pod is started with and the
  one the app uses to connect to it (`postgres.existingSecretName`/`existingSecretKey`,
  key `postgres-password`).

- Bringing your own database instead (`postgres.enabled: false` - see below):

  ```bash
  kubectl create secret generic portabase-external-db \
    -n portabase \
    --from-literal=database-url="postgres://user:password@host:5432/dbname"
  ```

  Referenced via `postgres.externalDatabaseSecretName`/`externalDatabaseSecretKey`
  (key `database-url`).

## 3. Write your values

Create a `my-values.yaml` overriding at least the secret names from step 2 and
`project.url` (the public URL Portabase will be reachable at):

```yaml
project:
  url: https://portabase.example.com
  existingSecretName: portabase-secrets

postgres:
  existingSecretName: portabase-postgres
  # enabled: false
  # externalDatabaseSecretName: portabase-external-db

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: portabase.example.com
      paths:
        - path: /
          pathType: Prefix
```

See `values.yaml` for the full set of options (resources, persistence sizing,
`tusd.enabled`, `securityContext`/`podSecurityContext`, etc.).

`securityContext`/`podSecurityContext` default to `{}` (no enforcement). To run under
Pod Security Admission `baseline` or `restricted`, see the commented examples in 
`values.yaml` - the bundled `postgres` pod needs its own uid (999) rather than the
app's (1001), since that's what the official postgres image's `initdb` requires.

## 4. Deploy

```bash
helm install portabase ./helm -n portabase -f my-values.yaml
```

Upgrades use the same values file:

```bash
helm upgrade portabase ./helm -n portabase -f my-values.yaml
```

## Checking the deployment

```bash
kubectl get pods -n portabase
kubectl get svc -n portabase
```

If `service.type` is `ClusterIP` and you're not using the ingress, expose it locally
with port forwarding:

```bash
kubectl port-forward -n portabase svc/portabase 8887:80
```

## Uninstalling

```bash
helm uninstall portabase -n portabase
```

The app and database PVCs are annotated `helm.sh/resource-policy: keep`, so they - and
their data - survive the uninstall. Delete them manually if you actually want to wipe
the data:

```bash
kubectl delete pvc -n portabase -l app.kubernetes.io/instance=portabase
```