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

export interface Porcion {
  nombre: string;
  costo: number;
  precio: number;
  margen: number;
  unidadOutput: string;
  factorOutput: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  ingredientes: RecetaIngrediente[];
  costoTotal: number;
  unidadesPorReceta: number;
  porciones: Porcion[];
  imagenUrl?: string;
}

export interface OrdenProducto {
  productoId: string;
  nombre: string;
  porcionIdx: number;
  porcionNombre: string;
  cantidad: number;
  costoUnitario: number;
  precioUnitario: number;
  factorOutput: number;
}

export interface Orden {
  id: string;
  cliente: string;
  estado: string;
  pagoEstado: string;
  productos: OrdenProducto[];
  costoTotal: number;
  ingresoTotal: number;
  ganancia: number;
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
  ordenes: Orden[];
  costoTotal: number;
  ingresoTotal: number;
  ganancia: number;
  ingredientesNecesarios: PedidoIngrediente[];
  notas: string;
  createdAt: string;
}

export const OUTPUT_UNITS = [
  { value: "1/2_unidad", label: "1/2 Unidad", factor: 0.5 },
  { value: "1_unidad", label: "1 Unidad", factor: 1 },
  { value: "1/2_docena", label: "1/2 Docena", factor: 6 },
  { value: "1_docena", label: "1 Docena", factor: 12 },
];

export const getOutputUnit = (value?: string) =>
  OUTPUT_UNITS.find(u => u.value === value) || OUTPUT_UNITS[1];


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
