import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  createTransaction,
  fetchMetrics,
  fetchTransactions,
  upsertMetrics,
} from "@/features/finance/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, parseNumber } from "@/lib/format";
import { toast } from "sonner";
import { LogOut, TrendingUp, Wallet, PiggyBank, ArrowDownRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const qc = useQueryClient();

  const metricsQ = useQuery({
    queryKey: ["metrics", user.id],
    queryFn: () => fetchMetrics(user.id),
  });
  const txQ = useQuery({
    queryKey: ["transactions", user.id],
    queryFn: () => fetchTransactions(user.id),
  });

  const [salario, setSalario] = useState("");
  const [custo, setCusto] = useState("");
  const [reserva, setReserva] = useState("");

  useEffect(() => {
    if (metricsQ.data) {
      setSalario(String(metricsQ.data.salario_mensal ?? ""));
      setCusto(String(metricsQ.data.custo_de_vida_fixo ?? ""));
      setReserva(String(metricsQ.data.reserva_emergencia ?? ""));
    }
  }, [metricsQ.data]);

  const liveCapacity = useMemo(() => {
    const s = parseNumber(salario);
    const c = parseNumber(custo);
    return s - c;
  }, [salario, custo]);

  const saveMetrics = useMutation({
    mutationFn: () =>
      upsertMetrics(user.id, {
        salario_mensal: parseNumber(salario),
        custo_de_vida_fixo: parseNumber(custo),
        reserva_emergencia: parseNumber(reserva),
      }),
    onSuccess: () => {
      toast.success("Métricas salvas");
      qc.invalidateQueries({ queryKey: ["metrics", user.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const [aporteValor, setAporteValor] = useState("");
  const [aporteDesc, setAporteDesc] = useState("");
  const addTx = useMutation({
    mutationFn: () =>
      createTransaction(user.id, {
        amount: parseNumber(aporteValor),
        description: aporteDesc || undefined,
      }),
    onSuccess: () => {
      toast.success("Aporte registrado");
      setAporteValor("");
      setAporteDesc("");
      qc.invalidateQueries({ queryKey: ["transactions", user.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao registrar"),
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
  };

  const totalAportes = (txQ.data ?? []).reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary">AudasYAs</span> Invest
            </h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<Wallet className="h-4 w-4" />}
            label="Salário Mensal"
            value={formatBRL(parseNumber(salario))}
          />
          <KpiCard
            icon={<ArrowDownRight className="h-4 w-4" />}
            label="Custo de Vida Fixo"
            value={formatBRL(parseNumber(custo))}
          />
          <KpiCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Capacidade de Aporte"
            value={formatBRL(liveCapacity)}
            highlight
          />
          <KpiCard
            icon={<PiggyBank className="h-4 w-4" />}
            label="Reserva de Emergência"
            value={formatBRL(parseNumber(reserva))}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Metrics form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Controle Financeiro</CardTitle>
              <CardDescription>
                Capacidade de aporte = Salário − Custo de Vida Fixo. Atualizada em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveMetrics.mutate();
                }}
              >
                <Field label="Salário Mensal (R$)" value={salario} onChange={setSalario} />
                <Field label="Custo de Vida Fixo (R$)" value={custo} onChange={setCusto} />
                <Field
                  label="Reserva de Emergência (R$)"
                  value={reserva}
                  onChange={setReserva}
                />
                <div className="sm:col-span-3 flex justify-end">
                  <Button type="submit" disabled={saveMetrics.isPending}>
                    {saveMetrics.isPending ? "Salvando..." : "Salvar métricas"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* New aporte */}
          <Card>
            <CardHeader>
              <CardTitle>Novo Aporte</CardTitle>
              <CardDescription>Registre seu aporte do mês.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (parseNumber(aporteValor) <= 0) {
                    toast.error("Informe um valor válido");
                    return;
                  }
                  addTx.mutate();
                }}
              >
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
                <Button type="submit" className="w-full" disabled={addTx.isPending}>
                  {addTx.isPending ? "Registrando..." : "Registrar aporte"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Histórico de Aportes</CardTitle>
              <CardDescription>Últimos 50 registros</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total aportado</p>
              <p className="text-lg font-semibold text-primary">{formatBRL(totalAportes)}</p>
            </div>
          </CardHeader>
          <CardContent>
            {txQ.isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (txQ.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum aporte registrado ainda.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {txQ.data!.map((t) => (
                  <li key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {t.description || "Aporte"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.transaction_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-primary">
                      {formatBRL(Number(t.amount))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
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

function KpiCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
          {icon}
          <span>{label}</span>
        </div>
        <p
          className={`mt-2 text-2xl font-semibold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}