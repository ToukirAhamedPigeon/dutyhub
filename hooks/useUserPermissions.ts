/**
 * Custom React Hook to Manage User Permissions
 *
 * Purpose:
 * This hook fetches and initializes the user's permissions either from localStorage or
 * via an API call if the user session exists. It then stores those permissions in the Redux store
 * for use throughout the application.
 */

import { Session } from 'next-auth';              // Import Session type from next-auth for typing
import { useEffect } from 'react'                  // Import useEffect React hook
import { useDispatch } from 'react-redux'          // Import useDispatch hook to dispatch Redux actions
import { setPermissions } from '@/store/permissionsSlice'  // Import Redux action to set permissions

export function useUserPermissions(session: Session | null) {
  const dispatch = useDispatch()                    // Get the dispatch function from Redux

  useEffect(() => {                                 // Run this effect whenever `session` changes
    const init = async () => {
      const existing = localStorage.getItem('permissions')  // Check if permissions are stored in localStorage
      if (existing) {
        dispatch(setPermissions(JSON.parse(existing)))       // If found, parse and dispatch to Redux store
      } else if (session) {                                   // If not in localStorage but session exists
        const res = await fetch('/api/auth/permissions')     // Fetch permissions from API
        const data = await res.json()                         // Parse JSON response
        localStorage.setItem('permissions', JSON.stringify(data.permissions))  // Cache permissions in localStorage
        dispatch(setPermissions(data.permissions))            // Dispatch permissions to Redux store
      }
    }

    init()  // Run the async init function inside useEffect
  }, [session])  // Dependency: run effect again if session changes
}
