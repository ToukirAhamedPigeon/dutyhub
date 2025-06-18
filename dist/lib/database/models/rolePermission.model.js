"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RolePermissionSchema = new mongoose_1.Schema({
    role_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Role' },
    permission_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Permission' }
});
const RolePermission = (mongoose_1.models === null || mongoose_1.models === void 0 ? void 0 : mongoose_1.models.RolePermission) || (0, mongoose_1.model)("RolePermission", RolePermissionSchema);
exports.default = RolePermission;
