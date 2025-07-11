import { ObjectId, Types } from "mongoose";

export enum EActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum BloodGroup {
    A_POS = 'A+',
    A_NEG = 'A-',
    B_POS = 'B+',
    B_NEG = 'B-',
    AB_POS = 'AB+',
    AB_NEG = 'AB-',
    O_POS = 'O+',
    O_NEG = 'O-'
  }
  
  export enum UserStatus {
    INACTIVE = 'Inactive',
    SUSPENDED = 'Suspended',
    REST = 'Rest',
    MEDICAL_REST = 'Medical Rest',
    CASUAL_LEAVE = 'Casual Leave',
    SICK_LEAVE = 'Sick Leave',
    PATERNITY_LEAVE = 'Paternity Leave',
    MATERNITY_LEAVE = 'Maternity Leave',
    BEREAVEMENT_LEAVE = 'Bereavement Leave',
    MARRIAGE_LEAVE = 'Marriage Leave',
    DEATH_LEAVE = 'Death Leave',
    VACATION_LEAVE = 'Vacation Leave',
    FESTVAL_LEAVE = 'Festival Leave',
    OTHER_LEAVE = 'Other Leave',
    RECREATIONAL_LEAVE = 'Recreational Leave',
    TRAINING_LEAVE = 'Training Leave',
    PROBATION_LEAVE = 'Probation Leave',
    ON_DUTY = 'On Duty',
    ON_OUT_DUTY = 'On Out Duty',
    OFF_DUTY='Off Duty'
  }

  export interface IUser {
    _id: ObjectId;
    name: string;
    username: string;
    email: string;
    password: string;
    decrypted_password: string;
    image?: string;
    bp_no?: string;
    phone_1?: string;
    phone_2?: string;
    address?: string;
    blood_group?: string; // or BloodGroup
    nid?: string;
    dob?: Date;
    description?: string;
    current_status: string; // or UserStatus
    refreshToken?: string;
    created_at?: Date;
    created_by?: ObjectId | IUser;
    updated_at?: Date;
    updated_by?: ObjectId | IUser;
  }

  export interface IRole {
    _id: ObjectId;
    name: string;
    guard_name?: string;
    created_at?: Date;
    created_by?: ObjectId | IUser;
    updated_at?: Date;
    updated_by?: ObjectId | IUser;
  }

  export interface IPermission {
    _id: ObjectId;
    name: string;
    guard_name?: string;
    created_at?: Date;
    created_by?: ObjectId | IUser;
    updated_at?: Date;
    updated_by?: ObjectId | IUser;
  }

  export interface IRolePermission {
    _id: ObjectId;
    role_id: ObjectId | IRole;
    permission_id: ObjectId | IPermission;
  }

  export interface IModelRole {
    _id: ObjectId;
    role_id: ObjectId | IRole;
    model_type?: string; // e.g., "User"
    model_id: ObjectId;
  }

  export interface IModelPermission {
    _id: ObjectId;
    permission_id: ObjectId | IPermission;
    model_type?: string; // e.g., "User"
    model_id: ObjectId;
  }

  export interface ILog {
    _id: string | ObjectId;
    detail: string;
    changes?: string;
    actionType: EActionType;
    collectionName: string;
    objectId?: string;
    createdBy: IUser;
    createdAtId?: number;
    createdAt: Date;
    createdByName: string | null;
  }

  export interface IUserTableCombination {
    _id?: Types.ObjectId
    tableId: string
    showColumnCombinations: string[] // Array of column IDs to show
    userId: IUser
    updatedBy?: IUser
    updatedAt?: Date
  }