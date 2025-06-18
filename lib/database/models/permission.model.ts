import { IPermission } from "@/types";
import { Schema, model, models } from "mongoose";

const PermissionSchema = new Schema<IPermission>({
    name: {type:String, required:true},
    guard_name: { type: String, default: 'User' },
    created_at: { type: Date, default: Date.now },
    created_by: {type:Schema.Types.ObjectId, ref:'User'},
    updated_at: { type: Date, default: Date.now },
    updated_by: {type:Schema.Types.ObjectId, ref:'User'}
  });

const Permission = models?.Permission || model("Permission", PermissionSchema);

export default Permission;