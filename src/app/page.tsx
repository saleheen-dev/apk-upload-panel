"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { FiUpload, FiDownload, FiInfo } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import type { ApkVersion, UploadState } from "@/types/apk";
import { ApkListModal } from "@/components/ApkListModal";

export default function Home() {
  const [currentVersion, setCurrentVersion] = useState<ApkVersion | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
  });
  const [newVersion, setNewVersion] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{
    version?: string;
    releaseNotes?: string;
    file?: string;
  }>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [allVersions, setAllVersions] = useState<ApkVersion[]>([]);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const getDownloadUrl = async (version: string) => {
    const response = await fetch(
      "/api/apk/download-url?" +
        new URLSearchParams({
          key: `app-v${version}.apk`,
        }).toString()
    );
    return (await response.json()).downloadUrl;
  };
  const fetchCurrentVersion = async () => {
    try {
      const response = await fetch("/api/apk/latest-version");
      const data = await response.json();
      if (!data) throw new Error("No data returned from latest version API");
      data.download_url = await getDownloadUrl(data.version);
      setCurrentVersion(data);
    } catch (error) {
      console.error("Failed to fetch current version:", error);
    }
  };

  const fetchAllVersions = async () => {
    try {
      const response = await fetch("/api/apk/versions");
      const data = await response.json();
      setAllVersions(data);
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    }
  };

  useEffect(() => {
    fetchCurrentVersion();
    fetchAllVersions();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!newVersion.trim()) {
      newErrors.version = "Version is required";
    } else if (!/^\d+\.\d+\.\d+$/.test(newVersion.trim())) {
      newErrors.version = "Version must be in format: x.x.x (e.g., 1.0.0)";
    }

    if (!releaseNotes.trim()) {
      newErrors.releaseNotes = "Release notes are required";
    }

    if (!selectedFile) {
      newErrors.file = "APK file is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    const uploadToast = toast.loading("Starting upload...");

    try {
      setUploadState((prev) => ({ ...prev, progress: 10 }));
      toast.loading("Getting upload URL...", { id: uploadToast });

      const response = await fetch(
        "/api/apk/presigned-url?" +
          new URLSearchParams({
            key: `app-v${newVersion}.apk`,
          }).toString()
      );

      setUploadState((prev) => ({ ...prev, progress: 30 }));
      toast.loading("Preparing file upload...", { id: uploadToast });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      const fileContent = await selectedFile?.arrayBuffer();

      setUploadState((prev) => ({ ...prev, progress: 50 }));
      toast.loading("Uploading APK...", { id: uploadToast });

      const uploadResponseFromB2 = await fetch(data.presignedUrl, {
        method: "PUT",
        mode: "cors",
        body: fileContent,
        headers: {
          "Content-Type": "b2/x-auto",
        },
      });

      setUploadState((prev) => ({ ...prev, progress: 80 }));
      toast.loading("Finalizing upload...", { id: uploadToast });

      if (
        uploadResponseFromB2.status >= 200 &&
        uploadResponseFromB2.status < 300
      ) {
        const payload = {
          version: newVersion,
          release_notes: releaseNotes,
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        const saveVersion = await fetch("/api/apk/save-version", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!saveVersion.ok) throw new Error("Save version failed");

        setUploadState((prev) => ({ ...prev, progress: 100 }));
        toast.success("APK uploaded successfully!", { id: uploadToast });

        await handleUploadSuccess(data);
      } else {
        throw new Error(`${uploadResponseFromB2.status} error from S3 API.`);
      }
    } catch (error) {
      console.error("Failed to upload APK:", error);
      setUploadState({
        isUploading: false,
        progress: 0,
        error: "Failed to upload APK",
      });
      toast.error("Failed to upload APK", { id: uploadToast });
    }
  };

  const handleUploadSuccess = async (data: ApkVersion) => {
    setCurrentVersion(data);
    setNewVersion("");
    setReleaseNotes("");
    setSelectedFile(null);
    setUploadState({ isUploading: false, progress: 100 });
    await fetchAllVersions();
    await fetchCurrentVersion();
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.android.package-archive": [".apk"],
    },
    maxFiles: 1,
  });

  const handleDownload = async (version: ApkVersion) => {
    try {
      setIsDownloading(version.version);
      const response = await fetch(await getDownloadUrl(version.version));
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `app-v${version.version}.apk`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Download started");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download APK");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">APK Management</h1>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Version History
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Current Version
          </h2>
          {currentVersion ? (
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Version:</span>{" "}
                {currentVersion.version}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Last Updated:</span>{" "}
                {new Date(currentVersion.last_updated).toLocaleDateString()}
              </p>
              <button
                onClick={() => handleDownload(currentVersion)}
                disabled={isDownloading === currentVersion.version}
                className="inline-flex items-center gap-2 py-2 rounded-md text-blue-600 hover:text-blue-400  disabled:opacity-50 disabled:cursor-wait transition-all"
              >
                {isDownloading === currentVersion.version ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4"
                    >
                      <FiUpload className="animate-spin" />
                    </motion.div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <FiDownload className="w-4 h-4" />
                    Download APK
                  </>
                )}
              </button>
            </div>
          ) : (
            <p className="text-gray-500">No version available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Upload New Version
          </h2>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="New Version (e.g., 1.0.0)"
                value={newVersion}
                onChange={(e) => {
                  setNewVersion(e.target.value);
                  setErrors((prev) => ({ ...prev, version: undefined }));
                }}
                className="w-full p-2 border rounded text-black"
              />
              {errors.version && (
                <p className="text-red-500 text-sm mt-1">{errors.version}</p>
              )}
            </div>

            <div>
              <textarea
                placeholder="Release Notes (required)"
                value={releaseNotes}
                onChange={(e) => {
                  setReleaseNotes(e.target.value);
                  setErrors((prev) => ({ ...prev, releaseNotes: undefined }));
                }}
                className="w-full p-2 border rounded h-24 text-black"
              />
              {errors.releaseNotes && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.releaseNotes}
                </p>
              )}
            </div>

            <div>
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
                    : selectedFile
                    ? `Selected: ${selectedFile.name}`
                    : "Drag and drop APK file here, or click to select"}
                </p>
              </div>
              {errors.file && (
                <p className="text-red-500 text-sm mt-1">{errors.file}</p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploadState.isUploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploadState.isUploading ? "Uploading..." : "Upload APK"}
            </button>

            {uploadState.isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                  className="bg-blue-600 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadState.progress}%` }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{
                      opacity: [0, 0.5, 0],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                    }}
                  />
                </motion.div>
              </div>
            )}

            {uploadState.error && (
              <p className="text-red-500 flex items-center gap-2">
                <FiInfo /> {uploadState.error}
              </p>
            )}
          </div>
        </div>

        <ApkListModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          versions={allVersions}
          onDownload={handleDownload}
          isDownloading={isDownloading}
        />
      </div>
    </div>
  );
}
