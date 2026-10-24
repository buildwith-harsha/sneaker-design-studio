import JSZip from "jszip";
import type { ExportItemResult } from "./types";

/**
 * Packages multiple exported files into a single, clean ZIP archive.
 */
export async function createZipArchive(
  items: ExportItemResult[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  items.forEach((item) => {
    zip.file(item.filename, item.blob);
  });

  return zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.(Math.round(metadata.percent));
    }
  );
}
