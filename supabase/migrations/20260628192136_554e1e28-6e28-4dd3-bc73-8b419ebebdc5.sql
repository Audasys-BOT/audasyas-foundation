
CREATE TABLE public.ativos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  pct NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ticker)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ativos TO authenticated;
GRANT ALL ON public.ativos TO service_role;

ALTER TABLE public.ativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ativos"
  ON public.ativos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ativos_updated_at
  BEFORE UPDATE ON public.ativos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
