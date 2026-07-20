import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatBRL, parseNumber } from "@/lib/format";
import { toast } from "sonner";
import { TrendingUp, Wallet, PiggyBank, ArrowDownRight, Trash2, Compass, Sparkles, RefreshCw, Sprout, Sun, Trees, LineChart, Plus, Brain, Loader2, Target, Snowflake, Zap, LogOut, Pencil, Minus, ShieldAlert, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDailyGuidance } from "@/lib/guidance.functions";
import { analyzeAsset, type AssetAnalysis } from "@/lib/assets.functions";
import { fetchQuote, type Quote } from "@/features/assets/brapi";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/")({
  component: SimDashboard,
});

type Tx = { id: string; amount: number; description?: string; date: string };
type Asset = { id: string; ticker: string; pct: number };
const ASSETS_KEY_BASE = "audasyas:assets";

function SimDashboard() {
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const userId = user.id;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  // --- ESTADOS PRINCIPAIS (COM MEMÓRIA LOCAL E AUTOMAÇÃO) ---
  const [activeTab, setActiveTab] = useState("financeiro");
  const [salario, setSalario] = useState("");
  
  // Custo de vida manual vs automático
  const [custoManual, setCustoManual] = useState("");
  const [isEditingCusto, setIsEditingCusto] = useState(false);
  
  // Reserva acumulada e movimentações rápidas
  const [reservaAcumulada, setReservaAcumulada] = useState(0);
  const [valorAjusteReserva, setValorAjusteReserva] = useState("");

  // Teto da reserva manual vs automático
  const [tetoManual, setTetoManual] = useState("");
  const [isEditingTeto, setIsEditingTeto] = useState(false);

  const [aporteValor, setAporteValor] = useState("");
  const [aporteDesc, setAporteDesc] = useState("");
  const [txs, setTxs] = useState<Tx[]>([]);

  // --- CÁLCULOS AUTOMÁTICOS DE SAÚDE FINANCEIRA ---
  const salarioNum = parseNumber(salario);
  const custoIdeal = salarioNum * 0.6; // Recomendação: 60% máximo
  const custoFinal = isEditingCusto ? parseNumber(custoManual) : custoIdeal;
  
  const tetoRecomendado = custoFinal * 6; // Recomendação: 6 meses de custo fixo
  const tetoFinal = isEditingTeto ? parseNumber(tetoManual) : tetoRecomendado;

  const liveCapacity = Math.max(0, salarioNum - custoFinal);
  const percentualCusto = salarioNum > 0 ? (custoFinal / salarioNum) * 100 : 0;

  // --- MÓDULO DE RANKS DA RESERVA DE EMERGÊNCIA ---
  const pctProgressoReserva = tetoFinal > 0 ? Math.min(100, (reservaAcumulada / tetoFinal) * 100) : 0;
  
  const { rankAtual, proximoRank, valorProximoAlvo } = useMemo(() => {
    if (pctProgressoReserva >= 100) {
      return { rankAtual: "🏆 Nível 4: Colheita da Tâmara", proximoRank: "Meta Concluída!", valorProximoAlvo: tetoFinal };
    } else if (pctProgressoReserva >= 75) {
      return { rankAtual: "🌳 Nível 3: Árvore Firme", proximoRank: "🏆 Nível 4: Colheita da Tâmara (6 Meses)", valorProximoAlvo: tetoFinal };
    } else if (pctProgressoReserva >= 50) {
      return { rankAtual: "🌿 Nível 2: Raiz Forte", proximoRank: "🌳 Nível 3: Árvore Firme (4.5 Meses)", valorProximoAlvo: tetoFinal * 0.75 };
    } else if (pctProgressoReserva >= 16.6) {
      return { rankAtual: "🌱 Nível 1: Broto", proximoRank: "🌿 Nível 2: Raiz Forte (3 Meses)", valorProximoAlvo: tetoFinal * 0.5 };
    }
    return { rankAtual: "Definindo Base 🌱", proximoRank: "🌱 Nível 1: Broto (1 Mês)", valorProximoAlvo: tetoFinal * 0.166 };
  }, [pctProgressoReserva, tetoFinal]);

  const faltamParaProximo = Math.max(0, valorProximoAlvo - reservaAcumulada);
  const reservaFaltanteTotal = Math.max(0, tetoFinal - reservaAcumulada);
  
  // --- REGRA DE CONSTRUÇÃO SIMULTÂNEA (60% Reserva / 40% Ativos) ---
  const sugestaoReservaMes = Math.min(reservaFaltanteTotal, liveCapacity * 0.6);
  const aporteSugeridoAtivos = Math.max(0, liveCapacity - sugestaoReservaMes);
  const metaReservaAtingida = tetoFinal > 0 && reservaFaltanteTotal <= 0;

  // --- CASH TIERING (RESERVA EM CAMADAS) ---
  const LIMITE_PRONTIDAO = 2000;
  const isProntidaoSegura = reservaAcumulada >= LIMITE_PRONTIDAO;
  const faltamProntidao = Math.max(0, LIMITE_PRONTIDAO - reservaAcumulada);

  // --- AÇÕES DE AJUSTE DA RESERVA ---
  const handleGuardarReserva = () => {
    const valor = parseNumber(valorAjusteReserva);
    if (valor <= 0) return toast.error("Informe um valor válido");
    setReservaAcumulada((prev) => prev + valor);
    setValorAjusteReserva("");
    toast.success(`R$ ${valor.toFixed(2)} adicionados à sua Reserva`);
  };

  const handleRetirarReserva = () => {
    const valor = parseNumber(valorAjusteReserva);
    if (valor <= 0) return toast.error("Informe um valor válido");
    if (valor > reservaAcumulada) return toast.error("Saldo insuficiente na reserva");
    setReservaAcumulada((prev) => prev - valor);
    setValorAjusteReserva("");
    toast.warning(`Retirada de R$ ${valor.toFixed(2)} registrada da Reserva`);
  };

  const totalAportes = txs.reduce((s, t) => s + t.amount, 0);

  const addTx = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseNumber(aporteValor);
    if (v <= 0) return toast.error("Informe um valor válido");
    setTxs((prev) => [
      { id: crypto.randomUUID(), amount: v, description: aporteDesc || undefined, date: new Date().toISOString() },
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
            <p className="text-xs text-muted-foreground">{user.email ?? "Sessão ativa"}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full sm:w-auto grid-cols-4">
            <TabsTrigger value="financeiro" className="gap-2">
              <Wallet className="h-4 w-4" /> Controle Financeiro
            </TabsTrigger>
            <TabsTrigger value="estrategista" className="gap-2">
              <Target className="h-4 w-4" /> Estrategista
            </TabsTrigger>
            <TabsTrigger value="leme" className="gap-2">
              <Compass className="h-4 w-4" /> Leme da Vida
            </TabsTrigger>
            <TabsTrigger value="ativos" className="gap-2">
              <LineChart className="h-4 w-4" /> Ativos
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: CONTROLE FINANCEIRO (CENTRAL DE DIAGNÓSTICO) */}
          <TabsContent value="financeiro" className="space-y-8 mt-0">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard icon={<Wallet className="h-4 w-4" />} label="Salário Mensal" value={formatBRL(salarioNum)} />
              <KpiCard icon={<ArrowDownRight className="h-4 w-4" />} label="Custo de Vida Fixo" value={formatBRL(custoFinal)} />
              <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Disponível para Ativos" value={formatBRL(aporteSugeridoAtivos)} highlight />
              <KpiCard icon={<PiggyBank className="h-4 w-4" />} label="Reserva Acumulada" value={formatBRL(reservaAcumulada)} />
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Diagnóstico Orçamentário</CardTitle>
                  <CardDescription>
                    Gerencie suas entradas e a estrutura fixa do orçamento sob a ótica dos planejadores familiares.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Input Salário */}
                    <div className="space-y-1.5">
                      <Label>Salário Mensal (R$)</Label>
                      <Input inputMode="decimal" value={salario} onChange={(e) => setSalario(e.target.value)} placeholder="0,00" />
                      <p className="text-[11px] text-muted-foreground">Sua base de cálculo essencial.</p>
                    </div>

                    {/* Input Custo Fixo Automático/Manual */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label>Custo de Vida Fixo (R$)</Label>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setIsEditingCusto(!isEditingCusto); if(!isEditingCusto) setCustoManual(custoFinal.toString()); }}>
                          <Pencil className={`h-3 w-3 ${isEditingCusto ? "text-primary" : "text-muted-foreground"}`} />
                        </Button>
                      </div>
                      <Input inputMode="decimal" value={isEditingCusto ? custoManual : custoIdeal.toFixed(2)} onChange={(e) => setCustoManual(e.target.value)} disabled={!isEditingCusto} />
                      <p className={`text-[11px] font-medium ${percentualCusto > 60 ? "text-amber-400" : "text-emerald-400"}`}>
                        {isEditingCusto ? `Custo real consome ${percentualCusto.toFixed(0)}%` : `Sugerido (60%): ${formatBRL(custoIdeal)}`}
                      </p>
                    </div>
                  </div>

                  {/* SEÇÃO DA RESERVA AUTOMÁTICA E RANKING */}
                  <div className="border-t border-border pt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          Escudo de Proteção Familiar <span className="text-xs px-2 py-0.5 rounded bg-secondary text-primary font-bold">{rankAtual}</span>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Teto recomendado de 6 meses de custo fixo: <span className="text-foreground font-medium">{formatBRL(tetoFinal)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setIsEditingTeto(!isEditingTeto); if(!isEditingTeto) setTetoManual(tetoFinal.toString()); }}>
                          <Pencil className={`h-3 w-3 ${isEditingTeto ? "text-primary" : "text-muted-foreground"}`} />
                        </Button>
                        {isEditingTeto && (
                          <Input className="h-7 w-28 text-xs" inputMode="decimal" value={tetoManual} onChange={(e) => setTetoManual(e.target.value)} placeholder="Teto Customizado" />
                        )}
                      </div>
                    </div>

                    {/* Barra de Progresso com os Ticks dos Níveis */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden relative border border-border">
                        <div className="bg-primary h-full transition-all duration-300" style={{ width: `${pctProgressoReserva}%` }} />
                        <div className="absolute left-[16.6%] top-0 bottom-0 w-0.5 bg-background/40" title="Nível 1 (1 Mês)" />
                        <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-background/40" title="Nível 2 (3 Meses)" />
                        <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-background/40" title="Nível 3 (4.5 Meses)" />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                        <span>Progresso: {pctProgressoReserva.toFixed(1)}%</span>
                        {pctProgressoReserva < 100 ? (
                          <span>Próximo alvo: Mais {formatBRL(faltamParaProximo)} para o {proximoRank}</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Reserva Totalmente Blindada!</span>
                        )}
                      </div>
                    </div>

                    {/* AVISO EDUCATIVO (CASH TIERING) */}
                    <div className={`p-4 rounded-lg border space-y-3 transition-colors ${metaReservaAtingida ? "bg-emerald-500/5 border-emerald-500/20" : isProntidaoSegura ? "bg-sky-500/5 border-sky-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                      <div className="flex items-center gap-2">
                        {metaReservaAtingida ? <ShieldCheck className="h-4 w-4 text-emerald-400" /> : isProntidaoSegura ? <TrendingUp className="h-4 w-4 text-sky-400" /> : <ShieldAlert className="h-4 w-4 text-amber-400" />}
                        <h5 className="font-semibold text-sm">
                          {metaReservaAtingida ? "Escudo Concluído!" : isProntidaoSegura ? "Camada de Resiliência (LCI/LCA)" : "Camada de Prontidão (CDB Diário)"}
                        </h5>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {metaReservaAtingida 
                          ? "Sua segurança está garantida. 100% da sua capacidade de aporte agora flui diretamente para a multiplicação de patrimônio (Aba Ativos)." 
                          : !isProntidaoSegura
                          ? `Estratégia Simultânea 60/40 ativada. Direcione os R$ ${formatBRL(sugestaoReservaMes)} da reserva deste mês para um CDB 100% CDI com Liquidez Diária. Faltam R$ ${formatBRL(faltamProntidao)} para liberar o nível de LCI/LCA.`
                          : `Base imediata blindada! A partir de agora, divida os R$ ${formatBRL(sugestaoReservaMes)} da sua reserva mensal: mantenha 30% no CDB Diário e direcione 70% para LCI/LCA (isento de IR e maior rentabilidade).`}
                      </p>
                    </div>

                    {/* Gestão Dinâmica da Reserva (Guardar e Retirar) */}
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end bg-background/30 p-3 rounded-lg border border-border">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Movimentar Fundo de Emergência (R$)</Label>
                        <Input inputMode="decimal" value={valorAjusteReserva} onChange={(e) => setValorAjusteReserva(e.target.value)} placeholder="0,00" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20" onClick={handleGuardarReserva}>
                          <Plus className="h-4 w-4" /> Guardar
                        </Button>
                        <Button type="button" variant="secondary" className="gap-1 bg-red-500/10 text-red-300 hover:bg-red-500/20" onClick={handleRetirarReserva}>
                          <Minus className="h-4 w-4" /> Retirar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bloco Novo Aporte */}
              <Card>
                <CardHeader>
                  <CardTitle>Simulador Instantâneo</CardTitle>
                  <CardDescription>Simule aportes manuais avulsos para testes de tela.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-3" onSubmit={addTx}>
                    <Field label="Valor (R$)" value={aporteValor} onChange={setAporteValor} />
                    <div className="space-y-1.5">
                      <Label>Descrição (opcional)</Label>
                      <Input value={aporteDesc} onChange={(e) => setAporteDesc(e.target.value)} maxLength={120} placeholder="Ex: Aporte Geral" />
                    </div>
                    <Button type="submit" className="w-full">Registrar aporte</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TRAVA INTELIGENTE/AMIGÁVEL PARA AS OUTRAS ABAS */}
          {salarioNum === 0 ? (
            <TabsContent value={activeTab} className="mt-0">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card p-12 text-center max-w-2xl mx-auto space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Falta apenas um detalhe estratégico...</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para podermos desenhar sua árvore de alocação de ativos e projetar o seu Leme da Vida de longo prazo, precisamos primeiro descobrir sua capacidade real de aporte do mês.
                </p>
                <Button onClick={() => setActiveTab("financeiro")} className="mt-2">
                  Preencher Dados Financeiros
                </Button>
              </Card>
            </TabsContent>
          ) : (
            <>
              <TabsContent value="leme" className="mt-0">
                <LemeDaVida userId={userId} />
              </TabsContent>

              <TabsContent value="ativos" className="mt-0">
                <Ativos userId={userId} aporteMensal={aporteSugeridoAtivos} metaReservaAtingida={metaReservaAtingida} />
              </TabsContent>

              <TabsContent value="estrategista" className="mt-0">
                <Estrategista
                  userId={userId}
                  aporteSugerido={aporteSugeridoAtivos}
                  sugestaoReserva={sugestaoReservaMes}
                  reservaFaltante={reservaFaltanteTotal}
                  reservaTeto={tetoFinal}
                  metaReservaAtingida={metaReservaAtingida}
                  liveCapacity={liveCapacity}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0,00" />
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
const BIRTH_KEY_BASE = "audasyas:birthdate";
type Milestone = { age: number; title: string; subtitle: string; description: string; icon: ReactNode; accent: string };

const MILESTONES: Milestone[] = [
  { age: 20, title: "Futuro Presente", subtitle: "20 anos", description: "A semente plantada hoje começa a se firmar. Disciplina e constância no aporte mensal.", icon: <Sprout className="h-5 w-5" />, accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" },
  { age: 30, title: "Aposentadoria", subtitle: "30 anos", description: "Liberdade de escolha conquistada. O patrimônio sustenta o estilo de vida sem depender do salário.", icon: <Sun className="h-5 w-5" />, accent: "from-sky-500/20 to-sky-500/5 border-sky-500/30" },
  { age: 50, title: "Colheita da Tâmara", subtitle: "50 anos", description: "Legado familiar consolidado. A árvore plantada agora frutifica para as próximas gerações.", icon: <Trees className="h-5 w-5" />, accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
];

function LemeDaVida({ userId }: { userId: string }) {
  const [birth, setBirth] = useState<string>("");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(`${BIRTH_KEY_BASE}:${userId}`) : null;
    if (stored) setBirth(stored);
  }, []);

  const persistBirth = (v: string) => {
    setBirth(v);
    if (typeof window !== "undefined") window.localStorage.setItem(`${BIRTH_KEY_BASE}:${userId}`, v);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" /> Leme da Vida
          </CardTitle>
          <CardDescription>Bússola para o legado familiar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="birth">Data de nascimento</Label>
            <Input id="birth" type="date" value={birth} onChange={(e) => persistBirth(e.target.value)} />
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
        <p className="text-xs text-muted-foreground leading-relaxed min-h-[3rem]">{milestone.description}</p>
        {!remaining ? (
          <p className="text-xs text-muted-foreground italic">Defina sua data de nascimento.</p>
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
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {isFetching && !data ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">Não foi possível gerar a orientação agora.</p>
        ) : data ? (
          <>
            <p className="text-base leading-relaxed text-foreground">{data.mensagem}</p>
            <blockquote className="border-l-2 border-primary/60 pl-4 italic text-sm text-muted-foreground">
              "{data.versiculo}"
              <footer className="mt-1 not-italic text-xs text-primary/80">— {data.referencia}</footer>
            </blockquote>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ============================================================
// ATIVOS — watchlist, IA analista e projeção de legado
// ============================================================
function Ativos({ userId, aporteMensal, metaReservaAtingida }: { userId: string; aporteMensal: number; metaReservaAtingida: boolean }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [ticker, setTicker] = useState("");
  const [pct, setPct] = useState<number>(5);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(`${ASSETS_KEY_BASE}:${userId}`);
    if (raw) { try { setAssets(JSON.parse(raw)); } catch { } }
  }, []);

  const persist = (next: Asset[]) => {
    setAssets(next);
    if (typeof window !== "undefined") window.localStorage.setItem(`${ASSETS_KEY_BASE}:${userId}`, JSON.stringify(next));
  };

  const addAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    if (assets.some((a) => a.ticker === t)) return toast.error("Ticker já adicionado");
    persist([...assets, { id: crypto.randomUUID(), ticker: t, pct }]);
    setTicker("");
  };

  const totalPct = assets.reduce((s, a) => s + a.pct, 0);

  return (
    <div className="space-y-8">
      {!metaReservaAtingida && (
        <Card className="border-sky-500/40 bg-sky-500/5">
          <CardContent className="pt-5 flex items-start gap-3">
            <PiggyBank className="h-5 w-5 text-sky-300 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-sky-200">Construção Simultânea Ativada (40% Liberado)</p>
              <p className="text-xs text-muted-foreground mt-1">
                A sua Reserva de Emergência ainda não atingiu o teto, mas pela regra de equilíbrio, o sistema já liberou 40% da sua sobra mensal para você iniciar os aportes em Renda Variável e FIIs.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addAsset} className="grid gap-3 sm:grid-cols-[1fr_140px_auto] items-end">
            <div className="space-y-1.5">
              <Label>Ticker</Label>
              <Input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="KNIP11" maxLength={12} />
            </div>
            <div className="space-y-1.5">
              <Label>% da carteira</Label>
              <select value={pct} onChange={(e) => setPct(Number(e.target.value))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value={3}>3% — Conservador</option>
                <option value={5}>5% — Equilibrado</option>
                <option value={10}>10% — Audaz</option>
              </select>
            </div>
            <Button type="submit"><Plus className="h-4 w-4" /> Adicionar</Button>
          </form>
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ativo monitorado.</p>
          ) : (
            <div className="space-y-3">
              {assets.map((a) => (
                <AssetRow key={a.id} asset={a} aporteMensal={aporteMensal} metaReservaAtingida={metaReservaAtingida} onRemove={() => persist(assets.filter((x) => x.id !== a.id))} onPct={(p) => persist(assets.map((x) => x.id === a.id ? { ...x, pct: p } : x))} />
              ))}
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Total alocado: <span>{totalPct}%</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <LegadoProjection aporteMensal={aporteMensal} />
    </div>
  );
}

function AssetRow({ asset, aporteMensal, metaReservaAtingida, onRemove, onPct }: { asset: Asset; aporteMensal: number; metaReservaAtingida: boolean; onRemove: () => void; onPct: (p: number) => void }) {
  const quote = useQuery<Quote>({ queryKey: ["quote", asset.ticker], queryFn: () => fetchQuote(asset.ticker), staleTime: 60_000, refetchOnWindowFocus: false });
  const analyzeFn = useServerFn(analyzeAsset);
  const [analysis, setAnalysis] = useState<AssetAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [valorAporte, setValorAporte] = useState("");

  const change = quote.data?.change ?? null;
  const isOpportunity = change !== null && change <= -3;
  const valorBase = (aporteMensal * asset.pct) / 100;
  const valorSugerido = isOpportunity ? valorBase * 1.03 : valorBase;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeFn({ data: { ticker: asset.ticker, preco_atual: quote.data?.price ?? null, variacao_dia: change, percentual_carteira: asset.pct, aporte_mensal: aporteMensal } });
      setAnalysis(res);
      if (valorSugerido > 0) {
        setValorAporte(valorSugerido.toFixed(2).replace(".", ","));
      }
    } catch (e) { } finally { setAnalyzing(false); }
  };

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] items-center">
        <div><p className="font-semibold">{asset.ticker}</p></div>
        <div className="text-right"><p className="text-sm font-semibold">{quote.data?.price ? formatBRL(quote.data.price) : "—"}</p></div>
        <div className="text-right"><p className={`text-sm font-semibold ${(change ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{change !== null ? `${change.toFixed(2)}%` : "—"}</p></div>
        <div className="flex gap-1">
          <Button size="sm" variant="secondary" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />} Analisar
          </Button>
          <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      {analysis && <p className="text-xs italic text-muted-foreground mt-1">{analysis.justificativa}</p>}
    </div>
  );
}

function LegadoProjection({ aporteMensal }: { aporteMensal: number }) {
  const [annualRate, setAnnualRate] = useState(10);
  const [dividendYield, setDividendYield] = useState(6);

  const project = (years: number) => {
    const totalAnnualRate = (annualRate + dividendYield) / 100;
    const r = totalAnnualRate / 12;
    const n = years * 12;
    if (r === 0) return { total: aporteMensal * n, aportado: aporteMensal * n };
    const total = aporteMensal * ((Math.pow(1 + r, n) - 1) / r);
    return { total, aportado: aporteMensal * n };
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardHeader><CardTitle>Projeção Avalanche de Legado</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          {[20, 30, 50].map((y) => {
            const p = project(y);
            return (
              <div key={y} className="rounded-lg border border-border bg-background/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{y} anos</p>
                <p className="text-2xl font-semibold text-primary mt-1">{formatBRL(p.total)}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ESTRATEGISTA DE APORTE — sugere divisão do aporte mensal
// ============================================================
function Estrategista({ aporteSugerido, sugestaoReserva, reservaFaltante, reservaTeto, metaReservaAtingida, liveCapacity, userId }: { aporteSugerido: number; sugestaoReserva: number; reservaFaltante: number; reservaTeto: number; metaReservaAtingida: boolean; liveCapacity: number; userId: string }) {
  const [valor, setValor] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(`${ASSETS_KEY_BASE}:${userId}`);
    if (raw) { try { setAssets(JSON.parse(raw)); } catch { } }
  }, []);

  useEffect(() => {
    if (!valor && liveCapacity > 0) setValor(liveCapacity.toFixed(2).replace(".", ","));
  }, [liveCapacity]);

  const v = parseNumber(valor);
  
  // Aplica a regra 60/40 com base no valor digitado (mantendo limite do que falta na reserva)
  const valorReserva = metaReservaAtingida ? 0 : Math.min(reservaFaltante, v * 0.6);
  const valorAtivos = metaReservaAtingida ? v : Math.max(0, v - valorReserva);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Divisão Sugerida de Fluxo</CardTitle>
          <CardDescription>
            {metaReservaAtingida 
              ? "Reserva blindada. 100% livre para alocação em ativos." 
              : "Construção Simultânea (60% retido para Reserva e 40% livre para Ativos)."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Capacidade Mês</p>
              <Input className="h-8 text-lg font-semibold mt-1 bg-transparent border-none px-0 shadow-none focus-visible:ring-0" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
              <p className="text-[10px] uppercase tracking-widest text-sky-300">Reter p/ Reserva</p>
              <p className="text-lg font-semibold text-sky-300 mt-1">{formatBRL(valorReserva)}</p>
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="text-[10px] uppercase tracking-widest text-primary">Direcionar p/ Ativos</p>
              <p className="text-lg font-semibold text-primary mt-1">{formatBRL(valorAtivos)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}