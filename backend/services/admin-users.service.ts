import { eq, sql } from "drizzle-orm";
import { getDb } from "@/backend/db";
import { assinaturasKiwify, treinosRealizados, usuarios } from "@/backend/db/schema";
import { hashPassword } from "@/backend/services/password.service";
import { ensureKiwifyInfrastructure } from "@/backend/services/kiwify.service";
import type { CreateUserPayload, ManagedUser, UpdateUserAccessPayload } from "@/frontend/types/admin-users.types";

export class UserManagementError extends Error {
  constructor(message: string, public readonly status: number = 400) {
    super(message);
    this.name = "UserManagementError";
  }
}

export async function listAllManagedUsers(): Promise<ManagedUser[]> {
  await ensureKiwifyInfrastructure();
  const db = getDb();

  const allUsers = await db
    .select({
      idAluno: usuarios.idAluno,
      nome: usuarios.nome,
      email: usuarios.email,
      role: usuarios.role,
      statusPagamento: usuarios.statusPagamento,
      objetivo: usuarios.objetivo,
      kiwifyStatus: assinaturasKiwify.status,
      kiwifyPlan: assinaturasKiwify.planoNome,
      kiwifyNextPayment: assinaturasKiwify.proximaCobranca,
      kiwifySubscriptionId: assinaturasKiwify.kiwifySubscriptionId,
    })
    .from(usuarios)
    .leftJoin(assinaturasKiwify, eq(usuarios.idAluno, assinaturasKiwify.idAluno));

  // Busca contagem de treinos concluídos por usuário
  const trainingCounts = await db
    .select({
      idAluno: treinosRealizados.idAluno,
      count: sql<number>`count(${treinosRealizados.id})`,
    })
    .from(treinosRealizados)
    .groupBy(treinosRealizados.idAluno);

  const countMap = new Map<string, number>();
  for (const item of trainingCounts) {
    countMap.set(item.idAluno, Number(item.count) || 0);
  }

  return allUsers.map((user) => ({
    idAluno: user.idAluno,
    nome: user.nome,
    email: user.email,
    role: (user.role as "aluno" | "professor") || "aluno",
    statusPagamento: (user.statusPagamento as "Ativo" | "Inativo") || "Ativo",
    objetivo: user.objetivo,
    totalTreinosConcluidos: countMap.get(user.idAluno) ?? 0,
    kiwifyStatus: user.kiwifyStatus || null,
    kiwifyPlan: user.kiwifyPlan || null,
    kiwifyNextPayment: user.kiwifyNextPayment || null,
    kiwifySubscriptionId: user.kiwifySubscriptionId || null,
  }));
}

export async function createManagedUser(payload: CreateUserPayload): Promise<ManagedUser> {
  const nome = payload.nome?.trim().replace(/\s+/g, " ");
  const email = payload.email?.trim().toLowerCase();
  const senha = payload.senha?.trim();
  const role = payload.role === "professor" ? "professor" : "aluno";
  const objetivo = payload.objetivo || "10k";
  const statusPagamento = payload.statusPagamento === "Inativo" ? "Inativo" : "Ativo";

  if (!nome || nome.length < 2 || nome.length > 80) {
    throw new UserManagementError("Informe um nome válido (entre 2 e 80 caracteres).", 400);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new UserManagementError("Informe um e-mail válido.", 400);
  }
  if (!senha || senha.length < 8 || senha.length > 128) {
    throw new UserManagementError("A senha inicial deve ter entre 8 e 128 caracteres.", 400);
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: usuarios.idAluno })
    .from(usuarios)
    .where(eq(usuarios.email, email))
    .limit(1);

  if (existing) {
    throw new UserManagementError("Este e-mail já está cadastrado no sistema.", 409);
  }

  const idAluno = crypto.randomUUID();
  const senhaHash = await hashPassword(senha);

  await db.insert(usuarios).values({
    idAluno,
    nome,
    email,
    senhaHash,
    role,
    statusPagamento,
    objetivo,
  });

  return {
    idAluno,
    nome,
    email,
    role,
    statusPagamento,
    objetivo,
    totalTreinosConcluidos: 0,
  };
}

export async function updateUserAccess(
  idAluno: string,
  payload: UpdateUserAccessPayload,
  requesterId: string
): Promise<ManagedUser> {
  const db = getDb();

  const [targetUser] = await db
    .select({
      idAluno: usuarios.idAluno,
      nome: usuarios.nome,
      email: usuarios.email,
      role: usuarios.role,
      statusPagamento: usuarios.statusPagamento,
      objetivo: usuarios.objetivo,
    })
    .from(usuarios)
    .where(eq(usuarios.idAluno, idAluno))
    .limit(1);

  if (!targetUser) {
    throw new UserManagementError("Usuário não encontrado.", 404);
  }

  // Regra de segurança: O administrador não pode inativar ou rebaixar a si próprio
  if (targetUser.idAluno === requesterId) {
    if (payload.statusPagamento === "Inativo") {
      throw new UserManagementError("Você não pode inativar seu próprio acesso administrativo.", 400);
    }
    if (payload.role === "aluno") {
      throw new UserManagementError("Você não pode revogar seu próprio papel de professor.", 400);
    }
  }

  const updateFields: {
    role?: "aluno" | "professor";
    statusPagamento?: "Ativo" | "Inativo";
  } = {};

  if (payload.role && (payload.role === "aluno" || payload.role === "professor")) {
    updateFields.role = payload.role;
  }

  if (payload.statusPagamento && (payload.statusPagamento === "Ativo" || payload.statusPagamento === "Inativo")) {
    updateFields.statusPagamento = payload.statusPagamento;
  }

  if (Object.keys(updateFields).length > 0) {
    await db.update(usuarios).set(updateFields).where(eq(usuarios.idAluno, idAluno));
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(${treinosRealizados.id})` })
    .from(treinosRealizados)
    .where(eq(treinosRealizados.idAluno, idAluno));

  return {
    idAluno: targetUser.idAluno,
    nome: targetUser.nome,
    email: targetUser.email,
    role: updateFields.role ?? (targetUser.role as "aluno" | "professor"),
    statusPagamento: updateFields.statusPagamento ?? (targetUser.statusPagamento as "Ativo" | "Inativo"),
    objetivo: targetUser.objetivo,
    totalTreinosConcluidos: Number(countResult?.count) || 0,
  };
}
