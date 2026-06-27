"use client"

import {CreateOrganizationModal} from "@/features/organizations/components/organization-create-modal";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth/auth-client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Plus} from "lucide-react";

type AdminOrganizationAddModalProps = {}


export const AdminOrganizationAddModal = (props: AdminOrganizationAddModalProps) => {
    const router = useRouter();
    const {data: organizations, refetch} = authClient.useListOrganizations();
    const {data: activeOrganization, refetch: refetchActiveOrga} = authClient.useActiveOrganization();
    const [openModal, setOpenModal] = useState(false);

    if (!organizations) return null;


    const handleReload = () => {
        refetch();
        refetchActiveOrga();
        router.refresh();
    };

    const handleOpen = () => {
        setOpenModal(true);
    }


    return (
        <>

            <Button onClick={handleOpen}>
                <Plus/> Create a new organization
            </Button>
            <CreateOrganizationModal
                redirect={"/dashboard/admin/organizations"}
                open={openModal}
                onSuccess={handleReload}
                onOpenChange={setOpenModal}
            />
        </>
    )
}


