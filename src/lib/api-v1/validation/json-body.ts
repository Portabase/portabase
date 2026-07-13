import { NextResponse } from "next/server";
import { z } from "zod";

type ParseJsonBodyResult<T> =
    | {
    ok: true;
    data: T;
}
    | {
    ok: false;
    response: NextResponse;
};

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
    req: Request,
    schema: TSchema
): Promise<ParseJsonBodyResult<z.infer<TSchema>>> {
    let body: unknown;

    try {
        body = await req.json();
    } catch {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 422 }
            ),
        };
    }

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        return {
            ok: false,
            response: NextResponse.json(
                {
                    error: parsed.error.issues[0]?.message ?? "Invalid body",
                },
                { status: 422 }
            ),
        };
    }

    return {
        ok: true,
        data: parsed.data,
    };
}