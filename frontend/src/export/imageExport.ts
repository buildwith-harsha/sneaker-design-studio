import type { DesignStateSnapshot, ExportOptions, SneakerView } from "./types";
import { renderSneakerViewToCanvas } from "./renderer";

/**
 * Exports a rendered sneaker view as an image Blob (PNG, JPG, or WebP).
 */
export async function exportViewAsImage(
  design: DesignStateSnapshot,
  view: SneakerView,
  format: "png" | "jpg" | "webp",
  options: ExportOptions
): Promise<Blob> {
  const canvas = await renderSneakerViewToCanvas(design, {
    view,
    resolution: options.resolution,
    background: options.background,
    customBgColor: options.customBgColor,
    includeShadow: options.includeShadow,
    includeWatermark: options.includeWatermark,
    includeSwatches: options.includeSwatches,
  });

  let mimeType = "image/png";
  const quality = 0.95;

  if (format === "jpg") {
    mimeType = "image/jpeg";
    // For JPG, if transparent, composite on white canvas so background isn't black
    if (options.background === "transparent") {
      const whiteCanvas = document.createElement("canvas");
      whiteCanvas.width = canvas.width;
      whiteCanvas.height = canvas.height;
      const ctx = whiteCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvas, 0, 0);
        return new Promise<Blob>((resolve, reject) => {
          whiteCanvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Failed to encode JPG blob"))),
            mimeType,
            quality
          );
        });
      }
    }
  } else if (format === "webp") {
    mimeType = "image/webp";
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(`Failed to encode ${format.toUpperCase()} blob`))),
      mimeType,
      quality
    );
  });
}
