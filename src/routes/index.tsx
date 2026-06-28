import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatBRL, parseNumber } from "@/lib/format";
import { toast } from "sonner";
import { TrendingUp, Wallet, PiggyBank, ArrowDownRight, Trash2, Compass, Sparkles, RefreshCw, Sprout, Sun, Trees, LineChart, Plus, Brain, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDailyGuidance } from "@/lib/guidance.functions";
import { analyzeAsset, type AssetAnalysis } from "@/lib/assets.functions";
import { fetchQuote, type Quote } from "@/features/assets/brapi";

export const Route = createFileRoute("/")({
  component: SimDashboard,
});

type Tx = { id: string; amount: number; description?: string; date: string };

type Asset = { id: string; ticker: string; pct: number };
const ASSETS_KEY = "audasyas:assets";

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
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="financeiro" className="gap-2">
              <Wallet className="h-4 w-4" /> Controle Financeiro
            </TabsTrigger>
            <TabsTrigger value="leme" className="gap-2">
              <Compass className="h-4 w-4" /> Leme da Vida
            </TabsTrigger>
            <TabsTrigger value="ativos" className="gap-2">
              <LineChart className="h-4 w-4" /> Ativos
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

          <TabsContent value="ativos" className="mt-0">
            <Ativos aporteMensal={liveCapacity} />
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

// ============================================================
// LEME DA VIDA — long-term life compass
// ============================================================

const BIRTH_KEY = "audasyas:birthdate";

type Milestone = {
  age: number;
  title: string;
  subtitle: string;
  description: string;
  icon: ReactNode;
  accent: string;
};

const MILESTONES: Milestone[] = [
  {
    age: 20,
    title: "Futuro Presente",
    subtitle: "20 anos",
    description: "A semente plantada hoje começa a se firmar. Disciplina e constância no aporte mensal.",
    icon: <Sprout className="h-5 w-5" />,
    accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  },
  {
    age: 30,
    title: "Aposentadoria",
    subtitle: "30 anos",
    description: "Liberdade de escolha conquistada. O patrimônio sustenta o estilo de vida sem depender do salário.",
    icon: <Sun className="h-5 w-5" />,
    accent: "from-sky-500/20 to-sky-500/5 border-sky-500/30",
  },
  {
    age: 50,
    title: "Colheita da Tâmara",
    subtitle: "50 anos",
    description: "Legado familiar consolidado. A árvore plantada agora frutifica para as próximas gerações.",
    icon: <Trees className="h-5 w-5" />,
    accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  },
];

