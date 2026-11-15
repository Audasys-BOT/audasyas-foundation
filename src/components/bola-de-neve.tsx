import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, parseNumber } from "@/lib/format";
import { poderDeCompra, alocacaoBarbell, metaReserva1Ano, cotasGratis } from "@/features/finance/snowball";
import { Snowflake, Flame, Landmark, CheckCircle2, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Ordem = { ticker: string; preco: number; peso: number; pimenta?: boolean };
const BASE: Ordem[] = [
  { ticker: "MXRF11", preco: 10.2, peso: 0.3 },
  { ticker: "HGLG11", preco: 160, peso: 0.25 },
  { ticker: "TAEE11", preco: 36, peso: 0.25 },
  { ticker: "BBAS3", preco: 27.5, peso: 0.2 },
];
const PIMENTA: Ordem = { ticker: "IVVB11", preco: 330, peso: 1, pimenta: true };
const BANCOS = ["Nubank", "Inter", "XP", "BTG", "Itaú"];

type State = { proventos: number; feitas: string[]; mes: string; bancos: string[] };
const mesAtual = () => new Date().toISOString().slice(0, 7);

export function BolaDeNeve({ userId, poupanca, salario, reserva }: { userId: string; poupanca: number; salario: number; reserva: number }) {
  const key = `audasyas:snowball:${userId}`;
  const [s, setS] = useState<State>({ proventos: 0, feitas: [], mes: mesAtual(), bancos: [] });
  const [novo, setNovo] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const v = JSON.parse(raw) as State;
        setS(v.mes === mesAtual() ? v : { ...v, feitas: [], mes: mesAtual() });
      }
    } catch {}
    supabase.from("snowball_state").select("data").eq("user_id", userId).maybeSingle().then(({ data }) => {
      const v = data?.data as unknown as State | undefined;
      if (v && v.mes) { const n = v.mes === mesAtual() ? v : { ...v, feitas: [], mes: mesAtual() }; setS(n); localStorage.setItem(key, JSON.stringify(n)); }
    });
  }, [key, userId]);
  const save = (n: State) => {
    setS(n); localStorage.setItem(key, JSON.stringify(n));
    supabase.from("snowball_state").upsert({ user_id: userId, data: n as never, updated_at: new Date().toISOString() }).then(({ error }) => { if (error) toast.error("Não foi possível salvar na nuvem"); });
  };

  const r = metaReserva1Ano(salario, reserva);
  const reservaMes = Math.min(r.parcelaMensal, poupanca);
  const poder = poderDeCompra(poupanca - reservaMes, s.proventos);
  const { base, pimenta } = alocacaoBarbell(poder.total);

  const ordens = [
    ...BASE.map((o) => ({ ...o, qtd: Math.floor((base * o.peso) / o.preco) })),
    { ...PIMENTA, qtd: Math.floor(pimenta / PIMENTA.preco) },
  ].filter((o) => o.qtd > 0);
  const pendentes = ordens.filter((o) => !s.feitas.includes(o.ticker)).length;

  const confirmar = (o: Ordem & { qtd: number }) => {
    const gasto = o.qtd * o.preco;
    save({ ...s, feitas: [...s.feitas, o.ticker], proventos: Math.max(0, s.proventos - gasto) });
    toast.success(`Compra de ${o.qtd} ${o.ticker} registrada`);
  };

  const sincronizar = () => {
    const credito = Math.round((20 + Math.random() * 40) * 100) / 100;
    save({ ...s, proventos: s.proventos + credito });
    toast.success(`Pingou ${formatBRL(credito)} de proventos (simulado)`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Snowflake className="h-5 w-5 text-primary" /> Bola de Neve</CardTitle>
          <CardDescription>Dividendo não se gasta: ele volta para comprar mais cotas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Box label="Do salário (após reserva)" value={formatBRL(poder.doSalario)} />
            <Box label="Proventos para reinvestir" value={formatBRL(poder.deProventos)} strong />
            <Box label="Poder de compra do mês" value={formatBRL(poder.total)} strong />
          </div>
          {!r.falta ? null : (
            <p className="text-sm text-muted-foreground">Reserva: meta {formatBRL(r.meta)} (3x salário). Guarde {formatBRL(reservaMes)} este mês para chegar lá em 12 meses.</p>
          )}
          {cotasGratis(s.proventos, 10.2) > 0 && (
            <p className="text-sm text-primary">Seus proventos já compram {cotasGratis(s.proventos, 10.2)} cotas de MXRF11 sem tirar nada do salário.</p>
          )}
          <div className="flex gap-2 max-w-sm">
            <Input inputMode="decimal" placeholder="Provento recebido (R$)" value={novo} onChange={(e) => setNovo(e.target.value)} />
            <Button onClick={() => { const v = parseNumber(novo); if (v > 0) { save({ ...s, proventos: s.proventos + v }); setNovo(""); } }}><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boleta Guiada do mês</CardTitle>
          <CardDescription>95% em base sólida ({formatBRL(base)}) e 5% de pimenta ({formatBRL(pimenta)}). Compre no app do seu banco e confirme aqui.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className={`flex items-center gap-2 text-sm font-semibold ${pendentes ? "text-destructive" : "text-primary"}`}>
            {pendentes ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {ordens.length === 0 ? "Sem valor para aportar ainda." : pendentes ? `${pendentes} compra(s) pendente(s). Disciplina constrói patrimônio.` : "Aporte do mês cumprido!"}
          </p>
          {ordens.map((o) => {
            const feita = s.feitas.includes(o.ticker);
            return (
              <div key={o.ticker} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="font-bold flex items-center gap-1.5">{o.pimenta && <Flame className="h-4 w-4 text-destructive" />}{o.ticker}</p>
                  <p className="text-xs text-muted-foreground">{o.qtd} cotas × ~{formatBRL(o.preco)}{o.pimenta ? " · risco consciente" : ""}</p>
                </div>
                <Button size="sm" variant={feita ? "secondary" : "default"} disabled={feita} onClick={() => confirmar(o)}>
                  {feita ? "Comprado" : "Comprei"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Bancos conectados (Open Finance)</CardTitle>
          <CardDescription>Somente leitura: saldos, proventos e custódia. Modo simulado até ativarmos a conexão real.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {BANCOS.map((b) => {
              const on = s.bancos.includes(b);
              return (
                <Button key={b} size="sm" variant={on ? "default" : "outline"} onClick={() => save({ ...s, bancos: on ? s.bancos.filter((x) => x !== b) : [...s.bancos, b] })}>
                  {on ? "✓ " : ""}{b}
                </Button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" disabled={!s.bancos.length} onClick={sincronizar} className="gap-2"><RefreshCw className="h-4 w-4" /> Sincronizar proventos</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Box({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${strong ? "border-primary/40 bg-primary/10" : "border-border"}`}>
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${strong ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
