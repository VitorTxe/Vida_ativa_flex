import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { usuarios } from "@/backend/db/schema";
import { createPasswordResetToken } from "@/backend/services/password-reset.service";
import { sendPasswordResetEmail } from "@/backend/services/email.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Se o e-mail informado estiver cadastrado, você receberá o link para criar uma nova senha." },
        { status: 200 }
      );
    }

    const db = getDb();
    const [user] = await db
      .select({
        idAluno: usuarios.idAluno,
        nome: usuarios.nome,
        email: usuarios.email,
        statusPagamento: usuarios.statusPagamento,
      })
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1);

    if (user && user.statusPagamento === "Ativo") {
      const rawToken = await createPasswordResetToken(user.idAluno);
      
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
      const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
      const origin = `${proto}://${host}`;
      const resetUrl = `${origin}/redefinir-senha?token=${rawToken}`;

      await sendPasswordResetEmail({
        toEmail: user.email,
        userName: user.nome,
        resetUrl,
      });
    }

    return NextResponse.json(
      { message: "Se o e-mail informado estiver cadastrado, você receberá o link para criar uma nova senha." },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[ForgotPassword Error]:", error);
    return NextResponse.json(
      { message: "Se o e-mail informado estiver cadastrado, você receberá o link para criar uma nova senha." },
      { status: 200 }
    );
  }
}
