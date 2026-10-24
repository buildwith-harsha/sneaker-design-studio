import type {
  DesignStateSnapshot,
  ExportFormat,
  ExportItemResult,
  ExportOptions,
  ExportProgress,
  SneakerView,
} from "./types";
import { exportViewAsImage } from "./imageExport";
import { generateSneakerSvg } from "./svgExport";
import { exportDesignSheetPdf } from "./pdfExport";
import { exportDesignAsGlb } from "./glbExport";
import { exportTurntableVideo } from "./turntableExport";
import { createProjectJson } from "./projectExport";

/**
 * Sanitizes and generates standard export filenames.
 */
export function generateExportFilename(
  designName: string,
  model: string,
  view?: SneakerView,
  format?: ExportFormat,
  date: Date = new Date()
): string {
  const cleanName = (designName || "sneaker-design")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const cleanModel = (model || "custom")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

  const parts = [cleanName || "sneaker-design", cleanModel];
  if (view) parts.push(view.replace("_", "-"));
  parts.push(dateStr);

  const base = parts.join("-");
  return format ? `${base}.${format === "turntable" ? "webm" : format}` : base;
}

/**
 * Estimates total file size and dimensions based on selected options.
 */
export function estimateExportStats(options: ExportOptions): {
  estimatedBytes: number;
  totalFiles: number;
  dimensionsLabel: string;
} {
  let count = 0;
  let bytes = 0;

  const resMultipliers = {
    "1x": 1,
    "2x": 3.8,
    "4x": 14,
  };
  const baseImgBytes = 450 * 1024 * resMultipliers[options.resolution];

  options.formats.forEach((fmt) => {
    if (fmt === "png" || fmt === "jpg" || fmt === "webp") {
      count += options.views.length;
      bytes += options.views.length * baseImgBytes;
    } else if (fmt === "svg") {
      count += Math.min(2, options.views.length);
      bytes += 35 * 1024;
    } else if (fmt === "pdf") {
      count += 1;
      bytes += 1.8 * 1024 * 1024;
    } else if (fmt === "glb") {
      count += 1;
      bytes += 3.5 * 1024 * 1024;
    } else if (fmt === "turntable") {
      count += 1;
      bytes += 5.5 * 1024 * 1024;
    } else if (fmt === "json") {
      count += 1;
      bytes += 4 * 1024;
    }
  });

  const dimLabels = {
    "1x": "1024 × 1024 px",
    "2x": "2048 × 2048 px",
    "4x": "4096 × 4096 px",
  };

  return {
    estimatedBytes: bytes,
    totalFiles: Math.max(1, count),
    dimensionsLabel: dimLabels[options.resolution],
  };
}

/**
 * Central orchestrator: generates all requested formats and views.
 */
