import React from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Brand } from "./dashboard-nav-items";

export function LoadingScreen(): React.JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-[#101010] text-white">
      <div className="flex flex-col items-center">
        <Brand />
        <LoaderCircle className="mt-8 size-6 animate-spin text-[#FFD700]" />
        <p className="mt-3 text-sm text-white/40">Verificando sua sessão</p>
      </div>
    </main>
  );
}

export function OnboardingUnavailable({
  onRetry,
  onLogout,
}: {
  onRetry: () => void;
  onLogout: () => void | Promise<void>;
}): React.JSX.Element {
  return (
    <main className="grid min-h-screen place-items-center bg-[#101010] p-5 text-white">
      <Card className="w-full max-w-md border-white/8 bg-[#191919] py-0 text-center shadow-2xl">
        <CardContent className="p-8">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#FFD700]/10 text-[#FFD700]">
            <RotateCcw className="size-5" />
          </span>
          <h1 className="mt-5 text-2xl font-black">Não foi possível carregar seu perfil</h1>
          <p className="mt-3 text-sm leading-6 text-white/45">
            Tente novamente. Se o problema continuar, saia e entre na conta outra vez.
          </p>
          <div className="mt-6 grid gap-3">
            <Button onClick={onRetry} className="h-11 rounded-xl bg-[#FFD700] font-bold text-black hover:bg-[#ffe13d]">
              Tentar novamente
            </Button>
            <Button onClick={() => void onLogout()} variant="ghost" className="text-white/45 hover:bg-white/5 hover:text-white">
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
