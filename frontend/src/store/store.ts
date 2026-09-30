import { configureStore } from "@reduxjs/toolkit";

import designReducer from "./DesignSlice";
import editorReducer from "./editorSlice";

export const store = configureStore({
  reducer: {
    design: designReducer,
    editor: editorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;