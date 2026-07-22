export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes === 0) return "0 Mb";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} Gb`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} Mb`;
  return `${(bytes / 1024).toFixed(0)} Kb`;
}

export function getByteUnit(maxBytes: number): "Gb" | "Mb" {
  return maxBytes >= 1_073_741_824 ? "Gb" : "Mb";
}

export function bytesToUnit(bytes: number, unit: "Gb" | "Mb"): number {
  return unit === "Gb" ? bytes / 1_073_741_824 : bytes / 1_048_576;
}
