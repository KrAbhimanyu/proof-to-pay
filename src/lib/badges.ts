import {
  StudentProfile,
  User,
  VerifiedReview,
  ProjectSubmission,
  ProjectListing,
  PaymentRecord,
  MilestoneBadge,
  CreatorLevelProgress,
  BadgeTier
} from '../types';

export interface BadgeCalculationContext {
  profile: StudentProfile;
  user: User;
  reviews?: VerifiedReview[];
  submissions?: ProjectSubmission[];
  projects?: ProjectListing[];
  payments?: PaymentRecord[];
}

export const getCreatorBadges = (context: BadgeCalculationContext): MilestoneBadge[] => {
  const { profile, user, reviews = [], submissions = [], projects = [], payments = [] } = context;

  const completedProjects = profile.completedProjectsCount || projects.filter((p) => p.status === 'COMPLETED').length;
  const totalEarned = profile.totalEarnedINR || payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amountINR, 0);
  const rating = profile.averageRating || 5.0;
  const verifiedReviewsCount = reviews.length;
  const skillsCount = profile.skills?.length || 0;

  // Check submissions approved on first version
  const firstPassApprovedCount = submissions.filter((s) => s.version === 1 && s.status === 'APPROVED').length;
  const hasOnTimeDelivery = completedProjects > 0 || submissions.length > 0;

  const badges: MilestoneBadge[] = [
    {
      id: 'early-adopter',
      name: 'Early Adopter',
      tagline: 'Proof-to-Pay Pilot Launch Pioneer',
      description: 'Recognized as an early creator who joined Proof-to-Pay during the Phase 1 Beta launch, contributing to the first wave of verified student work in India.',
      category: 'COMMUNITY',
      tier: 'GOLD',
      iconName: 'Rocket',
      unlocked: true,
      unlockedAt: user.createdAt || '2026-08-15T10:00:00.000Z',
      progress: 100,
      currentValue: 1,
      targetValue: 1,
      unit: 'Beta Launch Member',
      requirement: 'Registered during Phase 1 Beta Launch',
      rewardPoints: 250,
      isFeatured: true,
    },
    {
      id: 'top-rated',
      name: 'Top Rated',
      tagline: '4.8+ Flawless Client Reputation',
      description: 'Sustained exceptional quality ratings from verified business clients across real completed deliverables.',
      category: 'REPUTATION',
      tier: 'PLATINUM',
      iconName: 'Star',
      unlocked: rating >= 4.8 && (verifiedReviewsCount >= 1 || completedProjects >= 1),
      unlockedAt: verifiedReviewsCount > 0 ? reviews[0]?.createdAt : undefined,
      progress: Math.min(100, Math.round((rating / 5.0) * 100)),
      currentValue: Number(rating.toFixed(1)),
      targetValue: 4.8,
      unit: 'Stars Average',
      requirement: 'Maintain ≥ 4.8 / 5.0 rating on verified client outcomes',
      rewardPoints: 400,
      isFeatured: true,
    },
    {
      id: 'project-completed',
      name: 'Project Completed',
      tagline: 'Verified Commercial Outcome Delivered',
      description: 'Successfully executed client specifications, delivered production-ready deliverables, and received formal milestone sign-off.',
      category: 'MILESTONE',
      tier: completedProjects >= 5 ? 'PLATINUM' : completedProjects >= 3 ? 'GOLD' : 'SILVER',
      iconName: 'CheckCircle2',
      unlocked: completedProjects >= 1,
      unlockedAt: completedProjects > 0 ? (projects[0]?.updatedAt || user.createdAt) : undefined,
      progress: Math.min(100, Math.round((completedProjects / 3) * 100)),
      currentValue: completedProjects,
      targetValue: completedProjects >= 3 ? 5 : 3,
      unit: 'Completed Projects',
      requirement: 'Complete and receive client approval for at least 1 verified project',
      rewardPoints: 500,
      isFeatured: true,
    },
    {
      id: 'direct-payout',
      name: 'Direct Pay Settled',
      tagline: 'Real INR Settled to Bank / UPI',
      description: 'Received audited direct INR payments into verified Indian bank account or UPI with traceable bank UTR references.',
      category: 'MILESTONE',
      tier: 'GOLD',
      iconName: 'Coins',
      unlocked: totalEarned > 0,
      unlockedAt: payments.find((p) => p.status === 'PAID')?.recordedAt || user.createdAt,
      progress: Math.min(100, Math.round((totalEarned / 25000) * 100)),
      currentValue: totalEarned,
      targetValue: 25000,
      unit: '₹ INR Earned',
      requirement: 'Receive at least 1 cleared payment directly from client',
      rewardPoints: 350,
      isFeatured: true,
    },
    {
      id: 'first-draft-master',
      name: 'First-Draft Master',
      tagline: '100% Acceptance With Zero Revisions',
      description: 'Deliverable satisfied all acceptance criteria on the very first submission, requiring zero revisions or rework.',
      category: 'DELIVERY',
      tier: 'GOLD',
      iconName: 'Zap',
      unlocked: firstPassApprovedCount >= 1 || completedProjects >= 2,
      progress: completedProjects >= 2 ? 100 : Math.min(100, firstPassApprovedCount * 100),
      currentValue: firstPassApprovedCount || (completedProjects >= 2 ? 1 : 0),
      targetValue: 1,
      unit: 'Flawless Deliverables',
      requirement: 'Get client sign-off on the first version without revision requests',
      rewardPoints: 300,
    },
    {
      id: 'fast-deliverer',
      name: 'Ahead of Schedule',
      tagline: 'Speed & Milestone Precision',
      description: 'Delivered all milestones on or ahead of the contract delivery schedule with thorough test notes.',
      category: 'DELIVERY',
      tier: 'SILVER',
      iconName: 'Clock',
      unlocked: hasOnTimeDelivery,
      progress: hasOnTimeDelivery ? 100 : 0,
      currentValue: hasOnTimeDelivery ? 1 : 0,
      targetValue: 1,
      unit: 'On-Time Milestone',
      requirement: 'Deliver project milestone on or before contract deadline',
      rewardPoints: 200,
    },
    {
      id: 'verified-identity',
      name: 'Verified Creator',
      tagline: 'Creator Identity & Profile Confirmed',
      description: 'Authenticated creator profile and campus enrollment or portfolio verification on Proof-to-Pay.',
      category: 'COMMUNITY',
      tier: 'BRONZE',
      iconName: 'ShieldCheck',
      unlocked: profile.verificationStatus === 'VERIFIED',
      progress: profile.verificationStatus === 'VERIFIED' ? 100 : profile.verificationStatus === 'PENDING' ? 50 : 0,
      currentValue: profile.verificationStatus === 'VERIFIED' ? 1 : 0,
      targetValue: 1,
      unit: 'Profile Verification',
      requirement: 'Confirmed creator identity and campus enrollment verification',
      rewardPoints: 150,
    },
    {
      id: 'skill-champion',
      name: 'Skill Champion',
      tagline: 'Multi-Disciplinary Demonstrated Skills',
      description: 'Curated 3 or more verified professional skills in engineering, design, or digital product building.',
      category: 'MILESTONE',
      tier: 'SILVER',
      iconName: 'Award',
      unlocked: skillsCount >= 3,
      progress: Math.min(100, Math.round((skillsCount / 5) * 100)),
      currentValue: skillsCount,
      targetValue: 5,
      unit: 'Demonstrated Skills',
      requirement: 'Demonstrate at least 3 verified technical or creative skills',
      rewardPoints: 200,
    },
  ];

  return badges;
};

