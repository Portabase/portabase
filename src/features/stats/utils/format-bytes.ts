// src/features/stats/utils/format-bytes.ts
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return "0 Mo"
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} Go`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} Mo`
  return `${(bytes / 1024).toFixed(0)} Ko`
}

export function getByteUnit(maxBytes: number): "Go" | "Mo" {
  return maxBytes >= 1_073_741_824 ? "Go" : "Mo"
}

export function bytesToUnit(bytes: number, unit: "Go" | "Mo"): number {
  return unit === "Go" ? bytes / 1_073_741_824 : bytes / 1_048_576
}
