import { useState, useRef } from "react";
import { formatCurrency } from "@/data/productos";
import { useIngredientes } from "@/context/IngredientesContext";
import { Search, Plus, Pencil, Camera, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const UNIDADES = ["gr", "ml", "unidad", "kg", "lt"];

const Ingredientes = () => {
  const { ingredientes, loading, actualizarIngrediente, agregarIngrediente } = useIngredientes();
  const [busqueda, setBusqueda] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [unidad, setUnidad] = useState("gr");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtrados = ingredientes.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirAgregar = () => {
    setEditId(null);
    setNombre("");
    setPrecio("");
    setCantidad("");
    setUnidad("gr");
    setDialogOpen(true);
  };

  const abrirEditar = (id: string) => {
    const ing = ingredientes.find(i => i.id === id);
    if (!ing) return;
    setEditId(id);
    setNombre(ing.nombre);
    setPrecio(ing.precio.toString());
    setCantidad(ing.cantidad.toString());
    setUnidad(ing.unidad);
    setDialogOpen(true);
  };

  const guardar = async () => {
    const p = parseFloat(precio);
    const c = parseFloat(cantidad);
    if (!nombre.trim() || isNaN(p) || isNaN(c) || c <= 0) {
      toast.error("Completá todos los campos correctamente");
      return;
    }
    setGuardando(true);
    try {
      if (editId) {
        await actualizarIngrediente(editId, p, c);
        toast.success("Ingrediente actualizado. Costos de productos recalculados.");
      } else {
        await agregarIngrediente({ nombre: nombre.trim(), precio: p, cantidad: c, unidad });
        toast.success("Ingrediente guardado");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCargandoIA(true);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const ingredientNames = ingredientes.map(i => i.nombre);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-price`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64, ingredientNames }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Error al procesar imagen");
      }

      const data = await resp.json();

      if (data.matched_ingredient && data.precio != null && data.cantidad != null) {
        const matched = ingredientes.find(
          i => i.nombre.toLowerCase() === data.matched_ingredient.toLowerCase()
        );
        if (matched) {
          await actualizarIngrediente(matched.id, data.precio, data.cantidad);
          toast.success(
            `"${data.detected_product}" → ${matched.nombre} actualizado: ${formatCurrency(data.precio)} por ${data.cantidad} ${data.unidad || matched.unidad}. Costos recalculados.`
          );
        } else {
          toast.error(`Producto detectado: "${data.detected_product}" pero no coincide con ningún ingrediente del listado.`);
        }
      } else {
        toast.error(
          data.detected_product
            ? `Producto detectado: "${data.detected_product}" pero no se pudo asociar a ningún ingrediente.`
            : "No se pudo identificar el producto en la imagen. Intentá con otra foto."
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar la imagen");
    } finally {
      setCargandoIA(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card text-foreground text-sm font-body border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Button onClick={handleScanClick} disabled={cargandoIA} size="icon" variant="outline" className="rounded-xl h-[46px] w-[46px] shrink-0">
          {cargandoIA ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        </Button>
        <Button onClick={abrirAgregar} size="icon" className="rounded-xl h-[46px] w-[46px] shrink-0">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {cargandoIA && (
        <div className="mb-4 flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-3 text-sm text-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Analizando imagen con IA...
        </div>
      )}

      <div className="bg-card rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-1 px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>Ingrediente</span>
          <span className="text-right">Precio</span>
          <span className="text-right">Cant.</span>
          <span className="text-right">$/u</span>
          <span className="w-8"></span>
        </div>
        <div className="divide-y divide-border">
          {filtrados.map(ing => (
            <div key={ing.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-1 px-3 py-3 items-center">
              <span className="text-sm text-foreground truncate">{ing.nombre}</span>
              <span className="text-sm text-foreground font-medium text-right w-20">{formatCurrency(ing.precio)}</span>
              <span className="text-sm text-muted-foreground text-right w-14">{ing.cantidad} {ing.unidad}</span>
              <span className="text-sm text-foreground font-medium text-right w-16">{formatCurrency(ing.precioUnitario)}</span>
              <div className="flex gap-1 w-8 justify-end">
                <button
                  onClick={() => abrirEditar(ing.id)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Ingrediente" : "Nuevo Ingrediente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editId && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nombre</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Chocolate"
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Precio ($)</label>
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Cantidad</label>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Unidad</label>
                <select
                  value={unidad}
                  onChange={(e) => setUnidad(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {UNIDADES.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            {precio && cantidad && parseFloat(cantidad) > 0 && (
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <span className="text-xs text-muted-foreground">Precio por {unidad}: </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(parseFloat(precio) / parseFloat(cantidad))}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              {editId ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ingredientes;
