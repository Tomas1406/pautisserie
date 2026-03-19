import jsPDF from "jspdf";
import { type Producto, formatCurrency } from "@/data/productos";

const BRAND = {
  primary: [89, 62, 42] as [number, number, number],     // warm brown
  secondary: [163, 143, 120] as [number, number, number], // warm tan
  bg: [245, 240, 233] as [number, number, number],        // cream
  text: [50, 38, 28] as [number, number, number],         // dark brown
  muted: [130, 110, 90] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

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
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Preload all product images
  const imageCache = new Map<string, string>();
  for (const prod of productos) {
    if (prod.imagenUrl) {
      const b64 = await loadImageAsBase64(prod.imagenUrl);
      if (b64) imageCache.set(prod.id, b64);
    }
  }

  // ─── Cover Page ───
  doc.setFillColor(...BRAND.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");

  // Decorative top band
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, PAGE_W, 8, "F");

  // Brand name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.setTextColor(...BRAND.primary);
  doc.text("Pautisserie", PAGE_W / 2, 100, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.muted);
  doc.text("Catálogo de Productos", PAGE_W / 2, 115, { align: "center" });

  // Decorative line
  doc.setDrawColor(...BRAND.secondary);
  doc.setLineWidth(0.5);
  doc.line(PAGE_W / 2 - 30, 125, PAGE_W / 2 + 30, 125);

  // Date
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.muted);
  const fecha = new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long" });
  doc.text(fecha, PAGE_W / 2, 138, { align: "center" });

  // Product count
  doc.setFontSize(10);
  doc.text(`${productos.length} productos`, PAGE_W / 2, 148, { align: "center" });

  // Bottom band
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, PAGE_H - 8, PAGE_W, 8, "F");

  // ─── Table of Contents ───
  doc.addPage();
  drawPageBg(doc);
  drawHeader(doc, "Índice");

  const categorias = [...new Set(productos.map(p => p.categoria))];
  let tocY = 55;

  doc.setFontSize(12);
  for (const cat of categorias) {
    const prodsInCat = productos.filter(p => p.categoria === cat);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.primary);
    doc.text(cat, MARGIN, tocY);
    tocY += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.text);
    for (const prod of prodsInCat) {
      if (tocY > PAGE_H - 30) {
        doc.addPage();
        drawPageBg(doc);
        drawHeader(doc, "Índice");
        tocY = 55;
      }
      const precios = prod.porciones.map(p => `${p.nombre}: ${formatCurrency(p.precio)}`).join(" · ");
      doc.text(`• ${prod.nombre}`, MARGIN + 5, tocY);
      doc.setTextColor(...BRAND.muted);
      doc.text(precios, MARGIN + 10, tocY + 5);
      doc.setTextColor(...BRAND.text);
      tocY += 13;
    }
    tocY += 4;
    doc.setFontSize(12);
  }

  // ─── Product Pages ───
  for (const cat of categorias) {
    const prodsInCat = productos.filter(p => p.categoria === cat);

    // Category separator page
    doc.addPage();
    drawPageBg(doc);
    doc.setFillColor(...BRAND.primary);
    doc.roundedRect(MARGIN, PAGE_H / 2 - 20, CONTENT_W, 40, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...BRAND.white);
    doc.text(cat, PAGE_W / 2, PAGE_H / 2 + 3, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.bg);
    doc.text(`${prodsInCat.length} producto${prodsInCat.length !== 1 ? "s" : ""}`, PAGE_W / 2, PAGE_H / 2 + 14, { align: "center" });

    for (const prod of prodsInCat) {
      doc.addPage();
      drawPageBg(doc);
      drawFooter(doc);

      let y = MARGIN + 5;

      // Product image
      const imgData = imageCache.get(prod.id);
      if (imgData) {
        try {
          const imgSize = 55;
          const imgX = PAGE_W / 2 - imgSize / 2;
          // Clip area with rounded rect background
          doc.setFillColor(...BRAND.white);
          doc.roundedRect(imgX - 2, y - 2, imgSize + 4, imgSize + 4, 4, 4, "F");
          doc.addImage(imgData, "JPEG", imgX, y, imgSize, imgSize);
          y += imgSize + 10;
        } catch {
          y += 5;
        }
      }

      // Product name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...BRAND.primary);
      doc.text(prod.nombre, PAGE_W / 2, y, { align: "center" });
      y += 6;

      // Category badge
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.muted);
      doc.text(prod.categoria, PAGE_W / 2, y, { align: "center" });
      y += 10;

      // Description
      if (prod.descripcion) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...BRAND.text);
        const lines = doc.splitTextToSize(prod.descripcion, CONTENT_W - 20);
        doc.text(lines, PAGE_W / 2, y, { align: "center", maxWidth: CONTENT_W - 20 });
        y += lines.length * 5.5 + 8;
      }

      // Decorative divider
      doc.setDrawColor(...BRAND.secondary);
      doc.setLineWidth(0.3);
      doc.line(MARGIN + 20, y, PAGE_W - MARGIN - 20, y);
      y += 10;

      // Prices section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...BRAND.primary);
      doc.text("Precios", PAGE_W / 2, y, { align: "center" });
      y += 10;

      for (const por of prod.porciones) {
        // Price card
        doc.setFillColor(...BRAND.white);
        doc.roundedRect(MARGIN + 15, y - 5, CONTENT_W - 30, 18, 3, 3, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(...BRAND.text);
        doc.text(por.nombre, MARGIN + 22, y + 4);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...BRAND.primary);
        doc.text(formatCurrency(por.precio), PAGE_W - MARGIN - 22, y + 4, { align: "right" });

        y += 22;
      }
    }
  }

  // ─── Back Cover ───
  doc.addPage();
  drawPageBg(doc);
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, PAGE_W, 8, "F");
  doc.rect(0, PAGE_H - 8, PAGE_W, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...BRAND.primary);
  doc.text("Pautisserie", PAGE_W / 2, PAGE_H / 2 - 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.muted);
  doc.text("¡Gracias por elegirnos!", PAGE_W / 2, PAGE_H / 2 + 5, { align: "center" });

  doc.setFontSize(9);
  doc.text(`Catálogo generado el ${new Date().toLocaleDateString("es-AR")}`, PAGE_W / 2, PAGE_H / 2 + 18, { align: "center" });

  // Save
  doc.save("Pautisserie_Catalogo.pdf");
}

function drawPageBg(doc: jsPDF) {
  doc.setFillColor(...BRAND.bg);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
}

function drawHeader(doc: jsPDF, title: string) {
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, PAGE_W, 40, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND.white);
  doc.text(title, PAGE_W / 2, 26, { align: "center" });
}

function drawFooter(doc: jsPDF) {
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, PAGE_H - 12, PAGE_W, 12, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.bg);
  doc.text("Pautisserie · Catálogo de Productos", PAGE_W / 2, PAGE_H - 4, { align: "center" });
}
