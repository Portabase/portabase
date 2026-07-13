"use client";

import { Check, ChevronRight, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OnboardingDatabase } from "@/features/onboarding/types";

type DbGridProps = {
  databaseIds: string[];
  getDb: (id: string) => OnboardingDatabase | undefined;
  isDbConfigured: (id: string) => boolean;
  onSelectDb: (id: string) => void;
  onContinue: () => void;
};

export const DbGrid = ({
  databaseIds,
  getDb,
  isDbConfigured,
  onSelectDb,
  onContinue,
}: DbGridProps) => (
  <div className="flex flex-col gap-4">
    <div>
      <h1 className="text-2xl font-semibold">Configure databases</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Optional — configure backup policies for each database.
      </p>
    </div>
    <div className="flex flex-col gap-2 max-h-52 sm:max-h-72 md:max-h-96 lg:max-h-[28rem] overflow-y-auto scrollbar-hide">
      {databaseIds.map((dbId) => {
        const db = getDb(dbId);
        return (
          <button
            key={dbId}
            type="button"
            onClick={() => onSelectDb(dbId)}
            className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-all text-left hover:bg-accent/50 hover:border-primary/20"
          >
            <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
              <Database className="size-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="font-medium">{db?.name ?? dbId}</span>
              <span className="text-xs text-muted-foreground capitalize">{db?.engine}</span>
            </div>
            {isDbConfigured(dbId) && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Check className="size-3 mr-1" />
                Configured
              </Badge>
            )}
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          </button>
        );
      })}
    </div>
    <Button type="button" onClick={onContinue}>Continue</Button>
  </div>
);
