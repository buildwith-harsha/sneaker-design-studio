import type { SavedDesign } from "../store/DesignTypes";

const STORAGE_KEY = "sneaker-designs";

export const getCachedDesigns = (): SavedDesign[] => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  return JSON.parse(stored);
};

export const getCachedDesign = (id: number): SavedDesign | undefined => {
  const designs = getCachedDesigns();

  return designs.find((design) => design.id === id);
};

export const cacheDesign = (design: SavedDesign): void => {
  const designs = getCachedDesigns();

  const index = designs.findIndex((item) => item.id === design.id);

  if (index === -1) {
    designs.push(design);
  } else {
    designs[index] = design;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
};

export const cacheDesigns = (designs: SavedDesign[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
};

export const removeCachedDesign = (id: number): void => {
  const designs = getCachedDesigns();

  const updatedDesigns = designs.filter((design) => design.id !== id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDesigns));
};
