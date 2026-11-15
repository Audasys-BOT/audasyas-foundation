/**
 * Pure financial logic for the AudasYAs Invest dashboard.
 *
 * Extracted from `src/routes/index.tsx` so the rules can be unit-tested
 * independently of React. Keep these functions free of side effects.
 */

export type AssetInput = {
  ticker: string;
  /** Percentual da carteira definido pelo usuário (3, 5 ou 10). */
  pct: number;
  /** Variação do dia em % (ex: -3.5). `null` quando indisponível. */
  change: number | null;
};

export type AssetAllocation = AssetInput & {
  /** Valor base proporcional ao % dentro do bloco de ativos. */
  base: number;
  /** Bônus de +3% sobre o base quando há queda > 3%. */
  boost: number;
  /** Valor total sugerido (base + boost). */
  total: number;
  /** True quando variacao_dia <= -3%. */
  isOpportunity: boolean;
};

/** Capacidade de aporte = Salário − Custo de Vida Fixo (nunca negativa). */
export function capacidadeAporte(salario: number, custoFixo: number): number {
  return (salario || 0) - (custoFixo || 0);
}

/**
 * Priorização da Reserva de Emergência até o teto.
 *
 * - `sugestaoReserva` = quanto falta para o teto, limitado pela capacidade.
 * - `aporteSugerido`  = sobra para ativos (Capacidade − Sugestão de Reserva).
 * - `metaAtingida`    = true quando a reserva já alcançou (ou superou) o teto.
 */
export function priorizarReserva(params: {
  capacidade: number;
  reservaAtual: number;
  tetoReserva: number;
}): {
  reservaFaltante: number;
  sugestaoReserva: number;
  aporteSugerido: number;
  metaAtingida: boolean;
} {
  const cap = Math.max(0, params.capacidade);
  const teto = Math.max(0, params.tetoReserva);
  const atual = Math.max(0, params.reservaAtual);
  const reservaFaltante = Math.max(0, teto - atual);
  const sugestaoReserva = Math.min(reservaFaltante, cap);
  const aporteSugerido = Math.max(0, cap - sugestaoReserva);
  const metaAtingida = teto > 0 && reservaFaltante <= 0;
  return { reservaFaltante, sugestaoReserva, aporteSugerido, metaAtingida };
}

/** Taxa mensal usada nas projeções de longo prazo (8% ao ano em proventos). */
export const TAXA_MENSAL_PROJECAO = 0.08 / 12;

/**
 * Patrimônio necessário para a carteira gerar `rendaMensal` de renda passiva,
 * considerando que o patrimônio rende `taxaMensal`.
 */
export function patrimonioParaRenda(rendaMensal: number, taxaMensal: number): number {
  if (!(rendaMensal > 0) || !(taxaMensal > 0)) return 0;
  return rendaMensal / taxaMensal;
}

/**
 * Meses até a renda passiva cobrir `rendaAlvo`, com aportes mensais iguais e
 * rendimento de `taxaMensal` ao mês (aporte ao fim de cada mês).
 *
 * Retorna 0 quando não há renda alvo e `null` quando não existe aporte — nesse
 * caso o plano não chega a lugar algum.
 */
export function mesesAteRendaPassiva(params: {
  rendaAlvo: number;
  aporteMensal: number;
  taxaMensal: number;
}): number | null {
  const renda = params.rendaAlvo;
  const aporte = params.aporteMensal;
  const taxa = params.taxaMensal;
  if (!(renda > 0)) return 0;
  if (!(aporte > 0) || !(taxa > 0)) return null;
  return Math.ceil(Math.log(renda / aporte + 1) / Math.log(1 + taxa));
}

/** "14 anos e 3 meses" a partir de um total de meses. */
export function descreverMeses(totalMeses: number): string {
  const meses = Math.max(0, Math.round(totalMeses));
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const plural = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;
  if (anos === 0) return plural(resto, "mês", "meses");
  if (resto === 0) return plural(anos, "ano", "anos");
  return `${plural(anos, "ano", "anos")} e ${plural(resto, "mês", "meses")}`;
}

/** True quando a queda do dia for maior que 3% (i.e. variação ≤ -3%). */
export function isOpportunity(change: number | null): boolean {
  return change !== null && change <= -3;
}

/**
 * Distribui `valorAtivos` entre os ativos da watchlist, proporcional ao
 * percentual definido (3/5/10), aplicando +3% de bônus quando o ativo
 * estiver em queda > 3% no dia ("Oportunidade de Compra").
 */
export function distribuirAtivos(
  valorAtivos: number,
  assets: ReadonlyArray<AssetInput>,
): AssetAllocation[] {
  const totalPct = assets.reduce((s, a) => s + a.pct, 0);
  return assets.map((a) => {
    const share = totalPct > 0 ? a.pct / totalPct : 0;
    const base = Math.max(0, valorAtivos) * share;
    const opp = isOpportunity(a.change);
    const boost = opp ? base * 0.03 : 0;
    return { ...a, base, boost, total: base + boost, isOpportunity: opp };
  });
}

/**
 * Divisão final do aporte do mês:
 * - Se a meta da reserva NÃO foi atingida, a reserva consome primeiro
 *   (até o que falta), e o resto vai para ativos.
 * - Se a meta foi atingida, todo o aporte vai para ativos.
 */
export function dividirAporte(params: {
  aporte: number;
  reservaFaltante: number;
  metaAtingida: boolean;
}): { valorReserva: number; valorAtivos: number } {
  const v = Math.max(0, params.aporte);
  if (params.metaAtingida) return { valorReserva: 0, valorAtivos: v };
  const valorReserva = Math.min(params.reservaFaltante, v);
  return { valorReserva, valorAtivos: Math.max(0, v - valorReserva) };
}