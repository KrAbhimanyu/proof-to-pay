import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

interface Props {
  variant?: 'button' | 'compact' | 'banner';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={install}
          title="Install Android App"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install Android App</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs md:text-sm font-semibold text-white shadow-md hover:from-emerald-700 hover:to-teal-700 transition active:scale-95 whitespace-nowrap"
      >
        <Download className="w-4 h-4" />
        <span>Install Proof-to-Pay Android App</span>
      </button>
    );
  }

  // Fallback for browsers without beforeinstallprompt or iOS
  return (
    <>
      <button
        onClick={() => (isIOS ? setShowIOSGuide(true) : setShowAndroidModal(true))}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition whitespace-nowrap"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
        <span>Install App</span>
      </button>

      {showAndroidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Install on Android</h3>
              </div>
              <button
                onClick={() => setShowAndroidModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>Proof-to-Pay</strong> is a progressive Android application with offline caching, high-performance touch response, and push notifications.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">To add to your phone:</p>
                <p>1. Open this website in <strong>Google Chrome for Android</strong>.</p>
                <p>2. Tap the <strong>⋮ (three dots)</strong> menu at the top right.</p>
                <p>3. Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
                <p>4. The app icon will appear directly in your Android app drawer.</p>
              </div>
            </div>
            <button
              onClick={() => setShowAndroidModal(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 text-white dark:bg-emerald-600 py-2.5 text-xs font-semibold hover:bg-slate-800 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Launch Proof-to-Pay anytime without browser chrome.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
