"use client";

import {createContext, useContext, ReactNode} from "react";
import {User} from "@/db/schema/02_user";
import {useSystemPermissions} from "@/hooks/acl/use-system-acl";
import {SystemPermissions} from "@/lib/acl/system-acl";


type AclContextType = {
    isDemoEnabled: boolean;
    isSuperAdminAndDemo: boolean;
    user: User;
    permissions: SystemPermissions;
};

const AclContext = createContext<AclContextType | undefined>(undefined);

export const AclProvider = ({demo, user, children}: { demo: boolean, user:User, children: ReactNode }) => {
    const permissions = useSystemPermissions(user);
    const isSuperAdminAndDemo = demo && permissions.isSuperAdmin;

    return (
        <AclContext.Provider value={{isDemoEnabled: demo,user, permissions, isSuperAdminAndDemo}}>
            {children}
        </AclContext.Provider>
    );
};

export const useAcl = () => {
    const context = useContext(AclContext);
    if (!context) throw new Error("useAcl must be used within AclProvider");
    return context;
};
