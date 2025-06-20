/**
 * Redux Slice: Roles State Management
 *
 * Purpose:
 * This file defines a Redux slice for managing user Roles in a central store.
 * It allows setting and clearing the list of Roles, which can then be used
 * throughout the application (e.g., for conditionally rendering UI or protecting routes).
 */

import { createSlice } from '@reduxjs/toolkit' // Import helper to create Redux slice
const initialState = {
    object_id: null,
    name: null,
    email: null,
    bp_no: null,
    phone_1: null,
    phone_2: null,
    address: null,
    blood_group: null,
    nid: null,
    dob: null,
    description: null,
    image: null,
    current_status: null,
    updated_at: null,
    isAuthenticated: false,
  };
// Create a Redux slice for Roles
const slice = createSlice({
  name: 'authUser',         // Slice name used in Redux state
  initialState: initialState,            // Initial state: an empty array of Roles
  reducers: {
    setAuthUser(state, action) {
      return { ...state, ...action.payload, isAuthenticated: true };
    },
    clearAuthUser(state) {
      return { ...initialState };
    },
  },
})

// Export the generated actions for use in dispatch
export const { setAuthUser, clearAuthUser } = slice.actions

// Export the reducer to be included in the Redux store
export default slice.reducer