import { useState, useEffect, useRef, useCallback } from "react";
import type {
  DesignStateSnapshot,
  ExportBackground,
  ExportFormat,
  ExportItemResult,
  ExportOptions,
  ExportProgress,
  ExportResolution,
  SneakerView,
} from "../../export/types";
import {
  executeExport,
  estimateExportStats,
  cleanupExportResults,
  triggerDownload,
} from "../../export/exportManager";
import { renderSneakerViewToCanvas } from "../../export/renderer";
import { generateSneakerSvg } from "../../export/svgExport";
import { encodeDesignToShareUrl } from "../../export/shareLink";
import { createZipArchive } from "../../export/zipExport";
import "../../assets/css/export-modal.css";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  design: DesignStateSnapshot;
}

const STORAGE_KEY = "sneaker_studio_export_settings_v1";

const ALL_VIEWS: SneakerView[] = [
  "three_quarter",
  "side",
  "top",
  "front",
  "back",
  "sole",
];

const VIEW_LABELS: Record<SneakerView, string> = {
  three_quarter: "3/4 View",
  side: "Side Profile",
  top: "Aerial Top",
  front: "Front Facing",
  back: "Rear Heel",
  sole: "Sole Tread",
};

export default function ExportModal({ isOpen, onClose, design }: ExportModalProps) {
  // Modal ref for focus trap
  const modalRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Export Options State with LocalStorage memory
  const [options, setOptions] = useState<ExportOptions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          filename: design.name || "my-sneaker-design",
        };
      }
    } catch {
      // Fallback
    }
    return {
      formats: ["png"],
      views: ["three_quarter"],
      resolution: "2x",
      background: "transparent",
      customBgColor: "#10b981",
      includeWatermark: false,
      includeShadow: true,
      includeSwatches: true,
      includeTurntable: false,
      filename: design.name || "my-sneaker-design",
    };
  });

  // Active view for the live interactive preview box
  const [previewView, setPreviewView] = useState<SneakerView>("three_quarter");
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewSvgStr, setPreviewSvgStr] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Export Workflow State
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [results, setResults] = useState<ExportItemResult[] | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Save settings when changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      // storage unavailable
    }
  }, [options]);

  // Handle Escape key & Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isExporting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  // Render Live Preview
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    Promise.resolve().then(() => {
      if (!isSubscribed) return null;
      const isSvgActive = options.formats.length === 1 && options.formats[0] === "svg";

      if (isSvgActive) {
        const svg = generateSneakerSvg(design, previewView);
        setPreviewSvgStr(svg);
        setPreviewDataUrl(null);
        setLoadingPreview(false);
        return null;
      }

      setLoadingPreview(true);
      return renderSneakerViewToCanvas(design, {
        view: previewView,
        resolution: "1x",
        background: options.background,
        customBgColor: options.customBgColor,
        includeShadow: options.includeShadow,
        includeWatermark: options.includeWatermark,
        includeSwatches: options.includeSwatches,
      });
    })
      .then((canvas) => {
        if (!isSubscribed || !canvas) return;
        setPreviewSvgStr(null);
        setPreviewDataUrl(canvas.toDataURL("image/png"));
        setLoadingPreview(false);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn("Live export preview failed:", err);
        setLoadingPreview(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [
    isOpen,
    design,
    previewView,
    options.formats,
    options.background,
    options.customBgColor,
    options.includeShadow,
    options.includeWatermark,
    options.includeSwatches,
  ]);

  // Clean up object URLs when closing
  useEffect(() => {
    return () => {
      if (results) cleanupExportResults(results);
    };
  }, [results]);

  // Format toggle handler
  const handleToggleFormat = (fmt: ExportFormat) => {
    setOptions((prev) => {
      const exists = prev.formats.includes(fmt);
      let updated: ExportFormat[];
      if (exists) {
        if (prev.formats.length === 1) return prev; // At least one format required
        updated = prev.formats.filter((f) => f !== fmt);
      } else {
        updated = [...prev.formats, fmt];
      }
      return { ...prev, formats: updated };
    });
  };

  // View toggle handler
  const handleToggleView = (view: SneakerView) => {
    setOptions((prev) => {
      const exists = prev.views.includes(view);
      let updated: SneakerView[];
      if (exists) {
        if (prev.views.length === 1) return prev; // At least one view required
        updated = prev.views.filter((v) => v !== view);
      } else {
        updated = [...prev.views, view];
      }
      return { ...prev, views: updated };
    });
    setPreviewView(view);
  };

  const handleSelectAllViews = () => {
    setOptions((prev) => ({
      ...prev,
      views: prev.views.length === ALL_VIEWS.length ? ["three_quarter"] : [...ALL_VIEWS],
    }));
  };

  // Execute export run
  const handleStartExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setProgress(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const exportedItems = await executeExport(
        design,
        options,
        (prog) => setProgress(prog),
        controller.signal
      );
      setResults(exportedItems);
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        setProgress(null);
      } else {
        const msg = err instanceof Error ? err.message : "Export encountered an unexpected error.";
        setExportError(msg);
      }
    } finally {
      setIsExporting(false);
      abortControllerRef.current = null;
    }
  };

  // Cancel export
  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExporting(false);
  };

  // Download All as ZIP
  const handleDownloadAllZip = async () => {
    if (!results || results.length === 0) return;
    setIsZipping(true);
    try {
      const zipBlob = await createZipArchive(results);
      const zipFilename = `${(options.filename || design.name).toLowerCase().replace(/[^a-z0-9_-]/g, "-")}-drop.zip`;
      triggerDownload(zipBlob, zipFilename);
    } catch (err) {
      console.error("ZIP packaging failed:", err);
    } finally {
      setIsZipping(false);
    }
  };

  // Copy Share Link
  const handleCopyShareLink = useCallback(() => {
    const url = encodeDesignToShareUrl(design);
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  }, [design]);

  if (!isOpen) return null;

  const stats = estimateExportStats(options);
  const totalFormattedSize = (stats.estimatedBytes / (1024 * 1024)).toFixed(1);

  return (
    <div
      className="export-backdrop"
      onClick={() => {
        if (!isExporting) onClose();
      }}
      role="presentation"
    >
      <div
        className="export-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="export-header">
          <div className="export-header__title-group">
            <span className="export-header__badge">DROP READY</span>
            <h2 id="export-dialog-title" className="export-header__title">
              Ready to Drop? 👟
            </h2>
          </div>
          <button
            type="button"
            className="export-header__close"
            onClick={onClose}
            aria-label="Close export panel"
            disabled={isExporting}
          >
            ✕
          </button>
        </header>

        {/* Celebratory Marquee Ribbon */}
        <div className="export-marquee" aria-hidden="true">
          <div className="export-marquee__track">
            YOUR DESIGN. YOUR DROP. • UNLIMITED FLEX • CRAFTED FOR THE STREETS • READY FOR THE METAVERSE • HIGH RES SPECIFICATIONS • YOUR DESIGN. YOUR DROP. • UNLIMITED FLEX •
          </div>
        </div>

        {/* Live Region for Screen Readers */}
        <div className="sr-only" aria-live="polite" style={{ position: "absolute", left: -9999 }}>
          {isExporting ? `Exporting: ${progress?.currentStep || "Processing..."}` : ""}
          {results ? "Export complete! Ready to download." : ""}
        </div>

        {/* Modal Main Body */}
        <div className="export-body">
          {/* Left: Layered Sneaker Preview */}
          <aside className="export-preview-column">
            <div className="export-mockup-wrapper">
              <div className="export-mockup-card">
                <span className="export-mockup-tag">
                  {VIEW_LABELS[previewView].toUpperCase()}
                </span>

                <div className="export-mockup-canvas-box">
                  {loadingPreview ? (
                    <div className="export-preview-skeleton" />
                  ) : previewSvgStr ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: previewSvgStr }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : previewDataUrl ? (
                    <img src={previewDataUrl} alt="Export preview" />
                  ) : (
                    <div className="export-preview-skeleton" />
                  )}
                </div>
              </div>
            </div>

            {/* View Switching Pills */}
            <div className="export-view-pills" role="tablist" aria-label="Preview viewpoints">
              {ALL_VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`export-view-pill ${previewView === v ? "export-view-pill--active" : ""}`}
                  onClick={() => setPreviewView(v)}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>

            {/* Quick Specs */}
            <div className="export-preview-specs">
              <div className="export-preview-specs__item">
                <span className="export-preview-specs__label">SILHOUETTE</span>
                <span className="export-preview-specs__value">{design.model}</span>
              </div>
              <div className="export-preview-specs__item">
                <span className="export-preview-specs__label">ACTIVE OUTPUT</span>
                <span className="export-preview-specs__value">{stats.dimensionsLabel}</span>
              </div>
            </div>
          </aside>

          {/* Right: Progressive Options */}
          <main className="export-options-column">
            {/* Format Selection Cards */}
            <section className="export-section">
              <div className="export-section__heading">
                <h3 className="export-section__title">
                  <span>⚡</span> Formats
                </h3>
                <span className="export-section__sub">Select all that apply</span>
              </div>

              <div className="export-format-grid">
                {/* PNG */}
                <button
                  type="button"
                  className={`export-format-card ${options.formats.includes("png") ? "export-format-card--selected" : ""}`}
                  onClick={() => handleToggleFormat("png")}
                >
                  <div className="export-format-card__header">
                    <span className="export-format-card__icon">🖼️</span>
                    <span className="export-format-card__badge">IMAGE</span>
                  </div>
                  <h4 className="export-format-card__title">PNG</h4>
                  <p className="export-format-card__desc">Socials, transparent mockups & decks</p>
                </button>

                {/* JPG */}
                <button
                  type="button"
                  className={`export-format-card ${options.formats.includes("jpg") ? "export-format-card--selected" : ""}`}
                  onClick={() => handleToggleFormat("jpg")}
                >
                  <div className="export-format-card__header">
                    <span className="export-format-card__icon">📸</span>
                    <span className="export-format-card__badge">IMAGE</span>
                  </div>
                  <h4 className="export-format-card__title">JPG</h4>
                  <p className="export-format-card__desc">Compact web sharing with solid backgrounds</p>
                </button>

                {/* SVG */}
                <button
                  type="button"
                  className={`export-format-card ${options.formats.includes("svg") ? "export-format-card--selected" : ""}`}
                  onClick={() => handleToggleFormat("svg")}
                >
                  <div className="export-format-card__header">
                    <span className="export-format-card__icon">📐</span>
                    <span className="export-format-card__badge">VECTOR</span>
                  </div>
                  <h4 className="export-format-card__title">SVG</h4>
                  <p className="export-format-card__desc">Named part layers for Illustrator & Figma</p>
                </button>

                {/* PDF */}
                <button
                  type="button"
                  className={`export-format-card ${options.formats.includes("pdf") ? "export-format-card--selected" : ""}`}
                  onClick={() => handleToggleFormat("pdf")}
                >
                  <div className="export-format-card__header">
                    <span className="export-format-card__icon">📋</span>
                    <span className="export-format-card__badge">SHEET</span>
                  </div>
                  <h4 className="export-format-card__title">PDF Tech Pack</h4>
                  <p className="export-format-card__desc">Multi-angle spec sheet, BOM & swatches</p>
                </button>

                {/* GLB 3D */}
                <button
                  type="button"
                  className={`export-format-card ${options.formats.includes("glb") ? "export-format-card--selected" : ""}`}
                  onClick={() => handleToggleFormat("glb")}
                >
                  <div className="export-format-card__header">
                    <span className="export-format-card__icon">👟</span>
                    <span className="export-format-card__badge">3D ASSET</span>
                  </div>
                  <h4 className="export-format-card__title">GLB / glTF</h4>
                  <p className="export-format-card__desc">3D printing, AR viewer & game engines</p>
                </button>

                {/* JSON Project */}
                <button
                  type="button"
                  className={`export-format-card ${options.formats.includes("json") ? "export-format-card--selected" : ""}`}
                  onClick={() => handleToggleFormat("json")}
                >
                  <div className="export-format-card__header">
                    <span className="export-format-card__icon">💾</span>
                    <span className="export-format-card__badge">PROJECT</span>
                  </div>
                  <h4 className="export-format-card__title">Studio JSON</h4>
                  <p className="export-format-card__desc">Re-importable project state schema</p>
                </button>

                {/* Turntable Video (Pro) */}
                <button
                  type="button"
                  className={`export-format-card ${options.formats.includes("turntable") ? "export-format-card--selected" : ""}`}
                  onClick={() => handleToggleFormat("turntable")}
                >
                  <div className="export-format-card__header">
                    <span className="export-format-card__icon">🎬</span>
                    <span className="export-format-card__badge" style={{ background: "#fef08a", color: "#854d0e" }}>
                      PRO MOTION
                    </span>
                  </div>
                  <h4 className="export-format-card__title">360° Turntable</h4>
                  <p className="export-format-card__desc">Smooth 360-spin video loop (MP4 / WebM)</p>
                </button>
              </div>
            </section>

            {/* Views Selection */}
            <section className="export-section">
              <div className="export-section__heading">
                <h3 className="export-section__title">
                  <span>🎯</span> Angles & Views
                </h3>
                <button
                  type="button"
                  className="export-toggle-pill"
                  onClick={handleSelectAllViews}
                  style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem" }}
                >
                  {options.views.length === ALL_VIEWS.length ? "Reset to 3/4" : "Select All Views"}
                </button>
              </div>

              <div className="export-toggle-pills">
                {ALL_VIEWS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`export-toggle-pill ${options.views.includes(v) ? "export-toggle-pill--active" : ""}`}
                    onClick={() => handleToggleView(v)}
                  >
                    {VIEW_LABELS[v]}
                  </button>
                ))}
              </div>
            </section>

            {/* Resolution & Background Selection */}
            <div className="export-dual-row">
              {/* Resolution */}
              <section className="export-section">
                <h3 className="export-section__title">
                  <span>🔍</span> Resolution
                </h3>
                <div className="export-toggle-pills">
                  {(["1x", "2x", "4x"] as ExportResolution[]).map((res) => (
                    <button
                      key={res}
                      type="button"
                      className={`export-toggle-pill ${options.resolution === res ? "export-toggle-pill--active" : ""}`}
                      onClick={() => setOptions((p) => ({ ...p, resolution: res }))}
                    >
                      {res} ({res === "1x" ? "1K" : res === "2x" ? "2K" : "4K"})
                    </button>
                  ))}
                </div>
              </section>

              {/* Background */}
              <section className="export-section">
                <h3 className="export-section__title">
                  <span>🎨</span> Background
                </h3>
                <div className="export-toggle-pills">
                  {(["transparent", "white", "brand", "custom"] as ExportBackground[]).map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      className={`export-toggle-pill ${options.background === bg ? "export-toggle-pill--active" : ""}`}
                      onClick={() => setOptions((p) => ({ ...p, background: bg }))}
                    >
                      {bg === "transparent" ? "Alpha" : bg.charAt(0).toUpperCase() + bg.slice(1)}
                    </button>
                  ))}
                </div>

                {options.background === "custom" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <input
                      type="color"
                      value={options.customBgColor}
                      onChange={(e) => setOptions((p) => ({ ...p, customBgColor: e.target.value }))}
                      style={{ width: "36px", height: "36px", borderRadius: "8px", cursor: "pointer", border: "none" }}
                    />
                    <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{options.customBgColor}</span>
                  </div>
                )}
              </section>
            </div>

            {/* Toggles */}
            <section className="export-section">
              <h3 className="export-section__title">
                <span>⚙️</span> Overlays & Styling
              </h3>
              <div className="export-check-group">
                <label className="export-checkbox-label">
                  <input
                    type="checkbox"
                    className="export-checkbox-input"
                    checked={options.includeShadow}
                    onChange={(e) => setOptions((p) => ({ ...p, includeShadow: e.target.checked }))}
                  />
                  Floor Shadow
                </label>
                <label className="export-checkbox-label">
                  <input
                    type="checkbox"
                    className="export-checkbox-input"
                    checked={options.includeSwatches}
                    onChange={(e) => setOptions((p) => ({ ...p, includeSwatches: e.target.checked }))}
                  />
                  Colorway Swatches
                </label>
                <label className="export-checkbox-label">
                  <input
                    type="checkbox"
                    className="export-checkbox-input"
                    checked={options.includeWatermark}
                    onChange={(e) => setOptions((p) => ({ ...p, includeWatermark: e.target.checked }))}
                  />
                  Studio Stamp
                </label>
              </div>
            </section>

            {/* Filename */}
            <section className="export-section">
              <h3 className="export-section__title">
                <span>🏷️</span> File Name
              </h3>
              <div className="export-filename-box">
                <input
                  type="text"
                  className="export-input"
                  value={options.filename || design.name}
                  onChange={(e) => setOptions((p) => ({ ...p, filename: e.target.value }))}
                  placeholder="e.g. cyber-neon-jordan"
                />
              </div>
            </section>

            {/* Error Message */}
            {exportError && (
              <div className="export-error-card">
                <span className="export-error-card__msg">⚠️ {exportError}</span>
                <button type="button" className="export-error-card__retry" onClick={handleStartExport}>
                  Retry
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Sticky Action Footer */}
        <footer className="export-footer">
          <div className="export-footer__stats">
            <div className="export-stat-badge">
              <span className="export-stat-badge__val">{stats.totalFiles}</span>
              <span className="export-stat-badge__lbl">Files</span>
            </div>
            <div className="export-stat-badge">
              <span className="export-stat-badge__val">~{totalFormattedSize} MB</span>
              <span className="export-stat-badge__lbl">Est. Size</span>
            </div>
          </div>

          <div className="export-footer__actions">
            <button
              type="button"
              className="export-btn-share"
              onClick={handleCopyShareLink}
              title="Copy link to view this sneaker"
            >
              {shareCopied ? "✓ Link Copied!" : "🔗 Share Link"}
            </button>

            <button
              type="button"
              className="export-btn-primary"
              onClick={handleStartExport}
              disabled={isExporting}
            >
              <span>Export</span>
              <span aria-hidden="true">👟</span>
            </button>
          </div>
        </footer>

        {/* Progress State Overlay */}
        {isExporting && (
          <div className="export-progress-panel">
            <span className="export-header__badge">PROCESSING DROP</span>
            <h3 className="export-progress-panel__title">Generating Assets...</h3>

            <div className="export-progress-bar-container">
              <div
                className="export-progress-bar-fill"
                style={{ width: `${progress?.percentage || 10}%` }}
              />
            </div>

            <p className="export-progress-status">
              {progress?.currentStep || "Preparing renders off-thread..."} ({progress?.percentage || 0}%)
            </p>

            <button
              type="button"
              className="export-btn-cancel"
              onClick={handleCancelExport}
            >
              Cancel Export
            </button>
          </div>
        )}

        {/* Celebratory Success State Overlay */}
        {results && (
          <div className="export-success-panel">
            <div className="export-success-hero">
              <span className="export-success-tag">DROP SECURED 🚀</span>
              <h3 className="export-success-title">Export Complete. Go Flex It.</h3>
              <p style={{ color: "#94a3b8", maxWidth: "600px", margin: 0, fontSize: "0.95rem" }}>
                All high-fidelity sneaker renders and spec files have been generated at uncompressed studio quality.
              </p>

              {/* Stat Counters */}
              <div className="export-success-stat-grid">
                <div className="export-big-stat">
                  <span className="export-big-stat__number">{results.length}</span>
                  <span className="export-big-stat__label">Files Ready</span>
                </div>
                <div className="export-big-stat">
                  <span className="export-big-stat__number">
                    {(results.reduce((acc, r) => acc + r.size, 0) / (1024 * 1024)).toFixed(1)}
                  </span>
                  <span className="export-big-stat__label">Total MB</span>
                </div>
                <div className="export-big-stat">
                  <span className="export-big-stat__number">{options.resolution.toUpperCase()}</span>
                  <span className="export-big-stat__label">Resolution</span>
                </div>
              </div>
            </div>

            {/* Individual Files List */}
            <div className="export-success-list-container">
              <h4 className="export-success-list-heading">Individual Downloads</h4>
              <div className="export-success-files-grid">
                {results.map((item, idx) => (
                  <div key={idx} className="export-file-row">
                    <div className="export-file-row__info">
                      <span className="export-file-row__icon">
                        {item.format === "png" || item.format === "jpg"
                          ? "🖼️"
                          : item.format === "pdf"
                          ? "📋"
                          : item.format === "glb"
                          ? "👟"
                          : item.format === "svg"
                          ? "📐"
                          : item.format === "turntable"
                          ? "🎬"
                          : "💾"}
                      </span>
                      <div>
                        <div className="export-file-row__name">{item.filename}</div>
                        <div className="export-file-row__size">
                          {(item.size / 1024).toFixed(0)} KB • {item.format.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="export-file-row__btn"
                      onClick={() => triggerDownload(item.blob, item.filename)}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Bottom Actions */}
            <div className="export-success-footer">
              <button
                type="button"
                className="export-view-pill"
                onClick={() => {
                  setResults(null);
                }}
              >
                ← Change Settings
              </button>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="export-btn-share"
                  onClick={handleCopyShareLink}
                >
                  {shareCopied ? "✓ Link Copied!" : "🔗 Copy Share Link"}
                </button>

                <button
                  type="button"
                  className="export-btn-primary"
                  onClick={handleDownloadAllZip}
                  disabled={isZipping}
                >
                  <span>{isZipping ? "Packing ZIP..." : "Download All (ZIP)"}</span>
                  <span aria-hidden="true">📦</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
