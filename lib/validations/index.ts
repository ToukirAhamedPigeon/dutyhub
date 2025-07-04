import { z } from 'zod'
import api from '../axios'
import { authorizationHeader } from '@/lib/tokens'


export const signInSchema = z.object({
  username: z.string(),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
})

export type SignInSchemaType = z.infer<typeof signInSchema>

// Future schemas can be added below
// export const registerSchema = z.object({ ... })
// export type RegisterSchemaType = z.infer<typeof registerSchema>


export const checkValueExists = async (
  collection: string,
  fieldName: string,
  fieldValue: string,
  exceptFieldValue?: string,
  exceptFieldName: string = '_id'
  ): Promise<boolean> => {
    const headers = await authorizationHeader();
  try {
      const res = await api.post(
      `/check-unique`,
      {
        collection,
        fieldName,
        fieldValue,
        exceptFieldName,
        exceptFieldValue,
      },
      {
          headers
      }
      )

      return res.data.exists
  } catch (error) {
      console.error('Error checking email:', error)
      return false
  }
}

interface CheckOverlapOptions {
  exceptField?: string;
  exceptValue?: string;
}

interface AllotmentInput {
  slotId: string;
  allotment_from: Date;
  allotment_to: Date;
}

export const checkAllotmentOverlap = async (
  input: {
    slotId: string
    allotment_from: Date
    allotment_to: Date
  },
  exceptFieldValue?: string,
  exceptFieldName: string = '_id'
): Promise<boolean> => {
  console.log(input, exceptFieldValue, exceptFieldName)
  try {
    const res = await api.post('/checkAllotmentOverlap', {
      ...input,
      exceptField: exceptFieldName,
      exceptValue: exceptFieldValue,
    })
    return res.data.overlap
  } catch (error) {
    console.error('Error checking allotment overlap:', error)
    return false
  }
}