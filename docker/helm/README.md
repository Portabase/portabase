# Development Notes

## Check that Kubernetes is reachable locally

```bash
kubectl get nodes
```

## Install the local Portabase Helm chart

```bash
helm install portabase . \
--set project.secret=$(openssl rand -hex 32)
```

## Check the pods

```bash
kubectl get pods
```

## Check the services

```bash
kubectl get svc
```

## If the service type is ClusterIP, expose it locally using port forwarding:

```bash
kubectl port-forward svc/portabase 8887:80
```
