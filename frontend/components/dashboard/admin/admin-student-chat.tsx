"use client";

import React, { useEffect, useState } from "react";
import { LoaderCircle, MessageSquare, Send } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import type { MessageItem } from "@/frontend/types/messages.types";

interface AdminStudentChatProps {
  idAluno: string;
  alunoNome: string;
  onMessageSent?: () => void;
}

export function AdminStudentChat({ idAluno, alunoNome, onMessageSent }: AdminStudentChatProps): React.JSX.Element {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages?alunoId=${idAluno}`);
      if (!res.ok) throw new Error("Falha ao carregar conversa.");
      const data = (await res.json()) as { messages: MessageItem[] };
      setMessages(data.messages || []);
      // Marca como lidas pelo professor
      await fetch(`/api/messages/unread?alunoId=${idAluno}`, { method: "PATCH" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("messages:updated"));
      }
      onMessageSent?.();
    } catch (err: unknown) {
      console.error("Erro ao carregar mensagens com aluno:", err);
      setError("Não foi possível carregar o chat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void loadMessages();
  }, [idAluno]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conteudo: text, tipo: "geral", alunoId: idAluno }),
      });
      const data = (await res.json()) as { message?: MessageItem };
      if (!res.ok || !data.message) throw new Error("Erro ao responder aluno.");
      setMessages((prev) => [...prev, data.message as MessageItem]);
      setText("");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("messages:updated"));
      }
      onMessageSent?.();
    } catch (err: unknown) {
      console.error("Erro ao enviar mensagem:", err);
      setError("Falha ao enviar resposta.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <MessageSquare className="size-4 text-primary" />
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Chat com {alunoNome}</h3>
      </div>

      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto p-1">
        {loading && (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" /> Carregando mensagens...
          </div>
        )}
        {!loading && messages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">Nenhuma mensagem trocada ainda.</p>
        )}
        {!loading &&
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] rounded-xl p-2.5 text-xs ${
                msg.remetente === "professor"
                  ? "ml-auto bg-primary text-primary-foreground font-medium"
                  : "mr-auto bg-muted border border-border text-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-bold opacity-80">
                <span>{msg.remetente === "professor" ? "Você (Professor)" : alunoNome}</span>
                {msg.tipo === "avaliacao" && <span className="underline">Solicitação de Call</span>}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.conteudo}</p>
            </div>
          ))}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-border">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Responder para ${alunoNome}...`}
          className="flex-1 rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Button
          type="submit"
          disabled={!text.trim() || sending}
          className="h-9 px-3 rounded-xl bg-primary text-primary-foreground font-black hover:opacity-90"
        >
          {sending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        </Button>
      </form>
    </div>
  );
}
