import type { SneakerModel } from "../data/sneakerModels";
import type { SneakerMaterial } from "../data/materials";
import type { SneakerComponent } from "../store/DesignSlice";

export type ExportFormat =
  | "png"
  | "jpg"
  | "webp"
  | "svg"
  | "pdf"
  | "glb"
  | "turntable"
  | "json";

export type SneakerView =
  | "three_quarter"
  | "side"
  | "top"
  | "front"
  | "back"
  | "sole";

export type ExportResolution = "1x" | "2x" | "4x";

export type ExportBackground = "transparent" | "white" | "brand" | "custom";

export interface ExportOptions {
  formats: ExportFormat[];
  views: SneakerView[];
  resolution: ExportResolution;
  background: ExportBackground;
  customBgColor: string;
  includeWatermark: boolean;
  includeShadow: boolean;
  includeSwatches: boolean;
  includeTurntable: boolean;
  filename: string;
}

export interface ExportItemResult {
  filename: string;
  blob: Blob;
  format: ExportFormat;
  size: number;
  url: string;
}

export interface ExportProgress {
  currentStep: string;
  currentFormat?: ExportFormat;
  percentage: number;
  totalItems: number;
  completedItems: number;
  isCancelled: boolean;
}

export interface DesignStateSnapshot {
  name: string;
  model: SneakerModel;
  components: Record<SneakerComponent, string>;
  materials: Record<SneakerComponent, SneakerMaterial>;
}

export interface SneakerProjectFile {
  schemaVersion: "1.0.0";
  generator: "Sneaker Design Studio";
  exportedAt: string;
  design: DesignStateSnapshot;
}
