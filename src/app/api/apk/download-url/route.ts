import { NextResponse } from "next/server";
import { getDownloadUrl } from "../controllers";

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

    const downloadUrl = await getDownloadUrl(fileName);

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error("Failed to generate download URL:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
