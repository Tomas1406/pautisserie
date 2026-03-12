import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Ingrediente, type Producto, type Pedido, type Orden, getOutputUnit } from "@/data/productos";

interface NuevoProducto {
  nombre: string;
  categoria: string;
  ingredientes: { ingredienteId: string; cantidad: number }[];
  unidadesPorReceta: number;
  porciones: { unidadOutput: string; precio: number }[];
  imagenUrl?: string;
}

interface NuevaOrden {
  id?: string;
  cliente: string;
  estado?: string;
  pagoEstado: string;
  productos: { productoId: string; porcionIdx: number; cantidad: number }[];
}

interface NuevoPedido {
  fechaEntrega: string;
  ordenes: NuevaOrden[];
  notas?: string;
}

interface IngredientesContextType {
  ingredientes: Ingrediente[];
  productos: Producto[];
  pedidos: Pedido[];
  loading: boolean;
  agregarIngrediente: (ing: Omit<Ingrediente, "id" | "precioUnitario">) => Promise<void>;
  actualizarIngrediente: (id: string, precio: number, cantidad: number, unidad?: string, nombre?: string) => Promise<void>;
  eliminarIngrediente: (id: string) => Promise<void>;
  agregarProducto: (prod: NuevoProducto) => Promise<void>;
  actualizarProducto: (id: string, prod: NuevoProducto) => Promise<void>;
  eliminarProducto: (id: string) => Promise<void>;
  subirImagenProducto: (productoId: string, file: File) => Promise<string>;
  agregarPedido: (pedido: NuevoPedido) => Promise<void>;
  actualizarPedido: (id: string, pedido: NuevoPedido) => Promise<void>;
  eliminarPedido: (id: string) => Promise<void>;
  cambiarEstadoOrden: (pedidoId: string, ordenId: string, estado: string) => Promise<void>;
  cambiarPagoOrden: (pedidoId: string, ordenId: string, pagoEstado: string) => Promise<void>;
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
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [ingRes, prodRes, pedRes] = await Promise.all([
      supabase.from("ingredientes").select("*").order("nombre"),
      supabase.from("productos").select("*").order("nombre"),
      supabase.from("pedidos").select("*").order("fecha_entrega", { ascending: false }),
    ]);

    if (ingRes.data) {
      setIngredientes(ingRes.data.map((r: any) => ({
        id: r.id, nombre: r.nombre, precio: Number(r.precio),
        cantidad: Number(r.cantidad), unidad: r.unidad,
        precioUnitario: Number(r.precio_unitario),
      })));
    }

    if (prodRes.data) {
      setProductos(prodRes.data.map((r: any) => ({
        id: r.id, nombre: r.nombre, categoria: r.categoria,
        ingredientes: r.ingredientes as any[], costoTotal: Number(r.costo_total),
        unidadesPorReceta: Number(r.unidades_por_receta) || 1,
        porciones: r.porciones as any[], imagenUrl: r.imagen_url || undefined,
      })));
    }

    if (pedRes.data) {
      setPedidos(pedRes.data.map((r: any) => {
        // Backward compatibility: convert old flat structure to ordenes
        const ordenes = (r.ordenes as any[])?.length > 0
          ? (r.ordenes as any[])
          : r.cliente
            ? [{
                id: crypto.randomUUID(),
                cliente: r.cliente,
                estado: r.estado || "pendiente",
                pagoEstado: r.pago_estado || "no_pagado",
                productos: r.productos as any[],
                costoTotal: Number(r.costo_total),
                ingresoTotal: Number(r.ingreso_total),
                ganancia: Number(r.ganancia),
              }]
            : [];
        return {
          id: r.id, fechaEntrega: r.fecha_entrega,
          ordenes,
          costoTotal: Number(r.costo_total),
          ingresoTotal: Number(r.ingreso_total),
          ganancia: Number(r.ganancia),
          ingredientesNecesarios: r.ingredientes_necesarios as any[],
          notas: r.notas || "",
          createdAt: r.created_at,
        };
      }));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channels = ["ingredientes", "productos", "pedidos"].map(table =>
      supabase.channel(`${table}-changes`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => fetchData())
        .subscribe()
    );
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [fetchData]);

  // ─── Ingredientes ───

