import { NextResponse } from "next/server";
import { supabase } from "@components/lib/supabase";
import { z } from "zod";

const BUCKET_NAME = "apks";

const VersionSchema = z.object({
  version: z.string(),
  downloadUrl: z.string(),
  releaseNotes: z.string().optional(),
  lastUpdated: z.string(),
});

export async function GET() {
  try {
    const { data: versionData, error: versionError } = await supabase
      .from("apk_versions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // If no data found or error, return default version
    if (versionError?.code === "PGRST116" || !versionData) {
      return NextResponse.json({
        version: "0.0.0",
        downloadUrl: "",
        lastUpdated: new Date().toISOString(),
      });
    }

    if (versionError) throw versionError;

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

    // Check file size
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (apkFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 413 }
      );
    }

    // Upload APK to Supabase Storage
    const fileName = `app-v${version}.apk`;
    const buffer = await apkFile.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: "application/vnd.android.package-archive",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    const versionData = {
      version,
      downloadUrl: publicUrl,
      releaseNotes,
      lastUpdated: new Date().toISOString(),
    };

    // Save version info to database
    const { error: dbError } = await supabase
      .from("apk_versions")
      .insert(versionData);

    if (dbError) throw dbError;

    return NextResponse.json(versionData);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to upload APK",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
