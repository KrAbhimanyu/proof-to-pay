import React, { useState, useMemo } from 'react';
import { User, UserRole, ReferralLeaderboardEntry } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  TrendingUp,
  Users,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Copy,
  Check,
  Star,
  Flame,
  Zap,
  Building2,
  GraduationCap,
  Briefcase
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  onOpenAuth?: (mode?: 'login' | 'register_student' | 'register_business' | 'register_recruiter') => void;
  onNavigate?: (view: string, param?: string) => void;
}

export const Leaderboard: React.FC<Props> = ({
  currentUser,
  onOpenAuth,
  onNavigate
}) => {
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [timeframe, setTimeframe] = useState<'ALL_TIME' | 'THIS_MONTH' | 'THIS_QUARTER'>('ALL_TIME');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeUserId = currentUser?.id;

  // Retrieve raw leaderboard entries from storage
  const leaderboardEntries = useMemo(() => {
    return marketplaceStore.getReferralLeaderboard(roleFilter, activeUserId);
  }, [roleFilter, activeUserId]);

  // Filter by search query (name, college, company, city, code)
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return leaderboardEntries;
    const q = searchQuery.toLowerCase().trim();
    return leaderboardEntries.filter((entry) => {
      return (
        entry.userName.toLowerCase().includes(q) ||
        entry.userEmail.toLowerCase().includes(q) ||
        (entry.collegeOrCompany && entry.collegeOrCompany.toLowerCase().includes(q)) ||
        (entry.city && entry.city.toLowerCase().includes(q)) ||
        entry.referralCode.toLowerCase().includes(q)
      );
    });
  }, [leaderboardEntries, searchQuery]);

  // Find user's own entry
  const userEntry = useMemo(() => {
    if (!activeUserId) return null;
    return marketplaceStore.getReferralLeaderboard('ALL', activeUserId).find(
      (e) => e.userId === activeUserId
    ) || null;
  }, [activeUserId]);

  // User's own stats fallback if not in top list
  const userStats = useMemo(() => {
    if (!activeUserId) return null;
    return marketplaceStore.getReferralStats(activeUserId);
  }, [activeUserId]);

  const topThree = filteredEntries.slice(0, 3);
  const remainingEntries = filteredEntries.slice(3);

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'STUDENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <GraduationCap className="w-3 h-3" />
            <span>Student Creator</span>
          </span>
        );
      case 'RECRUITER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Briefcase className="w-3 h-3" />
            <span>Tech Recruiter</span>
          </span>
        );
      case 'BUSINESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Building2 className="w-3 h-3" />
            <span>Business Founder</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <span>{role}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8" id="referral-leaderboard-section">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Top Referrers Leaderboard
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Recognizing creators, recruiters, and founders with the highest verified project conversions
          </p>
        </div>

        {/* Timeframe pill selector */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold self-start md:self-auto">
          <button
            onClick={() => setTimeframe('ALL_TIME')}
            className={`px-3 py-1.5 rounded-xl transition ${
              timeframe === 'ALL_TIME'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeframe('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              timeframe === 'THIS_MONTH'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>This Month</span>
          </button>
          <button
            onClick={() => setTimeframe('THIS_QUARTER')}
            className={`px-3 py-1.5 rounded-xl transition ${
              timeframe === 'THIS_QUARTER'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Q4 2026
          </button>
        </div>
      </div>

      {/* Prize Pool Grants Strip */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-amber-500/20 p-5 sm:p-6 text-slate-900 dark:text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Monthly Ambassador Grants Program
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  Active Cycle
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                Top monthly advocates receive direct INR cash awards, verified profile glow badges, and VIP platform access upon successful referee milestone completion.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 text-center shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase">#1 Rank</div>
              <div className="text-sm font-black text-amber-600 dark:text-amber-400">₹5,000 INR</div>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase">#2 - #3 Rank</div>
              <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">₹2,500 INR</div>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase">#4 - #10 Rank</div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹1,000 INR</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              roleFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Roles
          </button>
          <button
            onClick={() => setRoleFilter('STUDENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'STUDENT'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Creators</span>
          </button>
          <button
            onClick={() => setRoleFilter('RECRUITER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'RECRUITER'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Recruiters</span>
          </button>
          <button
            onClick={() => setRoleFilter('BUSINESS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              roleFilter === 'BUSINESS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Businesses</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search referrers or college/city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Logged-In User Standing Banner */}
      {currentUser && (
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md">
              {userEntry ? `#${userEntry.rank}` : '—'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Your Current Standing
                </span>
                {userEntry?.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                    {userEntry.badge}
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {userEntry ? (
                  <span>
                    Rank #{userEntry.rank} · {userEntry.successfulConversions} Successful Conversions (
                    {userEntry.conversionRate}% rate) · ₹{userEntry.totalEarnedINR.toLocaleString('en-IN')} Earned
                  </span>
                ) : (
                  <span>
                    No verified conversions yet · {userStats?.totalInvited || 0} peers invited so far
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Your invite code: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{userStats?.referralCode || 'YOURCODE'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => userStats && handleCopyCode(userStats.referralCode)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              {copiedCode === userStats?.referralCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1.5">
            <Medal className="w-4 h-4 text-amber-500" />
            <span>Top Conversion Leaders</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topThree.map((entry) => {
              const isFirst = entry.rank === 1;
              const isSecond = entry.rank === 2;
              const isThird = entry.rank === 3;

              return (
                <div
                  key={entry.userId}
                  className={`relative rounded-3xl p-6 transition flex flex-col justify-between ${
                    isFirst
                      ? 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white dark:to-slate-900 border-2 border-amber-400 dark:border-amber-500/60 shadow-xl shadow-amber-500/10 order-first md:order-2'
                      : isSecond
                      ? 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md order-2 md:order-1'
                      : 'bg-white dark:bg-slate-900 border border-amber-700/30 dark:border-amber-700/40 shadow-md order-3'
                  }`}
                >
                  {/* Top Rank Badge & Crown */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm ${
                          isFirst
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                            : isSecond
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                            : 'bg-amber-700/20 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isFirst ? <Crown className="w-5 h-5 text-slate-950" /> : `#${entry.rank}`}
                      </div>
                      <div>
                        <span
                          className={`text-xs font-black uppercase tracking-wide ${
                            isFirst
                              ? 'text-amber-600 dark:text-amber-400'
                              : isSecond
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-amber-700 dark:text-amber-500'
                          }`}
                        >
                          {isFirst ? '1st Place · Champion' : isSecond ? '2nd Place' : '3rd Place'}
                        </span>
                        {entry.badge && (
                          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {entry.badge}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Chip */}
                    <div>{getRoleBadge(entry.userRole)}</div>
                  </div>

                  {/* Member Profile Identity */}
                  <div className="my-5 flex items-center gap-3.5">
                    <div className="relative">
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.userName}
                          className={`w-14 h-14 rounded-2xl object-cover border-2 ${
                            isFirst
                              ? 'border-amber-400'
                              : isSecond
                              ? 'border-slate-300 dark:border-slate-600'
                              : 'border-amber-700/40'
                          }`}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                          {entry.userName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {isFirst && (
                        <div className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow-xs">
                          <Star className="w-3 h-3 fill-slate-950" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-black text-base text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>{entry.userName}</span>
                        {entry.isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-500 text-white">
                            You
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {entry.collegeOrCompany || entry.city || 'Verified Member'}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 font-mono">
                        <span>Code: {entry.referralCode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Metrics */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Conversions
                      </span>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {entry.successfulConversions}{' '}
                        <span className="text-xs font-semibold text-slate-500">
                          / {entry.totalInvited}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {entry.conversionRate}% completion rate
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Earned Rewards
                      </span>
                      <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                        ₹{entry.totalEarnedINR.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Disbursed to Bank
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranks 4+ Table View */}
      {remainingEntries.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Runner-Up Advocates & Rising Ambassadors
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ranked positions #4 and beyond based on milestone activations
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {remainingEntries.length} Contenders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 font-semibold text-center w-12">Rank</th>
                  <th className="pb-3 font-semibold">Member</th>
                  <th className="pb-3 font-semibold">Role & Organization</th>
                  <th className="pb-3 font-semibold">Invite Code</th>
                  <th className="pb-3 font-semibold text-center">Conversions</th>
                  <th className="pb-3 font-semibold text-center">Conversion Rate</th>
                  <th className="pb-3 font-semibold text-right">Earned INR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {remainingEntries.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition ${
                      entry.isCurrentUser
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-medium'
                        : ''
                    }`}
                  >
                    <td className="py-3.5 text-center font-black text-slate-500">
                      <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 inline-flex items-center justify-center text-xs">
                        #{entry.rank}
                      </span>
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt={entry.userName}
                            className="w-8 h-8 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {entry.userName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{entry.userName}</span>
                            {entry.isCurrentUser && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500 text-white">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{entry.userEmail}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <div className="space-y-1">
                        <div>{getRoleBadge(entry.userRole)}</div>
                        <div className="text-[11px] text-slate-500">
                          {entry.collegeOrCompany || entry.city || '—'}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <button
                        onClick={() => handleCopyCode(entry.referralCode)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                        title="Click to copy code"
                      >
                        <span>{entry.referralCode}</span>
                        {copiedCode === entry.referralCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 text-center">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {entry.successfulConversions}
                      </span>
                      <span className="text-slate-400 text-[11px]"> / {entry.totalInvited}</span>
                    </td>

                    <td className="py-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, entry.conversionRate)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                          {entry.conversionRate}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 text-right font-black text-slate-900 dark:text-white">
                      ₹{entry.totalEarnedINR.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            No referrers matched your filter
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try clearing your search query or switching role filters to view other leaderboard candidates.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Anti-Sybil & Fair Play Guidelines */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Fair Play & Anti-Sybil Leaderboard Verification Rules</span>
        </div>
        <p className="leading-relaxed">
          Leaderboard ranking is strictly calculated from <strong className="text-slate-700 dark:text-slate-300">verified milestone deliverable payouts</strong> (approved projects with verified bank UTR or verified recruiter candidate placements). Fake registrations, circular project listings, or duplicate bot accounts are automatically disqualified by automated audit telemetry.
        </p>
      </div>
    </div>
  );
};
