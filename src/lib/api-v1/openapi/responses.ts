import { z } from "zod";
import "@/lib/api-v1/openapi/registry";

const ErrorSchema = z.object({ error: z.string() });

export function dataResponse(description: string, schema: z.ZodTypeAny) {
  return {
    description,
    content: { "application/json": { schema: z.object({ data: schema }) } },
  };
}

export function errorResponses(descriptions: Record<number, string>) {
  const all: Record<number, string> = {
    401: "Missing or invalid API key",
    ...descriptions,
    500: "Internal server error",
  };
  return Object.fromEntries(
    Object.entries(all).map(([status, description]) => [
      status,
      { description, content: { "application/json": { schema: ErrorSchema } } },
    ])
  );
}
