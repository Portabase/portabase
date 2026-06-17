export type OnboardingSsoConfig = {
    providers: { id: string; label: string }[];
    forced: boolean;
    passkeyEnabled: boolean;
};

export type OnboardingAccountData = {
    name: string;
    email: string;
};

export type OnboardingSecurityData = {
    method: 'passkey' | 'two-factor' | 'skipped';
};

export type OnboardingPreferencesData = {
    theme: 'light' | 'dark';
    avatarDataUrl?: string;
};

export type OnboardingOrgData = {
    name: string;
    logoDataUrl?: string;
};

export type OnboardingMember = {
    email: string;
    role: 'member' | 'admin';
};

export type OnboardingChannel = {
    id: string;
    provider: string;
    label: string;
    name: string;
    config: Record<string, unknown>;
};

export type OnboardingDefaultsData = {
    notifierId?: string;
    storageId?: string;
};

export type OnboardingAgent = {
    id: string;
    name: string;
    notifierId?: string;
    storageId?: string;
};

export type OnboardingMockDatabase = {
    id: string;
    name: string;
    engine: 'postgres' | 'mysql' | 'mongodb';
};

export type OnboardingDbSettings = {
    retentionDays: number;
    notifierId?: string;
    storageId?: string;
};

export type OnboardingProjectData = {
    name: string;
    description: string;
    databaseIds: string[];
};

export type OnboardingFlowData = {
    sso?: { providerId: string };
    account?: OnboardingAccountData;
    security?: OnboardingSecurityData;
    preferences?: OnboardingPreferencesData;
    org?: OnboardingOrgData;
    members?: OnboardingMember[];
    notifiers?: OnboardingChannel[];
    storages?: OnboardingChannel[];
    defaults?: OnboardingDefaultsData;
    agents?: OnboardingAgent[];
    project?: OnboardingProjectData;
    dbSettings?: Record<string, OnboardingDbSettings>;
};
