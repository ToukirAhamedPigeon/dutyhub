
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

function generateSafeFileName(ext: string, width: number, height: number, baseName?: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.-]/g, '').slice(0, 15); // e.g. 20250627T154530

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
// export async function deleteImage(imageId: string) {
//   const imageRecord = await Image.findById(imageId)
//   if (imageRecord) {
//     const imagePath = path.join(process.cwd(), 'public', imageRecord.imageUrl)
//     try {
//       await fs.promises.unlink(imagePath);
//     } catch (err) {
//       console.error('File deletion error:', err);
//     }
//     await Image.findByIdAndDelete(imageId);
//   }
// }
