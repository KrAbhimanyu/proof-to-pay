import React, { useState, useMemo, useEffect } from 'react';
import { User, StudentProfile, ProofPassportItem, VerifiedReview, ProjectListing } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { tryGetSupabaseClient } from '../../lib/supabaseClient';
import { Badges } from '../common/Badges';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Star,
  ExternalLink,
  Award,
  CheckCircle2,
  Calendar,
  Share2,
  ChevronLeft,
  GraduationCap,
  Lock,
  FileCheck,
  Briefcase,
  Shield,
  EyeOff,
  Eye,
  Search,
  Filter,
  Sparkles,
  Clock,
  Send,
  MessageSquare,
  Check,
  Copy,
  Edit3,
  Plus,
  Trash2,
  X,
  AlertCircle,
  MapPin,
  UserCheck,
  Zap,
  TrendingUp,
  FolderGit2,
  SlidersHorizontal,
  Info
} from 'lucide-react';

// Official Brand Icons for Social Profiles
export const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const LinkedinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28M7.85 18.5V10.13H5.06V18.5h2.79z" />
  </svg>
);

export const BehanceIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-4.971 3-3.457 0-5.755-2.5-5.755-6s2.298-6 5.755-6c3.456 0 5.404 2.457 5.244 6h-8c0 1.688 1.157 3.5 3.001 3.5 1.558 0 2.502-.857 2.726-1.5h2zm-2.001-4.5c-.092-1.258-1.002-2.5-3.001-2.5s-2.85 1.242-2.999 2.5h6zm-13.725-7.5h-8v16h8.215c3.541 0 5.785-1.957 5.785-5.215 0-2.033-1.077-3.666-2.857-4.414 1.442-.693 2.357-2.13 2.357-3.871 0-2.812-2.039-4.5-5.5-4.5zm-5 6.5v-3.5h4.5c1.479 0 2.5.764 2.5 1.75s-1.021 1.75-2.5 1.75h-4.5zm0 6.5v-4h4.8c1.611 0 2.7.834 2.7 2s-1.089 2-2.7 2h-4.8z" />
  </svg>
);

// Normalize user input into valid web URLs
export const normalizeSocialUrl = (platform: string, input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const clean = trimmed.replace(/^@/, '');
  if (platform.toLowerCase() === 'github') return `https://github.com/${clean}`;
  if (platform.toLowerCase() === 'linkedin') {
    return clean.includes('linkedin.com') ? `https://${clean}` : `https://linkedin.com/in/${clean}`;
  }
  if (platform.toLowerCase() === 'behance') {
    return clean.includes('behance.net') ? `https://${clean}` : `https://behance.net/${clean}`;
  }
  return `https://${clean}`;
};

