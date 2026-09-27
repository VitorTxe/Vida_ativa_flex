import React from "react";
import { Calendar, Gauge, Timer, Trash2 } from "lucide-react";
import type { RaceRecord } from "@/frontend/types/races.types";

interface RaceCardProps {
  race: RaceRecord;
  onDelete: (id: string) => void;
}

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}h${m.toString().padStart(2, "0")}m${s.toString().padStart(2, "0")}s`;
  }
  return `${m}m${s.toString().padStart(2, "0")}s`;
}

function formatDate(isoString: string): string {
  if (!isoString) return "";
  const parts = isoString.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoString;
}

export function RaceCard({ race, onDelete }: RaceCardProps): React.JSX.Element {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-white/8 bg-[#1a1a1a] p-5 transition-colors hover:border-white/15">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#FFD700] px-2.5 py-0.5 text-[11px] font-black uppercase text-black">
                {race.distanciaKm} KM
              </span>
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Calendar className="size-3" />
                {formatDate(race.dataProva)}
              </span>
            </div>
            <h3 className="mt-2 text-base font-black text-white">{race.nomeProva}</h3>
          </div>
          <button
            type="button"
            onClick={() => onDelete(race.id)}
            className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Excluir resultado da prova"
            aria-label="Excluir prova"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-white/6 bg-black/30 p-3">
          <div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-white/45">
              <Timer className="size-3 text-[#FFD700]" /> Tempo Oficial
            </span>
            <p className="mt-0.5 text-base font-black text-white">{formatSeconds(race.tempoTotalSegundos)}</p>
          </div>
          <div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-white/45">
              <Gauge className="size-3 text-[#FFD700]" /> Pace Médio
            </span>
            <p className="mt-0.5 text-base font-black text-[#FFD700]">{race.paceMedio}</p>
          </div>
        </div>

        {race.sensacaoEsforco && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-white/50">
            <span className="font-semibold text-white/70">Percepção de Esforço:</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-[#FFD700]">
              {race.sensacaoEsforco}/10 RPE
            </span>
          </div>
        )}

        {race.comentarios && (
          <p className="mt-3 rounded-lg bg-white/[0.02] p-2 text-xs italic leading-5 text-white/60">
            &ldquo;{race.comentarios}&rdquo;
          </p>
        )}
      </div>
    </article>
  );
}
