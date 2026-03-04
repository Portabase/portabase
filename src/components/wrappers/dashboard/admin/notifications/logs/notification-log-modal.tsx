"use client";
import {
  AlertCircle,
  Braces,
  Database,
  ExternalLink,
  Eye,
  Hash,
  Server,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { NotificationLogWithRelations } from "@/db/services/notification-log";

type NotificationLogModalProps = {
  notificationLog: NotificationLogWithRelations;
};

const getTroubleshootingForError = (errorMsg?: any) => {
  if (!errorMsg || String(errorMsg).toLowerCase() === "null") return null;

  const msg = String(errorMsg).toLowerCase();

  if (msg.includes("database connection") || msg.includes("agent")) {
    return {
      title: "Agent Connection Issue",
      resolution:
        "It appears the agent cannot reach the database. Please ensure that your agent is actively running, your PostgreSQL credentials are correct, and port 5432 is open on your firewall.",
      docLink:
        "https://portabase.io/docs/agent/troubleshooting/agent-connection",
    };
  }

  if (msg.includes("timeout")) {
    return {
      title: "Timeout",
      resolution:
        "The agent is taking too long to respond. This could be due to high server load, network issues, or a large database.",
      docLink: "https://portabase.io/docs/agent/troubleshooting/timeout",
    };
  }

  return {
    title: "Unexpected Execution Error",
    resolution:
      "An unexpected error occurred during execution. Please review the raw system logs or contact support if the issue persists.",
    docLink: "https://discord.gg/Wgv7xZ8fWJ",
  };
};

const getIconForKey = (key: string, value: any) => {
  const isActualError =
    key.toLowerCase().includes("error") &&
    value !== null &&
    String(value).toLowerCase() !== "null";

  if (key.toLowerCase().includes("id"))
    return <Hash className="w-3.5 h-3.5 text-muted-foreground" />;
  if (key.toLowerCase().includes("host"))
    return <Server className="w-3.5 h-3.5 text-muted-foreground" />;
  if (isActualError)
    return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
  return <Database className="w-3.5 h-3.5 text-muted-foreground" />;
};

export const NotificationLogModal = ({
  notificationLog,
}: NotificationLogModalProps) => {
  const [open, setOpen] = useState(false);

  // TODO : to be fixed
  // @ts-ignore
  const payloadError = notificationLog.payload?.error;
  const troubleshooting = getTroubleshootingForError(payloadError);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="relative"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-background">
        <DialogHeader>
          <DialogTitle>Notification Details</DialogTitle>
          <DialogDescription>Execution logs and payload data</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto px-1 pb-2">
          <div className="relative border rounded-xl bg-card shadow-sm flex flex-col">
            <div className="bg-primary/5 border-b px-4 py-2.5 flex items-center gap-2 rounded-t-xl">
              <div className="p-1 bg-primary/10 rounded-md">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm text-primary">
                Event Trigger
              </span>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                <span className="text-xs font-medium text-muted-foreground min-w-20 pt-0.5">
                  Title
                </span>
                <span className="text-sm sm:text-right flex-1 wrap-break-words">
                  {notificationLog.content.title}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4">
                <span className="text-xs font-medium text-muted-foreground min-w-20 pt-0.5">
                  Message
                </span>
                <span className="text-sm sm:text-right flex-1 wrap-break-word text-muted-foreground">
                  {notificationLog.content.message}
                </span>
              </div>
            </div>
            {notificationLog.payload && (
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background z-10" />
                )}
          </div>

          <div className="w-px h-6 bg-border mx-auto -my-4 relative z-0" />

          {notificationLog.payload &&
            Object.keys(notificationLog.payload).length > 0 && (
              <div className="relative border rounded-xl bg-card shadow-sm flex flex-col">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background z-10" />

                <div className="bg-primary/5 border-b px-4 py-2.5 flex items-center justify-between rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-primary/10 rounded-md">
                      <Braces className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-sm text-primary">
                      JSON Payload
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  {Object.entries(notificationLog.payload).map(
                    ([key, value], index, arr) => {
                      const isActualError =
                        key === "error" &&
                        value !== null &&
                        String(value).toLowerCase() !== "null";

                      return (
                        <div
                          key={key}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50 transition-colors ${
                            index !== arr.length - 1
                              ? "border-b border-border/50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-[150px]">
                            {getIconForKey(key, value)}
                            <span className="text-sm font-medium">{key}</span>
                          </div>
                          <div className="flex-1 sm:text-right">
                            {isActualError ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-mono break-all">
                                {String(value)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md break-all">
                                {String(value)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                {troubleshooting && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background z-10" />
                )}
              </div>
            )}

          {troubleshooting && (
            <>
              <div className="w-px h-6 bg-border mx-auto -my-4 relative z-0" />

              <div className="relative border border-destructive/20 rounded-xl bg-gradient-to-b from-destructive/5 to-transparent shadow-sm flex flex-col">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-destructive rounded-full border-2 border-background z-10" />

                <div className="bg-destructive/10 border-b border-destructive/10 px-4 py-2.5 flex items-center justify-between rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-destructive/20 rounded-md">
                      <Sparkles className="w-4 h-4 text-destructive" />
                    </div>
                    <span className="font-semibold text-sm text-destructive">
                      Suggested Resolution
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {troubleshooting.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {troubleshooting.resolution}
                  </p>
                  <div className="mt-2">
                    <a
                      href={troubleshooting.docLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors"
                    >
                      Read the documentation{" "}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
