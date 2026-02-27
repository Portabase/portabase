import {SignUpUser} from "@/types/auth";
import {hashPassword} from "better-auth/crypto";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {User, UserThemeEnum} from "@/db/schema/02_user";


export async function createUserDb(data: SignUpUser): Promise<User> {
    const now = new Date();
    const userId = crypto.randomUUID();

    const [newUser] = await db.insert(drizzleDb.schemas.user).values({
        id: userId,
        name: data.name,
        email: data.email,
        emailVerified: true,
        role: data.role,
        createdAt: now,
        updatedAt: now,
        theme: data.theme as UserThemeEnum,
    }).returning();

    if (data.password) {
        const hashedPassword = await hashPassword(data.password);
        await db.insert(drizzleDb.schemas.account).values({
            providerId: "credential",
            accountId: userId,
            userId: userId,
            password: hashedPassword,
            createdAt: now,
            updatedAt: now,
        });
    }

    return newUser
}
