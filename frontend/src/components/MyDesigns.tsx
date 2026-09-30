import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import type { SavedDesign } from "../store/DesignTypes";

import SneakerSvgPreview from "./SneakerSvgPreview";

import { getDesigns, deleteDesign } from "../api/designApi";

import {
  getCachedDesigns,
  cacheDesigns,
  removeCachedDesign,
} from "../utils/designStorage";

function MyDesigns() {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const loadDesigns = async () => {
      /*
       * 1. Show cached designs
       *    immediately
       */
      const cachedDesigns = getCachedDesigns();

      if (cachedDesigns.length > 0) {
        setDesigns(cachedDesigns);
      }

      try {
        /*
         * 2. Get latest
         *    designs from MySQL
         */
        const serverDesigns = await getDesigns();

        /*
         * 3. Update UI
         */
        setDesigns(serverDesigns);

        /*
         * 4. Replace cache
         */
        cacheDesigns(serverDesigns);
      } catch (error) {
        console.error("Failed to load designs:", error);
      }
    };

    loadDesigns();
  }, []);

  const handleDelete = async (id: number) => {
    console.log("DELETE ID:", id);
    try {
      /*
       * 1. Delete from MySQL
       */
      await deleteDesign(id);

      /*
       * 2. Remove from cache
       */
      removeCachedDesign(id);

      /*
       * 3. Remove from UI
       */
      setDesigns((currentDesigns) =>
        currentDesigns.filter((design) => design.id !== id),
      );
    } catch (error) {
      console.error("Failed to delete design:", error);
    }
  };

  return (
    <div className="my-designs">
      <header className="my-designs__header">
        <h1 className="my-designs__title">My Designs</h1>
      </header>

      <main className="my-designs__content">
        {designs.length === 0 ? (
          <p className="my-designs__empty">No saved designs yet.</p>
        ) : (
          <div className="my-designs__grid">
            {designs.map((design) => (
              <article key={design.id}>
                <div className="my-designs__preview">
                  <SneakerSvgPreview design={design} />
                </div>

                <h2>{design.name}</h2>

                <p>
                  Last updated: {new Date(design.updatedAt).toLocaleString()}
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => navigate(`/designs/${design.id}`)}
                  >
                    Open
                  </button>

                  <button type="button" onClick={() => handleDelete(design.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyDesigns;
