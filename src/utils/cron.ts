const cronBounds: Record<string, [number, number]> = {
    minute: [0, 59],
    hour: [0, 23],
    "day-of-month": [1, 31],
    month: [1, 12],
    "day-of-week": [0, 6],
};

const isNumberInRange = (value: string, min: number, max: number): boolean => {
    if (!/^\d+$/.test(value)) return false;
    const n = Number(value);
    return n >= min && n <= max;
};

const isRangeOrNumber = (value: string, min: number, max: number): boolean => {
    const range = value.match(/^(\d+)-(\d+)$/);
    if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        return isNumberInRange(range[1], min, max) && isNumberInRange(range[2], min, max) && start <= end;
    }
    return isNumberInRange(value, min, max);
};

export const isValidCronPart = (type: string, value: string): boolean => {
    const bounds = cronBounds[type];
    if (!bounds) return false;
    const [min, max] = bounds;

    return value.split(",").every((rawPart) => {
        const part = rawPart.trim();
        if (part === "") return false;

        const step = part.match(/^(.+)\/(\d+)$/);
        if (step) {
            const base = step[1];
            const stepValue = Number(step[2]);
            if (!/^\d+$/.test(step[2]) || stepValue < 1 || stepValue > max) return false;
            if (base === "*") return true;
            return isRangeOrNumber(base, min, max);
        }

        if (part === "*") return true;

        return isRangeOrNumber(part, min, max);
    });
};
