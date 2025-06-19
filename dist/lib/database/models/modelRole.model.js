"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ModelRoleSchema = new mongoose_1.Schema({
    role_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Role' },
    model_type: { type: String, default: 'User' },
    model_id: { type: mongoose_1.Schema.Types.ObjectId }
});
const ModelRole = (mongoose_1.models === null || mongoose_1.models === void 0 ? void 0 : mongoose_1.models.ModelRole) || (0, mongoose_1.model)("ModelRole", ModelRoleSchema);
exports.default = ModelRole;