// Extract readable handle or slug for clean badge labels
export const extractSocialHandle = (url: string, platform: string): string => {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (platform.toLowerCase() === 'linkedin' && parts[0] === 'in' && parts[1]) {
      return `@${parts[1]}`;
    }
    if (parts.length > 0 && parts[parts.length - 1]) {
      return `@${parts[parts.length - 1]}`;
    }
    return url.replace(/^https?:\/\//, '');
  } catch {
    return url.replace(/^https?:\/\//, '');
  }
};

interface Props {
  slug: string;
  currentUser?: User | null;
  onBack: () => void;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth?: (mode?: 'login' | 'register_student' | 'register_business') => void;
}

export const PublicPortfolio: React.FC<Props> = ({
  slug,
  currentUser,
  onBack,
  onNavigate,
  onOpenAuth,
}) => {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<'portfolio' | 'skills' | 'feedback' | 'badges' | 'about'>('portfolio');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'ALL' | 'VERIFIED' | 'SELF_REPORTED'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAddSampleModal, setShowAddSampleModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Profile Form State
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [editGradYear, setEditGradYear] = useState<number>(2027);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [editAvailability, setEditAvailability] = useState<'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'>('AVAILABLE');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editExpLevel, setEditExpLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');

  // Social Media Profiles State
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editBehance, setEditBehance] = useState('');
  const [quickSkillInput, setQuickSkillInput] = useState('');

  // Add Sample Form State
  const [sampleTitle, setSampleTitle] = useState('');
  const [sampleUrl, setSampleUrl] = useState('');
  const [sampleDescription, setSampleDescription] = useState('');

  // Hire Form State (for business visitors)
  const [hireProjectTitle, setHireProjectTitle] = useState('');
  const [hireBudgetINR, setHireBudgetINR] = useState<number>(10000);
  const [hireDeadlineDays, setHireDeadlineDays] = useState<number>(7);
  const [hireDeliverables, setHireDeliverables] = useState<string>('1. Core component implementation\n2. Documentation & tests\n3. Final delivery sign-off');
  const [hireRevisions, setHireRevisions] = useState<number>(2);
  const [hireMessage, setHireMessage] = useState('');

  // Message Inquiry Form State
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');

  // Re-fetch trigger to re-render on mutation
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Trigger toast with auto-hide
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Find student by slug or id
  const users = marketplaceStore.getUsers();
  const studentUser = users.find(
    (u) => u.id === slug || u.name.toLowerCase().replace(/\s+/g, '-') === slug
  ) || users.find((u) => u.role === 'STUDENT') || users[0];

  const profile = marketplaceStore.getStudentProfile(studentUser.id);
  const isOwner = currentUser?.id === studentUser.id;
  const isBusiness = currentUser?.role === 'BUSINESS';

  // Genuine reviews from database/store
  const reviews = marketplaceStore.getReviews().filter((r) => r.targetUserId === studentUser.id);

  // Completed projects confirmed by business/arbitration
  const completedProjects = marketplaceStore.getProjects().filter(
    (p) => p.selectedStudentId === studentUser.id && p.status === 'COMPLETED'
  );

  // Proof Passport items:
  // - If owner: show all eligible items (with public/hidden badge)
  // - If visitor: show only items explicitly approved for public display
  const allPassportItems = marketplaceStore.getProofPassportItems(studentUser.id, false);
  const publicPassportItems = marketplaceStore.getProofPassportItems(studentUser.id, !isOwner);

  // Calculate genuine dynamic rating from actual eligible reviews (never defaulting to 5.0)
  const calculatedRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Derived categories from available passport items
  const categories = useMemo(() => {
    const set = new Set<string>();
    allPassportItems.forEach((item) => set.add(item.category));
    return ['ALL', ...Array.from(set)];
  }, [allPassportItems]);

  // Skills proven through completed deliverables
  const verifiedSkills = useMemo(() => {
    const set = new Set<string>();
    completedProjects.forEach((p) => {
      p.requiredSkills.forEach((s) => set.add(s));
    });
    allPassportItems.forEach((item) => {
      if (item.skills) {
        item.skills.forEach((s) => set.add(s));
      }
    });
    return Array.from(set);
  }, [completedProjects, allPassportItems]);

  // Live profile table data from Supabase (if configured)
  const [liveProfileData, setLiveProfileData] = useState<{
    githubUrl: string | null;
    linkedinUrl: string | null;
    behanceUrl: string | null;
  } | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    async function loadProfileFromSupabase() {
      try {
        const sb = tryGetSupabaseClient();
        if (!sb || !studentUser?.id) return;

        // Query public.profiles table
        const { data: profRow } = await sb
          .from('profiles')
          .select('github_url, linkedin_url, behance_url')
          .eq('id', studentUser.id)
          .maybeSingle();

        // Query public.student_profiles table
        const { data: sProfRow } = await sb
          .from('student_profiles')
          .select('github_url, linkedin_url, behance_url, social_links')
          .eq('user_id', studentUser.id)
          .maybeSingle();

        if (isSubscribed && (profRow || sProfRow)) {
          const gh =
            profRow?.github_url ||
            sProfRow?.github_url ||
            (Array.isArray(sProfRow?.social_links)
              ? sProfRow.social_links.find((s: any) => s?.platform?.toLowerCase() === 'github')?.url
              : null) ||
            null;
          const li =
            profRow?.linkedin_url ||
            sProfRow?.linkedin_url ||
            (Array.isArray(sProfRow?.social_links)
              ? sProfRow.social_links.find((s: any) => s?.platform?.toLowerCase() === 'linkedin')?.url
              : null) ||
            null;
          const be =
            profRow?.behance_url ||
            sProfRow?.behance_url ||
            (Array.isArray(sProfRow?.social_links)
              ? sProfRow.social_links.find((s: any) => s?.platform?.toLowerCase() === 'behance')?.url
              : null) ||
            null;

          setLiveProfileData({
            githubUrl: gh,
            linkedinUrl: li,
            behanceUrl: be,
          });
        }
      } catch {
        // Fall back gracefully to local store
      }
    }
    loadProfileFromSupabase();
    return () => {
      isSubscribed = false;
    };
  }, [studentUser?.id, refreshCounter]);

  // Social media links retrieved from user's profile table
  const githubLink = useMemo(() => {
    const raw =
      liveProfileData?.githubUrl ??
      profile?.githubUrl ??
      studentUser?.githubUrl ??
      profile?.socialLinks?.find((s) => s.platform.toLowerCase() === 'github')?.url ??
      null;
    if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
    return { platform: 'github', url: normalizeSocialUrl('github', raw) };
  }, [liveProfileData, profile, studentUser, refreshCounter]);

  const linkedinLink = useMemo(() => {
    const raw =
      liveProfileData?.linkedinUrl ??
      profile?.linkedinUrl ??
      studentUser?.linkedinUrl ??
      profile?.socialLinks?.find((s) => s.platform.toLowerCase() === 'linkedin')?.url ??
      null;
    if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
    return { platform: 'linkedin', url: normalizeSocialUrl('linkedin', raw) };
  }, [liveProfileData, profile, studentUser, refreshCounter]);

  const behanceLink = useMemo(() => {
    const raw =
      liveProfileData?.behanceUrl ??
      profile?.behanceUrl ??
      studentUser?.behanceUrl ??
      profile?.socialLinks?.find((s) => s.platform.toLowerCase() === 'behance')?.url ??
      null;
    if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
    return { platform: 'behance', url: normalizeSocialUrl('behance', raw) };
  }, [liveProfileData, profile, studentUser, refreshCounter]);

  const otherSocialLinks = useMemo(
    () => (profile?.socialLinks || []).filter(
      (s) => !['github', 'linkedin', 'behance'].includes(s.platform.toLowerCase())
    ),
    [profile?.socialLinks, refreshCounter]
  );

  // Active verified social media cards (strictly excludes null/empty values with full brand assets)
  const activeSocialCards = useMemo(() => {
    const items: Array<{
      platform: 'GitHub' | 'LinkedIn' | 'Behance';
      id: 'github' | 'linkedin' | 'behance';
      url: string;
      handle: string;
      description: string;
      badgeText: string;
      brandColorHex: string;
      brandBgClass: string;
      brandTextClass: string;
      brandBorderClass: string;
      brandHoverClass: string;
      icon: React.FC<{ className?: string }>;
    }> = [];

    // ONLY SHOW IF NOT NULL AND NOT EMPTY
    if (githubLink?.url) {
      items.push({
        platform: 'GitHub',
        id: 'github',
        url: githubLink.url,
        handle: extractSocialHandle(githubLink.url, 'github'),
        description: 'Code repositories, commits, and open-source contributions',
        badgeText: 'Developer Profile',
        brandColorHex: '#24292F',
        brandBgClass: 'bg-[#24292F] dark:bg-black',
        brandTextClass: 'text-white',
        brandBorderClass: 'border-slate-800 dark:border-slate-700',
        brandHoverClass: 'hover:bg-black dark:hover:bg-slate-900',
        icon: GithubIcon,
      });
    }

    if (linkedinLink?.url) {
      items.push({
        platform: 'LinkedIn',
        id: 'linkedin',
        url: linkedinLink.url,
        handle: extractSocialHandle(linkedinLink.url, 'linkedin'),
        description: 'Professional credentials, career history, and industry network',
        badgeText: 'Professional Network',
        brandColorHex: '#0A66C2',
        brandBgClass: 'bg-[#0A66C2]',
        brandTextClass: 'text-white',
        brandBorderClass: 'border-blue-600 dark:border-blue-700',
        brandHoverClass: 'hover:bg-[#004182]',
        icon: LinkedinIcon,
      });
    }

    if (behanceLink?.url) {
      items.push({
        platform: 'Behance',
        id: 'behance',
        url: behanceLink.url,
        handle: extractSocialHandle(behanceLink.url, 'behance'),
        description: 'Creative design case studies, mobile UI, and visual projects',
        badgeText: 'Design Showcase',
        brandColorHex: '#0057FF',
        brandBgClass: 'bg-[#0057FF]',
        brandTextClass: 'text-white',
        brandBorderClass: 'border-blue-500 dark:border-blue-600',
        brandHoverClass: 'hover:bg-[#0040c7]',
        icon: BehanceIcon,
      });
    }

    return items;
  }, [githubLink, linkedinLink, behanceLink]);

  const hasAnySocial = Boolean(activeSocialCards.length > 0 || otherSocialLinks.length > 0);

  // Filtered Proof Passport Items
  const filteredPassportItems = useMemo(() => {
    return publicPassportItems.filter((item) => {
      // Type filter
      if (selectedTypeFilter === 'SELF_REPORTED') return false;

      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = item.projectTitle.toLowerCase().includes(query);
        const inSummary = item.sanitizedSummary.toLowerCase().includes(query);
        const inBusiness = item.businessName.toLowerCase().includes(query);
        const inSkills = item.skills?.some((s) => s.toLowerCase().includes(query));
        const inDeliverables = item.deliverables?.some((d) => d.toLowerCase().includes(query));
        return inTitle || inSummary || inBusiness || inSkills || inDeliverables;
      }
      return true;
    });
  }, [publicPassportItems, selectedTypeFilter, selectedCategory, searchQuery, refreshCounter]);

  // Filtered Self-Reported Samples
  const filteredSelfReportedSamples = useMemo(() => {
    if (selectedTypeFilter === 'VERIFIED') return [];
    const samples = profile?.portfolioLinks || [];
    if (!searchQuery.trim()) return samples;
    const query = searchQuery.toLowerCase();
    return samples.filter(
      (s) => s.title.toLowerCase().includes(query) || (s.description && s.description.toLowerCase().includes(query))
    );
  }, [profile?.portfolioLinks, selectedTypeFilter, searchQuery]);

  // Handle Share link copy
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    triggerToast('Public portfolio link copied to clipboard!');
  };

  // Handle Toggle Passport Item Visibility (for owner)
  const handleToggleVisibility = (itemId: string, currentPublic: boolean) => {
    if (!currentUser || !isOwner) return;
    try {
      marketplaceStore.toggleProofPassportVisibility(currentUser, itemId, !currentPublic);
      setRefreshCounter((c) => c + 1);
      triggerToast(
        !currentPublic
          ? 'Project is now visible on your public Proof Passport'
          : 'Project hidden from public view (preserved in private records)'
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update visibility');
    }
  };

  // Open Edit Profile Modal
  const handleOpenEditProfile = () => {
    if (!profile) return;
    setEditHeadline(profile.headline || '');
    setEditBio(profile.bio || '');
    setEditCollege(profile.college || '');
    setEditDegree(profile.degree || '');
    setEditGradYear(profile.graduationYear || 2027);
    setEditSkills(profile.skills || []);
    setEditAvailability(profile.availability || 'AVAILABLE');
    setEditCoverImage(profile.coverImageUrl || '');
    setEditExpLevel(profile.experienceLevel || 'INTERMEDIATE');

    // Extract social links from profile table
    const gh =
      profile.githubUrl ||
      profile.socialLinks?.find((s) => s.platform.toLowerCase() === 'github')?.url ||
      studentUser.githubUrl ||
      '';
    const li =
      profile.linkedinUrl ||
      profile.socialLinks?.find((s) => s.platform.toLowerCase() === 'linkedin')?.url ||
      studentUser.linkedinUrl ||
      '';
    const be =
      profile.behanceUrl ||
      profile.socialLinks?.find((s) => s.platform.toLowerCase() === 'behance')?.url ||
      studentUser.behanceUrl ||
      '';
    setEditGithub(gh);
    setEditLinkedin(li);
    setEditBehance(be);

    setShowEditProfileModal(true);
  };

  // Save Edit Profile Modal
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isOwner) return;

    try {
      const ghUrl = editGithub.trim() ? normalizeSocialUrl('github', editGithub) : null;
      const liUrl = editLinkedin.trim() ? normalizeSocialUrl('linkedin', editLinkedin) : null;
      const beUrl = editBehance.trim() ? normalizeSocialUrl('behance', editBehance) : null;

      const newSocialLinks: { platform: string; url: string }[] = [];
      if (ghUrl) newSocialLinks.push({ platform: 'github', url: ghUrl });
      if (liUrl) newSocialLinks.push({ platform: 'linkedin', url: liUrl });
      if (beUrl) newSocialLinks.push({ platform: 'behance', url: beUrl });

      // Preserve any other platforms
      const otherPlatforms = (profile?.socialLinks || []).filter(
        (s) => !['github', 'linkedin', 'behance'].includes(s.platform.toLowerCase())
      );
      const combinedSocialLinks = [...newSocialLinks, ...otherPlatforms];

      marketplaceStore.updateCreatorPortfolio(currentUser, studentUser.id, {
        headline: editHeadline,
        bio: editBio,
        college: editCollege,
        degree: editDegree,
        graduationYear: editGradYear,
        skills: editSkills,
        experienceLevel: editExpLevel,
        availability: editAvailability,
        coverImageUrl: editCoverImage.trim() || undefined,
        socialLinks: combinedSocialLinks,
        githubUrl: ghUrl,
        linkedinUrl: liUrl,
        behanceUrl: beUrl,
      });

      // Best-effort live update to Supabase profile tables if client configured
      const sb = tryGetSupabaseClient();
      if (sb) {
        Promise.resolve(
          sb.from('profiles').update({
            github_url: ghUrl,
            linkedin_url: liUrl,
            behance_url: beUrl,
          }).eq('id', studentUser.id)
        ).catch(() => {});

        Promise.resolve(
          sb.from('student_profiles').update({
            github_url: ghUrl,
            linkedin_url: liUrl,
            behance_url: beUrl,
            social_links: combinedSocialLinks,
          }).eq('user_id', studentUser.id)
        ).catch(() => {});
      }

      setShowEditProfileModal(false);
      setRefreshCounter((c) => c + 1);
      triggerToast('Profile & social media links updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  // Direct In-Place Skill Management (Skills Tab)
  const handleAddSkillDirectly = (skillName: string) => {
    const s = skillName.trim();
    if (!s || !isOwner || !currentUser || !profile) return;
    if (profile.skills.some((sk) => sk.toLowerCase() === s.toLowerCase())) {
      triggerToast(`Skill "${s}" is already in your stack`);
      return;
    }
    const updated = [...profile.skills, s];
    try {
      marketplaceStore.updateCreatorPortfolio(currentUser, studentUser.id, { skills: updated });
      setQuickSkillInput('');
      setRefreshCounter((c) => c + 1);
      triggerToast(`Added ${s} to your technical stack!`);
    } catch (err: any) {
      alert(err.message || 'Failed to add skill');
    }
  };

  const handleRemoveSkillDirectly = (skillName: string) => {
    if (!isOwner || !currentUser || !profile) return;
    const updated = profile.skills.filter((sk) => sk !== skillName);
    try {
      marketplaceStore.updateCreatorPortfolio(currentUser, studentUser.id, { skills: updated });
      setRefreshCounter((c) => c + 1);
      triggerToast(`Removed ${skillName} from your technical stack`);
    } catch (err: any) {
      alert(err.message || 'Failed to remove skill');
    }
  };

  // Add Skill in Edit Modal
  const handleAddSkill = () => {
    const s = newSkillInput.trim();
    if (s && !editSkills.includes(s)) {
      setEditSkills([...editSkills, s]);
      setNewSkillInput('');
    }
  };

  // Remove Skill in Edit Modal
  const handleRemoveSkill = (skillToRemove: string) => {
    setEditSkills(editSkills.filter((s) => s !== skillToRemove));
  };

  // Handle Add Self-Uploaded Sample
  const handleAddSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isOwner || !profile) return;
    if (!sampleTitle.trim() || !sampleUrl.trim()) return;

    const existingLinks = profile.portfolioLinks || [];
    const newLinks = [
      ...existingLinks,
      {
        title: sampleTitle.trim(),
        url: sampleUrl.trim(),
        description: sampleDescription.trim() || undefined,
      },
    ];

    try {
      marketplaceStore.updateCreatorPortfolio(currentUser, studentUser.id, {
        portfolioLinks: newLinks,
      });
      setSampleTitle('');
      setSampleUrl('');
      setSampleDescription('');
      setShowAddSampleModal(false);
      setRefreshCounter((c) => c + 1);
      triggerToast('Self-reported work sample added to portfolio!');
    } catch (err: any) {
      alert(err.message || 'Failed to add work sample');
    }
  };

  // Handle Delete Self-Uploaded Sample
  const handleDeleteSample = (index: number) => {
    if (!currentUser || !isOwner || !profile) return;
    const existingLinks = profile.portfolioLinks || [];
    const updated = existingLinks.filter((_, idx) => idx !== index);

    try {
      marketplaceStore.updateCreatorPortfolio(currentUser, studentUser.id, {
        portfolioLinks: updated,
      });
      setRefreshCounter((c) => c + 1);
      triggerToast('Self-reported sample removed.');
    } catch (err: any) {
      alert(err.message || 'Failed to remove sample');
    }
  };

  // Handle Business Direct Hire / Offer Submission
  const handleSubmitHireOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    if (currentUser.role !== 'BUSINESS') {
      alert('Only business accounts can issue formal project offers.');
      return;
    }

    try {
      // Find or create direct micro project for this hire
      const directProj = marketplaceStore.createProject(
        currentUser,
        {
          title: hireProjectTitle.trim(),
          summary: `Direct commissioned project for creator ${studentUser.name}.`,
          description: hireMessage.trim() || `Deliverables scoped for ${studentUser.name}.`,
          category: 'Web & Mobile Development',
          requiredSkills: profile?.skills.slice(0, 3) || ['React'],
          deliverables: hireDeliverables
            .split('\n')
            .filter((d) => d.trim().length > 0)
            .map((d, idx) => ({
              id: `del-hire-${Date.now()}-${idx}`,
              title: d.replace(/^[0-9]+[\.\-\)]\s*/, '').trim(),
              description: 'Agreed deliverable for direct project offer.',
              format: 'File / Repository',
            })),
          acceptanceCriteria: [
            'All scoped deliverables delivered and tested without defects',
            'Full source code and live verification link provided'
          ],
          budgetINR: hireBudgetINR,
          deadlineDays: hireDeadlineDays,
          expectedDeliveryDate: new Date(Date.now() + hireDeadlineDays * 86400000).toISOString().split('T')[0],
          permittedRevisions: hireRevisions,
          applicationClosingDate: new Date().toISOString().split('T')[0],
          paymentTerms: `Fixed ₹${hireBudgetINR.toLocaleString('en-IN')} INR directly to creator upon verified deliverable approval.`,
        }
      );

      // Issue binding offer to creator
      marketplaceStore.issueOffer(
        currentUser,
        directProj.id,
        studentUser.id,
        hireBudgetINR,
        new Date(Date.now() + hireDeadlineDays * 86400000).toISOString().split('T')[0],
        hireRevisions,
        `Direct offer issued to ${studentUser.name} with Scope Lock terms.`
      );

      setShowHireModal(false);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      triggerToast(`Offer of ₹${hireBudgetINR.toLocaleString('en-IN')} INR issued to ${studentUser.name}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to issue project offer');
    }
  };

  // Handle Message Submission
  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setShowMessageModal(false);
    setMessageSubject('');
    setMessageContent('');
    triggerToast(`Inquiry sent to ${studentUser.name}. They will be notified.`);
  };

  // Cover image fallback banner gradient
  const coverImageSrc = profile?.coverImageUrl || '/src/assets/images/hero_student_creator_1791569699063.jpg';

  return (
    <div className="min-h-screen pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Control Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" />
            <span>Back to Marketplace</span>
          </button>

          <div className="flex items-center gap-2">
            {marketplaceStore.isDemoMode() && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800/60">
                <Info className="w-3 h-3 text-amber-600" />
                <span>Sandbox Mode: Verifiable Pilot Records</span>
              </span>
            )}

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share Profile</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 mt-2">
        {/* ============================================================== */}
        {/* CREATOR PROFILE HEADER & COVER BANNER */}
        {/* ============================================================== */}
        <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Cover Image Banner */}
          <div className="relative h-44 sm:h-56 md:h-64 w-full bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 overflow-hidden">
            <img
              src={coverImageSrc}
              alt="Profile Cover"
              className="w-full h-full object-cover object-center opacity-85 hover:scale-105 transition duration-700"
              onError={(e) => {
                // Fallback to gradient if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />

            {/* Change cover button for profile owner */}
            {isOwner && (
              <button
                onClick={handleOpenEditProfile}
                className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md text-[11px] font-semibold flex items-center gap-1.5 transition border border-white/20"
              >
                <Edit3 className="w-3 h-3" />
                <span>Customize Banner</span>
              </button>
            )}

            {/* Live Availability Pill on Cover */}
            <div className="absolute bottom-4 right-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      profile?.availability === 'BUSY'
                        ? 'bg-amber-400'
                        : profile?.availability === 'UNAVAILABLE'
                        ? 'bg-slate-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      profile?.availability === 'BUSY'
                        ? 'bg-amber-500'
                        : profile?.availability === 'UNAVAILABLE'
                        ? 'bg-slate-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </span>
                <span>
                  {profile?.availability === 'BUSY'
                    ? 'In Active Project Sprint'
                    : profile?.availability === 'UNAVAILABLE'
                    ? 'Currently Unavailable'
                    : 'Available for Micro-Projects'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Header Body */}
          <div className="px-6 sm:px-8 pb-8 pt-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20 relative z-10">
              {/* Avatar + Primary Identity */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-white dark:bg-slate-900 shadow-xl shrink-0">
                    {studentUser.avatarUrl ? (
                      <img
                        src={studentUser.avatarUrl}
                        alt={studentUser.name}
                        className="w-full h-full object-cover rounded-[22px]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[22px] bg-gradient-to-tr from-emerald-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black">
                        {studentUser.name[0]}
                      </div>
                    )}
                  </div>
                  <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-emerald-500 text-white border-2 border-white dark:border-slate-900 shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-1 pt-2 sm:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {studentUser.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Creator</span>
                    </span>
                    {profile?.experienceLevel && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        {profile.experienceLevel}
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 max-w-2xl leading-snug">
                    {profile?.headline || 'Emerging Creator & Engineer on Proof-to-Pay'}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 pt-1">
                    {profile?.college && (
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <span>{profile.college} {profile.graduationYear ? `(Class of ${profile.graduationYear})` : ''}</span>
                      </span>
                    )}
                    {studentUser.city && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{studentUser.city}{studentUser.state ? `, ${studentUser.state}` : ''}</span>
                        </span>
                      </>
                    )}
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Adult 18+ Verified Policy</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Visitor or Owner */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch sm:self-auto pt-2 sm:pt-0">
                {isOwner ? (
                  <button
                    onClick={handleOpenEditProfile}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile & Presentation</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          if (onOpenAuth) onOpenAuth('login');
                        } else if (currentUser.role === 'BUSINESS') {
                          setShowHireModal(true);
                        } else {
                          alert('Switch to a business profile to commission micro-projects.');
                        }
                      }}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Hire Creator / Send Offer</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!currentUser) {
                          if (onOpenAuth) onOpenAuth('login');
                        } else {
                          setShowMessageModal(true);
                        }
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                      <span>Message</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Bio Snippet */}
            {profile?.bio && (
              <p className="mt-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-4 max-w-4xl">
                {profile.bio}
              </p>
            )}

            {/* Social Media & External Profiles Section */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                  <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Online Profiles:</span>
                </span>

                {githubLink && (
                  <a
                    href={githubLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-2xs transition group"
                    title={`View GitHub: ${githubLink.url}`}
                  >
                    <GithubIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-white shrink-0" />
                    <span>GitHub</span>
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      {extractSocialHandle(githubLink.url, 'github')}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white shrink-0 ml-0.5" />
                  </a>
                )}

                {linkedinLink && (
                  <a
                    href={linkedinLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-semibold shadow-2xs transition group"
                    title={`View LinkedIn: ${linkedinLink.url}`}
                  >
                    <LinkedinIcon className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>LinkedIn</span>
                    <span className="text-[10px] text-blue-100 hidden sm:inline">
                      {extractSocialHandle(linkedinLink.url, 'linkedin')}
                    </span>
                    <ExternalLink className="w-3 h-3 text-blue-200 group-hover:text-white shrink-0 ml-0.5" />
                  </a>
                )}

                {behanceLink && (
                  <a
                    href={behanceLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0057FF] hover:bg-[#0047d4] text-white text-xs font-semibold shadow-2xs transition group"
                    title={`View Behance: ${behanceLink.url}`}
                  >
                    <BehanceIcon className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>Behance</span>
                    <span className="text-[10px] text-blue-100 hidden sm:inline">
                      {extractSocialHandle(behanceLink.url, 'behance')}
                    </span>
                    <ExternalLink className="w-3 h-3 text-blue-200 group-hover:text-white shrink-0 ml-0.5" />
                  </a>
                )}

                {otherSocialLinks.map((ol, idx) => (
                  <a
                    key={idx}
                    href={ol.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition group"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                    <span className="capitalize">{ol.platform}</span>
                  </a>
                ))}

                {!hasAnySocial && (
                  <span className="text-xs text-slate-400 italic">
                    {isOwner
                      ? 'No external profiles linked yet. Add GitHub, LinkedIn, or Behance to highlight your code and designs.'
                      : 'Creator has not linked external social profiles yet.'}
                  </span>
                )}
              </div>

              {isOwner && (
                <button
                  onClick={handleOpenEditProfile}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition self-start sm:self-auto shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{hasAnySocial ? 'Manage Social Profiles' : '+ Link GitHub, LinkedIn, or Behance'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PORTFOLIO STATISTICS BAR (REAL DATA ONLY) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Stat 1: Completed Projects */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Completed Projects</span>
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {allPassportItems.length}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              Verified client sign-offs
            </span>
          </div>

          {/* Stat 2: Average Rating (Dynamically calculated from real reviews, no defaults) */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Average Rating</span>
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              {calculatedRating ? (
                <>
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>{calculatedRating}</span>
                  <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                </>
              ) : (
                <span className="text-base font-semibold text-slate-400">Unrated</span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              {reviews.length > 0 ? `From ${reviews.length} authentic reviews` : 'No reviews recorded yet'}
            </span>
          </div>

          {/* Stat 3: Verified Client Feedback */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Verified Reviews</span>
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {reviews.length}
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              100% verified deliverables
            </span>
          </div>

          {/* Stat 4: Zero Deductions Creator Payout Guarantee */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 dark:border-emerald-500/30 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Deductions</span>
            </span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              100%
            </div>
            <span className="text-[11px] text-slate-600 dark:text-slate-400">
              Net payout guaranteed
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* NEW SECTION: SOCIAL MEDIA LINKS (PROFILE TABLE RETRIEVAL) */}
        {/* Displays GitHub, LinkedIn, Behance with official branding */}
        {/* Strictly filters out and hides any links that are null */}
        {/* ============================================================== */}
        <section
          id="social-media-links-section"
          aria-labelledby="social-links-section-title"
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <h3 id="social-links-section-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Social Media & Online Presence
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeSocialCards.length} {activeSocialCards.length === 1 ? 'Profile' : 'Profiles'} Linked
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Verified external links (GitHub, LinkedIn, Behance) retrieved directly from {studentUser.name}'s profile table.
              </p>
            </div>

            {isOwner && (
              <button
                onClick={handleOpenEditProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition shrink-0 self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{activeSocialCards.length > 0 ? 'Manage Profiles' : '+ Connect Profiles'}</span>
              </button>
            )}
          </div>

          {activeSocialCards.length > 0 ? (
            <div className={`mt-5 grid grid-cols-1 ${activeSocialCards.length === 1 ? 'max-w-md' : activeSocialCards.length === 2 ? 'sm:grid-cols-2 max-w-3xl' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              {activeSocialCards.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className="group relative p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between gap-4 hover:shadow-md"
                  >
                    <div>
                      {/* Brand Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl ${item.brandBgClass} ${item.brandTextClass} flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105`}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                                {item.platform}
                              </h4>
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Profile connected" />
                            </div>
                            <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 truncate block">
                              {item.handle}
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                          {item.badgeText}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[170px]" title={item.url}>
                        {item.url.replace(/^https?:\/\//, '')}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.url);
                            triggerToast(`${item.platform} link copied!`);
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 transition"
                          title={`Copy ${item.platform} URL`}
                          aria-label={`Copy ${item.platform} URL`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${item.brandBgClass} ${item.brandHoverClass} ${item.brandTextClass} font-bold text-xs shadow-2xs transition group/btn`}
                          title={`Visit ${studentUser.name}'s ${item.platform} profile`}
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isOwner
                  ? 'No external profiles currently linked in your profile table. Add your GitHub, LinkedIn, or Behance to highlight your code and visual designs.'
                  : 'This creator has not linked any external social media profiles in their profile table yet.'}
              </p>
              {isOwner && (
                <button
                  onClick={handleOpenEditProfile}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link GitHub, LinkedIn, or Behance</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* ============================================================== */}
        {/* TABS NAVIGATION */}
        {/* ============================================================== */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`pb-3 px-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-2 ${
                activeTab === 'portfolio'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Portfolio Work</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {allPassportItems.length + (profile?.portfolioLinks?.length || 0)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`pb-3 px-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-2 ${
                activeTab === 'skills'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Skills & Stack</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {profile?.skills.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`pb-3 px-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-2 ${
                activeTab === 'feedback'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span>Client Feedback</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {reviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`pb-3 px-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-2 ${
                activeTab === 'badges'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Award className="w-4 h-4 text-indigo-500" />
              <span>Badges & XP</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`pb-3 px-2 border-b-2 transition whitespace-nowrap text-xs sm:text-sm font-bold flex items-center gap-2 ${
                activeTab === 'about'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <span>About & Credentials</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: PORTFOLIO (SEARCH & FILTERABLE CARDS) */}
        {/* ============================================================== */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search deliverables, projects, stack (e.g. Next.js, Packaging, Figma)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <button
                  onClick={() => setSelectedTypeFilter('ALL')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedTypeFilter === 'ALL'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All Work ({allPassportItems.length + (profile?.portfolioLinks?.length || 0)})
                </button>

                <button
                  onClick={() => setSelectedTypeFilter('VERIFIED')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    selectedTypeFilter === 'VERIFIED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Platform-Verified ({allPassportItems.length})</span>
                </button>

                <button
                  onClick={() => setSelectedTypeFilter('SELF_REPORTED')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    selectedTypeFilter === 'SELF_REPORTED'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Self-Reported ({profile?.portfolioLinks?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            {categories.length > 2 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Category:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Owner action bar: Add work sample */}
            {isOwner && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-300">
                  <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Creator Portfolio Controls:</strong> Verified projects from client sign-offs appear automatically. You can also link personal case studies and toggle public visibility.
                  </span>
                </div>
                <button
                  onClick={() => setShowAddSampleModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ml-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add External Sample</span>
                </button>
              </div>
            )}

            {/* SECTION 1: PROOF PASSPORT VERIFIED PROJECTS */}
            {(selectedTypeFilter === 'ALL' || selectedTypeFilter === 'VERIFIED') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      <FileCheck className="w-4 h-4" />
                    </span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      Proof Passport — Platform-Verified Outcomes ({filteredPassportItems.length})
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200">
                    Client & Arbitration Verified
                  </span>
                </div>

                {filteredPassportItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>No platform-verified projects match your current filters.</p>
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('ALL');
                          setSelectedTypeFilter('ALL');
                        }}
                        className="text-xs text-emerald-600 font-semibold hover:underline"
                      >
                        Reset search filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredPassportItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/20 dark:border-emerald-500/30 overflow-hidden shadow-sm hover:border-emerald-500/40 transition flex flex-col justify-between group"
                      >
                        {/* Project Card Image & Header */}
                        <div>
                          {item.coverImage && (
                            <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                              <img
                                src={item.coverImage}
                                alt={item.projectTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold flex items-center gap-1 border border-white/10">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  {item.badgeTitle || 'Verified Work Delivery'}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="p-6 space-y-3.5">
                            {!item.coverImage && (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  {item.badgeTitle || 'Verified Work Delivery'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                                  {item.completionSource === 'DISPUTE_RESOLUTION' ? '⚖️ Dispute Arbitration' : '✓ Client Sign-Off'}
                                </span>
                              </div>
                            )}

                            <div>
                              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                                {item.category}
                              </div>
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white pt-0.5 leading-snug">
                                {item.projectTitle}
                              </h3>
                              <div className="text-xs text-slate-500 mt-1">
                                Commissioned by <strong>{item.businessName}</strong> {item.businessCity ? `(${item.businessCity})` : ''} · {new Date(item.completedAt).toLocaleDateString()}
                              </div>
                            </div>

                            {/* Sanitized Deliverables List */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified Deliverable Outcomes:</span>
                              </span>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                                {item.sanitizedSummary}
                              </p>

                              {item.deliverables && item.deliverables.length > 0 && (
                                <ul className="pt-1 space-y-1">
                                  {item.deliverables.map((del, dIdx) => (
                                    <li key={dIdx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                                      <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                      <span>{del}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Skills Tags */}
                            {item.skills && item.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {item.skills.map((sk) => (
                                  <span
                                    key={sk}
                                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Review excerpt */}
                            {item.reviewSnippet && (
                              <div className="p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-xs italic text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[11px]">"{item.reviewSnippet}"</p>
                                  {item.rating && (
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 not-italic block pt-0.5">
                                      ★ {item.rating}.0 Verified Rating
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer: Privacy Guarantee & Owner Toggle */}
                        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Lock className="w-3 h-3" />
                            <span>Client source files confidential</span>
                          </span>

                          {isOwner && (
                            <button
                              onClick={() => handleToggleVisibility(item.id, item.isPublic)}
                              className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition ${
                                item.isPublic
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.isPublic ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>Public</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>Hidden</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: SELF-REPORTED PORTFOLIO SAMPLES */}
            {(selectedTypeFilter === 'ALL' || selectedTypeFilter === 'SELF_REPORTED') && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Creator Self-Reported Work Samples ({filteredSelfReportedSamples.length})
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                    Self-Reported External Links
                  </span>
                </div>

                {filteredSelfReportedSamples.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    No self-reported portfolio links to show.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSelfReportedSamples.map((link, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition flex flex-col justify-between gap-3 shadow-2xs group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition flex items-center gap-2">
                              <span>{link.title}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                External
                              </span>
                            </h4>

                            {isOwner && (
                              <button
                                onClick={() => handleDeleteSample(idx)}
                                className="text-slate-300 hover:text-rose-500 p-1"
                                title="Remove link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {link.description && (
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {link.description}
                            </p>
                          )}
                        </div>

                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 self-start"
                        >
                          <span>Visit Case Study</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SKILLS & STACK */}
        {/* ============================================================== */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Verified Skills from Accepted Deliverables */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Deliverable-Verified Technical Skills</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Skills verified and endorsed through completed deliverables signed off by Indian business clients.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 self-start sm:self-auto">
                  {verifiedSkills.length} Verified
                </span>
              </div>

              {verifiedSkills.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                  Skills will be verified once your first Proof-to-Pay client deliverable is approved.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {verifiedSkills.map((s) => (
                    <div
                      key={s}
                      className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Technical Stack / Self-Declared Skills */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span>Demonstrated Technical Stack ({profile?.skills.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Self-declared languages, frameworks, and design proficiencies. Deliverable-verified skills are highlighted above.
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={handleOpenEditProfile}
                    className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Full Profile Editor</span>
                  </button>
                )}
              </div>

              {/* In-Place Quick Add for Creator */}
              {isOwner && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={quickSkillInput}
                    onChange={(e) => setQuickSkillInput(e.target.value)}
                    placeholder="Add a new skill (e.g. Tailwind CSS, Next.js, Redux)..."
                    className="flex-1 max-w-md px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkillDirectly(quickSkillInput);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddSkillDirectly(quickSkillInput)}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-black dark:hover:bg-slate-200 transition shadow-2xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Skill</span>
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {profile?.skills.map((s) => {
                  const isAlsoVerified = verifiedSkills.includes(s);
                  return (
                    <span
                      key={s}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition ${
                        isAlsoVerified
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80'
                      }`}
                    >
                      {isAlsoVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                      <span>{s}</span>
                      {isAlsoVerified && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                          Verified
                        </span>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveSkillDirectly(s)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition ml-0.5"
                          title={`Remove ${s}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CLIENT FEEDBACK & REVIEWS */}
        {/* ============================================================== */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>Authenticated Client Endorsements ({reviews.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Reviews can only be submitted after client signs off on completed micro-project deliverables.
                </p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <Star className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">No client feedback published yet.</p>
                <p className="text-[11px] max-w-sm mx-auto">
                  When a commissioning business confirms project deliverables, their verified review and rating will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {rev.reviewerName}
                        </div>
                        <div className="text-xs text-slate-500">
                          Project: <strong>{rev.projectTitle}</strong> · {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-xl text-amber-700 dark:text-amber-300 font-bold text-xs self-start sm:self-auto">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{rev.rating}.0 Verified Rating</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed pl-3 border-l-2 border-emerald-500">
                      "{rev.comment}"
                    </p>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Verified Deliverables: {rev.verifiedDeliverableSummary}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        GSTIN/CIN Verified Client
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: BADGES & XP PROGRESSION */}
        {/* ============================================================== */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            <Badges
              profile={profile || {
                userId: studentUser.id,
                headline: 'Creator',
                bio: '',
                age: 20,
                skills: [],
                experienceLevel: 'INTERMEDIATE',
                portfolioLinks: [],
                totalEarnedINR: 0,
                completedProjectsCount: 0,
                averageRating: 0,
                verifiedPortfolioSlug: studentUser.id,
              }}
              user={studentUser}
              reviews={reviews}
              projects={completedProjects}
              variant="full"
              isOwner={isOwner}
              onUpdatePinnedBadges={(newPinned) => {
                if (currentUser && isOwner) {
                  marketplaceStore.updateCreatorPortfolio(currentUser, studentUser.id, {
                    pinnedBadgeIds: newPinned,
                  });
                  setRefreshCounter((c) => c + 1);
                  triggerToast('Pinned credentials updated!');
                }
              }}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: ABOUT & CREDENTIALS */}
        {/* ============================================================== */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 space-y-6">
              {/* Creator Biography */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  About {studentUser.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {profile?.bio || 'No biography provided yet.'}
                </p>
              </div>

              {/* Education & Academic Profile */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-500" />
                  <span>Academic Qualifications</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {profile?.college || 'University Institution'}
                    </span>
                    <p className="text-slate-500">
                      {profile?.degree || 'Undergraduate Degree Program'}
                    </p>
                    {profile?.graduationYear && (
                      <span className="text-[11px] text-slate-400 block pt-1">
                        Expected Graduation: <strong>{profile.graduationYear}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Strict Privacy Statement */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5 text-xs text-slate-500">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-slate-800 dark:text-slate-200">
                    Proof-to-Pay Data Privacy & Security Seal:
                  </strong>
                  <p className="leading-relaxed">
                    Personal emails, phone numbers, identity documents, bank accounts, UPI IDs, and proprietary client source code archives are strictly protected by database Row-Level Security and are never exposed publicly.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Verification & Meta */}
            <div className="md:col-span-4 space-y-6">
              {/* Creator Verification Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Proof Verification Standards</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Adult Age 18+ Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Deliverables Audited</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Zero Platform Deductions</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>GSTIN Business Feedback</span>
                  </div>
                </div>
              </div>

              {/* Social Media & Professional Profiles Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-indigo-500" />
                    <span>Social Media & Profiles</span>
                  </h4>
                  {isOwner && (
                    <button
                      onClick={handleOpenEditProfile}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Manage
                    </button>
                  )}
                </div>

                {activeSocialCards.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {activeSocialCards.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2 group hover:border-slate-300 dark:hover:border-slate-600 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl ${item.brandBgClass} ${item.brandTextClass} flex items-center justify-center shrink-0 shadow-2xs`}>
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                <span>{item.platform}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              </div>
                              <div className="text-[11px] text-slate-500 truncate font-mono">
                                {item.handle}
                              </div>
                            </div>
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-[11px] border border-slate-200 dark:border-slate-600 flex items-center gap-1 shrink-0 transition"
                            title={`Open ${item.platform}`}
                          >
                            <span>Visit</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500">
                      {isOwner ? 'No social links connected yet.' : 'No external social profiles linked.'}
                    </p>
                    {isOwner && (
                      <button
                        onClick={handleOpenEditProfile}
                        className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
                      >
                        + Connect Profiles
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* External Links */}
              {profile?.portfolioLinks && profile.portfolioLinks.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    External Portfolio Links
                  </h4>
                  <div className="space-y-2">
                    {profile.portfolioLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold group transition"
                      >
                        <span className="truncate">{link.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: EDIT PROFILE & PRESENTATION (OWNER ONLY) */}
      {/* ============================================================== */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Creator Portfolio Presentation
                </h3>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Headline *
                </label>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="e.g. Full-Stack React & Node Engineer · Building high-performance web products"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Availability Status
                </label>
                <select
                  value={editAvailability}
                  onChange={(e) => setEditAvailability(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="AVAILABLE">Available for Micro-Projects</option>
                  <option value="BUSY">In Active Project Sprint</option>
                  <option value="UNAVAILABLE">Not Taking Projects</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Biography & Summary
                </label>
                <textarea
                  rows={4}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Detail your experience, focus, and what makes your work stand out..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    College / University
                  </label>
                  <input
                    type="text"
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                    placeholder="e.g. Delhi Technological University"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Degree / Branch
                  </label>
                  <input
                    type="text"
                    value={editDegree}
                    onChange={(e) => setEditDegree(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Cover Image Banner URL (Optional)
                </label>
                <input
                  type="text"
                  value={editCoverImage}
                  onChange={(e) => setEditCoverImage(e.target.value)}
                  placeholder="https://... or /src/assets/images/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Skills manager */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Technical Skills & Stack
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add skill (e.g. Next.js, Figma, Rust)..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-h-[44px]">
                  {editSkills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-[11px] font-semibold"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Social Media & External Profiles Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-0.5 flex items-center gap-1.5 text-xs">
                    <FolderGit2 className="w-4 h-4 text-indigo-500" />
                    <span>Social Media & Professional Profiles</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Connect your GitHub, LinkedIn, and Behance profiles so businesses can review your public code, design portfolios, and credentials.
                  </p>
                </div>

                {/* GitHub Input */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                    <GithubIcon className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                    <span>GitHub Profile (Repositories & Open Source)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      placeholder="https://github.com/username or @username"
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                    />
                    {editGithub && (
                      <button
                        type="button"
                        onClick={() => setEditGithub('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* LinkedIn Input */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                    <LinkedinIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                    <span>LinkedIn Profile (Professional Network & Endorsements)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editLinkedin}
                      onChange={(e) => setEditLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                    />
                    {editLinkedin && (
                      <button
                        type="button"
                        onClick={() => setEditLinkedin('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Behance Input */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                    <BehanceIcon className="w-3.5 h-3.5 text-[#0057FF]" />
                    <span>Behance Profile (Design Showcase & Case Studies)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editBehance}
                      onChange={(e) => setEditBehance(e.target.value)}
                      placeholder="https://behance.net/username"
                      className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                    />
                    {editBehance && (
                      <button
                        type="button"
                        onClick={() => setEditBehance('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: HIRE CREATOR / SEND MICRO-PROJECT OFFER */}
      {/* ============================================================== */}
      {showHireModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Commission {studentUser.name}
                </h3>
              </div>
              <button
                onClick={() => setShowHireModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHireOffer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={hireProjectTitle}
                  onChange={(e) => setHireProjectTitle(e.target.value)}
                  placeholder="e.g. Next.js Pricing Widget & Dark Mode Architecture"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agreed Fixed Budget (INR) *
                  </label>
                  <input
                    type="number"
                    min={500}
                    step={100}
                    value={hireBudgetINR}
                    onChange={(e) => setHireBudgetINR(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery Timeline (Days) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={hireDeadlineDays}
                    onChange={(e) => setHireDeadlineDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agreed Deliverables (One per line) *
                </label>
                <textarea
                  rows={3}
                  value={hireDeliverables}
                  onChange={(e) => setHireDeliverables(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Notes & Context for Creator
                </label>
                <textarea
                  rows={2}
                  value={hireMessage}
                  onChange={(e) => setHireMessage(e.target.value)}
                  placeholder="Share repository links, Figma files, or specific technical preferences..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Financial Breakdown Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5 text-[11px]">
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Creator Receives (100% Net Guarantee):</span>
                  <span className="text-emerald-600 font-mono">₹{hireBudgetINR.toLocaleString('en-IN')} INR</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Platform Fee (5% paid separately by business):</span>
                  <span className="font-mono">₹{(hireBudgetINR * 0.05).toLocaleString('en-IN')} INR</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-emerald-200 dark:border-emerald-800">
                  Proof-to-Pay Scope Lock binds deliverables and fees. ₹0 deducted from creator earnings.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHireModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Binding Offer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: MESSAGE / INQUIRY */}
      {/* ============================================================== */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Message {studentUser.name}
                </h3>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMessage} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Inquiry Subject *
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="e.g. Question about your Next.js project availability"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Details *
                </label>
                <textarea
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Introduce your project requirements or timeline questions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: ADD SELF-UPLOADED WORK SAMPLE */}
      {/* ============================================================== */}
      {showAddSampleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Add External Portfolio Sample
                </h3>
              </div>
              <button
                onClick={() => setShowAddSampleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSample} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sample Title *
                </label>
                <input
                  type="text"
                  value={sampleTitle}
                  onChange={(e) => setSampleTitle(e.target.value)}
                  placeholder="e.g. Behance Micro-Fintech UI Flow"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  External URL (GitHub, Behance, Figma, Live Link) *
                </label>
                <input
                  type="url"
                  value={sampleUrl}
                  onChange={(e) => setSampleUrl(e.target.value)}
                  placeholder="https://behance.net/... or https://github.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Brief Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={sampleDescription}
                  onChange={(e) => setSampleDescription(e.target.value)}
                  placeholder="Summary of what you designed or developed..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500">
                Notice: Self-uploaded samples are labeled as <em>Self-Reported</em> and distinguished from Proof-to-Pay client verified project sign-offs.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSampleModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Save Sample
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
