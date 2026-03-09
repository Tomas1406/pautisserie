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
}

export const ingredientesBase: Ingrediente[] = [
  { id: "manteca", nombre: "Manteca", precio: 7805, cantidad: 500, unidad: "gr", precioUnitario: 15.61 },
  { id: "azucar", nombre: "Azúcar", precio: 930, cantidad: 1000, unidad: "gr", precioUnitario: 0.93 },
  { id: "huevos", nombre: "Huevos", precio: 250, cantidad: 1, unidad: "unidad", precioUnitario: 250 },
  { id: "harina", nombre: "Harina", precio: 1032.67, cantidad: 1000, unidad: "gr", precioUnitario: 1.03267 },
  { id: "membrillo", nombre: "Membrillo", precio: 2475, cantidad: 1000, unidad: "gr", precioUnitario: 2.475 },
  { id: "bolsa", nombre: "Bolsa", precio: 14.61, cantidad: 1, unidad: "unidad", precioUnitario: 14.61 },
  { id: "bandeja", nombre: "Bandeja", precio: 1300, cantidad: 1, unidad: "unidad", precioUnitario: 1300 },
  { id: "ddl", nombre: "Dulce de Leche", precio: 6005.73, cantidad: 1000, unidad: "gr", precioUnitario: 6.00573 },
  { id: "batata", nombre: "Batata", precio: 2068.32, cantidad: 1000, unidad: "gr", precioUnitario: 2.06832 },
  { id: "leche", nombre: "Leche", precio: 1250, cantidad: 1000, unidad: "ml", precioUnitario: 1.25 },
  { id: "queso_crema", nombre: "Queso Crema", precio: 3129, cantidad: 290, unidad: "gr", precioUnitario: 10.79 },
  { id: "azucar_imp", nombre: "Azúcar Impalpable", precio: 1868, cantidad: 1000, unidad: "gr", precioUnitario: 1.868 },
  { id: "azucar_rub", nombre: "Azúcar Rubia", precio: 380, cantidad: 100, unidad: "gr", precioUnitario: 3.80 },
  { id: "canela", nombre: "Canela", precio: 3000, cantidad: 100, unidad: "gr", precioUnitario: 30 },
  { id: "crema_leche", nombre: "Crema de Leche", precio: 3162, cantidad: 350, unidad: "gr", precioUnitario: 9.034 },
  { id: "levadura", nombre: "Levadura", precio: 1070, cantidad: 20, unidad: "gr", precioUnitario: 53.5 },
  { id: "bandeja_rolls", nombre: "Bandeja Rolls", precio: 440, cantidad: 3, unidad: "unidad", precioUnitario: 146.67 },
  { id: "sal", nombre: "Sal", precio: 1600, cantidad: 500, unidad: "gr", precioUnitario: 3.2 },
  { id: "polvo_hornear", nombre: "Polvo de Hornear", precio: 1800, cantidad: 50, unidad: "gr", precioUnitario: 36 },
  { id: "queso_sardo", nombre: "Queso Sardo", precio: 17960, cantidad: 1000, unidad: "gr", precioUnitario: 17.96 },
  { id: "azucar_negra", nombre: "Azúcar Negra", precio: 885.14, cantidad: 250, unidad: "gr", precioUnitario: 3.5406 },
  { id: "avena", nombre: "Avena", precio: 2359.11, cantidad: 400, unidad: "gr", precioUnitario: 5.8978 },
  { id: "cacao", nombre: "Cacao", precio: 1542.51, cantidad: 200, unidad: "gr", precioUnitario: 7.7126 },
  { id: "masitas", nombre: "Masitas Saladas", precio: 1572, cantidad: 3, unidad: "unidad", precioUnitario: 524 },
  { id: "maicena", nombre: "Maicena", precio: 1500, cantidad: 250, unidad: "gr", precioUnitario: 6 },
  { id: "crema_doble", nombre: "Crema Doble", precio: 3513.81, cantidad: 350, unidad: "unidad", precioUnitario: 10.0394 },
  { id: "frutilla", nombre: "Frutilla", precio: 5000, cantidad: 1000, unidad: "gr", precioUnitario: 5 },
  { id: "limones", nombre: "Limones", precio: 1600, cantidad: 1000, unidad: "gr", precioUnitario: 1.6 },
  { id: "lincoln", nombre: "Lincoln", precio: 2480.63, cantidad: 1, unidad: "unidad", precioUnitario: 2480.63 },
  { id: "frutos_rojos", nombre: "Frutos Rojos", precio: 9400, cantidad: 400, unidad: "gr", precioUnitario: 23.5 },
  { id: "manzana_verde", nombre: "Manzana Verde", precio: 5000, cantidad: 1000, unidad: "gr", precioUnitario: 5 },
  { id: "manzana_roja", nombre: "Manzana Roja", precio: 2500, cantidad: 1000, unidad: "gr", precioUnitario: 2.5 },
  { id: "almendra", nombre: "Almendra", precio: 4984, cantidad: 100, unidad: "gr", precioUnitario: 49.84 },
  { id: "arandanos", nombre: "Arándanos", precio: 2600, cantidad: 1, unidad: "unidad", precioUnitario: 2600 },
  { id: "coco_rallado", nombre: "Coco Rallado", precio: 3000, cantidad: 200, unidad: "gr", precioUnitario: 15 },
  { id: "nueces", nombre: "Nueces", precio: 3400, cantidad: 100, unidad: "gr", precioUnitario: 34 },
];

