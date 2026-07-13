import { NextResponse } from "next/server";
import { buildSpec } from "@/lib/api-v1/openapi/spec";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(buildSpec());
}
