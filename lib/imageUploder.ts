
import sharp from 'sharp'
import { getCustomDateTime } from '@/lib/formatDate';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

function generateSafeFileName(ext: string, width: number, height: number, baseName?: string): string {
  const now = new Date();
  const timestamp = getCustomDateTime(now.toISOString(),'YYYYMMDDHHmmss') // e.g. 20250627T154530

  const safeBaseName = baseName
    ? baseName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, ' ')  // Replace special characters with space
    .replace(/\s+/g, '_')         // Replace spaces with underscores
    : Math.random().toString(36).substring(2, 8); // fallback to random string

  return `${safeBaseName}_${timestamp}_${width}x${height}.${ext}`;
}

interface UploadParams {
  file: File;
  modelFolder: string;
  isResize?: boolean;
  width?: number;
  height?: number;
  baseName?: string;
}

export async function uploadAndResizeImage({
  file,
  modelFolder,
  isResize = true,
  width = 1000,
  height,
  baseName
}: UploadParams): Promise<{
  fileName: string;
  imageUrl: string;
}> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid image type');
  }

  const ext = file.name?.split('.').pop() || 'jpg';
  const buffer = Buffer.from(await file.arrayBuffer());

  let resizedBuffer: Buffer;
  let finalWidth = width;
  let finalHeight: number;

  if (isResize) {
    if (width && height) {
      // Resize exactly width x height ignoring ratio
      resizedBuffer = await sharp(buffer)
        .resize(width, height, { fit: 'fill' })
        .toBuffer();
      finalHeight = height;
    } else {
      // Resize width only and get height dynamically
      const sharpInstance = sharp(buffer).resize({ width });
      resizedBuffer = await sharpInstance.toBuffer();

      // Get metadata to know the resulting height
      const metadata = await sharp(resizedBuffer).metadata();
      finalHeight = metadata.height ? Math.round(metadata.height) : 0;
    }
  } else {
    resizedBuffer = buffer;
    // If no resize, get original metadata for dimensions
    const metadata = await sharp(buffer).metadata();
    finalWidth = metadata.width || width;
    finalHeight = metadata.height ? Math.round(metadata.height) : 0;
  }

  // Generate filename with final width and height
  const fileName = generateSafeFileName(ext, finalWidth, finalHeight, baseName);
  console.log(fileName);

  // Now you can save resizedBuffer to disk or upload to your cPanel storage

  const formData = new FormData();
  formData.append('image', new File([resizedBuffer], fileName, { type: file.type }));
  formData.append('folder', modelFolder);
  formData.append('fileName', fileName);

  const uploadResponse = await fetch('https://dutyhubfiles.pigeonic.com/api/upload.php', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CPANEL_UPLOAD_TOKEN}`,
    },
    body: formData,
  });

  const result = await uploadResponse.json();

  if (!uploadResponse.ok || !result?.success || !result?.url) {
    throw new Error(result?.error || 'Image upload failed');
  }

  return {
    fileName,
    imageUrl: result.url,
  };

}
export async function deleteImageFromUrl(imageUrl: string): Promise<void> {
  try {
    // Example: https://dutyhubfiles.pigeonic.com/uploads/images/users/685fa65087be1.jpg
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/'); // ["", "uploads", "images", "users", "685fa65087be1.jpg"]

    const folder = pathParts[pathParts.length - 2]; // "users"
    const fileName = pathParts[pathParts.length - 1]; // "685fa65087be1.jpg"

    const deleteResponse = await fetch('https://dutyhubfiles.pigeonic.com/api/delete.php', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CPANEL_UPLOAD_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, folder }),
    });

    const result = await deleteResponse.json();

    if (!deleteResponse.ok || !result?.success) {
      throw new Error(result?.error || 'Image deletion failed');
    }
  } catch (error) {
    console.error('Image deletion error:', error);
    throw error;
  }
}

