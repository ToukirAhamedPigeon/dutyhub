// app/api/private/save-user-table-combination/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route'
import { verifyAccessToken } from '@/lib/jwt'
import { dbConnect } from '@/lib/database/mongoose'
import UserTableCombination from '@/lib/database/models/userTableCombination.model'
import { logAction } from '@/lib/logger'
import { EActionType } from '@/types'
import { omitFields } from '@/lib/helpers'
import {IUserTableCombination} from '@/types'
import { isValidObjectId } from 'mongoose'

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
  
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  
    try {
      const decoded = verifyAccessToken(token)
      if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
  
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 })
      }
  
      const { searchParams } = new URL(req.url)
      const tableId = searchParams.get('tableId')
      const userId = session?.user?.id
  
      if (!tableId || !userId) {
        return NextResponse.json({ error: 'Missing tableId or userId' }, { status: 400 })
      }
  
      await dbConnect()
  
      const entry = await UserTableCombination.findOne({ tableId, userId }).lean<IUserTableCombination | null>()
  
      if (!entry) {
        return NextResponse.json({ showColumnCombinations: [] }) // Return empty array if not found
      }
  
      return NextResponse.json({
        showColumnCombinations: entry.showColumnCombinations ?? [],
      })
    } catch (err) {
      console.error('Fetch error:', err)
      return NextResponse.json({ error: 'Server error or invalid token' }, { status: 500 })
    }
  }

export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decoded = verifyAccessToken(token)
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const userId = session.user.id
    const { tableId, showColumnCombinations } = await req.json()
    if (!isValidObjectId(userId)) {
        return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
    }

    if (!tableId || !Array.isArray(showColumnCombinations)) {
      return NextResponse.json({ error: 'Missing or invalid data' }, { status: 400 })
    }

    await dbConnect()

    const existing = await UserTableCombination.findOne({ tableId, userId })

    let actionType: EActionType
    let result

    if (existing) {
      const before = omitFields(existing.toObject(), ['_id', '__v', 'updatedAt'])

      existing.showColumnCombinations = showColumnCombinations
      existing.updatedAt = new Date()
      existing.updatedBy = userId
      result = await existing.save()

      actionType = EActionType.UPDATE

      await logAction({
        detail: `Updated column combination for table: ${tableId}`,
        changes: JSON.stringify({
          before,
          after: omitFields(result.toObject(), ['_id', '__v', 'updatedAt']),
        }),
        actionType,
        collectionName: 'UserTableCombination',
        objectId: result._id.toString(),
      })
    } else {
      const newEntry = await UserTableCombination.create({
        tableId,
        showColumnCombinations,
        userId,
        updatedBy: userId,
        updatedAt: new Date(),
      })

      actionType = EActionType.CREATE

      await logAction({
        detail: `Created new column combination for table: ${tableId}`,
        changes: JSON.stringify({
          after: omitFields(newEntry.toObject(), ['_id', '__v']),
        }),
        actionType,
        collectionName: 'UserTableCombination',
        objectId: newEntry._id.toString(),
      })

      result = newEntry
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('Save/update error:', err)
    return NextResponse.json({ error: 'Server error or invalid token' }, { status: 500 })
  }
}