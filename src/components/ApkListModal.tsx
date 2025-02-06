import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiDownload } from "react-icons/fi";
import type { ApkVersion } from "@/types/apk";

interface ApkListModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ApkVersion[];
}

export function ApkListModal({ isOpen, onClose, versions }: ApkListModalProps) {
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
                        {version.releaseNotes && (
                          <p className="mt-1 text-sm text-gray-600">
                            {version.releaseNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                          {version.downloads} downloads
                        </span>
                        <a
                          href={version.downloadUrl}
                          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          <FiDownload className="h-4 w-4" />
                          Download
                        </a>
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
