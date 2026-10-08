"use client";

import React, { useEffect, useState } from "react";
import { Activity, LoaderCircle, X } from "lucide-react";
import type { TrainingSession } from "@/backend/types";
import type { SessionFormData } from "@/frontend/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AdminSessionFormDialogProps {
  open: boolean;
  week: number;
  initialSession?: TrainingSession | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: SessionFormData) => Promise<boolean>;
}

export function AdminSessionFormDialog({
  open,
  week,
  initialSession,
  loading = false,
  onClose,
  onSubmit,
}: AdminSessionFormDialogProps): React.JSX.Element | null {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [duracaoMinutos, setDuracaoMinutos] = useState(45);
  const [intensidade, setIntensidade] = useState("");
  const [diaSugerido, setDiaSugerido] = useState("");
  const [terrenoSugerido, setTerrenoSugerido] = useState("");
  const [descricao, setDescricao] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialSession) {
      setTitulo(initialSession.titulo);
      setTipo(initialSession.tipo);
      setDuracaoMinutos(initialSession.duracaoMinutos || 45);
      setIntensidade(initialSession.intensidade);
      setDiaSugerido(initialSession.diaSugerido || "");
      setTerrenoSugerido(initialSession.terrenoSugerido || "");
      setDescricao(initialSession.descricao);
    } else {
      setTitulo("");
      setTipo("Rodagem");
      setDuracaoMinutos(45);
      setIntensidade("Z2 - Aeróbico Leve");
      setDiaSugerido("");
      setTerrenoSugerido("rua");
      setDescricao("");
    }
    setErrorMsg(null);
  }, [initialSession, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (titulo.trim().length < 2) {
      setErrorMsg("O título do treino deve conter no mínimo 2 caracteres.");
      return;
    }
    if (descricao.trim().length < 5) {
      setErrorMsg("A descrição do treino deve conter orientações claras (mín. 5 caracteres).");
      return;
    }

    const payload: SessionFormData = {
      titulo: titulo.trim(),
      tipo: tipo.trim() || "Rodagem",
      duracaoMinutos: Number(duracaoMinutos) || 45,
      intensidade: intensidade.trim() || "Z2",
      diaSugerido: diaSugerido.trim() || undefined,
      terrenoSugerido: terrenoSugerido.trim() || undefined,
      descricao: descricao.trim(),
    };

    const success = await onSubmit(payload);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Activity className="size-4" />
            </span>
            <div>
              <h3 className="text-base font-black text-foreground">
                {initialSession ? `Editar Treino · Sessão ${initialSession.sessao}` : `Novo Treino · Semana ${week}`}
              </h3>
              <p className="text-xs text-muted-foreground">Prescrição técnica de treinamento do aluno</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Título do Treino</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Rodagem Progressiva, Tiros de 400m..."
              required
              disabled={loading}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Tipo</label>
              <Input
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="Ex: Rodagem, Intervalado, Longão"
                required
                disabled={loading}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Duração (min)</label>
              <Input
                type="number"
                min={5}
                max={300}
                value={duracaoMinutos}
                onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                required
                disabled={loading}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Intensidade / Zona</label>
              <Input
                value={intensidade}
                onChange={(e) => setIntensidade(e.target.value)}
                placeholder="Ex: Z2 - Aeróbico Leve, Z4..."
                required
                disabled={loading}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Dia Sugerido</label>
              <Input
                value={diaSugerido}
                onChange={(e) => setDiaSugerido(e.target.value)}
                placeholder="Ex: Terça-feira, Sábado"
                disabled={loading}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Terreno Sugerido</label>
            <Input
              value={terrenoSugerido}
              onChange={(e) => setTerrenoSugerido(e.target.value)}
              placeholder="Ex: rua, esteira, pista de atletismo"
              disabled={loading}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Descrição Técnica & Orientações</label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhe o aquecimento, blocos principais, pausas e desaquecimento..."
              rows={4}
              required
              disabled={loading}
              className="text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-2 font-bold">
              {loading && <LoaderCircle className="size-3.5 animate-spin" />}
              {initialSession ? "Salvar Alterações" : "Criar Treino"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
