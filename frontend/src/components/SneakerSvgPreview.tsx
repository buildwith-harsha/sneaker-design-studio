import type { CSSProperties } from "react";

import type { SavedDesign } from "../store/DesignTypes";
import { sneakerModels } from "../data/sneakerModels";

interface SneakerSvgPreviewProps {
  design: SavedDesign;
}

function SneakerSvgPreview({ design }: SneakerSvgPreviewProps) {
  const SneakerSvg = sneakerModels[design.model].component;

  const sneakerStyles = {
    "--upper-color": design.components.upper,
    "--heel-color": design.components.heel,
    "--tongue-color": design.components.tongue,
    "--midsole-color": design.components.midsole,
    "--outsole-color": design.components.outsole,
    "--laces-color": design.components.laces,
    "--toe-color": design.components.toe,
    "--logo-color": design.components.logo,
  } as CSSProperties;

  return <SneakerSvg style={sneakerStyles} />;
}

export default SneakerSvgPreview;
