ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS strategic_objective text NOT NULL DEFAULT 'brasil_dividendos';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_preference text NOT NULL DEFAULT 'isencao_prioritaria';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text;