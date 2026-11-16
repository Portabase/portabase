/**
 * Pure 5-field cron helpers (minute hour day-of-month month day-of-week), usable in the browser and
 * on the server. Supports `*`, numbers, ranges `a-b`, steps `* /n` and `a-b/n`, and lists `a,b`.
 */

type CronFields = {
    minute: number[];
    hour: number[];
    dayOfMonth: number[];
    month: number[];
    dayOfWeek: number[];
    dayOfMonthAny: boolean;
    dayOfWeekAny: boolean;
};

const RANGES: [number, number][] = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parsePart(part: string, min: number, max: number): number[] | null {
    const values = new Set<number>();
    for (const item of part.split(",")) {
        const [range, stepText] = item.split("/");
        const step = stepText === undefined ? 1 : Number(stepText);
        if (!Number.isInteger(step) || step < 1) return null;
        let from: number;
        let to: number;
        if (range === "*") {
            [from, to] = [min, max];
        } else {
            const bounds = range.split("-").map(Number);
            from = bounds[0];
            to = bounds.length > 1 ? bounds[1] : stepText === undefined ? from : max;
        }
        if (!Number.isInteger(from) || !Number.isInteger(to) || from < min || to > max || from > to) return null;
        for (let value = from; value <= to; value += step) values.add(value);
    }
    return [...values].sort((first, second) => first - second);
}

export function parseCron(expression: string): CronFields | null {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return null;
    const parsed = parts.map((part, index) => parsePart(part, RANGES[index][0], RANGES[index][1]));
    if (parsed.some((values) => values === null)) return null;
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parsed as number[][];
    return {
        minute,
        hour,
        dayOfMonth,
        month,
        dayOfWeek: dayOfWeek.map((day) => day % 7),
        dayOfMonthAny: parts[2] === "*",
        dayOfWeekAny: parts[4] === "*",
    };
}

function dayMatches(fields: CronFields, day: Date): boolean {
    if (!fields.month.includes(day.getMonth() + 1)) return false;
    const dayOfMonth = fields.dayOfMonth.includes(day.getDate());
    const dayOfWeek = fields.dayOfWeek.includes(day.getDay());
    // Standard cron: when both day fields are restricted, either one matching is enough.
    if (!fields.dayOfMonthAny && !fields.dayOfWeekAny) return dayOfMonth || dayOfWeek;
    return dayOfMonth && dayOfWeek;
}

/** The next `count` occurrences strictly after `after`, looking at most `horizonDays` ahead. */
export function nextRuns(expression: string, after: Date, count: number, horizonDays = 400): Date[] {
    const fields = parseCron(expression);
    if (!fields) return [];
    const runs: Date[] = [];
    const day = new Date(after);
    day.setHours(0, 0, 0, 0);
    for (let offset = 0; offset <= horizonDays && runs.length < count; offset++, day.setDate(day.getDate() + 1)) {
        if (!dayMatches(fields, day)) continue;
        for (const hour of fields.hour) {
            for (const minute of fields.minute) {
                const run = new Date(day);
                run.setHours(hour, minute, 0, 0);
                if (run > after) {
                    runs.push(run);
                    if (runs.length === count) return runs;
                }
            }
        }
    }
    return runs;
}

/** Whether `expression` had an occurrence in (after, until]. */
export function cronFiredBetween(expression: string, after: Date, until: Date): boolean {
    const [next] = nextRuns(expression, after, 1, Math.ceil((until.getTime() - after.getTime()) / 86_400_000) + 1);
    return next !== undefined && next <= until;
}

const pad = (value: string) => value.padStart(2, "0");
const isNumber = (value: string) => /^\d+$/.test(value);

/** Plain words for the schedules the dialog builds; anything else is shown as its expression. */
export function describeCron(expression: string): string {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return expression;
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const time = `${pad(hour)}:${pad(minute)}`;
    const fixedTime = isNumber(minute) && isNumber(hour);
    if (month === "*" && dayOfMonth === "*" && dayOfWeek === "*") {
        if (fixedTime) return `Every day at ${time}`;
        if (isNumber(minute) && hour === "*") return minute === "0" ? "Every hour" : `Every hour at :${pad(minute)}`;
        if (isNumber(minute) && /^\*\/\d+$/.test(hour)) return `Every ${hour.slice(2)} hours at :${pad(minute)}`;
        if (/^\*\/\d+$/.test(minute) && hour === "*") return `Every ${minute.slice(2)} minutes`;
    }
    if (month === "*" && dayOfMonth === "*" && isNumber(dayOfWeek) && fixedTime) {
        return `Every ${WEEKDAYS[Number(dayOfWeek) % 7]} at ${time}`;
    }
    if (month === "*" && dayOfWeek === "*" && isNumber(dayOfMonth) && fixedTime) {
        return `On day ${dayOfMonth} of every month at ${time}`;
    }
    return `Custom schedule (${expression})`;
}
