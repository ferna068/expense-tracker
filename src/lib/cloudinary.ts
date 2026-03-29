import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadReceiptImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "expense-tracker/receipts",
    resource_type: "image",
  });

  return result.secure_url;
}
