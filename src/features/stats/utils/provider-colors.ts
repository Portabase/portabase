export const PROVIDER_COLORS: Record<string, string> = {
  local: "#6b7280",
  s3: "#f97316",
  "google-drive": "#3b82f6",
}

export const PROVIDER_LABELS: Record<string, string> = {
  local: "local",
  s3: "S3",
  "google-drive": "Google Drive",
}

export function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? "#94a3b8"
}

export function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider
}

export function shadeColor(hex: string, amount: number): string {
  const normalized = hex.replace("#", "")
  const num = Number.parseInt(normalized, 16)
  const channels = [num >> 16, (num >> 8) & 0xff, num & 0xff]

  const shaded = channels.map((c) => {
    const target = amount > 0 ? 255 : 0
    const value = Math.round(c + (target - c) * Math.abs(amount))
    return Math.min(255, Math.max(0, value))
  })

  return `#${shaded.map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

export function getChannelColor(provider: string, indexInProvider: number): string {
  const base = getProviderColor(provider)
  if (indexInProvider === 0) return base
  const step = Math.ceil(indexInProvider / 2) * 0.18
  return shadeColor(base, indexInProvider % 2 === 1 ? step : -step)
}
