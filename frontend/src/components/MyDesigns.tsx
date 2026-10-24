import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { SavedDesign, PaginationMeta } from "../store/DesignTypes";
import SneakerSvgPreview from "./SneakerSvgPreview";
import { getDesigns, deleteDesign } from "../api/designApi";
import {
  getCachedDesigns,
  cacheDesigns,
  removeCachedDesign,
} from "../utils/designStorage";
import "../assets/css/MyDesigns.css";

const MODEL_OPTIONS = [
  { id: "all", label: "All Models" },
  { id: "air-jordan", label: "Air Jordan" },
  { id: "runner", label: "Retro Runner" },
];

export default function MyDesigns() {
  const [designs, setDesigns] = useState<SavedDesign[]>(() => getCachedDesigns());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "name_asc" | "name_desc" | "updated"
  >("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const navigate = useNavigate();

  const fetchDesigns = useCallback(
    async (pageToFetch = currentPage) => {
      setLoading(true);
      try {
        const response = await getDesigns({
          search: search.trim() || undefined,
          model: selectedModel !== "all" ? selectedModel : undefined,
          sort: sortBy,
          page: pageToFetch,
          limit: 6,
        });

        setDesigns(response.designs);
        setPagination(response.pagination);
        cacheDesigns(response.designs);
      } catch (error) {
        console.error("Failed to load designs:", error);
      } finally {
        setLoading(false);
      }
    },
    [search, selectedModel, sortBy, currentPage],
  );

  // Initial load showing cached designs if available, then fresh
  useEffect(() => {
    void Promise.resolve().then(() => fetchDesigns(1));
  }, [fetchDesigns]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDesigns(1);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm("Are you sure you want to delete this sneaker design?")
    ) {
      return;
    }

    try {
      await deleteDesign(id);
      removeCachedDesign(id);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      // Re-fetch to update pagination counts
      fetchDesigns(currentPage);
    } catch (error) {
      console.error("Failed to delete design:", error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchDesigns(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="my-designs">
      <div className="my-designs__header">
        <div className="my-designs__header-top">
          <div className="my-designs__title-group">
            <span className="my-designs__badge">👟 Studio Collection</span>
            <h1 className="my-designs__title">My Custom Sneakers</h1>
            <p className="my-designs__subtitle">
              Manage, edit, and explore your personal sneaker collection
            </p>
          </div>

          <Link to="/studio" className="my-designs__new-btn">
            <span>✨</span> Create New Design
          </Link>
        </div>

        {/* Controls: Search, Filters, Sorting */}
        <div className="my-designs__controls">
          <div className="my-designs__controls-row">
            {/* Search Input */}
            <div className="my-designs__search-box">
              <span>🔍</span>
              <input
                type="text"
                className="my-designs__search-input"
                placeholder="Search sneakers by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="my-designs__search-clear"
                  onClick={() => setSearch("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="my-designs__sort-group">
              <label htmlFor="sort-select" className="my-designs__sort-label">
                Sort By:
              </label>
              <select
                id="sort-select"
                className="my-designs__sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name (A - Z)</option>
                <option value="name_desc">Name (Z - A)</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>
          </div>

          {/* Model Filter Chips */}
          <div className="my-designs__filter-chips">
            {MODEL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`my-designs__filter-chip ${
                  selectedModel === opt.id
                    ? "my-designs__filter-chip--active"
                    : ""
                }`}
                onClick={() => {
                  setSelectedModel(opt.id);
                  setCurrentPage(1);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="my-designs__content">
        {loading && designs.length === 0 ? (
          <div className="my-designs__empty">
            <div className="my-designs__empty-icon">⏳</div>
            <h3 className="my-designs__empty-title">Loading Collection...</h3>
            <p className="my-designs__empty-text">
              Retrieving your custom sneaker designs
            </p>
          </div>
        ) : designs.length === 0 ? (
          <div className="my-designs__empty">
            <div className="my-designs__empty-icon">👟</div>
            <h3 className="my-designs__empty-title">No Sneakers Found</h3>
            <p className="my-designs__empty-text">
              {search || selectedModel !== "all"
                ? "No sneakers matched your filter criteria. Try resetting your search."
                : "You haven't crafted any sneaker designs yet. Launch the studio to get started!"}
            </p>
            <Link to="/studio" className="my-designs__new-btn">
              Design Your First Pair
            </Link>
          </div>
        ) : (
          <>
            <div className="my-designs__grid">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className="my-designs__card"
                  onClick={() => navigate(`/studio/${design.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="my-designs__preview-container">
                    <span className="my-designs__model-tag">
                      {design.model || "Air Jordan"}
                    </span>
                    <div className="my-designs__preview-canvas">
                      <SneakerSvgPreview design={design} />
                    </div>
                  </div>

                  <div className="my-designs__details">
                    <div className="my-designs__card-header">
                      <h3 className="my-designs__name">{design.name}</h3>
                    </div>

                    {/* Color palette preview */}
                    <div className="my-designs__palette">
                      {design.components &&
                        Object.values(design.components)
                          .slice(0, 6)
                          .map((color, idx) => (
                            <span
                              key={idx}
                              className="my-designs__palette-dot"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                    </div>

                    <div className="my-designs__meta">
                      <span>Created {formatDate(design.createdAt)}</span>
                      <span>ID #{design.id}</span>
                    </div>

                    <div className="my-designs__actions">
                      <Link
                        to={`/studio/${design.id}`}
                        className="my-designs__open-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open in Studio
                      </Link>
                      <button
                        type="button"
                        className="my-designs__delete-btn"
                        onClick={(e) => handleDelete(design.id, e)}
                        title="Delete design"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="my-designs__pagination">
                <span className="my-designs__pagination-info">
                  Showing page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} total sneaker designs)
                </span>

                <div className="my-designs__pagination-controls">
                  <button
                    type="button"
                    className="my-designs__page-btn"
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ← Prev
                  </button>

                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1,
                  ).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`my-designs__page-btn ${
                        pageNum === currentPage
                          ? "my-designs__page-btn--active"
                          : ""
                      }`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="my-designs__page-btn"
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
