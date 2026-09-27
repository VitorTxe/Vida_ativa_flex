import React, { useState } from "react";
import { Plus, Trophy } from "lucide-react";
import { useRaces } from "@/frontend/hooks/use-races";
import { RaceCard } from "./race-card";
import { RaceStatsBanner } from "./race-stats-banner";
import { NewRaceDialog } from "./new-race-dialog";

export function RacesView(): React.JSX.Element {
  const { races, stats, loading, submitting, error, addRace, deleteRace } = useRaces();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/8 bg-[#1a1a1a] p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#FFD700] px-3 py-1 text-xs font-black text-black">
              HISTÓRICO COMPETITIVO
            </span>
            <span className="text-xs text-white/40">{races.length} provas cadastradas</span>
          </div>
          <h2 className="mt-3 text-xl font-black text-white">Resultados Oficiais</h2>
          <p className="mt-1 text-xs text-white/50">
            Guarde seus tempos, acompanhe seus recordes pessoais (RP) e analise sua evolução nas provas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFD700] px-5 py-3 text-xs font-black text-black transition-all hover:bg-[#FFD700]/90 active:scale-[0.98]"
        >
          <Plus className="size-4 stroke-[3]" /> Adicionar Prova
        </button>
      </div>

      <RaceStatsBanner stats={stats} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
          ))}
        </div>
      ) : races.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#1a1a1a]/40 px-6 py-16 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-[#FFD700]/10 text-[#FFD700]">
            <Trophy className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-black text-white">Nenhuma prova registrada ainda</h3>
          <p className="mt-1.5 max-w-sm text-xs text-white/50">
            Você já correu alguma prova de 5k, 10k, 21k ou maratona? Registre seu tempo para registrar seu recorde no app!
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/10 px-4 py-2.5 text-xs font-black text-[#FFD700] hover:bg-[#FFD700]/20"
          >
            <Plus className="size-4" /> Adicionar Primeira Prova
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <RaceCard key={race.id} race={race} onDelete={deleteRace} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      <NewRaceDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={addRace}
        submitting={submitting}
      />
    </div>
  );
}
