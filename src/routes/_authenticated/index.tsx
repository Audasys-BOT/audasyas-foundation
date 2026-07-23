import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatBRL, parseNumber } from "@/lib/format";
import { toast } from "sonner";
import { TrendingUp, Wallet, PiggyBank, ArrowDownRight, Trash2, Compass, Sparkles, RefreshCw, Sprout, Sun, Trees, LineChart, Plus, Brain, Loader2, Target, Snowflake, Zap, LogOut, Pencil, Minus, ShieldAlert, ShieldCheck, Droplets, Crown, CheckCircle2, AlertTriangle, Coffee, Info, Activity, Briefcase, ArrowRight, Check, PieChart, Search, ThumbsUp, ThumbsDown, ChevronUp, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDailyGuidance } from "@/lib/guidance.functions";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/")({
  component: MainApp,
});

const ONBOARDING_DONE_KEY = "audasyas:onboarding_done";
const PROFILE_KEY_BASE = "audasyas:invest_profile";
const BIRTH_KEY_BASE = "audasyas:birthdate";
const FINANCIAL_KEY_BASE = "audasyas:financial_base";

// ============================================================
// COMPONENTE PAI: GERENCIA O FLUXO (WIZARD VS DASHBOARD)
// ============================================================
function MainApp() {
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const userId = user.id;

  const [isReady, setIsReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const done = window.localStorage.getItem(`${ONBOARDING_DONE_KEY}:${userId}`);
      if (done === "true") {
        setNeedsOnboarding(false);
      }
      setIsReady(true);
    }
  }, [userId]);

  if (!isReady) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (needsOnboarding) {
    return <OnboardingWizard userId={userId} onComplete={() => setNeedsOnboarding(false)} />;
  }

  return <SimDashboard userId={userId} onSignOut={async () => { await supabase.auth.signOut(); router.navigate({ to: "/auth", replace: true }); }} />;
}

