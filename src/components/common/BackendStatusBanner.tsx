import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle2, ChevronRight, X, ExternalLink, Copy } from 'lucide-react';
import { getSupabaseConfig, isSupabaseConfigured, getSupabaseSetupStatus } from '../../lib/supabaseClient';

interface Props {
  onOpenSetupGuide?: () => void;
}

export const BackendStatusBanner: React.FC<Props> = ({ onOpenSetupGuide }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const status = getSupabaseSetupStatus();
  const config = getSupabaseConfig();

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(
      `VITE_SUPABASE_URL="https://your-project-id.supabase.co"\nVITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key-here"`
    );
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  // If live Supabase is configured, show a compact positive status badge
  if (status.isConfigured) {
    return (
      <aside
        aria-label="Database connection status"
        className="bg-emerald-950/80 border-b border-emerald-800 text-emerald-200 text-xs py-1.5 px-4 flex items-center justify-between gap-3"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-300">Live Backend Active:</span>
            <span className="font-mono text-[11px] text-emerald-100">{config.url}</span>
            <span className="text-emerald-400/80 hidden sm:inline">• PostgreSQL Row Level Security (RLS) Enforced</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-300">
            <span>Auth & Data Synced</span>
          </div>
        </div>
      </aside>
    );
  }

  // If unconfigured and dismissed, show a minimal floating pill or return null
  if (isDismissed) {
    return null;
  }

  // Clear, non-silent setup banner indicating that the app is in offline local sandbox demo mode
  return (
    <aside
      aria-label="Backend setup warning"
      className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-600/50 text-amber-200 text-xs py-2 px-4 shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-amber-300 uppercase tracking-wide text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                Demo Mode Notice
              </span>
              <span className="font-semibold text-white">
                Supabase Backend Not Configured
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 mt-0.5">
              The application is currently operating in an <strong className="text-amber-100">offline local sandbox</strong> (localStorage). 
              Changes are stored in your browser and will not sync to a live database until environment variables are set.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyEnv}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] transition border border-amber-500/30"
            title="Copy .env template with required variable names"
          >
            <Copy className="w-3 h-3 text-amber-400" />
            <span>{copiedEnv ? 'Copied .env keys!' : 'Copy .env Keys'}</span>
          </button>

          {onOpenSetupGuide && (
            <button
              onClick={onOpenSetupGuide}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition shadow-sm active:scale-95"
            >
              <Database className="w-3 h-3 text-slate-950" />
              <span>Connect Supabase</span>
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-amber-400/80 hover:text-amber-200 rounded-md transition"
            title="Dismiss notice for this session"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
