import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, imageBase64, existingIngredients } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ingredientList = (existingIngredients as string[])?.join(", ") || "";

    const systemPrompt = `You are a recipe extraction assistant for an Argentine bakery cost management app called Pautisserie. 
Your task is to extract structured recipe data from text or images of recipes.

Known ingredients in the system: [${ingredientList}]

Extract:
1. Product name
2. Suggested category (one of: Pastafrolas, Tartas, Tortas, Individuales)
3. List of ingredients with quantities and units

For each ingredient, try to match it to the known ingredients list using fuzzy matching.
Use standard units: gr, ml, unidad, kg, lt.
Convert common measurements (cucharada = 15gr/ml, cucharadita = 5gr/ml, taza = 250gr/ml).

Return data using the extract_recipe function.`;

    const userContent: any[] = [];
    
    if (text) {
      userContent.push({
        type: "text",
        text: `Extract the recipe from this text:\n\n${text}`
      });
    }
    
    if (imageBase64) {
      userContent.push({
        type: "text",
        text: "Extract the recipe from this image:"
      });
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 }
      });
    }

    if (userContent.length === 0) {
      throw new Error("No text or image provided");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_recipe",
              description: "Extract structured recipe data",
              parameters: {
                type: "object",
                properties: {
                  nombre: { type: "string", description: "Product name" },
                  categoria: { type: "string", enum: ["Pastafrolas", "Tartas", "Tortas", "Individuales"], description: "Product category" },
                  ingredientes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nombre: { type: "string", description: "Ingredient name as detected" },
                        matched_ingredient: { type: "string", description: "Matched ingredient name from known list, or null if new", nullable: true },
                        cantidad: { type: "number", description: "Quantity" },
                        unidad: { type: "string", enum: ["gr", "ml", "unidad", "kg", "lt"], description: "Unit" },
                      },
                      required: ["nombre", "matched_ingredient", "cantidad", "unidad"],
                      additionalProperties: false,
                    }
                  },
                  unidades_por_receta: { type: "number", description: "How many units/portions the recipe yields" },
                },
                required: ["nombre", "categoria", "ingredientes", "unidades_por_receta"],
                additionalProperties: false,
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_recipe" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Error al procesar la receta");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const extracted = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(extracted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No se pudo extraer la receta");
  } catch (e) {
    console.error("extract-recipe error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
