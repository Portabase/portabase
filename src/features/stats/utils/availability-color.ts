export type StatusColor = "red" | "orange" | "green" | "neutral" | "unknown"

export function getAvailabilityColor(pct: number): StatusColor {
  if (pct < 60) return "red"
  if (pct < 80) return "orange"
  return "green"
}

export const STATUS_COLOR_MAP: Record<StatusColor, string> = {
  red: "bg-red-500",
  orange: "bg-orange-400",
  green: "bg-green-500",
  neutral: "bg-muted",
  unknown: "bg-gray-300 dark:bg-gray-600",
}
