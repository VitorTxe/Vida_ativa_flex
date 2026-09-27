"use client";

import React, { useState } from "react";
import { CalendarCheck, CheckCircle2, Clock, LoaderCircle, Send, Video } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import { Textarea } from "@/frontend/components/ui/textarea";

interface ScheduleCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedWeeksCount: number;
}

const DEFAULT_MESSAGE =
  "Olá, professor! Concluí as 4 semanas do meu plano flexível de treinos e gostaria de agendar nossa avaliação de alinhamento e avaliação de ciclo.";

const PREFERRED_PERIODS = ["Flexível", "Manhã (08h - 12h)", "Tarde (13h - 18h)", "Noite (18h - 21h)"];

export function ScheduleCallDialog({
  open,
  onOpenChange,
  completedWeeksCount,
}: ScheduleCallDialogProps): React.JSX.Element {
  const [mensagem, setMensagem] = useState<string>(DEFAULT_MESSAGE);
  const [periodo, setPeriodo] = useState<string>("Flexível");
  const [enviando, setEnviando] = useState<boolean>(false);
  const [sucesso, setSucesso] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!mensagem.trim()) {
      setErro("Por favor, digite uma mensagem antes de enviar.");
      return;
    }

    setEnviando(true);
    setErro(null);

    const textoFinal = `${mensagem.trim()}\n\n[Preferência de horário: ${periodo}]`;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudo: textoFinal,
          tipo: "avaliacao",
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error ?? "Não foi possível enviar a solicitação.");
      }

      setSucesso(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("messages:updated"));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao enviar solicitação para o treinador.";
      console.error("[ScheduleCallDialog] Falha ao enviar solicitação de call:", err);
      setErro(errorMsg);
    } finally {
      setEnviando(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (sucesso) {
      setTimeout(() => {
        setSucesso(false);
        setMensagem(DEFAULT_MESSAGE);
        setErro(null);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-border bg-card p-6 text-foreground sm:rounded-2xl">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Video className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-black tracking-tight">Agendar Avaliação com Professor</DialogTitle>
              </div>
              <DialogDescription className="mt-0.5 text-xs font-semibold text-primary">
                Ciclo de {completedWeeksCount}/4 semanas completado com sucesso! 🎉
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {sucesso ? (
          <div className="my-4 rounded-xl border border-primary/30 bg-primary/10 p-6 text-center">
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h4 className="mt-4 text-lg font-black text-foreground">Solicitação Enviada!</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sua mensagem de agendamento foi entregue diretamente ao professor. Ele responderá pelo chat do app para
              combinar o melhor dia e horário da call.
            </p>
            <Button
              onClick={handleClose}
              className="mt-6 h-11 w-full rounded-xl bg-primary font-bold text-primary-foreground hover:brightness-110"
            >
              Concluir
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mensagem para o Professor
              </label>
              <Textarea
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Escreva sua mensagem para o treinador..."
                className="mt-2 resize-none rounded-xl border-border bg-background p-3 text-sm focus-visible:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Melhor Período para a Call
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-2">
                {PREFERRED_PERIODS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPeriodo(item)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                      periodo === item
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-background/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Clock className="size-3.5 shrink-0" />
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>

            {erro && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {erro}
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                disabled={enviando}
                className="h-12 w-full rounded-xl bg-primary font-black text-primary-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
              >
                {enviando ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" /> Enviando mensagem...
                  </>
                ) : (
                  <>
                    <Send className="size-4" /> Enviar Solicitação de Call
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
