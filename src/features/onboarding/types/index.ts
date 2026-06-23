export type OnboardingSsoProvider = { id: string; label: string; icon: string; description?: string };
export type OnboardingOAuthProvider = { id: string; label: string; icon: string };

export type OnboardingMeta = {
  passkeyEnabled: boolean;
  hasExistingUsers: boolean;
  ssoProviders: OnboardingSsoProvider[];
  oauthProviders: OnboardingOAuthProvider[];
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
  organizationId?: string | null;
};

export type AvatarMode = 'internal' | 'gravatar' | 'dicebear';

export type OnboardingDefaultsData = {
  notifierId?: string;
  storageId?: string;
  avatarMode?: AvatarMode;
  dicebearStyle?: string;
};

export type OnboardingAgent = {
  id: string;
  name: string;
  edgeKey?: string;
  connected?: boolean;
  notifierId?: string;
  storageId?: string;
};

export type OnboardingDatabase = {
  id: string;
  name: string;
  engine: "postgres" | "mysql" | "mongodb";
};

export type SectionKind =
  | "retention"
  | "scheduling"
  | "notifications"
  | "storage";

export type EventKind =
  | "error_backup"
  | "error_restore"
  | "success_restore"
  | "success_backup"
  | "weekly_report"
  | "error_health_agent"
  | "error_health_database";

export type OnboardingNotificationPolicy = {
  channelId: string;
  eventKinds: EventKind[];
  enabled: boolean;
};

export type OnboardingStoragePolicy = {
  channelId: string;
  enabled: boolean;
};

export type OnboardingDbSettings = {
  retention?: {
    type?: "count" | "days" | "gfs";
    count: number;
    days: number;
    gfs: {
      daily: number;
      weekly: number;
      monthly: number;
      yearly: number;
    };
  };
  backupMethod?: "manual" | "automatic";
  backupCron?: string;
  notificationPolicies?: OnboardingNotificationPolicy[];
  storagePolicies?: OnboardingStoragePolicy[];
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
