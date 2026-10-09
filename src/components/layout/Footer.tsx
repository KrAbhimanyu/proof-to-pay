import React from 'react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { ShieldCheck, CheckCircle2, Heart, Smartphone } from 'lucide-react';

interface Props {
  onNavigate: (view: string, param?: string) => void;
  onOpenAndroidGuide: () => void;
}

export const Footer: React.FC<Props> = ({ onNavigate, onOpenAndroidGuide }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 text-xs font-black">
                P
              </div>
              <span>Proof-to-Pay</span>
            </div>
            <p className="text-slate-300 font-medium text-xs">
              "Your skills. Your proof. Your first pay."
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              India's verified work-experience platform connecting college students and emerging creators with real paid business projects in INR.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenAndroidGuide}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-emerald-400 hover:text-white border border-slate-700 transition"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android App Guide & APK</span>
              </button>
            </div>
          </div>

          {/* Marketplace navigation */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">Explore</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('browse')} className="hover:text-white transition">
                  Browse Active Projects
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how_it_works')} className="hover:text-white transition">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('portfolio', 'aarav-sharma')} className="hover:text-white transition">
                  Verified Creator Portfolios
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition">
                  About Proof-to-Pay
                </button>
              </li>
            </ul>
          </div>

          {/* Trust, Payment & Safety */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">Trust & Payments</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Indian Businesses (GSTIN/CIN)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fixed INR Budgets & Scope Lockdown</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audited Payment UTR Records</span>
              </li>
              <li>
                <button onClick={() => onNavigate('how_it_works')} className="hover:text-white transition">
                  Dispute Resolution Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">Legal & Security</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white transition">
                  Terms of Service (18+ Adult Policy)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-white transition">
                  Privacy Policy & Account Deletion
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('security')} className="hover:text-white transition">
                  Zero Credential Storage Guarantee
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Proof-to-Pay Technologies India. All rights reserved. Built for Indian Gen Z talent.
          </div>
          <div className="flex items-center gap-4">
            <span>All amounts strictly in INR (₹)</span>
            <span>·</span>
            <span>No Unpaid Spec Work Allowed</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
