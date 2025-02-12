import { NextResponse } from "next/server";
import { B2_BUCKET_NAME, b2Client } from "@/lib/backblaze";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

async function getDownloadUrl(fileName: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
    });

    const downloadUrl = await getSignedUrl(b2Client, command, {
      expiresIn: 604800, // 7 days
    });

    return downloadUrl;
  } catch (error) {
    console.error("Failed to generate download URL:", error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("key");

    if (!fileName) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    const downloadUrl = await getDownloadUrl(fileName);

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Failed to generate download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