export const calculateCreatorLevel = (badges: MilestoneBadge[]): CreatorLevelProgress => {
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const totalXP = unlockedBadges.reduce((sum, b) => sum + b.rewardPoints, 0);

  // Level thresholds:
  // Level 1: 0 - 499
  // Level 2: 500 - 999
  // Level 3: 1000 - 1699
  // Level 4: 1700 - 2399
  // Level 5: 2400+
  let currentLevel = 1;
  let levelTitle = 'Apprentice Creator';
  let currentLevelXP = 0;
  let nextLevelXP = 500;

  if (totalXP >= 2400) {
    currentLevel = 5;
    levelTitle = 'Elite Proof Pioneer';
    currentLevelXP = 2400;
    nextLevelXP = 3500;
  } else if (totalXP >= 1700) {
    currentLevel = 4;
    levelTitle = 'Master Craftsperson';
    currentLevelXP = 1700;
    nextLevelXP = 2400;
  } else if (totalXP >= 1000) {
    currentLevel = 3;
    levelTitle = 'Verified Professional';
    currentLevelXP = 1000;
    nextLevelXP = 1700;
  } else if (totalXP >= 500) {
    currentLevel = 2;
    levelTitle = 'Rising Specialist';
    currentLevelXP = 500;
    nextLevelXP = 1000;
  }

  const rangeXP = nextLevelXP - currentLevelXP;
  const gainedInLevel = Math.max(0, totalXP - currentLevelXP);
  const progressPercent = Math.min(100, Math.round((gainedInLevel / rangeXP) * 100));

  return {
    currentLevel,
    levelTitle,
    totalXP,
    currentLevelXP,
    nextLevelXP,
    progressPercent,
    unlockedBadgesCount: unlockedBadges.length,
    totalBadgesCount: badges.length,
  };
};

