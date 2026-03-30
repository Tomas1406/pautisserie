import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productos } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!Array.isArray(productos) || productos.length === 0) {
      return new Response(JSON.stringify({ error: "No products provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productList = productos.map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      descripcion: p.descripcion || "",
      porciones: p.porciones?.map((por: any) => por.nombre) || [],
    }));

    const prompt = `Eres un experto en marketing de pastelería artesanal argentina. Para cada producto, genera:
- "description": una descripción de marketing atractiva de 1-2 oraciones (máximo 120 caracteres). Si el producto ya tiene descripción, mejórala para marketing.
- "highlight": frase corta impactante de máximo 4 palabras
- "badge": etiqueta especial si aplica ("Más vendido", "Premium", "Clásico", "Artesanal", "Nuevo") o null si no aplica

Productos:
${JSON.stringify(productList, null, 2)}

Responde SOLO con un array JSON válido con objetos que tengan: id, description, highlight, badge.
No uses markdown ni explicaciones.`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Responds only with valid JSON arrays. No markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    
    // Clean and parse
    const cleaned = text.replace(/```json\s*|```\s*/g, "").trim();
    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      result = [];
    }

    return new Response(JSON.stringify({ descriptions: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
