import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
    name: {type:String, required:true},
    username: { type: String, unique: true },
    email: {type:String, required:true, unique: true, email:true},
    password: {type:String, required:true},
    decrypted_password: {type:String, required:true},
    image: String,
    bp_no: String,
    phone_1: String,
    phone_2: String,
    address: String,
    blood_group: String,
    nid: String,
    dob: Date,
    description: String,
    current_status: {type:String, required:true, Default:"Inactive"},
    created_at: { type: Date, default: Date.now },
    created_by: {type:Schema.Types.ObjectId, ref:'User'},
    updated_at: { type: Date, default: Date.now },
    updated_by: {type:Schema.Types.ObjectId, ref:'User'}
  });

const User = models?.User || model("User", UserSchema);

export default User;