function LemeDaVida() {
  const [birth, setBirth] = useState<string>("");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(BIRTH_KEY) : null;
    if (stored) setBirth(stored);
  }, []);

  const persistBirth = (v: string) => {
    setBirth(v);
    if (typeof window !== "undefined") window.localStorage.setItem(BIRTH_KEY, v);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" /> Leme da Vida
          </CardTitle>
          <CardDescription>
            Bússola para o legado familiar. Defina sua data de nascimento para visualizar os marcos de 20, 30 e 50 anos a partir de hoje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="birth">Data de nascimento</Label>
            <Input
              id="birth"
              type="date"
              value={birth}
              onChange={(e) => persistBirth(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {MILESTONES.map((m) => (
          <MilestoneCard key={m.age} milestone={m} birth={birth} />
        ))}
      </section>

      <GuidanceCard />
    </div>
  );
}

function MilestoneCard({ milestone, birth }: { milestone: Milestone; birth: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = useMemo(() => {
    if (!birth) return null;
    const d = new Date(birth);
    if (Number.isNaN(d.getTime())) return null;
    d.setFullYear(d.getFullYear() + milestone.age);
    return d;
  }, [birth, milestone.age]);

  const remaining = useMemo(() => {
    if (!target) return null;
    const diff = target.getTime() - now;
    if (diff <= 0) return { reached: true, years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const totalSeconds = Math.floor(diff / 1000);
    const years = Math.floor(totalSeconds / (365.25 * 24 * 3600));
    const remAfterYears = totalSeconds - Math.floor(years * 365.25 * 24 * 3600);
    const days = Math.floor(remAfterYears / (24 * 3600));
    const hours = Math.floor((remAfterYears % (24 * 3600)) / 3600);
    const minutes = Math.floor((remAfterYears % 3600) / 60);
    const seconds = remAfterYears % 60;
    return { reached: false, years, days, hours, minutes, seconds };
  }, [target, now]);

  return (
    <Card className={`bg-gradient-to-br ${milestone.accent} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{milestone.subtitle}</span>
          <span className="text-foreground/70">{milestone.icon}</span>
        </div>
        <CardTitle className="text-xl">{milestone.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed min-h-[3rem]">
          {milestone.description}
        </p>
        {!remaining ? (
          <p className="text-xs text-muted-foreground italic">Defina sua data de nascimento para iniciar a contagem.</p>
        ) : remaining.reached ? (
          <p className="text-sm font-semibold text-primary">Marco alcançado 🌱</p>
        ) : (
          <div className="grid grid-cols-5 gap-1 text-center">
            <TimeUnit label="anos" value={remaining.years} />
            <TimeUnit label="dias" value={remaining.days} />
            <TimeUnit label="hrs" value={remaining.hours} />
            <TimeUnit label="min" value={remaining.minutes} />
            <TimeUnit label="seg" value={remaining.seconds} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimeUnit({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-background/40 border border-border/50 py-2">
      <p className="text-lg font-semibold tabular-nums text-foreground">{String(value).padStart(2, "0")}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function GuidanceCard() {
  const fn = useServerFn(getDailyGuidance);
  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["daily-guidance"],
    queryFn: () => fn(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Orientação do Dia
          </CardTitle>
          <CardDescription>Mensagem, versículo e reflexão geradas por IA para guiar sua jornada.</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Gerar nova orientação"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {isFetching && !data ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">
            Não foi possível gerar a orientação agora. Tente novamente.
          </p>
        ) : data ? (
          <>
            <p className="text-base leading-relaxed text-foreground">{data.mensagem}</p>
            <blockquote className="border-l-2 border-primary/60 pl-4 italic text-sm text-muted-foreground">
              "{data.versiculo}"
              <footer className="mt-1 not-italic text-xs text-primary/80">— {data.referencia}</footer>
            </blockquote>
            <div className="rounded-md bg-background/40 border border-border/60 p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Reflexão</p>
              <p className="text-sm text-foreground">{data.pergunta}</p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ============================================================
// ATIVOS — watchlist, IA analista e projeção de legado
// ============================================================

function Ativos({ aporteMensal }: { aporteMensal: number }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [ticker, setTicker] = useState("");
  const [pct, setPct] = useState<number>(5);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(ASSETS_KEY);
    if (raw) {
      try {
        setAssets(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const persist = (next: Asset[]) => {
    setAssets(next);
    if (typeof window !== "undefined") window.localStorage.setItem(ASSETS_KEY, JSON.stringify(next));
  };

  const addAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    if (assets.some((a) => a.ticker === t)) {
      toast.error("Ticker já adicionado");
      return;
    }
    persist([...assets, { id: crypto.randomUUID(), ticker: t, pct }]);
    setTicker("");
  };

  const removeAsset = (id: string) => persist(assets.filter((a) => a.id !== id));
  const updatePct = (id: string, pct: number) =>
    persist(assets.map((a) => (a.id === id ? { ...a, pct } : a)));

  const totalPct = assets.reduce((s, a) => s + a.pct, 0);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" /> Watchlist
          </CardTitle>
          <CardDescription>
            Adicione tickers da B3 (ex.: KNIP11, BBAS3). Preços via Brapi. Defina o percentual do aporte mensal destinado a cada ativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addAsset} className="grid gap-3 sm:grid-cols-[1fr_140px_auto] items-end">
            <div className="space-y-1.5">
              <Label>Ticker</Label>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="KNIP11"
                maxLength={12}
              />
            </div>
            <div className="space-y-1.5">
              <Label>% da carteira</Label>
              <select
                value={pct}
                onChange={(e) => setPct(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value={3}>3% — Conservador</option>
                <option value={5}>5% — Equilibrado</option>
                <option value={10}>10% — Audaz</option>
              </select>
            </div>
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </form>

          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ativo na watchlist ainda.</p>
          ) : (
            <div className="space-y-3">
              {assets.map((a) => (
                <AssetRow
                  key={a.id}
                  asset={a}
                  aporteMensal={aporteMensal}
                  onRemove={() => removeAsset(a.id)}
                  onPct={(p) => updatePct(a.id, p)}
                />
              ))}
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Total alocado: <span className={totalPct > 100 ? "text-destructive font-semibold" : "text-foreground font-semibold"}>{totalPct}%</span>
                {totalPct > 100 ? " — acima de 100%, rebalanceie." : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <LegadoProjection aporteMensal={aporteMensal} />
    </div>
  );
}

function AssetRow({
  asset,
  aporteMensal,
  onRemove,
  onPct,
}: {
  asset: Asset;
  aporteMensal: number;
  onRemove: () => void;
  onPct: (p: number) => void;
}) {
  const quote = useQuery<Quote>({
    queryKey: ["quote", asset.ticker],
    queryFn: () => fetchQuote(asset.ticker),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const analyzeFn = useServerFn(analyzeAsset);
  const [analysis, setAnalysis] = useState<AssetAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const valorMensal = (aporteMensal * asset.pct) / 100;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeFn({
        data: {
          ticker: asset.ticker,
          preco_atual: quote.data?.price ?? null,
          variacao_dia: quote.data?.change ?? null,
          percentual_carteira: asset.pct,
          aporte_mensal: aporteMensal,
        },
      });
      setAnalysis(res);
    } catch (e) {
      toast.error("Falha ao analisar: " + (e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const parecerStyle: Record<AssetAnalysis["parecer"], string> = {
    "Compra forte": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    Aguardar: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    Rebalancear: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  };

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] items-center">
        <div>
          <p className="font-semibold tracking-wide">{asset.ticker}</p>
          <p className="text-xs text-muted-foreground truncate">
            {quote.isLoading
              ? "Buscando preço…"
              : quote.data?.error
              ? `— ${quote.data.error}`
              : quote.data?.shortName || "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Preço</p>
          <p className="text-sm font-semibold tabular-nums">
            {quote.data?.price !== null && quote.data?.price !== undefined ? formatBRL(quote.data.price) : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Dia</p>
          <p
            className={`text-sm font-semibold tabular-nums ${
              (quote.data?.change ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {quote.data?.change !== null && quote.data?.change !== undefined
              ? `${quote.data.change.toFixed(2)}%`
              : "—"}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider">% Carteira</Label>
          <select
            value={asset.pct}
            onChange={(e) => onPct(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value={3}>3%</option>
            <option value={5}>5%</option>
            <option value={10}>10%</option>
          </select>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="gap-1"
          >
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
            Analisar
          </Button>
          <Button size="icon" variant="ghost" onClick={onRemove} aria-label="Remover">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Aporte mensal destinado: <span className="text-primary font-semibold">{formatBRL(valorMensal)}</span>
      </p>

      {analysis && (
        <div className="space-y-2 pt-2 border-t border-border">
          <span className={`inline-block text-xs px-2 py-1 rounded border ${parecerStyle[analysis.parecer]}`}>
            {analysis.parecer}
          </span>
          <p className="text-sm text-foreground leading-relaxed">{analysis.justificativa}</p>
          <p className="text-xs italic text-muted-foreground">{analysis.reflexao}</p>
        </div>
      )}
    </div>
  );
}

function LegadoProjection({ aporteMensal }: { aporteMensal: number }) {
  const [annualRate, setAnnualRate] = useState(10); // % a.a. real

  const project = (years: number) => {
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (r === 0) return aporteMensal * n;
    return aporteMensal * ((Math.pow(1 + r, n) - 1) / r);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trees className="h-5 w-5 text-primary" /> Projeção de Legado
        </CardTitle>
        <CardDescription>
          Juros compostos sobre o aporte mensal atual ({formatBRL(aporteMensal)}). Simulação — não considera inflação nem aportes variáveis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 sm:max-w-xs">
          <Label>Rentabilidade anual estimada (%)</Label>
          <Input
            type="number"
            min={0}
            max={30}
            step={0.5}
            value={annualRate}
            onChange={(e) => setAnnualRate(Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[30, 50].map((y) => (
            <div key={y} className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{y} anos</p>
              <p className="text-2xl font-semibold text-primary tabular-nums mt-1">{formatBRL(project(y))}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {y === 30 ? "Horizonte da Aposentadoria." : "Colheita da Tâmara — legado familiar."}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}