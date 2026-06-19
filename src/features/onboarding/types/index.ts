export type OnboardingSsoProvider = { id: string; label: string };

export type OnboardingMeta = {
  passkeyEnabled: boolean;
  hasExistingUsers: boolean;
  ssoProviders: OnboardingSsoProvider[];
  defaultUserMode: boolean;
  resumeStepId: string;
  emailPasswordEnabled: boolean;
};

export type OnboardingAccountData = {
  firstName: string;
  lastName: string;
  email: string;
};

export type OnboardingSecurityData = {
  method: "passkey" | "two-factor" | "skipped";
};

export type OnboardingPreferencesData = {
  theme: "light" | "dark";
  avatarUrl?: string;
};

export type OnboardingOrgData = {
  id: string;
  name: string;
};

export type OnboardingMember = {
  email: string;
  role: "member" | "admin";
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
  edgeKey?: string;
  notifierId?: string;
  storageId?: string;
};

export type OnboardingDatabase = {
  id: string;
  name: string;
  engine: "postgres" | "mysql" | "mongodb";
};

export type OnboardingDbSettings = {
  retentionDays: number;
  notifierId?: string;
  storageId?: string;
};

export type OnboardingProjectData = {
  id: string;
  name: string;
  description: string;
  databaseIds: string[];
};

export type OnboardingFlowData = {
  meta?: OnboardingMeta;
  account?: OnboardingAccountData;
  security?: OnboardingSecurityData;
  preferences?: OnboardingPreferencesData;
  org?: OnboardingOrgData;
  members?: OnboardingMember[];
  notifiers?: OnboardingChannel[];
  storages?: OnboardingChannel[];
  defaults?: OnboardingDefaultsData;
  agents?: OnboardingAgent[];
  databases?: OnboardingDatabase[];
  project?: OnboardingProjectData;
  dbSettings?: Record<string, OnboardingDbSettings>;
};
