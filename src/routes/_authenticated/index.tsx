import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatBRL, parseNumber } from "@/lib/format";
import { toast } from "sonner";
import { TrendingUp, Wallet, PiggyBank, ArrowDownRight, Trash2, Compass, Sparkles, RefreshCw, Sprout, Sun, Trees, LineChart, Plus, Brain, Loader2, Target, Snowflake, Zap, LogOut, Pencil, Minus, ShieldAlert, ShieldCheck, Droplets, Crown, CheckCircle2, AlertTriangle, Coffee, Info, Activity, Building, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDailyGuidance } from "@/lib/guidance.functions";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/")({
  component: SimDashboard,
});

type Tx = { id: string; amount: number; description?: string; date: string };
const PROFILE_KEY_BASE = "audasyas:invest_profile";

function SimDashboard() {
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const userId = user.id;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  const [activeTab, setActiveTab] = useState("financeiro");
  const [salario, setSalario] = useState("");
  const [custoManual, setCustoManual] = useState("");
  const [isEditingCusto, setIsEditingCusto] = useState(false);
  const [reservaAcumulada, setReservaAcumulada] = useState(0);
  const [valorAjusteReserva, setValorAjusteReserva] = useState("");
  const [tetoManual, setTetoManual] = useState("");
  const [isEditingTeto, setIsEditingTeto] = useState(false);
  const [aporteValor, setAporteValor] = useState("");
  const [aporteDesc, setAporteDesc] = useState("");
  const [txs, setTxs] = useState<Tx[]>([]);

  const salarioNum = parseNumber(salario);
  const custoIdeal = salarioNum * 0.6; 
  const custoFinal = isEditingCusto ? parseNumber(custoManual) : custoIdeal;
  const tetoRecomendado = custoFinal * 6; 
  const tetoFinal = isEditingTeto ? parseNumber(tetoManual) : tetoRecomendado;

  const liveCapacity = Math.max(0, salarioNum - custoFinal);
  const percentualCusto = salarioNum > 0 ? (custoFinal / salarioNum) * 100 : 0;

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
  
  const sugestaoReservaMes = Math.min(reservaFaltanteTotal, liveCapacity * 0.6);
  const aporteSugeridoAtivos = Math.max(0, liveCapacity - sugestaoReservaMes);
  const metaReservaAtingida = tetoFinal > 0 && reservaFaltanteTotal <= 0;

  const LIMITE_PRONTIDAO = 2000;
  const isProntidaoSegura = reservaAcumulada >= LIMITE_PRONTIDAO;
  const faltamProntidao = Math.max(0, LIMITE_PRONTIDAO - reservaAcumulada);

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

          {/* ABA 1: CONTROLE FINANCEIRO */}
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
                    <div className="space-y-1.5">
                      <Label>Salário Mensal (R$)</Label>
                      <Input inputMode="decimal" value={salario} onChange={(e) => setSalario(e.target.value)} placeholder="0,00" />
                      <p className="text-[11px] text-muted-foreground">Sua base de cálculo essencial.</p>
                    </div>

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
            </div>
          </TabsContent>

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
                <LemeDaVida userId={userId} aporteMensalSugerido={aporteSugeridoAtivos} />
              </TabsContent>

              <TabsContent value="ativos" className="mt-0">
                <Ativos aporteMensal={aporteSugeridoAtivos} metaReservaAtingida={metaReservaAtingida} />
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
                  custoFixo={custoFinal}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}

// ============================================================
// ESTRATEGISTA (Inalterado)
// ============================================================
type Profile = { horizon: string; family: string; risk: string };

