import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import { getUserKiwifySubscription } from "@/backend/services/kiwify.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Sessão inválida ou expirada." }, { status: 401 });
    }

    const subscription = await getUserKiwifySubscription(user.idAluno);

    return NextResponse.json({
      subscription,
      statusPagamento: user.statusPagamento,
      email: user.email,
    });
  } catch (error: unknown) {
    console.error("[GetSubscription Error]:", error);
    const message = error instanceof Error ? error.message : "Erro ao consultar dados da assinatura.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
