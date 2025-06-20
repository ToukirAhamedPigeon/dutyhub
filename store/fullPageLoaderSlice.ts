// src/store/fullPageLoaderSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface FullPageLoaderState {
  isLoading: boolean;
}

const initialState: FullPageLoaderState = {
  isLoading: false,
};

const fullPageLoaderSlice = createSlice({
  name: 'fullPageLoader',
  initialState,
  reducers: {
    showLoader: (state) => {
      state.isLoading = true;
    },
    hideLoader: (state) => {
      state.isLoading = false;
    },
    setLoader: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { showLoader, hideLoader, setLoader } = fullPageLoaderSlice.actions;
export default fullPageLoaderSlice.reducer;
