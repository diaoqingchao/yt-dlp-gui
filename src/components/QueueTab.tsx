import React from 'react';
import { Task } from '@/types';
import { Download, FileVideo, CheckCircle2, AlertCircle, Loader2, XCircle, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';

interface QueueTabProps {
  tasks: Task[];
  onRemove: (id: string) => void;
  onOpenFolder?: (id: string) => void;
}

export function QueueTab({ tasks, onRemove, onOpenFolder }: QueueTabProps) {
  const { t } = useLanguage();

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
          <Download className="w-8 h-8 text-zinc-700" />
        </div>
        <p>{t('queue.empty')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-100">{t('queue.title')}</h2>
        <p className="text-zinc-400 mt-1 text-sm">
          {t('queue.desc')}
        </p>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-zinc-950 flex items-center justify-center shrink-0">
              {task.type === 'transcode' ? (
                <FileVideo className="w-5 h-5 text-blue-500" />
              ) : (
                <Download className="w-5 h-5 text-red-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-zinc-200 truncate pr-4">
                  {task.fileName || task.urlOrFile}
                </h4>
                <span className="text-xs font-mono text-zinc-500 shrink-0">
                  {Math.round(task.progress)}%
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    task.status === 'error' ? "bg-red-500" :
                    task.status === 'completed' ? "bg-emerald-500" :
                    task.type === 'transcode' ? "bg-blue-500" : "bg-red-500"
                  )}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {task.status === 'pending' && <span className="text-zinc-500">{t('queue.status.waiting')}</span>}
                  {task.status === 'downloading' && <><Loader2 className="w-3 h-3 animate-spin" /> {t('queue.status.downloading')}</>}
                  {task.status === 'transcoding' && <><Loader2 className="w-3 h-3 animate-spin" /> {t('queue.status.transcoding')}</>}
                  {task.status === 'packaging' && <><Loader2 className="w-3 h-3 animate-spin" /> {t('queue.status.packaging')}</>}
                  {task.status === 'completed' && <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-500">{t('queue.status.completed')}</span></>}
                  {task.status === 'error' && <><AlertCircle className="w-3 h-3 text-red-500" /> <span className="text-red-500">{task.error || t('queue.status.error')}</span></>}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {task.type}
                  </span>
                  {task.options?.format && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {task.options.format}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {task.status === 'completed' && (
                <button 
                  onClick={() => onOpenFolder?.(task.id)}
                  className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                  title={t('queue.openFolder')}
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => onRemove(task.id)}
                className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Remove task"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
