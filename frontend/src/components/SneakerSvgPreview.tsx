import { useEffect, useRef } from "react";

import type { SavedDesign } from "../store/DesignTypes";

import { sneakerModels, normalizeSneakerModel } from "../data/sneakerModels";

import { Sneaker3DViewer } from "../utils/Sneaker3DViewer";

interface SneakerSvgPreviewProps {
  design: SavedDesign;
}

function SneakerSvgPreview({ design }: SneakerSvgPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const viewerRef = useRef<Sneaker3DViewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const normalizedModel = normalizeSneakerModel(design.model);

    const modelConfig = sneakerModels[normalizedModel];
      const viewer = new Sneaker3DViewer(containerRef.current, {
      modelUrl: modelConfig.modelUrl,

      initialComponents: {
        ...design.components,
      },

      initialMaterials: {
        ...design.materials,
      },
    });

    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [design]);

  return <div ref={containerRef} className="saved-sneaker-3d-preview" />;
}

export default SneakerSvgPreview;
