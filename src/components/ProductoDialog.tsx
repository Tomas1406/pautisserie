import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useIngredientes } from "@/context/IngredientesContext";
import { formatCurrency, type Producto } from "@/data/productos";
import { Plus, Trash2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIAS = ["Pastafrolas", "Tartas", "Tortas", "Individuales"];

interface IngredienteLinea {
  ingredienteId: string;
  cantidad: string;
}

interface PorcionLinea {
  nombre: string;
  factorOutput: string;
  precio: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoEditar?: Producto | null;
}

const ProductoDialog = ({ open, onOpenChange, productoEditar }: Props) => {
  const { ingredientes, agregarProducto, actualizarProducto } = useIngredientes();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [lineas, setLineas] = useState<IngredienteLinea[]>([{ ingredienteId: "", cantidad: "" }]);
  const [unidadesPorReceta, setUnidadesPorReceta] = useState("1");
  const [porcionesLineas, setPorcionesLineas] = useState<PorcionLinea[]>([{ nombre: "Unidad", factorOutput: "1", precio: "" }]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open && productoEditar) {
      setNombre(productoEditar.nombre);
      setDescripcion(productoEditar.descripcion || "");
      setCategoria(productoEditar.categoria);
      setUnidadesPorReceta(productoEditar.unidadesPorReceta.toString());
      setLineas(productoEditar.ingredientes.map(ri => ({
        ingredienteId: ri.ingredienteId,
        cantidad: ri.cantidad.toString(),
      })));
      setPorcionesLineas(productoEditar.porciones.map(p => ({
        nombre: p.nombre || "Unidad",
        factorOutput: (p.factorOutput || 1).toString(),
        precio: p.precio.toString(),
      })));
    } else if (open) {
      setNombre("");
      setCategoria(CATEGORIAS[0]);
      setLineas([{ ingredienteId: "", cantidad: "" }]);
      setUnidadesPorReceta("1");
      setPorcionesLineas([{ nombre: "Unidad", factorOutput: "1", precio: "" }]);
    }
  }, [open, productoEditar]);

  const addLinea = () => setLineas(prev => [...prev, { ingredienteId: "", cantidad: "" }]);
  const removeLinea = (i: number) => setLineas(prev => prev.filter((_, idx) => idx !== i));
  const updateLinea = (i: number, field: keyof IngredienteLinea, val: string) => {
    setLineas(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  };

  const addPorcion = () => setPorcionesLineas(prev => [...prev, { nombre: "", factorOutput: "1", precio: "" }]);
  const removePorcion = (i: number) => setPorcionesLineas(prev => prev.filter((_, idx) => idx !== i));

  const costoTotal = lineas.reduce((acc, l) => {
    const ing = ingredientes.find(i => i.id === l.ingredienteId);
    if (!ing) return acc;
    const cant = parseFloat(l.cantidad);
    if (isNaN(cant)) return acc;
    return acc + ing.precioUnitario * cant;
  }, 0);

  const upr = parseFloat(unidadesPorReceta.replace(",", ".")) || 1;
  const costoPerUnit = upr > 0 ? costoTotal / upr : costoTotal;

  const guardar = async () => {
    if (!nombre.trim()) { toast.error("Ingresá un nombre"); return; }
    const ingredientesValidos = lineas
      .filter(l => l.ingredienteId && parseFloat(l.cantidad) > 0)
      .map(l => ({ ingredienteId: l.ingredienteId, cantidad: parseFloat(l.cantidad) }));
    if (ingredientesValidos.length === 0) { toast.error("Agregá al menos un ingrediente"); return; }

    const porcionesValidas = porcionesLineas
      .filter(p => p.nombre.trim() && parseFloat(p.precio) > 0)
      .map(p => ({
        nombre: p.nombre.trim(),
        factorOutput: parseFloat(p.factorOutput.replace(",", ".")) || 1,
        precio: parseFloat(p.precio),
      }));
    if (porcionesValidas.length === 0) { toast.error("Agregá al menos un formato de venta con nombre y precio"); return; }

    const data: any = {
      nombre: nombre.trim(),
      categoria,
      ingredientes: ingredientesValidos,
      unidadesPorReceta: upr,
      porciones: porcionesValidas,
    };

    if (productoEditar) {
      data.imagenUrl = productoEditar.imagenUrl;
    }

    setGuardando(true);
    try {
      if (productoEditar) {
        await actualizarProducto(productoEditar.id, data);
        toast.success("Producto guardado");
      } else {
        await agregarProducto(data);
        toast.success("Producto creado");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productoEditar ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Torta de Chocolate"
              className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Ingredientes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Ingredientes</label>
              <Button size="sm" variant="ghost" onClick={addLinea} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {lineas.map((linea, i) => {
                const ing = ingredientes.find(x => x.id === linea.ingredienteId);
                return (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={linea.ingredienteId} onChange={e => updateLinea(i, "ingredienteId", e.target.value)}
                      className="flex-1 px-2 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="">Seleccionar...</option>
                      {ingredientes.map(ig => <option key={ig.id} value={ig.id}>{ig.nombre}</option>)}
                    </select>
                    <div className="relative w-24">
                      <input type="number" value={linea.cantidad} onChange={e => updateLinea(i, "cantidad", e.target.value)}
                        placeholder="Cant."
                        className="w-full px-2 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8" />
                      {ing && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{ing.unidad}</span>}
                    </div>
                    {lineas.length > 1 && (
                      <button onClick={() => removeLinea(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rendimiento */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Unidades producidas por receta</label>
            <input value={unidadesPorReceta}
              onChange={e => setUnidadesPorReceta(e.target.value)}
              placeholder="Ej: 18"
              className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          {/* Formatos de venta */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Formatos de venta</label>
              <Button size="sm" variant="ghost" onClick={addPorcion} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {porcionesLineas.map((pl, i) => {
                const factor = parseFloat(pl.factorOutput.replace(",", ".")) || 1;
                const costoPorcion = costoPerUnit * factor;
                const precioNum = parseFloat(pl.precio) || 0;
                const margen = costoPorcion > 0 ? ((precioNum - costoPorcion) / costoPorcion) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <input value={pl.nombre}
                        onChange={e => setPorcionesLineas(prev => prev.map((p, idx) => idx === i ? { ...p, nombre: e.target.value } : p))}
                        placeholder="Ej: Docena, Grande..."
                        className="flex-1 px-2 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <input value={pl.factorOutput}
                        onChange={e => setPorcionesLineas(prev => prev.map((p, idx) => idx === i ? { ...p, factorOutput: e.target.value } : p))}
                        placeholder="Uds"
                        className="w-16 px-2 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-center" />
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                        <input type="number" value={pl.precio}
                          onChange={e => setPorcionesLineas(prev => prev.map((p, idx) => idx === i ? { ...p, precio: e.target.value } : p))}
                          placeholder="Precio"
                          className="w-full pl-5 pr-2 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      {porcionesLineas.length > 1 && (
                        <button onClick={() => removePorcion(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {costoTotal > 0 && (
                      <div className="flex gap-3 text-xs text-muted-foreground pl-1">
                        <span>Costo: {formatCurrency(costoPorcion)}</span>
                        {precioNum > 0 && (
                          <span className={margen >= 200 ? "text-success" : margen >= 100 ? "text-warning" : "text-destructive"}>
                            Margen: {Math.round(margen)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {costoTotal > 0 && (
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Costo total receta</span>
                <span className="font-medium text-foreground">{formatCurrency(costoTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Costo por unidad ({upr} uds)</span>
                <span className="font-medium text-foreground">{formatCurrency(costoPerUnit)}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando}>
            {guardando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            {productoEditar ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductoDialog;