export const productosBase: Producto[] = [
  {
    id: "pastafrola_membrillo",
    nombre: "Pastafrola de Membrillo",
    categoria: "Pastafrolas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 200, unidad: "gr", costo: 3122 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 200, unidad: "gr", costo: 186 },
      { ingredienteId: "huevos", nombre: "Huevos", cantidad: 2, unidad: "unidad", costo: 500 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 400, unidad: "gr", costo: 413.07 },
      { ingredienteId: "membrillo", nombre: "Membrillo", cantidad: 500, unidad: "gr", costo: 1237.50 },
      { ingredienteId: "bolsa", nombre: "Bolsa", cantidad: 2, unidad: "unidad", costo: 7.30 },
      { ingredienteId: "bandeja", nombre: "Bandeja", cantidad: 2, unidad: "unidad", costo: 2600 },
    ],
    costoTotal: 8065.87,
    porciones: [
      { nombre: "Pastafrola entera", costo: 5041.17, precio: 10000, margen: 198 },
      { nombre: "Media Pastafrola", costo: 3024.70, precio: 7500, margen: 248 },
    ],
  },
  {
    id: "pastafrola_ddl",
    nombre: "Pastafrola de DDL",
    categoria: "Pastafrolas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 200, unidad: "gr", costo: 3122 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 200, unidad: "gr", costo: 186 },
      { ingredienteId: "huevos", nombre: "Huevos", cantidad: 2, unidad: "unidad", costo: 500 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 400, unidad: "gr", costo: 413.07 },
      { ingredienteId: "ddl", nombre: "Dulce de Leche", cantidad: 500, unidad: "gr", costo: 3002.86 },
      { ingredienteId: "bolsa", nombre: "Bolsa", cantidad: 2, unidad: "unidad", costo: 7.30 },
      { ingredienteId: "bandeja", nombre: "Bandeja", cantidad: 2, unidad: "unidad", costo: 2600 },
    ],
    costoTotal: 9831.24,
    porciones: [
      { nombre: "Pastafrola entera", costo: 6144.52, precio: 12000, margen: 195 },
      { nombre: "Media Pastafrola", costo: 3686.71, precio: 9000, margen: 244 },
    ],
  },
  {
    id: "pastafrola_batata",
    nombre: "Pastafrola de Batata",
    categoria: "Pastafrolas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 200, unidad: "gr", costo: 3122 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 200, unidad: "gr", costo: 186 },
      { ingredienteId: "huevos", nombre: "Huevos", cantidad: 2, unidad: "unidad", costo: 500 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 400, unidad: "gr", costo: 413.07 },
      { ingredienteId: "batata", nombre: "Batata", cantidad: 500, unidad: "gr", costo: 1034.16 },
      { ingredienteId: "bolsa", nombre: "Bolsa", cantidad: 2, unidad: "unidad", costo: 7.30 },
      { ingredienteId: "bandeja", nombre: "Bandeja", cantidad: 2, unidad: "unidad", costo: 2600 },
    ],
    costoTotal: 7862.53,
    porciones: [
      { nombre: "Pastafrola entera", costo: 4914.08, precio: 10000, margen: 203 },
      { nombre: "Media Pastafrola", costo: 2948.45, precio: 7500, margen: 254 },
    ],
  },
  {
    id: "rolls_canela",
    nombre: "Rolls de Canela",
    categoria: "Individuales",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 120, unidad: "gr", costo: 1873.20 },
      { ingredienteId: "levadura", nombre: "Levadura", cantidad: 4, unidad: "gr", costo: 214 },
      { ingredienteId: "leche", nombre: "Leche", cantidad: 180, unidad: "ml", costo: 225 },
      { ingredienteId: "huevos", nombre: "Huevo", cantidad: 1, unidad: "unidad", costo: 250 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 400, unidad: "gr", costo: 413.07 },
      { ingredienteId: "canela", nombre: "Canela", cantidad: 8, unidad: "gr", costo: 240 },
      { ingredienteId: "azucar_imp", nombre: "Azúcar Impalpable", cantidad: 80, unidad: "gr", costo: 149.44 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 50, unidad: "gr", costo: 46.50 },
      { ingredienteId: "azucar_rub", nombre: "Azúcar Rubia", cantidad: 80, unidad: "gr", costo: 304 },
      { ingredienteId: "queso_crema", nombre: "Queso Crema", cantidad: 50, unidad: "gr", costo: 539.48 },
      { ingredienteId: "crema_leche", nombre: "Crema de Leche", cantidad: 50, unidad: "gr", costo: 451.71 },
      { ingredienteId: "bandeja_rolls", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 146.67 },
    ],
    costoTotal: 4853.07,
    porciones: [
      { nombre: "Roll individual", costo: 606.63, precio: 2000, margen: 330 },
    ],
  },
  {
    id: "scon_queso",
    nombre: "Scón de Queso",
    categoria: "Individuales",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 100, unidad: "gr", costo: 1561 },
      { ingredienteId: "leche", nombre: "Leche", cantidad: 120, unidad: "ml", costo: 150 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 320, unidad: "gr", costo: 330.45 },
      { ingredienteId: "crema_leche", nombre: "Crema de Leche", cantidad: 50, unidad: "gr", costo: 451.71 },
      { ingredienteId: "polvo_hornear", nombre: "Polvo de Hornear", cantidad: 8, unidad: "gr", costo: 288 },
      { ingredienteId: "queso_sardo", nombre: "Queso Sardo", cantidad: 100, unidad: "gr", costo: 1796 },
      { ingredienteId: "sal", nombre: "Sal", cantidad: 6, unidad: "gr", costo: 19.20 },
    ],
    costoTotal: 4596.37,
    porciones: [
      { nombre: "Scón individual", costo: 383.03, precio: 1200, margen: 313 },
    ],
  },
  {
    id: "cara_sucia",
    nombre: "Cara Sucia",
    categoria: "Individuales",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 120, unidad: "gr", costo: 1873.20 },
      { ingredienteId: "levadura", nombre: "Levadura", cantidad: 4, unidad: "gr", costo: 214 },
      { ingredienteId: "leche", nombre: "Leche", cantidad: 180, unidad: "ml", costo: 225 },
      { ingredienteId: "huevos", nombre: "Huevo", cantidad: 1, unidad: "unidad", costo: 250 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 80, unidad: "gr", costo: 74.40 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 400, unidad: "gr", costo: 413.07 },
      { ingredienteId: "azucar_negra", nombre: "Azúcar Negra", cantidad: 150, unidad: "gr", costo: 531.08 },
      { ingredienteId: "bandeja_rolls", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 146.67 },
      { ingredienteId: "sal", nombre: "Sal", cantidad: 3, unidad: "gr", costo: 9.60 },
    ],
    costoTotal: 3737.02,
    porciones: [
      { nombre: "Unidad", costo: 373.70, precio: 1000, margen: 268 },
    ],
  },
  {
    id: "turron_quaker",
    nombre: "Turrón de Quaker",
    categoria: "Tortas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 150, unidad: "gr", costo: 2341.50 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 200, unidad: "gr", costo: 186 },
      { ingredienteId: "leche", nombre: "Leche", cantidad: 100, unidad: "ml", costo: 125 },
      { ingredienteId: "avena", nombre: "Avena", cantidad: 400, unidad: "gr", costo: 2359.11 },
      { ingredienteId: "cacao", nombre: "Cacao", cantidad: 200, unidad: "gr", costo: 1542.51 },
      { ingredienteId: "masitas", nombre: "Masitas", cantidad: 3, unidad: "unidad", costo: 1572 },
    ],
    costoTotal: 8126.12,
    porciones: [
      { nombre: "Torta entera", costo: 8126.12, precio: 20000, margen: 246 },
    ],
  },
  {
    id: "torta_alemana",
    nombre: "Torta Alemana",
    categoria: "Tortas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 70, unidad: "gr", costo: 1092.70 },
      { ingredienteId: "levadura", nombre: "Levadura", cantidad: 10, unidad: "gr", costo: 535 },
      { ingredienteId: "leche", nombre: "Leche", cantidad: 200, unidad: "ml", costo: 250 },
      { ingredienteId: "huevos", nombre: "Huevo", cantidad: 1, unidad: "unidad", costo: 250 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 500, unidad: "gr", costo: 516.34 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 90, unidad: "gr", costo: 83.70 },
      { ingredienteId: "maicena", nombre: "Maicena", cantidad: 30, unidad: "gr", costo: 180 },
      { ingredienteId: "crema_doble", nombre: "Crema Doble", cantidad: 400, unidad: "gr", costo: 4015.78 },
      { ingredienteId: "sal", nombre: "Sal", cantidad: 4, unidad: "gr", costo: 12.80 },
      { ingredienteId: "bandeja_rolls", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 146.67 },
    ],
    costoTotal: 7082.98,
    porciones: [
      { nombre: "Unidad", costo: 1180.50, precio: 2500, margen: 212 },
    ],
  },
  {
    id: "tarta_frutilla",
    nombre: "Tarta de Frutilla",
    categoria: "Tartas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 100, unidad: "gr", costo: 1561 },
      { ingredienteId: "polvo_hornear", nombre: "Polvo de Hornear", cantidad: 6, unidad: "gr", costo: 216 },
      { ingredienteId: "huevos", nombre: "Huevo", cantidad: 1, unidad: "unidad", costo: 250 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 100, unidad: "gr", costo: 93 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 250, unidad: "gr", costo: 258.17 },
      { ingredienteId: "ddl", nombre: "Dulce de Leche", cantidad: 400, unidad: "gr", costo: 2402.29 },
      { ingredienteId: "crema_doble", nombre: "Crema Doble", cantidad: 350, unidad: "gr", costo: 3513.81 },
      { ingredienteId: "frutilla", nombre: "Frutillas", cantidad: 500, unidad: "gr", costo: 2500 },
      { ingredienteId: "bandeja", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 146.67 },
    ],
    costoTotal: 11090.38,
    porciones: [
      { nombre: "Tarta entera", costo: 6931.49, precio: 17000, margen: 245 },
      { nombre: "Media Tarta", costo: 4158.89, precio: 12000, margen: 289 },
    ],
  },
  {
    id: "lemon_pie",
    nombre: "Lemon Pie",
    categoria: "Tartas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 100, unidad: "gr", costo: 1561 },
      { ingredienteId: "crema_leche", nombre: "Crema de Leche", cantidad: 50, unidad: "gr", costo: 451.71 },
      { ingredienteId: "huevos", nombre: "Huevos", cantidad: 5, unidad: "unidad", costo: 1250 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 520, unidad: "gr", costo: 483.60 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 180, unidad: "gr", costo: 185.88 },
      { ingredienteId: "limones", nombre: "Limón", cantidad: 340, unidad: "gr", costo: 544 },
      { ingredienteId: "maicena", nombre: "Maicena", cantidad: 70, unidad: "gr", costo: 420 },
      { ingredienteId: "leche", nombre: "Leche", cantidad: 500, unidad: "ml", costo: 625 },
      { ingredienteId: "bandeja", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 1300 },
    ],
    costoTotal: 6821.19,
    porciones: [
      { nombre: "Pastafrola entera", costo: 6821.19, precio: 17000, margen: 249 },
      { nombre: "Media", costo: 3410.60, precio: 15000, margen: 440 },
    ],
  },
  {
    id: "cheesecake",
    nombre: "Cheesecake NY",
    categoria: "Tortas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 70, unidad: "gr", costo: 1092.70 },
      { ingredienteId: "crema_leche", nombre: "Crema de Leche", cantidad: 125, unidad: "gr", costo: 1129.29 },
      { ingredienteId: "huevos", nombre: "Huevos", cantidad: 2, unidad: "unidad", costo: 500 },
      { ingredienteId: "queso_crema", nombre: "Queso Crema", cantidad: 370, unidad: "gr", costo: 3992.17 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 120, unidad: "gr", costo: 111.60 },
      { ingredienteId: "lincoln", nombre: "Lincoln", cantidad: 1, unidad: "unidad", costo: 2480.63 },
      { ingredienteId: "frutos_rojos", nombre: "Frutos Rojos", cantidad: 250, unidad: "gr", costo: 5875 },
      { ingredienteId: "bandeja_rolls", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 146.67 },
    ],
    costoTotal: 15328.05,
    porciones: [
      { nombre: "Unidad", costo: 15328.05, precio: 27000, margen: 176 },
      { nombre: "Media", costo: 5190.61, precio: 15000, margen: 289 },
    ],
  },
  {
    id: "crumble_manzana",
    nombre: "Crumble de Manzana",
    categoria: "Tartas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 200, unidad: "gr", costo: 3122 },
      { ingredienteId: "huevos", nombre: "Huevo", cantidad: 1, unidad: "unidad", costo: 250 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 350, unidad: "gr", costo: 325.50 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 420, unidad: "gr", costo: 433.72 },
      { ingredienteId: "manzana_roja", nombre: "Manzana Roja", cantidad: 500, unidad: "gr", costo: 1250 },
      { ingredienteId: "manzana_verde", nombre: "Manzana Verde", cantidad: 1000, unidad: "gr", costo: 5000 },
    ],
    costoTotal: 10381.22,
    porciones: [
      { nombre: "Tarta entera", costo: 10381.22, precio: 17000, margen: 164 },
    ],
  },
  {
    id: "sable_almendras",
    nombre: "Sablée de Almendras",
    categoria: "Tartas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 125, unidad: "gr", costo: 1951.25 },
      { ingredienteId: "almendra", nombre: "Almendra", cantidad: 100, unidad: "gr", costo: 4984 },
      { ingredienteId: "huevos", nombre: "Huevo", cantidad: 1, unidad: "unidad", costo: 250 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 100, unidad: "gr", costo: 93 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 200, unidad: "gr", costo: 206.53 },
      { ingredienteId: "ddl", nombre: "Dulce de Leche", cantidad: 800, unidad: "gr", costo: 4804.58 },
      { ingredienteId: "azucar_imp", nombre: "Azúcar Impalpable", cantidad: 80, unidad: "gr", costo: 149.44 },
      { ingredienteId: "crema_doble", nombre: "Crema Doble", cantidad: 350, unidad: "gr", costo: 3513.81 },
      { ingredienteId: "frutilla", nombre: "Frutillas", cantidad: 500, unidad: "gr", costo: 2500 },
      { ingredienteId: "arandanos", nombre: "Arándanos", cantidad: 1, unidad: "unidad", costo: 2600 },
    ],
    costoTotal: 22352.62,
    porciones: [
      { nombre: "Tarta entera", costo: 22352.62, precio: 35000, margen: 157 },
      { nombre: "Media Tarta", costo: 11176.31, precio: 25000, margen: 224 },
    ],
  },
  {
    id: "alfajor_almendras",
    nombre: "Alfajor de Almendras",
    categoria: "Individuales",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 125, unidad: "gr", costo: 1951.25 },
      { ingredienteId: "almendra", nombre: "Almendra", cantidad: 100, unidad: "gr", costo: 4984 },
      { ingredienteId: "huevos", nombre: "Huevo", cantidad: 1, unidad: "unidad", costo: 250 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 100, unidad: "gr", costo: 93 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 200, unidad: "gr", costo: 206.53 },
      { ingredienteId: "ddl", nombre: "Dulce de Leche", cantidad: 800, unidad: "gr", costo: 4804.58 },
      { ingredienteId: "azucar_imp", nombre: "Azúcar Impalpable", cantidad: 80, unidad: "gr", costo: 149.44 },
      { ingredienteId: "bandeja", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 1300 },
    ],
    costoTotal: 13738.81,
    porciones: [
      { nombre: "½ docena", costo: 4579.60, precio: 8000, margen: 175 },
    ],
  },
  {
    id: "alfajor_maicena",
    nombre: "Alfajor de Maicena",
    categoria: "Individuales",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 200, unidad: "gr", costo: 3122 },
      { ingredienteId: "maicena", nombre: "Maicena", cantidad: 300, unidad: "gr", costo: 1800 },
      { ingredienteId: "huevos", nombre: "Huevos", cantidad: 3, unidad: "unidad", costo: 750 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 150, unidad: "gr", costo: 139.50 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 200, unidad: "gr", costo: 206.53 },
      { ingredienteId: "ddl", nombre: "Dulce de Leche", cantidad: 500, unidad: "gr", costo: 3002.86 },
      { ingredienteId: "coco_rallado", nombre: "Coco Rallado", cantidad: 50, unidad: "gr", costo: 750 },
      { ingredienteId: "bandeja", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 1300 },
    ],
    costoTotal: 11070.90,
    porciones: [
      { nombre: "½ docena", costo: 3690.30, precio: 8000, margen: 217 },
    ],
  },
  {
    id: "torta_nuez",
    nombre: "Torta de Nuez",
    categoria: "Tortas",
    ingredientes: [
      { ingredienteId: "lincoln", nombre: "Lincoln", cantidad: 1, unidad: "unidad", costo: 2480.63 },
      { ingredienteId: "huevos", nombre: "Huevos", cantidad: 4, unidad: "unidad", costo: 1000 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 300, unidad: "gr", costo: 279 },
      { ingredienteId: "nueces", nombre: "Nueces", cantidad: 130, unidad: "gr", costo: 4420 },
      { ingredienteId: "crema_doble", nombre: "Crema Doble", cantidad: 350, unidad: "gr", costo: 3513.81 },
      { ingredienteId: "ddl", nombre: "Dulce de Leche", cantidad: 500, unidad: "gr", costo: 3002.86 },
      { ingredienteId: "bandeja", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 1300 },
    ],
    costoTotal: 15996.31,
    porciones: [
      { nombre: "Torta entera", costo: 15996.31, precio: 30000, margen: 188 },
    ],
  },
  {
    id: "rogel",
    nombre: "Rogel",
    categoria: "Tortas",
    ingredientes: [
      { ingredienteId: "manteca", nombre: "Manteca", cantidad: 100, unidad: "gr", costo: 1561 },
      { ingredienteId: "azucar", nombre: "Azúcar", cantidad: 300, unidad: "gr", costo: 279 },
      { ingredienteId: "huevos", nombre: "Huevos", cantidad: 3, unidad: "unidad", costo: 750 },
      { ingredienteId: "harina", nombre: "Harina", cantidad: 400, unidad: "gr", costo: 413.07 },
      { ingredienteId: "ddl", nombre: "Dulce de Leche", cantidad: 800, unidad: "gr", costo: 4804.58 },
      { ingredienteId: "bandeja", nombre: "Bandeja", cantidad: 1, unidad: "unidad", costo: 1300 },
    ],
    costoTotal: 9107.65,
    porciones: [
      { nombre: "Pastafrola entera", costo: 9107.65, precio: 25000, margen: 274 },
    ],
  },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

export function calcularCostoIngrediente(
  precioBase: number,
  cantidadBase: number,
  cantidadUsada: number
): number {
  return (precioBase / cantidadBase) * cantidadUsada;
}
