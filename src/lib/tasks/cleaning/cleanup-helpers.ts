const MS_PER_DAY = 86_400_000;

export function cutoffFrom(now: Date, retentionDays: number): Date {
    return new Date(now.getTime() - retentionDays * MS_PER_DAY);
}