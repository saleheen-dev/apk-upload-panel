import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { B2_BUCKET_NAME, b2Client } from "@/lib/backblaze";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET() {
  try {
    const { data: versionData, error: versionError } = await supabase
      .from("apk_versions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (versionError?.code === "PGRST116" || !versionData) {
      return NextResponse.json(
        {
          version: "0.0.0",
          downloadUrl: "",
          lastUpdated: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (versionError) throw versionError;

    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: `app-v${versionData.version}.apk`,
    });

    const downloadUrl = await getSignedUrl(b2Client, command, {
      expiresIn: 3600, // 1 hour expiry
    });

    const response = {
      version: versionData.version,
      downloadUrl,
      releaseNotes: versionData.release_notes || "",
      lastUpdated: versionData.last_updated,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch latest APK version:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest version" },
      { status: 500 }
    );
  }
}
