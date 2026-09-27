import React from "react";
import { X } from "lucide-react";
import type { View } from "@/frontend/types/dashboard.types";
import { Brand, navItems } from "./dashboard-nav-items";
import { NavButton } from "./dashboard-sidebar";

export function MobileNav({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (view: View) => void;
}): React.JSX.Element {
  return (
    <nav
      className="fixed inset-x-2 bottom-2 z-30 flex items-center justify-between rounded-2xl border border-white/10 bg-[#181818]/95 p-1.5 shadow-2xl backdrop-blur lg:hidden"
      aria-label="Navegação móvel"
    >
      {navItems.filter((item) => item.id !== "profile").map((item) => {
        const Icon = item.icon;
        const active = item.id === view;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1.5 py-1.5 text-[10px] font-semibold transition-colors ${
              active ? "bg-[#FFD700] text-black" : "text-white/45 hover:text-white/70"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.mobile}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function MobileDrawer({
  view,
  onNavigate,
  onClose,
}: {
  view: View;
  onNavigate: (view: View) => void;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <aside className="flex h-full w-[min(84vw,340px)] flex-col bg-[#171717] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <Brand />
          <button
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl border border-white/10"
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="mt-10 space-y-2">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} active={view === item.id} onClick={() => onNavigate(item.id)} />
          ))}
        </nav>
      </aside>
    </div>
  );
}
