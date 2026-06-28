export const formatBRL = (value: number | null | undefined): string => {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(n);
};

export const parseNumber = (value: string): number => {
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};