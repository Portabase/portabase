"use client"

import * as React from "react"
import {Building2, Check, ChevronsUpDown, Plus} from "lucide-react"
import {useRouter} from "next/navigation"
import {authClient} from "@/lib/auth/auth-client"
import {cn} from "@/lib/utils"

import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenuButton, useSidebar,
} from "@/components/ui/sidebar"
import {CreateOrganizationModal} from "@/components/wrappers/dashboard/organization/create-organisation-modal"
import {Skeleton} from "@/components/ui/skeleton"


export function OrganizationCombobox() {
    const router = useRouter()
    const {isMobile, state} = useSidebar()
    const {data: organizations, isPending: isPendingList, refetch} = authClient.useListOrganizations()
    const {
        data: activeOrganization,
        isPending: isPendingActive,
        refetch: refetchActiveOrga
    } = authClient.useActiveOrganization()
    const [openModal, setOpenModal] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)

    const handleSelect = async (slug: string) => {
        if (activeOrganization?.slug === slug) return
        await authClient.organization.setActive({organizationSlug: slug})
        router.refresh()
        setIsOpen(false)
    }

    const handleReload = () => {
        refetch();
        refetchActiveOrga();
        router.refresh();
    };

    const orgs = organizations || []

    if (isPendingList || isPendingActive) {
        return (
            <SidebarMenuButton size="lg" className="pointer-events-none">
                <Skeleton className="size-8 rounded-lg shrink-0"/>
                <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
                    <Skeleton className="h-4 w-24"/>
                    <Skeleton className="h-3 w-16"/>
                </div>
                <Skeleton className="size-4 shrink-0"/>
            </SidebarMenuButton>
        )
    }


    return (
        <>
            <CreateOrganizationModal
                open={openModal}
                onSuccess={handleReload}
                onOpenChange={setOpenModal}
            />
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                        size="lg"
                        className={cn(
                            "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200 ease-in-out",
                            state === "collapsed" && "justify-center p-0"
                        )}
                    >
                        <div className={cn(
                            "flex aspect-square size-8 items-center justify-center rounded-lg text-white shadow-sm transition-transform duration-200",
                            activeOrganization?.logo ? "bg-transparent" : "bg-primary",
                            isOpen && "scale-105"
                        )}>
                            {activeOrganization?.logo ? (
                                <img src={activeOrganization.logo} alt={activeOrganization.name}
                                     className="size-8 rounded-lg object-cover"/>
                            ) : (
                                <Building2 className="size-5"/>
                            )}
                        </div>
                        <div
                            className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-semibold tracking-tight">
                                    {activeOrganization?.name || "Select Organization"}
                                </span>
                        </div>
                        <ChevronsUpDown className="ml-auto size-4 opacity-50 group-data-[collapsible=icon]:hidden"/>
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="min-w-[var(--radix-popper-anchor-width)] rounded-xl border-2 border-border bg-popover shadow-none"
                    align="start"
                    side="bottom"
                    sideOffset={4}
                >
                    {orgs.map((org) => {
                        const isActive = activeOrganization?.id === org.id;
                        return (
                            <DropdownMenuItem
                                key={org.id}
                                onClick={() => handleSelect(org.slug)}
                                className={cn(
                                    "group gap-2 p-1 cursor-pointer rounded-lg mb-1 last:mb-0 transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/20"
                                        : "focus:bg-accent hover:bg-accent/50 border border-transparent"
                                )}>
                                <div className={cn(
                                    "flex size-9 items-center justify-center rounded-md border shadow-sm transition-all group-hover:shadow-md",
                                    org.logo ? "bg-transparent border-transparent" : "",
                                    isActive && !org.logo ? "bg-primary text-primary-foreground border-primary/30" : "bg-muted/50 border-border"
                                )}>
                                    {org.logo ? (
                                        <img src={org.logo} alt={org.name} className="size-9 rounded-md object-cover"/>
                                    ) : (
                                        <Building2 className={cn(
                                            "size-5",
                                            isActive ? "text-primary-foreground" : "text-muted-foreground"
                                        )}/>
                                    )}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className={cn(
                                        "text-sm max-w-42.5 truncate font-medium leading-none",
                                        isActive ? "text-primary" : ""
                                    )}>{org.name}</span>
                                </div>
                                {isActive && (
                                    <div
                                        className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary shadow-sm">
                                        <Check className="size-3 text-primary-foreground" strokeWidth={3}/>
                                    </div>
                                )}
                            </DropdownMenuItem>
                        )
                    })}
                    <DropdownMenuSeparator className="my-2 bg-border/50"/>
                    <DropdownMenuItem
                        className="gap-3 p-2.5 cursor-pointer text-muted-foreground focus:text-foreground group rounded-lg"
                        onClick={() => setOpenModal(true)}
                    >
                        <div
                            className="flex size-9 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-background transition-colors group-hover:border-primary/50 group-hover:bg-primary/5">
                            <Plus className="size-4"/>
                        </div>
                        <div className="font-medium">Create new organization</div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}