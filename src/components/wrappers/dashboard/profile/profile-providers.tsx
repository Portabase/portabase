"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SetPasswordProfileProviderModal } from "./modal/set-password-modal";
import { Icon } from "@iconify/react";
import Image from "next/image";
import type { AuthProviderConfig } from "@/lib/auth/config";
import type { Account } from "@/db/schema/02_user";

interface ProfileProviderProps {
  accounts: Account[];
  providers: AuthProviderConfig[];
}

export function ProfileProviders({
  accounts,
  providers,
}: ProfileProviderProps) {
  const router = useRouter();
  const totalConnected = accounts.length;
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const { mutate: unlinkAccount } = useMutation({
    mutationFn: async (providerId: string) => {
      setLoadingProvider(providerId);
      const { error } = await authClient.unlinkAccount({ providerId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Provider successfully unlinked!");
      setLoadingProvider(null);
      router.refresh();
    },
    onError: () => {
      toast.error("An error occurred while unlinking provider.");
      setLoadingProvider(null);
    },
  });

  const { mutate: linkAccount } = useMutation({
    mutationFn: async (provider: AuthProviderConfig) => {
      setLoadingProvider(provider.id);
      let result;
      if (provider.type === "sso") {
        result = await authClient.signIn.sso({
          providerId: provider.id,
          providerType: "oidc",
          callbackURL: "/dashboard",
        });
      } else {
        result = await authClient.linkSocial({
          provider: provider.id as any,
          callbackURL: "/dashboard",
        });
      }
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      setLoadingProvider(null);
      router.refresh();
    },
    onError: () => {
      toast.error("An error occurred while linking provider.");
      setLoadingProvider(null);
    },
  });

  const enterpriseProviders = providers.filter(
    (p) => p.type === "sso" && p.id !== "passkey" && p.type !== "credential",
  );
  const otherProviders = providers.filter(
    (p) => p.type !== "sso" && p.id !== "passkey" && p.type !== "credential",
  );

  const renderProvider = (provider: AuthProviderConfig) => {
    const linkedAccount = accounts.find(
      (acc) => acc.providerId === provider.id,
    );
    const isConnected = !!linkedAccount;
    const canUnlink =
      totalConnected > 1 || (totalConnected === 1 && !provider.isManual);
    const isLoading = loadingProvider === provider.id;

    const isUnlinkDisabled = !canUnlink || provider.allowUnlinking === false;

    const unlinkButton = (
      <Button
        variant="outline"
        size="sm"
        onClick={() => unlinkAccount(provider.id)}
        disabled={isUnlinkDisabled || isLoading || provider.isManual}
        className={isUnlinkDisabled ? "opacity-50 cursor-not-allowed" : ""}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlink"}
      </Button>
    );

    let actionElement;

    if (!isConnected) {
      actionElement =
        provider.id === "credential" ? (
          <SetPasswordProfileProviderModal
            open={isPasswordDialogOpen}
            onOpenChange={setIsPasswordDialogOpen}
          />
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => linkAccount(provider)}
            disabled={
              isLoading || provider.isManual || provider.allowLinking === false
            }
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link"}
          </Button>
        );
    } else if (isUnlinkDisabled) {
      actionElement = (
        <Tooltip>
          <TooltipTrigger asChild>
            <div tabIndex={0} className="inline-block">
              {unlinkButton}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {provider.allowUnlinking === false
                ? "Unlinking is disabled for this provider."
                : "You cannot unlink your last authentication provider."}
            </p>
          </TooltipContent>
        </Tooltip>
      );
    } else {
      actionElement = unlinkButton;
    }

    return (
      <div
        key={provider.id}
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {provider.icon.startsWith("/") ||
            provider.icon.startsWith("http") ? (
              <Image
                src={provider.icon}
                alt={provider.id}
                width={20}
                height={20}
                className="w-5 h-5"
                unoptimized={provider.icon.startsWith("http")}
              />
            ) : (
              <Icon icon={provider.icon} className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="font-medium flex items-center gap-2">
              {provider.title || provider.name}
              {isConnected && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-5 px-1.5 text-green-600 bg-green-500/10 border-0"
                >
                  Active
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {provider.description}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">{actionElement}</div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 pb-10">
      <div className="mb-6 space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Authentication
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage how you access your account.
        </p>
      </div>

      {enterpriseProviders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Enterprise Connection
          </h3>
          <div className="grid gap-4">
            {enterpriseProviders.map(renderProvider)}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Standard Connections
        </h3>
        <div className="grid gap-4">{otherProviders.map(renderProvider)}</div>
      </div>

      <Alert variant={"default"}>
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <AlertDescription>
          Linked providers allow you to log in to your account using any of
          these methods.
        </AlertDescription>
      </Alert>
    </div>
  );
}
