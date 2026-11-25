import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: { navCollapsed: false },
  reducers: {
    toggleNav(state) {
      state.navCollapsed = !state.navCollapsed;
    },
  },
});

export const { toggleNav } = uiSlice.actions;
export default uiSlice.reducer;
