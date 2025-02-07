import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { b2Client, B2_BUCKET_NAME } from "@/lib/backblaze";
import { Upload } from "@aws-sdk/lib-storage";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

const VersionSchema = z.object({
  version: z.string(),
  downloadUrl: z.string(),
  releaseNotes: z.string().optional(),
  lastUpdated: z.string(),
});

const bucketName = B2_BUCKET_NAME;
// const endpointUrl = process.env.AWS_ENDPOINT_URL!;
// const region = process.env.AWS_BUCKET_REGION!;
// const keyId = process.env.B2_APPLICATION_KEY_ID!;
// const secretKey = process.env.B2_APPLICATION_KEY!;
// const MAX_PRESIGNED_URL_EXPIRY = 604800;

// const client = new S3Client({
//   endpoint: endpointUrl,
//   region: region,
//   credentials: {
//     accessKeyId: keyId,
//     secretAccessKey: secretKey,
//   },
// });

export async function GET() {
  try {
    const { data: versionData, error: versionError } = await supabase
      .from("apk_versions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (versionError?.code === "PGRST116" || !versionData) {
      return NextResponse.json({
        version: "0.0.0",
        downloadUrl: "",
        lastUpdated: new Date().toISOString(),
      });
    }

    if (versionError) throw versionError;

    // Generate a pre-signed URL for download
    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: `app-v${versionData.version}.apk`,
    });

    const url = await getSignedUrl(b2Client, command, { expiresIn: 3600 }); // 1 hour expiry
    versionData.downloadUrl = url;

    return NextResponse.json(versionData);
  } catch (error) {
    console.error("Failed to fetch APK version:", error);
    return NextResponse.json({
      version: "0.0.0",
      downloadUrl: "",
      lastUpdated: new Date().toISOString(),
    });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const apkFile = formData.get("apk") as File;
    const version = formData.get("version") as string;
    const releaseNotes = formData.get("releaseNotes") as string;

    if (!apkFile || !version) {
      return NextResponse.json(
        { error: "APK file and version are required" },
        { status: 400 }
      );
    }

    // Check file size (Backblaze B2 has a 5GB limit per file)
    const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
    if (apkFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5GB limit" },
        { status: 413 }
      );
    }

    const fileName = `app-v${version}.apk`;
    const buffer = Buffer.from(await apkFile.arrayBuffer());

    // Upload to Backblaze B2
    // await s3.send(
    //   new PutObjectCommand({
    //     Bucket: bucketName,
    //     Key: fileName,
    //     Body: buffer,
    //     ContentType: "application/vnd.android.package-archive",
    //   })
    // );

    const putObjectParams = {
      Bucket: "live-order-apks",
      Key: "newfile.apk",
      Body: buffer,
      ContentType: "file",
    };

    const putObjectCommand = await new PutObjectCommand(putObjectParams);
    // https://github.com/backblaze-b2-samples/b2-browser-upload/blob/main/public/javascripts/index.js

    // Generate a pre-signed URL for immediate access
    // const command = new GetObjectCommand({
    //   Bucket: B2_BUCKET_NAME,
    //   Key: fileName,
    // });

    const presignedUrl = await getSignedUrl(b2Client, putObjectCommand, {
      expiresIn: 3600,
    });

    console.log("presignedUrl", presignedUrl);

    const versionData = {
      version,
      download_url: presignedUrl,
      release_notes: releaseNotes,
      last_updated: new Date().toISOString(),
    };

    // Save version info to database
    const { error: dbError } = await supabase
      .from("apk_versions")
      .insert(versionData);

    if (dbError) throw dbError;

    // Transform the data back to match the frontend interface
    const responseData = {
      version: versionData.version,
      downloadUrl: versionData.download_url,
      releaseNotes: versionData.release_notes,
      lastUpdated: versionData.last_updated,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload APK",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
