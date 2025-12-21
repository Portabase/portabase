"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SetPasswordForm from "../form/set-password-form";

type SetPasswordModalProps = {
    onOpenChange: (open: boolean) => void;
    open: boolean;
};

export function SetPasswordProfileProviderModal({ onOpenChange, open }: SetPasswordModalProps) {

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="default" size="sm">
                    Set Password
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set Password</DialogTitle>
                    <DialogDescription>Create a password for your account to enable password-based login.</DialogDescription>
                </DialogHeader>

                <SetPasswordForm onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}

