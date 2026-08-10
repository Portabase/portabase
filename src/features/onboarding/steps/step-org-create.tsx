"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRenameDefaultOrg } from "@/features/onboarding/hooks/use-rename-default-org";
import { getOrganizationDisplayName } from "@/features/organizations/utils/get-organization-display-name";
import { DEFAULT_ORGANIZATION_NAME } from "@/features/organizations/constants";

export const StepOrgCreate = () => {
  const { state } = useOnboarding();
  const existingOrg = state?.context.flowData.org;
  const [name, setName] = useState(
    existingOrg?.name ?? DEFAULT_ORGANIZATION_NAME,
  );

  const mutation = useRenameDefaultOrg();

  const trimmed = name.trim();
  const previewName = getOrganizationDisplayName({
    name: trimmed,
    slug: "default",
  });
  const showPreview = trimmed.length > 0 && previewName !== trimmed;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Name your default organisation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          This is your default organisation (identifier:{" "}
          <code className="font-mono">default</code>). Rename it to anything you
          like - the identifier stays the same.
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
        {showPreview && (
          <p className="text-sm text-muted-foreground">
            Will appear as{" "}
            <span className="font-medium text-foreground">{previewName}</span>
          </p>
        )}
      </div>
      <Button
        type="button"
        onClick={() => mutation.mutate(name)}
        disabled={!trimmed || mutation.isPending}
      >
        {mutation.isPending ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
};
