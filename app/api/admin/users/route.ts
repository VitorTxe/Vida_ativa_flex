import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import {
  createManagedUser,
  listAllManagedUsers,
  UserManagementError,
} from "@/backend/services/admin-users.service";
import type { CreateUserPayload } from "@/frontend/types/admin-users.types";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  if (identity.role !== "professor") {
    return NextResponse.json(
      { error: "Acesso negado. Apenas perfis administrativos podem acessar este recurso." },
      { status: 403 }
    );
  }

  try {
    const users = await listAllManagedUsers();
    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error("[Admin Users API] Erro ao listar usuários:", error);
    return NextResponse.json({ error: "Falha ao carregar lista de usuários." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  if (identity.role !== "professor") {
    return NextResponse.json(
      { error: "Acesso negado. Apenas perfis administrativos podem adicionar novos usuários." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json().catch(() => null)) as CreateUserPayload | null;
    if (!body) {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const created = await createManagedUser(body);
    return NextResponse.json({ user: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof UserManagementError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[Admin Users API] Erro ao criar usuário:", error);
    return NextResponse.json({ error: "Falha interna ao criar usuário." }, { status: 500 });
  }
}
