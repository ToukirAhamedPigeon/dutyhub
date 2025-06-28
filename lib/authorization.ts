/**
 * ┌────────────────────────────────────────────────────────────────────────────┐
 * │                            FUNCTIONS INDEX                                 │
 * └────────────────────────────────────────────────────────────────────────────┘
 * 
 * ── Creation Utilities ───────────────────────────────────────────────────────
 * makeRole(name, guard_name?)                           // Create a new role if not exists
 * makePermission(name, guard_name?)                     // Create a new permission if not exists
 * makeRolesBatch(names, guard_name?)                    // Create multiple roles in batch
 * makePermissionsBatch(names, guard_name?)              // Create multiple permissions in batch
 * 
 * ── Assignments ──────────────────────────────────────────────────────────────
 * assignPermissionToRole(roleId, permissionId)          // Assign a permission to a role
 * assignPermissionsToRoleBatch(permissionIds, roleId)   // Assign multiple permissions to a role
 * assignRoleToModel(roleId, modelId, modelType?)        // Assign a role to a model (e.g., User)
 * assignRolesToModelBatch(roleIds, modelId, modelType?) // Assign multiple roles to a model
 * assignPermissionToModel(permissionId, modelId, type?) // Assign a permission to a model
 * assignPermissionsToModelBatch(permissionIds, modelId, type?) // Assign multiple permissions to a model
 * 
 * ── Fetch Queries ────────────────────────────────────────────────────────────
 * getDirectPermissionsByUserId(userId)                  // Get user's directly assigned permissions
 * getRolesByUserId(userId)                              // Get all roles assigned to a user
 * getRolesPermissionsByUserId(userId)                   // Get all permissions from user's roles
 * getAllPermissionsByUserId(userId)                     // Get all user permissions (direct + via roles)
 * getAllPermissions(guard_name?)                        // Fetch all system permissions (optional guard filter)
 * getAllRoles(guard_name?)                              // Fetch all system roles (optional guard filter)
 * 
 * ── Removal Utilities ────────────────────────────────────────────────────────
 * removeModelRole(roleId, modelId?, type?)              // Remove a role from a model (single or all)
 * removeRolePermission(roleId, permissionId?)           // Remove permission(s) from a role
 * removeModelPermission(permissionId, modelId?, type?)  // Remove a permission from a model
 * removeModelRolesBatch(roleIds, modelId, type?)        // Remove multiple roles from a model
 * removeRolePermissionsBatch(permissionIds, roleId)     // Remove multiple permissions from a role
 * removeModelPermissionsBatch(permissionIds, modelId, type?) // Remove multiple permissions from a model
 * 
 * ── Deletion Utilities ───────────────────────────────────────────────────────
 * deleteRole(roleId)                                    // Delete a role and clean related links
 * deletePermission(permissionId)                        // Delete a permission and clean related links
 * deleteRolesBatch(roleIds)                             // Delete multiple roles
 * deletePermissionsBatch(permissionIds)                 // Delete multiple permissions
 * 
 * ── Smart Assignment Helpers ─────────────────────────────────────────────────
 * customAssignPermissionsToRoleBatch(roleId, newIds)    // Sync permissions on role (add/remove as needed)
 * customAssignRolesToModelBatch(modelId, newIds, type?) // Sync roles on model (add/remove as needed)
 * customAssignPermissionsToModelBatch(modelId, newIds, type?) // Sync model's direct permissions
 */


import Role from "@/lib/database/models/role.model";
import Permission from "@/lib/database/models/permission.model";
import RolePermission from "@/lib/database/models/rolePermission.model";
import ModelRole from "@/lib/database/models/modelRole.model";
import ModelPermission from "@/lib/database/models/modelPermission.model";
import { logAction } from "@/lib/logger";
import { EActionType } from "@/types";
import { dbConnect } from "@/lib/database/mongoose";
import { getAuthenticatedUserId } from "@/lib/tokens";

const authenticatedUserId = await getAuthenticatedUserId();

// Utility: Create Role
export async function makeRole(name: string, guard_name = "User") {
  await dbConnect();

  const existingRole = await Role.findOne({ name });
  if (existingRole) {
    return null;
  }

  const role = await Role.create({ name, guard_name, created_by: authenticatedUserId });

  await logAction({
    detail: `Role created: ${role.name}`,
    actionType: EActionType.CREATE,
    collectionName: "Role",
    objectId: role._id.toString(),
  });

  return role;
}

