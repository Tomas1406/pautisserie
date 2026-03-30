import jsPDF from "jspdf";
import { type Producto, formatCurrency } from "@/data/productos";
import logoUrl from "@/assets/logo-pautisserie.jpeg";

type RGB = [number, number, number];

export interface CatalogConfig {
  primaryColor?: RGB;
  secondaryColor?: RGB;
  coverImageB64?: string | null;
  aiDescriptions?: Map<string, { description: string; highlight: string; badge: string | null }>;
}

const DEFAULT_BRAND = {
  primary: [89, 62, 42] as RGB,
  secondary: [163, 143, 120] as RGB,
  bg: [245, 240, 233] as RGB,
  text: [50, 38, 28] as RGB,
  muted: [130, 110, 90] as RGB,
  white: [255, 255, 255] as RGB,
};

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 12;
const HALF_W = PAGE_W / 2;
const HALF_H = PAGE_H / 2;

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generarCatalogoPDF(productos: Producto[], config?: CatalogConfig) {
  const BRAND = {
    ...DEFAULT_BRAND,
    primary: config?.primaryColor || DEFAULT_BRAND.primary,
    secondary: config?.secondaryColor || DEFAULT_BRAND.secondary,
  };
  const aiMap = config?.aiDescriptions || new Map();

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Preload images
  const imageCache = new Map<string, string>();
  const logoB64 = await loadImageAsBase64(logoUrl);
  for (const prod of productos) {
    if (prod.imagenUrl) {
      const b64 = await loadImageAsBase64(prod.imagenUrl);
      if (b64) imageCache.set(prod.id, b64);
    }
  }

  // ─── Cover Page ───
  if (config?.coverImageB64) {
    try {
      doc.addImage(config.coverImageB64, "JPEG", 0, 0, PAGE_W, PAGE_H);
      // Dark overlay
      doc.setFillColor(0, 0, 0);
      doc.setGState(new (doc as any).GState({ opacity: 0.55 }));
      doc.rect(0, 0, PAGE_W, PAGE_H, "F");
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
    } catch {
      drawBg(doc, BRAND.bg);
    }
  } else {
    drawBg(doc, BRAND.bg);
    // Decorative bars
    doc.setFillColor(...BRAND.primary);
    doc.rect(0, 0, PAGE_W, 6, "F");
    doc.rect(0, PAGE_H - 6, PAGE_W, 6, "F");
  }

  // Logo on cover
  if (logoB64) {
    const logoW = 80;
    const logoH = 80;
    doc.addImage(logoB64, "JPEG", PAGE_W / 2 - logoW / 2, 25, logoW, logoH);
  }

  // Title
  const titleColor: RGB = config?.coverImageB64 ? [255, 255, 255] : BRAND.primary;
  const subtitleColor: RGB = config?.coverImageB64 ? [220, 220, 220] : BRAND.muted;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...subtitleColor);
  doc.text("Catálogo de Productos", PAGE_W / 2, 118, { align: "center" });

  doc.setDrawColor(...(config?.coverImageB64 ? [255, 255, 255] as RGB : BRAND.secondary));
  doc.setLineWidth(0.5);
  doc.line(PAGE_W / 2 - 25, 125, PAGE_W / 2 + 25, 125);

  const fecha = new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long" });
  doc.setFontSize(11);
  doc.setTextColor(...subtitleColor);
  doc.text(fecha, PAGE_W / 2, 133, { align: "center" });

  // Product count
  doc.setFontSize(9);
  doc.text(`${productos.length} productos`, PAGE_W / 2, 142, { align: "center" });

  // ─── Product Pages (4 per page in 2x2 grid, alphabetical) ───
  const sorted = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  for (let i = 0; i < sorted.length; i += 4) {
    doc.addPage();
    drawBg(doc, BRAND.bg);
    drawFooter(doc, BRAND);

    // Top-left
    drawProductCard(doc, sorted[i], imageCache, aiMap, BRAND, MARGIN, HALF_W - 3, MARGIN, HALF_H - 8);

    // Top-right
    if (i + 1 < sorted.length) {
      drawProductCard(doc, sorted[i + 1], imageCache, aiMap, BRAND, HALF_W + 3, PAGE_W - MARGIN, MARGIN, HALF_H - 8);
    }

    // Horizontal divider
    doc.setDrawColor(...BRAND.secondary);
    doc.setLineWidth(0.2);
    doc.line(MARGIN + 5, HALF_H - 3, PAGE_W - MARGIN - 5, HALF_H - 3);

    // Vertical divider
    doc.line(HALF_W, MARGIN + 5, HALF_W, PAGE_H - 18);

    // Bottom-left
    if (i + 2 < sorted.length) {
      drawProductCard(doc, sorted[i + 2], imageCache, aiMap, BRAND, MARGIN, HALF_W - 3, HALF_H + 2, PAGE_H - 15);
    }

    // Bottom-right
    if (i + 3 < sorted.length) {
      drawProductCard(doc, sorted[i + 3], imageCache, aiMap, BRAND, HALF_W + 3, PAGE_W - MARGIN, HALF_H + 2, PAGE_H - 15);
    }
  }

  // ─── Back Cover ───
  doc.addPage();
  drawBg(doc, BRAND.bg);
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, PAGE_W, 6, "F");
  doc.rect(0, PAGE_H - 6, PAGE_W, 6, "F");

  if (logoB64) {
    const logoW = 55;
    const logoH = 55;
    doc.addImage(logoB64, "JPEG", PAGE_W / 2 - logoW / 2, PAGE_H / 2 - 38, logoW, logoH);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.muted);
  doc.text("¡Gracias por elegirnos!", PAGE_W / 2, PAGE_H / 2 + 28, { align: "center" });

  doc.setFontSize(9);
  doc.text(`Catálogo generado el ${new Date().toLocaleDateString("es-AR")}`, PAGE_W / 2, PAGE_H / 2 + 40, { align: "center" });

  doc.save("Pautisserie_Catalogo.pdf");
}

