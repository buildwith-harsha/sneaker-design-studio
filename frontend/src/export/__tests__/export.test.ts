import { describe, it, expect } from "vitest";
import { generateExportFilename, estimateExportStats } from "../exportManager";
import {
  createProjectJson,
  parseAndValidateProjectJson,
  PROJECT_SCHEMA_VERSION,
} from "../projectExport";
import type { DesignStateSnapshot, ExportOptions } from "../types";

describe("Export Utility Suite", () => {
  const sampleDesign: DesignStateSnapshot = {
    name: "Cyber Neon Jordan",
    model: "air-jordan",
    components: {
      upper: "#00F076",
      heel: "#090D16",
      tongue: "#FFFFFF",
      midsole: "#FFFFFF",
      outsole: "#00F076",
      laces: "#090D16",
      toe: "#FFFFFF",
      logo: "#00F076",
    },
    materials: {
      upper: "leather",
      heel: "suede",
      tongue: "mesh",
      midsole: "rubber",
      outsole: "rubber",
      laces: "knit",
      toe: "leather",
      logo: "leather",
    },
  };

  describe("Filename Generation", () => {
    it("generates a clean sanitized filename with date and format", () => {
      const fixedDate = new Date("2026-10-19T10:00:00Z");
      const filename = generateExportFilename(
        "Cyber Neon Jordan!",
        "air-jordan",
        "side",
        "png",
        fixedDate
      );

      expect(filename).toBe("cyber-neon-jordan-air-jordan-side-2026-10-19.png");
    });

    it("handles whitespace, special characters and slashes safely", () => {
      const fixedDate = new Date("2026-10-19T10:00:00Z");
      const filename = generateExportFilename(
        "Air Max // Pro 2026 $$$",
        "runner",
        "three_quarter",
        "jpg",
        fixedDate
      );

      expect(filename).toBe("air-max-pro-2026-runner-three-quarter-2026-10-19.jpg");
    });

    it("uses default fallback when design name is empty", () => {
      const fixedDate = new Date("2026-10-19T10:00:00Z");
      const filename = generateExportFilename("", "court", undefined, "glb", fixedDate);

      expect(filename).toBe("sneaker-design-court-2026-10-19.glb");
    });
  });

  describe("Option Estimation & Validation", () => {
    it("correctly calculates total files and estimates non-zero byte size", () => {
      const options: ExportOptions = {
        formats: ["png", "jpg"],
        views: ["side", "top", "front"],
        resolution: "2x",
        background: "transparent",
        customBgColor: "#ffffff",
        includeWatermark: true,
        includeShadow: true,
        includeSwatches: true,
        includeTurntable: false,
        filename: "test-drop",
      };

      const stats = estimateExportStats(options);
      // 2 formats * 3 views = 6 files
      expect(stats.totalFiles).toBe(6);
      expect(stats.estimatedBytes).toBeGreaterThan(0);
      expect(stats.dimensionsLabel).toContain("2048");
    });
  });

  describe("JSON Project Schema Round-Trip", () => {
    it("exports design to valid schema v1.0.0 and re-imports to an identical design", () => {
      // 1. Export to project schema
      const projectFile = createProjectJson(sampleDesign);

      expect(projectFile.schemaVersion).toBe(PROJECT_SCHEMA_VERSION);
      expect(projectFile.generator).toBe("Sneaker Design Studio");
      expect(projectFile.design.name).toBe("Cyber Neon Jordan");

      // 2. Serialize to JSON string
      const jsonStr = JSON.stringify(projectFile);

      // 3. Re-import and validate
      const result = parseAndValidateProjectJson(jsonStr);

      expect(result.valid).toBe(true);
      expect(result.design).toBeDefined();

      // 4. Assert identical design state
      expect(result.design?.name).toBe(sampleDesign.name);
      expect(result.design?.model).toBe(sampleDesign.model);
      expect(result.design?.components).toEqual(sampleDesign.components);
      expect(result.design?.materials).toEqual(sampleDesign.materials);
    });

    it("rejects invalid schema or corrupt payload gracefully", () => {
      const corruptJson = JSON.stringify({
        schemaVersion: "0.9.0", // Unsupported version
        design: {},
      });

      const result = parseAndValidateProjectJson(corruptJson);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Unsupported schema version");
    });

    it("rejects missing components with clear error message", () => {
      const incompleteJson = JSON.stringify({
        schemaVersion: PROJECT_SCHEMA_VERSION,
        generator: "Sneaker Design Studio",
        design: {
          name: "Test",
          model: "air-jordan",
          components: { heel: "#FF0000" }, // missing upper
          materials: { upper: "leather", heel: "leather" },
        },
      });

      const result = parseAndValidateProjectJson(incompleteJson);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Missing color for component: upper");
    });
  });
});
