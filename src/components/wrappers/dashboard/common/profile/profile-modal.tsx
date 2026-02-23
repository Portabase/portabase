"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProfileSidebar } from "./profile-sidebar";
import type { AuthProviderConfig } from "@/lib/auth/config";
import { User, Session, Account } from "@/db/schema/02_user";
import { ProfileGeneral } from "../../profile/profile-general";
import { ProfileSecurity } from "../../profile/profile-security";
import { ProfileProviders } from "../../profile/profile-providers";
import { ProfileAccount } from "../../profile/profile-account";
import { ProfileAppearance } from "../../profile/profile-apperance";

type ProfileModalProps = {
    open: boolean;
    user: User;
    sessions: Session[];
    currentSession: Session;
    accounts: Account[];
    onOpenChange: (open: boolean) => void;
    providers: AuthProviderConfig[];
};

export const ProfileModal = ({ user, sessions, currentSession, accounts, open, onOpenChange, providers }: ProfileModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] h-[90vh] max-w-md lg:max-w-[1000px] lg:h-[800px] pb-6 p-0 overflow-hidden flex flex-col outline-none gap-0 rounded-xl bg-background">
                <DialogHeader className="sr-only">
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>Manage your account settings</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="profile" orientation="vertical" className="flex flex-col lg:flex-row h-full w-full">
                    <ProfileSidebar user={user} />

                    <div className="flex-1 overflow-y-auto bg-background h-full scroll-smooth">
                        <TabsContent value="profile" className="mt-0 h-full p-6 lg:p-10 outline-none focus-visible:ring-0">
                            <ProfileGeneral user={user} />
                        </TabsContent>

                        <TabsContent value="security" className="mt-0 h-full p-6 lg:p-10 outline-none focus-visible:ring-0">
                            <ProfileSecurity
                                user={user}
                                sessions={sessions}
                                currentSession={currentSession}
                                credentialAccount={accounts.find((acc) => acc.providerId === "credential")!}
                                isPasswordEnabled={providers.some((p) => p.id === "credential")}
                                isPasskeyEnabled={providers.some((p) => p.id === "passkey")}
                                providers={providers}
                            />
                        </TabsContent>

                        <TabsContent value="providers" className="mt-0 h-full p-6 lg:p-10 outline-none focus-visible:ring-0">
                            <ProfileProviders accounts={accounts} providers={providers} />
                        </TabsContent>

                        <TabsContent value="account" className="mt-0 h-full p-6 lg:p-10 outline-none focus-visible:ring-0">
                            <ProfileAccount user={user} />
                        </TabsContent>

                        <TabsContent value="appearance" className="mt-0 h-full p-6 lg:p-10 outline-none focus-visible:ring-0">
                            <ProfileAppearance />
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
