"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { OnboardingMember } from "@/features/onboarding/types";

export const StepInviteMembers = () => {
  const { next, updateContext, state } = useOnboarding();
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<OnboardingMember[]>([]);

  const addMember = () => {
    if (!email.trim()) return;
    setMembers((prev) => [...prev, { email: email.trim(), role: "member" }]);
    setEmail("");
  };

  const removeMember = (target: string) => {
    setMembers((prev) => prev.filter((m) => m.email !== target));
  };

  const onContinue = async () => {
    await updateContext({ flowData: { ...state?.context.flowData, members } });
    await next();
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Invite your team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — you can always invite people later.
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@portabase.io"
          onKeyDown={(e) => e.key === "Enter" && addMember()}
        />
        <Button type="button" variant="outline" onClick={addMember}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <Badge key={member.email} variant="secondary" className="gap-1">
            {member.email}
            <button type="button" onClick={() => removeMember(member.email)}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Button type="button" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
};
