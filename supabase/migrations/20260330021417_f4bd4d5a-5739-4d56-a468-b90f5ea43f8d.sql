CREATE TABLE public.catalogo_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.catalogo_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read catalogo_config" ON public.catalogo_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert catalogo_config" ON public.catalogo_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update catalogo_config" ON public.catalogo_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete catalogo_config" ON public.catalogo_config FOR DELETE TO authenticated USING (true);