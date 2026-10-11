import React from 'react';
import { Sparkles, MessageSquareHeart, ShieldCheck, CheckSquare } from 'lucide-react';

interface Props {
  onOpenFeedback: () => void;
  onNavigate?: (view: string) => void;
}

export const BetaBanner: React.FC<Props> = ({ onOpenFeedback, onNavigate }) => {
  return (
    <aside aria-label="Beta launch announcement" className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white text-xs py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-100">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Beta Phase 1
          </span>
          <span className="font-medium text-emerald-50">
            ₹0 Launch Beta: 100% free with direct INR settlements. Help test India's student work-proof network!
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('pilot_checklist')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/40 hover:bg-emerald-500/60 text-white font-semibold text-[11px] transition backdrop-blur-sm border border-emerald-300/30 active:scale-95"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-200" />
              <span>Pilot Checklist</span>
            </button>
          )}

          <button
            onClick={onOpenFeedback}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold text-[11px] transition backdrop-blur-sm border border-white/20 active:scale-95"
          >
            <MessageSquareHeart className="w-3.5 h-3.5 text-pink-200" />
            <span>Give Beta Feedback</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
