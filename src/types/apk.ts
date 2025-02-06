export interface ApkVersion {
  id: string;
  version: string;
  downloadUrl: string;
  releaseNotes?: string;
  lastUpdated: string;
  downloads: number;
  created_at: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
}
