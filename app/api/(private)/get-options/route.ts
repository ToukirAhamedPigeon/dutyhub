import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route'
import { verifyAccessToken } from '@/lib/jwt'
import { dbConnect } from '@/lib/database/mongoose'

// Import all your models
import User from '@/lib/database/models/user.model'
import Role from '@/lib/database/models/role.model'
import Permission from '@/lib/database/models/permission.model'
// Add other models as needed

// Map of collection names to actual Mongoose models
const modelMap: Record<string, any> = {
  User,
  Role,
  Permission,
  // Add more models here...
}

interface RequestBody {
  collection: string
  labelFields: string[]
  valueFields: string[]
  label_con_str?: string
  value_con_str?: string
  where?: Record<string, any>
  limit?: number
  skip?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
      collection,
      labelFields,
      valueFields,
      label_con_str = ' ',
      value_con_str = ' ',
      where = {},
      limit = 500,
      skip = 0,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    }: RequestBody = await req.json()

    // console.log('API request:', {
    //   collection,
    //   labelFields,
    //   valueFields,
    //   label_con_str,
    //   value_con_str,
    //   where,
    //   limit,
    //   skip,
    //   sortBy,
    //   sortOrder,
    // })

    if (!modelMap[collection]) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 })
    }

    if (!Array.isArray(labelFields) || !Array.isArray(valueFields)) {
      return NextResponse.json({ error: 'labelFields and valueFields must be arrays' }, { status: 400 })
    }

    await dbConnect()
    const Model = modelMap[collection]

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const docs = await Model.find(where)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    //   console.log(docs)

    const result = docs.map((doc: Record<string, any>) => ({
      label: labelFields.map((field) => doc[field] ?? '').join(label_con_str).trim(),
      value: valueFields.map((field) => doc[field] ?? '').join(value_con_str).trim(),
    }))

    // console.log(result)

    return NextResponse.json(result)
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Server error or invalid token' }, { status: 500 })
  }
}
