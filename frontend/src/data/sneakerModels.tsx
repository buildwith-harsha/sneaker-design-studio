import RunnerSvg from "../assets/sneakers/runner-v1.svg?react";
import CourtSvg from "../assets/sneakers/court-v1.svg?react";
import LifestyleSvg from "../assets/sneakers/lifestyle-v1.svg?react";

export const sneakerModels = {
  "runner-v1": {
    name: "Runner",
    component: RunnerSvg,
  },

  "court-v1": {
    name: "Court",
    component: CourtSvg,
  },

  "lifestyle-v1": {
    name: "Lifestyle",
    component: LifestyleSvg,
  },
} as const;

export type SneakerModel = keyof typeof sneakerModels;
