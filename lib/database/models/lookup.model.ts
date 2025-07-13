import { ILookup } from "@/types";
import { Schema, model, models } from "mongoose";

const LookupSchema = new Schema<ILookup>({
    name: {type:String, required:true},
    bn_name: { type: String },
    parent_id: {type:Schema.Types.ObjectId, ref:'Lookup'},
    alt_parent_id: {type:Schema.Types.ObjectId, ref:'Lookup'},
    description: { type: String },
    created_at: { type: Date, default: Date.now },
    created_by: {type:Schema.Types.ObjectId, ref:'User'},
    updated_at: { type: Date, default: Date.now },
    updated_by: {type:Schema.Types.ObjectId, ref:'User'}
  });

const Lookup = models?.Lookup || model("Lookup", LookupSchema);

export default Lookup;