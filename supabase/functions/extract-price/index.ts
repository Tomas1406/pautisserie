import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, ingredientNames } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ingredientList = (ingredientNames as string[]).join(", ");

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
            content: `You are a product identification and price extraction assistant for an Argentine bakery/pastry cost management app. The user will send you a photo of a product (typically from a supermarket or store). You must:
1. Identify what product is shown in the image (read the label, brand, product name).
2. Match it to the closest ingredient from this list: [${ingredientList}]. Use fuzzy matching - for example "Manteca La Serenísima" should match "Manteca", "Azúcar Ledesma" should match "Azúcar", etc.
3. Extract the price and quantity/weight from the image.

Return the data using the extract_price_data function. If you cannot identify the product or match it to any ingredient, set matched_ingredient to null. The price should be in ARS (Argentine pesos). Convert kg to gr (multiply by 1000) and lt to ml (multiply by 1000) for the cantidad field.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Look at this product image. Identify the product, match it to one of the ingredients in the list, and extract the price and quantity.`
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
              description: "Extract product identification, price and quantity data from a product image",
              parameters: {
                type: "object",
                properties: {
                  matched_ingredient: { type: "string", description: "The exact name from the ingredient list that best matches the product in the image, or null if no match", nullable: true },
                  detected_product: { type: "string", description: "The product name/brand as read from the image label" },
                  precio: { type: "number", description: "Price in ARS" },
                  cantidad: { type: "number", description: "Quantity in base units (gr, ml, or unidad)" },
                  unidad: { type: "string", enum: ["gr", "ml", "unidad"], description: "Unit of measurement" }
                },
                required: ["matched_ingredient", "detected_product", "precio", "cantidad", "unidad"],
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
