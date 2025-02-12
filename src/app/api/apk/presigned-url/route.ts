import { NextResponse } from "next/server";
import { b2Client, B2_BUCKET_NAME } from "@/lib/backblaze";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

    const putObjectCommand = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
    });

    const presignedUrl = await getSignedUrl(b2Client, putObjectCommand, {
      expiresIn: 604800,
    });

    return NextResponse.json({
      presignedUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to generate presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
