"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RoleSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    guard_name: { type: String, default: 'User' },
    created_at: { type: Date, default: Date.now },
    created_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    updated_at: { type: Date, default: Date.now },
    updated_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
});
const Role = (mongoose_1.models === null || mongoose_1.models === void 0 ? void 0 : mongoose_1.models.Role) || (0, mongoose_1.model)("Role", RoleSchema);
exports.default = Role;
