import React from "react";
import { Medal } from "lucide-react";
import type { Goal } from "@/frontend/lib/fitness-data";
import type { NavItem, View } from "@/frontend/types/dashboard.types";
import { Brand, navItems } from "./dashboard-nav-items";

interface SidebarProps {
  view: View;
  goal: Goal;
  onNavigate: (view: View) => void;
}

export function Sidebar({ view, goal, onNavigate }: SidebarProps): React.JSX.Element {
  return (
    <aside className="hidden w-[250px] shrink-0 border-r border-white/8 px-5 py-7 lg:flex lg:flex-col">
      <Brand />
      <nav className="mt-12 space-y-2" aria-label="Navegação principal">
        {navItems.map((item) => (
          <NavButton key={item.id} item={item} active={view === item.id} onClick={() => onNavigate(item.id)} />
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/8 bg-white/[0.035] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFD700]">Plano ativo</p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-bold">Objetivo {goal}</p>
          <Medal className="size-4 text-[#FFD700]" />
        </div>
        <p className="mt-1 text-xs leading-5 text-white/40">Ciclo de 4 semanas · 3 sessões livres</p>
      </div>
    </aside>
  );
}

export function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}): React.JSX.Element {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
        active ? "bg-[#FFD700] text-black" : "text-white/50 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="size-4" />
      {item.label}
    </button>
  );
}
