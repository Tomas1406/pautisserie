import { useState } from "react";
import { ingredientesBase, formatCurrency, type Ingrediente } from "@/data/productos";
import { Search } from "lucide-react";

const Ingredientes = () => {
  const [busqueda, setBusqueda] = useState("");
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(ingredientesBase);

  const filtrados = ingredientes.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handlePrecioChange = (id: string, nuevoPrecio: number) => {
    setIngredientes(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, precio: nuevoPrecio, precioUnitario: nuevoPrecio / i.cantidad }
          : i
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar ingrediente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card text-foreground text-sm font-body border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
          <span>Ingrediente</span>
          <span className="text-right">Precio</span>
          <span className="text-right">Cant.</span>
          <span className="text-right">$/u</span>
        </div>
        <div className="divide-y divide-border">
          {filtrados.map(ing => (
            <div key={ing.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-3 items-center">
              <span className="text-sm text-foreground">{ing.nombre}</span>
              <input
                type="number"
                value={ing.precio}
                onChange={(e) => handlePrecioChange(ing.id, Number(e.target.value))}
                className="w-20 text-right text-sm bg-transparent text-foreground font-medium focus:outline-none focus:bg-secondary rounded px-1"
              />
              <span className="text-sm text-muted-foreground text-right w-12">{ing.cantidad} {ing.unidad}</span>
              <span className="text-sm text-foreground font-medium text-right w-16">{formatCurrency(ing.precioUnitario)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Ingredientes;
