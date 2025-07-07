// scripts/seed.ts
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { dbConnect } from '../mongoose';
import User from '../models/user.model';
import Role from '../models/role.model';
import Permission from '../models/permission.model';
import RolePermission from '../models/rolePermission.model';
import ModelRole from '../models/modelRole.model';

async function seed() {
  await dbConnect();

  console.log('🌱 Seeding database...');

  // 1. Create User
  const rawPassword = 'Pigeon12@';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const user = await User.create({
    name: 'Toukir Ahamed Pigeon',
    username: 'pigeon',
    email: 'toukir.ahamed.pigeon@gmail.com',
    password: hashedPassword,
    decrypted_password: rawPassword,
    current_status: 'Active',
  });

  console.log(`👤 Created user: ${user.name}`);

  // 2. Create Role: Developer
  const role = await Role.create({
    name: 'developer',
    created_by: user._id,
    updated_by: user._id,
  });

  console.log(`🔐 Created role: ${role.name}`);

  // 3. Create Permissions
  const permissionNames = [
    'read-dashboard',
    'read-users',
    'read-roles',
    'read-permissions',
  ];

  const permissions = await Permission.insertMany(
    permissionNames.map(name => ({
      name,
      created_by: user._id,
      updated_by: user._id,
    }))
  );

  console.log(`✅ Created permissions: ${permissionNames.join(', ')}`);

  // 4. Assign All Permissions to Role
  await RolePermission.insertMany(
    permissions.map(p => ({
      role_id: role._id,
      permission_id: p._id,
    }))
  );

  console.log(`🔗 Assigned permissions to role: ${role.name}`);

  // 5. Assign Role to User
  await ModelRole.create({
    role_id: role._id,
    model_id: user._id,
  });

  console.log(`👥 Assigned role "${role.name}" to user "${user.username}"`);

  console.log('✅ Database seeding completed!');
  mongoose.connection.close();
}

seed().catch(error => {
  console.error('❌ Seeding failed:', error);
  mongoose.connection.close();
});
