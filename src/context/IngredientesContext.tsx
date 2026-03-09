import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Ingrediente, type Producto } from "@/data/productos";

interface NuevoProducto {
  nombre: string;
  categoria: string;
  ingredientes: { ingredienteId: string; cantidad: number }[];
  unidadesPorReceta: number;
  precioVenta: number;
}

interface IngredientesContextType {
  ingredientes: Ingrediente[];
  productos: Producto[];
  loading: boolean;
  agregarIngrediente: (ing: Omit<Ingrediente, "id" | "precioUnitario">) => Promise<void>;
  actualizarIngrediente: (id: string, precio: number, cantidad: number) => Promise<void>;
  eliminarIngrediente: (id: string) => Promise<void>;
  agregarProducto: (prod: NuevoProducto) => Promise<void>;
  actualizarProducto: (id: string, prod: NuevoProducto) => Promise<void>;
  eliminarProducto: (id: string) => Promise<void>;
}

const IngredientesContext = createContext<IngredientesContextType | null>(null);

export const useIngredientes = () => {
  const ctx = useContext(IngredientesContext);
  if (!ctx) throw new Error("useIngredientes must be used within IngredientesProvider");
  return ctx;
};

export const IngredientesProvider = ({ children }: { children: ReactNode }) => {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const [ingRes, prodRes] = await Promise.all([
        supabase.from("ingredientes").select("*").order("nombre"),
        supabase.from("productos").select("*").order("nombre"),
      ]);

      if (ingRes.data) {
        setIngredientes(ingRes.data.map((r: any) => ({
          id: r.id,
          nombre: r.nombre,
          precio: Number(r.precio),
          cantidad: Number(r.cantidad),
          unidad: r.unidad,
          precioUnitario: Number(r.precio_unitario),
        })));
      }

      if (prodRes.data) {
        setProductos(prodRes.data.map((r: any) => ({
          id: r.id,
          nombre: r.nombre,
          categoria: r.categoria,
          ingredientes: r.ingredientes as any[],
          costoTotal: Number(r.costo_total),
          porciones: r.porciones as any[],
        })));
      }

      setLoading(false);
    };

    fetchData();

    // Realtime subscriptions
    const ingChannel = supabase
      .channel("ingredientes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredientes" }, () => {
        fetchData();
      })
      .subscribe();

    const prodChannel = supabase
      .channel("productos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "productos" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ingChannel);
      supabase.removeChannel(prodChannel);
    };
  }, []);

  const actualizarIngrediente = useCallback(async (id: string, precio: number, cantidad: number) => {
    const precioUnitario = cantidad > 0 ? precio / cantidad : 0;
    await supabase.from("ingredientes").update({
      precio, cantidad, precio_unitario: precioUnitario, updated_at: new Date().toISOString(),
    }).eq("id", id);

    // Recalculate affected products
    const { data: allProducts } = await supabase.from("productos").select("*");
    const { data: allIngs } = await supabase.from("ingredientes").select("*");
    if (!allProducts || !allIngs) return;

    const ingMap = new Map(allIngs.map((i: any) => [i.id, Number(i.precio_unitario)]));

    for (const prod of allProducts) {
      const ings = (prod.ingredientes as any[]);
      const hasIng = ings.some((ri: any) => ri.ingredienteId === id);
      if (!hasIng) continue;

      const updatedIngs = ings.map((ri: any) => {
        const pu = ingMap.get(ri.ingredienteId) ?? 0;
        return { ...ri, costo: pu * ri.cantidad };
      });
      const costoTotal = updatedIngs.reduce((acc: number, ri: any) => acc + ri.costo, 0);
      const oldCostoTotal = Number(prod.costo_total);
      const porciones = (prod.porciones as any[]).map((por: any) => {
        const proporcion = oldCostoTotal > 0 ? por.costo / oldCostoTotal : 1 / (prod.porciones as any[]).length;
        const nuevoCosto = costoTotal * proporcion;
        const margen = nuevoCosto > 0 ? Math.round(((por.precio - nuevoCosto) / nuevoCosto) * 100) : 0;
        return { ...por, costo: nuevoCosto, margen };
      });

      await supabase.from("productos").update({
        ingredientes: updatedIngs, costo_total: costoTotal, porciones, updated_at: new Date().toISOString(),
      }).eq("id", prod.id);
    }
  }, []);

  const agregarIngrediente = useCallback(async (ing: Omit<Ingrediente, "id" | "precioUnitario">) => {
    const id = ing.nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const precioUnitario = ing.cantidad > 0 ? ing.precio / ing.cantidad : 0;
    await supabase.from("ingredientes").insert({
      id, nombre: ing.nombre, precio: ing.precio, cantidad: ing.cantidad, unidad: ing.unidad, precio_unitario: precioUnitario,
    });
  }, []);

  const eliminarIngrediente = useCallback(async (id: string) => {
    await supabase.from("ingredientes").delete().eq("id", id);
  }, []);

  const agregarProducto = useCallback(async (data: NuevoProducto) => {
    const id = data.nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const { data: allIngs } = await supabase.from("ingredientes").select("*");
    if (!allIngs) return;

    const ingredientesReceta = data.ingredientes.map(ri => {
      const ingBase = allIngs.find((i: any) => i.id === ri.ingredienteId);
      if (!ingBase) return { ingredienteId: ri.ingredienteId, nombre: ri.ingredienteId, cantidad: ri.cantidad, unidad: "", costo: 0 };
      const costo = Number(ingBase.precio_unitario) * ri.cantidad;
      return { ingredienteId: ri.ingredienteId, nombre: ingBase.nombre, cantidad: ri.cantidad, unidad: ingBase.unidad, costo };
    });
    const costoTotal = ingredientesReceta.reduce((acc, ri) => acc + ri.costo, 0);
    const costoUnidad = data.unidadesPorReceta > 0 ? costoTotal / data.unidadesPorReceta : costoTotal;
    const margen = costoUnidad > 0 ? Math.round(((data.precioVenta - costoUnidad) / costoUnidad) * 100) : 0;

    await supabase.from("productos").insert({
      id, nombre: data.nombre, categoria: data.categoria,
      ingredientes: ingredientesReceta, costo_total: costoTotal,
      porciones: [{ nombre: "Unidad", costo: costoUnidad, precio: data.precioVenta, margen }],
    });
  }, []);

  const actualizarProducto = useCallback(async (id: string, data: NuevoProducto) => {
    const { data: allIngs } = await supabase.from("ingredientes").select("*");
    if (!allIngs) return;

    const ingredientesReceta = data.ingredientes.map(ri => {
      const ingBase = allIngs.find((i: any) => i.id === ri.ingredienteId);
      if (!ingBase) return { ingredienteId: ri.ingredienteId, nombre: ri.ingredienteId, cantidad: ri.cantidad, unidad: "", costo: 0 };
      const costo = Number(ingBase.precio_unitario) * ri.cantidad;
      return { ingredienteId: ri.ingredienteId, nombre: ingBase.nombre, cantidad: ri.cantidad, unidad: ingBase.unidad, costo };
    });
    const costoTotal = ingredientesReceta.reduce((acc, ri) => acc + ri.costo, 0);
    const costoUnidad = data.unidadesPorReceta > 0 ? costoTotal / data.unidadesPorReceta : costoTotal;
    const margen = costoUnidad > 0 ? Math.round(((data.precioVenta - costoUnidad) / costoUnidad) * 100) : 0;

    await supabase.from("productos").update({
      nombre: data.nombre, categoria: data.categoria,
      ingredientes: ingredientesReceta, costo_total: costoTotal,
      porciones: [{ nombre: "Unidad", costo: costoUnidad, precio: data.precioVenta, margen }],
      updated_at: new Date().toISOString(),
    }).eq("id", id);
  }, []);

  const eliminarProducto = useCallback(async (id: string) => {
    await supabase.from("productos").delete().eq("id", id);
  }, []);

  return (
    <IngredientesContext.Provider value={{ ingredientes, productos, loading, agregarIngrediente, actualizarIngrediente, eliminarIngrediente, agregarProducto, actualizarProducto, eliminarProducto }}>
      {children}
    </IngredientesContext.Provider>
  );
};
