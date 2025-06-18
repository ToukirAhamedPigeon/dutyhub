/**
 * Redux Slice: Permissions State Management
 *
 * Purpose:
 * This file defines a Redux slice for managing user permissions in a central store.
 * It allows setting and clearing the list of permissions, which can then be used
 * throughout the application (e.g., for conditionally rendering UI or protecting routes).
 */

import { createSlice } from '@reduxjs/toolkit' // Import helper to create Redux slice

// Create a Redux slice for permissions
const slice = createSlice({
  name: 'permissions',         // Slice name used in Redux state
  initialState: [],            // Initial state: an empty array of permissions
  reducers: {
    // Action to set permissions; replaces state with the payload
    setPermissions: (_, action) => action.payload,

    // Action to clear permissions; resets state to an empty array
    clearPermissions: () => []
  }
})

// Export the generated actions for use in dispatch
export const { setPermissions, clearPermissions } = slice.actions

// Export the reducer to be included in the Redux store
export default slice.reducer