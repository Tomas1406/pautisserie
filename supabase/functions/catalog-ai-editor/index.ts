import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un asistente de diseño de catálogos para Pautisserie, una pastelería artesanal. Tenés acceso a los productos reales con sus precios.

Cada producto tiene 'porciones' con múltiples tamaños y precios (ej: 1/2 unidad, 1 unidad, 1/2 docena, 1 docena). Los precios NUNCA pueden ser modificados, siempre vienen de la base de datos.

El usuario puede pedirte cambios en el catálogo en lenguaje natural. Respondé SIEMPRE con un JSON válido con exactamente estos dos campos:
{
  "message": "tu respuesta conversacional al usuario",
  "catalogState": {
    "brand": {
      "primaryColor": [89, 62, 42],
      "secondaryColor": [163, 143, 120],
      "coverImageB64": null
    },
    "products": [
      {
        "id": "string",
        "visible": true,
        "description": "descripción de marketing atractiva",
        "highlight": "frase corta impactante",
        "badge": "Nuevo" o null
      }
    ]
  }
}

IMPORTANTE:
- Los precios, nombres y porciones de los productos son de solo lectura, no los modifiques.
- Siempre incluí TODOS los productos en catalogState.products (los que no se muestran van con visible: false).
- Los colores son arrays RGB [r, g, b].
- Respondé SOLO JSON válido, sin markdown, sin backticks, sin explicaciones fuera del JSON.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mensaje, catalogState, productos: clientProductos } = await req.json();

    if (!mensaje || typeof mensaje !== "string") {
      return new Response(JSON.stringify({ error: "mensaje is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read fresh products from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: dbProducts, error: dbErr } = await sb
      .from("productos")
      .select("id, nombre, categoria, descripcion, porciones, imagen_url, costo_total, unidades_por_receta")
      .order("nombre");

    if (dbErr) throw dbErr;

    const productosInfo = (dbProducts || []).map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      descripcion: p.descripcion,
      porciones: p.porciones,
      imagenUrl: p.imagen_url,
    }));

    const userMessage = `Productos actuales de Pautisserie:
${JSON.stringify(productosInfo, null, 2)}

Estado actual del catálogo:
${JSON.stringify(catalogState || null, null, 2)}

Pedido del usuario: ${mensaje}`;

    // Call AI via Lovable gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content || "{}";

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed;
    try {
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        message: "Hubo un error procesando la respuesta. Intentá de nuevo.",
        catalogState: catalogState || null,
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("catalog-ai-editor error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
