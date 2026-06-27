"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TwoFactorSetupContent } from "./two-factor-setup-content";

type Setup2FAModalProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  disabled: boolean;
};

export function Setup2FAProfileProviderModal({ onOpenChange, open, disabled }: Setup2FAModalProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        <Button variant="outline" size="sm">
          <ShieldCheck className="w-4 h-4 mr-2" />
          Enable Two-Factor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        </DialogHeader>
        <TwoFactorSetupContent onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
