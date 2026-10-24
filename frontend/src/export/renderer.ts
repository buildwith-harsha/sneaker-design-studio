import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { SneakerComponent } from "../store/DesignSlice";
import type { SneakerMaterial } from "../data/materials";
import { sneakerModels } from "../data/sneakerModels";
import type { DesignStateSnapshot, ExportBackground, ExportResolution, SneakerView } from "./types";

const MATERIAL_PRESETS: Record<
  SneakerMaterial,
  { roughness: number; metalness: number }
> = {
  leather: { roughness: 0.38, metalness: 0.08 },
  suede: { roughness: 0.92, metalness: 0.02 },
  rubber: { roughness: 0.65, metalness: 0 },
  mesh: { roughness: 0.82, metalness: 0.04 },
  knit: { roughness: 0.88, metalness: 0 },
};

const VALID_COMPONENTS: SneakerComponent[] = [
  "upper",
  "heel",
  "tongue",
  "midsole",
  "outsole",
  "laces",
  "toe",
  "logo",
];

export const RESOLUTION_MAP: Record<ExportResolution, { width: number; height: number; label: string }> = {
  "1x": { width: 1024, height: 1024, label: "1024 × 1024 px (Standard)" },
  "2x": { width: 2048, height: 2048, label: "2048 × 2048 px (Retina HD)" },
  "4x": { width: 4096, height: 4096, label: "4096 × 4096 px (Ultra 4K Print)" },
};

function findComponent(meshName: string): SneakerComponent | null {
  const name = meshName.toLowerCase().replace(/[-\s]/g, "_");
  for (const component of VALID_COMPONENTS) {
    if (name === component || name.startsWith(`${component}_`)) {
      return component;
    }
  }
  return null;
}

function prepareMaterial(
  source: THREE.Material,
  color: string,
  preset: { roughness: number; metalness: number }
): THREE.Material {
  const material = source.clone();
  if (material instanceof THREE.MeshStandardMaterial) {
    material.color.set(color);
    material.roughness = preset.roughness;
    material.metalness = preset.metalness;
    material.needsUpdate = true;
  }
  return material;
}

export interface RenderOptions {
  view: SneakerView;
  resolution: ExportResolution;
  background: ExportBackground;
  customBgColor?: string;
  includeShadow?: boolean;
  includeWatermark?: boolean;
  includeSwatches?: boolean;
}

/**
 * Loads and applies design state to a THREE.Group scene node.
 */
export async function loadConfiguredModel(design: DesignStateSnapshot): Promise<THREE.Group> {
  const modelConfig = sneakerModels[design.model] || sneakerModels["air-jordan"];
  const loader = new GLTFLoader();

  const gltf = await loader.loadAsync(modelConfig.modelUrl);
  const model = gltf.scene;

  model.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const component = findComponent(mesh.name);
    if (component) {
      const color = design.components[component] || "#cccccc";
      const matType = design.materials[component] || "leather";
      const preset = MATERIAL_PRESETS[matType] || MATERIAL_PRESETS.leather;

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((mat) => prepareMaterial(mat, color, preset));
      } else {
        mesh.material = prepareMaterial(mesh.material, color, preset);
      }
    }
  });

  return model;
}

/**
 * Headless exporter: Renders the sneaker from design state to a clean HTMLCanvasElement.
 */
