import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { ingredientesBase, productosBase, type Ingrediente, type Producto } from "@/data/productos";

interface IngredientesContextType {
  ingredientes: Ingrediente[];
  productos: Producto[];
  agregarIngrediente: (ing: Omit<Ingrediente, "id" | "precioUnitario">) => void;
  actualizarIngrediente: (id: string, precio: number, cantidad: number) => void;
}

const IngredientesContext = createContext<IngredientesContextType | null>(null);

export const useIngredientes = () => {
  const ctx = useContext(IngredientesContext);
  if (!ctx) throw new Error("useIngredientes must be used within IngredientesProvider");
  return ctx;
};

function recalcularProductos(ingredientes: Ingrediente[], productosActuales: Producto[]): Producto[] {
  return productosActuales.map(producto => {
    const ingredientesActualizados = producto.ingredientes.map(ri => {
      const ingBase = ingredientes.find(i => i.id === ri.ingredienteId);
      if (!ingBase) return ri;
      const costo = ingBase.precioUnitario * ri.cantidad;
      return { ...ri, costo };
    });
    const costoTotal = ingredientesActualizados.reduce((acc, ri) => acc + ri.costo, 0);
    const porciones = producto.porciones.map(por => {
      // Mantener la misma proporción de costo que tenía originalmente
      const proporcion = producto.costoTotal > 0 ? por.costo / producto.costoTotal : 1 / producto.porciones.length;
      const nuevoCosto = costoTotal * proporcion;
      const margen = nuevoCosto > 0 ? Math.round(((por.precio - nuevoCosto) / nuevoCosto) * 100) : 0;
      return { ...por, costo: nuevoCosto, margen };
    });
    return { ...producto, ingredientes: ingredientesActualizados, costoTotal, porciones };
  });
}

export const IngredientesProvider = ({ children }: { children: ReactNode }) => {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(ingredientesBase);
  const [productos, setProductos] = useState<Producto[]>(productosBase);

  const actualizarIngrediente = useCallback((id: string, precio: number, cantidad: number) => {
    setIngredientes(prev => {
      const updated = prev.map(i =>
        i.id === id
          ? { ...i, precio, cantidad, precioUnitario: cantidad > 0 ? precio / cantidad : 0 }
          : i
      );
      setProductos(prevP => recalcularProductos(updated, prevP));
      return updated;
    });
  }, []);

  const agregarIngrediente = useCallback((ing: Omit<Ingrediente, "id" | "precioUnitario">) => {
    const id = ing.nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const nuevoIng: Ingrediente = {
      ...ing,
      id,
      precioUnitario: ing.cantidad > 0 ? ing.precio / ing.cantidad : 0,
    };
    setIngredientes(prev => [...prev, nuevoIng]);
  }, []);

  return (
    <IngredientesContext.Provider value={{ ingredientes, productos, agregarIngrediente, actualizarIngrediente }}>
      {children}
    </IngredientesContext.Provider>
  );
};
