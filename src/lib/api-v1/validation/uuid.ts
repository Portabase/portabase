import { z } from "zod";

export function isUuid(value: string | undefined): value is string {
  return z.uuid().safeParse(value).success;
}
