ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente text NOT NULL DEFAULT '';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS pago_estado text NOT NULL DEFAULT 'no_pagado';