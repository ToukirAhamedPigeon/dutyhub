import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/database/mongoose';
import { getCreatedAtId } from '@/lib/formatDate';
import { omitFields } from '@/lib/helpers';
import { logAction } from '@/lib/logger';
import { EActionType } from '@/types';
import { checkUserAccess } from '@/lib/authcheck/server';
import { Types } from 'mongoose';
import Lookup from '@/lib/database/models/lookup.model';

export async function POST(req: NextRequest) {
  try {
    const authCheck = await checkUserAccess(req, ['create-lookups']);
    if (!authCheck.authorized) return authCheck.response;

    await dbConnect();
    const formData = await req.formData();

    const rawNameInput = formData.get('name') as string;
    const rawBnNameInput = (formData.get('bn_name') as string) || '';
    const description = (formData.get('description') as string) || null;
    const parent_id = formData.get('parent_id') || null;
    const alt_parent_id = formData.get('alt_parent_id') || null;

    const nameParts = rawNameInput
      .split('=')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    const bnNameParts = rawBnNameInput
      .split('=')
      .map(n => n.trim());

    const createdLookups = [];
    const skippedLookups = [];

    for (let i = 0; i < nameParts.length; i++) {
      const name = nameParts[i];
      const bn_name = bnNameParts[i] || '';

      const parentObjectId = parent_id ? new Types.ObjectId(parent_id as string) : null;

      // Check for duplicate name within the same parent
      const exists = await Lookup.findOne({
        name,
        parent_id: parentObjectId,
      });

      if (exists) {
        skippedLookups.push(name);
        continue;
      }

      const newLookup = await Lookup.create({
        name,
        bn_name,
        description,
        parent_id: parentObjectId,
        alt_parent_id: alt_parent_id ? new Types.ObjectId(alt_parent_id as string) : null,
        created_by: authCheck.userId,
        updated_by: authCheck.userId,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Optional: add formatted date ref
      await Lookup.findByIdAndUpdate(
        newLookup._id,
        { dateTimeFormatId: getCreatedAtId(newLookup.created_at) },
        { new: true, strict: false }
      );

      await logAction({
        detail: `Lookup created: ${newLookup.name}`,
        changes: JSON.stringify({
          after: omitFields(newLookup.toObject?.() || newLookup, [
            'created_by',
            'created_at',
          ]),
        }),
        actionType: EActionType.CREATE,
        collectionName: 'Lookup',
        objectId: newLookup._id.toString(),
      });

      createdLookups.push(newLookup.name);
    }

    return NextResponse.json(
      {
        success: true,
        message: `${createdLookups.length} lookup(s) created, ${skippedLookups.length} skipped.`,
        createdLookups,
        skippedLookups,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Lookup creation error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Lookup creation failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    );
  }
}
