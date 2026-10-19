import React, { useState } from 'react';
import { User, ReferralRecord, ReferralStats } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { Leaderboard } from '../common/Leaderboard';
import {
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Percent,
  Award,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Trophy,
  Flame,
  HelpCircle
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register_student' | 'register_business' | 'register_recruiter') => void;
}

export const ReferralNetwork: React.FC<Props> = ({
  currentUser,
  onNavigate,
  onOpenAuth
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'activity' | 'perks'>('leaderboard');

  // Fallback demo user ID if not logged in
  const activeUserId = currentUser?.id || 'student-1';
  const referralStats: ReferralStats = marketplaceStore.getReferralStats(activeUserId);
  const referrals: ReferralRecord[] = marketplaceStore.getReferrals(activeUserId);

  const referralUrl = `https://prooftopay.in/ref/${referralStats.referralCode}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const shareText = encodeURIComponent(
    `Join me on Proof-to-Pay — India's verified work-experience and paid project platform for students and emerging creators! Use my code ${referralStats.referralCode} to get started:`
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-950 p-8 sm:p-12 text-white border border-slate-800 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Gift className="w-3.5 h-3.5" />
              <span>Proof-to-Pay Referral & Ambassador Network</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Invite Peers. Grow the Network. <span className="text-emerald-400">Earn Real INR.</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Every verified Indian creator, hiring business, and recruiter you introduce strengthens
              our trust graph. When your invitee completes their first verified milestone, you both earn rewards.
            </p>

            {/* Quick Link Share Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono text-emerald-300">
                <span className="truncate">{referralUrl}</span>
                <span className="text-[11px] font-bold text-white uppercase ml-2 px-2 py-0.5 rounded bg-emerald-500/30">
                  {referralStats.referralCode}
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
              </button>
            </div>

            {/* Social Share Badges */}
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-300 flex-wrap">
              <span className="text-slate-400">Share via:</span>
              <a
                href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(referralUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 transition text-[11px] font-semibold flex items-center gap-1.5"
              >
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-300 transition text-[11px] font-semibold flex items-center gap-1.5"
              >
                LinkedIn
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(referralUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-300 transition text-[11px] font-semibold flex items-center gap-1.5"
              >
                X / Twitter
              </a>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-indigo-500 to-transparent" />
        </div>

        {/* Telemetry / Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Invited</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {referralStats.totalInvited}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {referralStats.totalJoined} registered so far
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Activated Milestones</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {referralStats.totalActivated}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Completed verified project contracts
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Earned Rewards</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{referralStats.totalEarnedINR.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
              +₹{referralStats.pendingRewardINR.toLocaleString('en-IN')} in pipeline
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Fee Discount</span>
              <Percent className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {referralStats.commissionDiscountPercent}% OFF
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Platform commission reduction
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-6 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Top Referrers Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-500" />
            <span>My Referral Activity ({referrals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('perks')}
            className={`pb-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'perks'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Rewards & Ambassador Tiers</span>
          </button>
        </div>

        {/* Tab 1: Leaderboard View */}
        {activeTab === 'leaderboard' && (
          <Leaderboard
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
            onNavigate={onNavigate}
          />
        )}

        {/* Tab 2: Rewards & Ambassador Tiers */}
        {activeTab === 'perks' && (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                How Proof-to-Pay Referral Rewards Work
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">For Student Creators</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Invite fellow college creators. When your referred peer completes their first verified paid client deliverable, you receive <strong className="text-emerald-600 dark:text-emerald-400">₹500 INR direct bank payout</strong> and unlock the <strong className="text-indigo-600 dark:text-indigo-400">Community Scout</strong> badge.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black text-sm flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">For Verified Businesses</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Introduce other founders and businesses. When they post and settle their first student project, you unlock <strong className="text-blue-600 dark:text-blue-400">0% platform commission</strong> on your next project and ₹1,000 project hiring credit.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-sm flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">For Tech Recruiters</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Recommend other talent acquisition partners or agencies. Earn <strong className="text-indigo-600 dark:text-indigo-400">₹1,500 INR referral reward</strong> per hired creator placed through their curated talent collections.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Referrals Activity Table */}
        {activeTab === 'activity' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Your Referral Activity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live status of peers and partners who registered with your invite code
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {referrals.length} {referrals.length === 1 ? 'Referral' : 'Referrals'}
              </span>
            </div>

          {referrals.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-500">
              No referrals yet. Share your code <span className="font-bold text-slate-900 dark:text-white">{referralStats.referralCode}</span> with peers!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                    <th className="pb-3 font-semibold">Invitee</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Joined Date</th>
                    <th className="pb-3 font-semibold">Milestone Status</th>
                    <th className="pb-3 font-semibold text-right">Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 font-medium text-slate-900 dark:text-white">
                        <div>{r.refereeName}</div>
                        <div className="text-[10px] text-slate-400">{r.refereeEmail}</div>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.refereeRole === 'STUDENT'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : r.refereeRole === 'BUSINESS'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                        }`}>
                          {r.refereeRole}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          {r.status === 'ACTIVE_MILESTONE' || r.status === 'REWARDED' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Milestone Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>Joined · Project in progress</span>
                            </span>
                          )}
                        </div>
                        {r.milestoneTitle && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                            {r.milestoneTitle}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {r.status === 'ACTIVE_MILESTONE' || r.status === 'REWARDED' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +₹{r.rewardAmountINR.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            ₹{r.rewardAmountINR.toLocaleString('en-IN')} pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

        {/* Security & Audit Notice */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Audit & Anti-Sybil Protection:
            </span>{' '}
            Referral payouts are disbursed via UPI / direct bank transfer only after the referee's milestone deliverable is approved and audited by a verified business client with verified bank UTR. Self-referrals and circular hiring are flagged and blocked by platform risk telemetry.
          </div>
        </div>

      </div>
    </div>
  );
};
