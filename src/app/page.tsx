"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { FiUpload, FiDownload, FiInfo } from "react-icons/fi";
import type { ApkVersion, UploadState } from "@components/types/apk";

export default function Home() {
  const [currentVersion, setCurrentVersion] = useState<ApkVersion | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
  });
  const [newVersion, setNewVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");

  const fetchCurrentVersion = async () => {
    try {
      const response = await fetch("/api/apk");
      const data = await response.json();
      setCurrentVersion(data);
    } catch (error) {
      console.error("Failed to fetch current version:", error);
    }
  };

  useEffect(() => {
    fetchCurrentVersion();
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file || !newVersion) return;

      setUploadState({ isUploading: true, progress: 0 });

      const formData = new FormData();
      formData.append("apk", file);
      formData.append("version", newVersion);
      formData.append("releaseNotes", releaseNotes);

      try {
        const response = await fetch("/api/apk", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        setCurrentVersion(data);
        setNewVersion("");
        setReleaseNotes("");
        setUploadState({ isUploading: false, progress: 100 });
      } catch (error) {
        console.error("Failed to upload APK:", error);
        setUploadState({
          isUploading: false,
          progress: 0,
          error: "Failed to upload APK",
        });
      }
    },
    [newVersion, releaseNotes]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.android.package-archive": [".apk"],
    },
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">APK Management</h1>

        {/* Current Version Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Version</h2>
          {currentVersion ? (
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Version:</span>{" "}
                {currentVersion.version}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(currentVersion.lastUpdated).toLocaleDateString()}
              </p>
              <a
                href={currentVersion.downloadUrl}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <FiDownload /> Download APK
              </a>
            </div>
          ) : (
            <p className="text-gray-500">No version available</p>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Upload New Version
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="New Version (e.g., 1.0.0)"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              className="w-full p-2 border rounded text-black"
            />

            <textarea
              placeholder="Release Notes (optional)"
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="w-full p-2 border rounded h-24 text-black"
            />

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${
                  isDragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
            >
              <input {...getInputProps()} />
              <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {isDragActive
                  ? "Drop the APK file here"
                  : "Drag and drop APK file here, or click to select"}
              </p>
            </div>

            {uploadState.isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className="bg-blue-600 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadState.progress}%` }}
                />
              </div>
            )}

            {uploadState.error && (
              <p className="text-red-500 flex items-center gap-2">
                <FiInfo /> {uploadState.error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
