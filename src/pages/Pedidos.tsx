import { useState } from "react";
import { formatCurrency, getOutputUnit, type Pedido } from "@/data/productos";
import { useIngredientes } from "@/context/IngredientesContext";
import { Plus, ChevronDown, ChevronUp, Trash2, Pencil, Loader2, CalendarDays, Check, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const ESTADOS = [
  { value: "pendiente", label: "Pendiente", color: "bg-warning/15 text-warning" },
  { value: "en_proceso", label: "En proceso", color: "bg-primary/15 text-primary" },
  { value: "completado", label: "Completado", color: "bg-success/15 text-success" },
  { value: "cancelado", label: "Cancelado", color: "bg-destructive/15 text-destructive" },
];

const PAGO_ESTADOS = [
  { value: "no_pagado", label: "No pagado", color: "bg-destructive/15 text-destructive" },
  { value: "pagado", label: "Pagado", color: "bg-success/15 text-success" },
];

interface LineaPedido {
  productoId: string;
  cantidad: string;
}

const Pedidos = () => {
  const { pedidos, productos, loading, agregarPedido, actualizarPedido, eliminarPedido, cambiarEstadoPedido, cambiarPagoEstado } = useIngredientes();
  const [expandido, setExpandido] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPedido, setEditPedido] = useState<Pedido | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [notas, setNotas] = useState("");
  const [cliente, setCliente] = useState("");
  const [pagoEstado, setPagoEstado] = useState("no_pagado");
  const [lineas, setLineas] = useState<LineaPedido[]>([{ productoId: "", cantidad: "1" }]);
  const [guardando, setGuardando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const pedidosFiltrados = filtroEstado === "todos" ? pedidos : pedidos.filter(p => p.estado === filtroEstado);

  const abrirCrear = () => {
    setEditPedido(null);
    setFechaEntrega("");
    setNotas("");
    setCliente("");
    setPagoEstado("no_pagado");
    setLineas([{ productoId: "", cantidad: "1" }]);
    setDialogOpen(true);
  };

  const abrirEditar = (pedido: Pedido) => {
    setEditPedido(pedido);
    setFechaEntrega(pedido.fechaEntrega);
    setNotas(pedido.notas);
    setCliente(pedido.cliente || "");
    setPagoEstado(pedido.pagoEstado || "no_pagado");
    setLineas(pedido.productos.map(p => ({ productoId: p.productoId, cantidad: p.cantidad.toString() })));
    setDialogOpen(true);
  };

  const addLinea = () => setLineas(prev => [...prev, { productoId: "", cantidad: "1" }]);
  const removeLinea = (i: number) => setLineas(prev => prev.filter((_, idx) => idx !== i));

  const guardar = async () => {
    if (!cliente.trim()) { toast.error("Ingresá el nombre del cliente"); return; }
    if (!fechaEntrega) { toast.error("Seleccioná una fecha de entrega"); return; }
    const prodsValidos = lineas
      .filter(l => l.productoId && parseInt(l.cantidad) > 0)
      .map(l => ({ productoId: l.productoId, cantidad: parseInt(l.cantidad) }));
    if (prodsValidos.length === 0) { toast.error("Agregá al menos un producto"); return; }

    setGuardando(true);
    try {
      if (editPedido) {
        await actualizarPedido(editPedido.id, { fechaEntrega, productos: prodsValidos, notas, cliente, pagoEstado });
        toast.success("Pedido actualizado");
      } else {
        await agregarPedido({ fechaEntrega, productos: prodsValidos, notas, cliente, pagoEstado });
        toast.success("Pedido creado");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async (pedido: Pedido) => {
    if (window.confirm("¿Eliminar este pedido?")) {
      await eliminarPedido(pedido.id);
      toast.success("Pedido eliminado");
    }
  };

  const getEstadoInfo = (estado: string) => ESTADOS.find(e => e.value === estado) || ESTADOS[0];
  const getPagoInfo = (pago: string) => PAGO_ESTADOS.find(e => e.value === pago) || PAGO_ESTADOS[0];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  // Calculate preview costs in dialog
  const previewCosto = lineas.reduce((acc, l) => {
    const prod = productos.find(p => p.id === l.productoId);
    if (!prod) return acc;
    const costoU = prod.porciones[0]?.costo ?? prod.costoTotal;
    return acc + costoU * (parseInt(l.cantidad) || 0);
  }, 0);
  const previewIngreso = lineas.reduce((acc, l) => {
    const prod = productos.find(p => p.id === l.productoId);
    if (!prod) return acc;
    const precioU = prod.porciones[0]?.precio ?? 0;
    return acc + precioU * (parseInt(l.cantidad) || 0);
  }, 0);

  const getProductOutputLabel = (productoId: string) => {
    const prod = productos.find(p => p.id === productoId);
    if (!prod) return "";
    const porcion = prod.porciones[0];
    return porcion ? getOutputUnit(porcion.unidadOutput).label : "Unidad";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Filter + Add */}
      <div className="flex gap-2 mb-4 items-center">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
          {[{ value: "todos", label: "Todos" }, ...ESTADOS].map(e => (
            <button key={e.value} onClick={() => setFiltroEstado(e.value)}
              className={`px-4 py-2 rounded-full text-sm font-body whitespace-nowrap transition-all ${
                filtroEstado === e.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}>
              {e.label}
            </button>
          ))}
        </div>
        <Button onClick={abrirCrear} size="icon" className="rounded-xl h-[38px] w-[38px] shrink-0">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground font-body">Pedidos</p>
          <p className="text-sm font-semibold font-display text-foreground">{pedidosFiltrados.length}</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground font-body">Ingresos</p>
          <p className="text-sm font-semibold font-display text-foreground">{formatCurrency(pedidosFiltrados.reduce((a, p) => a + p.ingresoTotal, 0))}</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground font-body">Ganancia</p>
          <p className="text-sm font-semibold font-display text-success">{formatCurrency(pedidosFiltrados.reduce((a, p) => a + p.ganancia, 0))}</p>
        </div>
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {pedidosFiltrados.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No hay pedidos</div>
        )}
        {pedidosFiltrados.map(pedido => {
          const isExpanded = expandido === pedido.id;
          const estadoInfo = getEstadoInfo(pedido.estado);
          const pagoInfo = getPagoInfo(pedido.pagoEstado);
          return (
            <div key={pedido.id} className="bg-card rounded-xl overflow-hidden">
              <button onClick={() => setExpandido(isExpanded ? null : pedido.id)} className="w-full p-4 flex items-center gap-3 text-left">
                <div className="flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base font-semibold text-foreground">
                    {new Date(pedido.fechaEntrega + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                    {pedido.cliente && <><User className="w-3 h-3" /><span className="truncate max-w-[100px]">{pedido.cliente}</span><span>·</span></>}
                    <span>{pedido.productos.length} prod. · {formatCurrency(pedido.ingresoTotal)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoInfo.color}`}>{estadoInfo.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pagoInfo.color}`}>{pagoInfo.label}</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Estado buttons */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Estado</p>
                    <div className="flex gap-1 flex-wrap">
                      {ESTADOS.map(e => (
                        <button key={e.value} onClick={() => cambiarEstadoPedido(pedido.id, e.value)}
                          className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                            pedido.estado === e.value ? e.color + " ring-1 ring-current" : "bg-secondary text-muted-foreground"
                          }`}>
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pago buttons */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Pago</p>
                    <div className="flex gap-1 flex-wrap">
                      {PAGO_ESTADOS.map(e => (
                        <button key={e.value} onClick={() => cambiarPagoEstado(pedido.id, e.value)}
                          className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                            pedido.pagoEstado === e.value ? e.color + " ring-1 ring-current" : "bg-secondary text-muted-foreground"
                          }`}>
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Productos</p>
                    {pedido.productos.map((pp, i) => {
                      const outputLabel = getOutputUnit(pp.unidadOutput).label;
                      return (
                        <div key={i} className="flex justify-between text-sm py-1">
                          <span className="text-foreground">{pp.nombre} <span className="text-muted-foreground">×{pp.cantidad} {outputLabel}</span></span>
                          <span className="text-foreground font-medium">{formatCurrency(pp.precioUnitario * pp.cantidad)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Financials */}
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costo</span>
                      <span className="font-medium text-foreground">{formatCurrency(pedido.costoTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ingreso</span>
                      <span className="font-medium text-foreground">{formatCurrency(pedido.ingresoTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-border">
                      <span className="text-muted-foreground font-semibold">Ganancia</span>
                      <span className="font-semibold text-success">{formatCurrency(pedido.ganancia)}</span>
                    </div>
                  </div>

                  {/* Ingredients needed */}
                  {pedido.ingredientesNecesarios.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ingredientes necesarios</p>
                      {pedido.ingredientesNecesarios.map((ing, i) => (
                        <div key={i} className="flex justify-between text-sm py-0.5">
                          <span className="text-foreground">{ing.nombre}</span>
                          <span className="text-muted-foreground">{Math.round(ing.cantidad * 10) / 10} {ing.unidad}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {pedido.notas && (
                    <div className="text-sm text-muted-foreground italic">📝 {pedido.notas}</div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" onClick={() => abrirEditar(pedido)} className="flex-1">
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => confirmarEliminar(pedido)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPedido ? "Editar Pedido" : "Nuevo Pedido"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nombre del cliente</label>
              <input value={cliente} onChange={e => setCliente(e.target.value)}
                placeholder="Ej: María García"
                className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Fecha de entrega</label>
                <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Estado de pago</label>
                <select value={pagoEstado} onChange={e => setPagoEstado(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {PAGO_ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Productos</label>
                <Button size="sm" variant="ghost" onClick={addLinea} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Agregar
                </Button>
              </div>
              <div className="space-y-2">
                {lineas.map((linea, i) => {
                  const outputLabel = linea.productoId ? getProductOutputLabel(linea.productoId) : "";
                  return (
                    <div key={i} className="flex gap-2 items-center">
                      <select value={linea.productoId}
                        onChange={e => setLineas(prev => prev.map((l, idx) => idx === i ? { ...l, productoId: e.target.value } : l))}
                        className="flex-1 px-2 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">Seleccionar...</option>
                        {productos.map(p => {
                          const ol = getOutputUnit(p.porciones[0]?.unidadOutput).label;
                          return <option key={p.id} value={p.id}>{p.nombre} ({ol})</option>;
                        })}
                      </select>
                      <div className="relative">
                        <input type="number" value={linea.cantidad} min="1"
                          onChange={e => setLineas(prev => prev.map((l, idx) => idx === i ? { ...l, cantidad: e.target.value } : l))}
                          className="w-16 px-2 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-center" />
                      </div>
                      {outputLabel && <span className="text-xs text-muted-foreground whitespace-nowrap">{outputLabel}</span>}
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

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Notas (opcional)</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
                placeholder="Ej: Decoración especial..."
                className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>

            {previewCosto > 0 && (
              <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Costo estimado</span>
                  <span className="font-medium text-foreground">{formatCurrency(previewCosto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ingreso estimado</span>
                  <span className="font-medium text-foreground">{formatCurrency(previewIngreso)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border">
                  <span className="text-muted-foreground font-semibold">Ganancia</span>
                  <span className="font-semibold text-success">{formatCurrency(previewIngreso - previewCosto)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              {editPedido ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;
