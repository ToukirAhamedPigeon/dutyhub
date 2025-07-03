import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route'
import { dbConnect } from '@/lib/database/mongoose'
import User from '@/lib/database/models/user.model'
// import OtherModel from '@/lib/database/models/other.model' // Add as needed
import { getServerSession } from 'next-auth'
import { verifyAccessToken } from '@/lib/jwt'
import mongoose from 'mongoose'

const COLLECTION_MAP: Record<string, mongoose.Model<any>> = {
  User,
//   Other: OtherModel,
  // Add more collections here as needed
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decoded = verifyAccessToken(token)
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 })
    }

    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const {
      collection = 'User',
      fieldName,
      fieldValue,
      exceptFieldName = '_id',
      exceptFieldValue,
    } = await req.json()

    if (!collection || !fieldName || fieldValue == null) {
      return NextResponse.json(
        { error: 'Missing required parameters: collection, fieldName, or fieldValue' },
        { status: 400 }
      )
    }

    await dbConnect()

    const Model = COLLECTION_MAP[collection]
    if (!Model) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 })
    }


    const query: any = { [fieldName]: fieldValue }
    if (exceptFieldValue != null) {
      query[exceptFieldName] =
        exceptFieldName === '_id' && mongoose.Types.ObjectId.isValid(exceptFieldValue)
          ? { $ne: new mongoose.Types.ObjectId(exceptFieldValue) }
          : { $ne: exceptFieldValue }
    }
    const existing = await Model.findOne(query)
    return NextResponse.json({ exists: !!existing })
  } catch (err) {
    console.error('Check-unique error:', err)
    const status = err instanceof Error && err.name === 'JsonWebTokenError' ? 403 : 500
    return NextResponse.json({ error: 'Invalid or expired token' }, { status })
  }
}
