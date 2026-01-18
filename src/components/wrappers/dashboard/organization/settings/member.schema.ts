import {z} from "zod";

const RoleEnum = z.enum(["member", "owner", "admin"]);

export const RoleSchemaMember = z.union([
    RoleEnum,
    z.array(RoleEnum)
]);