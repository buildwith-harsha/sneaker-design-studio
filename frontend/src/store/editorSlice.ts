import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SneakerComponent } from "./DesignSlice";

interface EditorState {
  selectedComponent: SneakerComponent | null;
}

const initialState: EditorState = {
  selectedComponent: null,
};

const editorSlice = createSlice({
  name: "editor",

  initialState,

  reducers: {
    setSelectedComponent: (
      state,
      action: PayloadAction<SneakerComponent | null>
    ) => {
      state.selectedComponent = action.payload;
    },
  },
});

export const {
  setSelectedComponent,
} = editorSlice.actions;

export default editorSlice.reducer;