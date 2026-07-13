"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Organization } from "@/db/schema/03_organization";
import {AdminUserForm} from "@/features/users/components/admin-user-form";

type AdminUserAddModalProps = {
    organizations: Organization[];
};

export const AdminUserAddModal = ({ organizations }: AdminUserAddModalProps) => {

    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus /> Create a user
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new user</DialogTitle>
                    <DialogDescription>To create a new user please provide following informations</DialogDescription>
                        <AdminUserForm organizations={organizations} onSuccess={() => setOpen(false)} />
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};
