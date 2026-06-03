// src/features/stats/utils/provider-colors.ts
export const PROVIDER_COLORS: Record<string, string> = {
  local: "#6b7280",
  s3: "#f97316",
  "google-drive": "#3b82f6",
}

export const PROVIDER_LABELS: Record<string, string> = {
  local: "Disque local",
  s3: "S3",
  "google-drive": "Google Drive",
}

export function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? "#94a3b8"
}

export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider
}
