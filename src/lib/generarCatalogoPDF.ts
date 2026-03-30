import jsPDF from "jspdf";
import { type Producto, formatCurrency } from "@/data/productos";
import logoUrl from "@/assets/logo-pautisserie.jpeg";

const BRAND = {
  primary: [89, 62, 42] as [number, number, number],
  secondary: [163, 143, 120] as [number, number, number],
  bg: [245, 240, 233] as [number, number, number],
  text: [50, 38, 28] as [number, number, number],
  muted: [130, 110, 90] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 15;
const HALF_W = PAGE_W / 2;

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

export async function generarCatalogoPDF(productos: Producto[]) {
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
  drawPageBg(doc);
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, PAGE_W, 6, "F");
  doc.rect(0, PAGE_H - 6, PAGE_W, 6, "F");

  // Logo
  if (logoB64) {
    const logoW = 90;
    const logoH = 90;
    doc.addImage(logoB64, "JPEG", PAGE_W / 2 - logoW / 2, 30, logoW, logoH);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(48);
    doc.setTextColor(...BRAND.primary);
    doc.text("Pautisserie", PAGE_W / 2, 85, { align: "center" });
  }

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.muted);
  doc.text("Catálogo de Productos", PAGE_W / 2, 130, { align: "center" });

  doc.setDrawColor(...BRAND.secondary);
  doc.setLineWidth(0.5);
  doc.line(PAGE_W / 2 - 30, 138, PAGE_W / 2 + 30, 138);

  const fecha = new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long" });
  doc.setFontSize(11);
  doc.text(fecha, PAGE_W / 2, 148, { align: "center" });

  // ─── Product Pages (2 per page, alphabetical) ───
  const sorted = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  for (let i = 0; i < sorted.length; i += 2) {
    doc.addPage();
    drawPageBg(doc);
    drawFooter(doc);

    drawProductCard(doc, sorted[i], imageCache, MARGIN, HALF_W - 5);

    if (i + 1 < sorted.length) {
      doc.setDrawColor(...BRAND.secondary);
      doc.setLineWidth(0.3);
      doc.line(HALF_W, MARGIN + 5, HALF_W, PAGE_H - 20);

      drawProductCard(doc, sorted[i + 1], imageCache, HALF_W + 5, PAGE_W - MARGIN);
    }
  }

  // ─── Back Cover ───
  doc.addPage();
  drawPageBg(doc);
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, PAGE_W, 6, "F");
  doc.rect(0, PAGE_H - 6, PAGE_W, 6, "F");

  if (logoB64) {
    const logoW = 60;
    const logoH = 60;
    doc.addImage(logoB64, "JPEG", PAGE_W / 2 - logoW / 2, PAGE_H / 2 - 40, logoW, logoH);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.muted);
  doc.text("¡Gracias por elegirnos!", PAGE_W / 2, PAGE_H / 2 + 30, { align: "center" });

  doc.setFontSize(9);
  doc.text(`Catálogo generado el ${new Date().toLocaleDateString("es-AR")}`, PAGE_W / 2, PAGE_H / 2 + 42, { align: "center" });

  doc.save("Pautisserie_Catalogo.pdf");
}

function drawProductCard(
  doc: jsPDF,
  prod: Producto,
  imageCache: Map<string, string>,
  xStart: number,
  xEnd: number
) {
  const cardW = xEnd - xStart;
  const centerX = xStart + cardW / 2;
  let y = MARGIN + 5;

  // Product image
  const imgData = imageCache.get(prod.id);
  if (imgData) {
    try {
      const imgSize = 45;
      const imgX = centerX - imgSize / 2;
      doc.setFillColor(...BRAND.white);
      doc.roundedRect(imgX - 2, y - 2, imgSize + 4, imgSize + 4, 4, 4, "F");
      doc.addImage(imgData, "JPEG", imgX, y, imgSize, imgSize);
      y += imgSize + 8;
    } catch {
      y += 3;
    }
  }

  // Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.primary);
  doc.text(prod.nombre, centerX, y, { align: "center" });
  y += 5;

  // Category badge
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text(prod.categoria, centerX, y, { align: "center" });
  y += 7;

  // Description
  if (prod.descripcion) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.text);
    const maxDescW = cardW - 16;
    const lines = doc.splitTextToSize(prod.descripcion, maxDescW);
    const limitedLines = lines.slice(0, 4);
    doc.text(limitedLines, centerX, y, { align: "center", maxWidth: maxDescW });
    y += limitedLines.length * 4.2 + 6;
  }

  // Divider
  doc.setDrawColor(...BRAND.secondary);
  doc.setLineWidth(0.3);
  doc.line(xStart + 15, y, xEnd - 15, y);
  y += 7;

  // Prices
  for (const por of prod.porciones) {
    doc.setFillColor(...BRAND.white);
    doc.roundedRect(xStart + 10, y - 4, cardW - 20, 14, 2, 2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.text);
    doc.text(por.nombre, xStart + 16, y + 3);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.primary);
    doc.text(formatCurrency(por.precio), xEnd - 16, y + 3, { align: "right" });

    y += 17;
  }
}

function drawPageBg(doc: jsPDF) {
  doc.setFillColor(...BRAND.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
}

function drawFooter(doc: jsPDF) {
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, PAGE_H - 10, PAGE_W, 10, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.bg);
  doc.text("Pautisserie · Catálogo de Productos", PAGE_W / 2, PAGE_H - 3, { align: "center" });
}
