import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type SneakerModel, normalizeSneakerModel } from "../data/sneakerModels";
import type { SneakerMaterial } from "../data/materials";

export type SneakerComponent =
  | "upper"
  | "heel"
  | "tongue"
  | "midsole"
  | "outsole"
  | "laces"
  | "toe"
  | "logo";

interface DesignState {
  model: SneakerModel;
  components: Record<SneakerComponent, string>;
  materials: Record<SneakerComponent, SneakerMaterial>;
  past: Record<SneakerComponent, string>[];
  future: Record<SneakerComponent, string>[];
}

const initialState: DesignState = {
  model: "air-jordan",

  components: {
    upper: "#B22222",
    heel: "#B22222",
    tongue: "#FFFFFF",
    midsole: "#FFFFFF",
    outsole: "#B22222",
    laces: "#111111",
    toe: "#FFFFFF",
    logo: "#111111",
  },
  materials: {
    upper: "leather",
    heel: "leather",
    tongue: "mesh",
    midsole: "rubber",
    outsole: "rubber",
    laces: "knit",
    toe: "leather",
    logo: "leather",
  },
  past: [],
  future: [],
};

const designSlice = createSlice({
  name: "design",

  initialState,

  reducers: {
    setComponentColor: (
      state,
      action: PayloadAction<{
        component: SneakerComponent;
        color: string;
      }>,
    ) => {
      state.past.push({ ...state.components });

      state.components[action.payload.component] = action.payload.color;

      state.future = [];
    },
    loadDesign: (
      state,
      action: PayloadAction<{
        model: SneakerModel;
        components: Record<SneakerComponent, string>;
        materials: Record<SneakerComponent, SneakerMaterial>;
      }>,
    ) => {
      state.model = normalizeSneakerModel(action.payload.model);

      state.components = {
        ...action.payload.components,
      };

      state.materials = {
        ...action.payload.materials,
      };

      state.past = [];
      state.future = [];
    },

    setModel: (state, action: PayloadAction<SneakerModel>) => {
      state.model = action.payload;
    },

    setComponentMaterial: (
      state,
      action: PayloadAction<{
        component: SneakerComponent;
        material: SneakerMaterial;
      }>,
    ) => {
      state.materials[action.payload.component] = action.payload.material;
    },

    undo: (state) => {
      if (state.past.length > 0) {
        const previousState = state.past.pop()!;
        state.future.push({ ...state.components });
        state.components = previousState;
      }
    },
    redo: (state) => {
      if (state.future.length > 0) {
        const nextState = state.future.pop()!;
        state.past.push({ ...state.components });
        state.components = nextState;
      }
    },

    resetDesign: (state) => {
      state.past.push({ ...state.components });
      state.components = initialState.components;
      state.future = [];
    },
  },
});

export const {
  setComponentColor,
  loadDesign,
  resetDesign,
  undo,
  redo,
  setModel,
  setComponentMaterial,
} = designSlice.actions;

export default designSlice.reducer;
