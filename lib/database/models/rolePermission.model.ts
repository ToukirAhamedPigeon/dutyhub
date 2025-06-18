import { IRolePermission } from "@/types";
import { Schema, model, models } from "mongoose";

const RolePermissionSchema = new Schema<IRolePermission>({
    role_id: {type:Schema.Types.ObjectId, ref:'Role'},
    permission_id: {type:Schema.Types.ObjectId, ref:'Permission'}
  });

const RolePermission = models?.RolePermission || model("RolePermission", RolePermissionSchema);

export default RolePermission;