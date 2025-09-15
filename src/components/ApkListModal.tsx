import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiDownload, FiUpload, FiTrash2 } from "react-icons/fi";
import type { ApkVersion } from "@/types/apk";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface ApkListModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ApkVersion[];
  onDownload: (version: ApkVersion) => Promise<void>;
  isDownloading: string | null;
  onVersionsChange: () => Promise<void>;
}

export function ApkListModal({
  isOpen,
  onClose,
  versions,
  onDownload,
  isDownloading,
  onVersionsChange,
}: ApkListModalProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (version: ApkVersion) => {
    if (
      !confirm(`Are you sure you want to delete version ${version.version}?`)
    ) {
      return;
    }

    try {
      setIsDeleting(version.id);
      const response = await fetch("/api/apk/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: version.version,
          id: version.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete APK");

      toast.success(`Version ${version.version} deleted successfully`);
      await onVersionsChange();
    } catch (error) {
      console.error("Failed to delete APK:", error);
      toast.error("Failed to delete APK");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black">
            APK Version History
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="mt-4 max-h-[60vh]">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <FiDownload className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                No APKs Available
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Upload your first APK to get started
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {versions.map((version) => (
                  <li key={version.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Version {version.version}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(version.created_at).toLocaleString()}
                        </p>
                        {version.release_notes && (
                          <p className="mt-1 text-sm text-gray-600">
                            {version.release_notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onDownload(version)}
                            disabled={isDownloading === version.version}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-wait"
                          >
                            {isDownloading === version.version ? (
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
                                Download
                              </>
                            )}
                          </button>
                          {process.env.NODE_ENV === "development" && (
                            <button
                              onClick={() => handleDelete(version)}
                              disabled={isDeleting === version.id}
                              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-wait"
                            >
                              {isDeleting === version.id ? (
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
                              ) : (
                                <FiTrash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
