import type { DesignStateSnapshot } from "./types";
import { normalizeSneakerModel } from "../data/sneakerModels";

/**
 * Encodes a design snapshot into a URL-safe base64 string for direct sharing.
 */
export function encodeDesignToShareUrl(design: DesignStateSnapshot): string {
  try {
    const minified = {
      n: design.name,
      m: design.model,
      c: design.components,
      mat: design.materials,
    };
    const jsonStr = JSON.stringify(minified);
    const b64 = btoa(encodeURIComponent(jsonStr));
    const url = new URL(window.location.origin + window.location.pathname);
    url.hash = `share=${b64}`;
    return url.toString();
  } catch (error) {
    console.error("Failed to encode design share link:", error);
    return window.location.href;
  }
}

/**
 * Decodes a share hash from the URL into a design snapshot.
 */
export function decodeDesignFromShareUrl(hashOrQuery: string): DesignStateSnapshot | null {
  try {
    const raw = hashOrQuery.replace(/^[#?]/, "");
    const params = new URLSearchParams(raw);
    const shareData = params.get("share");
    if (!shareData) return null;

    const jsonStr = decodeURIComponent(atob(shareData));
    const parsed = JSON.parse(jsonStr);

    if (!parsed || !parsed.c || !parsed.mat) return null;

    return {
      name: parsed.n || "Shared Sneaker Design",
      model: normalizeSneakerModel(parsed.m || "air-jordan"),
      components: parsed.c,
      materials: parsed.mat,
    };
  } catch (error) {
    console.warn("Could not decode shared sneaker design from link:", error);
    return null;
  }
}
