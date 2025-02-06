import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: versions, error } = await supabase
      .from("apk_versions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(versions || []);
  } catch (error) {
    console.error("Failed to fetch APK versions:", error);
    return NextResponse.json([], { status: 500 });
  }
}
