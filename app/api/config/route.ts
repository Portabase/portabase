import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    PROJECT_URL: process.env.PROJECT_URL,
    PROJECT_NAME: process.env.PROJECT_NAME,
    PROJECT_DESCRIPTION: process.env.PROJECT_DESCRIPTION,
  });
}
