import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import { updateUserAccess, UserManagementError } from "@/backend/services/admin-users.service";
import type { UpdateUserAccessPayload } from "@/frontend/types/admin-users.types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ idAluno: string }>;
}

export async function PATCH(request: Request, context: RouteParams) {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  if (identity.role !== "professor") {
    return NextResponse.json(
      { error: "Acesso negado. Apenas perfis administrativos podem alterar acessos de usuários." },
      { status: 403 }
    );
  }

  const { idAluno } = await context.params;
  if (!idAluno) {
    return NextResponse.json({ error: "ID do usuário é obrigatório." }, { status: 400 });
  }

  try {
    const body = (await request.json().catch(() => null)) as UpdateUserAccessPayload | null;
    if (!body) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    const updated = await updateUserAccess(idAluno, body, identity.idAluno);
    return NextResponse.json({ user: updated });
  } catch (error: unknown) {
    if (error instanceof UserManagementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Admin Users API] Erro ao atualizar usuário:", error);
    return NextResponse.json({ error: "Falha interna ao atualizar usuário." }, { status: 500 });
  }
}
