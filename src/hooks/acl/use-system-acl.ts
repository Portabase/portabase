"use client";

import { computeSystemPermissions } from "@/lib/acl/system-acl";
import {User} from "@/db/schema/02_user";

export const useSystemPermissions = (user: User | null) => {
	return computeSystemPermissions(user);
};
