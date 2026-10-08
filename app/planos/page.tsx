"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PricingSection } from "@/frontend/components/pricing";

export default function PlanosPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-9 lg:px-14">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-symbol.svg" alt="Vida Ativa FLEX" width={32} height={32} priority />
            <span className="text-xs font-black tracking-tight text-foreground">
              VIDA ATIVA <span className="text-primary">FLEX</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Voltar ao início
          </Link>
        </div>
      </header>

      <PricingSection />

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Vida Ativa FLEX · Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
