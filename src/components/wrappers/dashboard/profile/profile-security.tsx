"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {Badge} from "@/components/ui/badge";
import {Globe, LogOut, Loader2} from "lucide-react";
import {Account, Session, User} from "@/db/schema/02_user";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {revokeAllSessionsAction, revokeSessionAction} from "./actions/security.action";
import {useRouter} from "next/navigation";
import {ResetPasswordProfileProviderModal} from "./modal/reset-password-modal";
import {SetPasswordProfileProviderModal} from "./modal/set-password-modal";
import {Setup2FAProfileProviderModal} from "./modal/setup-2fa-modal";
import {Disable2FAProfileProviderModal} from "./modal/disable-2fa-modal";
import {ViewBackupCodesModal} from "./modal/view-backup-codes-modal";
import {getDeviceDetails} from "@/utils/detection";
import {timeAgo} from "@/utils/date-formatting";

interface ProfileSecurityProps {
    user: User;
    sessions: Session[];
    credentialAccount: Account;
    currentSession: Session;
}

export function ProfileSecurity({user, sessions, credentialAccount, currentSession}: ProfileSecurityProps) {
    const router = useRouter();

    const [isBackupCodesDialogOpen, setIsBackupCodesDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isSetup2FADialogOpen, setIsSetup2FADialogOpen] = useState(false);
    const [isDisable2FADialogOpen, setIsDisable2FADialogOpen] = useState(false);

    const {mutate: revokeSession, isPending: isRevoking} = useMutation({
        mutationFn: async (token: string) => {
            const result = await revokeSessionAction({token});
            const inner = result?.data;
            if (inner?.success) {
                toast.success("Session successfully revoked");
                router.refresh();
            } else {
                toast.error("An error occurred while revoking session");
            }
        },
    });

    const {mutate: revokeOthers, isPending: isRevokingOthers} = useMutation({
        mutationFn: async () => {
            const result = await revokeAllSessionsAction();
            const inner = result?.data;
            if (inner?.success) {
                toast.success("Revoking all sessions successfully done.");
                router.refresh();
            } else {
                toast.error("An error occurred while revoking all sessions");
            }
        },
    });

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Security Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your password, two-factor authentication and
                    sessions.</p>
            </div>

            <div className="space-y-6">
                <h3 className="text-lg font-medium">Authentication</h3>
                <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="font-medium">Password</div>
                            <div className="text-sm text-muted-foreground">
                                {/*{user.lastChangedPasswordAt*/}
                                {/*    ? t("sections.authentication.password.description.last_changed", {*/}
                                {/*          date: timeAgo(new Date(user.lastChangedPasswordAt), locale),*/}
                                {/*      })*/}
                                {/*    : "Never changed"}*/}
                            </div>
                        </div>
                        {credentialAccount ? (
                            <ResetPasswordProfileProviderModal open={isPasswordDialogOpen}
                                                               onOpenChange={setIsPasswordDialogOpen}/>
                        ) : (
                            <SetPasswordProfileProviderModal open={isPasswordDialogOpen}
                                                             onOpenChange={setIsPasswordDialogOpen}/>
                        )}
                    </div>

                    <Separator/>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="font-medium">Two-Factor Authentication</div>
                                {user.twoFactorEnabled && (
                                    <Badge variant="secondary"
                                           className="text-[10px] h-5 px-1.5 text-green-600 bg-green-500/10 border-0">
                                        Active
                                    </Badge>
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">Enhance the security of your account by
                                requiring a second form of verification during login.
                            </div>
                        </div>

                        {user.twoFactorEnabled ? (
                            <div className="flex flex-col items-center gap-2">
                                <ViewBackupCodesModal open={isBackupCodesDialogOpen}
                                                      onOpenChange={setIsBackupCodesDialogOpen}/>
                                <Disable2FAProfileProviderModal open={isDisable2FADialogOpen}
                                                                onOpenChange={setIsDisable2FADialogOpen}/>
                            </div>
                        ) : (
                            <Setup2FAProfileProviderModal open={isSetup2FADialogOpen}
                                                          onOpenChange={setIsSetup2FADialogOpen}/>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Active Sessions</h3>
                    {sessions && sessions.length > 1 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => revokeOthers()}
                            disabled={isRevokingOthers || (sessions?.length || 0) <= 1}
                        >
                            {isRevokingOthers && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Revoke All
                        </Button>
                    )}
                </div>
                <div className="border rounded-lg divide-y">
                    {sessions && sessions.length > 0 ? (
                        sessions?.map((session) => (
                            <SessionRow
                                key={session.id}
                                session={session}
                                onRevoke={(token) => revokeSession(token)}
                                isRevoking={isRevoking}
                                currentSession={currentSession}
                            />
                        ))
                    ) : (
                        <div className="p-4 text-center text-muted-foreground">No active sessions found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SessionRow({
                        session,
                        onRevoke,
                        isRevoking,
                        currentSession,
                    }: {
    session: Session;
    onRevoke: (token: string) => void;
    isRevoking: boolean;
    currentSession: Session;
}) {
    const deviceInfo = getDeviceDetails(session.userAgent);

    return (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <deviceInfo.Icon className="w-5 h-5"/>
                </div>
                <div className="space-y-0.5">
                    <div className="text-sm font-medium flex items-center gap-2">
                        {deviceInfo.os} <span
                        className="text-muted-foreground font-normal">• {deviceInfo.browser}</span>
                        {session.id === currentSession.id && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-5 px-1.5 text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-400"
                            >
                                This device
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3"/> {session.ipAddress} •
                        <span className="ml-1">
                            {session.id === currentSession.id
                                ? "Active now"
                                : `Last active ${timeAgo(new Date(session.createdAt))}`}
                        </span>
                    </div>
                </div>
            </div>

            {session.id !== currentSession.id && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRevoke(session.token)}
                    disabled={isRevoking}
                >
                    {isRevoking ? <Loader2 className="h-4 w-4 animate-spin"/> : <LogOut className="w-4 h-4"/>}
                    <span className="sr-only">Revoke</span>
                </Button>
            )}
        </div>
    );
}