// Utility: Create Permission
export async function makePermission(name: string, guard_name = "User") {
  await dbConnect();

  const existingPermission = await Permission.findOne({ name });
  if (existingPermission) {
    return null;
  }

  const permission = await Permission.create({ name, guard_name, created_by: authenticatedUserId });
  await logAction({
    detail: `Permission created: ${permission.name}`,
    actionType: EActionType.CREATE,
    collectionName: "Permission",
    objectId: permission._id.toString(),
  });
  return permission;
}

// Assign Permission to Role
export async function assignPermissionToRole(roleId: string, permissionId: string) {
  await dbConnect();

  const exists = await RolePermission.findOne({ role_id: roleId, permission_id: permissionId });
  if (exists) return exists;

  const assignment = await RolePermission.create({ role_id: roleId, permission_id: permissionId });
  await logAction({
    detail: `Permission assigned to role`,
    actionType: EActionType.CREATE,
    collectionName: "RolePermission",
    objectId: assignment._id.toString(),
  });
  return assignment;
}


// Assign Role to Model (e.g., User)
export async function assignRoleToModel(roleId: string, modelId: string, modelType = "User") {
  await dbConnect();

  const exists = await ModelRole.findOne({ role_id: roleId, model_id: modelId, model_type: modelType });
  if (exists) return exists;

  const assignment = await ModelRole.create({ role_id: roleId, model_id: modelId, model_type: modelType });
  await logAction({
    detail: `Role assigned to model`,
    actionType: EActionType.CREATE,
    collectionName: "ModelRole",
    objectId: assignment._id.toString(),
  });
  return assignment;
}


// Assign Permission to Model (direct)
export async function assignPermissionToModel(permissionId: string, modelId: string, modelType = "User") {
  await dbConnect();

  const exists = await ModelPermission.findOne({ permission_id: permissionId, model_id: modelId, model_type: modelType });
  if (exists) return exists;

  const assignment = await ModelPermission.create({ permission_id: permissionId, model_id: modelId, model_type: modelType });
  await logAction({
    detail: `Permission assigned to model`,
    actionType: EActionType.CREATE,
    collectionName: "ModelPermission",
    objectId: assignment._id.toString(),
  });
  return assignment;
}


// Get direct permissions of a user
export async function getDirectPermissionsByUserId(userId: string) {
  await dbConnect();
  const perms = await ModelPermission.find({ model_id: userId, model_type: "User" }).populate("permission_id");
  return perms.map(p => p.permission_id);
}

// Get roles assigned to user
export async function getRolesByUserId(userId: string) {
  await dbConnect();
  const roles = await ModelRole.find({ model_id: userId, model_type: "User" }).populate("role_id");
  return roles.map(r => r.role_id);
}

// Get permissions from roles assigned to user
export async function getRolesPermissionsByUserId(userId: string) {
  await dbConnect();
  const userRoles = await getRolesByUserId(userId);
  const roleIds = userRoles.map((r: any) => r._id);
  const rolePermissions = await RolePermission.find({ role_id: { $in: roleIds } }).populate("permission_id");
  return rolePermissions.map(rp => rp.permission_id);
}

// Get all permissions (direct + via roles)
export async function getAllPermissionsByUserId(userId: string) {
  const direct = await getDirectPermissionsByUserId(userId);
  const viaRoles = await getRolesPermissionsByUserId(userId);
  const all = [...direct, ...viaRoles];
  const unique = new Map(all.map(p => [p._id.toString(), p]));
  return Array.from(unique.values());
}

// Get all permissions in system
export async function getAllPermissions(guard_name = "") {
  await dbConnect();
  if (guard_name === "") {
    return await Permission.find();
  }
  return await Permission.find({ guard_name });
}

// Get all roles in system
export async function getAllRoles(guard_name = "") {
  await dbConnect();
  if (guard_name === "") {
    return await Role.find();
  }
  return await Role.find({ guard_name });
}

export async function removeModelRole(
  roleId: string,
  modelId?: string,
  modelType = "User"
) {
  await dbConnect();

  const filter: any = { role_id: roleId, model_type: modelType };
  if (modelId) {
    filter.model_id = modelId;
  }

  const result = await ModelRole.deleteMany(filter);

  await logAction({
    detail: `Removed model-role assignments for role ${roleId}` +
            (modelId ? `, model ${modelId} (${modelType})` : ''),
    actionType: EActionType.DELETE,
    collectionName: "ModelRole",
    objectId: roleId,
  });

  return result;
}

