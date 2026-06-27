export type LevelType = "info" | "debug" | "error" | "warn";
export type EntryType = "log" | "command";

export interface JobLogEntry {
    timestamp: string
    type: EntryType
    level: LevelType
    message: string
    command?: string
    output?: string
    exit_code?: number
    duration_ms?: number
}

