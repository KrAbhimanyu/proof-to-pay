import React, { useState } from 'react';
import {
  StudentProfile,
  User,
  VerifiedReview,
  ProjectSubmission,
  ProjectListing,
  PaymentRecord,
  MilestoneBadge,
  BadgeTier
} from '../../types';
import {
  getCreatorBadges,
  calculateCreatorLevel,
  getTierColorClasses
} from '../../lib/badges';
import { marketplaceStore } from '../../lib/storage';
import confetti from 'canvas-confetti';
import {
  Award,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Coins,
  Rocket,
  Lock,
  Sparkles,
  Info,
  X,
  Share2,
  BookmarkCheck,
  Bookmark,
  TrendingUp,
  Check
} from 'lucide-react';

interface Props {
  profile: StudentProfile;
  user: User;
  reviews?: VerifiedReview[];
  submissions?: ProjectSubmission[];
  projects?: ProjectListing[];
  payments?: PaymentRecord[];
  variant?: 'full' | 'compact' | 'portfolio' | 'strip';
  isOwner?: boolean;
  onUpdatePinnedBadges?: (pinnedIds: string[]) => void;
  className?: string;
}

// Icon mapper helper
const renderBadgeIcon = (iconName: string, className = 'w-5 h-5') => {
  switch (iconName) {
    case 'Rocket':
      return <Rocket className={className} />;
    case 'Star':
      return <Star className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    case 'Coins':
      return <Coins className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Award':
    default:
      return <Award className={className} />;
  }
};

