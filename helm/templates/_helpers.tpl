{{/*
Expand the name of the chart.
*/}}
{{- define "portabase.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this
(by the DNS naming spec).
*/}}
{{- define "portabase.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "portabase.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "portabase.labels" -}}
helm.sh/chart: {{ include "portabase.chart" . }}
{{ include "portabase.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "portabase.selectorLabels" -}}
app.kubernetes.io/name: {{ include "portabase.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
DATABASE_URL env vars: either built from the bundled postgres secret (with
in-container $(VAR) expansion so the password never renders in plaintext),
or read directly from an externally-provided secret. Shared between the app
container and the wait-for-db init container.
*/}}
{{- define "portabase.databaseUrlEnv" -}}
{{- if .Values.postgres.enabled }}
- name: POSTGRES_USER
  value: {{ .Values.postgres.username | quote }}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ required "postgres.existingSecretName is required when postgres.enabled is true (see values.yaml)" .Values.postgres.existingSecretName }}
      key: {{ .Values.postgres.existingSecretKey }}
- name: DATABASE_URL
  value: "postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@{{ include "portabase.fullname" . }}-postgres:5432/{{ .Values.postgres.database }}"
{{- else }}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ required "postgres.externalDatabaseSecretName is required when postgres.enabled is false (see values.yaml)" .Values.postgres.externalDatabaseSecretName }}
      key: {{ .Values.postgres.externalDatabaseSecretKey }}
{{- end }}
{{- end }}
