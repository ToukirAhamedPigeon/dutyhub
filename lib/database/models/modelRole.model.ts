import { IModelRole } from "@/types";
import { Schema, model, models } from "mongoose";

const ModelRoleSchema = new Schema<IModelRole>({
    role_id: {type:Schema.Types.ObjectId, ref:'Role'},
    model_type: { type: String, default: 'User' },
    model_id: {type:Schema.Types.ObjectId}
  });

const ModelRole = models?.ModelRole || model("ModelRole", ModelRoleSchema);

export default ModelRole;