import ColorPicker from "./ColorPicker";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import SneakerPreview from "./SneakerPreview";
import { sneakerComponent as componentConfig } from "../data/sneakerComponent";
import {
  createDesign,
  getDesignById,
  updateDesign,
  getDesignVersions,
  restoreDesignVersion,
} from "../api/designApi";
import { getCachedDesign, cacheDesign } from "../utils/designStorage";
import { useEffect, useState, useCallback } from "react";
import { materials, type SneakerMaterial } from "../data/materials";
import {
  setComponentColor,
  setComponentMaterial,
  resetDesign,
  undo,
  redo,
  loadDesign,
  setModel,
} from "../store/DesignSlice";
import { useParams, useNavigate, Link } from "react-router-dom";
import { sneakerModels, type SneakerModel } from "../data/sneakerModels";
import type { DesignVersion } from "../store/DesignTypes";
import "../assets/css/design-editor.css";

export default function DesignEditor() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [designName, setDesignName] = useState("My Sneaker Design");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Version History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Redux Selectors
  const model = useAppSelector((state) => state.design.model);
  const components = useAppSelector((state) => state.design.components);
  const componentMaterials = useAppSelector((state) => state.design.materials);
  const selectedComponent = useAppSelector(
    (state) => state.editor.selectedComponent,
  );
  const past = useAppSelector((state) => state.design.past);
  const future = useAppSelector((state) => state.design.future);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Save Design handler
  const handleSave = async () => {
    setSaving(true);
    const name = designName.trim() || "My Sneaker Design";

    const designData = {
      name,
      model,
      components: { ...components },
      materials: { ...componentMaterials },
    };

    try {
      if (id) {
        const designId = Number(id);
        const updatedDesign = await updateDesign(designId, {
          id: designId,
          ...designData,
          change_summary: `Updated ${new Date().toLocaleTimeString()}`,
        });

        cacheDesign(updatedDesign);
        showToast("✓ Design and version history saved!");
      } else {
        const savedDesign = await createDesign(designData);
        cacheDesign(savedDesign);
        showToast("✓ Design created successfully!");
        navigate(`/studio/${savedDesign.id}`, { replace: true });
      }
    } catch (error) {
      console.error("Failed to save design:", error);
      showToast("⚠️ Failed to save design. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Load existing design on mount or ID change
  useEffect(() => {
    if (!id) return;

    const designId = Number(id);
    const loadExistingDesign = async () => {
      // 1. Load cache first
      const cached = getCachedDesign(designId);
      if (cached) {
        setDesignName(cached.name);
        dispatch(
          loadDesign({
            model: cached.model,
            components: { ...cached.components },
            materials: { ...cached.materials },
          }),
        );
      }

      // 2. Refresh from server
      try {
        const design = await getDesignById(designId);
        setDesignName(design.name);
        dispatch(
          loadDesign({
            model: design.model,
            components: { ...design.components },
            materials: { ...design.materials },
          }),
        );
        cacheDesign(design);
      } catch (error) {
        console.error("Failed to fetch design:", error);
      }
    };

    loadExistingDesign();
  }, [id, dispatch]);

  // Fetch Version History
  const handleOpenHistory = async () => {
    if (!id) return;
    setShowHistoryModal(true);
    setLoadingVersions(true);
    try {
      const data = await getDesignVersions(Number(id));
      setVersions(data);
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Restore a Version
  const handleRestoreVersion = async (versionNumber: number) => {
    if (!id) return;
    try {
      const restored = await restoreDesignVersion(Number(id), versionNumber);
      setDesignName(restored.name);
      dispatch(
        loadDesign({
          model: restored.model,
          components: { ...restored.components },
          materials: { ...restored.materials },
        }),
      );
      cacheDesign(restored);
      setShowHistoryModal(false);
      showToast(`✓ Restored to Version ${versionNumber}!`);
    } catch (err) {
      console.error("Failed to restore version:", err);
      showToast("⚠️ Could not restore version.");
    }
  };

  return (
    <div className="design-editor">
      <header className="design-editor__header">
        <div className="design-editor__header-left">
          <Link to="/designs" className="design-editor__back-link">
            ← My Collection
          </Link>
          <h1 className="design-editor__title">
            {id ? `Editing: ${designName}` : "Create New Sneaker"}
          </h1>
        </div>

        <div className="design-editor__header-right">
          {id && (
            <button
              type="button"
              className="design-editor__history-btn"
              onClick={handleOpenHistory}
            >
              📜 Version History
            </button>
          )}

          <button
            type="button"
            className="design-editor__save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "💾 Save Design"}
          </button>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="design-editor__toast">{toastMessage}</div>
      )}

      {/* Version History Modal */}
      {showHistoryModal && (
        <div
          className="version-modal-backdrop"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="version-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="version-modal__header">
              <h2 className="version-modal__title">📜 Design Version History</h2>
              <button
                type="button"
                className="version-modal__close"
                onClick={() => setShowHistoryModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="version-modal__body">
              {loadingVersions ? (
                <p>Loading version history...</p>
              ) : versions.length === 0 ? (
                <p>No saved versions found.</p>
              ) : (
                versions.map((ver, idx) => (
                  <div key={ver.id || ver.version_number} className="version-item">
                    <div className="version-item__info">
                      <div className="version-item__tag">
                        v{ver.version_number} {idx === 0 ? "• Latest" : ""}
                      </div>
                      <div className="version-item__name">
                        {ver.change_summary || ver.name}
                      </div>
                      <div className="version-item__date">
                        {new Date(ver.created_at).toLocaleString()}
                      </div>
                      <div className="version-item__palette">
                        {Object.values(ver.components)
                          .slice(0, 6)
                          .map((color, cIdx) => (
                            <span
                              key={cIdx}
                              className="version-item__dot"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="version-item__restore-btn"
                      onClick={() => handleRestoreVersion(ver.version_number)}
                    >
                      ↩ Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <main className="design-editor__workspace">
        <section className="design-editor__preview">
          <SneakerPreview />
        </section>

        <aside className="design-editor__panel">
          {/* Design Name */}
          <div className="design-editor__field">
            <label htmlFor="design-name" className="design-editor__label">
              Design Name
            </label>
            <input
              id="design-name"
              type="text"
              value={designName}
              onChange={(event) => setDesignName(event.target.value)}
              className="design-editor__input"
              placeholder="e.g. Cyberpunk Runner"
            />
          </div>

          {/* Sneaker Model */}
          <div className="design-editor__field">
            <label htmlFor="sneaker-model" className="design-editor__label">
              Sneaker Silhouette
            </label>
            <select
              id="sneaker-model"
              value={model}
              onChange={(event) =>
                dispatch(setModel(event.target.value as SneakerModel))
              }
              className="design-editor__input"
            >
              {Object.entries(sneakerModels).map(([modelId, modelConfig]) => (
                <option key={modelId} value={modelId}>
                  {modelConfig.name}
                </option>
              ))}
            </select>
          </div>

          <h2 className="design-editor__panel-title">🎨 Color & Materials</h2>

          {!selectedComponent ? (
            <div className="design-editor__empty">
              Click any sneaker part on the canvas to customize its color and material.
            </div>
          ) : (
            <>
              <div className="design-editor__component-badge">
                Selected: {componentConfig[selectedComponent].label}
              </div>

              {/* Color Picker */}
              <ColorPicker
                label="Component Color"
                value={components[selectedComponent]}
                onChange={(color) => {
                  dispatch(
                    setComponentColor({
                      component: selectedComponent,
                      color,
                    }),
                  );
                }}
              />

              {/* Material Dropdown */}
              <div className="design-editor__field" style={{ marginTop: "1rem" }}>
                <label
                  htmlFor="component-material"
                  className="design-editor__label"
                >
                  Surface Material
                </label>
                <select
                  id="component-material"
                  value={componentMaterials[selectedComponent]}
                  onChange={(event) =>
                    dispatch(
                      setComponentMaterial({
                        component: selectedComponent,
                        material: event.target.value as SneakerMaterial,
                      }),
                    )
                  }
                  className="design-editor__input"
                >
                  {materials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Undo / Redo */}
          <div className="design-editor__actions">
            <button
              type="button"
              className="design-editor__action-btn"
              onClick={() => dispatch(undo())}
              disabled={past.length === 0}
            >
              ↶ Undo
            </button>

            <button
              type="button"
              className="design-editor__action-btn"
              onClick={() => dispatch(redo())}
              disabled={future.length === 0}
            >
              ↷ Redo
            </button>
          </div>

          {/* Reset */}
          <button
            type="button"
            className="design-editor__reset-btn"
            onClick={() => dispatch(resetDesign())}
          >
            Reset to Default Colors
          </button>
        </aside>
      </main>
    </div>
  );
}
