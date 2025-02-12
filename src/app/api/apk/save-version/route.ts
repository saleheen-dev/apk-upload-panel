import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const versionData = await request.json();

    const { error: dbError } = await supabase
      .from("apk_versions")
      .insert(versionData);

    if (dbError) throw dbError;

    const responseData = {
      version: versionData.version,
      download_url: versionData.download_url,
      release_notes: versionData.release_notes,
      last_updated: versionData.last_updated,
      created_at: versionData.created_at,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Failed to save version:", error);
    return NextResponse.json(
      { error: "Failed to save version info" },
      { status: 500 }
    );
  }
}
