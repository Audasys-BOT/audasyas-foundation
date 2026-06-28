
-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  long_term_goal TEXT,
  target_amount NUMERIC(14,2),
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FINANCIAL METRICS
CREATE TABLE public.financial_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE UNIQUE,
  salario_mensal NUMERIC(14,2) NOT NULL DEFAULT 0,
  custo_de_vida_fixo NUMERIC(14,2) NOT NULL DEFAULT 0,
  reserva_emergencia NUMERIC(14,2) NOT NULL DEFAULT 0,
  capacidade_aporte_mensal NUMERIC(14,2) GENERATED ALWAYS AS (salario_mensal - custo_de_vida_fixo) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_metrics TO authenticated;
GRANT ALL ON public.financial_metrics TO service_role;
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own metrics" ON public.financial_metrics FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_metrics_updated BEFORE UPDATE ON public.financial_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TRANSACTIONS (aportes)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON public.transactions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.financial_metrics (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
