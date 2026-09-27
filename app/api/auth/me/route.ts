import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  return NextResponse.json({ user });
}
