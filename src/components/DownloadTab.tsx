import React, { useState, useEffect } from 'react';
import { DownloadOptions, TaskType } from '@/types';
import { FileArchive, Folder, Link as LinkIcon, Download, CheckSquare, Square, ExternalLink, Info, Loader2, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';

interface DownloadTabProps {
  type: TaskType;
  onEnqueue: (url: string, options: DownloadOptions) => void;
  isPro?: boolean;
  onRequirePro?: () => void;
}

export function DownloadTab({ type, onEnqueue, isPro = false, onRequirePro = () => {} }: DownloadTabProps) {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<{ title: string; duration: string; uploader: string } | null>(null);
  const [options, setOptions] = useState<DownloadOptions>({
    video: true,
    audio: true,
    subtitles: true,
    thumbnail: true,
    format: 'mp4',
    packaging: 'none',
    includeLinkFile: false,
    bundlePerVideo: false,
  });

  useEffect(() => {
    if (!url || !url.startsWith('http')) {
      setParsedInfo(null);
      setIsParsing(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsParsing(true);
      setParsedInfo(null);

      // Mock parsing delay
      setTimeout(() => {
        setIsParsing(false);
        setParsedInfo({
          title: type === 'single' ? 'Learn English with ShadowPro - Episode 1' : type === 'playlist' ? 'Complete English Course (24 videos)' : 'ShadowPro Official Channel',
          duration: type === 'single' ? '12:34' : 'N/A',
          uploader: 'ShadowPro Academy'
        });
      }, 1500);
    }, 800); // Debounce typing

    return () => clearTimeout(timer);
  }, [url, type]);

  const toggleOption = (key: keyof DownloadOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setFormat = (format: DownloadOptions['format']) => {
    setOptions(prev => ({ ...prev, format }));
  };

  const setPackaging = (packaging: DownloadOptions['packaging']) => {
    setOptions(prev => ({ ...prev, packaging }));
  };

  const handleDownload = () => {
    if (!url) return;
    onEnqueue(url, options);
    setUrl('');
  };

  const isBatch = type === 'playlist' || type === 'channel';

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">
            {type === 'single' ? t('download.title.single') : type === 'playlist' ? t('download.title.playlist') : t('download.title.channel')}
          </h2>
          <p className="text-zinc-400 mt-1 text-sm">
            {t('download.desc')}
          </p>
        </div>
        <a
          href="https://shadow.cn"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-zinc-700 shrink-0"
        >
          {t('download.openShadowPro')}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">{t('download.targetUrl')}</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={type === 'single' ? t('download.placeholder.single') : t('download.placeholder.batch')}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
          />
        </div>
        
        {isParsing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
            {t('download.parsing')}
          </div>
        )}

        {parsedInfo && !isParsing && (
          <div className="mt-3 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="w-24 h-16 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative">
              <Youtube className="w-8 h-8 text-zinc-600" />
              {parsedInfo.duration !== 'N/A' && (
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                  {parsedInfo.duration}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-zinc-200 truncate">{parsedInfo.title}</h4>
              <p className="text-xs text-zinc-500 mt-1">{parsedInfo.uploader}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-medium">
                  {t('download.parseSuccess')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Assets Selection */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">{t('download.assets')}</h3>
          <div className="space-y-3">
            {[
              { id: 'video', label: t('download.video') },
              { id: 'audio', label: t('download.audio') },
              { id: 'subtitles', label: t('download.subtitles') },
              { id: 'thumbnail', label: t('download.thumbnail') },
            ].map((asset) => (
              <label key={asset.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleOption(asset.id as keyof DownloadOptions)}>
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                  options[asset.id as keyof DownloadOptions] 
                    ? "bg-red-600 border-red-600" 
                    : "border-zinc-700 bg-zinc-900 group-hover:border-zinc-500"
                )}>
                  {options[asset.id as keyof DownloadOptions] && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{asset.label}</span>
              </label>
            ))}
          </div>
          {options.video && options.audio && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300/80 leading-relaxed">
                {t('download.mergeHint')}
              </p>
            </div>
          )}
        </div>

        {/* Format & Packaging */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">{t('download.format')}</h3>
            <div className="flex flex-wrap gap-2">
              {['mp4', 'mkv', 'webm', 'm3u8'].map((fmt) => {
                const isRestricted = fmt !== 'mp4';
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      if (isRestricted && !isPro) {
                        onRequirePro();
                        return;
                      }
                      setFormat(fmt as any);
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5",
                      options.format === fmt
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    )}
                  >
                    {fmt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-300 border-b border-zinc-800 pb-2">{t('download.packaging')}</h3>
            <div className="flex gap-2">
              {[
                { id: 'none', label: t('download.raw'), icon: Download },
                { id: 'folder', label: t('download.folder'), icon: Folder },
                { id: 'zip', label: t('download.zip'), icon: FileArchive }
              ].map((pkg) => {
                const isRestricted = pkg.id !== 'none';
                const Icon = pkg.icon;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      if (isRestricted && !isPro) {
                        onRequirePro();
                        return;
                      }
                      setPackaging(pkg.id as any);
                    }}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg border text-sm flex flex-col items-center gap-2 transition-colors relative",
                      options.packaging === pkg.id
                        ? "bg-red-600/10 border-red-600/50 text-red-500"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex items-center gap-1">
                      {pkg.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleOption('includeLinkFile')}>
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                  options.includeLinkFile 
                    ? "bg-red-600 border-red-600" 
                    : "border-zinc-700 bg-zinc-900 group-hover:border-zinc-500"
                )}>
                  {options.includeLinkFile && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5" /> {t('download.includeLink')}
                </span>
              </label>

              {isBatch && (
                <label className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleOption('bundlePerVideo')}>
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    options.bundlePerVideo 
                      ? "bg-red-600 border-red-600" 
                      : "border-zinc-700 bg-zinc-900 group-hover:border-zinc-500"
                  )}>
                    {options.bundlePerVideo && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                    {t('download.bundlePerVideo')}
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800 flex justify-end">
        <button
          onClick={handleDownload}
          disabled={!url}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          {t('download.start')}
        </button>
      </div>
    </div>
  );
}
