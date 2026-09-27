import React from "react";
import { Award, Flame, Route, Trophy } from "lucide-react";
import type { RacesResponseData } from "@/frontend/types/races.types";

interface RaceStatsBannerProps {
  stats: RacesResponseData["stats"];
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

export function RaceStatsBanner({ stats }: RaceStatsBannerProps): React.JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-white/8 bg-[#1a1a1a] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#FFD700]/15 text-[#FFD700]">
            <Trophy className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Provas Corridas</p>
            <p className="text-2xl font-black text-white">{stats.totalProvas}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#1a1a1a] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#FFD700]/15 text-[#FFD700]">
            <Route className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Km Competitivos</p>
            <p className="text-2xl font-black text-white">{stats.kmTotal} km</p>
          </div>
        </div>
      </div>

      <div className="col-span-full rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.04] p-5 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-[#FFD700]" />
          <p className="text-xs font-black uppercase tracking-wider text-[#FFD700]">Recordes Pessoais (RP)</p>
        </div>
        {stats.recordesPessoais.length === 0 ? (
          <p className="mt-2 text-xs text-white/50">
            Adicione suas provas para calcular seus recordes por distância automaticamente.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.recordesPessoais.map((rp) => (
              <div key={rp.distanciaRotulo} className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                <span className="text-[10px] font-bold uppercase text-white/60">{rp.distanciaRotulo}</span>
                <p className="mt-0.5 text-sm font-black text-white">{formatSeconds(rp.tempoTotalSegundos)}</p>
                <p className="text-[10px] font-semibold text-[#FFD700]">{rp.paceMedio}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
