import React, { createContext, useContext, useState, ReactNode } from 'react';

const en = {
  'sidebar.single': 'Single Video',
  'sidebar.playlist': 'Playlist / Favs',
  'sidebar.channel': 'Channel',
  'sidebar.transcode': 'FFmpeg Transcode',
  'sidebar.queue': 'Queue',
  'sidebar.settings': 'Settings',
  'sidebar.version': 'v1.0.0 - Desktop Build',

  'download.title.single': 'Download Single Video',
  'download.title.playlist': 'Download Playlist / Favorites',
  'download.title.channel': 'Download Channel',
  'download.desc': 'Enter the YouTube URL below and configure your download options.',
  'download.targetUrl': 'Target URL',
  'download.placeholder.single': 'https://youtube.com/watch?v=...',
  'download.placeholder.batch': 'https://youtube.com/...',
  'download.assets': 'Assets to Download',
  'download.video': 'Video Stream',
  'download.audio': 'Audio Stream',
  'download.subtitles': 'Subtitles / CC',
  'download.thumbnail': 'Thumbnail / Cover',
  'download.mergeHint': 'Super convenient! Checking both video and audio will invoke FFmpeg to merge them automatically.',
  'download.format': 'Output Format',
  'download.packaging': 'Packaging Options',
  'download.raw': 'Raw Files',
  'download.folder': 'Folder',
  'download.zip': 'Zip Archive',
  'download.includeLink': 'Include original URL link file',
  'download.bundlePerVideo': 'Bundle assets per video (Sub-folders/Zips)',
  'download.start': 'Start Download',
  'download.openShadowPro': 'Open ShadowPro',
  'download.parsing': 'Parsing URL...',
  'download.parseSuccess': 'Ready to download',

  'transcode.title': 'FFmpeg Transcoder',
  'transcode.desc': 'Convert local video files to standard formats (MP4) or HLS streams (M3U8).',
  'transcode.input': 'Input File',
  'transcode.placeholder': '/path/to/local/video.mkv',
  'transcode.note': '* In a real desktop app, this would be a file picker dialog.',
  'transcode.format': 'Output Format',
  'transcode.mp4.desc': 'Standard video format, highly compatible across all devices.',
  'transcode.m3u8.desc': 'Segmented video stream, ideal for web players and adaptive bitrate.',
  'transcode.advanced': 'Advanced Options',
  'transcode.videoCodec': 'Video Codec',
  'transcode.audioCodec': 'Audio Codec',
  'transcode.resolution': 'Resolution',
  'transcode.bitrate': 'Video Bitrate',
  'transcode.original': 'Original',
  'transcode.auto': 'Auto',
  'transcode.copy': 'Copy (No re-encode)',
  'transcode.start': 'Start Transcoding',

  'queue.title': 'Task Queue',
  'queue.desc': 'Monitor your active downloads and transcoding jobs.',
  'queue.empty': 'No active tasks in queue.',
  'queue.status.waiting': 'Waiting...',
  'queue.status.downloading': 'Downloading...',
  'queue.status.transcoding': 'Transcoding...',
  'queue.status.packaging': 'Packaging...',
  'queue.status.completed': 'Completed',
  'queue.status.error': 'Error occurred',
  'queue.openFolder': 'Open Folder',

  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.downloadPath': 'Download Path',
  'settings.selectFolder': 'Select Folder',
  'settings.ytdlpPath': 'yt-dlp Core',
  'settings.ffmpegPath': 'FFmpeg Core',
  'settings.bundled': 'Bundled internally (Ready)',
  'settings.desc': 'These core components are bundled with the application. No external installation is required.',

  'app.extracting': 'Extracting info from {{host}}...',

  'pro.badge': 'PRO',
  'pro.modal.title': 'ShadowPro Member Feature',
  'pro.modal.desc': 'This feature is exclusive to ShadowPro members. Please contact the stationmaster to get a free activation code (valid for 3 months).',
  'pro.modal.input': 'Enter Activation Code (e.g., SP-XXXX-YYYY)',
  'pro.modal.activate': 'Activate Now',
  'pro.modal.cancel': 'Cancel',
  'pro.error.invalid': 'Invalid activation code. Please check and try again.',
  'pro.error.expired': 'This activation code has expired.',
  'pro.success': 'Activation successful! Valid until {{date}}',

  'disclaimer.title': 'Disclaimer & Terms of Use',
  'disclaimer.p1': 'This application is intended for ShadowPro users to download videos for oral English learning. Do not use this tool for other purposes.',
  'disclaimer.p2': 'This application is completely free. Only the packaging feature is exclusive to platform members (cannot be purchased separately, it is a member benefit).',
  'disclaimer.p3': 'This application runs locally based on the open-source YT-DLP tool and does not embed any network proxy code. The user is solely responsible for all actions taken using this tool.',
  'disclaimer.agree': 'I agree to the above terms',
};

