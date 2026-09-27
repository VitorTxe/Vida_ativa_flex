import { useCallback, useEffect, useState } from "react";
import type { NewRacePayload, RaceRecord, RacesResponseData } from "@/frontend/types/races.types";

export function useRaces() {
  const [races, setRaces] = useState<RaceRecord[]>([]);
  const [stats, setStats] = useState<RacesResponseData["stats"]>({
    totalProvas: 0,
    kmTotal: 0,
    recordesPessoais: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchRaces = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/races");
      if (!res.ok) {
        throw new Error("Não foi possível carregar as provas.");
      }
      const data = (await res.json()) as RacesResponseData;
      setRaces(data.races ?? []);
      setStats(data.stats ?? { totalProvas: 0, kmTotal: 0, recordesPessoais: [] });
    } catch (err: unknown) {
      console.error("Erro ao buscar histórico de provas:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar provas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRaces();
  }, [fetchRaces]);

  const addRace = useCallback(async (payload: NewRacePayload): Promise<{ success: boolean; error?: string }> => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        return {
          success: false,
          error: data?.error ?? "Erro ao salvar a prova.",
        };
      }

      await fetchRaces();
      return { success: true };
    } catch (err: unknown) {
      console.error("Erro ao registrar prova:", err);
      return {
        success: false,
        error: "Falha de conexão com o servidor.",
      };
    } finally {
      setSubmitting(false);
    }
  }, [fetchRaces]);

  const deleteRace = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/races/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      await fetchRaces();
      return true;
    } catch (err: unknown) {
      console.error("Erro ao excluir prova:", err);
      return false;
    }
  }, [fetchRaces]);

  return {
    races,
    stats,
    loading,
    submitting,
    error,
    refresh: fetchRaces,
    addRace,
    deleteRace,
  };
}
