import type { DesignStateSnapshot, SneakerProjectFile } from "./types";
import { normalizeSneakerModel } from "../data/sneakerModels";
import type { SneakerComponent } from "../store/DesignSlice";
import type { SneakerMaterial } from "../data/materials";

export const PROJECT_SCHEMA_VERSION = "1.0.0";

const REQUIRED_COMPONENTS: SneakerComponent[] = [
  "upper",
  "heel",
  "tongue",
  "midsole",
  "outsole",
  "laces",
  "toe",
  "logo",
];

/**
 * Serializes design snapshot to versioned JSON project file.
 */
export function createProjectJson(design: DesignStateSnapshot): SneakerProjectFile {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    generator: "Sneaker Design Studio",
    exportedAt: new Date().toISOString(),
    design: {
      name: design.name.trim() || "Untitled Sneaker",
      model: normalizeSneakerModel(design.model),
      components: { ...design.components },
      materials: { ...design.materials },
    },
  };
}

/**
 * Validates and parses an imported JSON project file string into a clean DesignStateSnapshot.
 */
export function parseAndValidateProjectJson(jsonContent: string): {
  valid: boolean;
  design?: DesignStateSnapshot;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonContent) as Partial<SneakerProjectFile>;

    if (!data || typeof data !== "object") {
      return { valid: false, error: "Invalid JSON: Root object expected" };
    }

    if (data.schemaVersion !== PROJECT_SCHEMA_VERSION) {
      return {
        valid: false,
        error: `Unsupported schema version: ${data.schemaVersion || "undefined"}. Expected ${PROJECT_SCHEMA_VERSION}.`,
      };
    }

    if (!data.design || typeof data.design !== "object") {
      return { valid: false, error: "Missing 'design' property in project file" };
    }

    const { name, model, components, materials } = data.design;

    if (!components || typeof components !== "object") {
      return { valid: false, error: "Missing or invalid 'components' mapping" };
    }

    if (!materials || typeof materials !== "object") {
      return { valid: false, error: "Missing or invalid 'materials' mapping" };
    }

    // Verify all required components are present and valid hex colors
    for (const comp of REQUIRED_COMPONENTS) {
      if (typeof components[comp] !== "string") {
        return { valid: false, error: `Missing color for component: ${comp}` };
      }
      if (typeof materials[comp] !== "string") {
        return { valid: false, error: `Missing material for component: ${comp}` };
      }
    }

    return {
      valid: true,
      design: {
        name: typeof name === "string" && name.trim() ? name.trim() : "Imported Sneaker",
        model: normalizeSneakerModel(model || "air-jordan"),
        components: components as Record<SneakerComponent, string>,
        materials: materials as Record<SneakerComponent, SneakerMaterial>,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Malformed JSON syntax";
    return { valid: false, error: `JSON Parse Error: ${message}` };
  }
}