  const agregarIngrediente = useCallback(async (ing: Omit<Ingrediente, "id" | "precioUnitario">) => {
    const id = ing.nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const precioUnitario = ing.cantidad > 0 ? ing.precio / ing.cantidad : 0;
    await supabase.from("ingredientes").insert({
      id, nombre: ing.nombre, precio: ing.precio, cantidad: ing.cantidad, unidad: ing.unidad, precio_unitario: precioUnitario,
    });
  }, []);

  const actualizarIngrediente = useCallback(async (id: string, precio: number, cantidad: number, unidad?: string, nombre?: string) => {
    const precioUnitario = cantidad > 0 ? precio / cantidad : 0;
    const updateData: any = { precio, cantidad, precio_unitario: precioUnitario, updated_at: new Date().toISOString() };
    if (unidad) updateData.unidad = unidad;
    if (nombre) updateData.nombre = nombre;
    await supabase.from("ingredientes").update(updateData).eq("id", id);

    // Recalculate all products using this ingredient
    const { data: allProducts } = await supabase.from("productos").select("*");
    const { data: allIngs } = await supabase.from("ingredientes").select("*");
    if (!allProducts || !allIngs) return;

    const ingMap = new Map(allIngs.map((i: any) => [i.id, { pu: Number(i.precio_unitario), unidad: i.unidad }]));

    for (const prod of allProducts) {
      const ings = (prod.ingredientes as any[]);
      const hasIng = ings.some((ri: any) => ri.ingredienteId === id);
      if (!hasIng) continue;

      const updatedIngs = ings.map((ri: any) => {
        const info = ingMap.get(ri.ingredienteId);
        const pu = info?.pu ?? 0;
        return { ...ri, costo: pu * ri.cantidad, unidad: info?.unidad ?? ri.unidad, nombre: info?.nombre ?? ri.nombre };
      });
      const costoTotal = updatedIngs.reduce((acc: number, ri: any) => acc + ri.costo, 0);
      const unidadesPorReceta = Number(prod.unidades_por_receta) || 1;
      const costoPerUnit = unidadesPorReceta > 0 ? costoTotal / unidadesPorReceta : costoTotal;

      const porciones = (prod.porciones as any[]).map((por: any) => {
        const factor = por.factorOutput || 1;
        const costoPorcion = costoPerUnit * factor;
        const margen = costoPorcion > 0 ? Math.round(((por.precio - costoPorcion) / costoPorcion) * 100) : 0;
        return { ...por, costo: costoPorcion, margen };
      });

      await supabase.from("productos").update({
        ingredientes: updatedIngs, costo_total: costoTotal, porciones, updated_at: new Date().toISOString(),
      }).eq("id", prod.id);
    }
  }, []);

  const eliminarIngrediente = useCallback(async (id: string) => {
    await supabase.from("ingredientes").delete().eq("id", id);
  }, []);

  // ─── Productos ───

  const buildPorciones = (costoTotal: number, unidadesPorReceta: number, porcionesInput: { unidadOutput: string; precio: number }[]) => {
    const costoPerUnit = unidadesPorReceta > 0 ? costoTotal / unidadesPorReceta : costoTotal;
    return porcionesInput.map(p => {
      const ou = getOutputUnit(p.unidadOutput);
      const costoPorcion = costoPerUnit * ou.factor;
      const margen = costoPorcion > 0 ? Math.round(((p.precio - costoPorcion) / costoPorcion) * 100) : 0;
      return { nombre: ou.label, costo: costoPorcion, precio: p.precio, margen, unidadOutput: ou.value, factorOutput: ou.factor };
    });
  };

  const buildIngredientesReceta = (ingredientesInput: { ingredienteId: string; cantidad: number }[], allIngs: any[]) => {
    return ingredientesInput.map(ri => {
      const ingBase = allIngs.find((i: any) => i.id === ri.ingredienteId);
      if (!ingBase) return { ingredienteId: ri.ingredienteId, nombre: ri.ingredienteId, cantidad: ri.cantidad, unidad: "", costo: 0 };
      const costo = Number(ingBase.precio_unitario) * ri.cantidad;
      return { ingredienteId: ri.ingredienteId, nombre: ingBase.nombre, cantidad: ri.cantidad, unidad: ingBase.unidad, costo };
    });
  };

