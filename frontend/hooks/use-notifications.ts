import { useCallback, useEffect, useState } from "react";
import type { MessageItem, MessageType } from "@/frontend/types/messages.types";

interface UseNotificationsResult {
  unreadCount: number;
  messages: MessageItem[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  loadMessages: () => Promise<void>;
  sendMessage: (conteudo: string, tipo: MessageType) => Promise<boolean>;
  markAsRead: () => Promise<void>;
  refreshCount: () => Promise<void>;
}

export function useNotifications(isOpen: boolean): UseNotificationsResult {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/unread", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { unreadCount?: number };
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (err: unknown) {
      console.error("Falha ao atualizar contador de notificações:", err);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/messages", { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível carregar as notificações.");
      const data = (await response.json()) as { messages?: MessageItem[] };
      setMessages(data.messages ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar mensagens.";
      console.error("Erro no loadMessages:", err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async () => {
    try {
      await fetch("/api/messages/unread", { method: "PATCH" });
      setUnreadCount(0);
    } catch (err: unknown) {
      console.error("Falha ao marcar mensagens como lidas:", err);
    }
  }, []);

  const sendMessage = useCallback(
    async (conteudo: string, tipo: MessageType): Promise<boolean> => {
      setSending(true);
      setError(null);
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ conteudo, tipo }),
        });
        const data = (await response.json()) as { message?: MessageItem; error?: string };
        if (!response.ok || !data.message) {
          throw new Error(data.error ?? "Não foi possível enviar a mensagem.");
        }
        setMessages((prev) => [...prev, data.message as MessageItem]);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Falha ao enviar mensagem.";
        console.error("Erro ao enviar mensagem:", err);
        setError(msg);
        return false;
      } finally {
        setSending(false);
      }
    },
    []
  );

  useEffect(() => {
    void refreshCount();
    const interval = setInterval(() => {
      void refreshCount();
    }, 15000);

    const handleMessageUpdate = () => {
      void refreshCount();
    };

    window.addEventListener("messages:updated", handleMessageUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("messages:updated", handleMessageUpdate);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (isOpen) {
      void loadMessages();
      void markAsRead();
    }
  }, [isOpen, loadMessages, markAsRead]);

  return {
    unreadCount,
    messages,
    loading,
    sending,
    error,
    loadMessages,
    sendMessage,
    markAsRead,
    refreshCount,
  };
}
