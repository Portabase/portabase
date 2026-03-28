export type ProviderKind = 'slack' | 'smtp' | 'discord' | 'telegram' | 'gotify' | 'ntfy' | 'webhook';

export interface DispatchResult {
    success: boolean;
    channelId?: string;
    provider: ProviderKind | null;
    message?: string;
    error?: string;
    response?: any;
}

export interface EventPayload {
    title: string;
    message: string;
    level: 'critical' | 'warning' | 'info';
    timestamp?: Date;
    event?: EventKind
    data?: Record<string, any>;
}

export type EventKind = ("error_backup" | "error_restore" | "success_restore" | "success_backup" | "weekly_report")
