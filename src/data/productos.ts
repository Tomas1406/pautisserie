export interface Ingrediente {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
}

export interface RecetaIngrediente {
  ingredienteId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costo: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  ingredientes: RecetaIngrediente[];
  costoTotal: number;
  porciones: { nombre: string; costo: number; precio: number; margen: number }[];
  imagenUrl?: string;
}

export interface PedidoProducto {
  productoId: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  precioUnitario: number;
}

export interface PedidoIngrediente {
  ingredienteId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costo: number;
}

export interface Pedido {
  id: string;
  fechaEntrega: string;
  estado: string;
  productos: PedidoProducto[];
  costoTotal: number;
  ingresoTotal: number;
  ganancia: number;
  ingredientesNecesarios: PedidoIngrediente[];
  notas: string;
  createdAt: string;
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const ingredientesBase: Ingrediente[] = [];
export const productosBase: Producto[] = [];
