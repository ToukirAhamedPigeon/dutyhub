/**
 * Redux Store Configuration
 *
 * Purpose:
 * This file sets up and exports the Redux store using Redux Toolkit.
 * It registers the `permissions` slice reducer so that components can access and manage
 * user permissions globally throughout the application.
 */

import { configureStore } from '@reduxjs/toolkit' // Import the store configuration utility from Redux Toolkit
import permissionsReducer from './permissionsSlice' // Import the reducer for the permissions slice
import authUserReducer from './authUserSlice' // Import the reducer for the permissions slice
import rolesReducer from './rolesSlice' // Import the reducer for the permissions slice
import fullPageLoader from './fullPageLoaderSlice' // Import the reducer for the permissions slice
import sidebarSlice from './sidebarSlice' // Import the reducer for the permissions slice

// Create and export the Redux store
export const store= configureStore({
  reducer: {
    // Register the permissions reducer under the 'permissions' key in the store
    authUser: authUserReducer,
    permissions: permissionsReducer,
    roles: rolesReducer,
    fullPageLoader: fullPageLoader,
    sidebar: sidebarSlice
  }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
