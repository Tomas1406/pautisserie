import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, ingredientName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a price extraction assistant. The user will send you a photo of a product (typically from a supermarket or store) and the name of an ingredient. Extract the price and the quantity/weight from the image. Return ONLY valid JSON with this format: {"precio": number, "cantidad": number, "unidad": "gr"|"ml"|"unidad"|"kg"|"lt"}. If you cannot determine a value, use null. The price should be in ARS (Argentine pesos). Convert kg to gr (multiply by 1000) and lt to ml (multiply by 1000) for the cantidad field, and use "gr" or "ml" as the unidad. If the unit is "unidad" keep it as is.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract the price and quantity for: "${ingredientName}". Look at the product image and find the price in ARS and the weight/quantity.`
              },
              {
                type: "image_url",
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_price_data",
              description: "Extract price and quantity data from a product image",
              parameters: {
                type: "object",
                properties: {
                  precio: { type: "number", description: "Price in ARS" },
                  cantidad: { type: "number", description: "Quantity in base units (gr, ml, or unidad)" },
                  unidad: { type: "string", enum: ["gr", "ml", "unidad"], description: "Unit of measurement" }
                },
                required: ["precio", "cantidad", "unidad"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_price_data" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intentá de nuevo en un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("Error al procesar la imagen");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const extracted = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(extracted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse from content
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return new Response(jsonMatch[0], {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No se pudo extraer el precio de la imagen");
  } catch (e) {
    console.error("extract-price error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