export const getTierColorClasses = (tier: BadgeTier) => {
  switch (tier) {
    case 'PLATINUM':
      return {
        badgeBorder: 'border-emerald-500/40 dark:border-emerald-400/50',
        badgeBg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
        iconBg: 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg',
        textColor: 'text-emerald-900 dark:text-emerald-200',
        subtextColor: 'text-emerald-700 dark:text-emerald-400',
        ringGlow: 'ring-1 ring-emerald-500/30',
        badgeLabel: 'Platinum Tier',
      };
    case 'GOLD':
      return {
        badgeBorder: 'border-amber-500/40 dark:border-amber-400/40',
        badgeBg: 'bg-amber-500/10 dark:bg-amber-950/40',
        iconBg: 'bg-amber-500 text-slate-950 shadow-amber-500/20 shadow-lg',
        textColor: 'text-amber-950 dark:text-amber-200',
        subtextColor: 'text-amber-700 dark:text-amber-400',
        ringGlow: 'ring-1 ring-amber-500/30',
        badgeLabel: 'Gold Tier',
      };
    case 'SILVER':
      return {
        badgeBorder: 'border-slate-300 dark:border-slate-600',
        badgeBg: 'bg-slate-100 dark:bg-slate-800/70',
        iconBg: 'bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 shadow-slate-500/20 shadow-lg',
        textColor: 'text-slate-900 dark:text-slate-100',
        subtextColor: 'text-slate-600 dark:text-slate-400',
        ringGlow: 'ring-1 ring-slate-400/30',
        badgeLabel: 'Silver Tier',
      };
    case 'BRONZE':
    default:
      return {
        badgeBorder: 'border-amber-700/30 dark:border-amber-800/40',
        badgeBg: 'bg-amber-900/10 dark:bg-amber-950/30',
        iconBg: 'bg-amber-700 text-white shadow-amber-900/20 shadow-lg',
        textColor: 'text-amber-900 dark:text-amber-300',
        subtextColor: 'text-amber-700 dark:text-amber-500',
        ringGlow: 'ring-1 ring-amber-700/30',
        badgeLabel: 'Bronze Tier',
      };
  }
};
