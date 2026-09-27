import React from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StravaConnectButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "compact" | "card";
  isLoading?: boolean;
}

export function StravaIcon({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-4 shrink-0", className)}
    >
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-6.938 13.828h4.172" />
    </svg>
  );
}

export function StravaConnectButton({
  onClick,
  variant = "default",
  isLoading = false,
  className,
  disabled,
  ...props
}: StravaConnectButtonProps): React.JSX.Element {
  const isBusy = isLoading || disabled;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isBusy}
        aria-label="Conectar com o Strava"
        className={cn(
          "group relative inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-strava to-strava/90 px-3.5 text-xs font-bold text-strava-foreground shadow-sm transition-all duration-200",
          "hover:brightness-105 hover:shadow-md hover:shadow-strava/20 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strava focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-60",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <StravaIcon className="size-4 transition-transform group-hover:scale-110" />
        )}
        <span>Conectar Strava</span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isBusy}
        aria-label="Conectar conta do Strava"
        className={cn(
          "group flex w-full items-center justify-between gap-4 rounded-2xl border border-strava-border bg-gradient-to-br from-strava/15 via-strava/5 to-transparent p-4 text-left transition-all duration-200",
          "hover:border-strava/60 hover:from-strava/20 hover:to-strava/10 hover:shadow-lg hover:shadow-strava/10 active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strava focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-60",
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-strava text-strava-foreground shadow-sm shadow-strava/30 transition-transform group-hover:scale-105">
            {isLoading ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <StravaIcon className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-black tracking-tight text-foreground">Conectar com Strava</p>
              <span className="rounded-full bg-strava/20 px-2 py-0.5 text-[10px] font-bold text-strava">
                Automático
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Importe ritmo, distância e pace dos seus treinos
            </p>
          </div>
        </div>
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-card/60 text-muted-foreground transition-all group-hover:bg-strava group-hover:text-strava-foreground group-hover:translate-x-0.5">
          <ArrowRight className="size-4" />
        </div>
      </button>
    );
  }

  // Variant default
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isBusy}
      aria-label="Conectar com o Strava"
      className={cn(
        "group relative inline-flex h-11 items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-strava to-strava/90 px-5 text-sm font-black text-strava-foreground shadow-md shadow-strava/25 transition-all duration-200",
        "hover:brightness-105 hover:shadow-lg hover:shadow-strava/35 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-strava focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-60",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <StravaIcon className="size-4 transition-transform group-hover:scale-110" />
      )}
      <span>Conectar Strava</span>
      <ArrowRight className="size-3.5 opacity-70 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
