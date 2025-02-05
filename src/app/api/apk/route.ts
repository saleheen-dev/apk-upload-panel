import { NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { setupApkDirectory } from "./setup";

const APK_DIR = path.join(process.cwd(), "public/apks");
const VERSION_FILE = path.join(APK_DIR, "version.json");

const VersionSchema = z.object({
  version: z.string(),
  downloadUrl: z.string(),
  releaseNotes: z.string().optional(),
  lastUpdated: z.string(),
});

// Ensure directory and version file exist before handling requests
await setupApkDirectory();

export async function GET() {
  try {
    const versionData = await readFile(VERSION_FILE, "utf-8");
    const parsedData = JSON.parse(versionData);
    const validatedData = VersionSchema.parse(parsedData);

    return NextResponse.json(validatedData);
  } catch (error) {
    console.error("Failed to fetch APK version:", error);
    // Return default version data if file doesn't exist
    const defaultData = {
      version: "0.0.0",
      downloadUrl: "",
      lastUpdated: new Date().toISOString(),
    };
    return NextResponse.json(defaultData);
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

    const buffer = Buffer.from(await apkFile.arrayBuffer());
    const fileName = `app-v${version}.apk`;
    const filePath = path.join(APK_DIR, fileName);

    await writeFile(filePath, buffer);

    const versionData = {
      version,
      downloadUrl: `/apks/${fileName}`,
      releaseNotes,
      lastUpdated: new Date().toISOString(),
    };

    await writeFile(VERSION_FILE, JSON.stringify(versionData, null, 2));

    return NextResponse.json(versionData);
  } catch (error) {
    console.error("Failed to upload APK:", error);
    return NextResponse.json(
      { error: "Failed to upload APK" },
      { status: 500 }
    );
  }
}
