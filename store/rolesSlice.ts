/**
 * Redux Slice: Roles State Management
 *
 * Purpose:
 * This file defines a Redux slice for managing user Roles in a central store.
 * It allows setting and clearing the list of Roles, which can then be used
 * throughout the application (e.g., for conditionally rendering UI or protecting routes).
 */

import { createSlice } from '@reduxjs/toolkit' // Import helper to create Redux slice

// Create a Redux slice for Roles
const slice = createSlice({
  name: 'roles',         // Slice name used in Redux state
  initialState: [],            // Initial state: an empty array of Roles
  reducers: {
    // Action to set Roles; replaces state with the payload
    setRoles: (_, action) => action.payload,

    // Action to clear Roles; resets state to an empty array
    clearRoles: () => []
  }
})

// Export the generated actions for use in dispatch
export const { setRoles, clearRoles } = slice.actions

// Export the reducer to be included in the Redux store
export default slice.reducer