"use client";

import {Building2, Shield, Users} from "lucide-react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {MemberWithUser, OrganizationWithMembersAndUsers} from "@/db/schema/03_organization";
import {
    UpdateOrganizationForm
} from "@/features/organizations/components/update-organization-form";
import {
    OrganizationMemberCard
} from "@/features/organizations/components/organization-member-card";
import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useState} from "react";
import {capitalizeFirstLetter} from "@/utils/text";
import {User} from "@/db/schema/02_user";
import {
    OrganizationAddMemberModal
} from "@/features/organizations/components/organization-add-member-modal";
import {cn} from "@/lib/utils";
import {useAcl} from "@/lib/acl/acl-context";

type OrganizationManagementProps = {
    organization: OrganizationWithMembersAndUsers;
    users: User[];
};

export const OrganizationManagement = ({organization, users}: OrganizationManagementProps) => {

    const {isDemoEnabled} = useAcl();
    const isDemoBlocked = isDemoEnabled && organization.slug === "default";
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState<string>(() => searchParams.get("tab") ?? "members");

    useEffect(() => {
        const newTab = searchParams.get("tab") ?? "members";
        setTab(newTab);
    }, [searchParams]);

    const handleChangeTab = (value: string) => {
        router.push(`?tab=${value}`);
    };

    return (
        <div className=" space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 dark:bg-gray-700 bg-gray-100 rounded-lg">
                        <Building2 className="w-6 h-6 "/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{capitalizeFirstLetter(organization.name)}</h1>
                    </div>
                </div>
                <div className="flex items-center space-x-2 mt-3 md:mt-0">
                    <OrganizationAddMemberModal organization={organization} users={users} disabled={isDemoBlocked}/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{organization.members.length}</div>
                        <p className="text-xs text-muted-foreground">Number of members</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground"/>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="text-2xl font-bold">{organization.members.filter((m) => m.role === "admin" || m.role === "owner").length}</div>
                        <p className="text-xs text-muted-foreground">With admin roles</p>
                    </CardContent>
                </Card>
            </div>
            <Tabs className="space-y-6" value={tab} onValueChange={handleChangeTab}>
                <TabsList>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger  value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="members" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization members</CardTitle>
                            <CardDescription>Manage who has access to your organization and their
                                roles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {organization.members.map((member: MemberWithUser) => (
                                    <OrganizationMemberCard key={member.id} member={member}
                                                            organization={organization} disabled={isDemoBlocked}/>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>Organization configuration settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <UpdateOrganizationForm defaultValues={organization} disabled={isDemoBlocked}/>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