function Estrategista({ aporteSugerido, sugestaoReserva, reservaFaltante, reservaTeto, metaReservaAtingida, liveCapacity, userId, custoFixo }: { aporteSugerido: number; sugestaoReserva: number; reservaFaltante: number; reservaTeto: number; metaReservaAtingida: boolean; liveCapacity: number; userId: string; custoFixo: number }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [valorManual, setValorManual] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(`${PROFILE_KEY_BASE}:${userId}`);
    if (stored) { try { setProfile(JSON.parse(stored)); } catch { } }
  }, [userId]);

  const saveProfile = (p: Profile) => {
    setProfile(p);
    if (typeof window !== "undefined") window.localStorage.setItem(`${PROFILE_KEY_BASE}:${userId}`, JSON.stringify(p));
  };

  useEffect(() => {
    if (!valorManual && liveCapacity > 0) setValorManual(liveCapacity.toFixed(2).replace(".", ","));
  }, [liveCapacity]);

  const v = parseNumber(valorManual);
  const valorReserva = metaReservaAtingida ? 0 : Math.min(reservaFaltante, v * 0.6);
  const valorAtivos = metaReservaAtingida ? v : Math.max(0, v - valorReserva);

  if (!profile) {
    return <ProfileOnboarding onComplete={saveProfile} />;
  }

  const TAXA_ANUAL_DIVIDENDOS = 0.08; 
  const taxaMensal = TAXA_ANUAL_DIVIDENDOS / 12;
  const aporteAcao = valorAtivos > 0 ? valorAtivos : 1; 

  const calcularMesesParaRenda = (rendaAlvo: number) => {
    if (rendaAlvo <= 0) return 0;
    const n = Math.log((rendaAlvo / aporteAcao) + 1) / Math.log(1 + taxaMensal);
    return Math.ceil(n);
  };

  const converterMeses = (totalMeses: number) => {
    const anos = Math.floor(totalMeses / 12);
    const meses = totalMeses % 12;
    if (anos === 0) return `${meses} meses`;
    if (meses === 0) return `${anos} anos`;
    return `${anos} anos e ${meses} meses`;
  };

  const mesesPingo = calcularMesesParaRenda(150); 
  const mesesVirada = calcularMesesParaRenda(aporteAcao); 
  const mesesLegado = calcularMesesParaRenda(custoFixo); 

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Perfil Mapeado: Protetor de Legado
            </h3>
            <p className="text-sm text-muted-foreground">
              A IA configurou sua carteira com foco em <strong className="text-foreground">Geração de Renda Familiar</strong> para os próximos anos.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setProfile(null)} className="gap-2 text-xs">
            <RefreshCw className="h-3 w-3" /> Refazer Análise
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Divisão Sugerida de Fluxo</CardTitle>
          <CardDescription>
            {metaReservaAtingida 
              ? "Reserva blindada. 100% livre para alocação em ativos." 
              : "Construção Simultânea (60% retido para Reserva e 40% livre para Ativos)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Capacidade Mês</p>
              <Input className="h-8 text-lg font-semibold mt-1 bg-transparent border-none px-0 shadow-none focus-visible:ring-0" inputMode="decimal" value={valorManual} onChange={(e) => setValorManual(e.target.value)} />
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

      <Card className="border-primary/40 shadow-lg shadow-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-primary" />
            <CardTitle>A Avalanche Dinâmica</CardTitle>
          </div>
          <CardDescription>
            Com aportes de <strong className="text-primary">{formatBRL(aporteAcao)}/mês</strong> rendendo uma média realista de 8% ao ano em dividendos, veja quando você atingirá os 3 marcos da liberdade em vida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="relative pl-6 border-l-2 border-emerald-500/30 pb-4">
            <div className="absolute -left-[11px] top-0 bg-background border-2 border-emerald-500 p-1 rounded-full">
              <Droplets className="h-3 w-3 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-400">Marco 1: O Primeiro Pingo (Renda: R$ 150/mês)</h4>
              <p className="text-xs text-muted-foreground">O sistema paga uma conta básica perpétua (Ex: Internet da família).</p>
              <p className="text-lg font-semibold text-foreground pt-1">Em {converterMeses(mesesPingo)}</p>
            </div>
          </div>
          <div className="relative pl-6 border-l-2 border-sky-500/30 pb-4">
            <div className="absolute -left-[11px] top-0 bg-background border-2 border-sky-500 p-1 rounded-full">
              <TrendingUp className="h-3 w-3 text-sky-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-sky-400">Marco 2: Ponto de Virada (Renda: {formatBRL(aporteAcao)}/mês)</h4>
              <p className="text-xs text-muted-foreground">O dinheiro gerado pelo próprio dinheiro empata com o seu esforço de trabalho.</p>
              <p className="text-lg font-semibold text-foreground pt-1">Em {converterMeses(mesesVirada)}</p>
            </div>
          </div>
          <div className="relative pl-6 border-l-2 border-transparent">
            <div className="absolute -left-[11px] top-0 bg-background border-2 border-amber-500 p-1 rounded-full">
              <Crown className="h-3 w-3 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-amber-400">Marco 3: A Colheita de Legado (Renda: {formatBRL(custoFixo)}/mês)</h4>
              <p className="text-xs text-muted-foreground">O patrimônio atingiu massa crítica. Os dividendos pagam 100% do Custo de Vida Fixo da família para sempre.</p>
              <p className="text-lg font-semibold text-foreground pt-1">Em {converterMeses(mesesLegado)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileOnboarding({ onComplete }: { onComplete: (p: Profile) => void }) {
  const [step, setStep] = useState(1);
  const [horizon, setHorizon] = useState("");
  const [family, setFamily] = useState("");
  const [risk, setRisk] = useState("");

  const handleNext = () => {
    if (step === 1 && !horizon) return toast.error("Selecione um horizonte.");
    if (step === 2 && !family) return toast.error("Selecione o objetivo familiar.");
    if (step === 3 && !risk) return toast.error("Selecione sua reação.");
    if (step < 3) setStep(step + 1);
    else onComplete({ horizon, family, risk });
  };

  return (
    <Card className="max-w-2xl mx-auto border-primary/20 shadow-xl shadow-primary/5 mt-4">
      <CardHeader className="text-center pb-8 border-b border-border/50">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Descoberta de Propósito</CardTitle>
        <CardDescription className="text-sm max-w-md mx-auto mt-2">
          Antes de projetar o seu futuro, a IA precisa entender qual legado você quer deixar.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8">
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <h3 className="text-lg font-semibold text-center mb-6">Qual é o seu Horizonte de Colheita Ativa?</h3>
            <OptionCard selected={horizon === "curto"} onClick={() => setHorizon("curto")} title="Curto Prazo" desc="Quero focar em resgatar tudo em até 5 anos." />
            <OptionCard selected={horizon === "hibrido"} onClick={() => setHorizon("hibrido")} title="Híbrido Estratégico (Recomendado)" desc="Quero ver os frutos crescerem nos próximos 10 a 20 anos para aproveitar em vida, mas deixando a raiz intacta." highlight />
            <OptionCard selected={horizon === "legado"} onClick={() => setHorizon("legado")} title="Legado Puro" desc="Foco 100% no longo prazo, pensando estritamente na próxima geração." />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <h3 className="text-lg font-semibold text-center mb-6">Como você deseja Blindar o Fluxo Familiar?</h3>
            <OptionCard selected={family === "individual"} onClick={() => setFamily("individual")} title="Foco Individual" desc="Apenas gerar patrimônio e liquidez para o meu CPF." />
            <OptionCard selected={family === "familiar"} onClick={() => setFamily("familiar")} title="Geração de Renda Familiar" desc="Quero que o sistema projete uma renda mensal que sustente minha esposa e crie um patrimônio perpétuo para herdeiros." highlight />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <h3 className="text-lg font-semibold text-center mb-6">Como seu psicológico reage à oscilação do mercado?</h3>
            <OptionCard selected={risk === "conservador"} onClick={() => setRisk("conservador")} title="Defensivo" desc="Prefiro a certeza absoluta, mesmo que o dinheiro renda bem menos ao longo dos anos." />
            <OptionCard selected={risk === "arrojado"} onClick={() => setRisk("arrojado")} title="Foco na Geração de Valor" desc="Entendo que o mercado oscila no curto prazo, mas busco a máxima eficiência de dividendos para multiplicar o patrimônio." highlight />
          </div>
        )}
        <div className="mt-10 flex justify-end">
          <Button onClick={handleNext} className="w-full sm:w-auto px-8 gap-2">
            {step === 3 ? "Processar Perfil" : "Próximo Passo"} <ArrowDownRight className="h-4 w-4 -rotate-90" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OptionCard({ title, desc, selected, highlight, onClick }: { title: string; desc: string; selected: boolean; highlight?: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 ${selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"}`}>
      {selected && <CheckCircle2 className="absolute top-4 right-4 h-5 w-5 text-primary" />}
      <h4 className={`font-semibold ${selected ? "text-primary" : "text-foreground"} ${highlight && !selected ? "text-sky-400" : ""}`}>{title}</h4>
      <p className="text-xs text-muted-foreground mt-1 pr-8 leading-relaxed">{desc}</p>
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
// LEME DA VIDA (Inalterado)
// ============================================================
const BIRTH_KEY_BASE = "audasyas:birthdate";
type Milestone = { age: number; title: string; subtitle: string; description: string; icon: ReactNode; accent: string };

const MILESTONES: Milestone[] = [
  { age: 20, title: "Futuro Presente", subtitle: "20 anos", description: "A semente plantada hoje começa a se firmar. Disciplina e constância no aporte mensal.", icon: <Sprout className="h-5 w-5" />, accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" },
  { age: 30, title: "Aposentadoria", subtitle: "30 anos", description: "Liberdade de escolha conquistada. O patrimônio sustenta o estilo de vida sem depender do salário.", icon: <Sun className="h-5 w-5" />, accent: "from-sky-500/20 to-sky-500/5 border-sky-500/30" },
  { age: 50, title: "Colheita da Tâmara", subtitle: "50 anos", description: "Legado familiar consolidado. A árvore plantada agora frutifica para as próximas gerações.", icon: <Trees className="h-5 w-5" />, accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
];

function LemeDaVida({ userId, aporteMensalSugerido }: { userId: string, aporteMensalSugerido: number }) {
  const [birth, setBirth] = useState<string>("");
  const [aporteConfirmado, setAporteConfirmado] = useState<boolean | null>(null);
  const [rendimentoReal, setRendimentoReal] = useState("0,80");
  const metaRendimento = 0.80; 
  const [patrimonioBase] = useState(15000); 

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(`${BIRTH_KEY_BASE}:${userId}`) : null;
    if (stored) setBirth(stored);
  }, [userId]);

  const persistBirth = (v: string) => {
    setBirth(v);
    if (typeof window !== "undefined") window.localStorage.setItem(`${BIRTH_KEY_BASE}:${userId}`, v);
  };

  const handleConfirmaAporte = (status: boolean) => {
    setAporteConfirmado(status);
    if (status) {
      toast.success("Legado protegido! Aporte registrado com sucesso.");
    } else {
      toast.error("O tempo não perdoa. Ajuste suas contas para recuperar esse aporte.", { duration: 5000 });
    }
  };

  const rendNum = parseNumber(rendimentoReal);
  const faltaRendimento = Math.max(0, metaRendimento - rendNum);
  const valorCompensacao = (patrimonioBase * faltaRendimento) / 100;
  const aporteComAjuste = aporteMensalSugerido + valorCompensacao;

  const mesAtualNome = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());

  const calcularProjecaoLegado = (anos: number) => {
    const aporteBaseReal = aporteMensalSugerido > 0 ? aporteMensalSugerido : 100; 
    const taxaMes = 0.008; 
    const n = anos * 12;
    const patrimonio = aporteBaseReal * ((Math.pow(1 + taxaMes, n) - 1) / taxaMes);
    const rendaMensal = patrimonio * taxaMes;
    return { patrimonio, rendaMensal };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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

      <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-background to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trees className="h-6 w-6 text-amber-500" /> A Matemática do Legado
          </CardTitle>
          <CardDescription>
            Veja o que você está plantando hoje. Projeção realista com aportes base de <strong className="text-amber-500">{formatBRL(aporteMensalSugerido > 0 ? aporteMensalSugerido : 100)}/mês</strong> rendendo 0,8% a.m.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {[5, 10, 20].map((anos) => {
              const proj = calcularProjecaoLegado(anos);
              return (
                <div key={anos} className="rounded-xl border border-amber-500/10 bg-card p-5 space-y-3 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl"></div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/80">{anos} Anos</p>
                    <span className="text-[10px] text-muted-foreground">{anos * 12} meses</span>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Patrimônio Acumulado</p>
                    <p className="text-2xl font-bold text-foreground">{formatBRL(proj.patrimonio)}</p>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <p className="text-[11px] text-muted-foreground mb-1">Renda Passiva Limpa</p>
                    <p className="text-lg font-semibold text-emerald-400">~ {formatBRL(proj.rendaMensal)} / mês</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className={`border-2 transition-colors ${aporteConfirmado === true ? 'border-emerald-500/30 bg-emerald-500/5' : aporteConfirmado === false ? 'border-red-500/30 bg-red-500/5' : 'border-border'}`}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${aporteConfirmado === true ? 'text-emerald-500' : 'text-primary'}`} /> 
              Guardião da Disciplina
            </CardTitle>
            <CardDescription className="capitalize">Referência: {mesAtualNome}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aporteConfirmado === null ? (
              <>
                <p className="text-sm text-foreground leading-relaxed">
                  Os <strong className="text-primary">{formatBRL(aporteMensalSugerido)}</strong> da segurança familiar já foram aportados na corretora este mês?
                </p>
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => handleConfirmaAporte(true)} className="w-full bg-emerald-600 hover:bg-emerald-700">Sim, feito!</Button>
                  <Button onClick={() => handleConfirmaAporte(false)} variant="destructive" className="w-full">Não consegui</Button>
                </div>
              </>
            ) : aporteConfirmado === true ? (
              <div className="space-y-2">
                <p className="text-emerald-400 font-semibold text-lg">Perfeito. O legado continua firme.</p>
                <p className="text-sm text-muted-foreground">Sua mente está resguardada. A rota de colheita segue exatamente conforme o projetado.</p>
                <Button variant="outline" size="sm" onClick={() => setAporteConfirmado(null)} className="mt-2 text-xs">Desfazer Check-in</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-400 font-semibold text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Atenção à rota!
                </p>
                <p className="text-sm text-muted-foreground">Seu eu do futuro e sua família perderam 30 dias de juros compostos reais. Cada mês pulado empurra a sua colheita para mais longe. Recupere o controle no mês que vem.</p>
                <Button variant="outline" size="sm" onClick={() => setAporteConfirmado(null)} className="mt-2 text-xs">Tentar Novamente</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-background to-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-sky-500" /> Radar de Ajuste de Rota
            </CardTitle>
            <CardDescription>Calibre o curso da sua carteira.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end gap-4">
              <div className="space-y-1.5 flex-1">
                <Label className="text-xs">Rendimento Real do Mês (%)</Label>
                <div className="flex items-center gap-2">
                  <Input inputMode="decimal" value={rendimentoReal} onChange={(e) => setRendimentoReal(e.target.value)} className="w-24 text-center font-bold" />
                  <span className="text-xs text-muted-foreground">Meta: {metaRendimento}%</span>
                </div>
              </div>
            </div>

            {faltaRendimento > 0 ? (
              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-2 animate-in slide-in-from-bottom-2">
                <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Mercado em Baixa (- {faltaRendimento.toFixed(2)}%)
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sua carteira gerou <strong className="text-foreground">R$ {valorCompensacao.toFixed(2).replace('.', ',')}</strong> a menos que o planejado. 
                </p>
                <div className="pt-2 border-t border-amber-500/10 flex items-start gap-2">
                  <Coffee className="h-4 w-4 text-amber-400 mt-0.5" />
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    <strong>Sugestão Tática:</strong> Adicione este valor ao seu próximo aporte, totalizando <strong className="text-white">R$ {aporteComAjuste.toFixed(2).replace('.', ',')}</strong>. É um café a menos hoje para manter o futuro inabalável e a mente blindada.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <p className="text-xs text-emerald-300">
                  Rendimento dentro ou acima da meta. A velocidade da bola de neve está perfeita!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
// ATIVOS (Vitrine de Kits de IA - O Motor Prático do Home Broker)
// ============================================================

const KITS_ALOCACAO = [
  {
    id: 'alto',
    name: 'Kit Alto (Acelerador)',
    icon: <Zap className="h-5 w-5 text-red-500" />,
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/5',
    titleColor: 'text-red-400',
    badge: 'Alto Risco / Alta Volatilidade',
    assets: [
      { ticker: 'PETR4', split: 20, type: 'Ação (Commodity)' },
      { ticker: 'VALE3', split: 20, type: 'Ação (Commodity)' },
      { ticker: 'URPR11', split: 30, type: 'FII (Papel High Yield)' },
      { ticker: 'HCTR11', split: 30, type: 'FII (Papel Alto Risco)' },
    ],
    info: 'Cuidado: Estes fundos pagam dividendos muito acima da média porque emprestam dinheiro para obras de alto risco (loteamentos, resorts). Se a obra atrasar, o dividendo zera e a cota derrete. As ações dependem do preço global do minério e petróleo. É excelente na alta, terrível na baixa.'
  },
  {
    id: 'medio',
    name: 'Kit Médio (Expansão)',
    icon: <Activity className="h-5 w-5 text-sky-500" />,
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/5',
    titleColor: 'text-sky-400',
    badge: 'Risco Moderado / Crescimento',
    assets: [
      { ticker: 'ITUB4', split: 25, type: 'Ação (Banco Privado)' },
      { ticker: 'EGIE3', split: 25, type: 'Ação (Energia)' },
      { ticker: 'XPML11', split: 25, type: 'FII (Shoppings)' },
      { ticker: 'VISC11', split: 25, type: 'FII (Shoppings)' },
    ],
    info: 'Risco Moderado: Shoppings são excelentes imóveis, mas dependem do consumo das famílias. Se o país entra em crise e os juros sobem, o consumo cai e o valor dos aluguéis sofre leves reajustes. Exige estômago no médio prazo.'
  },
  {
    id: 'recomendado',
    name: 'Kit Recomendado (Legado)',
    icon: <Crown className="h-5 w-5 text-amber-500" />,
    borderColor: 'border-amber-500/40 shadow-lg shadow-amber-500/10',
    bgColor: 'bg-amber-500/10',
    titleColor: 'text-amber-500',
    badge: 'O Legado Inabalável (Sua Meta)',
    isMVP: true,
    assets: [
      { ticker: 'BBAS3', split: 25, type: 'Ação (Banco Centenário)' },
      { ticker: 'TAEE11', split: 25, type: 'Ação (Transmissão)' },
      { ticker: 'HGLG11', split: 25, type: 'FII (Logística Premium)' },
      { ticker: 'BTLG11', split: 25, type: 'FII (Galpões)' },
    ],
    info: 'Risco Diluído: As pessoas podem cortar compras no shopping, mas ninguém deixa de pagar a conta de luz (TAEE11), e indústrias gigantes não param de usar galpões (HGLG11). Esta carteira é uma máquina constante e segura de gerar renda passiva para o longo prazo.'
  }
];

function Ativos({ aporteMensal, metaReservaAtingida }: { aporteMensal: number; metaReservaAtingida: boolean }) {
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

  const aporteAtivo = aporteMensal > 0 ? aporteMensal : 800; // Fallback visual para testar a tela

  const toggleInfo = (id: string) => {
    if (expandedInfo === id) setExpandedInfo(null);
    else setExpandedInfo(id);
  };

  const handleApplyKit = (id: string) => {
    setSelectedKit(id);
    toast.success("Kit Estratégico Aplicado! Veja a ordem de compra abaixo.");
  };

  const activeKitData = KITS_ALOCACAO.find(k => k.id === selectedKit);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {!metaReservaAtingida && (
        <Card className="border-sky-500/40 bg-sky-500/5">
          <CardContent className="pt-5 flex items-start gap-3">
            <PiggyBank className="h-5 w-5 text-sky-300 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-sky-200">Construção Simultânea Ativada (40% Liberado)</p>
              <p className="text-xs text-muted-foreground mt-1">
                A sua Reserva de Emergência ainda não atingiu o teto. O sistema já liberou R$ {formatBRL(aporteAtivo)} da sua sobra mensal para você iniciar os aportes na Vitrine abaixo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VITRINE DE KITS DA IA */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Vitrine de Inteligência (Kits de Alocação)</h2>
        </div>
        <p className="text-sm text-muted-foreground px-1 mb-6">
          Não procure no escuro. A IA estruturou 3 caminhos testados pelo tempo. Escolha o seu nível de risco para dividir os seus <strong className="text-foreground">{formatBRL(aporteAtivo)}</strong> livres do mês.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {KITS_ALOCACAO.map((kit) => (
            <Card key={kit.id} className={`border-2 transition-all flex flex-col ${kit.borderColor} ${selectedKit === kit.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:-translate-y-1'}`}>
              <CardHeader className={`pb-4 border-b border-border/50 ${kit.bgColor}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground bg-background/50 px-2 py-1 rounded">
                    {kit.badge}
                  </span>
                  {kit.isMVP && <span className="absolute -top-3 -right-3 bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">Ideal p/ Legado</span>}
                </div>
                <CardTitle className={`text-lg flex items-center gap-2 ${kit.titleColor}`}>
                  {kit.icon} {kit.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-4 flex-1 flex flex-col space-y-4">
                
                {/* Ativos do Kit Visualização Rápida */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {kit.assets.map(asset => (
                    <div key={asset.ticker} className="bg-muted/50 p-2 rounded text-center border border-border/50">
                      <p className="font-bold text-sm text-foreground">{asset.ticker}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{asset.type}</p>
                    </div>
                  ))}
                </div>

                {/* Balão de Pensamento Toggle */}
                <div className="mt-auto">
                  <Button variant="ghost" className="w-full text-xs gap-2 mb-2 h-8 text-muted-foreground hover:text-foreground" onClick={() => toggleInfo(kit.id)}>
                    <Info className="h-4 w-4" /> Entenda o Risco da IA
                  </Button>
                  
                  {expandedInfo === kit.id && (
                    <div className="p-3 mb-4 text-xs leading-relaxed rounded-lg bg-card border border-border text-foreground animate-in zoom-in-95">
                      {kit.info}
                    </div>
                  )}

                  <Button 
                    className={`w-full ${kit.isMVP ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
                    variant={selectedKit === kit.id ? 'secondary' : 'default'}
                    onClick={() => handleApplyKit(kit.id)}
                  >
                    {selectedKit === kit.id ? 'Kit Selecionado' : 'Aplicar Kit ao Meu Mês'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ORDEM DE EXECUÇÃO (Aparece apenas quando seleciona o kit) */}
      {activeKitData && (
        <Card className="border-primary/40 bg-gradient-to-r from-primary/10 to-background shadow-xl mt-8 animate-in slide-in-from-bottom-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Briefcase className="h-6 w-6 text-primary" /> Ordem de Execução (Home Broker)
            </CardTitle>
            <CardDescription>
              Abra o aplicativo da sua corretora agora. Compre exatamente os ativos abaixo usando os <strong className="text-foreground">{formatBRL(aporteAtivo)}</strong> disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {activeKitData.assets.map((asset) => {
                const valorExatoCompra = (aporteAtivo * asset.split) / 100;
                return (
                  <div key={asset.ticker} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-2xl font-black text-foreground">{asset.ticker}</p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{asset.type}</p>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{asset.split}%</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-[11px] text-muted-foreground mb-0.5">Comprar aprox.</p>
                      <p className="text-lg font-bold text-emerald-400">{formatBRL(valorExatoCompra)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">Tudo pronto, Aldo!</p>
                <p className="text-xs text-emerald-200/70 mt-1 leading-relaxed">
                  Após executar essas compras na corretora, o seu dever deste mês está cumprido. Vá até a aba <strong>Leme da Vida</strong>, clique em "Sim, feito!" no Guardião da Disciplina e durma com a mente tranquila de quem protegeu a própria família.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}