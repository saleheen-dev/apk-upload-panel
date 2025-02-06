import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FiX, FiDownload } from "react-icons/fi";
import type { ApkVersion } from "@components/types/apk";

interface ApkListModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ApkVersion[];
}

export function ApkListModal({ isOpen, onClose, versions }: ApkListModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium text-gray-900"
                  >
                    APK Version History
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-4">
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
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
