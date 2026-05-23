"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type agentRegistrationDialogProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

export const AgentRegistrationDialog = (props: agentRegistrationDialogProps) => {
    const { open, setOpen } = props;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New agent registered!</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            CONNECTION KEY
                        </Label>
                        <Input id="name" value="Pedro Duarte" readOnly className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
