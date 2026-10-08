import { configureStore } from "@reduxjs/toolkit";
import designReducer from "./DesignSlice";
import editorReducer from "./editorSlice";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    design: designReducer,
    editor: editorReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;