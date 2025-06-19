/**
 * API Route: /api/auth/permissions
 *
 * Purpose:
 * This API handler authenticates a user using NextAuth, connects to the database,
 * and fetches all permissions assigned to the user—both directly and through roles.
 * It returns a merged list of unique permission IDs that the authenticated user has.
 */

import { Session, getServerSession } from 'next-auth'; // Import NextAuth utilities for session handling
import { authOptions } from './../[...nextauth]/route'; // Import NextAuth configuration (authOptions)
import { dbConnect } from '@/lib/database/mongoose'; // Import MongoDB connection function
import ModelRole from '@/lib/database/models/modelRole.model'; // Import model that links users to roles
import RolePermission from '@/lib/database/models/rolePermission.model'; // Import model that links roles to permissions
import ModelPermission from '@/lib/database/models/modelPermission.model'; // Import model that links users directly to permissions
import { NextApiRequest, NextApiResponse } from 'next'; // Import types for Next.js API handlers

// Default export of the API route handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the session object from the server using NextAuth
  const session = await getServerSession(req, res, authOptions) as Session | null;

  // If no session or missing user ID, return 401 Unauthorized
  if (!session || !session.user || !session.user.id) {
    return res.status(401).end();
  }

  // Connect to MongoDB
  await dbConnect();
  const userId = session.user.id; // Get the user ID from the session

  // Get roles assigned to the user from the ModelRole collection
  const roles = await ModelRole.find({ model_id: userId });

  // Extract the role IDs from those roles
  const roleIds = roles.map(r => r.role_id);

  // Get all permissions assigned to these roles
  const rolePermissions = await RolePermission.find({ role_id: { $in: roleIds } });

  // Extract the permission IDs from the role-permissions
  const rolePermissionIds = rolePermissions.map(rp => rp.permission_id.toString());

  // Get any permissions directly assigned to the user
  const directPermissions = await ModelPermission.find({ model_id: userId });

  // Extract the permission IDs from the direct-permissions
  const directPermissionIds = directPermissions.map(p => p.permission_id.toString());

  // Merge and deduplicate all permission IDs
  const mergedPermissions = Array.from(new Set([...rolePermissionIds, ...directPermissionIds]));

  // Send back the list of unique permission IDs as a JSON response
  res.json({ permissions: mergedPermissions });
}
