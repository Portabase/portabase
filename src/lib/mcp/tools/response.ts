export function ok(data: unknown) {
    return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
}

export function err(message: string) {
    return {
        content: [{ type: "text" as const, text: message }],
        isError: true as const,
    };
}