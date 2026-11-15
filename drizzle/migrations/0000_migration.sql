CREATE TABLE public.snowball_state (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snowball_state TO authenticated;
GRANT ALL ON public.snowball_state TO service_role;
ALTER TABLE public.snowball_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own snowball" ON public.snowball_state FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);