import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/database/mongoose';
import { Types } from 'mongoose';
import Lookup from '@/lib/database/models/lookup.model';
import User from '@/lib/database/models/user.model';
import { omitFields } from '@/lib/helpers';
import { logAction } from '@/lib/logger';
import { EActionType, IUser } from '@/types';
import { checkReferenceBeforeDelete } from '@/lib/checkRefBeforeDelete';
import { checkUserAccess } from '@/lib/authcheck/server';
import { ILookup } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkUserAccess(req, ['read-lookups']);
    if (!authCheck.authorized) return authCheck.response;

    const { id } = await params;
    await dbConnect();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid lookup ID' }, { status: 400 });
    }

    const lookup = await Lookup.findById(id).lean<ILookup>();
    if (!lookup) {
      return NextResponse.json({ error: 'Lookup not found' }, { status: 404 });
    }

    // Fetch parent names and user names
    const [parent, altParent, createdByUser, updatedByUser] = await Promise.all([
      lookup.parent_id ? Lookup.findById(lookup.parent_id).lean<ILookup>() : null,
      lookup.alt_parent_id ? Lookup.findById(lookup.alt_parent_id).lean<ILookup>() : null,
      lookup.created_by ? User.findById(lookup.created_by).lean<IUser>() : null,
      lookup.updated_by ? User.findById(lookup.updated_by).lean<IUser>() : null,
    ]);

    const formattedLookup = {
      ...lookup,
      parent_name: parent?.name || null,
      alt_parent_name: altParent?.name || null,
      creator_user_name: createdByUser?.name || null,
      updater_user_name: updatedByUser?.name || null,
    };

    return NextResponse.json(formattedLookup);
  } catch (err) {
    console.error('Error fetching lookup detail:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkUserAccess(req, ['update-lookups']);
    if (!authCheck.authorized) return authCheck.response;

    const { id } = await params;
    await dbConnect();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }

    const lookup = await Lookup.findById(id);
    if (!lookup) {
      return NextResponse.json({ success: false, message: 'Lookup not found' }, { status: 404 });
    }

    const originalLookup = lookup.toObject();
    const formData = await req.formData();

    const updatableFields = ['name', 'bn_name', 'description', 'parent_id', 'alt_parent_id'];

    for (const field of updatableFields) {
      const value = formData.get(field);
      if (value !== null) {
        lookup[field] = field.endsWith('_id') && value
          ? new Types.ObjectId(value.toString())
          : value?.toString() || null;
      }
    }

    lookup.updated_by = authCheck.userId;
    lookup.updated_at = new Date();
    await lookup.save();

    await logAction({
      detail: `Lookup updated: ${lookup.name}`,
      changes: JSON.stringify({
        before: omitFields(originalLookup, ['created_by', 'created_at']),
        after: omitFields(lookup.toObject?.() || lookup, ['created_by', 'created_at']),
      }),
      actionType: EActionType.UPDATE,
      collectionName: 'Lookup',
      objectId: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Lookup updated successfully',
      lookup,
    });
  } catch (err: any) {
    console.error('Lookup Update Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Update failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await checkUserAccess(req, ['delete-lookups']);
    if (!authCheck.authorized) return authCheck.response;

    const { id } = await params;
    await dbConnect();

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const lookup = await Lookup.findById(id);
    if (!lookup) {
      return NextResponse.json({ error: 'Lookup not found' }, { status: 404 });
    }

    const originalLookup = lookup.toObject();

    const refCheck = await checkReferenceBeforeDelete(id, [
      // Add reference checks here if needed
      // { collectionName: 'SomeOtherCollection', columnNames: ['lookup_id'] },
    ]);

    if (refCheck) {
      return NextResponse.json({
        error: 'Cannot delete lookup due to existing reference.',
        reference: refCheck,
      }, { status: 400 });
    }

    await lookup.deleteOne();

    await logAction({
      detail: `Lookup deleted: ${originalLookup.name}`,
      actionType: EActionType.DELETE,
      collectionName: 'Lookup',
      objectId: id,
      changes: JSON.stringify({
        before: omitFields(originalLookup, ['created_by', 'created_at']),
        after: null,
      }),
    });

    return NextResponse.json({ success: true, status: 'deleted', message: 'Lookup deleted successfully' });
  } catch (err: any) {
    console.error('Delete Lookup Error:', err);
    return NextResponse.json(
      { error: err?.message || 'Delete failed' },
      { status: err.name === 'JsonWebTokenError' ? 403 : 500 }
    );
  }
}
