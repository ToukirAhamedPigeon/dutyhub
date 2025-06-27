import { ILog, EActionType } from "@/types";
import { Schema, model, models, Types } from "mongoose";

const LogSchema = new Schema<ILog>(
    {
      detail: { type: String },
      changes: { type: String },
      actionType: { type: String, enum: Object.values(EActionType), required: true },
      collectionName: { type: String, required: true },
      objectId: { type: String },
      createdBy: { type: Types.ObjectId, ref: 'User', required: true },
      createdAtId: { type: Number },
    },
    { timestamps: { createdAt: true, updatedAt: false }, strict: false } // Only createdAt is tracked
  )
  
  const Log = models.Log || model<ILog>('Log', LogSchema)
  export default Log