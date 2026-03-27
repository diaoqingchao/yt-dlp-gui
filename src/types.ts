export type TaskType = 'single' | 'playlist' | 'channel' | 'transcode';
export type TaskStatus = 'pending' | 'downloading' | 'transcoding' | 'packaging' | 'completed' | 'error';

export interface DownloadOptions {
  video: boolean;
  audio: boolean;
  subtitles: boolean;
  thumbnail: boolean;
  format: 'mp4' | 'mkv' | 'webm' | 'm3u8';
  packaging: 'none' | 'folder' | 'zip';
  includeLinkFile: boolean;
  bundlePerVideo: boolean; // For playlist/channel: bundle each video's assets together
}

export interface TranscodeOptions {
  format: 'mp4' | 'm3u8';
  videoCodec: 'copy' | 'libx264' | 'libx265' | 'libvpx-vp9';
  audioCodec: 'copy' | 'aac' | 'libmp3lame' | 'libopus';
  resolution: 'original' | '1080p' | '720p' | '480p';
  videoBitrate: 'auto' | '1000k' | '2500k' | '5000k' | '8000k';
}

export interface Task {
  id: string;
  urlOrFile: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  fileName?: string;
  options?: DownloadOptions | TranscodeOptions;
  error?: string;
}
