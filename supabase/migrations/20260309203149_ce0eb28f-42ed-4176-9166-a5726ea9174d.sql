
-- Ingredientes table
CREATE TABLE public.ingredientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio NUMERIC NOT NULL DEFAULT 0,
  cantidad NUMERIC NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'gr',
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Productos table with JSONB for nested data
CREATE TABLE public.productos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Individuales',
  ingredientes JSONB NOT NULL DEFAULT '[]'::jsonb,
  costo_total NUMERIC NOT NULL DEFAULT 0,
  porciones JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- RLS policies: authenticated users can do everything
CREATE POLICY "Authenticated users can read ingredientes" ON public.ingredientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ingredientes" ON public.ingredientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ingredientes" ON public.ingredientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete ingredientes" ON public.ingredientes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read productos" ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert productos" ON public.productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update productos" ON public.productos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete productos" ON public.productos FOR DELETE TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