export async function removeRolePermission(roleId: string, permissionId?: string) {
  await dbConnect();

  const filter: any = { role_id: roleId };
  if (permissionId) {
    filter.permission_id = permissionId;
  }

  const result = await RolePermission.deleteMany(filter);

  await logAction({
    detail: `Removed role-permission assignment(s) for role ${roleId}` +
            (permissionId ? ` and permission ${permissionId}` : ''),
    actionType: EActionType.DELETE,
    collectionName: "RolePermission",
    objectId: roleId,
  });

  return result;
}

export async function removeModelPermission(
  permissionId: string,
  modelId?: string,
  modelType = "User"
) {
  await dbConnect();

  const filter: any = { permission_id: permissionId };

  if (modelId) {
    filter.model_id = modelId;
    filter.model_type = modelType;
  }

  const result = await ModelPermission.deleteMany(filter);

  await logAction({
    detail: `Removed model-permission assignment(s) for permission ${permissionId}` +
            (modelId ? ` on model ${modelId} (${modelType})` : ''),
    actionType: EActionType.DELETE,
    collectionName: "ModelPermission",
    objectId: permissionId,
  });

  return result;
}

export async function deleteRole(roleId: string) {
  await dbConnect();

  // Cleanup dependencies
  await removeModelRole(roleId);
  await removeRolePermission(roleId);

  // Remove the role
  const deleted = await Role.findByIdAndDelete(roleId);

  if (deleted) {
    await logAction({
      detail: `Deleted role: ${deleted.name}`,
      actionType: EActionType.DELETE,
      collectionName: "Role",
      objectId: roleId,
    });
  }

  return deleted;
}

export async function deletePermission(permissionId: string) {
  await dbConnect();

  // Cleanup dependencies
  await removeModelPermission(permissionId);
  await RolePermission.deleteMany({ permission_id: permissionId });

  // Remove the permission
  const deleted = await Permission.findByIdAndDelete(permissionId);

  if (deleted) {
    await logAction({
      detail: `Deleted permission: ${deleted.name}`,
      actionType: EActionType.DELETE,
      collectionName: "Permission",
      objectId: permissionId,
    });
  }

  return deleted;
}

export async function makeRolesBatch(names: string[], guard_name = "User") {
  const results = [];
  for (const name of names) {
    const role = await makeRole(name, guard_name);
    if (role) results.push(role);
  }
  return results;
}

export async function makePermissionsBatch(names: string[], guard_name = "User") {
  const results = [];
  for (const name of names) {
    const permission = await makePermission(name, guard_name);
    if (permission) results.push(permission);
  }
  return results;
}

export async function assignRolesToModelBatch(roleIds: string[], modelId: string, modelType = "User") {
  const results = [];
  for (const roleId of roleIds) {
    const assignment = await assignRoleToModel(roleId, modelId, modelType);
    if (assignment) results.push(assignment);
  }
  return results;
}

export async function assignPermissionsToModelBatch(permissionIds: string[], modelId: string, modelType = "User") {
  const results = [];
  for (const permissionId of permissionIds) {
    const assignment = await assignPermissionToModel(permissionId, modelId, modelType);
    if (assignment) results.push(assignment);
  }
  return results;
}

export async function assignPermissionsToRoleBatch(permissionIds: string[], roleId: string) {
  const results = [];
  for (const permissionId of permissionIds) {
    const assignment = await assignPermissionToRole(roleId, permissionId);
    if (assignment) results.push(assignment);
  }
  return results;
}

export async function deleteRolesBatch(roleIds: string[]) {
  const results = [];
  for (const roleId of roleIds) {
    const deleted = await deleteRole(roleId);
    if (deleted) results.push(deleted);
  }
  return results;
}

export async function deletePermissionsBatch(permissionIds: string[]) {
  const results = [];
  for (const permissionId of permissionIds) {
    const deleted = await deletePermission(permissionId);
    if (deleted) results.push(deleted);
  }
  return results;
}

export async function removeModelRolesBatch(
  roleIds: string[],
  modelId: string,
  modelType = "User"
) {
  const results: { roleId: string; status: boolean }[] = [];

  for (const roleId of roleIds) {
    const removed = await removeModelRole(roleId, modelId, modelType);
    results.push({ roleId, status: removed.deletedCount > 0 });
  }

  return results;
}

