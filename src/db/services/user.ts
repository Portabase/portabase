"use server";

import { SignUpUser } from "@/types/auth";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { User, UserThemeEnum } from "@/db/schema/02_user";
import { assertValidPassword } from "@/utils/password";

export async function hasUsers(): Promise<boolean> {
  const result = await db.select().from(drizzleDb.schemas.user).limit(1);
  return result.length > 0;
}

export async function createUserDb(data: SignUpUser): Promise<User> {
  if (data.password) {
    assertValidPassword(data.password);
  }

  const now = new Date();
  const userId = crypto.randomUUID();

  const [newUser] = await db
    .insert(drizzleDb.schemas.user)
    .values({
      ...data,
      id: userId,
      name: data.name,
      email: data.email,
      emailVerified: true,
      role: data.role,
      createdAt: now,
      updatedAt: now,
      theme: data.theme as UserThemeEnum,
    })
    .returning();

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

  return newUser;
}
