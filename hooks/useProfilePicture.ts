// hooks/useProfilePicture.ts
import { useCallback, useState } from 'react'
import { FieldValues, UseFormSetValue, UseFormSetError, Path, PathValue } from 'react-hook-form'

export function useProfilePicture<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  setError: UseFormSetError<T>,
  fieldName: Path<T>
) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isImageDeleted, setIsImageDeleted] = useState(false)

  // We handle the possibility that `undefined` is a valid value by making sure
  // the field can accept it and casting it if necessary.
  const clearImage = useCallback(() => {
    setValue(fieldName, undefined as PathValue<T, Path<T>>) // Cast `undefined` to the correct type for the field
    setPreview(null)
    setError(fieldName, { message: '' })
    setIsImageDeleted(true)
  }, [setValue, setError, fieldName])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setValue(fieldName, undefined as PathValue<T, Path<T>>) // Cast `undefined` to the correct type for the field
      setPreview(null)
      setError(fieldName, { message: '' })

      const file = acceptedFiles[0]
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      const maxSize = 5 * 1024 * 1024

      if (fileRejections.length > 0 || !file || !validTypes.includes(file.type) || file.size > maxSize) {
        setError(fieldName, {
          type: 'manual',
          message: 'File must be a valid image and less than 5MB.',
        })
        return
      }

      setValue(fieldName, file as PathValue<T, Path<T>>) // Cast file to the correct type for the field
      setPreview(URL.createObjectURL(file))
      setIsImageDeleted(true)
    },
    [setValue, setError, fieldName]
  )

  return {
    preview,
    isImageDeleted,
    clearImage,
    onDrop,
    setIsImageDeleted,
    setPreview,
  }
}