export const Badges: React.FC<Props> = ({
  profile,
  user,
  reviews = [],
  submissions = [],
  projects = [],
  payments = [],
  variant = 'full',
  isOwner = false,
  onUpdatePinnedBadges,
  className = '',
}) => {
  const [selectedBadge, setSelectedBadge] = useState<MilestoneBadge | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [pinnedIds, setPinnedIds] = useState<string[]>(
    profile.pinnedBadgeIds || ['early-adopter', 'top-rated', 'project-completed']
  );
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Compute live badges and creator level
  const allBadges = getCreatorBadges({
    profile,
    user,
    reviews,
    submissions,
    projects,
    payments,
  });

  const levelProgress = calculateCreatorLevel(allBadges);

  // Filtered badges
  const displayedBadges = allBadges.filter((b) => {
    if (activeFilter === 'unlocked') return b.unlocked;
    if (activeFilter === 'locked') return !b.unlocked;
    return true;
  });

  const handleBadgeClick = (badge: MilestoneBadge) => {
    setSelectedBadge(badge);
    if (badge.unlocked) {
      // Gentle micro-celebration
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#f59e0b', '#6366f1'],
          disableForReducedMotion: true,
        });
      } catch {
        // Fallback gracefully if reduced motion or headless
      }
    }
  };

  const handleTogglePin = (badgeId: string) => {
    let nextPinned: string[];
    if (pinnedIds.includes(badgeId)) {
      nextPinned = pinnedIds.filter((id) => id !== badgeId);
    } else {
      // Max 4 pinned badges
      if (pinnedIds.length >= 4) {
        nextPinned = [...pinnedIds.slice(1), badgeId];
      } else {
        nextPinned = [...pinnedIds, badgeId];
      }
    }
    setPinnedIds(nextPinned);
    if (onUpdatePinnedBadges) {
      onUpdatePinnedBadges(nextPinned);
    } else {
      marketplaceStore.updateStudentProfile(user.id, { pinnedBadgeIds: nextPinned });
    }
  };

  const handleCopyBadgeProof = (badge: MilestoneBadge) => {
    const text = `🏆 Proof-to-Pay Verified Milestone: "${badge.name}" (${badge.tagline}) earned by ${user.name} on India's verified work-proof platform! https://prooftopay.in/portfolio/${profile.verifiedPortfolioSlug || user.name.toLowerCase().replace(/\s+/g, '-')}`;
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // --- VARIANT 1: Strip (Clean 1-line showcase for headers or cards) ---
  if (variant === 'strip') {
    const featured = allBadges.filter((b) => b.unlocked && pinnedIds.includes(b.id)).slice(0, 3);
    const badgesToShow = featured.length > 0 ? featured : allBadges.filter((b) => b.unlocked).slice(0, 3);

    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {badgesToShow.map((badge) => {
          const colors = getTierColorClasses(badge.tier);
          return (
            <button
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              title={`${badge.name}: ${badge.tagline}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${colors.badgeBorder} ${colors.badgeBg} ${colors.textColor} transition hover:scale-105 active:scale-95`}
            >
              {renderBadgeIcon(badge.iconName, 'w-3.5 h-3.5 shrink-0')}
              <span className="truncate max-w-[130px]">{badge.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // --- VARIANT 2: Compact Portfolio Row (for Public Portfolio page) ---
  if (variant === 'portfolio') {
    const unlockedList = allBadges.filter((b) => b.unlocked);

    return (
      <section className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-5 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Verified Milestone Badges
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                · {unlockedList.length} Authenticated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically timestamped proof milestones earned on commercial projects.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Level {levelProgress.currentLevel} · {levelProgress.levelTitle}</span>
          </div>
        </div>

        {/* Badge Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {unlockedList.map((badge) => {
            const colors = getTierColorClasses(badge.tier);
            const isPinned = pinnedIds.includes(badge.id);

            return (
              <div
                key={badge.id}
                onClick={() => handleBadgeClick(badge)}
                className={`p-4 rounded-2xl border ${colors.badgeBorder} ${colors.badgeBg} cursor-pointer transition hover:shadow-md hover:scale-[1.02] flex items-start gap-3.5 relative group`}
              >
                <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0`}>
                  {renderBadgeIcon(badge.iconName, 'w-5 h-5')}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-bold ${colors.textColor} truncate`}>
                      {badge.name}
                    </span>
                    {isPinned && (
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5" title="Pinned to showcase">
                        ★ Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 leading-snug">
                    {badge.tagline}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-0.5 flex items-center justify-between">
                    <span>{colors.badgeLabel}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{badge.rewardPoints} XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Badge Detail Modal */}
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            user={user}
            profile={profile}
            isOwner={isOwner}
            isPinned={pinnedIds.includes(selectedBadge.id)}
            onTogglePin={() => handleTogglePin(selectedBadge.id)}
            onCopyProof={() => handleCopyBadgeProof(selectedBadge)}
            copyFeedback={copyFeedback}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </section>
    );
  }

  // --- VARIANT 3: Full Gamified Showcase (for Student Dashboard) ---
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Gamification Level & XP Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                Proof Gamification
              </span>
              <span className="text-xs text-slate-400">
                · Verified Milestones Engine
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>Level {levelProgress.currentLevel}: {levelProgress.levelTitle}</span>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Unlock prestigious proof badges by executing verified client contracts, maintaining top ratings, and settling direct INR payments. Every badge is verifiable by Indian businesses and recruiters.
            </p>
          </div>

          {/* XP Progress Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 min-w-[260px] space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Reputation XP</span>
              <span className="text-emerald-400 font-bold">{levelProgress.totalXP.toLocaleString()} XP</span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${levelProgress.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{levelProgress.progressPercent}% to Next Level</span>
                <span>Target: {levelProgress.nextLevelXP} XP</span>
              </div>
            </div>

            <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>{levelProgress.unlockedBadgesCount} of {levelProgress.totalBadgesCount} Badges</span>
              </span>
              <span className="text-emerald-300 font-medium">
                {levelProgress.totalBadgesCount - levelProgress.unlockedBadgesCount === 0 ? 'All Unlocked!' : `${levelProgress.totalBadgesCount - levelProgress.unlockedBadgesCount} Remaining`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Interactive Filter Buttons (Complies with Zero-Pill rule: buttons have functional click handlers) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Badges ({allBadges.length})
          </button>
          <button
            onClick={() => setActiveFilter('unlocked')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              activeFilter === 'unlocked'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Unlocked ({allBadges.filter((b) => b.unlocked).length})
          </button>
          <button
            onClick={() => setActiveFilter('locked')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
              activeFilter === 'locked'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            In Progress ({allBadges.filter((b) => !b.unlocked).length})
          </button>
        </div>

        {isOwner && (
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4 text-amber-500" />
            <span>Pin up to 4 badges to feature on your public profile</span>
          </div>
        )}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedBadges.map((badge) => {
          const colors = getTierColorClasses(badge.tier);
          const isPinned = pinnedIds.includes(badge.id);

          return (
            <div
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                badge.unlocked
                  ? `${colors.badgeBorder} ${colors.badgeBg} hover:shadow-lg hover:-translate-y-1`
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-75 hover:opacity-100 hover:border-slate-300'
              }`}
            >
              {/* Card Top: Tier Label & Pin Action */}
              <div className="flex items-center justify-between text-[10px] font-semibold mb-3">
                <span className={badge.unlocked ? colors.subtextColor : 'text-slate-400'}>
                  {colors.badgeLabel}
                </span>

                <div className="flex items-center gap-1">
                  {isOwner && badge.unlocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(badge.id);
                      }}
                      title={isPinned ? 'Unpin from public profile' : 'Pin to public profile'}
                      className={`p-1 rounded-lg transition ${
                        isPinned
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isPinned ? <BookmarkCheck className="w-3.5 h-3.5 fill-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {badge.unlocked ? (
                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <Check className="w-3 h-3" />
                      <span>Earned</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-slate-400">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Icon & Title */}
              <div className="space-y-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    badge.unlocked
                      ? colors.iconBg
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {renderBadgeIcon(badge.iconName, 'w-6 h-6')}
                </div>

                <div>
                  <h3 className={`text-sm font-bold ${badge.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    {badge.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {badge.tagline}
                  </p>
                </div>
              </div>

              {/* Requirement & Progress footer */}
              <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                    {badge.requirement}
                  </span>
                  <span className={`font-bold ${badge.unlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    +{badge.rewardPoints} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.unlocked
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          user={user}
          profile={profile}
          isOwner={isOwner}
          isPinned={pinnedIds.includes(selectedBadge.id)}
          onTogglePin={() => handleTogglePin(selectedBadge.id)}
          onCopyProof={() => handleCopyBadgeProof(selectedBadge)}
          copyFeedback={copyFeedback}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};

// --- Modal Helper Component ---
interface ModalProps {
  badge: MilestoneBadge;
  user: User;
  profile: StudentProfile;
  isOwner: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
  onCopyProof: () => void;
  copyFeedback: boolean;
  onClose: () => void;
}

const BadgeDetailModal: React.FC<ModalProps> = ({
  badge,
  user,
  profile,
  isOwner,
  isPinned,
  onTogglePin,
  onCopyProof,
  copyFeedback,
  onClose,
}) => {
  const colors = getTierColorClasses(badge.tier);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${colors.iconBg} flex items-center justify-center shrink-0`}>
            {renderBadgeIcon(badge.iconName, 'w-7 h-7')}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.subtextColor}`}>
                {colors.badgeLabel}
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                +{badge.rewardPoints} XP
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {badge.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {badge.tagline}
            </p>
          </div>
        </div>

        {/* Badge Description & Lore */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>Milestone Overview</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {badge.description}
          </p>
        </div>

        {/* Requirements & Current Status */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Requirement Criteria:
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">{badge.requirement}</span>
            <span className={`font-bold ${badge.unlocked ? 'text-emerald-600' : 'text-slate-500'}`}>
              {badge.unlocked ? '✓ Satisfied' : `${badge.progress}%`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Progress metric: {badge.currentValue} / {badge.targetValue} {badge.unit}</span>
              <span className="font-semibold">{badge.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${badge.unlocked ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                style={{ width: `${badge.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Verification Status */}
        {badge.unlocked ? (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cryptographically Verified Outcome</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : 'Phase 1 Beta'}
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Complete this milestone on your next project to earn this badge!</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center gap-2 pt-2">
          {badge.unlocked && (
            <button
              onClick={onCopyProof}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied Verification Link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Verified Badge</span>
                </>
              )}
            </button>
          )}

          {isOwner && badge.unlocked && (
            <button
              onClick={onTogglePin}
              className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                isPinned
                  ? 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/40'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookmarkCheck className={`w-4 h-4 ${isPinned ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span>{isPinned ? 'Pinned' : 'Pin to Profile'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
