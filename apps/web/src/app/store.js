import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import ui from "./uiSlice.js";

const persisted = persistReducer({ key: "np-ui", storage, whitelist: ["ui"] }, combineReducers({ ui }));

export const store = configureStore({
  reducer: persisted,
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});

export const persistor = persistStore(store);
