import { useState } from "react";
import { IceCream, Store, Landmark, ShieldCheck, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import { diagnosticoCustoVida, sorveteParaSorveteria, transbordoReserva } from "@/features/finance/strategy";

const TEXTO = {
  saudavel: { titulo: "Você vive um degrau abaixo. Ótimo!", cor: "border-emerald-500/30 bg-emerald-500/5", desc: "Seu custo de vida cabe em até 70% do salário. Sobra espaço para construir o futuro." },
  atencao: { titulo: "Atenção: a casa está apertada", cor: "border-amber-500/30 bg-amber-500/5", desc: "Seu custo passa de 70% do salário. Corte pequenos gastos do dia a dia para sobrar mais." },
  alerta: { titulo: "Alerta: primeiro arrumar a casa", cor: "border-destructive/40 bg-destructive/5", desc: "Quase todo o salário vai embora. Antes de investir, vamos reduzir gastos e montar a reserva." },
};

export function DiagnosticoVida({ salario, custo, reserva, teto }: { salario: number; custo: number; reserva: number; teto: number }) {
  const [sorvete, setSorvete] = useState("15");
  const diag = diagnosticoCustoVida(salario, custo);
  const t = TEXTO[diag];
  const pct = salario > 0 ? Math.round((custo / salario) * 100) : 0;
  const mensal = (Number(sorvete.replace(",", ".")) || 0) * 30;
  const futuro = sorveteParaSorveteria(mensal, 20);
  const sobra = transbordoReserva(reserva, teto);
  const cheia = teto > 0 && reserva >= teto;

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className={`rounded-2xl border p-5 ${t.cor}`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">1. Diagnóstico de vida</p>
        <h3 className="mt-2 font-bold text-foreground">{t.titulo}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Seu custo de vida é <strong className="text-foreground">{pct}%</strong> do salário. {t.desc}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">2. O sorvete vs. a sorveteria</p>
        <div className="mt-2 flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs flex items-center gap-1"><IceCream className="h-3.5 w-3.5" /> Gasto supérfluo por dia (R$)</Label>
            <Input inputMode="decimal" value={sorvete} onChange={(e) => setSorvete(e.target.value)} />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {formatBRL(mensal)}/mês investidos por 20 anos viram{" "}
          <strong className="text-primary inline-flex items-center gap-1"><Store className="h-4 w-4" />{formatBRL(futuro)}</strong>.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">3. Onde guardar a reserva</p>
        <p className="mt-2 text-sm text-muted-foreground flex gap-2">
          <Landmark className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <span><strong className="text-foreground">Nunca na poupança.</strong> Use CDB de liquidez diária (100% do CDI ou mais) ou Tesouro Selic: rende todo dia e você saca quando precisar.</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground flex gap-2">
          {cheia ? <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" /> : <ArrowRightLeft className="h-4 w-4 shrink-0 mt-0.5" />}
          <span>
            {cheia
              ? <>Reserva cheia ({formatBRL(teto)}). Ela fica parada protegendo você, e <strong className="text-foreground">todo aporte novo vai para a Bolsa</strong>.{sobra > 0 && <> Os {formatBRL(sobra)} que passaram do teto podem entrar na Bola de Neve.</>}</>
              : <>Meta: {formatBRL(teto)} (3x o salário). Ao chegar lá, a reserva não sai do CDB — só o dinheiro novo passa a ir para ações e FIIs.</>}
          </span>
        </p>
      </div>
    </section>
  );
}
