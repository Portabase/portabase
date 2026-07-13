"use server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { User } from "@/db/schema/02_user";

export const currentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return session.user as User;
};
