export interface SneakerModelConfig {
  name: string;
  is3D: boolean;
  modelUrl: string;
}

export const sneakerModels = {
  "air-jordan": {
    name: "Air Jordan 1 (3D)",
    is3D: true,
    modelUrl: "/models/air-jordan.glb",
  },
  "runner": {
    name: "Nike Runner (3D)",
    is3D: true,
    modelUrl: "/models/runner.glb",
  },
  "court": {
    name: "Nike Court (3D)",
    is3D: true,
    modelUrl: "/models/court.glb",
  },
} as const;

export type SneakerModel = keyof typeof sneakerModels;

export const normalizeSneakerModel = (model: string): SneakerModel => {
  if (model === "runner-v1" || model === "runner") return "runner";
  if (model === "court-v1" || model === "lifestyle-v1" || model === "court")
    return "court";
  if (model === "air-jordan") return "air-jordan";
  return "air-jordan";
};
