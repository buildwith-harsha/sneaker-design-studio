import ColorPicker from "./ColorPicker";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import SneakerPreview from "./SneakerPreview";
import { sneakerComponent as componentConfig } from "../data/sneakerComponent";
import { createDesign, getDesignById, updateDesign } from "../api/designApi";
import { getCachedDesign, cacheDesign } from "../utils/designStorage";
import { useEffect, useState } from "react";

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
import { useParams } from "react-router-dom";

import { sneakerModels, type SneakerModel } from "../data/sneakerModels";

function DesignEditor() {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const [designName, setDesignName] = useState("My Sneaker Design");

  //-------------- Redux State Selectors ----------------

  const model = useAppSelector((state) => state.design.model);

  const components = useAppSelector((state) => state.design.components);

  const componentMaterials = useAppSelector((state) => state.design.materials);

  const selectedComponent = useAppSelector(
    (state) => state.editor.selectedComponent,
  );

  const past = useAppSelector((state) => state.design.past);

  const future = useAppSelector((state) => state.design.future);

  //------------------------------------------------------

  const handleSave = async () => {
    const name = designName.trim() || "My Sneaker Design";

    const designData = {
      name,
      model,
      components: {
        ...components,
      },
      materials: {
        ...componentMaterials,
      },
    };

    try {
      /*
       * Existing design
       */
      if (id) {
        const designId = Number(id);

        const updatedDesign = await updateDesign(designId, {
          id: designId,
          ...designData,
        });

        cacheDesign(updatedDesign);

        return;
      }

      /*
       * New design
       */
      const savedDesign = await createDesign(designData);

      cacheDesign(savedDesign);
    } catch (error) {
      console.error("Failed to save design:", error);
    }
  };
  /*
   * Load an existing design
   */
  useEffect(() => {
    if (!id) {
      return;
    }

    const designId = Number(id);

    const loadExistingDesign = async () => {
      try {
        /*
         * 1. Load cache first
         */
        const cachedDesign = getCachedDesign(designId);

        if (cachedDesign) {
          setDesignName(cachedDesign.name);

          dispatch(
            loadDesign({
              model: cachedDesign.model,

              components: {
                ...cachedDesign.components,
              },

              materials: {
                ...cachedDesign.materials,
              },
            }),
          );
        }

        /*
         * 2. Get latest
         *    version from MySQL
         */
        const design = await getDesignById(designId);

        /*
         * 3. Update Redux
         */
        setDesignName(design.name);

        dispatch(
          loadDesign({
            model: design.model,

            components: {
              ...design.components,
            },

            materials: {
              ...design.materials,
            },
          }),
        );

        /*
         * 4. Refresh cache
         */
        cacheDesign(design);
      } catch (error) {
        console.error("Failed to load design:", error);
      }
    };

    loadExistingDesign();
  }, [id, dispatch]);

  return (
    <div className="design-editor">
      <header className="design-editor__header">
        <h1 className="design-editor__title">Sneaker Design Studio</h1>
      </header>

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
            />
          </div>

          {/* Sneaker Model */}
          <div className="design-editor__field">
            <label htmlFor="sneaker-model" className="design-editor__label">
              Sneaker Model
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

          <h2 className="design-editor__panel-title">Customize</h2>

          {!selectedComponent ? (
            <p className="design-editor__empty">
              Click a sneaker component to customize it.
            </p>
          ) : (
            <>
              {/* Selected Component */}
              <h3 className="design-editor__component">
                {componentConfig[selectedComponent].label}
              </h3>

              {/* Color */}
              <ColorPicker
                label="Color"
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

              {/* Material */}
              <div className="design-editor__field">
                <label
                  htmlFor="component-material"
                  className="design-editor__label"
                >
                  Material
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
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
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
              onClick={() => dispatch(undo())}
              disabled={past.length === 0}
            >
              ↶ Undo
            </button>

            <button
              type="button"
              onClick={() => dispatch(redo())}
              disabled={future.length === 0}
            >
              ↷ Redo
            </button>
          </div>

          {/* Reset */}
          <button type="button" onClick={() => dispatch(resetDesign())}>
            Reset Design
          </button>
        </aside>

        {/* Save */}
        <button type="button" onClick={handleSave}>
          Save Design
        </button>
      </main>
    </div>
  );
}

export default DesignEditor;