const zh = {
  'sidebar.single': '单个视频下载',
  'sidebar.playlist': '播放列表批量下载',
  'sidebar.channel': '频道视频批量下载',
  'sidebar.transcode': 'FFmpeg 转码',
  'sidebar.queue': '任务队列',
  'sidebar.settings': '设置',
  'sidebar.version': 'v1.0.0 - 桌面版构建',

  'download.title.single': '下载单个视频',
  'download.title.playlist': '下载播放列表 / 收藏夹',
  'download.title.channel': '下载频道',
  'download.desc': '在下方输入 YouTube 链接并配置您的下载选项。',
  'download.targetUrl': '目标链接',
  'download.placeholder.single': 'https://youtube.com/watch?v=...',
  'download.placeholder.batch': 'https://youtube.com/...',
  'download.assets': '下载素材',
  'download.video': '视频流',
  'download.audio': '音频流',
  'download.subtitles': '字幕 / CC',
  'download.thumbnail': '封面图',
  'download.mergeHint': '超方便！同时勾选视频流和音频流，会调用 FFmpeg 自动合并音视频。',
  'download.format': '输出格式',
  'download.packaging': '打包选项',
  'download.raw': '源文件',
  'download.folder': '文件夹',
  'download.zip': 'Zip 压缩包',
  'download.includeLink': '包含原始 URL 链接文件',
  'download.bundlePerVideo': '为每个视频单独打包（子文件夹/Zip）',
  'download.start': '开始下载',
  'download.openShadowPro': '打开ShadowPro 影读',
  'download.parsing': '正在解析链接...',
  'download.parseSuccess': '解析成功，可下载',

  'transcode.title': 'FFmpeg 视频转码',
  'transcode.desc': '将本地视频文件转换为标准格式 (MP4) 或 HLS 流 (M3U8)。',
  'transcode.input': '输入文件',
  'transcode.placeholder': '/本地路径/视频文件.mkv',
  'transcode.note': '* 在真实的桌面应用中，这里会是一个文件选择弹窗。',
  'transcode.format': '输出格式',
  'transcode.mp4.desc': '标准视频格式，在所有设备上具有极高的兼容性。',
  'transcode.m3u8.desc': '分段视频流，非常适合网页播放器和自适应码率。',
  'transcode.advanced': '高级选项',
  'transcode.videoCodec': '视频编码',
  'transcode.audioCodec': '音频编码',
  'transcode.resolution': '分辨率',
  'transcode.bitrate': '视频码率',
  'transcode.original': '原始',
  'transcode.auto': '自动',
  'transcode.copy': '复制 (不重新编码)',
  'transcode.start': '开始转码',

  'queue.title': '任务队列',
  'queue.desc': '监控您正在进行的下载和转码任务。',
  'queue.empty': '队列中没有活动任务。',
  'queue.status.waiting': '等待中...',
  'queue.status.downloading': '下载中...',
  'queue.status.transcoding': '转码中...',
  'queue.status.packaging': '打包中...',
  'queue.status.completed': '已完成',
  'queue.status.error': '发生错误',
  'queue.openFolder': '打开文件夹',

  'settings.title': '设置',
  'settings.language': '语言 / Language',
  'settings.downloadPath': '下载路径',
  'settings.selectFolder': '更改目录',
  'settings.ytdlpPath': 'yt-dlp 核心',
  'settings.ffmpegPath': 'FFmpeg 核心',
  'settings.bundled': '已内置 (就绪)',
  'settings.desc': '这些核心组件已内置于应用程序中，无需您手动下载或配置环境变量。',

  'app.extracting': '正在提取信息：{{host}}...',

  'pro.badge': '会员',
  'pro.modal.title': 'ShadowPro 会员专属功能',
  'pro.modal.desc': '此高级功能为 ShadowPro 平台会员专属。会员请联系站长获取免费激活码（有效期为 3 个月）。',
  'pro.modal.input': '请输入激活码 (例如: SP-XXXX-YYYY)',
  'pro.modal.activate': '立即激活',
  'pro.modal.cancel': '取消',
  'pro.error.invalid': '激活码无效，请检查后重试。',
  'pro.error.expired': '该激活码已过期。',
  'pro.success': '激活成功！有效期至 {{date}}',

  'disclaimer.title': '免责声明与使用条款',
  'disclaimer.p1': '本应用为 ShadowPro 影读平台用户下载视频学习口语使用，切勿将此工具用作他用。',
  'disclaimer.p2': '本应用完全免费，仅打包功能为平台会员专属（不支持单独开通，这是会员福利）',
  'disclaimer.p3': '本应用基于开源YT-DLP工具本地运行，未嵌入任何网络代理代码，使用本工具的一切行为由使用人负责。',
  'disclaimer.agree': '我同意以上条款',
};

export const translations = { en, zh };

type Language = keyof typeof translations;
type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');

  const t = (key: TranslationKey, params?: Record<string, string>) => {
    let text = translations[language][key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, v);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