export async function removeRolePermissionsBatch(permissionIds: string[], roleId: string) {
  const results = [];

  for (const permissionId of permissionIds) {
    const removed = await removeRolePermission(roleId, permissionId);
    results.push({ permissionId, removed });
  }

  return results;
}

export async function removeModelPermissionsBatch(
  permissionIds: string[],
  modelId: string,
  modelType = "User"
) {
  const results = [];

  for (const permissionId of permissionIds) {
    const removed = await removeModelPermission(permissionId, modelId, modelType);
    results.push({ permissionId, removed });
  }

  return results;
}

export async function customAssignPermissionsToRoleBatch(
  roleId: string,
  newPermissionIds: string[]
) {
  await dbConnect();

  // Step 1: Fetch currently assigned permissions
  const currentAssignments = await RolePermission.find({ role_id: roleId });
  const currentPermissionIds = currentAssignments.map(p => p.permission_id.toString());

  // Step 2: Calculate difference
  const toRemove = currentPermissionIds.filter(id => !newPermissionIds.includes(id));
  const toAdd = newPermissionIds.filter(id => !currentPermissionIds.includes(id));
  const skipped = newPermissionIds.filter(id => currentPermissionIds.includes(id));

  let removed:string[] = [];
  let added:string[] = [];

  // Step 3: Remove outdated assignments
  if (toRemove.length > 0) {
    const removalResults = await removeRolePermissionsBatch(toRemove, roleId);
    removed = removalResults.map(r => r.permissionId);
  }

  // Step 4: Add new permissions
  if (toAdd.length > 0) {
    const addResults = await assignPermissionsToRoleBatch(toAdd, roleId);
    added = addResults.map(r => r.permissionId);
  }

  return {
    removed,
    added,
    skipped,
    allAssigned: [...added, ...skipped],
  };
}

export async function customAssignRolesToModelBatch(
  modelId: string,
  newRoleIds: string[],
  modelType = "User"
) {
  await dbConnect();

  // Step 1: Fetch currently assigned roles
  const currentAssignments = await ModelRole.find({ model_id: modelId, model_type: modelType });
  const currentRoleIds = currentAssignments.map(r => r.role_id.toString());

  // Step 2: Calculate difference
  const toRemove = currentRoleIds.filter(id => !newRoleIds.includes(id));
  const toAdd = newRoleIds.filter(id => !currentRoleIds.includes(id));
  const skipped = newRoleIds.filter(id => currentRoleIds.includes(id));

  let removed: string[] = [];
  let added: string[] = [];

  // Step 3: Remove outdated roles
  if (toRemove.length > 0) {
    const removalResults = await removeModelRolesBatch(toRemove, modelId, modelType);
    removed = removalResults.map(r => r.roleId);
  }

  // Step 4: Add new roles
  if (toAdd.length > 0) {
    const addResults = await assignRolesToModelBatch(toAdd, modelId, modelType);
    added = addResults.map(r => r.roleId);
  }

  return {
    removed,
    added,
    skipped,
    allAssigned: [...added, ...skipped],
  };
}

export async function customAssignPermissionsToModelBatch(
  modelId: string,
  newPermissionIds: string[],
  modelType = "User"
) {
  await dbConnect();

  // Step 1: Fetch current direct permission assignments
  const currentAssignments = await ModelPermission.find({ model_id: modelId, model_type: modelType });
  const currentPermissionIds = currentAssignments.map(p => p.permission_id.toString());

  // Step 2: Calculate difference
  const toRemove = currentPermissionIds.filter(id => !newPermissionIds.includes(id));
  const toAdd = newPermissionIds.filter(id => !currentPermissionIds.includes(id));
  const skipped = newPermissionIds.filter(id => currentPermissionIds.includes(id));

  let removed: string[] = [];
  let added: string[] = [];

  // Step 3: Remove outdated permissions
  if (toRemove.length > 0) {
    const removalResults = await removeModelPermissionsBatch(toRemove, modelId, modelType);
    removed = removalResults.map(r => r.permissionId);
  }

  // Step 4: Add new permissions
  if (toAdd.length > 0) {
    const addResults = await assignPermissionsToModelBatch(toAdd, modelId, modelType);
    added = addResults.map(r => r.permissionId);
  }

  return {
    removed,
    added,
    skipped,
    allAssigned: [...added, ...skipped],
  };
}



















