// import dbConnect from '@/lib/dbConnect'
// import User from '@/models/User'
// import { NextResponse } from 'next/server'
// import jwt from 'jsonwebtoken'
// import mongoose from 'mongoose'

// export async function POST(req: Request) {
//   const authHeader = req.headers.get('authorization')
//   const token = authHeader?.split(' ')[1]

//   if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

//   try {
//     jwt.verify(token, process.env.ACCESS_SECRET!)

//     const { email, exceptFieldName = '_id', exceptFieldValue } = await req.json()

//     if (!email) {
//       return NextResponse.json({ error: 'Email is required' }, { status: 400 })
//     }

//     await dbConnect()

//     const query: any = { email }

//     if (exceptFieldValue) {
//       // Use ObjectId if the field is _id and it's a valid ObjectId string
//       if (exceptFieldName === '_id' && mongoose.Types.ObjectId.isValid(exceptFieldValue)) {
//         query[exceptFieldName] = { $ne: new mongoose.Types.ObjectId(exceptFieldValue) }
//       } else {
//         query[exceptFieldName] = { $ne: exceptFieldValue }
//       }
//     }

//     const existingUser = await User.findOne(query)
//     return NextResponse.json({ exists: !!existingUser })
//   } catch (err) {
//     console.error('Email check error:', err)
//     const status = err instanceof Error && err.name === 'JsonWebTokenError' ? 403 : 500
//     return NextResponse.json({ error: 'Invalid or expired token' }, { status })
//   }
// }
