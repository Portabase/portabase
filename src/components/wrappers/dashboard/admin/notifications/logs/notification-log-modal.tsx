"use client";
import {
  Eye,
  Braces,
  Database,
  AlertCircle,
  Hash,
  Server,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NotificationLogWithRelations } from "@/db/services/notification-log";

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
      <DialogContent className="sm:max-w-xl bg-[#fafafa] dark:bg-background">
        <DialogHeader>
          <DialogTitle>Notification Details</DialogTitle>
          <DialogDescription>Execution logs and payload data</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto px-1 pb-2">
          <div className="relative border rounded-xl bg-card shadow-sm flex flex-col">
            <div className="bg-blue-50 dark:bg-blue-950/30 border-b px-4 py-2.5 flex items-center gap-2 rounded-t-xl">
              <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded-md">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-semibold text-sm text-blue-900 dark:text-blue-300">
                Event Trigger
              </span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  Title
                </span>
                <span className="text-sm">{notificationLog.content.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  Message
                </span>
                <span className="text-sm">
                  {notificationLog.content.message}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-background z-10" />
          </div>

          <div className="w-px h-6 bg-border mx-auto -my-4 relative z-0" />

          {notificationLog.payload &&
            Object.keys(notificationLog.payload).length > 0 && (
              <div className="relative border rounded-xl bg-card shadow-sm flex flex-col">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 rounded-full border-2 border-background z-10" />

                <div className="bg-purple-50 dark:bg-purple-950/30 border-b px-4 py-2.5 flex items-center justify-between rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-purple-100 dark:bg-purple-900 rounded-md">
                      <Braces className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-semibold text-sm text-purple-900 dark:text-purple-300">
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
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 rounded-full border-2 border-background z-10" />
                )}
              </div>
            )}

          {troubleshooting && (
            <>
              <div className="w-px h-6 bg-border mx-auto -my-4 relative z-0" />

              <div className="relative border border-amber-200 dark:border-amber-900/50 rounded-xl bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-background shadow-sm flex flex-col">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-500 rounded-full border-2 border-background z-10" />

                <div className="bg-amber-100/50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2.5 flex items-center justify-between rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-amber-200 dark:bg-amber-800 rounded-md">
                      <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                    </div>
                    <span className="font-semibold text-sm text-amber-900 dark:text-amber-300">
                      Suggested Resolution
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-2">
                  <h4 className="text-sm font-semibold text-amber-950 dark:text-amber-100">
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
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
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
