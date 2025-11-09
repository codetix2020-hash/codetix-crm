import { NextResponse } from "next/server";
import { checkAuth } from "./_helpers";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Endpoint activo",
  });
}

export async function POST(request: Request) {
  const unauthorized = checkAuth(request);
  if (unauthorized) return unauthorized;

  const body = await request.json();

  return NextResponse.json({
    success: true,
    received: body,
  });
}
