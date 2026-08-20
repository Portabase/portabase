"use client";

import { Badge } from "@/components/ui/badge";
import { getChannelIcon } from "@/features/channel/components/channels-helpers";
import { BackupWith } from "@/db/schema/07_database";
import { BackupStorageWith } from "@/db/schema/14_storage-backup";
import {
  storagePresenceState,
  StoragePresenceState,
} from "@/features/database/utils/backup-presence.logic";
import { formatLocalizedDate, timeAgo } from "@/utils/date-formatting";

const STATE_STYLES: Record<
  StoragePresenceState,
  { label: string; className: string }
> = {
  present: {
    label: "Present",
    className: "bg-green-400/10 border-green-600/50 text-green-600",
  },
  missing: {
    label: "Missing",
    className: "bg-red-400/10 border-red-600/50 text-red-600",
  },
  unverified: {
    label: "Unverified",
    className: "bg-orange-400/10 border-orange-600/50 text-orange-600",
  },
  pending: {
    label: "Pending",
    className: "bg-gray-400/10 border-gray-600/50 text-gray-600",
  },
};

type BackupPresenceDetailsProps = {
  backup: BackupWith;
};

export const BackupPresenceDetails = ({ backup }: BackupPresenceDetailsProps) => {
  const storages =
    backup.storages?.filter((s) => s.deletedAt === null) ?? [];

  if (storages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This backup has no storage files.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {storages.map((storage: BackupStorageWith) => {
        const state = storagePresenceState(storage);
        const style = STATE_STYLES[state];
        const checked = storage.lastCheckedAt
          ? `${formatLocalizedDate(storage.lastCheckedAt)} (${timeAgo(storage.lastCheckedAt)})`
          : "never";

        return (
          <div
            key={storage.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="shrink-0">
                {getChannelIcon(storage.storageChannel?.provider || "")}
              </div>
              <h3 className="font-medium text-foreground truncate flex-1">
                {storage.storageChannel?.name ?? "storage"}
              </h3>
              <Badge variant="outline" className={`shrink-0 ${style.className}`}>
                {style.label}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              Last check: {checked}
            </div>
            {state === "unverified" && storage.lastCheckError && (
              <div className="text-xs text-orange-600">
                Couldn&apos;t verify: {storage.lastCheckError}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
