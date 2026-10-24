import { jsPDF } from "jspdf";
import type { DesignStateSnapshot } from "./types";
import { renderSneakerViewToCanvas } from "./renderer";
import { sneakerComponent as componentConfig } from "../data/sneakerComponent";
import { encodeDesignToShareUrl } from "./shareLink";

/**
 * Generates an executive sneaker design specification sheet (Tech Pack) PDF.
 * Includes hero render, multi-angle view matrix, colorway swatches with hex codes,
 * bill of materials (BOM), and direct share link.
 */
export async function exportDesignSheetPdf(
  design: DesignStateSnapshot,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  onProgress?.(10);

  // 1. Generate Hero 3/4 Render
  const heroCanvas = await renderSneakerViewToCanvas(design, {
    view: "three_quarter",
    resolution: "1x",
    background: "white",
    includeShadow: true,
  });
  const heroImgData = heroCanvas.toDataURL("image/jpeg", 0.92);
  onProgress?.(35);

  // 2. Generate Lateral Side Render
  const sideCanvas = await renderSneakerViewToCanvas(design, {
    view: "side",
    resolution: "1x",
    background: "white",
    includeShadow: false,
  });
  const sideImgData = sideCanvas.toDataURL("image/jpeg", 0.9);
  onProgress?.(55);

  // 3. Generate Top Render
  const topCanvas = await renderSneakerViewToCanvas(design, {
    view: "top",
    resolution: "1x",
    background: "white",
    includeShadow: false,
  });
  const topImgData = topCanvas.toDataURL("image/jpeg", 0.9);
  onProgress?.(70);

  // 4. Generate Sole Render
  const soleCanvas = await renderSneakerViewToCanvas(design, {
    view: "sole",
    resolution: "1x",
    background: "white",
    includeShadow: false,
  });
  const soleImgData = soleCanvas.toDataURL("image/jpeg", 0.9);
  onProgress?.(85);

  // Initialize A4 Landscape PDF (297mm x 210mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Background Paper
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Top Accent Brand Stripe
  doc.setFillColor(0, 240, 118); // Neon electric green accent
  doc.rect(0, 0, pageWidth, 5, "F");

  // Header Bar
  doc.setFillColor(9, 13, 22); // Deep ink
  doc.rect(0, 5, pageWidth, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SNEAKER DESIGN STUDIO", 15, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text("OFFICIAL SPECIFICATION & TECH PACK SHEET", 15, 24);

  // Date & Model Tag in header
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 240, 118);
  doc.text(`DATE: ${dateStr.toUpperCase()}`, pageWidth - 15, 17, { align: "right" });
  doc.setTextColor(255, 255, 255);
  doc.text(`MODEL: ${design.model.toUpperCase()}`, pageWidth - 15, 24, { align: "right" });

  // Main Card 1: Hero Render Box (Left Column)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 35, 135, 120, 4, 4, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 35, 135, 120, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(design.name.toUpperCase(), 22, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("HERO 3D STUDIO PERSPECTIVE", 22, 50);

  // Add Hero Image
  doc.addImage(heroImgData, "JPEG", 20, 52, 125, 100);

  // Multi-angle thumbnail strip below Hero
  const thumbWidth = 42;
  const thumbHeight = 35;
  const thumbY = 160;

  // Side view thumb
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, thumbY, thumbWidth, thumbHeight, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, thumbY, thumbWidth, thumbHeight, 3, 3, "S");
  doc.addImage(sideImgData, "JPEG", 16, thumbY + 4, thumbWidth - 2, thumbHeight - 8);
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("LATERAL SIDE", 15 + thumbWidth / 2, thumbY + thumbHeight - 2, { align: "center" });

  // Top view thumb
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(61, thumbY, thumbWidth, thumbHeight, 3, 3, "F");
  doc.roundedRect(61, thumbY, thumbWidth, thumbHeight, 3, 3, "S");
  doc.addImage(topImgData, "JPEG", 62, thumbY + 4, thumbWidth - 2, thumbHeight - 8);
  doc.text("AERIAL TOP", 61 + thumbWidth / 2, thumbY + thumbHeight - 2, { align: "center" });

  // Sole view thumb
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(107, thumbY, thumbWidth, thumbHeight, 3, 3, "F");
  doc.roundedRect(107, thumbY, thumbWidth, thumbHeight, 3, 3, "S");
  doc.addImage(soleImgData, "JPEG", 108, thumbY + 4, thumbWidth - 2, thumbHeight - 8);
  doc.text("OUTSOLE TREAD", 107 + thumbWidth / 2, thumbY + thumbHeight - 2, { align: "center" });

  // Right Column: Colorway Palette & Bill of Materials
  const rightX = 158;
  const rightWidth = 124;

  // Card 2: Colorway Swatches
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightX, 35, rightWidth, 58, 4, 4, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, 35, rightWidth, 58, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("COLORWAY PALETTE", rightX + 8, 45);

  const compEntries = Object.entries(design.components);
  const swatchBoxSize = 7;
  const cols = 2;
  const colWidth = 55;

  compEntries.forEach(([compKey, hex], index) => {
    const colIdx = index % cols;
    const rowIdx = Math.floor(index / cols);
    const itemX = rightX + 8 + colIdx * colWidth;
    const itemY = 51 + rowIdx * 10;

    // Convert hex to rgb
    const rgb = hexToRgb(hex);
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.roundedRect(itemX, itemY, swatchBoxSize, swatchBoxSize, 1.5, 1.5, "F");
    doc.setDrawColor(180, 180, 180);
    doc.roundedRect(itemX, itemY, swatchBoxSize, swatchBoxSize, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const label = componentConfig[compKey as keyof typeof componentConfig]?.label || compKey;
    doc.text(`${label}:`, itemX + swatchBoxSize + 3, itemY + 5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(hex.toUpperCase(), itemX + swatchBoxSize + 24, itemY + 5);
  });

  // Card 3: Bill of Materials (BOM) Table
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightX, 98, rightWidth, 70, 4, 4, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, 98, rightWidth, 70, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("BILL OF MATERIALS (BOM)", rightX + 8, 108);

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(rightX + 6, 112, rightWidth - 12, 6, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("PART COMPONENT", rightX + 10, 116.5);
  doc.text("COLOR HEX", rightX + 54, 116.5);
  doc.text("MATERIAL FINISH", rightX + 86, 116.5);

  let bomY = 123;
  Object.entries(design.materials).forEach(([compKey, mat]) => {
    const label = componentConfig[compKey as keyof typeof componentConfig]?.label || compKey;
    const hex = design.components[compKey as keyof typeof design.components] || "#FFFFFF";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(label, rightX + 10, bomY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(hex.toUpperCase(), rightX + 54, bomY);

    doc.setTextColor(15, 23, 42);
    doc.text(mat.toUpperCase(), rightX + 86, bomY);

    bomY += 5.2;
  });

  // Footer: Share Link & Verification
  const shareUrl = encodeDesignToShareUrl(design);
  doc.setFillColor(9, 13, 22);
  doc.roundedRect(rightX, 172, rightWidth, 23, 3, 3, "F");

  doc.setTextColor(0, 240, 118);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("ONLINE STUDIO DIRECT LINK", rightX + 8, 180);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  const truncatedUrl = shareUrl.length > 55 ? shareUrl.slice(0, 52) + "..." : shareUrl;
  doc.textWithLink(truncatedUrl, rightX + 8, 187, { url: shareUrl });

  onProgress?.(100);
  return doc.output("blob");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 200, g: 200, b: 200 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}