function drawProductCard(
  doc: jsPDF,
  prod: Producto,
  imageCache: Map<string, string>,
  aiMap: Map<string, { description: string; highlight: string; badge: string | null }>,
  BRAND: typeof DEFAULT_BRAND,
  xStart: number,
  xEnd: number,
  yStart: number,
  yEnd: number
) {
  const cardW = xEnd - xStart;
  const cardH = yEnd - yStart;
  const centerX = xStart + cardW / 2;
  const ai = aiMap.get(prod.id);
  let y = yStart + 3;

  // Badge
  if (ai?.badge) {
    const badgeW = doc.getTextWidth(ai.badge) + 8;
    doc.setFillColor(...BRAND.secondary);
    doc.roundedRect(centerX - badgeW / 2, y - 1, badgeW, 5, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...BRAND.white);
    doc.text(ai.badge, centerX, y + 2.8, { align: "center" });
    y += 7;
  }

  // Product image
  const imgData = imageCache.get(prod.id);
  if (imgData) {
    try {
      const imgSize = Math.min(32, cardH * 0.35);
      const imgX = centerX - imgSize / 2;
      doc.setFillColor(...BRAND.white);
      doc.roundedRect(imgX - 1.5, y - 1.5, imgSize + 3, imgSize + 3, 3, 3, "F");
      doc.addImage(imgData, "JPEG", imgX, y, imgSize, imgSize);
      y += imgSize + 4;
    } catch {
      y += 2;
    }
  }

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.primary);
  const nameLines = doc.splitTextToSize(prod.nombre, cardW - 10);
  doc.text(nameLines.slice(0, 1), centerX, y, { align: "center" });
  y += 4;

  // Highlight
  if (ai?.highlight) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.secondary);
    doc.text(ai.highlight, centerX, y, { align: "center" });
    y += 4;
  }

  // Description (AI or stored)
  const desc = ai?.description || prod.descripcion;
  if (desc) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.text);
    const maxDescW = cardW - 12;
    const lines = doc.splitTextToSize(desc, maxDescW);
    const maxLines = imgData ? 2 : 3;
    doc.text(lines.slice(0, maxLines), centerX, y, { align: "center", maxWidth: maxDescW });
    y += Math.min(lines.length, maxLines) * 3.2 + 3;
  }

  // Divider
  doc.setDrawColor(...BRAND.secondary);
  doc.setLineWidth(0.2);
  doc.line(xStart + 10, y, xEnd - 10, y);
  y += 4;

  // Prices (compact)
  const maxPrices = Math.min(prod.porciones.length, 3);
  for (let i = 0; i < maxPrices; i++) {
    const por = prod.porciones[i];
    if (y + 8 > yEnd) break;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.text);
    doc.text(por.nombre, xStart + 8, y + 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.primary);
    doc.text(formatCurrency(por.precio), xEnd - 8, y + 2, { align: "right" });

    y += 8;
  }
}

function drawBg(doc: jsPDF, color: RGB) {
  doc.setFillColor(...color);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
}

function drawFooter(doc: jsPDF, BRAND: typeof DEFAULT_BRAND) {
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, PAGE_H - 10, PAGE_W, 10, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.bg);
  doc.text("Pautisserie · Catálogo de Productos", PAGE_W / 2, PAGE_H - 3, { align: "center" });
}
