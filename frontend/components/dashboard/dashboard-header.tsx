import React from "react";
import { Bell, GraduationCap, Menu } from "lucide-react";
import type { PageTitleMeta, View } from "@/frontend/types/dashboard.types";
import { initials } from "./dashboard-nav-items";

interface DashboardHeaderProps {
  title: PageTitleMeta;
  userName: string;
  userRole?: "aluno" | "professor";
  currentView: View;
  unreadCount?: number;
  onOpenMenu: () => void;
  onOpenProfile: (view: View) => void;
  onOpenNotifications: () => void;
  onToggleRole?: () => void;
}

export function DashboardHeader({
  title,
  userName,
  userRole = "aluno",
  currentView,
  unreadCount = 0,
  onOpenMenu,
  onOpenProfile,
  onOpenNotifications,
  onToggleRole,
}: DashboardHeaderProps): React.JSX.Element {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{title.eyebrow}</p>
          <h1 className="mt-1 truncate text-xl font-black tracking-[-0.035em] sm:text-2xl text-foreground">
            {title.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleRole && userRole === "professor" && (
          <button
            onClick={onToggleRole}
            className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
              currentView === "admin"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            }`}
            title="Alternar para Painel do Treinador / Modo Aluno"
          >
            <GraduationCap className="size-4" />
            <span>{currentView === "admin" ? "Voltar ao App" : "Painel Treinador"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition hover:border-primary/50"
          aria-label="Notificações recebidas"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onOpenProfile(currentView === "admin" ? "home" : "profile")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-bold text-primary transition hover:border-primary/50"
          aria-label="Abrir perfil"
        >
          {initials(userName)}
        </button>
      </div>
    </header>
  );
}
