import { createHash } from "crypto";
import type { User } from "@/db/schema/02_user";

export function resolveAvatarUrl(
  user: Pick<User, "email" | "image">,
): string | undefined {
  if (user.image) return user.image;
  const hash = createHash("md5")
    .update((user.email ?? "").trim().toLowerCase())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=404`;
}
