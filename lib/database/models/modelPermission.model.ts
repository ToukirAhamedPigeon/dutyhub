import { IModelPermission } from "@/types";
import { Schema, model, models } from "mongoose";

const ModelPermissionSchema = new Schema<IModelPermission>({
    permission_id: {type:Schema.Types.ObjectId, ref:'Permission'},
    model_type: { type: String, default: 'User' },
    model_id: {type:Schema.Types.ObjectId}
  });

const ModelPermission = models?.ModelPermission || model("ModelPermission", ModelPermissionSchema);

export default ModelPermission;