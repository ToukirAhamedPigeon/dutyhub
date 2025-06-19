"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    username: { type: String, unique: true },
    email: { type: String, required: true, unique: true, email: true },
    password: { type: String, required: true },
    decrypted_password: { type: String, required: true },
    image: String,
    bp_no: String,
    phone_1: String,
    phone_2: String,
    address: String,
    blood_group: String,
    nid: String,
    dob: Date,
    description: String,
    current_status: { type: String, required: true, Default: "Inactive" },
    created_at: { type: Date, default: Date.now },
    created_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    updated_at: { type: Date, default: Date.now },
    updated_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
});
const User = (mongoose_1.models === null || mongoose_1.models === void 0 ? void 0 : mongoose_1.models.User) || (0, mongoose_1.model)("User", UserSchema);
exports.default = User;
