import * as THREE from "three";
import type { DesignStateSnapshot } from "./types";
import { loadConfiguredModel } from "./renderer";

/**
 * Records a 360° rotation turntable video (WebM/MP4) directly from the WebGL canvas.
 */
export async function exportTurntableVideo(
  design: DesignStateSnapshot,
  onProgress?: (percent: number) => void,
  abortSignal?: AbortSignal
): Promise<Blob> {
  const width = 1080;
  const height = 1080;
  const fps = 30;
  const totalDurationMs = 3600; // 3.6s full 360-degree rotation
  const totalFrames = Math.round((totalDurationMs / 1000) * fps);

  // Setup offscreen scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f8fafc");

  const camera = new THREE.PerspectiveCamera(35, width / height, 0.01, 100);

  // Studio lighting
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

  // Ground shadow
  const geometry = new THREE.CircleGeometry(2.5, 64);
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.18 });
  const ground = new THREE.Mesh(geometry, shadowMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  // Model
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  const model = await loadConfiguredModel(design);
  modelGroup.add(model);

  // Center model
  const box = new THREE.Box3().setFromObject(modelGroup);
  const center = box.getCenter(new THREE.Vector3());
  modelGroup.position.sub(center);

  const centeredBox = new THREE.Box3().setFromObject(modelGroup);
  const size = centeredBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  const distance = (maxDim / 2) / Math.tan(fovRad / 2) * 1.4;

  camera.position.set(0, distance * 0.35, distance * 1.15);
  camera.lookAt(0, 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // MediaRecorder setup
  let mimeType = "video/webm";
  if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
    mimeType = "video/mp4;codecs=avc1";
  } else if (MediaRecorder.isTypeSupported("video/mp4")) {
    mimeType = "video/mp4";
  } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    mimeType = "video/webm;codecs=vp9";
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  return new Promise<Blob>((resolve, reject) => {
    let frameIndex = 0;
    const intervalMs = totalDurationMs / totalFrames;

    const renderStep = () => {
      if (abortSignal?.aborted) {
        recorder.stop();
        cleanup();
        reject(new Error("Turntable export was cancelled"));
        return;
      }

      // Rotate group around Y axis
      const angle = (frameIndex / totalFrames) * Math.PI * 2;
      modelGroup.rotation.y = angle;

      renderer.render(scene, camera);

      frameIndex++;
      const percent = Math.min(100, Math.round((frameIndex / totalFrames) * 100));
      onProgress?.(percent);

      if (frameIndex <= totalFrames) {
        setTimeout(renderStep, intervalMs);
      } else {
        recorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: mimeType });
          cleanup();
          resolve(finalBlob);
        };
        recorder.stop();
      }
    };

    function cleanup() {
      renderer.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
    }

    renderStep();
  });
}
