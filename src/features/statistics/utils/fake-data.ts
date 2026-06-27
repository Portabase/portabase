type Data = {
    createdAt: Date;
};

/**
 * Generate fake backup events over a time range.
 *
 * @param days        Number of days to generate
 * @param minPerDay   Minimum events per day
 * @param maxPerDay   Maximum events per day
 */
export function generateFakeEvolutionData(
    days: number = 30,
    minPerDay: number = 1,
    maxPerDay: number = 8
): Data[] {
    const result: Data[] = [];
    const now = new Date();

    for (let d = 0; d < days; d++) {
        const day = new Date(now);
        day.setDate(now.getDate() - d);

        const events =
            Math.floor(Math.random() * (maxPerDay - minPerDay + 1)) + minPerDay;

        for (let i = 0; i < events; i++) {
            const createdAt = new Date(day);
            createdAt.setHours(
                Math.floor(Math.random() * 24),
                Math.floor(Math.random() * 60),
                Math.floor(Math.random() * 60)
            );

            result.push({ createdAt });
        }
    }

    return result.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
}
