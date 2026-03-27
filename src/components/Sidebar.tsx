import React from 'react';
import { Download, ListVideo, FolderKanban, Settings, HardDriveDownload, FileVideo, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { t } = useLanguage();
  
  const navItems = [
    { id: 'single', label: t('sidebar.single'), icon: Download },
    { id: 'playlist', label: t('sidebar.playlist'), icon: ListVideo },
    { id: 'channel', label: t('sidebar.channel'), icon: FolderKanban },
    { id: 'transcode', label: t('sidebar.transcode'), icon: FileVideo },
    { id: 'queue', label: t('sidebar.queue'), icon: Activity },
    { id: 'settings', label: t('sidebar.settings'), icon: Settings },
  ];

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
        <div className="bg-red-600 p-2 rounded-lg">
          <HardDriveDownload className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Shadow yt-dlp</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-red-600/10 text-red-500" 
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500 text-center">
        {t('sidebar.version')}
      </div>
    </div>
  );
}
