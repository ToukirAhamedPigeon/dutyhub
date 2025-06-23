// src/store/fullPageLoaderSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FullPageLoaderState {
  isLoading: boolean;
  message: string;
  icon: string;
}

const initialState: FullPageLoaderState = {
  isLoading: false,
  message: 'Welcome to Duty Hub — Preparing your workspace',
  icon: 'DownloadCloudIcon',
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
    setLoader: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setLoaderContent: (
      state,
      action: PayloadAction<{ message?: string; icon?: string }>
    ) => {
      if (action.payload.message !== undefined) {
        state.message = action.payload.message;
      }
      if (action.payload.icon !== undefined) {
        state.icon = action.payload.icon;
      }
    },
  },
});

export const { showLoader, hideLoader, setLoader, setLoaderContent } =
  fullPageLoaderSlice.actions;
export default fullPageLoaderSlice.reducer;
