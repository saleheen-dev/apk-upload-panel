export interface ApkVersion {
  version: string;
  downloadUrl: string;
  releaseNotes?: string;
  lastUpdated: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
}
