"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateOrg } from "@/features/onboarding/hooks/use-create-org";

export const StepOrgCreate = () => {
  const { state } = useOnboarding();
  const existingOrg = state?.context.flowData.org;
  const isEditMode = !!existingOrg;
  const [name, setName] = useState(existingOrg?.name ?? "");

  const mutation = useCreateOrg();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {isEditMode ? "Edit your organisation" : "Create your organisation"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditMode
            ? "Rename your organisation."
            : "This step can't be skipped."}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="org-name">Organisation name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Inc."
        />
      </div>
      <Button
        type="button"
        onClick={() => mutation.mutate(name)}
        disabled={!name.trim() || mutation.isPending}
      >
        {mutation.isPending
          ? isEditMode
            ? "Saving…"
            : "Creating…"
          : "Continue"}
      </Button>
    </div>
  );
};
