import { NextResponse } from "next/server";
import { b2Client, B2_BUCKET_NAME } from "@/lib/backblaze";
import { supabase } from "@/lib/supabase";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: Request) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("apk") as File;
    const version = formData.get("version") as string;
    const releaseNotes = formData.get("release_notes") as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: "APK file is required" },
        { status: 400 }
      );
    }

    if (!version) {
      return NextResponse.json(
        { error: "Version is required" },
        { status: 400 }
      );
    }

    if (!releaseNotes) {
      return NextResponse.json(
        { error: "Release notes are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (
      !file.name.endsWith(".apk") ||
      file.type !== "application/vnd.android.package-archive"
    ) {
      return NextResponse.json(
        { error: "File must be an APK file" },
        { status: 400 }
      );
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(version.trim())) {
      return NextResponse.json(
        { error: "Version must be in format: x.x.x (e.g., 1.0.0)" },
        { status: 400 }
      );
    }

    // Check if version already exists
    const { data: existingVersion } = await supabase
      .from("apk_versions")
      .select("version")
      .eq("version", version.trim())
      .single();

    if (existingVersion) {
      return NextResponse.json(
        { error: `Version ${version} already exists` },
        { status: 409 }
      );
    }

    const fileName = `app-v${version.trim()}.apk`;

    // Step 1: Get presigned URL for B2 upload
    const putObjectCommand = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
    });

    const presignedUrl = await getSignedUrl(b2Client, putObjectCommand, {
      expiresIn: 604800,
    });

    // Step 2: Upload file to B2
    const fileBuffer = await file.arrayBuffer();

    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      mode: "cors",
      body: fileBuffer,
      headers: {
        "Content-Type": "b2/x-auto",
      },
    });

    if (!uploadResponse.ok) {
      console.error(
        "B2 upload failed:",
        uploadResponse.status,
        uploadResponse.statusText
      );
      return NextResponse.json(
        { error: "Failed to upload APK to storage" },
        { status: 500 }
      );
    }

    // Step 3: Save version info to database
    const now = new Date().toISOString();
    const versionData = {
      version: version.trim(),
      release_notes: releaseNotes.trim(),
      last_updated: now,
      created_at: now,
    };

    const { error: dbError } = await supabase
      .from("apk_versions")
      .insert(versionData);

    if (dbError) {
      console.error("Database save error:", dbError);
      return NextResponse.json(
        { error: "Failed to save version info" },
        { status: 500 }
      );
    }

    // Step 4: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "APK uploaded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
