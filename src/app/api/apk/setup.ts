import { mkdir, writeFile, access } from "fs/promises";
import path from "path";

const APK_DIR = path.join(process.cwd(), "public/apks");
const VERSION_FILE = path.join(APK_DIR, "version.json");

const defaultVersionData = {
  version: "0.0.0",
  downloadUrl: "",
  lastUpdated: new Date().toISOString(),
};

export async function setupApkDirectory() {
  try {
    // Create directory if it doesn't exist
    await mkdir(APK_DIR, { recursive: true });

    // Check if version file exists
    try {
      await access(VERSION_FILE);
    } catch {
      // Create version file if it doesn't exist
      await writeFile(
        VERSION_FILE,
        JSON.stringify(defaultVersionData, null, 2)
      );
      console.log("Created initial version.json file");
    }
  } catch (error) {
    console.error("Failed to setup APK directory:", error);
    throw error; // Rethrow to handle in the route
  }
}

setupApkDirectory();