export async function renderSneakerViewToCanvas(
  design: DesignStateSnapshot,
  options: RenderOptions
): Promise<HTMLCanvasElement> {
  const { width, height } = RESOLUTION_MAP[options.resolution];

  // 1. Scene setup
  const scene = new THREE.Scene();

  let clearAlpha: number;
  if (options.background === "white") {
    scene.background = new THREE.Color("#ffffff");
    clearAlpha = 1;
  } else if (options.background === "brand") {
    scene.background = new THREE.Color("#0b0f19");
    clearAlpha = 1;
  } else if (options.background === "custom" && options.customBgColor) {
    scene.background = new THREE.Color(options.customBgColor);
    clearAlpha = 1;
  } else {
    // Transparent
    scene.background = null;
    clearAlpha = 0;
  }

  // 2. Camera setup
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.01, 100);

  // 3. Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.8);
  scene.add(hemisphereLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);
  fillLight.position.set(-4, 3, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
  rimLight.position.set(-2, 4, -5);
  scene.add(rimLight);

  // Sole illumination for bottom angle
  if (options.view === "sole") {
    const bottomLight = new THREE.DirectionalLight(0xffffff, 3.5);
    bottomLight.position.set(0, -6, 0);
    scene.add(bottomLight);
  }

  // 4. Ground shadow plane
  if (options.includeShadow && options.view !== "sole") {
    const geometry = new THREE.CircleGeometry(2.5, 64);
    const material = new THREE.ShadowMaterial({ opacity: 0.22 });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  // 5. Model Group
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  const model = await loadConfiguredModel(design);
  modelGroup.add(model);

  // Center and normalize geometry bounding box
  const box = new THREE.Box3().setFromObject(modelGroup);
  const center = box.getCenter(new THREE.Vector3());
  modelGroup.position.sub(center);

  const centeredBox = new THREE.Box3().setFromObject(modelGroup);
  const size = centeredBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  const baseDistance = (maxDim / 2) / Math.tan(fovRad / 2) * 1.35;

  // Position camera by viewpoint
  camera.up.set(0, 1, 0);
  switch (options.view) {
    case "side":
      camera.position.set(baseDistance * 1.25, baseDistance * 0.1, 0);
      break;
    case "top":
      camera.position.set(0, baseDistance * 1.35, 0.001);
      camera.up.set(0, 0, -1);
      break;
    case "front":
      camera.position.set(0, baseDistance * 0.15, baseDistance * 1.25);
      break;
    case "back":
      camera.position.set(0, baseDistance * 0.25, -baseDistance * 1.25);
      break;
    case "sole":
      camera.position.set(0, -baseDistance * 1.35, 0.001);
      camera.up.set(0, 0, 1);
      break;
    case "three_quarter":
    default:
      camera.position.set(
        baseDistance * 0.85,
        baseDistance * 0.45,
        baseDistance * 0.85
      );
      break;
  }
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  // 6. WebGL Renderer
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: clearAlpha === 0,
    preserveDrawingBuffer: true,
  });

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, clearAlpha);

  renderer.render(scene, camera);

  // 7. Optional 2D Canvas Post-processing (Watermark, Swatches)
  if (options.includeWatermark || options.includeSwatches) {
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = width;
    finalCanvas.height = height;
    const ctx = finalCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);

      // Watermark Stamp
      if (options.includeWatermark) {
        ctx.save();
        ctx.font = `bold ${Math.max(14, Math.round(width * 0.022))}px sans-serif`;
        ctx.fillStyle = options.background === "brand" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        const padding = Math.round(width * 0.035);
        ctx.fillText(
          `SNEAKER STUDIO • ${design.name.toUpperCase()} • ${design.model.toUpperCase()}`,
          width - padding,
          height - padding
        );
        ctx.restore();
      }

      // Palette Swatches
      if (options.includeSwatches) {
        ctx.save();
        const swatches = Object.entries(design.components);
        const swatchSize = Math.max(16, Math.round(width * 0.032));
        const gap = Math.round(swatchSize * 0.35);
        const startX = Math.round(width * 0.035);
        const startY = height - Math.round(width * 0.035) - swatchSize;

        swatches.forEach(([, hex], idx) => {
          const x = startX + idx * (swatchSize + gap);
          ctx.beginPath();
          ctx.arc(x + swatchSize / 2, startY + swatchSize / 2, swatchSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = hex;
          ctx.fill();
          ctx.lineWidth = Math.max(1, Math.round(swatchSize * 0.08));
          ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
          ctx.stroke();
        });
        ctx.restore();
      }

      // Dispose initial renderer
      renderer.dispose();
      disposeSceneResources(scene);

      return finalCanvas;
    }
  }

  // Cleanup scene resources
  renderer.dispose();
  disposeSceneResources(scene);

  return canvas;
}

/**
 * Cleanly disposes Three.js scene geometries and materials to avoid memory leaks.
 */
function disposeSceneResources(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (!(object as THREE.Mesh).isMesh) return;
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => mat.dispose());
    } else if (mesh.material) {
      mesh.material.dispose();
    }
  });
}
