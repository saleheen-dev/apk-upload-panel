import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    return NextResponse.json(versionData);
  } catch (error) {
    console.error("Failed to fetch APK version:", error);
    return NextResponse.json(null);
  }
}