// ============================================================
// O PORTÃO DE ENTRADA (ONBOARDING HARMONIOSO)
// ============================================================
function OnboardingWizard({ userId, onComplete }: { userId: string, onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1
  const [birth, setBirth] = useState("");
  // Step 2
  const [salario, setSalario] = useState("");
  const [custo, setCusto] = useState("");
  const [reserva, setReserva] = useState("");
  // Step 3
  const [horizon, setHorizon] = useState("");
  const [family, setFamily] = useState("");
  const [risk, setRisk] = useState("");

  const handleNext = () => {
    if (step === 1) {
      if (!birth) return toast.error("Por favor, informe sua data de nascimento.");
      setStep(2);
    } else if (step === 2) {
      if (!salario || parseNumber(salario) <= 0) return toast.error("Informe um salário válido para base de cálculo.");
      setStep(3);
    } else if (step === 3) {
      if (!horizon || !family || !risk) return toast.error("Preencha todas as escolhas para a IA montar seu perfil.");
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(`${BIRTH_KEY_BASE}:${userId}`, birth);
        window.localStorage.setItem(`${PROFILE_KEY_BASE}:${userId}`, JSON.stringify({ horizon, family, risk }));
        window.localStorage.setItem(`${FINANCIAL_KEY_BASE}:${userId}`, JSON.stringify({ salario, custo, reserva }));
        window.localStorage.setItem(`${ONBOARDING_DONE_KEY}:${userId}`, "true");
      }
      onComplete();
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {isProcessing ? (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
              <Brain className="h-10 w-10 text-primary animate-pulse" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold">A IA está arquitetando o seu futuro...</h2>
            <p className="text-muted-foreground">Cruzando seus dados financeiros com o mercado para montar sua base inabalável.</p>
          </div>
        ) : (
          <Card className="border-primary/20 shadow-2xl shadow-primary/5">
            <CardHeader className="text-center pb-6 border-b border-border/50">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Compass className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Bem-vindo ao AudasYAs Invest</CardTitle>
              <CardDescription className="text-base mt-2">Vamos estruturar o seu legado passo a passo.</CardDescription>
              <div className="flex justify-center gap-2 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 w-16 rounded-full transition-colors duration-500 ${step >= i ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-6 sm:px-12 pb-10">
              
              {/* PASSO 1: TEMPO */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">O fator mais importante: O Tempo</h3>
                    <p className="text-sm text-muted-foreground">Para sabermos a velocidade exata que precisamos aplicar aos seus investimentos, informe a sua data de nascimento.</p>
                  </div>
                  <div className="max-w-xs mx-auto pt-4">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Data de Nascimento</Label>
                    <Input type="date" className="h-12 text-lg" value={birth} onChange={(e) => setBirth(e.target.value)} />
                  </div>
                </div>
              )}

              {/* PASSO 2: FINANCEIRO */}
              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Seu Raio-X Atual</h3>
                    <p className="text-sm text-muted-foreground">Não se preocupe com exatidão agora, faremos estimativas. Isso será a base do seu motor financeiro.</p>
                  </div>
                  <div className="grid gap-5 pt-4">
                    <div className="space-y-2">
                      <Label>Salário Mensal (R$)</Label>
                      <Input inputMode="decimal" className="h-12 text-lg" placeholder="Ex: 5000,00" value={salario} onChange={(e) => setSalario(e.target.value)} />
                      <p className="text-[11px] text-muted-foreground">Sua base de entrada.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Custo de Vida Fixo (R$)</Label>
                        <Input inputMode="decimal" className="h-12" placeholder="Opcional" value={custo} onChange={(e) => setCusto(e.target.value)} />
                        <p className="text-[11px] text-muted-foreground">Contas de casa, mercado.</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Reserva Atual (R$)</Label>
                        <Input inputMode="decimal" className="h-12" placeholder="Opcional" value={reserva} onChange={(e) => setReserva(e.target.value)} />
                        <p className="text-[11px] text-muted-foreground">Dinheiro já guardado hoje.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 3: PROPÓSITO */}
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">O Direcionamento do Legado</h3>
                    <p className="text-sm text-muted-foreground">Último passo. Como a IA deve orientar suas escolhas e blindar sua família?</p>
                  </div>
                  <div className="space-y-5 pt-2">
                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">1. Foco da Família</Label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <SelectionCard selected={family === "individual"} onClick={() => setFamily("individual")} title="Foco Pessoal" />
                        <SelectionCard selected={family === "familiar"} onClick={() => setFamily("familiar")} title="Legado Familiar (Esposa e Herdeiros)" highlight />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">2. Horizonte de Colheita</Label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <SelectionCard selected={horizon === "curto"} onClick={() => setHorizon("curto")} title="Curto Prazo (5 anos)" />
                        <SelectionCard selected={horizon === "hibrido"} onClick={() => setHorizon("hibrido")} title="Híbrido (Projetar Vida Inteira)" highlight />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">3. Comportamento no Mercado</Label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <SelectionCard selected={risk === "conservador"} onClick={() => setRisk("conservador")} title="100% Defensivo (Foco em Certeza)" />
                        <SelectionCard selected={risk === "arrojado"} onClick={() => setRisk("arrojado")} title="Foco em Valor (Aceito oscilações)" highlight />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex items-center justify-between">
                {step > 1 ? (
                  <Button variant="ghost" onClick={() => setStep(step - 1)}>Voltar</Button>
                ) : <div />}
                <Button onClick={handleNext} className="px-8 h-11 gap-2 text-md">
                  {step === 3 ? "Processar Meu Futuro" : "Continuar"} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SelectionCard({ title, selected, highlight, onClick }: { title: string; selected: boolean; highlight?: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} className={`relative cursor-pointer rounded-lg p-3 border-2 transition-all text-sm font-medium flex items-center justify-between ${selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40 text-foreground"}`}>
      <span>{title}</span>
      {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
    </div>
  );
}

// ============================================================
// O DASHBOARD PRINCIPAL (PAINEL APÓS ONBOARDING)
// ============================================================
function SimDashboard({ userId, onSignOut }: { userId: string, onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState("financeiro");
  
  const [salario, setSalario] = useState("");
  const [custoManual, setCustoManual] = useState("");
  const [isEditingCusto, setIsEditingCusto] = useState(false);
  const [reservaAcumulada, setReservaAcumulada] = useState(0);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const finStr = window.localStorage.getItem(`${FINANCIAL_KEY_BASE}:${userId}`);
      if (finStr) {
        try {
          const fin = JSON.parse(finStr);
          if (fin.salario) setSalario(fin.salario);
          if (fin.custo) { setCustoManual(fin.custo); setIsEditingCusto(true); }
          if (fin.reserva) setReservaAcumulada(parseNumber(fin.reserva));
        } catch(e) {}
      }
    }
  }, [userId]);

  const [valorAjusteReserva, setValorAjusteReserva] = useState("");
  const [tetoManual, setTetoManual] = useState("");
  const [isEditingTeto, setIsEditingTeto] = useState(false);

  const salarioNum = parseNumber(salario);
  const custoIdeal = salarioNum * 0.6; 
  const custoFinal = isEditingCusto ? parseNumber(custoManual) : custoIdeal;
  const tetoRecomendado = custoFinal * 6; 
  const tetoFinal = isEditingTeto ? parseNumber(tetoManual) : tetoRecomendado;

  const liveCapacity = Math.max(0, salarioNum - custoFinal);
  const percentualCusto = salarioNum > 0 ? (custoFinal / salarioNum) * 100 : 0;
  const pctProgressoReserva = tetoFinal > 0 ? Math.min(100, (reservaAcumulada / tetoFinal) * 100) : 0;
  
  const { rankAtual, proximoRank, valorProximoAlvo } = useMemo(() => {
    if (pctProgressoReserva >= 100) return { rankAtual: "🏆 Nível 4: Colheita da Tâmara", proximoRank: "Meta Concluída!", valorProximoAlvo: tetoFinal };
    if (pctProgressoReserva >= 75) return { rankAtual: "🌳 Nível 3: Árvore Firme", proximoRank: "🏆 Nível 4: Colheita da Tâmara", valorProximoAlvo: tetoFinal };
    if (pctProgressoReserva >= 50) return { rankAtual: "🌿 Nível 2: Raiz Forte", proximoRank: "🌳 Nível 3: Árvore Firme", valorProximoAlvo: tetoFinal * 0.75 };
    if (pctProgressoReserva >= 16.6) return { rankAtual: "🌱 Nível 1: Broto", proximoRank: "🌿 Nível 2: Raiz Forte", valorProximoAlvo: tetoFinal * 0.5 };
    return { rankAtual: "Definindo Base 🌱", proximoRank: "🌱 Nível 1: Broto", valorProximoAlvo: tetoFinal * 0.166 };
  }, [pctProgressoReserva, tetoFinal]);

  const faltamParaProximo = Math.max(0, valorProximoAlvo - reservaAcumulada);
  const reservaFaltanteTotal = Math.max(0, tetoFinal - reservaAcumulada);
  const sugestaoReservaMes = Math.min(reservaFaltanteTotal, liveCapacity * 0.6);
  const aporteSugeridoAtivos = Math.max(0, liveCapacity - sugestaoReservaMes);
  const metaReservaAtingida = tetoFinal > 0 && reservaFaltanteTotal <= 0;
  const isProntidaoSegura = reservaAcumulada >= 2000;

  const salvarReservaNoStorage = (novoValor: number) => {
    setReservaAcumulada(novoValor);
    if (typeof window !== "undefined") {
      const finStr = window.localStorage.getItem(`${FINANCIAL_KEY_BASE}:${userId}`);
      let fin = { salario, custo: custoManual, reserva: novoValor.toString() };
      if (finStr) try { fin = { ...JSON.parse(finStr), reserva: novoValor.toString() } } catch(e){}
      window.localStorage.setItem(`${FINANCIAL_KEY_BASE}:${userId}`, JSON.stringify(fin));
    }
  };

  const handleGuardarReserva = () => {
    const valor = parseNumber(valorAjusteReserva);
    if (valor <= 0) return toast.error("Informe um valor válido");
    salvarReservaNoStorage(reservaAcumulada + valor);
    setValorAjusteReserva("");
    toast.success(`R$ ${valor.toFixed(2)} blindados na Reserva`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col animate-in fade-in duration-700">
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary">AudasYAs</span> Invest
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Painel de Governança</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={onSignOut} className="gap-2 text-xs">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 md:grid-cols-5 gap-2 bg-transparent">
            <TabsTrigger value="financeiro" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg border border-transparent data-[state=active]:border-primary/20">
              <Wallet className="h-4 w-4" /> Controle
            </TabsTrigger>
            <TabsTrigger value="estrategista" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg border border-transparent data-[state=active]:border-primary/20">
              <Target className="h-4 w-4" /> Estrategista
            </TabsTrigger>
            <TabsTrigger value="leme" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg border border-transparent data-[state=active]:border-primary/20">
              <Compass className="h-4 w-4" /> Leme da Vida
            </TabsTrigger>
            <TabsTrigger value="ativos" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg border border-transparent data-[state=active]:border-primary/20">
              <LineChart className="h-4 w-4" /> Ativos
            </TabsTrigger>
            <TabsTrigger value="carteira" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg border border-transparent data-[state=active]:border-primary/20">
              <PieChart className="h-4 w-4" /> Carteira
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: CONTROLE FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-8 mt-0 animate-in fade-in zoom-in-95 duration-500">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard icon={<Wallet className="h-4 w-4" />} label="Salário Mensal" value={formatBRL(salarioNum)} />
              <KpiCard icon={<ArrowDownRight className="h-4 w-4" />} label="Custo de Vida Fixo" value={formatBRL(custoFinal)} />
              <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Disponível para Ativos" value={formatBRL(aporteSugeridoAtivos)} highlight />
              <KpiCard icon={<PiggyBank className="h-4 w-4" />} label="Reserva Acumulada" value={formatBRL(reservaAcumulada)} />
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Estrutura da Reserva (Seu Escudo)</CardTitle>
                <CardDescription>Edite a sua realidade financeira abaixo caso algo tenha mudado neste mês.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                <div className="grid gap-6 sm:grid-cols-2 p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">Salário Mensal Atual</Label>
                    <Input inputMode="decimal" value={salario} onChange={(e) => setSalario(e.target.value)} className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase text-muted-foreground">Custo de Vida Fixo</Label>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setIsEditingCusto(!isEditingCusto); if(!isEditingCusto) setCustoManual(custoFinal.toString()); }}>
                        <Pencil className={`h-3 w-3 ${isEditingCusto ? "text-primary" : "text-muted-foreground"}`} />
                      </Button>
                    </div>
                    <Input inputMode="decimal" value={isEditingCusto ? custoManual : custoIdeal.toFixed(2)} onChange={(e) => setCustoManual(e.target.value)} disabled={!isEditingCusto} className="bg-background" />
                    <p className={`text-[10px] font-medium ${percentualCusto > 60 ? "text-amber-400" : "text-emerald-400"}`}>
                      {isEditingCusto ? `Consome ${percentualCusto.toFixed(0)}%` : `Otimizado pela IA (60%)`}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        Escudo Familiar <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{rankAtual}</span>
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Teto de 6 meses de segurança: <span className="text-foreground font-semibold">{formatBRL(tetoFinal)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-muted rounded-full h-4 overflow-hidden relative border border-border">
                      <div className="bg-gradient-to-r from-primary/80 to-primary h-full transition-all duration-500" style={{ width: `${pctProgressoReserva}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-muted-foreground px-0.5">
                      <span>{pctProgressoReserva.toFixed(1)}% Blindado</span>
                      {pctProgressoReserva < 100 ? (
                        <span>Próximo alvo: Mais {formatBRL(faltamParaProximo)} p/ {proximoRank}</span>
                      ) : (
                        <span className="text-emerald-400">100% Protegido</span>
                      )}
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border flex gap-3 ${metaReservaAtingida ? "bg-emerald-500/5 border-emerald-500/20" : isProntidaoSegura ? "bg-sky-500/5 border-sky-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                    {metaReservaAtingida ? <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" /> : isProntidaoSegura ? <TrendingUp className="h-6 w-6 text-sky-400 shrink-0" /> : <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0" />}
                    <div>
                      <h5 className="font-bold text-sm text-foreground">
                        {metaReservaAtingida ? "Reserva Concluída. Liberado para Ativos!" : isProntidaoSegura ? "Avanço para Camada de Resiliência" : "Construindo Prontidão (Curto Prazo)"}
                      </h5>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {metaReservaAtingida 
                          ? "Missão cumprida! Todo o seu fluxo mensal agora pode ser direcionado para a criação de patrimônio na Bolsa de Valores." 
                          : !isProntidaoSegura
                          ? `Use um CDB 100% CDI de liquidez diária do seu banco. Faltam R$ ${formatBRL(Math.max(0, 2000 - reservaAcumulada))} para desbloquearmos instrumentos isentos de Imposto de Renda.`
                          : `Sua base de giro está pronta. Os próximos R$ ${formatBRL(sugestaoReservaMes)} podem ser investidos em LCI/LCA com carência (Isentos de IR).`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-end gap-4 shadow-sm">
                    <div className="space-y-2 w-full sm:w-auto flex-1">
                      <Label className="text-xs">Fiz um aporte na Reserva (R$)</Label>
                      <Input inputMode="decimal" value={valorAjusteReserva} onChange={(e) => setValorAjusteReserva(e.target.value)} placeholder="Valor blindado este mês" />
                    </div>
                    <Button type="button" className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10" onClick={handleGuardarReserva}>
                      <Check className="h-4 w-4" /> Registrar 
                    </Button>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50 flex justify-end">
                  <Button onClick={() => setActiveTab("estrategista")} className="gap-2 h-11 px-6 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    Próximo Passo: Estrategista <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 2: ESTRATEGISTA */}
          <TabsContent value="estrategista" className="mt-0">
            <Estrategista
              userId={userId}
              aporteSugerido={aporteSugeridoAtivos}
              sugestaoReserva={sugestaoReservaMes}
              reservaFaltante={reservaFaltanteTotal}
              metaReservaAtingida={metaReservaAtingida}
              liveCapacity={liveCapacity}
              custoFixo={custoFinal}
              onNext={() => setActiveTab("leme")}
            />
          </TabsContent>

          {/* ABA 3: LEME DA VIDA */}
          <TabsContent value="leme" className="mt-0">
            <LemeDaVida userId={userId} aporteMensalSugerido={aporteSugeridoAtivos} onNext={() => setActiveTab("ativos")} />
          </TabsContent>

          {/* ABA 4: ATIVOS (COM RADAR IA) */}
          <TabsContent value="ativos" className="mt-0">
            <Ativos aporteMensal={aporteSugeridoAtivos} metaReservaAtingida={metaReservaAtingida} />
          </TabsContent>

          {/* ABA 5: CARTEIRA */}
          <TabsContent value="carteira" className="mt-0">
            <MinhaCarteira />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}

function KpiCard({ icon, label, value, highlight, variation }: { icon: ReactNode; label: string; value: string; highlight?: boolean, variation?: string }) {
  return (
    <Card className={`border-l-4 ${highlight ? "border-l-primary bg-primary/5 border-y-primary/20 border-r-primary/20" : "border-l-muted-foreground/30"}`}>
      <CardContent className="p-4 sm:p-5 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] uppercase tracking-widest font-semibold">
            {icon} <span>{label}</span>
          </div>
          {variation && (
            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center ${variation.includes('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {variation.includes('+') ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {variation.replace('+', '').replace('-', '')}
            </div>
          )}
        </div>
        <p className={`text-2xl font-black tabular-nums tracking-tight ${highlight ? "text-primary" : "text-foreground"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// ESTRATEGISTA
// ============================================================
function Estrategista({ aporteSugerido, sugestaoReserva, reservaFaltante, metaReservaAtingida, liveCapacity, userId, custoFixo, onNext }: { aporteSugerido: number; sugestaoReserva: number; reservaFaltante: number; metaReservaAtingida: boolean; liveCapacity: number; userId: string; custoFixo: number, onNext: () => void }) {
  const [valorManual, setValorManual] = useState("");

  useEffect(() => {
    if (!valorManual && liveCapacity > 0) setValorManual(liveCapacity.toFixed(2).replace(".", ","));
  }, [liveCapacity]);

  const v = parseNumber(valorManual);
  const valorReserva = metaReservaAtingida ? 0 : Math.min(reservaFaltante, v * 0.6);
  const valorAtivos = metaReservaAtingida ? v : Math.max(0, v - valorReserva);
  const aporteAcao = valorAtivos > 0 ? valorAtivos : 1; 

  const TAXA_ANUAL_DIVIDENDOS = 0.08; 
  const taxaMensal = TAXA_ANUAL_DIVIDENDOS / 12;

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

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5 pb-4 border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-primary" /> A Máquina de Fazer Dinheiro
          </CardTitle>
          <CardDescription>
            Usando R$ {formatBRL(aporteAcao)}/mês e a mágica dos juros compostos.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Capacidade / Mês</p>
              <Input className="h-10 text-xl font-bold bg-muted/50 border-none px-3" inputMode="decimal" value={valorManual} onChange={(e) => setValorManual(e.target.value)} />
            </div>
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 flex flex-col justify-center">
              <p className="text-[10px] uppercase font-bold text-sky-400 mb-1">Reter na Reserva</p>
              <p className="text-xl font-bold text-sky-400">{formatBRL(valorReserva)}</p>
            </div>
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 flex flex-col justify-center shadow-inner">
              <p className="text-[10px] uppercase font-bold text-primary mb-1">Poder de Fogo (Ativos)</p>
              <p className="text-xl font-bold text-primary">{formatBRL(valorAtivos)}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative pl-6 border-l-2 border-emerald-500/30 pb-2">
              <div className="absolute -left-[11px] top-0 bg-card border-2 border-emerald-500 p-1 rounded-full shadow-sm">
                <Droplets className="h-3 w-3 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-400">Marco 1: O Primeiro Pingo (R$ 150/mês)</h4>
                <p className="text-xs text-muted-foreground mt-1">O sistema paga sua conta de internet de forma perpétua.</p>
                <p className="text-lg font-black text-foreground mt-2">Alvo em {converterMeses(calcularMesesParaRenda(150))}</p>
              </div>
            </div>
            <div className="relative pl-6 border-l-2 border-sky-500/30 pb-2">
              <div className="absolute -left-[11px] top-0 bg-card border-2 border-sky-500 p-1 rounded-full shadow-sm">
                <TrendingUp className="h-3 w-3 text-sky-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-sky-400">Marco 2: Ponto de Virada ({formatBRL(aporteAcao)}/mês)</h4>
                <p className="text-xs text-muted-foreground mt-1">Os juros mensais empatam com o seu esforço. Seu dinheiro trabalha tanto quanto você.</p>
                <p className="text-lg font-black text-foreground mt-2">Alvo em {converterMeses(calcularMesesParaRenda(aporteAcao))}</p>
              </div>
            </div>
            <div className="relative pl-6 border-l-2 border-transparent">
              <div className="absolute -left-[11px] top-0 bg-card border-2 border-amber-500 p-1 rounded-full shadow-md">
                <Crown className="h-3 w-3 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-500">Marco 3: Colheita Final ({formatBRL(custoFixo)}/mês)</h4>
                <p className="text-xs text-muted-foreground mt-1">Liberdade total. O patrimônio paga o custo de vida fixo da família e gera herança infinita.</p>
                <p className="text-lg font-black text-foreground mt-2">Alvo em {converterMeses(calcularMesesParaRenda(custoFixo))}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/50 flex justify-end">
            <Button onClick={onNext} className="gap-2 h-11 px-6 bg-secondary text-secondary-foreground hover:bg-secondary/80">
              Próximo Passo: Leme da Vida <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// LEME DA VIDA
// ============================================================
type Milestone = { age: number; title: string; subtitle: string; description: string; icon: ReactNode; accent: string };
const MILESTONES: Milestone[] = [
  { age: 20, title: "Futuro Presente", subtitle: "20 anos", description: "A semente plantada hoje se consolida. Disciplina vence a inteligência.", icon: <Sprout className="h-5 w-5" />, accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" },
  { age: 30, title: "Aposentadoria", subtitle: "30 anos", description: "O patrimônio já sustenta o básico. O trabalho vira uma opção, não obrigação.", icon: <Sun className="h-5 w-5" />, accent: "from-sky-500/20 to-sky-500/5 border-sky-500/30" },
  { age: 50, title: "Colheita da Tâmara", subtitle: "50 anos", description: "Legado blindado. A árvore fornece frutos para a esposa, filhas e netos.", icon: <Trees className="h-5 w-5" />, accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
];

function LemeDaVida({ userId, aporteMensalSugerido, onNext }: { userId: string, aporteMensalSugerido: number, onNext: () => void }) {
  const [birth, setBirth] = useState<string>("");
  const [aporteConfirmado, setAporteConfirmado] = useState<boolean | null>(null);
  
  const [rendimentoReal, setRendimentoReal] = useState("0,80");
  const [taxaSimulada, setTaxaSimulada] = useState("0,80");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const b = window.localStorage.getItem(`${BIRTH_KEY_BASE}:${userId}`);
      if (b) setBirth(b);
    }
  }, [userId]);

  const calcularProjecaoLegado = (anos: number) => {
    const aporte = aporteMensalSugerido > 0 ? aporteMensalSugerido : 800; 
    let taxaMes = parseNumber(taxaSimulada) / 100;
    if (taxaMes <= 0) taxaMes = 0.0001; 
    
    const n = anos * 12;
    const patrimonio = aporte * ((Math.pow(1 + taxaMes, n) - 1) / taxaMes);
    return { patrimonio, renda: patrimonio * taxaMes };
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      <section className="grid gap-4 md:grid-cols-3">
        {MILESTONES.map((m) => (
          <MilestoneCard key={m.age} milestone={m} birth={birth} />
        ))}
      </section>

      <Card className="border-amber-500/20 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
        <CardHeader className="bg-gradient-to-br from-amber-500/10 to-background pb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trees className="h-6 w-6 text-amber-500" /> A Matemática do Legado
              </CardTitle>
              <CardDescription className="mt-1">
                Altere a taxa abaixo e veja o impacto brutal dos juros no longo prazo com aportes de <strong className="text-amber-500">{formatBRL(aporteMensalSugerido > 0 ? aporteMensalSugerido : 800)}/mês</strong>.
              </CardDescription>
            </div>
            
            <div className="bg-background p-3 rounded-lg border border-amber-500/30 flex items-center gap-3 shadow-inner">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Simular Taxa (a.m.):</Label>
              <div className="flex items-center gap-1">
                <Input 
                  inputMode="decimal" 
                  value={taxaSimulada} 
                  onChange={(e) => setTaxaSimulada(e.target.value)} 
                  className="w-20 h-9 text-center font-black text-amber-500 border-amber-500/50 bg-amber-500/5" 
                />
                <span className="text-xs font-bold text-muted-foreground">%</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2">
          <div className="grid gap-4 sm:grid-cols-3">
            {[5, 10, 20].map((anos) => {
              const proj = calcularProjecaoLegado(anos);
              return (
                <div key={anos} className="rounded-xl border border-border bg-card/50 p-5 space-y-3 relative hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-500">{anos} Anos</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Patrimônio Acumulado</p>
                    <p className="text-2xl font-bold text-foreground transition-all duration-300">{formatBRL(proj.patrimonio)}</p>
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-[11px] text-muted-foreground mb-1">Sua Mesada Infinita</p>
                    <p className="text-lg font-bold text-emerald-400 transition-all duration-300">~ {formatBRL(proj.renda)} / mês</p>
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
              <CheckCircle2 className={`h-5 w-5 ${aporteConfirmado === true ? 'text-emerald-500' : 'text-primary'}`} /> Guardião da Disciplina
            </CardTitle>
            <CardDescription>Mantenha o foco. Não deixe o tempo escapar.</CardDescription>
          </CardHeader>
          <CardContent>
            {aporteConfirmado === null ? (
              <div className="space-y-4">
                <p className="text-sm text-foreground">A semente de R$ {formatBRL(aporteMensalSugerido)} já foi regada na corretora este mês?</p>
                <div className="flex gap-2">
                  <Button onClick={() => setAporteConfirmado(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Sim, feito!</Button>
                  <Button onClick={() => setAporteConfirmado(false)} variant="destructive" className="flex-1">Não consegui</Button>
                </div>
              </div>
            ) : aporteConfirmado === true ? (
              <div className="space-y-2">
                <p className="text-emerald-400 font-semibold">Legado protegido com sucesso!</p>
                <Button variant="link" size="sm" onClick={() => setAporteConfirmado(null)} className="px-0 text-xs">Desfazer</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-400 font-semibold">Alerta de Rota! Recupere mês que vem.</p>
                <Button variant="link" size="sm" onClick={() => setAporteConfirmado(null)} className="px-0 text-xs text-red-300">Tentar Novamente</Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-primary/20 bg-gradient-to-br from-background to-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-sky-500" /> Ajuste Fino (O Café a Menos)
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-3">
               <Label className="text-xs">Rendimento da sua carteira este mês (%)</Label>
               <div className="flex gap-2 items-center">
                 <Input inputMode="decimal" value={rendimentoReal} onChange={(e) => setRendimentoReal(e.target.value)} className="w-24 font-bold" />
                 <span className="text-xs text-muted-foreground">Meta Base: 0.8%</span>
               </div>
               {parseNumber(rendimentoReal) < 0.8 ? (
                 <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20 leading-relaxed">
                   <strong>Dica da IA:</strong> Adicione cerca de R$ 30,00 no seu aporte do mês que vem para cobrir essa leve variação de mercado e manter a rota inabalável.
                 </p>
               ) : (
                 <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                   Perfeito! A máquina está girando na velocidade ideal.
                 </p>
               )}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={onNext} className="gap-2 h-11 px-6 bg-primary text-primary-foreground">
          Passo Final: Comprar Ativos <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function MilestoneCard({ milestone, birth }: { milestone: Milestone; birth: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

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
    const t = Math.floor(diff / 1000);
    const y = Math.floor(t / (365.25 * 24 * 3600));
    return { reached: false, years: y };
  }, [target, now]);

  return (
    <Card className={`bg-gradient-to-br ${milestone.accent} border p-5 flex flex-col justify-between h-full`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{milestone.subtitle}</span>
          <span className="text-foreground/50">{milestone.icon}</span>
        </div>
        <h4 className="text-lg font-bold mb-2">{milestone.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{milestone.description}</p>
      </div>
      <div className="mt-4 pt-4 border-t border-border/30">
        {!remaining ? (
          <p className="text-[10px] text-muted-foreground">Calculando...</p>
        ) : remaining.reached ? (
          <p className="text-sm font-bold text-primary">Marco 100% Alcançado 🌱</p>
        ) : (
          <p className="text-sm font-semibold text-foreground">Faltam {remaining.years} anos</p>
        )}
      </div>
    </Card>
  );
}

// ============================================================
// ATIVOS E SCANNER DA IA (COM RADAR)
// ============================================================
const KITS_ALOCACAO = [
  { 
    id: 'alto', 
    name: 'Kit Arrojado (Acelerador)', 
    badge: 'Alto Risco', 
    isMVP: false, 
    assets: [
      { t: 'PETR4', split: 25 }, { t: 'VALE3', split: 25 }, { t: 'URPR11', split: 25 }, { t: 'HCTR11', split: 25 }
    ], 
    info: 'Oscila fortemente. Exige coração forte e aceitação de risco em troca de dividendos agressivos momentâneos.' 
  },
  { 
    id: 'medio', 
    name: 'Kit Expansão (Moderado)', 
    badge: 'Risco Médio', 
    isMVP: false, 
    assets: [
      { t: 'ITUB4', split: 20 }, { t: 'EGIE3', split: 20 }, { t: 'XPML11', split: 30 }, { t: 'VISC11', split: 30 }
    ], 
    info: 'Boas empresas e forte peso em shoppings. Oscila um pouco mais durante crises de consumo e alta de juros.' 
  },
  { 
    id: 'recomendado', 
    name: 'Kit Legado (Ouro)', 
    badge: 'Blindagem Total', 
    isMVP: true, 
    assets: [
      { t: 'BBAS3', split: 10 }, { t: 'ITUB4', split: 10 }, { t: 'TAEE11', split: 10 }, { t: 'EGIE3', split: 10 }, { t: 'BBSE3', split: 10 },
      { t: 'HGLG11', split: 10 }, { t: 'BTLG11', split: 10 }, { t: 'XPML11', split: 10 }, { t: 'VISC11', split: 10 }, { t: 'KNCR11', split: 10 }
    ], 
    info: 'A fundação de pedra. Diversificação impecável em Bancos, Energia, Seguros, Logística e Shoppings. Risco totalmente diluído para dormir em paz.' 
  }
];

function Ativos({ aporteMensal, metaReservaAtingida }: { aporteMensal: number; metaReservaAtingida: boolean }) {
  const [selectedKit, setSelectedKit] = useState<string | null>(null);
  const aporte = aporteMensal > 0 ? aporteMensal : 800;

  const [searchTicker, setSearchTicker] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleScan = () => {
    if (!searchTicker) return toast.error("Digite o código do ativo.");
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const t = searchTicker.toUpperCase().trim();
      let result;

      if (t === 'MGLU3' || t === 'OIBR3' || t === 'AMER3') {
        result = { ticker: t, name: 'Ação Especulativa', status: 'danger', icon: <ShieldAlert className="h-6 w-6 text-red-500" />, verdict: 'Reprovado pelo seu Perfil de Legado Seguro.', pros: ['Potencial de alta forte caso a economia se recupere rapidamente.'], cons: ['Setor extremamente frágil a juros altos.', 'Dívida elevada.', 'Não possui consistência em dividendos.'], color: 'red' };
      } else if (t === 'PETR4' || t === 'VALE3') {
        result = { ticker: t, name: 'Commodity Cíclica', status: 'warning', icon: <AlertTriangle className="h-6 w-6 text-amber-500" />, verdict: 'Atenção. Paga bons dividendos, mas vive de ciclos intensos.', pros: ['Empresa gigante global.', 'Paga dividendos altíssimos quando o minério/petróleo estão em alta.'], cons: ['A cotação despenca se o preço mundial da commodity cair.', 'Risco de interferência governamental no longo prazo.'], color: 'amber' };
      } else if (t === 'TAEE11' || t === 'BBAS3' || t === 'HGLG11' || t === 'EGIE3') {
        result = { ticker: t, name: 'Ativo Padrão Ouro', status: 'success', icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />, verdict: 'Aprovado! Peça chave para construção de Renda Passiva.', pros: ['Lucros constantes em qualquer cenário econômico.', 'Histórico impecável de pagamento de dividendos gordos.', 'Setor perene (sempre haverá demanda).'], cons: ['Preço da cota demora a subir (foco é renda, não valorização explosiva).'], color: 'emerald' };
      } else {
        result = { ticker: t, name: 'Ativo em Análise', status: 'warning', icon: <Search className="h-6 w-6 text-sky-500" />, verdict: 'Ativo fora da Lista Ouro do sistema. Exige cautela.', pros: ['Pode compor uma parcela pequena (até 5%) de uma carteira diversificada.'], cons: ['Não recomendamos como pilar base da sua fundação de legado.'], color: 'sky' };
      }
      setScanResult(result);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* A VITRINE */}
      <div>
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" /> O Balcão de Negócios
          </h2>
          <p className="text-muted-foreground text-sm">Não precisa entender gráficos. Escolha a sua trilha e o sistema desenha a ordem exata para sua corretora.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {KITS_ALOCACAO.map(kit => (
            <Card key={kit.id} className={`flex flex-col border-2 transition-all ${kit.isMVP ? 'border-amber-500/40 shadow-xl shadow-amber-500/5 bg-amber-500/5' : 'border-border bg-card'}`}>
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">{kit.badge}</span>
                  {kit.isMVP && <Crown className="h-4 w-4 text-amber-500" />}
                </div>
                <CardTitle className={`text-lg ${kit.isMVP ? 'text-amber-500' : 'text-foreground'}`}>{kit.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col flex-1">
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{kit.info}</p>
                <Button 
                  onClick={() => { setSelectedKit(kit.id); toast.success("Ordem de execução gerada!"); }}
                  variant={selectedKit === kit.id ? 'secondary' : 'default'}
                  className={`w-full ${kit.isMVP && selectedKit !== kit.id ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
                >
                  {selectedKit === kit.id ? 'Selecionado' : 'Usar esta Estratégia'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedKit && (
          <Card className="border-primary/40 bg-card mt-8 animate-in slide-in-from-bottom-4 shadow-2xl">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" /> A Lista do Home Broker
              </CardTitle>
              <CardDescription>Abra sua corretora (ou banco) e execute estas compras hoje.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {KITS_ALOCACAO.find(k => k.id === selectedKit)?.assets.map(a => (
                  <div key={a.t} className="p-4 rounded-xl border border-border bg-background flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xl font-black">{a.t}</p>
                      <span className="text-[10px] font-bold px-2 py-1 bg-muted rounded">{a.split}%</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Comprar aprox.</p>
                      <p className="text-lg font-bold text-emerald-400">{formatBRL((aporte * a.split) / 100)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5" />
                <p className="text-sm text-emerald-200/90 leading-relaxed">
                  <strong>Pronto!</strong> Esse é o segredo dos grandes investidores: método chato e repetitivo. O sistema guiou seu caminho sem margem para erro. Compre e vá aproveitar a família.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RADAR DA IA (ON-DEMAND) */}
      <div className="pt-10 border-t border-border">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" /> Radar da IA (Análise de Dicas)
          </h2>
          <p className="text-muted-foreground text-sm">Ouviu falar de uma ação e quer saber se é boa? Digite o código abaixo e a IA vai dar o veredito protegendo seu legado.</p>
        </div>

        <Card className="bg-muted/10">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 items-end max-w-lg">
              <div className="w-full space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Código na Bolsa (Ex: PETR4, TAEE11)</Label>
                <Input 
                  value={searchTicker} 
                  onChange={(e) => setSearchTicker(e.target.value)} 
                  placeholder="Digite aqui..." 
                  className="h-12 text-lg uppercase bg-background"
                />
              </div>
              <Button onClick={handleScan} disabled={isScanning} className="h-12 px-8 w-full sm:w-auto bg-primary text-primary-foreground">
                {isScanning ? <Loader2 className="h-5 w-5 animate-spin" /> : "Analisar Ativo"}
              </Button>
            </div>

            {scanResult && (
              <div className="mt-8 animate-in slide-in-from-bottom-4">
                <div className={`p-5 rounded-t-xl border border-b-0 border-${scanResult.color}-500/30 bg-${scanResult.color}-500/10 flex items-center gap-4`}>
                  {scanResult.icon}
                  <div>
                    <h3 className={`text-lg font-bold text-${scanResult.color}-500 uppercase tracking-widest`}>{scanResult.ticker} <span className="text-xs font-normal text-muted-foreground capitalize">({scanResult.name})</span></h3>
                    <p className="text-sm text-foreground font-medium mt-1">{scanResult.verdict}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 border border-border rounded-b-xl overflow-hidden bg-card">
                  <div className="p-5 border-b sm:border-b-0 sm:border-r border-border bg-emerald-500/5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2 mb-4">
                      <ThumbsUp className="h-4 w-4" /> Prós
                    </h4>
                    <ul className="space-y-3">
                      {scanResult.pros.map((p: string, i: number) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> <span className="leading-relaxed">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5 bg-red-500/5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-red-500 flex items-center gap-2 mb-4">
                      <ThumbsDown className="h-4 w-4" /> Contras
                    </h4>
                    <ul className="space-y-3">
                      {scanResult.cons.map((c: string, i: number) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <Minus className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /> <span className="leading-relaxed">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// ============================================================
// NOVIDADE: ABA MINHA CARTEIRA (ACOMPANHAMENTO REAL)
// ============================================================
function MinhaCarteira() {
  const mockPatrimonio = 14250.00;
  const mockInvestido = 13500.00;
  const mockRentabilidade = "+5.55%";
  const mockProventos = 325.40;

  const dividendosHistory = [
    { mes: 'Jan', val: 12.50 },
    { mes: 'Fev', val: 18.00 },
    { mes: 'Mar', val: 24.30 },
    { mes: 'Abr', val: 42.00 },
    { mes: 'Mai', val: 65.10 },
    { mes: 'Jun', val: 78.50 },
    { mes: 'Jul', val: 85.00 },
  ];
  const maxDiv = Math.max(...dividendosHistory.map(d => d.val));

  const mockAtivos = [
    { ticker: 'TAEE11', tipo: 'Ação', qtd: 50, pm: 34.50, atual: 36.20, total: 1810.00, rent: '+4.9%' },
    { ticker: 'BBAS3', tipo: 'Ação', qtd: 40, pm: 25.00, atual: 28.10, total: 1124.00, rent: '+12.4%' },
    { ticker: 'HGLG11', tipo: 'FII', qtd: 20, pm: 158.00, atual: 162.00, total: 3240.00, rent: '+2.5%' },
    { ticker: 'XPML11', tipo: 'FII', qtd: 35, pm: 112.00, atual: 115.50, total: 4042.50, rent: '+3.1%' },
    { ticker: 'KNCR11', tipo: 'FII', qtd: 40, pm: 101.50, atual: 100.80, total: 4032.00, rent: '-0.6%' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Seu Legado Real</h2>
          <p className="text-sm text-muted-foreground">Acompanhamento consolidado da sua carteira de investimentos.</p>
        </div>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => toast.success("Módulo de lançamento manual em breve.")}>
          <Plus className="h-4 w-4" /> Registrar Compra
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Briefcase className="h-4 w-4" />} label="Patrimônio Total" value={formatBRL(mockPatrimonio)} />
        <KpiCard icon={<Wallet className="h-4 w-4" />} label="Total Investido" value={formatBRL(mockInvestido)} />
        <KpiCard icon={<Activity className="h-4 w-4" />} label="Rentabilidade" value={mockRentabilidade} variation={mockRentabilidade} />
        <KpiCard icon={<Droplets className="h-4 w-4 text-emerald-500" />} label="Proventos Acumulados" value={formatBRL(mockProventos)} highlight />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 border-primary/20 bg-gradient-to-t from-background to-card shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplets className="h-5 w-5 text-emerald-400" /> A Chuva de Dividendos
            </CardTitle>
            <CardDescription>Sua renda passiva crescendo mês a mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-8 flex items-end justify-between h-48 gap-2 border-b border-border/50 pb-2 relative">
              <div className="absolute top-1/2 w-full border-t border-dashed border-emerald-500/20 z-0"></div>
              <span className="absolute top-1/2 -mt-4 right-0 text-[9px] text-emerald-500/50 bg-background px-1">Marco 1 (Conta de Luz)</span>

              {dividendosHistory.map((item, index) => {
                const heightPct = Math.max(5, (item.val / maxDiv) * 100);
                return (
                  <div key={index} className="flex flex-col items-center flex-1 z-10 group relative">
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      {formatBRL(item.val)}
                    </div>
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-600/80 to-emerald-400/80 rounded-t-sm hover:brightness-125 transition-all cursor-pointer"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground mt-2 uppercase">{item.mes}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4 italic">
              "A oitava maravilha do mundo em ação."
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Custódia (Seus Ativos Atuais)</CardTitle>
            <CardDescription>O que já foi comprado e está na sua corretora rendendo.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Ativo</th>
                  <th className="pb-3 font-medium text-center">Tipo</th>
                  <th className="pb-3 font-medium text-right">Qtd</th>
                  <th className="pb-3 font-medium text-right">Preço Médio</th>
                  <th className="pb-3 font-medium text-right">Cotação</th>
                  <th className="pb-3 font-medium text-right">Valor Total</th>
                  <th className="pb-3 font-medium text-right">Rent.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {mockAtivos.map((ativo, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-bold text-foreground">{ativo.ticker}</td>
                    <td className="py-3 text-center"><span className="text-[10px] bg-muted px-2 py-1 rounded">{ativo.tipo}</span></td>
                    <td className="py-3 text-right">{ativo.qtd}</td>
                    <td className="py-3 text-right text-muted-foreground">{formatBRL(ativo.pm)}</td>
                    <td className="py-3 text-right font-medium">{formatBRL(ativo.atual)}</td>
                    <td className="py-3 text-right font-bold text-primary">{formatBRL(ativo.total)}</td>
                    <td className={`py-3 text-right font-bold ${ativo.rent.includes('-') ? 'text-red-400' : 'text-emerald-400'}`}>
                      {ativo.rent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}