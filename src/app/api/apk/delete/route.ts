import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { b2Client, B2_BUCKET_NAME } from "@/lib/backblaze";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function DELETE(request: Request) {
  try {
    const { version, id } = await request.json();

    // Delete from B2
    const deleteCommand = new DeleteObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: `app-v${version}.apk`,
    });

    await b2Client.send(deleteCommand);

    // Delete from Supabase
    const { error } = await supabase
      .from("apk_versions")
      .delete()
      .match({ id });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete APK:", error);
    return NextResponse.json(
      { error: "Failed to delete APK" },
      { status: 500 }
    );
  }
}
