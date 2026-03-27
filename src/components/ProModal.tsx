import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { useLanguage } from '@/i18n';
import { verifyCode } from '@/lib/pro';

interface ProModalProps {
  onClose: () => void;
  onSuccess: (expDate: number) => void;
}

export function ProModal({ onClose, onSuccess }: ProModalProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleActivate = () => {
    setError('');
    const result = verifyCode(code);
    
    if (result.valid && result.exp) {
      onSuccess(result.exp);
    } else {
      if (result.error === 'expired') {
        setError(t('pro.error.expired'));
      } else {
        setError(t('pro.error.invalid'));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl mx-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">{t('pro.modal.title')}</h2>
        </div>
        
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          {t('pro.modal.desc')}
        </p>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('pro.modal.input')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-mono text-center uppercase"
            />
            {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 rounded-xl transition-colors"
            >
              {t('pro.modal.cancel')}
            </button>
            <button
              onClick={handleActivate}
              disabled={!code.trim()}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pro.modal.activate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
