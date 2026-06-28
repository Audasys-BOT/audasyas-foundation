import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatBRL, parseNumber } from "@/lib/format";
import { toast } from "sonner";
import { TrendingUp, Wallet, PiggyBank, ArrowDownRight, Trash2, Compass, Sparkles, RefreshCw, Sprout, Sun, Trees } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDailyGuidance } from "@/lib/guidance.functions";

export const Route = createFileRoute("/")({
  component: SimDashboard,
});

type Tx = { id: string; amount: number; description?: string; date: string };

function SimDashboard() {
  const [salario, setSalario] = useState("");
  const [custo, setCusto] = useState("");
  const [reserva, setReserva] = useState("");

  const liveCapacity = useMemo(
    () => parseNumber(salario) - parseNumber(custo),
    [salario, custo],
  );

  const [aporteValor, setAporteValor] = useState("");
  const [aporteDesc, setAporteDesc] = useState("");
  const [txs, setTxs] = useState<Tx[]>([]);

  const totalAportes = txs.reduce((s, t) => s + t.amount, 0);

  const addTx = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseNumber(aporteValor);
    if (v <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    setTxs((prev) => [
      {
        id: crypto.randomUUID(),
        amount: v,
        description: aporteDesc || undefined,
        date: new Date().toISOString(),
      },
      ...prev,
    ]);
    setAporteValor("");
    setAporteDesc("");
    toast.success("Aporte simulado adicionado");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary">AudasYAs</span> Invest
            </h1>
            <p className="text-xs text-muted-foreground">Modo simulação (sem login)</p>
          </div>
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-primary/40 text-primary">
            Sandbox
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="financeiro" className="space-y-8">
          <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="financeiro" className="gap-2">
              <Wallet className="h-4 w-4" /> Controle Financeiro
            </TabsTrigger>
            <TabsTrigger value="leme" className="gap-2">
              <Compass className="h-4 w-4" /> Leme da Vida
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financeiro" className="space-y-8 mt-0">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<Wallet className="h-4 w-4" />} label="Salário Mensal" value={formatBRL(parseNumber(salario))} />
          <KpiCard icon={<ArrowDownRight className="h-4 w-4" />} label="Custo de Vida Fixo" value={formatBRL(parseNumber(custo))} />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Capacidade de Aporte" value={formatBRL(liveCapacity)} highlight />
          <KpiCard icon={<PiggyBank className="h-4 w-4" />} label="Reserva de Emergência" value={formatBRL(parseNumber(reserva))} />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Controle Financeiro</CardTitle>
              <CardDescription>
                Capacidade de aporte = Salário − Custo de Vida Fixo. Atualizada em tempo real conforme você digita.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Salário Mensal (R$)" value={salario} onChange={setSalario} />
                <Field label="Custo de Vida Fixo (R$)" value={custo} onChange={setCusto} />
                <Field label="Reserva de Emergência (R$)" value={reserva} onChange={setReserva} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Novo Aporte</CardTitle>
              <CardDescription>Simule um aporte do mês.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={addTx}>
                <Field label="Valor (R$)" value={aporteValor} onChange={setAporteValor} />
                <div className="space-y-1.5">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    value={aporteDesc}
                    onChange={(e) => setAporteDesc(e.target.value)}
                    maxLength={120}
                    placeholder="Ex: Tesouro IPCA+ 2035"
                  />
                </div>
                <Button type="submit" className="w-full">Registrar aporte</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Histórico de Aportes</CardTitle>
              <CardDescription>Apenas na sessão atual</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total aportado</p>
              <p className="text-lg font-semibold text-primary">{formatBRL(totalAportes)}</p>
            </div>
          </CardHeader>
          <CardContent>
            {txs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum aporte ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {txs.map((t) => (
                  <li key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t.description || "Aporte"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-primary">{formatBRL(t.amount)}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTxs((p) => p.filter((x) => x.id !== t.id))}
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="leme" className="mt-0">
            <LemeDaVida />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0,00"
      />
    </div>
  );
}

function KpiCard({ icon, label, value, highlight }: { icon: ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
          {icon}
          <span>{label}</span>
        </div>
        <p className={`mt-2 text-2xl font-semibold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}