import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OBJ = [
  ["brasil_dividendos", "Foco Brasil e dividendos"],
  ["dolarizacao_saida", "Transição para o exterior"],
  ["aposentadoria_rapida", "Aposentadoria rápida"],
] as const;
const TAX = [
  ["isencao_prioritaria", "Prefiro ativos sem imposto"],
  ["retorno_liquido", "Aceito imposto se render mais"],
] as const;

export function PerfilEstrategico() {
  const [obj, setObj] = useState("brasil_dividendos");
  const [tax, setTax] = useState("isencao_prioritaria");
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id; if (!id) return; setUid(id);
      const { data: p } = await supabase.from("profiles").select("strategic_objective, tax_preference").eq("id", id).maybeSingle();
      if (p) { setObj(p.strategic_objective); setTax(p.tax_preference); }
    });
  }, []);

  const save = async (o: string, t: string) => {
    setObj(o); setTax(t);
    if (!uid) return;
    const { error } = await supabase.from("profiles").upsert({ id: uid, strategic_objective: o, tax_preference: t });
    error ? toast.error("Não foi possível salvar") : toast.success("Perfil salvo");
  };

  const sel = "w-full rounded-md border border-border bg-background p-2 text-sm text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="font-semibold text-card-foreground">Seu perfil de investidor</h3>
      <p className="text-xs text-muted-foreground">A IA usa estas escolhas em todas as análises. Nada de day trade: só longo prazo.</p>
      <label className="block text-sm">Objetivo da família
        <select className={sel} value={obj} onChange={(e) => save(e.target.value, tax)}>
          {OBJ.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <label className="block text-sm">Imposto
        <select className={sel} value={tax} onChange={(e) => save(obj, e.target.value)}>
          {TAX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
    </div>
  );
}
