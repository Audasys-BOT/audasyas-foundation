import { useEffect, useState } from "react";
import { Rocket, Globe, Flame, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import { PILARES_PADRAO, dividirPilares, mesesSprintReserva, normalizarPilares, type Pilares } from "@/features/finance/strategy";

export function SprintLegado({ userId, capacidade, reserva, teto }: { userId: string; capacidade: number; reserva: number; teto: number }) {
  const key = `pilares:${userId}`;
  const [p, setP] = useState<Pilares>(PILARES_PADRAO);
  const [extra, setExtra] = useState("300");
  useEffect(() => { try { const s = localStorage.getItem(key); if (s) setP(JSON.parse(s)); } catch {} }, [key]);
  const salvar = (n: Pilares) => { setP(n); localStorage.setItem(key, JSON.stringify(n)); };
  const n = normalizarPilares(p);
  const faltante = Math.max(teto - reserva, 0);
  const ritmo = Math.min(faltante, capacidade * 0.6);
  const extraNum = Number(extra.replace(",", ".")) || 0;
  const mAtual = mesesSprintReserva(faltante, ritmo);
  const mAcel = mesesSprintReserva(faltante, ritmo + extraNum);
  const aporteAtivos = faltante > 0 ? Math.max(capacidade - ritmo, 0) : capacidade;
  const div = dividirPilares(aporteAtivos, n);
  const fmtM = (m: number) => (m === Infinity ? "sem previsão" : `${m} ${m === 1 ? "mês" : "meses"}`);
  const campo = (k: keyof Pilares, label: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label} (%)</Label>
      <Input inputMode="numeric" value={p[k]} onChange={(e) => salvar({ ...p, [k]: Number(e.target.value) || 0 })} />
    </div>
  );

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"><Rocket className="h-3.5 w-3.5" /> Sprint contra a inflação</p>
        {faltante <= 0 ? (
          <p className="mt-2 text-sm text-foreground">Reserva blindada! Agora 100% do aporte vai para os pilares do legado.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">No ritmo atual ({formatBRL(ritmo)}/mês) sua família blinda a reserva em <strong className="text-foreground">{fmtM(mAtual)}</strong>.</p>
            <div className="mt-3 space-y-1 max-w-[12rem]">
              <Label className="text-xs">Apertar a mais por mês (R$)</Label>
              <Input inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Acelerando, você conclui em <strong className="text-foreground">{fmtM(mAcel)}</strong>{mAtual !== Infinity && mAcel < mAtual ? ` — ${mAtual - mAcel} meses antes` : ""} e libera {formatBRL(capacidade)}/mês para dólar e dividendos.</p>
          </>
        )}
        <p className="mt-3 text-xs text-muted-foreground">O Real perde poder de compra todo ano. Cada mês a menos no sprint é um mês a mais protegendo o legado com ativos fortes.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pilares do legado (ajustáveis)</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {campo("brasil", "Brasil")}{campo("global", "Dólar")}{campo("pimenta", "Pimenta")}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Usado: {n.brasil}% / {n.global}% / {n.pimenta}% (Pimenta até 10%). <button className="underline" onClick={() => salvar(PILARES_PADRAO)}>Voltar ao recomendado</button></p>
        <ul className="mt-3 space-y-1 text-sm">
          <li className="flex items-center gap-2"><Landmark className="h-4 w-4" /> Brasil (dividendos, FIIs, renda fixa): <strong>{formatBRL(div.brasil)}</strong></li>
          <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> Dólar/Global (IVVB11, WRLD11, BDRs): <strong>{formatBRL(div.global)}</strong></li>
          <li className="flex items-center gap-2"><Flame className="h-4 w-4" /> Pimenta (alto risco): <strong>{formatBRL(div.pimenta)}</strong></li>
        </ul>
        {faltante > 0 && <p className="mt-2 text-xs text-muted-foreground">Durante o sprint, só a sobra após a reserva vai para os pilares. Reserva fica 100% em reais.</p>}
      </div>
    </section>
  );
}
