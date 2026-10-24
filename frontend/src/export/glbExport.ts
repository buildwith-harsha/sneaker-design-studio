import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { DesignStateSnapshot } from "./types";
import { loadConfiguredModel } from "./renderer";

/**
 * Exports the customized 3D sneaker model as a standalone binary GLB file
 * with custom materials and colors baked in.
 */
export async function exportDesignAsGlb(design: DesignStateSnapshot): Promise<Blob> {
  const model = await loadConfiguredModel(design);

  const exporter = new GLTFExporter();

  return new Promise<Blob>((resolve, reject) => {
    exporter.parse(
      model,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          const blob = new Blob([gltf], { type: "model/gltf-binary" });
          resolve(blob);
        } else {
          // Fallback if returned as JSON
          const output = JSON.stringify(gltf, null, 2);
          const blob = new Blob([output], { type: "application/json" });
          resolve(blob);
        }
      },
      (error) => {
        console.error("GLTF Export Failed:", error);
        reject(error);
      },
      {
        binary: true,
        embedImages: true,
        includeCustomExtensions: true,
      }
    );
  });
}
