
CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_entrega date NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente',
  productos jsonb NOT NULL DEFAULT '[]'::jsonb,
  costo_total numeric NOT NULL DEFAULT 0,
  ingreso_total numeric NOT NULL DEFAULT 0,
  ganancia numeric NOT NULL DEFAULT 0,
  ingredientes_necesarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  notas text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pedidos" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pedidos" ON public.pedidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete pedidos" ON public.pedidos FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
