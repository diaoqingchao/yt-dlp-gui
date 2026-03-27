import React, { useState } from 'react';
import { FileVideo, Upload, Settings2, Play, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';
import { TranscodeOptions } from '@/types';

interface TranscodeTabProps {
  onEnqueue: (file: string, options: TranscodeOptions) => void;
}

export function TranscodeTab({ onEnqueue }: TranscodeTabProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<string>('');
  const [options, setOptions] = useState<TranscodeOptions>({
    format: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    resolution: 'original',
    videoBitrate: 'auto',
  });

  const handleTranscode = () => {
    if (!file) return;
    onEnqueue(file, options);
    setFile('');
  };

  const updateOption = (key: keyof TranscodeOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-100 flex items-center gap-3">
          <FileVideo className="w-6 h-6 text-red-500" />
          {t('transcode.title')}
        </h2>
        <p className="text-zinc-400 mt-1 text-sm">
          {t('transcode.desc')}
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-zinc-300">{t('transcode.input')}</label>
          <div className="relative">
            <input
              type="text"
              value={file}
              onChange={(e) => setFile(e.target.value)}
              placeholder={t('transcode.placeholder')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-mono text-sm"
            />
            <Upload className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
          </div>
          <p className="text-xs text-zinc-500">
            {t('transcode.note')}
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            {t('transcode.format')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateOption('format', 'mp4')}
              className={cn(
                "p-4 rounded-xl border text-left transition-all",
                options.format === 'mp4'
                  ? "bg-red-600/10 border-red-500/50 ring-1 ring-red-500/20"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
              )}
            >
              <div className="font-semibold text-zinc-100 mb-1">MP4 (H.264/AAC)</div>
              <div className="text-xs text-zinc-400">{t('transcode.mp4.desc')}</div>
            </button>
            <button
              onClick={() => updateOption('format', 'm3u8')}
              className={cn(
                "p-4 rounded-xl border text-left transition-all",
                options.format === 'm3u8'
                  ? "bg-red-600/10 border-red-500/50 ring-1 ring-red-500/20"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
              )}
            >
              <div className="font-semibold text-zinc-100 mb-1">M3U8 (HLS Stream)</div>
              <div className="text-xs text-zinc-400">{t('transcode.m3u8.desc')}</div>
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            {t('transcode.advanced')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">{t('transcode.videoCodec')}</label>
              <select 
                value={options.videoCodec}
                onChange={(e) => updateOption('videoCodec', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
              >
                <option value="copy">{t('transcode.copy')}</option>
                <option value="libx264">H.264 (libx264)</option>
                <option value="libx265">HEVC (libx265)</option>
                <option value="libvpx-vp9">VP9 (libvpx-vp9)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">{t('transcode.audioCodec')}</label>
              <select 
                value={options.audioCodec}
                onChange={(e) => updateOption('audioCodec', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
              >
                <option value="copy">{t('transcode.copy')}</option>
                <option value="aac">AAC</option>
                <option value="libmp3lame">MP3 (libmp3lame)</option>
                <option value="libopus">Opus (libopus)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400">{t('transcode.resolution')}</label>
              <select 
                value={options.videoCodec === 'copy' ? 'original' : options.resolution}
                onChange={(e) => updateOption('resolution', e.target.value)}
                disabled={options.videoCodec === 'copy'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="original">{t('transcode.original')}</option>
                <option value="1080p">1080p (1920x1080)</option>
                <option value="720p">720p (1280x720)</option>
                <option value="480p">480p (854x480)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400">{t('transcode.bitrate')}</label>
              <select 
                value={options.videoCodec === 'copy' ? 'auto' : options.videoBitrate}
                onChange={(e) => updateOption('videoBitrate', e.target.value)}
                disabled={options.videoCodec === 'copy'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="auto">{t('transcode.auto')}</option>
                <option value="8000k">8000 kbps (High)</option>
                <option value="5000k">5000 kbps (Medium)</option>
                <option value="2500k">2500 kbps (Low)</option>
                <option value="1000k">1000 kbps (Very Low)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleTranscode}
            disabled={!file}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            {t('transcode.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
