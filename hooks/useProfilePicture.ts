// hooks/useProfilePicture.ts
import { useCallback, useState, useEffect } from 'react';
import {
  FieldValues,
  UseFormSetValue,
  UseFormSetError,
  Path,
  PathValue,
} from 'react-hook-form';

export function useProfilePicture<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  setError: UseFormSetError<T>,
  fieldName: Path<T>,
  initialPreview?: string // optional initial image URL for edit mode
) {
  const [preview, setPreview] = useState<string | null>(initialPreview ?? null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);

  const clearImage = useCallback(() => {
    setValue(fieldName, undefined as PathValue<T, Path<T>>);
    setPreview(null);
    setError(fieldName, { message: '' });
    setIsImageDeleted(true);
  }, [setValue, setError, fieldName]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setValue(fieldName, undefined as PathValue<T, Path<T>>);
      setPreview(null);
      setError(fieldName, { message: '' });

      const file = acceptedFiles[0];
      const validTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (
        fileRejections.length > 0 ||
        !file ||
        !validTypes.includes(file.type) ||
        file.size > maxSize
      ) {
        setError(fieldName, {
          type: 'manual',
          message: 'File must be a valid image and less than 5MB.',
        });
        return;
      }

      setValue(fieldName, file as PathValue<T, Path<T>>);
      setPreview(URL.createObjectURL(file));
      setIsImageDeleted(false);
    },
    [setValue, setError, fieldName]
  );

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return {
    preview,
    isImageDeleted,
    clearImage,
    onDrop,
    setIsImageDeleted,
    setPreview,
  };
}