  const agregarProducto = useCallback(async (data: NuevoProducto) => {
    const id = data.nombre.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const { data: allIngs } = await supabase.from("ingredientes").select("*");
    if (!allIngs) return;

    const ingredientesReceta = buildIngredientesReceta(data.ingredientes, allIngs);
    const costoTotal = ingredientesReceta.reduce((acc, ri) => acc + ri.costo, 0);
    const porciones = buildPorciones(costoTotal, data.unidadesPorReceta, data.porciones);

    await supabase.from("productos").insert({
      id, nombre: data.nombre, categoria: data.categoria,
      ingredientes: ingredientesReceta, costo_total: costoTotal,
      unidades_por_receta: data.unidadesPorReceta,
      porciones, imagen_url: data.imagenUrl || null,
    });
  }, []);

  const actualizarProducto = useCallback(async (id: string, data: NuevoProducto) => {
    const { data: allIngs } = await supabase.from("ingredientes").select("*");
    if (!allIngs) return;
    const { data: currentProd } = await supabase.from("productos").select("*").eq("id", id).single();

    const ingredientesReceta = buildIngredientesReceta(data.ingredientes, allIngs);
    const costoTotal = ingredientesReceta.reduce((acc, ri) => acc + ri.costo, 0);
    const porciones = buildPorciones(costoTotal, data.unidadesPorReceta, data.porciones);
    const imagenUrl = data.imagenUrl !== undefined ? (data.imagenUrl || null) : (currentProd?.imagen_url || null);

    await supabase.from("productos").update({
      nombre: data.nombre, categoria: data.categoria,
      ingredientes: ingredientesReceta, costo_total: costoTotal,
      unidades_por_receta: data.unidadesPorReceta,
      porciones, imagen_url: imagenUrl, updated_at: new Date().toISOString(),
    }).eq("id", id);
  }, []);

  const eliminarProducto = useCallback(async (id: string) => {
    await supabase.from("productos").delete().eq("id", id);
  }, []);

