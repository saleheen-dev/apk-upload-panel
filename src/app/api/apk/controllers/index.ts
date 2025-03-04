import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { B2_BUCKET_NAME, b2Client } from "@/lib/backblaze";

export async function getDownloadUrl(fileName: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
    });

    const downloadUrl = await getSignedUrl(b2Client, command, {
      expiresIn: 3600,
    });

    return downloadUrl;
  } catch (error) {
    console.error("Failed to generate download URL:", error);
    throw error;
  }
}
