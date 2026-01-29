"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {OrganizationForm} from "@/features/organization/components/organization.form";
import {ReactNode, useState} from "react";
import {Button, buttonVariants} from "@/components/ui/button";
import {GearIcon} from "@radix-ui/react-icons";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {User} from "@/db/schema/02_user";
import {User as BetterAuthUser} from "better-auth";
import {useRouter} from "next/navigation";

type EditOrganizationDialogProps = {
    organization: OrganizationWithMembers;
    users: User[];
    currentUser: BetterAuthUser;
};

export const EditOrganizationDialog = ({
                                           organization,
                                           users,
                                           currentUser,
                                       }: EditOrganizationDialogProps) => {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className={buttonVariants({variant: "outline", className: "cursor-pointer"})}>
                    <GearIcon className="w-7 h-7"/>
                </div>
            </DialogTrigger>
            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Edit {organization.name}</DialogTitle>
                </DialogHeader>
                <OrganizationForm
                    onSuccess={() => {
                        setOpen(false)
                        router.refresh()
                    }}
                    defaultValues={organization}
                    users={users}
                    currentUser={currentUser}
                />
            </DialogContent>
        </Dialog>
    );
};
