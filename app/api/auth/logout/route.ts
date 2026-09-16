import { NextResponse } from "next/server";
import { destroyCurrentSession, SESSION_COOKIE } from "@/lib/app-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroyCurrentSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
