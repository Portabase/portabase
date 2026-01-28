"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {OrganizationForm} from "@/features/organization/components/organization.form";
import {useState} from "react";
import {Button, buttonVariants} from "@/components/ui/button";
import {GearIcon} from "@radix-ui/react-icons";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {User} from "@/db/schema/02_user";
import {User as BetterAuthUser} from "better-auth";

type EditOrganizationDialogProps = {
    children?: React.ReactNode;
    organization: OrganizationWithMembers;
    users: User[];
    currentUser: BetterAuthUser;
};

export const EditOrganizationDialog = ({children, organization, users, currentUser}: EditOrganizationDialogProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button variant="outline">
                        <GearIcon className="w-4 h-4 mr-2"/> Edit
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit {organization.name}</DialogTitle>
                </DialogHeader>
                <OrganizationForm 
                    onSuccess={() => setOpen(false)} 
                    defaultValues={organization}
                    users={users}
                    currentUser={currentUser}
                />
            </DialogContent>
        </Dialog>
    );
};