  const subirImagenProducto = useCallback(async (productoId: string, file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${productoId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    const imagenUrl = urlData.publicUrl;
    await supabase.from("productos").update({ imagen_url: imagenUrl, updated_at: new Date().toISOString() }).eq("id", productoId);
    return imagenUrl;
  }, []);

  // ─── Pedidos ───

  const calcularPedido = useCallback(async (ordenes: NuevaOrden[]) => {
    const { data: allProds } = await supabase.from("productos").select("*");
    if (!allProds) return null;

    const prodMap = new Map(allProds.map((p: any) => [p.id, p]));
    const ingAcum = new Map<string, { nombre: string; cantidad: number; unidad: string; costo: number }>();
    let costoTotal = 0;
    let ingresoTotal = 0;

    const ordenesCalculadas = ordenes.map(orden => {
      let ordenCosto = 0;
      let ordenIngreso = 0;

      const productosDetalle = orden.productos.map(pp => {
        const prod = prodMap.get(pp.productoId);
        if (!prod) return { productoId: pp.productoId, nombre: "?", porcionIdx: 0, porcionNombre: "?", cantidad: pp.cantidad, costoUnitario: 0, precioUnitario: 0, factorOutput: 1 };

        const porciones = prod.porciones as any[];
        const porcion = porciones[pp.porcionIdx] || porciones[0];
        const costoUnitario = porcion?.costo ?? Number(prod.costo_total);
        const precioUnitario = porcion?.precio ?? 0;
        const factorOutput = porcion?.factorOutput || 1;
        const unidadesPorReceta = Number(prod.unidades_por_receta) || 1;

        ordenCosto += costoUnitario * pp.cantidad;
        ordenIngreso += precioUnitario * pp.cantidad;

        // Ingredient needs: individual units needed / recipe yield
        const unidadesIndividuales = factorOutput * pp.cantidad;
        const fraccion = unidadesIndividuales / unidadesPorReceta;

        const recetaIngs = prod.ingredientes as any[];
        recetaIngs.forEach((ri: any) => {
          const cantNecesaria = ri.cantidad * fraccion;
          const costoNecesario = ri.costo * fraccion;
          const key = ri.ingredienteId;
          const prev = ingAcum.get(key);
          if (prev) {
            ingAcum.set(key, { ...prev, cantidad: prev.cantidad + cantNecesaria, costo: prev.costo + costoNecesario });
          } else {
            ingAcum.set(key, { nombre: ri.nombre, cantidad: cantNecesaria, unidad: ri.unidad, costo: costoNecesario });
          }
        });

        return {
          productoId: pp.productoId, nombre: prod.nombre,
          porcionIdx: pp.porcionIdx, porcionNombre: porcion?.nombre || "Unidad",
          cantidad: pp.cantidad, costoUnitario, precioUnitario, factorOutput,
        };
      });

      costoTotal += ordenCosto;
      ingresoTotal += ordenIngreso;

      return {
        id: orden.id || crypto.randomUUID(),
        cliente: orden.cliente,
        estado: orden.estado || "pendiente",
        pagoEstado: orden.pagoEstado || "no_pagado",
        productos: productosDetalle,
        costoTotal: ordenCosto,
        ingresoTotal: ordenIngreso,
        ganancia: ordenIngreso - ordenCosto,
      };
    });

    const ingredientesNecesarios = Array.from(ingAcum.entries()).map(([id, v]) => ({
      ingredienteId: id, ...v,
    }));

    return { ordenes: ordenesCalculadas, costoTotal, ingresoTotal, ganancia: ingresoTotal - costoTotal, ingredientesNecesarios };
  }, []);

  const agregarPedido = useCallback(async (data: NuevoPedido) => {
    const calculo = await calcularPedido(data.ordenes);
    if (!calculo) return;

    await supabase.from("pedidos").insert({
      fecha_entrega: data.fechaEntrega,
      ordenes: calculo.ordenes,
      productos: [], // keep for backward compat
      costo_total: calculo.costoTotal,
      ingreso_total: calculo.ingresoTotal,
      ganancia: calculo.ganancia,
      ingredientes_necesarios: calculo.ingredientesNecesarios,
      notas: data.notas || "",
    });
  }, [calcularPedido]);

  const actualizarPedido = useCallback(async (id: string, data: NuevoPedido) => {
    const calculo = await calcularPedido(data.ordenes);
    if (!calculo) return;

    await supabase.from("pedidos").update({
      fecha_entrega: data.fechaEntrega,
      ordenes: calculo.ordenes,
      productos: [],
      costo_total: calculo.costoTotal,
      ingreso_total: calculo.ingresoTotal,
      ganancia: calculo.ganancia,
      ingredientes_necesarios: calculo.ingredientesNecesarios,
      notas: data.notas || "",
      updated_at: new Date().toISOString(),
    }).eq("id", id);
  }, [calcularPedido]);

  const eliminarPedido = useCallback(async (id: string) => {
    await supabase.from("pedidos").delete().eq("id", id);
  }, []);

  const cambiarEstadoOrden = useCallback(async (pedidoId: string, ordenId: string, estado: string) => {
    const { data: ped } = await supabase.from("pedidos").select("ordenes").eq("id", pedidoId).single();
    if (!ped) return;
    const ordenes = (ped.ordenes as any[]).map((o: any) => o.id === ordenId ? { ...o, estado } : o);
    await supabase.from("pedidos").update({ ordenes, updated_at: new Date().toISOString() }).eq("id", pedidoId);
  }, []);

  const cambiarPagoOrden = useCallback(async (pedidoId: string, ordenId: string, pagoEstado: string) => {
    const { data: ped } = await supabase.from("pedidos").select("ordenes").eq("id", pedidoId).single();
    if (!ped) return;
    const ordenes = (ped.ordenes as any[]).map((o: any) => o.id === ordenId ? { ...o, pagoEstado } : o);
    await supabase.from("pedidos").update({ ordenes, updated_at: new Date().toISOString() }).eq("id", pedidoId);
  }, []);

  return (
    <IngredientesContext.Provider value={{
      ingredientes, productos, pedidos, loading,
      agregarIngrediente, actualizarIngrediente, eliminarIngrediente,
      agregarProducto, actualizarProducto, eliminarProducto, subirImagenProducto,
      agregarPedido, actualizarPedido, eliminarPedido, cambiarEstadoOrden, cambiarPagoOrden,
    }}>
      {children}
    </IngredientesContext.Provider>
  );
};
