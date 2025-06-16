import { Schema, model, models } from "mongoose";

const RolePermissionSchema = new Schema({
    role_id: {type:Schema.Types.ObjectId, ref:'Role'},
    permission_id: {type:Schema.Types.ObjectId, ref:'Permission'}
  });

const RolePermission = models?.RolePermission || model("RolePermission", RolePermissionSchema);

export default RolePermission;