"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/seed.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("@/lib/database/mongoose");
const user_model_1 = __importDefault(require("@/lib/database/models/user.model"));
const role_model_1 = __importDefault(require("@/lib/database/models/role.model"));
const permission_model_1 = __importDefault(require("@/lib/database/models/permission.model"));
const rolePermission_model_1 = __importDefault(require("@/lib/database/models/rolePermission.model"));
const modelRole_model_1 = __importDefault(require("@/lib/database/models/modelRole.model"));
async function seed() {
    await (0, mongoose_2.dbConnect)();
    console.log('🌱 Seeding database...');
    // 1. Create User
    const rawPassword = 'Pigeon12@';
    const hashedPassword = await bcryptjs_1.default.hash(rawPassword, 10);
    const user = await user_model_1.default.create({
        name: 'Toukir Ahamed Pigeon',
        username: 'pigeon',
        email: 'toukir.ahamed.pigeon@gmail.com',
        password: hashedPassword,
        decrypted_password: rawPassword,
        current_status: 'Active',
    });
    console.log(`👤 Created user: ${user.name}`);
    // 2. Create Role: Developer
    const role = await role_model_1.default.create({
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
    const permissions = await permission_model_1.default.insertMany(permissionNames.map(name => ({
        name,
        created_by: user._id,
        updated_by: user._id,
    })));
    console.log(`✅ Created permissions: ${permissionNames.join(', ')}`);
    // 4. Assign All Permissions to Role
    await rolePermission_model_1.default.insertMany(permissions.map(p => ({
        role_id: role._id,
        permission_id: p._id,
    })));
    console.log(`🔗 Assigned permissions to role: ${role.name}`);
    // 5. Assign Role to User
    await modelRole_model_1.default.create({
        role_id: role._id,
        model_id: user._id,
    });
    console.log(`👥 Assigned role "${role.name}" to user "${user.username}"`);
    console.log('✅ Database seeding completed!');
    mongoose_1.default.connection.close();
}
seed().catch(error => {
    console.error('❌ Seeding failed:', error);
    mongoose_1.default.connection.close();
});
