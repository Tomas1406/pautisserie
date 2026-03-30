import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIngredientes } from "@/context/IngredientesContext";
import { type Producto, formatCurrency } from "@/data/productos";
import { generarCatalogoPDF, type CatalogConfig } from "@/lib/generarCatalogoPDF";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Download, RotateCcw, Save, Loader2, Sparkles, ImagePlus } from "lucide-react";

interface CatalogProduct {
  id: string;
  visible: boolean;
  description: string;
  highlight: string;
  badge: string | null;
}

interface CatalogState {
  brand: {
    primaryColor: [number, number, number];
    secondaryColor: [number, number, number];
    coverImageB64: string | null;
  };
  products: CatalogProduct[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Mejorar todas las descripciones",
  "Agregar badge 'Nuevo' a todos",
  "Cambiar a colores oscuros",
  "Ocultar productos sin imagen",
];

function getInitialState(productos: Producto[]): CatalogState {
  return {
    brand: {
      primaryColor: [89, 62, 42],
      secondaryColor: [163, 143, 120],
      coverImageB64: null,
    },
    products: productos.map((p) => ({
      id: p.id,
      visible: true,
      description: p.descripcion || "",
      highlight: "",
      badge: null,
    })),
  };
}

export default function CatalogoEditor() {
  const { productos } = useIngredientes();
  const [catalogState, setCatalogState] = useState<CatalogState>(() => getInitialState(productos));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Initialize with welcome message and load saved state
  useEffect(() => {
    if (initialized.current || productos.length === 0) return;
    initialized.current = true;

    // Load saved state
    (async () => {
      const { data } = await supabase
        .from("catalogo_config")
        .select("state")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0 && data[0].state) {
        setCatalogState(data[0].state as unknown as CatalogState);
      }
    })();

    setMessages([
      {
        role: "assistant",
        content: `¡Hola! Ya cargué los ${productos.length} productos de Pautisserie. Podés pedirme que mejore las descripciones, cambie colores, oculte productos, agregue badges como "Nuevo" u "Oferta", o cualquier otro cambio. ¿Qué querrías ajustar?`,
      },
    ]);
  }, [productos]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("catalog-ai-editor", {
        body: { mensaje: userMsg, catalogState, productos: [] },
      });

      if (error) throw error;

      if (data?.catalogState) {
        setCatalogState(data.catalogState);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data?.message || "Listo, apliqué los cambios." },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Hubo un error procesando tu pedido. Intentá de nuevo." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const aiDescriptions = new Map<string, { description: string; highlight: string; badge: string | null }>();
      const visibleIds = new Set<string>();
      for (const cp of catalogState.products) {
        if (cp.visible) {
          visibleIds.add(cp.id);
          aiDescriptions.set(cp.id, {
            description: cp.description,
            highlight: cp.highlight,
            badge: cp.badge,
          });
        }
      }

      const filteredProducts = productos.filter((p) => visibleIds.has(p.id));
      const config: CatalogConfig = {
        primaryColor: catalogState.brand.primaryColor,
        secondaryColor: catalogState.brand.secondaryColor,
        coverImageB64: catalogState.brand.coverImageB64,
        aiDescriptions,
      };

      await generarCatalogoPDF(filteredProducts, config);
      toast.success("Catálogo descargado");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert: delete old, insert new
      await supabase.from("catalogo_config").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("catalogo_config").insert({ state: catalogState as any });
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCatalogState(getInitialState(productos));
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Reseté el catálogo al estado inicial. ¿Qué cambios querés hacer?" },
    ]);
  };

  // Build a map from catalogState for preview
  const catalogMap = new Map(catalogState.products.map((p) => [p.id, p]));
  const visibleProducts = productos
    .filter((p) => {
      const cp = catalogMap.get(p.id);
      return !cp || cp.visible;
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const brandPrimary = `rgb(${catalogState.brand.primaryColor.join(",")})`;
  const brandSecondary = `rgb(${catalogState.brand.secondaryColor.join(",")})`;

  return (
    <div className="flex flex-col h-[85vh]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border mb-3">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Editor de Catálogo con IA
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Resetear
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Guardar
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1" />}
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Two columns */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chat column */}
        <div className="w-[38%] flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground rounded-xl px-3 py-2 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {/* Suggestions */}
          <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-border">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                disabled={sending}
                className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Pedí un cambio al catálogo..."
              disabled={sending}
              className="flex-1"
            />
            <Button size="icon" onClick={() => sendMessage(input)} disabled={sending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview column */}
        <ScrollArea className="w-[62%] bg-card rounded-xl border border-border p-4">
          {/* Mini cover */}
          <div
            className="rounded-xl p-6 mb-4 text-center"
            style={{ background: brandPrimary }}
          >
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: brandSecondary }}>
              Catálogo de Productos
            </p>
            <h3 className="text-xl font-display font-bold text-white">Pautisserie</h3>
            <p className="text-xs mt-1 text-white/50">
              {new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long" })}
            </p>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 gap-3">
            {visibleProducts.map((prod) => {
              const cp = catalogMap.get(prod.id);
              return (
                <div key={prod.id} className="bg-background rounded-xl p-3 border border-border relative overflow-hidden">
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ background: brandPrimary }} />

                  {cp?.badge && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium inline-block mb-1.5"
                      style={{ background: brandSecondary }}
                    >
                      {cp.badge}
                    </span>
                  )}

                  <div className="flex gap-2">
                    {prod.imagenUrl ? (
                      <img
                        src={prod.imagenUrl}
                        alt={prod.nombre}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <ImagePlus className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm text-foreground truncate">{prod.nombre}</p>
                      {cp?.highlight && (
                        <p className="text-[10px] italic" style={{ color: brandSecondary }}>
                          {cp.highlight}
                        </p>
                      )}
                    </div>
                  </div>

                  {cp?.description && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{cp.description}</p>
                  )}

                  {/* Prices */}
                  <div className="mt-2 pt-1.5 border-t border-border space-y-0.5">
                    {prod.porciones.slice(0, 3).map((por, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{por.nombre}</span>
                        <span className="font-semibold" style={{ color: brandPrimary }}>
                          {formatCurrency(por.precio)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {visibleProducts.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">No hay productos visibles en el catálogo</p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
