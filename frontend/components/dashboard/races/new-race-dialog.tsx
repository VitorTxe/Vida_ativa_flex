import React, { useMemo, useState } from "react";
import { Gauge, Plus, X } from "lucide-react";
import type { NewRacePayload } from "@/frontend/types/races.types";

interface NewRaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: NewRacePayload) => Promise<{ success: boolean; error?: string }>;
  submitting: boolean;
}

const QUICK_DISTANCES = [
  { label: "5k", km: 5 },
  { label: "10k", km: 10 },
  { label: "15k", km: 15 },
  { label: "21.1k (Meia)", km: 21.1 },
  { label: "42.2k (Maratona)", km: 42.2 },
];

export function NewRaceDialog({ isOpen, onClose, onSubmit, submitting }: NewRaceDialogProps): React.JSX.Element | null {
  const [nomeProva, setNomeProva] = useState("");
  const [dataProva, setDataProva] = useState(() => new Date().toISOString().split("T")[0]);
  const [distanciaKm, setDistanciaKm] = useState<number>(10);
  const [horas, setHoras] = useState(0);
  const [minutos, setMinutos] = useState(50);
  const [segundos, setSegundos] = useState(0);
  const [sensacaoEsforco, setSensacaoEsforco] = useState<number>(8);
  const [comentarios, setComentarios] = useState("");
  const [formError, setFormError] = useState("");

  const calculatedPace = useMemo(() => {
    const totalSec = horas * 3600 + minutos * 60 + segundos;
    if (distanciaKm <= 0 || totalSec <= 0) return "--:--/km";
    const secKm = totalSec / distanciaKm;
    const pMin = Math.floor(secKm / 60);
    const pSec = Math.round(secKm % 60);
    return `${pMin}:${pSec.toString().padStart(2, "0")}/km`;
  }, [horas, minutos, segundos, distanciaKm]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!nomeProva.trim()) {
      setFormError("Informe o nome da prova.");
      return;
    }
    const totalMin = horas * 60 + minutos;
    const res = await onSubmit({
      nomeProva,
      dataProva,
      distanciaKm,
      minutos: totalMin,
      segundos,
      sensacaoEsforco,
      comentarios: comentarios || null,
    });
    if (res.success) {
      setNomeProva("");
      onClose();
    } else if (res.error) {
      setFormError(res.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#161616] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD700]">Resultado Oficial</span>
            <h2 className="text-xl font-black text-white">Adicionar Prova</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          {formError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/70">Nome da Prova</label>
            <input
              type="text"
              required
              placeholder="Ex: Meia Maratona Internacional de SP"
              value={nomeProva}
              onChange={(e) => setNomeProva(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-white placeholder-white/25 focus:border-[#FFD700] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/70">Data da Prova</label>
              <input
                type="date"
                required
                value={dataProva}
                onChange={(e) => setDataProva(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-[#FFD700] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70">Distância (km)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="200"
                required
                value={distanciaKm}
                onChange={(e) => setDistanciaKm(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-[#FFD700] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-white/50">Distâncias rápidas:</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {QUICK_DISTANCES.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setDistanciaKm(d.km)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                    distanciaKm === d.km ? "bg-[#FFD700] text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70">Tempo Oficial (Líquido)</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-white/40">Horas</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={horas}
                  onChange={(e) => setHoras(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-center text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-white/40">Minutos</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutos}
                  onChange={(e) => setMinutos(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-center text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-white/40">Segundos</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={segundos}
                  onChange={(e) => setSegundos(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-2 text-center text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/[0.05] p-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-white/60">
              <Gauge className="size-4 text-[#FFD700]" /> Pace Médio Estimado:
            </span>
            <span className="text-sm font-black text-[#FFD700]">{calculatedPace}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70">Sensação de Esforço ({sensacaoEsforco}/10 RPE)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={sensacaoEsforco}
              onChange={(e) => setSensacaoEsforco(Number(e.target.value))}
              className="mt-1 w-full accent-[#FFD700]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70">Comentários / Clima / Estratégia (Opcional)</label>
            <textarea
              rows={2}
              placeholder="Ex: Subidas no km 12, calor intenso, hidratação a cada 3 km..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder-white/25 focus:border-[#FFD700] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 font-bold text-white hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-[#FFD700] py-2.5 font-black text-black transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {submitting ? "Salvando..." : "Salvar Prova"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
