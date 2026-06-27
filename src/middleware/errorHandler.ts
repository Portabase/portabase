import { NextResponse } from "next/server";

export const errorHandler = (error: any) => {
  return new NextResponse(
    JSON.stringify({
      message: "An error occurred while processing your request.",
      status: 500,
    }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
};
