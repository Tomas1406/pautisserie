import { useState } from "react";
import { formatCurrency, type Producto } from "@/data/productos";
import { useIngredientes } from "@/context/IngredientesContext";
import { ChevronDown, ChevronUp, Package, DollarSign, TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductoDialog from "@/components/ProductoDialog";
import { toast } from "sonner";

const categorias = ["Todas", "Pastafrolas", "Tartas", "Tortas", "Individuales"];

const Dashboard = () => {
  const { productos, eliminarProducto } = useIngredientes();
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [productoExpandido, setProductoExpandido] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);

  const productosFiltrados = categoriaActiva === "Todas"
    ? productos
    : productos.filter(p => p.categoria === categoriaActiva);

  const costoPromedio = productosFiltrados.length > 0
    ? productosFiltrados.reduce((acc, p) => acc + p.costoTotal, 0) / productosFiltrados.length
    : 0;
  const margenPromedio = productosFiltrados.flatMap(p => p.porciones).length > 0
    ? productosFiltrados.flatMap(p => p.porciones).reduce((acc, por) => acc + por.margen, 0) / productosFiltrados.flatMap(p => p.porciones).length
    : 0;

  const abrirCrear = () => {
    setProductoEditar(null);
    setDialogOpen(true);
  };

  const abrirEditar = (producto: Producto) => {
    setProductoEditar(producto);
    setDialogOpen(true);
  };

  const confirmarEliminar = (producto: Producto) => {
    if (window.confirm(`¿Eliminar "${producto.nombre}"?`)) {
      eliminarProducto(producto.id);
      toast.success("Producto eliminado");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={<Package className="w-4 h-4" />} label="Productos" value={productosFiltrados.length.toString()} />
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="Costo Prom." value={formatCurrency(costoPromedio)} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Margen Prom." value={`${Math.round(margenPromedio)}%`} />
      </div>

      {/* Category Filter + Add */}
      <div className="flex gap-2 mb-4 items-center">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-2 rounded-full text-sm font-body whitespace-nowrap transition-all ${
                categoriaActiva === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <Button onClick={abrirCrear} size="icon" className="rounded-xl h-[38px] w-[38px] shrink-0">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Product List */}
      <div className="space-y-3">
        {productosFiltrados.map(producto => (
          <ProductoCard
            key={producto.id}
            producto={producto}
            expandido={productoExpandido === producto.id}
            onToggle={() => setProductoExpandido(productoExpandido === producto.id ? null : producto.id)}
            onEditar={() => abrirEditar(producto)}
            onEliminar={() => confirmarEliminar(producto)}
          />
        ))}
      </div>

      <ProductoDialog open={dialogOpen} onOpenChange={setDialogOpen} productoEditar={productoEditar} />
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card rounded-xl p-3 text-center">
    <div className="flex justify-center mb-1 text-muted-foreground">{icon}</div>
    <p className="text-xs text-muted-foreground font-body">{label}</p>
    <p className="text-sm font-semibold font-display text-foreground">{value}</p>
  </div>
);

const ProductoCard = ({ producto, expandido, onToggle, onEditar, onEliminar }: {
  producto: Producto; expandido: boolean; onToggle: () => void; onEditar: () => void; onEliminar: () => void;
}) => (
  <div className="bg-card rounded-xl overflow-hidden transition-all">
    <button onClick={onToggle} className="w-full p-4 flex items-center justify-between text-left">
      <div className="flex-1">
        <p className="font-display text-lg font-semibold text-foreground">{producto.nombre}</p>
        <p className="text-xs text-muted-foreground font-body">{producto.categoria}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-foreground">{formatCurrency(producto.costoTotal)}</span>
        {expandido ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>
    </button>

    {expandido && (
      <div className="px-4 pb-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ingredientes</p>
          <div className="space-y-1">
            {producto.ingredientes.map((ing, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground">{ing.nombre} <span className="text-muted-foreground">({ing.cantidad} {ing.unidad})</span></span>
                <span className="text-foreground font-medium">{formatCurrency(ing.costo)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-border">
            <span>Total</span>
            <span>{formatCurrency(producto.costoTotal)}</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Precios y Márgenes</p>
          {producto.porciones.map((por, i) => (
            <div key={i} className="flex justify-between items-center text-sm py-1">
              <span className="text-foreground">{por.nombre}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{formatCurrency(por.costo)}</span>
                <span className="text-foreground font-semibold">{formatCurrency(por.precio)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  por.margen >= 250 ? "bg-success/15 text-success" :
                  por.margen >= 200 ? "bg-warning/15 text-warning" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {por.margen}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Edit / Delete actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button size="sm" variant="outline" onClick={onEditar} className="flex-1">
            <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
          </Button>
          <Button size="sm" variant="outline" onClick={onEliminar} className="text-destructive hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )}
  </div>
);

export default Dashboard;
