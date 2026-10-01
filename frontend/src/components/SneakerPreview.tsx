import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setSelectedComponent } from "../store/editorSlice";
import type { SneakerComponent } from "../store/DesignSlice";
import { sneakerModels } from "../data/sneakerModels";
import { Sneaker3DViewer } from "../utils/Sneaker3DViewer";
import { sneakerComponent as componentConfig } from "../data/sneakerComponent";

function SneakerPreview() {
  const dispatch = useAppDispatch();
  const container3dRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Sneaker3DViewer | null>(null);

  const [hovered3dPart, setHovered3dPart] = useState<SneakerComponent | null>(
    null,
  );
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  const components = useAppSelector((state) => state.design.components);
  const model = useAppSelector((state) => state.design.model);
  const selectedComponent = useAppSelector(
    (state) => state.editor.selectedComponent,
  );
  const materials = useAppSelector((state) => state.design.materials);

  const currentModelConfig = sneakerModels[model] || sneakerModels["air-jordan"];

  // Initialize and manage the 3D Viewer instance
  useEffect(() => {
    if (!container3dRef.current) {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      return;
    }

    const viewer = new Sneaker3DViewer(container3dRef.current, {
      modelUrl: currentModelConfig.modelUrl,
      initialComponents: components,
      initialMaterials: materials,
      onSelectComponent: (comp) => {
        dispatch(setSelectedComponent(comp));
      },
      onHoverComponent: (comp) => {
        setHovered3dPart(comp);
      },
    });

    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [model]);

  // Sync component colors & materials to 3D Viewer
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.updateAll(components, materials);
    }
  }, [components, materials]);

  // Sync selected component highlight to 3D Viewer
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.setSelectedComponent(selectedComponent);
    }
  }, [selectedComponent]);

  const handleResetCamera = () => {
    viewerRef.current?.resetCamera();
  };

  const handleToggleAutoRotate = () => {
    const nextState = !isAutoRotating;
    setIsAutoRotating(nextState);
    viewerRef.current?.setAutoRotate(nextState);
  };

  return (
    <div className="sneaker-3d-wrapper">
      <div className="sneaker-3d-toolbar">
        <div className="sneaker-3d-badge">
          <span className="sneaker-3d-badge__dot"></span>
          {currentModelConfig.name}
        </div>
        <div className="sneaker-3d-actions">
          <button
            type="button"
            className={`sneaker-3d-btn ${isAutoRotating ? "sneaker-3d-btn--active" : ""}`}
            onClick={handleToggleAutoRotate}
            title="Toggle 360° Auto-Rotation"
          >
            {isAutoRotating ? "⏹ Stop Spin" : "🔄 360° Spin"}
          </button>
          <button
            type="button"
            className="sneaker-3d-btn"
            onClick={handleResetCamera}
            title="Reset View"
          >
            🎯 Center View
          </button>
        </div>
      </div>

      <div
        ref={container3dRef}
        className={`sneaker-3d-canvas selected-${selectedComponent ?? "none"}`}
      />

      <div className="sneaker-3d-footer">
        {hovered3dPart ? (
          <span className="sneaker-3d-hover-hint">
            Target: <strong>{componentConfig[hovered3dPart]?.label}</strong>{" "}
            (Click to customize)
          </span>
        ) : (
          <span className="sneaker-3d-hint">
            💡 Click any sneaker part to color it • Drag to rotate 360° • Scroll
            to zoom
          </span>
        )}
      </div>
    </div>
  );
}

export default SneakerPreview;
