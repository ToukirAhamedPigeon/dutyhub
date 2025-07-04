import { dbConnect } from '@/lib/database/mongoose';
import mongoose from 'mongoose';

export type ReferenceCheckTarget = {
  collectionName: string;
  columnNames: string[];
};

export type ReferenceCheckResult = {
  collection: string;
  column: string;
  refObjectId: string;
};

export async function checkReferenceBeforeDelete(
  deletingId: string,
  targets: ReferenceCheckTarget[]
): Promise<false | ReferenceCheckResult> {
  await dbConnect();
  const objectId = new mongoose.Types.ObjectId(deletingId);

  for (const target of targets) {
    const Model = mongoose.models[target.collectionName];
    if (!Model) continue;

    for (const column of target.columnNames) {
      const query = { [column]: objectId };
      const result = await Model.findOne(query).select('_id').lean();

      // 👇 Add runtime check and assertion
      if (result && typeof result === 'object' && '_id' in result) {
        return {
          collection: target.collectionName,
          column,
          refObjectId: String((result as { _id: mongoose.Types.ObjectId })._id),
        };
      }
    }
  }

  return false;
}
