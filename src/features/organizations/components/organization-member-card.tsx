"use client";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {MoreHorizontal, Settings, Trash2} from "lucide-react";
import {
    OrganizationDeleteMemberModal
} from "@/features/organizations/components/organization-delete-member-modal";
import {useState} from "react";
import {authClient} from "@/lib/auth/auth-client";
import {
    OrganizationMemberChangeRoleModal
} from "@/features/organizations/components/organization-member-change-role";
import {MemberWithUser, OrganizationWithMembersAndUsers} from "@/db/schema/03_organization";
import {formatDayOnly} from "@/utils/date-formatting";

type OrganizationMemberCardProps = {
    member: MemberWithUser;
    organization: OrganizationWithMembersAndUsers;
};

export const OrganizationMemberCard = ({member, organization}: OrganizationMemberCardProps) => {

    const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
    const [isModalRoleOpen, setIsModalRoleOpen] = useState(false);
    const {data: session, isPending, error} = authClient.useSession();

    if (isPending || error) return null;
    const isCurrentUser = session?.user?.id === member.user.id;
    const isOwner = member?.role === "owner";

    return (
        <div key={member.id}
             className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg">
            <OrganizationDeleteMemberModal member={member} open={isModalDeleteOpen}
                                           onOpenChangeAction={setIsModalDeleteOpen}/>
            <OrganizationMemberChangeRoleModal member={member} open={isModalRoleOpen}
                                               onOpenChangeAction={setIsModalRoleOpen}/>
            <div className="flex items-center space-x-4">
                <Avatar>
                    <AvatarImage src={member.user.image || ""} alt={member.user.name}/>
                    <AvatarFallback>
                        {member.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{member.user.name}</div>
                    <div className="text-sm text-muted-foreground">{member.user.email}</div>
                    <div
                        className="text-xs text-muted-foreground">Joined {formatDayOnly(new Date(member.createdAt))}</div>
                </div>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setIsModalRoleOpen(true)}>
                                <Settings className="w-4 h-4 mr-2"/>
                                Change role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem onSelect={() => setIsModalDeleteOpen(true)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2"/>
                                Remove member
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
            </div>
        </div>
    );
};

const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
        case "owner":
            return "default";
        case "admin":
            return "secondary";
        default:
            return "outline";
    }
};
