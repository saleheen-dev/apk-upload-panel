export interface ApkVersion {
  id: string;
  version: string;
  download_url: string;
  release_notes?: string;
  last_updated: string;
  downloads: number;
  created_at: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
}
