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
  {
    roughness: number;
    metalness: number;
  }
> = {
  leather: {
    roughness: 0.38,
    metalness: 0.08,
  },
  suede: {
    roughness: 0.92,
    metalness: 0.02,
  },
  rubber: {
    roughness: 0.65,
    metalness: 0,
  },
  mesh: {
    roughness: 0.82,
    metalness: 0.04,
  },
  knit: {
    roughness: 0.88,
    metalness: 0,
  },
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
  private pointerDownPos = {
    x: 0,
    y: 0,
  };

  private componentMeshes: Map<SneakerComponent, THREE.Mesh[]> = new Map();

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

    /*
     * ----------------------------------------
     * 1. SCENE
     * ----------------------------------------
     */

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color("#f8fafc");

    /*
     * ----------------------------------------
     * 2. CAMERA
     * ----------------------------------------
     */

    const width = container.clientWidth || 600;

    const height = container.clientHeight || 450;

    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.01, 100);

    this.camera.position.set(2, 1.2, 3);

    /*
     * ----------------------------------------
     * 3. RENDERER
     * ----------------------------------------
     */

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.renderer.setSize(width, height);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /*
     * Important for correct GLB colors.
     */

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.renderer.toneMappingExposure = 1.15;

    this.renderer.shadowMap.enabled = true;

    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.container.appendChild(this.renderer.domElement);

    /*
     * ----------------------------------------
     * 4. ORBIT CONTROLS
     * ----------------------------------------
     */

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.controls.enableDamping = true;

    this.controls.dampingFactor = 0.06;

    this.controls.enablePan = false;

    this.controls.minDistance = 0.2;

    this.controls.maxDistance = 20;

    this.controls.maxPolarAngle = Math.PI / 2 + 0.15;

    /*
     * ----------------------------------------
     * 5. LIGHTING
     * ----------------------------------------
     */

    this.setupLighting();

    /*
     * ----------------------------------------
     * 6. GROUND
     * ----------------------------------------
     */

    this.setupGround();

    /*
     * ----------------------------------------
     * 7. MODEL GROUP
     * ----------------------------------------
     */

    this.modelGroup = new THREE.Group();

    this.scene.add(this.modelGroup);

    /*
     * ----------------------------------------
     * 8. RAYCASTING
     * ----------------------------------------
     */

    this.raycaster = new THREE.Raycaster();

    this.mouse = new THREE.Vector2(-1000, -1000);

    /*
     * ----------------------------------------
     * 9. EVENTS
     * ----------------------------------------
     */

    this.bindEvents();

    /*
     * ----------------------------------------
     * 10. LOAD MODEL
     * ----------------------------------------
     */

    this.loadModel();

    /*
     * ----------------------------------------
     * 11. RENDER LOOP
     * ----------------------------------------
     */

    this.animate();
  }

  /*
   * ========================================
   * LIGHTING
   * ========================================
   */

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 2.0);

    this.scene.add(ambient);

    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.8);

    this.scene.add(hemisphere);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);

    keyLight.position.set(4, 6, 5);

    keyLight.castShadow = true;

    keyLight.shadow.mapSize.width = 2048;

    keyLight.shadow.mapSize.height = 2048;

    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.8);

    fillLight.position.set(-4, 3, 2);

    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.0);

    rimLight.position.set(-2, 4, -5);

    this.scene.add(rimLight);
  }

  /*
   * ========================================
   * GROUND
   * ========================================
   */

  private setupGround(): void {
    const geometry = new THREE.CircleGeometry(2, 64);

    const material = new THREE.ShadowMaterial({
      opacity: 0.16,
    });

    const ground = new THREE.Mesh(geometry, material);

    ground.rotation.x = -Math.PI / 2;

    ground.position.y = -0.01;

    ground.receiveShadow = true;

    this.scene.add(ground);
  }

  /*
   * ========================================
   * LOAD GLB
   * ========================================
   */

  public loadModel(modelUrl?: string): void {
    if (modelUrl) {
      this.modelUrl = modelUrl;
    }

    const loader = new GLTFLoader();

    loader.load(
      this.modelUrl,

      (gltf) => {
        if (this.isDisposed) {
          return;
        }

        /*
         * Remove previous model.
         */

        this.clearModel();

        const model = gltf.scene;

        /*
         * Make sure every component
         * starts with an empty mesh list.
         */

        this.componentMeshes.clear();

        for (const component of VALID_COMPONENTS) {
          this.componentMeshes.set(component, []);
        }

        /*
         * --------------------------------
         * Inspect every mesh in GLB
         * --------------------------------
         */

        model.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) {
            return;
          }

          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;

          mesh.receiveShadow = true;

          /*
           * Find component based
           * on Blender mesh name.
           */

          const component = this.findComponent(mesh.name);

          /*
           * Preserve original
           * Blender material.
           */

          if (component) {
            const meshes = this.componentMeshes.get(component) ?? [];

            meshes.push(mesh);

            this.componentMeshes.set(component, meshes);

            this.applyDesignToMesh(mesh, component);
          }
        });

        /*
         * Add model to scene.
         */

        this.modelGroup.add(model);

        /*
         * Center and frame it.
         */

        this.frameModel();

        /*
         * Apply selected/hovered
         * state.
         */

        this.updateComponentHighlights();
      },

      undefined,

      (error) => {
        console.error("Error loading sneaker GLB model:", error);
      },
    );
  }

  /*
   * ========================================
   * FIND COMPONENT
   * ========================================
   */

  private findComponent(meshName: string): SneakerComponent | null {
    const name = meshName.toLowerCase().replace(/[-\s]/g, "_");

    for (const component of VALID_COMPONENTS) {
      if (name === component || name.startsWith(`${component}_`)) {
        return component;
      }
    }

    return null;
  }

  /*
   * ========================================
   * APPLY DESIGN
   * ========================================
   */

  private applyDesignToMesh(
    mesh: THREE.Mesh,
    component: SneakerComponent,
  ): void {
    const color = this.components[component];

    const materialType = this.materials[component];

    const preset = MATERIAL_PRESETS[materialType] || MATERIAL_PRESETS.leather;

    /*
     * IMPORTANT:
     *
     * Do NOT blindly replace the
     * original Blender material.
     *
     * Instead, clone it.
     */

    const originalMaterial = mesh.material;

    if (Array.isArray(originalMaterial)) {
      /*
       * If Blender exported multiple
       * materials, clone them.
       */

      mesh.material = originalMaterial.map((material) => {
        return this.prepareMaterial(material, color, preset);
      });
    } else {
      mesh.material = this.prepareMaterial(originalMaterial, color, preset);
    }
  }

  /*
   * ========================================
   * PREPARE MATERIAL
   * ========================================
   */

  private prepareMaterial(
    source: THREE.Material,
    color: string,
    preset: {
      roughness: number;
      metalness: number;
    },
  ): THREE.Material {
    let material: THREE.Material | THREE.MeshStandardMaterial;

    /*
     * Clone original material.
     */

    material = source.clone();

    /*
     * Most GLB sneaker materials
     * are MeshStandardMaterial.
     */

    if (material instanceof THREE.MeshStandardMaterial) {
      /*
       * Apply designer color.
       */

      material.color.set(color);

      /*
       * Apply selected material.
       */

      material.roughness = preset.roughness;

      material.metalness = preset.metalness;

      /*
       * Make sure the material
       * reacts correctly to lights.
       */

      material.needsUpdate = true;
    }

    return material;
  }

  /*
   * ========================================
   * FRAME MODEL
   * ========================================
   */

  private frameModel(): void {
    const box = new THREE.Box3().setFromObject(this.modelGroup);

    const size = box.getSize(new THREE.Vector3());

    const center = box.getCenter(new THREE.Vector3());

    const maxDimension = Math.max(size.x, size.y, size.z);

    if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
      return;
    }

    /*
     * Move model so its center
     * is around the origin.
     */

    this.modelGroup.position.x -= center.x;

    this.modelGroup.position.y -= center.y;

    this.modelGroup.position.z -= center.z;

    /*
     * Recalculate bounds after
     * centering.
     */

    const centeredBox = new THREE.Box3().setFromObject(this.modelGroup);

    const centeredSize = centeredBox.getSize(new THREE.Vector3());

    const centeredCenter = centeredBox.getCenter(new THREE.Vector3());

    const largestDimension = Math.max(
      centeredSize.x,
      centeredSize.y,
      centeredSize.z,
    );

    /*
     * Camera distance based on
     * actual model size.
     */

    const fov = THREE.MathUtils.degToRad(this.camera.fov);

    const distance = largestDimension / 2 / Math.tan(fov / 2);

    const cameraDistance = distance * 1.35;

    /*
     * Put camera in a nice
     * three-quarter view.
     */

    this.camera.position.set(
      cameraDistance * 0.85,
      cameraDistance * 0.45,
      cameraDistance * 0.85,
    );

    this.camera.near = Math.max(largestDimension / 1000, 0.001);

    this.camera.far = Math.max(largestDimension * 20, 100);

    this.camera.updateProjectionMatrix();

    /*
     * OrbitControls looks at
     * the center of the sneaker.
     */

    this.controls.target.copy(centeredCenter);

    this.controls.minDistance = largestDimension * 0.4;

    this.controls.maxDistance = largestDimension * 5;

    this.controls.update();
  }

  /*
   * ========================================
   * CLEAR MODEL
   * ========================================
   */

  private clearModel(): void {
    while (this.modelGroup.children.length) {
      const object = this.modelGroup.children[0];

      this.modelGroup.remove(object);

      object.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) {
          return;
        }

        const mesh = child as THREE.Mesh;

        mesh.geometry.dispose();

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => {
            material.dispose();
          });
        } else {
          mesh.material.dispose();
        }
      });
    }
  }

  /*
   * ========================================
   * EVENTS
   * ========================================
   */

  private bindEvents(): void {
    const element = this.renderer.domElement;

    element.addEventListener("pointerdown", this.onPointerDown);

    element.addEventListener("pointermove", this.onPointerMove);

    element.addEventListener("pointerup", this.onPointerUp);

    element.addEventListener("pointerleave", this.onPointerLeave);

    this.resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        this.resize();
      });
    });

    this.resizeObserver.observe(this.container);
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.isPointerDown = true;

    this.pointerDownPos = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.isPointerDown) {
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;

    this.mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = Array.from(this.componentMeshes.values()).flat();

    const intersections = this.raycaster.intersectObjects(meshes, false);

    if (intersections.length > 0) {
      const hit = intersections[0].object as THREE.Mesh;

      const component = this.findComponent(hit.name);

      if (component !== this.hoveredComponent) {
        this.hoveredComponent = component;

        this.container.style.cursor = "pointer";

        this.updateComponentHighlights();

        this.onHoverComponent?.(component);
      }

      return;
    }

    if (this.hoveredComponent !== null) {
      this.hoveredComponent = null;

      this.container.style.cursor = "default";

      this.updateComponentHighlights();

      this.onHoverComponent?.(null);
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    const distance = Math.hypot(
      event.clientX - this.pointerDownPos.x,
      event.clientY - this.pointerDownPos.y,
    );

    if (distance < 6 && this.hoveredComponent) {
      this.setSelectedComponent(this.hoveredComponent);

      this.onSelectComponent?.(this.hoveredComponent);
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

  /*
   * ========================================
   * HIGHLIGHTS
   * ========================================
   */

  private updateComponentHighlights(): void {
    for (const [component, meshes] of this.componentMeshes.entries()) {
      const isSelected = this.selectedComponent === component;

      const isHovered = this.hoveredComponent === component;

      for (const mesh of meshes) {
        const material = mesh.material;

        const materials = Array.isArray(material) ? material : [material];

        for (const currentMaterial of materials) {
          if (!(currentMaterial instanceof THREE.MeshStandardMaterial)) {
            continue;
          }

          if (isSelected) {
            currentMaterial.emissive.set("#334466");

            currentMaterial.emissiveIntensity = 0.45;
          } else if (isHovered) {
            currentMaterial.emissive.set("#222222");

            currentMaterial.emissiveIntensity = 0.2;
          } else {
            currentMaterial.emissive.set("#000000");

            currentMaterial.emissiveIntensity = 0;
          }

          currentMaterial.needsUpdate = true;
        }
      }
    }
  }

  /*
   * ========================================
   * PUBLIC API
   * ========================================
   */

  public setComponentColor(component: SneakerComponent, color: string): void {
    this.components[component] = color;

    const meshes = this.componentMeshes.get(component);

    if (!meshes) {
      return;
    }

    for (const mesh of meshes) {
      const material = mesh.material;

      const materials = Array.isArray(material) ? material : [material];

      for (const currentMaterial of materials) {
        if (currentMaterial instanceof THREE.MeshStandardMaterial) {
          currentMaterial.color.set(color);

          currentMaterial.needsUpdate = true;
        }
      }
    }
  }

  public setComponentMaterial(
    component: SneakerComponent,
    materialType: SneakerMaterial,
  ): void {
    this.materials[component] = materialType;

    const preset = MATERIAL_PRESETS[materialType] || MATERIAL_PRESETS.leather;

    const meshes = this.componentMeshes.get(component);

    if (!meshes) {
      return;
    }

    for (const mesh of meshes) {
      const material = mesh.material;

      const materials = Array.isArray(material) ? material : [material];

      for (const currentMaterial of materials) {
        if (currentMaterial instanceof THREE.MeshStandardMaterial) {
          currentMaterial.roughness = preset.roughness;

          currentMaterial.metalness = preset.metalness;

          currentMaterial.needsUpdate = true;
        }
      }
    }
  }

  public updateAll(
    components: Record<SneakerComponent, string>,
    materials: Record<SneakerComponent, SneakerMaterial>,
  ): void {
    this.components = {
      ...components,
    };

    this.materials = {
      ...materials,
    };

    for (const component of VALID_COMPONENTS) {
      this.setComponentColor(component, components[component]);

      this.setComponentMaterial(component, materials[component]);
    }

    this.updateComponentHighlights();
  }

  public setSelectedComponent(component: SneakerComponent | null): void {
    this.selectedComponent = component;

    this.updateComponentHighlights();
  }

  public resetCamera(): void {
    if (this.modelGroup.children.length === 0) {
      return;
    }

    this.frameModel();
  }

  public setAutoRotate(enabled: boolean): void {
    this.controls.autoRotate = enabled;

    this.controls.autoRotateSpeed = 2;
  }

  public resize(): void {
    if (this.isDisposed) {
      return;
    }

    const width = this.container.clientWidth || 600;

    const height = this.container.clientHeight || 450;

    this.camera.aspect = width / height;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /*
   * ========================================
   * ANIMATION
   * ========================================
   */

  private animate = (): void => {
    if (this.isDisposed) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animate);

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
  };

  /*
   * ========================================
   * DESTROY
   * ========================================
   */

  public destroy(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();

      this.resizeObserver = null;
    }

    const element = this.renderer.domElement;

    element.removeEventListener("pointerdown", this.onPointerDown);

    element.removeEventListener("pointermove", this.onPointerMove);

    element.removeEventListener("pointerup", this.onPointerUp);

    element.removeEventListener("pointerleave", this.onPointerLeave);

    this.controls.dispose();

    this.scene.traverse((object) => {
      if (!(object as THREE.Mesh).isMesh) {
        return;
      }

      const mesh = object as THREE.Mesh;

      mesh.geometry.dispose();

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => {
          material.dispose();
        });
      } else {
        mesh.material.dispose();
      }
    });

    this.renderer.dispose();

    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}
