
ALTER TABLE public.productos ADD COLUMN IF NOT EXISTS unidades_por_receta numeric NOT NULL DEFAULT 1;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS ordenes jsonb NOT NULL DEFAULT '[]'::jsonb;
