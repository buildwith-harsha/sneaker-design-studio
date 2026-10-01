import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { SneakerComponent } from "../store/DesignSlice";
import type { SneakerMaterial } from "../data/materials";

export interface Sneaker3DViewerOptions {
  modelUrl?: string;
  onSelectComponent?: (component: SneakerComponent) => void;
  onHoverComponent?: (component: SneakerComponent | null) => void;
  initialComponents?: Record<SneakerComponent, string>;
  initialMaterials?: Record<SneakerComponent, SneakerMaterial>;
}

const MATERIAL_PRESETS: Record<
  SneakerMaterial,
  { roughness: number; metalness: number; bumpScale?: number }
> = {
  leather: { roughness: 0.38, metalness: 0.08 },
  suede: { roughness: 0.92, metalness: 0.02 },
  rubber: { roughness: 0.65, metalness: 0.0 },
  mesh: { roughness: 0.82, metalness: 0.04 },
  knit: { roughness: 0.88, metalness: 0.0 },
};

const VALID_COMPONENTS: Set<string> = new Set([
  "upper",
  "heel",
  "tongue",
  "midsole",
  "outsole",
  "laces",
  "toe",
  "logo",
]);

export class Sneaker3DViewer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private modelGroup: THREE.Group;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isPointerDown = false;
  private pointerDownPos = { x: 0, y: 0 };

  private componentMeshes: Map<SneakerComponent, THREE.Mesh> = new Map();
  private originalMaterials: Map<SneakerComponent, THREE.MeshStandardMaterial> =
    new Map();

  private selectedComponent: SneakerComponent | null = null;
  private hoveredComponent: SneakerComponent | null = null;

  private components: Record<SneakerComponent, string>;
  private materials: Record<SneakerComponent, SneakerMaterial>;

  private onSelectComponent?: (component: SneakerComponent) => void;
  private onHoverComponent?: (component: SneakerComponent | null) => void;

  private animationFrameId: number | null = null;
  private isDisposed = false;
  private resizeObserver: ResizeObserver | null = null;

  private modelUrl: string;

  constructor(container: HTMLElement, options: Sneaker3DViewerOptions = {}) {
    this.container = container;
    this.modelUrl = options.modelUrl || "/models/air-jordan.glb";
    this.onSelectComponent = options.onSelectComponent;
    this.onHoverComponent = options.onHoverComponent;

    this.components = options.initialComponents ?? {
      upper: "#FF0000",
      heel: "#E5E5E5",
      tongue: "#D9D9D9",
      midsole: "#FFFFFF",
      outsole: "#CFCFCF",
      laces: "#171717",
      toe: "#EEEEEE",
      logo: "#171717",
    };

    this.materials = options.initialMaterials ?? {
      upper: "leather",
      heel: "leather",
      tongue: "mesh",
      midsole: "rubber",
      outsole: "rubber",
      laces: "mesh",
      toe: "leather",
      logo: "leather",
    };

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#f8fafc");

    // 2. Camera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 20);
    this.camera.position.set(0.3, 0.16, 0.28);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 0.18;
    this.controls.maxDistance = 0.85;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.target.set(0, 0.055, 0);
    this.controls.update();

    // 5. Lighting
    this.setupLighting();

    // 6. Ground Shadow
    this.setupGround();

    // 7. Raycasting & Events
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    this.bindEvents();

    // 8. Load Model
    this.loadModel();

    // 9. Start Loop
    this.animate();
  }

  private setupLighting(): void {
    // Ambient Light
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambient);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(1.5, 3.0, 2.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 10;
    keyLight.shadow.camera.left = -0.4;
    keyLight.shadow.camera.right = 0.4;
    keyLight.shadow.camera.top = 0.4;
    keyLight.shadow.camera.bottom = -0.4;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Fill Light (Cool)
    const fillLight = new THREE.DirectionalLight(0xd8e6ff, 1.2);
    fillLight.position.set(-2.0, 1.5, -1.0);
    this.scene.add(fillLight);

    // Back / Rim Light
    const rimLight = new THREE.DirectionalLight(0xfff1e0, 1.6);
    rimLight.position.set(-0.5, 2.2, -2.5);
    this.scene.add(rimLight);

    // Under / Bounce Light
    const bounceLight = new THREE.DirectionalLight(0xffffff, 0.45);
    bounceLight.position.set(0, -1.5, 0);
    this.scene.add(bounceLight);
  }

  private setupGround(): void {
    // Soft shadow receiving floor plane
    const shadowPlaneGeo = new THREE.PlaneGeometry(3, 3);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.001;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);

    // Subtle radial gradient pedestal shadow
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 15, 128, 128, 120);
      gradient.addColorStop(0, "rgba(0,0,0,0.35)");
      gradient.addColorStop(0.5, "rgba(0,0,0,0.12)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const pedestalGeo = new THREE.PlaneGeometry(0.36, 0.22);
    const pedestalMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.rotation.x = -Math.PI / 2;
    pedestal.position.y = 0.0001;
    this.scene.add(pedestal);
  }

  public loadModel(modelUrl?: string): void {
    if (modelUrl) {
      this.modelUrl = modelUrl;
    }

    const loader = new GLTFLoader();
    loader.load(
      this.modelUrl,
      (gltf) => {
        if (this.isDisposed) return;

        this.modelGroup.clear();
        this.componentMeshes.clear();
        this.originalMaterials.clear();

        const model = gltf.scene;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const name = mesh.name.toLowerCase();
            let matchedComp: SneakerComponent | null = null;

            for (const comp of VALID_COMPONENTS) {
              if (name === comp || name.startsWith(`${comp}_`)) {
                matchedComp = comp as SneakerComponent;
                break;
              }
            }

            if (matchedComp) {
              this.componentMeshes.set(matchedComp, mesh);

              // Create custom PBR material
              const preset =
                MATERIAL_PRESETS[this.materials[matchedComp]] ||
                MATERIAL_PRESETS.leather;
              const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(this.components[matchedComp]),
                roughness: preset.roughness,
                metalness: preset.metalness,
              });

              mesh.material = material;
              this.originalMaterials.set(matchedComp, material);
            }
          }
        });

        this.modelGroup.add(model);

        // Automatically center camera target on loaded shoe
        const box = new THREE.Box3().setFromObject(this.modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        this.controls.target.copy(center);
        const distance = Math.max(maxDim * 1.7, 0.35);
        this.camera.position.set(
          center.x + distance * 0.85,
          center.y + distance * 0.45,
          center.z + distance * 0.85,
        );
        this.controls.update();

        this.updateComponentHighlights();
      },
      undefined,
      (error) => {
        console.error("Error loading sneaker GLB model:", error);
      },
    );
  }

  private bindEvents(): void {
    const el = this.renderer.domElement;

    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointerleave", this.onPointerLeave);

    this.resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        this.resize();
      });
    });
    this.resizeObserver.observe(this.container);
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.isPointerDown = true;
    this.pointerDownPos = { x: event.clientX, y: event.clientY };
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.isPointerDown) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast on hover
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.componentMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      let hovered: SneakerComponent | null = null;
      for (const [comp, mesh] of this.componentMeshes.entries()) {
        if (mesh === hit) {
          hovered = comp;
          break;
        }
      }

      if (this.hoveredComponent !== hovered) {
        this.hoveredComponent = hovered;
        this.container.style.cursor = hovered ? "pointer" : "default";
        this.updateComponentHighlights();
        this.onHoverComponent?.(hovered);
      }
    } else if (this.hoveredComponent !== null) {
      this.hoveredComponent = null;
      this.container.style.cursor = "default";
      this.updateComponentHighlights();
      this.onHoverComponent?.(null);
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    const dist = Math.hypot(
      event.clientX - this.pointerDownPos.x,
      event.clientY - this.pointerDownPos.y,
    );

    // If click (not drag)
    if (dist < 6) {
      if (this.hoveredComponent) {
        this.setSelectedComponent(this.hoveredComponent);
        this.onSelectComponent?.(this.hoveredComponent);
      }
    }

    this.isPointerDown = false;
  };

  private onPointerLeave = (): void => {
    this.mouse.set(-1000, -1000);
    if (this.hoveredComponent !== null) {
      this.hoveredComponent = null;
      this.container.style.cursor = "default";
      this.updateComponentHighlights();
      this.onHoverComponent?.(null);
    }
    this.isPointerDown = false;
  };

  private updateComponentHighlights(): void {
    for (const [comp, mesh] of this.componentMeshes.entries()) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) continue;

      const isSelected = this.selectedComponent === comp;
      const isHovered = this.hoveredComponent === comp;

      if (isSelected) {
        mat.emissive.setHex(0x334466);
        mat.emissiveIntensity = 0.45;
      } else if (isHovered) {
        mat.emissive.setHex(0x222222);
        mat.emissiveIntensity = 0.25;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      }
    }
  }

  // --- Public Control Methods ---

  public setComponentColor(component: SneakerComponent, color: string): void {
    this.components[component] = color;
    const mesh = this.componentMeshes.get(component);
    if (mesh) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.set(color);
      }
    }
  }

  public setComponentMaterial(
    component: SneakerComponent,
    material: SneakerMaterial,
  ): void {
    this.materials[component] = material;
    const preset = MATERIAL_PRESETS[material] || MATERIAL_PRESETS.leather;
    const mesh = this.componentMeshes.get(component);
    if (mesh) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.roughness = preset.roughness;
        mat.metalness = preset.metalness;
      }
    }
  }

  public updateAll(
    components: Record<SneakerComponent, string>,
    materials: Record<SneakerComponent, SneakerMaterial>,
  ): void {
    this.components = { ...components };
    this.materials = { ...materials };

    for (const [comp, mesh] of this.componentMeshes.entries()) {
      const color = components[comp];
      const matType = materials[comp];
      const preset = MATERIAL_PRESETS[matType] || MATERIAL_PRESETS.leather;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        if (color) mat.color.set(color);
        mat.roughness = preset.roughness;
        mat.metalness = preset.metalness;
      }
    }
  }

  public setSelectedComponent(component: SneakerComponent | null): void {
    this.selectedComponent = component;
    this.updateComponentHighlights();
  }

  public resetCamera(): void {
    this.camera.position.set(0.3, 0.16, 0.28);
    this.controls.target.set(0, 0.055, 0);
    this.controls.update();
  }

  public setAutoRotate(enabled: boolean): void {
    this.controls.autoRotate = enabled;
    this.controls.autoRotateSpeed = 2.0;
  }

  public resize(): void {
    if (this.isDisposed) return;
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 450;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = (): void => {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public destroy(): void {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    const el = this.renderer.domElement;
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerup", this.onPointerUp);
    el.removeEventListener("pointerleave", this.onPointerLeave);

    this.controls.dispose();

    // Dispose meshes and materials
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
}
