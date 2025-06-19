/**
 * Permission-Based Conditional Rendering Component
 *
 * Purpose:
 * This component conditionally renders its children based on user permissions.
 * It checks if the current user's permissions satisfy the required `allOf` or `anyOf` conditions.
 * If the conditions are not met, it renders nothing (null).
 */

"use client";

import { ReactNode } from 'react';           // Import ReactNode type for typing children prop
import { useSelector } from 'react-redux';  // Import useSelector hook to access Redux store

// Define the expected props type for the Can component
interface CanProps {
  allOf?: string[];      // Permissions all of which must be present
  anyOf?: string[];      // Permissions any of which must be present
  children: ReactNode;   // React children to conditionally render
}

export const Can = ({ allOf = [], anyOf = [], children }: CanProps) => {
  // Access the current user's permissions from Redux state
  // Replace 'any' with your app's RootState type for stronger typing if available
  const permissions = useSelector((state: any) => state.permissions);

  // Check if all required permissions (allOf) are included in user's permissions
  const all = allOf.every(p => permissions.includes(p));

  // Check if any of the permissions (anyOf) are included in user's permissions
  const any = anyOf.some(p => permissions.includes(p));

  // If 'allOf' is specified but not all permissions present, or
  // 'anyOf' is specified but none are present, do not render children
  if ((allOf.length && !all) || (anyOf.length && !any)) return null;

  // If conditions met, render the children inside a React fragment
  return <>{children}</>;
};