export async function executeExport(
  design: DesignStateSnapshot,
  options: ExportOptions,
  onProgress?: (progress: ExportProgress) => void,
  abortSignal?: AbortSignal
): Promise<ExportItemResult[]> {
  const results: ExportItemResult[] = [];
  const { totalFiles } = estimateExportStats(options);
  let completedCount = 0;

  const updateProgress = (step: string, format?: ExportFormat) => {
    onProgress?.({
      currentStep: step,
      currentFormat: format,
      percentage: Math.min(100, Math.round((completedCount / totalFiles) * 100)),
      totalItems: totalFiles,
      completedItems: completedCount,
      isCancelled: !!abortSignal?.aborted,
    });
  };

  // Helper check for cancellation
  const checkCancelled = () => {
    if (abortSignal?.aborted) {
      throw new Error("Export cancelled by user");
    }
  };

  try {
    for (const fmt of options.formats) {
      checkCancelled();

      if (fmt === "png" || fmt === "jpg" || fmt === "webp") {
        for (const view of options.views) {
          checkCancelled();
          updateProgress(`Rendering ${view} view as ${fmt.toUpperCase()}...`, fmt);

          const blob = await exportViewAsImage(design, view, fmt, options);
          const fname = `${generateExportFilename(
            options.filename || design.name,
            design.model,
            view
          )}.${fmt}`;

          results.push({
            filename: fname,
            blob,
            format: fmt,
            size: blob.size,
            url: URL.createObjectURL(blob),
          });

          completedCount++;
          updateProgress(`Generated ${fname}`, fmt);
        }
      } else if (fmt === "svg") {
        // SVG Vector views
        for (const view of options.views.slice(0, 2)) {
          checkCancelled();
          updateProgress(`Generating ${view} vector SVG...`, fmt);

          const svgString = generateSneakerSvg(design, view);
          const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
          const fname = `${generateExportFilename(
            options.filename || design.name,
            design.model,
            view
          )}.svg`;

          results.push({
            filename: fname,
            blob,
            format: fmt,
            size: blob.size,
            url: URL.createObjectURL(blob),
          });

          completedCount++;
          updateProgress(`Generated ${fname}`, fmt);
        }
      } else if (fmt === "pdf") {
        // PDF Tech Pack
        checkCancelled();
        updateProgress("Generating PDF tech pack specification...", fmt);

        const pdfBlob = await exportDesignSheetPdf(design, (subPercent) => {
          onProgress?.({
            currentStep: `Rendering PDF sheets (${subPercent}%)...`,
            currentFormat: "pdf",
            percentage: Math.min(99, Math.round((completedCount / totalFiles) * 100 + subPercent * 0.2)),
            totalItems: totalFiles,
            completedItems: completedCount,
            isCancelled: !!abortSignal?.aborted,
          });
        });

        const fname = `${generateExportFilename(
          options.filename || design.name,
          design.model
        )}-tech-pack.pdf`;

        results.push({
          filename: fname,
          blob: pdfBlob,
          format: fmt,
          size: pdfBlob.size,
          url: URL.createObjectURL(pdfBlob),
        });

        completedCount++;
        updateProgress(`Generated ${fname}`, fmt);
      } else if (fmt === "glb") {
        // 3D GLB Model
        checkCancelled();
        updateProgress("Exporting 3D GLB model...", fmt);

        const glbBlob = await exportDesignAsGlb(design);
        const fname = `${generateExportFilename(
          options.filename || design.name,
          design.model
        )}.glb`;

        results.push({
          filename: fname,
          blob: glbBlob,
          format: fmt,
          size: glbBlob.size,
          url: URL.createObjectURL(glbBlob),
        });

        completedCount++;
        updateProgress(`Generated ${fname}`, fmt);
      } else if (fmt === "turntable") {
        // Turntable Video
        checkCancelled();
        updateProgress("Recording 360° turntable video...", fmt);

        const videoBlob = await exportTurntableVideo(
          design,
          (subPercent) => {
            onProgress?.({
              currentStep: `Recording 360° turntable (${subPercent}%)...`,
              currentFormat: "turntable",
              percentage: Math.min(99, Math.round((completedCount / totalFiles) * 100 + subPercent * 0.2)),
              totalItems: totalFiles,
              completedItems: completedCount,
              isCancelled: !!abortSignal?.aborted,
            });
          },
          abortSignal
        );

        const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";
        const fname = `${generateExportFilename(
          options.filename || design.name,
          design.model
        )}-turntable.${ext}`;

        results.push({
          filename: fname,
          blob: videoBlob,
          format: fmt,
          size: videoBlob.size,
          url: URL.createObjectURL(videoBlob),
        });

        completedCount++;
        updateProgress(`Generated ${fname}`, fmt);
      } else if (fmt === "json") {
        // Project File JSON
        checkCancelled();
        updateProgress("Serializing project file JSON...", fmt);

        const projectData = createProjectJson(design);
        const jsonString = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const fname = `${generateExportFilename(
          options.filename || design.name,
          design.model
        )}.sneaker.json`;

        results.push({
          filename: fname,
          blob,
          format: fmt,
          size: blob.size,
          url: URL.createObjectURL(blob),
        });

        completedCount++;
        updateProgress(`Generated ${fname}`, fmt);
      }
    }

    onProgress?.({
      currentStep: "Export complete!",
      percentage: 100,
      totalItems: totalFiles,
      completedItems: completedCount,
      isCancelled: false,
    });

    return results;
  } catch (error) {
    // If cancelled or failed, revoke any created URLs
    cleanupExportResults(results);
    throw error;
  }
}

/**
 * Revokes all object URLs created during export to free GPU and memory.
 */
export function cleanupExportResults(results: ExportItemResult[]): void {
  results.forEach((item) => {
    if (item.url && item.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
  });
}

/**
 * Triggers a browser download for a given Blob.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
