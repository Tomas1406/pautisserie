import { useState, useRef } from "react";
import { formatCurrency, type Producto } from "@/data/productos";
import { useIngredientes } from "@/context/IngredientesContext";
import { ChevronDown, ChevronUp, Package, DollarSign, TrendingUp, Plus, Pencil, Trash2, Loader2, ImagePlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductoDialog from "@/components/ProductoDialog";
import ImportProductoDialog from "@/components/ImportProductoDialog";
import CatalogoSettingsDialog from "@/components/CatalogoSettingsDialog";
import { toast } from "sonner";

const categorias = ["Todas", "Pastafrolas", "Tartas", "Tortas", "Individuales"];

const Dashboard = () => {
  const { productos, loading, eliminarProducto, subirImagenProducto } = useIngredientes();
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [productoExpandido, setProductoExpandido] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState<string | null>(null);
  const [catalogoDialogOpen, setCatalogoDialogOpen] = useState(false);

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

  const confirmarEliminar = async (producto: Producto) => {
    if (window.confirm(`¿Eliminar "${producto.nombre}"?`)) {
      await eliminarProducto(producto.id);
      toast.success("Producto eliminado");
    }
  };

  const handleSubirImagen = async (productoId: string, file: File) => {
    setSubiendoImagen(productoId);
    try {
      await subirImagenProducto(productoId, file);
      toast.success("Imagen actualizada");
    } catch (err: any) {
      toast.error("Error al subir imagen");
    } finally {
      setSubiendoImagen(null);
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
        <Button onClick={handleDescargarCatalogo} size="icon" variant="outline" className="rounded-xl h-[38px] w-[38px] shrink-0" title="Descargar catálogo PDF" disabled={generandoPDF}>
          {generandoPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        </Button>
        <Button onClick={() => setImportDialogOpen(true)} size="icon" variant="outline" className="rounded-xl h-[38px] w-[38px] shrink-0" title="Importar receta">
          <ImagePlus className="w-5 h-5" />
        </Button>
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
            onSubirImagen={handleSubirImagen}
            subiendoImagen={subiendoImagen === producto.id}
          />
        ))}
      </div>

      <ProductoDialog open={dialogOpen} onOpenChange={setDialogOpen} productoEditar={productoEditar} />
      <ImportProductoDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
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

const ProductoCard = ({ producto, expandido, onToggle, onEditar, onEliminar, onSubirImagen, subiendoImagen }: {
  producto: Producto; expandido: boolean; onToggle: () => void; onEditar: () => void; onEliminar: () => void;
  onSubirImagen: (id: string, file: File) => void; subiendoImagen: boolean;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-card rounded-xl overflow-hidden transition-all">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onSubirImagen(producto.id, f);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-left">
        {/* Product thumbnail */}
        <div
          className="w-12 h-12 rounded-lg bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center cursor-pointer"
          onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
        >
          {subiendoImagen ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : producto.imagenUrl ? (
            <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-display text-lg font-semibold text-foreground truncate">{producto.nombre}</p>
          <p className="text-xs text-muted-foreground font-body">{producto.categoria}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
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
              <span>Total ({producto.unidadesPorReceta} uds)</span>
              <span>{formatCurrency(producto.costoTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Costo por unidad</span>
              <span>{formatCurrency(producto.unidadesPorReceta > 0 ? producto.costoTotal / producto.unidadesPorReceta : producto.costoTotal)}</span>
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
};

export default Dashboard;
