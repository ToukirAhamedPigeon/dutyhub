// lib/logger.ts
import Log from '@/lib/database/models/log.model'
import { EActionType, ILog } from '@/types'
import { dbConnect } from '@/lib/database/mongoose'
import { getAuthenticatedUserId } from '@/lib/tokens'

interface LogInput {
  detail?: string;
  changes?: string;
  actionType: EActionType;
  collectionName: string;
  objectId?: string;
}

export async function logAction({
  detail,
  changes,
  actionType,
  collectionName,
  objectId,
}: LogInput): Promise<ILog | null> {
  try {
    await dbConnect();

    const authUserId = await getAuthenticatedUserId()

    const log = await Log.create({
      detail,
      changes,
      actionType,
      collectionName,
      objectId,
      createdBy: authUserId,
    });

    return log;
  } catch (error) {
    console.error('❌ Failed to log action:', error);
    return null;
  }
}


