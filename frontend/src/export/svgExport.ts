import type { DesignStateSnapshot, SneakerView } from "./types";

/**
 * Generates an SVG vector graphic representing the 2D view of the sneaker.
 * Each sneaker component is grouped in a dedicated named <g> layer with an ID,
 * fully styled with the user's custom hex colors and material textures.
 */
export function generateSneakerSvg(
  design: DesignStateSnapshot,
  view: SneakerView = "side"
): string {
  const { components, name, model } = design;

  const upper = components.upper || "#B22222";
  const heel = components.heel || "#B22222";
  const tongue = components.tongue || "#FFFFFF";
  const midsole = components.midsole || "#FFFFFF";
  const outsole = components.outsole || "#B22222";
  const laces = components.laces || "#111111";
  const toe = components.toe || "#FFFFFF";
  const logo = components.logo || "#111111";

  if (view === "top") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <title>${escapeXml(name)} - Top View</title>
  <desc>Exported from Sneaker Design Studio. Model: ${model}. Layers partitioned by component.</desc>
  <defs>
    <filter id="drop-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-opacity="0.18"/>
    </filter>
  </defs>

  <g id="sole-perimeter" data-part="midsole" filter="url(#drop-shadow)">
    <path d="M 240,250 C 240,140 320,110 440,110 C 580,110 660,180 660,250 C 660,320 580,390 440,390 C 320,390 240,360 240,250 Z"
      fill="${midsole}" stroke="#1e293b" stroke-width="4" stroke-linejoin="round"/>
  </g>

  <g id="upper" data-part="upper">
    <path d="M 260,250 C 260,160 330,135 440,135 C 560,135 635,190 635,250 C 635,310 560,365 440,365 C 330,365 260,340 260,250 Z"
      fill="${upper}" stroke="#0f172a" stroke-width="3"/>
  </g>

  <g id="heel" data-part="heel">
    <path d="M 260,250 C 260,190 280,165 310,165 C 330,165 335,200 335,250 C 335,300 330,335 310,335 C 280,335 260,310 260,250 Z"
      fill="${heel}" stroke="#0f172a" stroke-width="2.5"/>
  </g>

  <g id="toe" data-part="toe">
    <path d="M 540,165 C 590,175 635,210 635,250 C 635,290 590,325 540,335 C 520,290 520,210 540,165 Z"
      fill="${toe}" stroke="#0f172a" stroke-width="2.5"/>
  </g>

  <g id="tongue" data-part="tongue">
    <path d="M 360,250 C 360,205 380,185 460,185 C 510,185 520,205 520,250 C 520,295 510,315 460,315 C 380,315 360,295 360,250 Z"
      fill="${tongue}" stroke="#334155" stroke-width="2"/>
  </g>

  <g id="laces" data-part="laces">
    <line x1="400" y1="205" x2="430" y2="295" stroke="${laces}" stroke-width="8" stroke-linecap="round"/>
    <line x1="430" y1="205" x2="400" y2="295" stroke="${laces}" stroke-width="8" stroke-linecap="round"/>
    <line x1="445" y1="205" x2="475" y2="295" stroke="${laces}" stroke-width="8" stroke-linecap="round"/>
    <line x1="475" y1="205" x2="445" y2="295" stroke="${laces}" stroke-width="8" stroke-linecap="round"/>
  </g>

  <g id="logo" data-part="logo">
    <path d="M 380,245 Q 430,230 490,240 Q 440,255 380,245 Z" fill="${logo}" />
  </g>
</svg>`;
  }

  // Default: Side Profile View
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" width="100%" height="100%">
  <title>${escapeXml(name)} - Lateral View</title>
  <desc>Layered Sneaker Vector Schematic. Model: ${model}. Layers partitioned by component ID.</desc>
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="115%" height="120%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000000" flood-opacity="0.2"/>
    </filter>
  </defs>

  <!-- Ambient Ground Cast Shadow -->
  <ellipse cx="500" cy="510" rx="390" ry="24" fill="#0f172a" opacity="0.18" />

  <!-- SNEAKER SCHEMATIC BODY -->
  <g id="sneaker-assembly" filter="url(#shadow)">
    
    <!-- OUTSOLE -->
    <g id="outsole" data-layer-name="Outsole">
      <path d="M 170,465 C 195,490 260,495 380,495 C 520,495 680,495 780,485 C 830,480 860,460 855,445 C 840,442 790,448 680,448 C 500,448 300,446 175,448 C 165,453 165,460 170,465 Z"
        fill="${outsole}" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
    </g>

    <!-- MIDSOLE -->
    <g id="midsole" data-layer-name="Midsole">
      <path d="M 175,448 C 300,446 500,448 680,448 C 790,448 840,442 855,445 C 850,425 825,415 780,412 C 670,412 520,416 380,416 C 260,416 195,418 175,430 C 168,435 168,443 175,448 Z"
        fill="${midsole}" stroke="#1e293b" stroke-width="3" stroke-linejoin="round"/>
    </g>

    <!-- TONGUE (Rendered behind upper) -->
    <g id="tongue" data-layer-name="Tongue">
      <path d="M 430,340 C 440,270 480,210 520,185 C 545,170 575,175 580,205 C 585,235 565,290 535,340 Z"
        fill="${tongue}" stroke="#334155" stroke-width="2.5" stroke-linejoin="round"/>
    </g>

    <!-- HEEL COUNTER & COLLAR -->
    <g id="heel" data-layer-name="Heel">
      <path d="M 175,430 C 170,390 175,320 200,260 C 220,215 265,200 320,205 C 340,245 345,300 335,370 C 315,410 240,420 175,430 Z"
        fill="${heel}" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
    </g>

    <!-- UPPER BODY -->
    <g id="upper" data-layer-name="Upper">
      <path d="M 320,205 C 375,208 420,260 460,310 C 510,315 620,335 680,360 C 730,380 770,400 780,412 C 670,412 520,416 380,416 C 355,416 335,400 335,370 C 345,300 340,245 320,205 Z"
        fill="${upper}" stroke="#0f172a" stroke-width="3.5" stroke-linejoin="round"/>
    </g>

    <!-- TOE BOX -->
    <g id="toe" data-layer-name="Toe">
      <path d="M 680,360 C 740,375 805,395 835,410 C 850,418 850,426 845,435 C 825,415 780,412 730,412 C 670,412 650,390 680,360 Z"
        fill="${toe}" stroke="#0f172a" stroke-width="3" stroke-linejoin="round"/>
    </g>

    <!-- LACES -->
    <g id="laces" data-layer-name="Laces">
      <path d="M 445,310 L 495,295 M 465,285 L 515,270 M 485,260 L 535,245 M 505,235 L 555,220"
        stroke="${laces}" stroke-width="7" stroke-linecap="round"/>
    </g>

    <!-- LOGO / SWOOSH ACCENT -->
    <g id="logo" data-layer-name="Logo">
      <path d="M 340,360 C 420,380 500,385 640,320 C 560,345 460,345 380,330 C 355,325 340,345 340,360 Z"
        fill="${logo}" stroke="#0f172a" stroke-width="1.5"/>
    </g>

  </g>

  <!-- SPECIFICATION BADGE -->
  <g id="spec-badge" opacity="0.65" transform="translate(40, 550)">
    <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#0f172a">
      ${escapeXml(name.toUpperCase())} // MODEL: ${model.toUpperCase()} // SNEAKER DESIGN STUDIO
    </text>
  </g>
</svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
