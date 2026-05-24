"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    OrganizationAddMemberForm
} from "@/features/organizations/organization-add-member-form";
import {useState} from "react";
import {UserPlus} from "lucide-react";
import {Button} from "@/components/ui/button";
import { OrganizationWithMembersAndUsers} from "@/db/schema/03_organization";
import {User} from "@/db/schema/02_user";

type OrganizationAddMemberModalProps = {
    users: User[];
    organization: OrganizationWithMembersAndUsers;
};

export const OrganizationAddMemberModal = ({users, organization}: OrganizationAddMemberModalProps) => {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="w-4 h-4 mr-2"/>
                    Add member
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add member to your organization</DialogTitle>
                    <DialogDescription>Select a user to add to your organization</DialogDescription>
                </DialogHeader>
                <OrganizationAddMemberForm users={users} organization={organization}
                                           onSuccessAction={() => setOpen(!open)}/>
            </DialogContent>
        </Dialog>
    );
};
