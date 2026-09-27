"use client";

import React, { useState } from "react";
import { Bell, LoaderCircle, Send } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import type { MessageItem, MessageType } from "@/frontend/types/messages.types";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: MessageItem[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  onSendMessage: (conteudo: string, tipo: MessageType) => Promise<boolean>;
}

export function NotificationsDialog({
  open,
  onOpenChange,
  messages,
  loading,
  sending,
  error,
  onSendMessage,
}: NotificationsDialogProps): React.JSX.Element {
  const [text, setText] = useState("");
  const [tipo, setTipo] = useState<MessageType>("duvida");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const success = await onSendMessage(text, tipo);
    if (success) setText("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden border-border bg-card p-0 text-card-foreground sm:max-w-xl">
        <DialogHeader className="border-b border-border p-5">
          <DialogTitle className="flex items-center gap-3 text-lg font-black">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Bell className="size-4" />
            </span>
            Notificações & Contato com Treinador
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Tire suas dúvidas sobre treinos, ritmos e zonas diretamente com seu treinador.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[420px] flex-col overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="grid min-h-36 place-items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" /> Carregando histórico...
              </span>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="rounded-xl border border-border bg-muted/40 p-5 text-center text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Nenhuma mensagem ainda.</p>
              <p className="mt-1">Envie sua dúvida para o treinador abaixo!</p>
            </div>
          )}

          {!loading &&
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs ${
                  msg.remetente === "aluno"
                    ? "ml-auto bg-primary/15 border border-primary/30 text-foreground"
                    : "mr-auto bg-secondary text-secondary-foreground border border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1 text-[11px] font-bold">
                  <span className={msg.remetente === "aluno" ? "text-primary" : "text-foreground"}>
                    {msg.remetente === "aluno" ? "Você" : "Professor"}
                  </span>
                  {msg.tipo === "avaliacao" && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                      Avaliação de Ciclo
                    </span>
                  )}
                  {msg.tipo === "duvida" && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      Dúvida
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.conteudo}</p>
                <span className="mt-1.5 text-[10px] text-muted-foreground self-end">
                  {new Date(msg.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
        </div>

        {error && (
          <div className="mx-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="border-t border-border p-4 bg-muted/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva sua dúvida sobre o treino aqui..."
              className="flex-1 rounded-xl border border-border bg-input px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="submit"
              disabled={!text.trim() || sending}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-black hover:opacity-90"
            >
              {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
