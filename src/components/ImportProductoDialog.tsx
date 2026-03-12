import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIngredientes } from "@/context/IngredientesContext";
import { formatCurrency } from "@/data/productos";
import { FileText, Camera, FileSpreadsheet, Loader2, Check, AlertCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const CATEGORIAS = ["Pastafrolas", "Tartas", "Tortas", "Individuales"];

interface DetectedIngredient {
  nombre: string;
  matched_ingredient: string | null;
  cantidad: number;
  unidad: string;
  // local state
  ingredienteId?: string;
  isNew?: boolean;
}

interface DetectedRecipe {
  nombre: string;
  categoria: string;
  ingredientes: DetectedIngredient[];
  unidades_por_receta: number;
}

type ImportMethod = "text" | "image" | "excel" | null;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportProductoDialog = ({ open, onOpenChange }: Props) => {
  const { ingredientes, agregarIngrediente, agregarProducto } = useIngredientes();
  const [method, setMethod] = useState<ImportMethod>(null);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [recipe, setRecipe] = useState<DetectedRecipe | null>(null);
  const [precioVenta, setPrecioVenta] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMethod(null);
    setTexto("");
    setRecipe(null);
    setPrecioVenta("");
    setCargando(false);
    setGuardando(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const existingNames = ingredientes.map(i => i.nombre);

  const processWithAI = async (payload: { text?: string; imageBase64?: string }) => {
    setCargando(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-recipe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            ...payload,
            existingIngredients: existingNames,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Error al procesar");
      }

      const data: DetectedRecipe = await resp.json();
      
      // Map matched ingredients to IDs
      data.ingredientes = data.ingredientes.map(ing => {
        const matched = ing.matched_ingredient
          ? ingredientes.find(i => i.nombre.toLowerCase() === ing.matched_ingredient!.toLowerCase())
          : null;
        return {
          ...ing,
          ingredienteId: matched?.id || "",
          isNew: !matched,
        };
      });

      setRecipe(data);
    } catch (err: any) {
      toast.error(err.message || "Error al procesar");
    } finally {
      setCargando(false);
    }
  };

  const handleTextSubmit = () => {
    if (!texto.trim()) { toast.error("Pegá el texto de la receta"); return; }
    processWithAI({ text: texto });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    processWithAI({ imageBase64: base64 });
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargando(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      // Convert to text and process with AI
      const text = rows.map(row => row.join("\t")).join("\n");
      await processWithAI({ text: `This is data from an Excel spreadsheet:\n${text}` });
    } catch (err: any) {
      toast.error("Error al leer el archivo Excel");
      setCargando(false);
    }
  };

  const updateRecipeField = (field: keyof DetectedRecipe, value: any) => {
    if (!recipe) return;
    setRecipe({ ...recipe, [field]: value });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    if (!recipe) return;
    const updated = [...recipe.ingredientes];
    updated[index] = { ...updated[index], [field]: value };
    
    // If user selects an existing ingredient, mark as not new
    if (field === "ingredienteId" && value) {
      updated[index].isNew = false;
      const matched = ingredientes.find(i => i.id === value);
      if (matched) updated[index].matched_ingredient = matched.nombre;
    }
    
    setRecipe({ ...recipe, ingredientes: updated });
  };

  const guardar = async () => {
    if (!recipe) return;
    if (!precioVenta || parseFloat(precioVenta) <= 0) {
      toast.error("Ingresá un precio de venta");
      return;
    }

    setGuardando(true);
    try {
      // First, create any new ingredients
      for (const ing of recipe.ingredientes) {
        if (ing.isNew && !ing.ingredienteId) {
          await agregarIngrediente({
            nombre: ing.nombre,
            precio: 0,
            cantidad: 1,
            unidad: ing.unidad,
          });
          // Get the new ID
          const newId = ing.nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
          ing.ingredienteId = newId;
        }
      }

      const validIngredients = recipe.ingredientes
        .filter(ing => ing.ingredienteId)
        .map(ing => ({ ingredienteId: ing.ingredienteId!, cantidad: ing.cantidad }));

      if (validIngredients.length === 0) {
        toast.error("No hay ingredientes válidos");
        setGuardando(false);
        return;
      }

      await agregarProducto({
        nombre: recipe.nombre,
        categoria: recipe.categoria,
        ingredientes: validIngredients,
        unidadesPorReceta: recipe.unidades_por_receta || 1,
        porciones: [{ unidadOutput: "1_unidad", precio: parseFloat(precioVenta) }],
      });

      toast.success(`"${recipe.nombre}" creado exitosamente`);
      handleClose(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Producto</DialogTitle>
        </DialogHeader>

        {!method && !recipe && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">¿Cómo querés cargar la receta?</p>
            <button
              onClick={() => setMethod("text")}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Pegar texto</p>
                <p className="text-xs text-muted-foreground">Copiá y pegá una receta</p>
              </div>
            </button>
            <button
              onClick={() => { setMethod("image"); setTimeout(() => fileInputRef.current?.click(), 100); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              <Camera className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Foto de receta</p>
                <p className="text-xs text-muted-foreground">Escaneá una receta escrita o impresa</p>
              </div>
            </button>
            <button
              onClick={() => { setMethod("excel"); setTimeout(() => excelInputRef.current?.click(), 100); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Archivo Excel</p>
                <p className="text-xs text-muted-foreground">Importá desde una planilla</p>
              </div>
            </button>
          </div>
        )}

        {method === "text" && !recipe && (
          <div className="space-y-3">
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Pegá aquí la receta completa con ingredientes y cantidades..."
              rows={8}
              className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMethod(null)} className="flex-1">Volver</Button>
              <Button onClick={handleTextSubmit} disabled={cargando} className="flex-1">
                {cargando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Analizar
              </Button>
            </div>
          </div>
        )}

        {(method === "image" || method === "excel") && !recipe && (
          <div className="flex flex-col items-center gap-3 py-8">
            {cargando ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analizando con IA...</p>
              </>
            ) : (
              <Button variant="outline" onClick={() => setMethod(null)}>Volver</Button>
            )}
          </div>
        )}

        {/* Preview & Edit */}
        {recipe && (
          <div className="space-y-4">
            <div className="bg-success/10 rounded-lg p-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              <span className="text-sm text-foreground">Receta detectada. Revisá los datos antes de guardar.</span>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nombre del producto</label>
              <input
                value={recipe.nombre}
                onChange={e => updateRecipeField("nombre", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Categoría</label>
              <select
                value={recipe.categoria}
                onChange={e => updateRecipeField("categoria", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Ingredientes detectados</label>
              <div className="space-y-2">
                {recipe.ingredientes.map((ing, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{ing.nombre}</span>
                      {ing.isNew && (
                        <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Nuevo
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Cantidad</label>
                        <input
                          type="number"
                          value={ing.cantidad}
                          onChange={e => updateIngredient(i, "cantidad", parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 rounded-md bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Unidad</label>
                        <select
                          value={ing.unidad}
                          onChange={e => updateIngredient(i, "unidad", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-md bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                          {["gr", "ml", "unidad", "kg", "lt"].map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    {!ing.isNew ? (
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-success" />
                        <span className="text-xs text-success">Coincide con: {ing.matched_ingredient}</span>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs text-muted-foreground">Asociar a ingrediente existente</label>
                        <select
                          value={ing.ingredienteId || ""}
                          onChange={e => updateIngredient(i, "ingredienteId", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-md bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary/30"
                        >
                          <option value="">Crear nuevo: {ing.nombre}</option>
                          {ingredientes.map(ig => (
                            <option key={ig.id} value={ig.id}>{ig.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Unidades por receta</label>
                <input
                  type="number"
                  value={recipe.unidades_por_receta}
                  onChange={e => updateRecipeField("unidades_por_receta", parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Precio de venta ($)</label>
                <input
                  type="number"
                  value={precioVenta}
                  onChange={e => setPrecioVenta(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        )}

        {recipe && (
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRecipe(null); setMethod(null); }}>Volver</Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Crear Producto
            </Button>
          </DialogFooter>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelUpload} />
      </DialogContent>
    </Dialog>
  );
};

export default ImportProductoDialog;
