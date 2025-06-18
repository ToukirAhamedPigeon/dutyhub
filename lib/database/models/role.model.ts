import { IRole } from "@/types";
import { Schema, model, models } from "mongoose";

const RoleSchema = new Schema<IRole>({
    name: {type:String, required:true},
    guard_name: { type: String, default: 'User' },
    created_at: { type: Date, default: Date.now },
    created_by: {type:Schema.Types.ObjectId, ref:'User'},
    updated_at: { type: Date, default: Date.now },
    updated_by: {type:Schema.Types.ObjectId, ref:'User'}
  });

const Role = models?.Role || model("Role", RoleSchema);

export default Role;