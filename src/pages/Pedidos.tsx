import { useState } from "react";
import { formatCurrency, type Pedido, type Orden } from "@/data/productos";
import { useIngredientes } from "@/context/IngredientesContext";
import { Plus, ChevronDown, ChevronUp, Trash2, Pencil, Loader2, CalendarDays, Check, User, Copy, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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

interface OrdenLineaProducto {
  productoId: string;
  porcionIdx: string;
  cantidad: string;
}

interface OrdenLinea {
  id: string;
  cliente: string;
  pagoEstado: string;
  productos: OrdenLineaProducto[];
}

const Pedidos = () => {
  const { pedidos, productos, loading, agregarPedido, actualizarPedido, eliminarPedido, cambiarEstadoOrden, cambiarPagoOrden } = useIngredientes();
  const [expandido, setExpandido] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPedido, setEditPedido] = useState<Pedido | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [notas, setNotas] = useState("");
  const [ordenesLineas, setOrdenesLineas] = useState<OrdenLinea[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const nuevaOrdenLinea = (): OrdenLinea => ({
    id: crypto.randomUUID(),
    cliente: "",
    pagoEstado: "no_pagado",
    productos: [{ productoId: "", porcionIdx: "0", cantidad: "1" }],
  });

  // Filter pedidos: check if any orden matches the filter
  const pedidosFiltrados = filtroEstado === "todos"
    ? pedidos
    : pedidos.filter(p => p.ordenes.some(o => o.estado === filtroEstado));

  const abrirCrear = () => {
    setEditPedido(null);
    setFechaEntrega("");
    setNotas("");
    setOrdenesLineas([nuevaOrdenLinea()]);
    setDialogOpen(true);
  };

  const abrirEditar = (pedido: Pedido) => {
    setEditPedido(pedido);
    setFechaEntrega(pedido.fechaEntrega);
    setNotas(pedido.notas);
    setOrdenesLineas(pedido.ordenes.map(o => ({
      id: o.id,
      cliente: o.cliente,
      pagoEstado: o.pagoEstado,
      productos: o.productos.map(p => ({
        productoId: p.productoId,
        porcionIdx: p.porcionIdx.toString(),
        cantidad: p.cantidad.toString(),
      })),
    })));
    setDialogOpen(true);
  };

  const addOrden = () => setOrdenesLineas(prev => [...prev, nuevaOrdenLinea()]);
  const removeOrden = (i: number) => setOrdenesLineas(prev => prev.filter((_, idx) => idx !== i));

  const updateOrdenField = (i: number, field: string, value: string) => {
    setOrdenesLineas(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: value } : o));
  };

  const addProductoToOrden = (ordenIdx: number) => {
    setOrdenesLineas(prev => prev.map((o, idx) =>
      idx === ordenIdx ? { ...o, productos: [...o.productos, { productoId: "", porcionIdx: "0", cantidad: "1" }] } : o
    ));
  };

  const removeProductoFromOrden = (ordenIdx: number, prodIdx: number) => {
    setOrdenesLineas(prev => prev.map((o, idx) =>
      idx === ordenIdx ? { ...o, productos: o.productos.filter((_, pi) => pi !== prodIdx) } : o
    ));
  };

  const updateProductoInOrden = (ordenIdx: number, prodIdx: number, field: string, value: string) => {
    setOrdenesLineas(prev => prev.map((o, oi) =>
      oi === ordenIdx ? {
        ...o,
        productos: o.productos.map((p, pi) => pi === prodIdx ? { ...p, [field]: value, ...(field === "productoId" ? { porcionIdx: "0" } : {}) } : p),
      } : o
    ));
  };

  const guardar = async () => {
    if (!fechaEntrega) { toast.error("Seleccioná una fecha de entrega"); return; }

    const ordenesValidas = ordenesLineas.filter(o => o.cliente.trim()).map(o => ({
      id: o.id,
      cliente: o.cliente.trim(),
      pagoEstado: o.pagoEstado,
      productos: o.productos
        .filter(p => p.productoId && parseInt(p.cantidad) > 0)
        .map(p => ({ productoId: p.productoId, porcionIdx: parseInt(p.porcionIdx), cantidad: parseInt(p.cantidad) })),
    }));

    if (ordenesValidas.length === 0) { toast.error("Agregá al menos una orden con cliente"); return; }
    if (ordenesValidas.some(o => o.productos.length === 0)) { toast.error("Cada orden debe tener al menos un producto"); return; }

    setGuardando(true);
    try {
      if (editPedido) {
        await actualizarPedido(editPedido.id, { fechaEntrega, ordenes: ordenesValidas, notas });
        toast.success("Pedido actualizado");
      } else {
        await agregarPedido({ fechaEntrega, ordenes: ordenesValidas, notas });
        toast.success("Pedido creado");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const [deleteDialogPedido, setDeleteDialogPedido] = useState<Pedido | null>(null);

  const confirmarEliminar = async () => {
    if (!deleteDialogPedido) return;
    await eliminarPedido(deleteDialogPedido.id);
    toast.success("Pedido eliminado");
    setDeleteDialogPedido(null);
  };

  const copiarIngredientes = (pedido: Pedido) => {
    if (pedido.ingredientesNecesarios.length === 0) {
      toast.error("No hay ingredientes para copiar");
      return;
    }
    const texto = pedido.ingredientesNecesarios
      .map(ing => `• ${ing.nombre}: ${Math.round(ing.cantidad * 10) / 10} ${ing.unidad}`)
      .join("\n");
    navigator.clipboard.writeText(`Lista de ingredientes (${new Date(pedido.fechaEntrega + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}):\n${texto}`);
    toast.success("Lista copiada al portapapeles");
  };

  const getEstadoInfo = (estado: string) => ESTADOS.find(e => e.value === estado) || ESTADOS[0];
  const getPagoInfo = (pago: string) => PAGO_ESTADOS.find(e => e.value === pago) || PAGO_ESTADOS[0];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  // Calculate preview totals
  const previewTotals = ordenesLineas.reduce((acc, o) => {
    o.productos.forEach(p => {
      const prod = productos.find(pr => pr.id === p.productoId);
      if (!prod) return;
      const porcion = prod.porciones[parseInt(p.porcionIdx)] || prod.porciones[0];
      if (!porcion) return;
      const qty = parseInt(p.cantidad) || 0;
      acc.costo += porcion.costo * qty;
      acc.ingreso += porcion.precio * qty;
    });
    return acc;
  }, { costo: 0, ingreso: 0 });

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

      {/* Pedido list */}
      <div className="space-y-3">
        {pedidosFiltrados.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No hay pedidos</div>
        )}
        {pedidosFiltrados.map(pedido => {
          const isExpanded = expandido === pedido.id;
          return (
            <div key={pedido.id} className="bg-card rounded-xl overflow-hidden">
              <button onClick={() => setExpandido(isExpanded ? null : pedido.id)} className="w-full p-4 flex items-center gap-3 text-left">
                <div className="flex-shrink-0"><CalendarDays className="w-5 h-5 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base font-semibold text-foreground">
                    {new Date(pedido.fechaEntrega + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    {pedido.ordenes.length} {pedido.ordenes.length === 1 ? "orden" : "órdenes"} · {formatCurrency(pedido.ingresoTotal)}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-success">{formatCurrency(pedido.ganancia)}</p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Órdenes */}
                  {pedido.ordenes.map((orden) => {
                    const estadoInfo = getEstadoInfo(orden.estado);
                    const pagoInfo = getPagoInfo(orden.pagoEstado);
                    return (
                      <div key={orden.id} className="bg-secondary/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">{orden.cliente}</span>
                          </div>
                          <div className="flex gap-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoInfo.color}`}>{estadoInfo.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pagoInfo.color}`}>{pagoInfo.label}</span>
                          </div>
                        </div>

                        {/* Estado toggles */}
                        <div className="flex gap-1 flex-wrap">
                          {ESTADOS.map(e => (
                            <button key={e.value} onClick={() => cambiarEstadoOrden(pedido.id, orden.id, e.value)}
                              className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
                                orden.estado === e.value ? e.color + " ring-1 ring-current" : "bg-background text-muted-foreground"
                              }`}>
                              {e.label}
                            </button>
                          ))}
                          <span className="mx-1" />
                          {PAGO_ESTADOS.map(e => (
                            <button key={e.value} onClick={() => cambiarPagoOrden(pedido.id, orden.id, e.value)}
                              className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
                                orden.pagoEstado === e.value ? e.color + " ring-1 ring-current" : "bg-background text-muted-foreground"
                              }`}>
                              {e.label}
                            </button>
                          ))}
                        </div>

                        {/* Products */}
                        {orden.productos.map((pp, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-foreground">{pp.nombre} <span className="text-muted-foreground">×{pp.cantidad} {pp.porcionNombre}</span></span>
                            <span className="text-foreground font-medium">{formatCurrency(pp.precioUnitario * pp.cantidad)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs pt-1 border-t border-border">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium text-foreground">{formatCurrency(orden.ingresoTotal)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Financials */}
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costo total</span>
                      <span className="font-medium text-foreground">{formatCurrency(pedido.costoTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ingreso total</span>
                      <span className="font-medium text-foreground">{formatCurrency(pedido.ingresoTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-border">
                      <span className="text-muted-foreground font-semibold">Ganancia</span>
                      <span className="font-semibold text-success">{formatCurrency(pedido.ganancia)}</span>
                    </div>
                  </div>

                  {/* Ingredients */}
                  {pedido.ingredientesNecesarios.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingredientes necesarios</p>
                        <button onClick={() => copiarIngredientes(pedido)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                          <Copy className="w-3 h-3" /> Copiar lista
                        </button>
                      </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Fecha de entrega</label>
                <input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Notas</label>
                <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional..."
                  className="w-full px-3 py-2 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>

            {/* Órdenes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Órdenes de clientes</label>
                <Button size="sm" variant="ghost" onClick={addOrden} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Nueva orden
                </Button>
              </div>

              <div className="space-y-3">
                {ordenesLineas.map((orden, oi) => (
                  <div key={orden.id} className="bg-secondary/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={orden.cliente} onChange={e => updateOrdenField(oi, "cliente", e.target.value)}
                        placeholder="Nombre del cliente"
                        className="flex-1 px-2 py-1.5 rounded-lg bg-background text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <select value={orden.pagoEstado} onChange={e => updateOrdenField(oi, "pagoEstado", e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-background text-foreground text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
                        {PAGO_ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                      </select>
                      {ordenesLineas.length > 1 && (
                        <button onClick={() => removeOrden(oi)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Products for this orden */}
                    {orden.productos.map((prod, pi) => {
                      const selectedProd = productos.find(p => p.id === prod.productoId);
                      return (
                        <div key={pi} className="flex gap-1.5 items-center">
                          <select value={prod.productoId}
                            onChange={e => updateProductoInOrden(oi, pi, "productoId", e.target.value)}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-background text-foreground text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
                            <option value="">Producto...</option>
                            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                          </select>
                          {selectedProd && selectedProd.porciones.length > 0 && (
                            <select value={prod.porcionIdx}
                              onChange={e => updateProductoInOrden(oi, pi, "porcionIdx", e.target.value)}
                              className="w-24 px-1 py-1.5 rounded-lg bg-background text-foreground text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30">
                              {selectedProd.porciones.map((por, idx) => (
                                <option key={idx} value={idx}>{por.nombre}</option>
                              ))}
                            </select>
                          )}
                          <input type="number" value={prod.cantidad} min="1"
                            onChange={e => updateProductoInOrden(oi, pi, "cantidad", e.target.value)}
                            className="w-12 px-1 py-1.5 rounded-lg bg-background text-foreground text-xs border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-center" />
                          {orden.productos.length > 1 && (
                            <button onClick={() => removeProductoFromOrden(oi, pi)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <button onClick={() => addProductoToOrden(oi)}
                      className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Agregar producto
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {previewTotals.costo > 0 && (
              <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Costo estimado</span>
                  <span className="font-medium text-foreground">{formatCurrency(previewTotals.costo)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ingreso estimado</span>
                  <span className="font-medium text-foreground">{formatCurrency(previewTotals.ingreso)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-border">
                  <span className="text-muted-foreground font-semibold">Ganancia</span>
                  <span className="font-semibold text-success">{formatCurrency(previewTotals.ingreso - previewTotals.costo)}</span>
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
