import { supabase } from "@/integrations/supabase/client";

export type FinancialMetrics = {
  id: string;
  user_id: string;
  salario_mensal: number;
  custo_de_vida_fixo: number;
  reserva_emergencia: number;
  capacidade_aporte_mensal: number;
};

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
};

export async function fetchMetrics(userId: string): Promise<FinancialMetrics | null> {
  const { data, error } = await supabase
    .from("financial_metrics")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as FinancialMetrics | null;
}

export async function upsertMetrics(
  userId: string,
  payload: { salario_mensal: number; custo_de_vida_fixo: number; reserva_emergencia?: number },
): Promise<FinancialMetrics> {
  const { data, error } = await supabase
    .from("financial_metrics")
    .upsert(
      {
        user_id: userId,
        salario_mensal: payload.salario_mensal,
        custo_de_vida_fixo: payload.custo_de_vida_fixo,
        ...(payload.reserva_emergencia !== undefined
          ? { reserva_emergencia: payload.reserva_emergencia }
          : {}),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as FinancialMetrics;
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function createTransaction(
  userId: string,
  payload: { amount: number; description?: string; transaction_date?: string },
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      amount: payload.amount,
      description: payload.description ?? null,
      transaction_date: payload.transaction_date ?? new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
}