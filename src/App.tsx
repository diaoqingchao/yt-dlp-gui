import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { Sidebar } from './components/Sidebar';
import { DownloadTab } from './components/DownloadTab';
import { TranscodeTab } from './components/TranscodeTab';
import { QueueTab } from './components/QueueTab';
import { ProModal } from './components/ProModal';
import { Task, DownloadOptions, TaskType, TranscodeOptions } from './types';
import { LanguageProvider, useLanguage } from './i18n';
import { Settings, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BinaryStatus {
  yt_dlp: { exists: boolean; version: string | null; path: string };
  ffmpeg: { exists: boolean; version: string | null; path: string };
  is_bundled: boolean;
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('single');
  const [tasks, setTasks] = useState<Task[]>([]);
  const { t, language, setLanguage } = useLanguage();
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [downloadPath, setDownloadPath] = useState<string>('~/Downloads/ShadowPro');
  
  const [isPro, setIsPro] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  
  const [binaryStatus, setBinaryStatus] = useState<BinaryStatus | null>(null);
  const [isCheckingBinaries, setIsCheckingBinaries] = useState(true);

  useEffect(() => {
    const savedExp = localStorage.getItem('shadowpro_exp');
    if (savedExp) {
      const exp = parseInt(savedExp, 10);
      if (Date.now() < exp) {
        setIsPro(true);
      } else {
        localStorage.removeItem('shadowpro_exp');
      }
    }
    
    checkBinaryStatus();
    
    // 监听任务进度事件
    const unlisten = listen('task-progress', (event: any) => {
      const { task_id, progress, status } = event.payload;
      setTasks(currentTasks => 
        currentTasks.map(task => 
          task.id === task_id ? { ...task, progress, status } : task
        )
      );
    });
    
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);
  
  const checkBinaryStatus = async () => {
    try {
      const status = await invoke<BinaryStatus>('get_binary_status');
      setBinaryStatus(status);
    } catch (e) {
      console.error('Failed to get binary status:', e);
    }
    setIsCheckingBinaries(false);
  };

  const handleProSuccess = (expDate: number) => {
    localStorage.setItem('shadowpro_exp', expDate.toString());
    setIsPro(true);
    setShowProModal(false);
    
    const dateStr = new Date(expDate).toLocaleDateString();
    alert(t('pro.success').replace('{{date}}', dateStr));
  };

  const handleSelectFolder = async () => {
    try {
      const path = await invoke<string | null>('select_folder');
      if (path) setDownloadPath(path);
    } catch (e) {
      console.error('Failed to select folder:', e);
    }
  };

  const handleOpenFolder = async (taskId: string) => {
    try {
      await invoke('open_folder', { path: downloadPath });
    } catch (e) {
      console.error('Failed to open folder:', e);
    }
  };

  const handleEnqueueDownload = async (url: string, options: DownloadOptions) => {
    let hostname = 'unknown source';
    try {
      hostname = new URL(url).hostname;
    } catch (e) {
      // ignore invalid url error
    }

    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      urlOrFile: url,
      type: activeTab as TaskType,
      status: 'downloading',
      progress: 0,
      options,
      fileName: t('app.extracting', { host: hostname })
    };
    
    setTasks(prev => [newTask, ...prev]);
    setActiveTab('queue');

    try {
      await invoke('start_download', { 
        task: {
          ...newTask,
          task_type: newTask.type,
          url_or_file: newTask.urlOrFile,
        }, 
        downloadPath 
      });
    } catch (e) {
      console.error('Failed to start download:', e);
      setTasks(currentTasks => 
        currentTasks.map(t => 
          t.id === newTask.id ? { ...t, status: 'error', error: String(e) } : t
        )
      );
    }
  };

  const handleEnqueueTranscode = async (file: string, options: TranscodeOptions) => {
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      urlOrFile: file,
      type: 'transcode',
      status: 'transcoding',
      progress: 0,
      fileName: file.split('/').pop() || file,
      options
    };
    
    setTasks(prev => [newTask, ...prev]);
    setActiveTab('queue');
    
    try {
      await invoke('start_transcode', { 
        task: {
          ...newTask,
          task_type: newTask.type,
          url_or_file: newTask.urlOrFile,
        }, 
        outputPath: downloadPath 
      });
    } catch (e) {
      console.error('Failed to start transcode:', e);
      setTasks(currentTasks => 
        currentTasks.map(t => 
          t.id === newTask.id ? { ...t, status: 'error', error: String(e) } : t
        )
      );
    }
  };

  const handleRemoveTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 overflow-hidden font-sans selection:bg-red-500/30">
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl mx-4">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">{t('disclaimer.title')}</h2>
            <div className="space-y-4 text-zinc-300 text-sm leading-relaxed mb-8">
              <p>{t('disclaimer.p1')}</p>
              <p>{t('disclaimer.p2')}</p>
              <p>{t('disclaimer.p3')}</p>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {t('disclaimer.agree')}
            </button>
          </div>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto relative">
        {activeTab === 'single' && <DownloadTab type="single" onEnqueue={handleEnqueueDownload} isPro={isPro} onRequirePro={() => setShowProModal(true)} />}
        {activeTab === 'playlist' && <DownloadTab type="playlist" onEnqueue={handleEnqueueDownload} isPro={isPro} onRequirePro={() => setShowProModal(true)} />}
        {activeTab === 'channel' && <DownloadTab type="channel" onEnqueue={handleEnqueueDownload} isPro={isPro} onRequirePro={() => setShowProModal(true)} />}
        {activeTab === 'transcode' && <TranscodeTab onEnqueue={handleEnqueueTranscode} />}
        {activeTab === 'queue' && <QueueTab tasks={tasks} onRemove={handleRemoveTask} onOpenFolder={handleOpenFolder} />}
        
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto p-8 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-100 flex items-center gap-3">
                <Settings className="w-6 h-6 text-zinc-400" />
                {t('settings.title')}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">{t('settings.language')}</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setLanguage('zh')}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${language === 'zh' ? 'bg-red-600/10 border-red-500/50 text-red-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                  >
                    中文
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${language === 'en' ? 'bg-red-600/10 border-red-500/50 text-red-500' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <label className="text-sm font-medium text-zinc-300">{t('settings.downloadPath')}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={downloadPath} 
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 font-mono text-sm focus:outline-none focus:border-zinc-700" 
                  />
                  <button 
                    onClick={handleSelectFolder} 
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-zinc-700 whitespace-nowrap"
                  >
                    {t('settings.selectFolder')}
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <label className="text-sm font-medium text-zinc-300">{t('settings.ytdlpPath')}</label>
                {isCheckingBinaries ? (
                  <div className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-zinc-400 font-mono text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    检查中...
                  </div>
                ) : binaryStatus?.yt_dlp.exists ? (
                  <div className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-emerald-500 font-mono text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{binaryStatus.is_bundled ? '已内置' : '系统安装'}</span>
                    </div>
                    <div className="text-xs text-zinc-500 truncate">{binaryStatus.yt_dlp.version || '版本未知'}</div>
                  </div>
                ) : (
                  <div className="w-full bg-zinc-950/50 border border-red-800/50 rounded-lg px-4 py-2.5 text-red-500 font-mono text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    未找到 - 请重新安装应用
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">{t('settings.ffmpegPath')}</label>
                {isCheckingBinaries ? (
                  <div className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-zinc-400 font-mono text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    检查中...
                  </div>
                ) : binaryStatus?.ffmpeg.exists ? (
                  <div className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg px-4 py-2.5 text-emerald-500 font-mono text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{binaryStatus.is_bundled ? '已内置' : '系统安装'}</span>
                    </div>
                    <div className="text-xs text-zinc-500 truncate">{binaryStatus.ffmpeg.version || '版本未知'}</div>
                  </div>
                ) : (
                  <div className="w-full bg-zinc-950/50 border border-red-800/50 rounded-lg px-4 py-2.5 text-red-500 font-mono text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    未找到 - 请重新安装应用
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-500 pt-2">
                {t('settings.desc')}
              </p>
            </div>
          </div>
        )}
      </main>

      {showProModal && (
        <ProModal 
          onClose={() => setShowProModal(false)} 
          onSuccess={handleProSuccess} 
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
