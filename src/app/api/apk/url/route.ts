import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getDownloadUrl } from "../controllers";

export async function GET() {
  try {
    const { data: versionData, error: versionError } = await supabase
      .from("apk_versions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (versionError?.code === "PGRST116" || !versionData) {
      return NextResponse.json(null);
    }

    if (versionError) throw versionError;

    const downloadUrl = await getDownloadUrl(versionData.version);
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
