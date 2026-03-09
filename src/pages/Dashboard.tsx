import { useState } from "react";
import { productosBase, formatCurrency, type Producto } from "@/data/productos";
import { ChevronDown, ChevronUp, Package, DollarSign, TrendingUp } from "lucide-react";

const categorias = ["Todas", "Pastafrolas", "Tartas", "Tortas", "Individuales"];

const Dashboard = () => {
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [productoExpandido, setProductoExpandido] = useState<string | null>(null);

  const productosFiltrados = categoriaActiva === "Todas"
    ? productosBase
    : productosBase.filter(p => p.categoria === categoriaActiva);

  const costoPromedio = productosFiltrados.reduce((acc, p) => acc + p.costoTotal, 0) / productosFiltrados.length;
  const productoMasCaro = productosFiltrados.reduce((a, b) => a.costoTotal > b.costoTotal ? a : b);
  const margenPromedio = productosFiltrados.flatMap(p => p.porciones).reduce((acc, por) => acc + por.margen, 0) / productosFiltrados.flatMap(p => p.porciones).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={<Package className="w-4 h-4" />} label="Productos" value={productosFiltrados.length.toString()} />
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="Costo Prom." value={formatCurrency(costoPromedio)} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Margen Prom." value={`${Math.round(margenPromedio)}%`} />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
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

      {/* Product List */}
      <div className="space-y-3">
        {productosFiltrados.map(producto => (
          <ProductoCard
            key={producto.id}
            producto={producto}
            expandido={productoExpandido === producto.id}
            onToggle={() => setProductoExpandido(productoExpandido === producto.id ? null : producto.id)}
          />
        ))}
      </div>
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

const ProductoCard = ({ producto, expandido, onToggle }: { producto: Producto; expandido: boolean; onToggle: () => void }) => (
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
        {/* Ingredientes */}
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

        {/* Porciones y precios */}
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
      </div>
    )}
  </div>
);

export default Dashboard;
