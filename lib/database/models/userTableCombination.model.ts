// lib/database/models/user-table-combination.model.ts
import { Schema, model, models, Types } from 'mongoose'
import { IUserTableCombination } from '@/types'

const UserTableCombinationSchema = new Schema<IUserTableCombination>(
  {
    tableId: { type: String, required: true },
    showColumnCombinations: { type: [String], required: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: false, updatedAt: 'updatedAt' },
  }
)

const UserTableCombination =
  models.UserTableCombination ||
  model<IUserTableCombination>('UserTableCombination', UserTableCombinationSchema)

export default UserTableCombination
