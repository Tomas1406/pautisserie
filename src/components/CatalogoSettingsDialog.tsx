import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ImagePlus, Sparkles, Download } from "lucide-react";
import { type Producto } from "@/data/productos";
import { generarCatalogoPDF, type CatalogConfig } from "@/lib/generarCatalogoPDF";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export default function CatalogoSettingsDialog({ open, onOpenChange, productos }: Props) {
  const [primaryColor, setPrimaryColor] = useState("#593E2A");
  const [secondaryColor, setSecondaryColor] = useState("#A38F78");
  const [useAI, setUseAI] = useState(false);
  const [coverImageB64, setCoverImageB64] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setCoverImageB64(result);
      setCoverPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (productos.length === 0) {
      toast.error("No hay productos para el catálogo");
      return;
    }

    setLoading(true);
    try {
      let aiDescriptions: Map<string, { description: string; highlight: string; badge: string | null }> | undefined;

      if (useAI) {
        setLoadingMsg("Generando descripciones con IA...");
        try {
          const { data, error } = await supabase.functions.invoke("generate-catalog-descriptions", {
            body: {
              productos: productos.map(p => ({
                id: p.id,
                nombre: p.nombre,
                categoria: p.categoria,
                descripcion: p.descripcion,
                porciones: p.porciones.map(por => ({ nombre: por.nombre })),
              })),
            },
          });

          if (error) throw error;
          if (data?.descriptions && Array.isArray(data.descriptions)) {
            aiDescriptions = new Map();
            for (const item of data.descriptions) {
              aiDescriptions.set(item.id, {
                description: item.description || "",
                highlight: item.highlight || "",
                badge: item.badge || null,
              });
            }
          }
        } catch (err: any) {
          console.error("AI error:", err);
          toast.error("Error con IA, se usarán descripciones existentes");
        }
      }

      setLoadingMsg("Generando PDF...");
      const config: CatalogConfig = {
        primaryColor: hexToRgb(primaryColor),
        secondaryColor: hexToRgb(secondaryColor),
        coverImageB64,
        aiDescriptions,
      };

      await generarCatalogoPDF(productos, config);
      toast.success("Catálogo descargado");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Error al generar catálogo");
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Configurar Catálogo PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Color primario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border-0 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{primaryColor}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color secundario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border-0 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{secondaryColor}</span>
              </div>
            </div>
          </div>

          {/* Cover image */}
          <div className="space-y-1.5">
            <Label className="text-xs">Imagen de portada (opcional)</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImage} />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Portada" className="h-16 rounded-lg object-cover" />
              ) : (
                <>
                  <ImagePlus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Subir imagen de fondo</span>
                </>
              )}
            </button>
            {coverPreview && (
              <button onClick={() => { setCoverImageB64(null); setCoverPreview(null); }} className="text-xs text-destructive">
                Eliminar imagen
              </button>
            )}
          </div>

          {/* AI toggle */}
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Descripciones con IA</p>
                <p className="text-xs text-muted-foreground">Genera textos de marketing automáticos</p>
              </div>
            </div>
            <Switch checked={useAI} onCheckedChange={setUseAI} />
          </div>

          {/* Generate button */}
          <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {loadingMsg}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generar y Descargar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
