
export function estimateInstanceAgeDays(
    instanceAge: string | null,
    now: Date = new Date(),
): number | null {
    if (!instanceAge) return null;

    const createdAt = new Date(instanceAge);
    if (Number.isNaN(createdAt.getTime())) return null;

    return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000)));
}
