export const PCT_PIMENTA = 0.05;

/** Poder de compra = poupança do mês + proventos acumulados (proventos usados primeiro). */
export function poderDeCompra(poupanca: number, proventos: number) {
  const p = Math.max(0, poupanca);
  const d = Math.max(0, proventos);
  return { total: p + d, deProventos: d, doSalario: p };
}

/** Divisão Barbell: 95% base sólida, 5% pimenta. */
export function alocacaoBarbell(total: number) {
  const t = Math.max(0, total);
  const pimenta = Math.round(t * PCT_PIMENTA * 100) / 100;
  return { base: Math.round((t - pimenta) * 100) / 100, pimenta };
}

/** Meta de reserva = 3x salário; parcela para atingir em 12 meses. */
export function metaReserva1Ano(salario: number, reservaAtual: number) {
  const meta = Math.max(0, salario) * 3;
  const falta = Math.max(0, meta - Math.max(0, reservaAtual));
  return { meta, falta, parcelaMensal: Math.round((falta / 12) * 100) / 100 };
}

/** Quantas cotas inteiras os proventos compram sozinhos. */
export function cotasGratis(proventos: number, precoCota: number) {
  if (precoCota <= 0) return 0;
  return Math.floor(Math.max(0, proventos) / precoCota);
}
