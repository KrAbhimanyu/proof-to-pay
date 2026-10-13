import React, { useState, useMemo } from 'react';
import { User, StudentProfile, VerifiedReview, ProofPassportItem, ProjectListing } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import {
  Award,
  CheckCircle2,
  Star,
  Building2,
  Quote,
  ShieldCheck,
  Search,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Briefcase,
  Layers,
  Lock,
  ArrowUpRight,
  Info,
  Clock
} from 'lucide-react';

export interface SkillEndorsementRecord {
  skillName: string;
  endorsementCount: number;
  averageRating: number;
  endorsements: {
    reviewId?: string;
    projectId: string;
    projectTitle: string;
    businessName: string;
    rating: number;
    commentSnippet: string;
    deliverableSummary: string;
    date: string;
  }[];
}

interface VerifiedSkillsProps {
  studentId: string;
  currentUser?: User;
  onNavigateToProject?: (projectId: string) => void;
  className?: string;
}

export const VerifiedSkills: React.FC<VerifiedSkillsProps> = ({
  studentId,
  currentUser,
  onNavigateToProject,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'DEVELOPMENT' | 'DESIGN' | 'MULTI_ENDORSED'>('ALL');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [copiedSkill, setCopiedSkill] = useState<string | null>(null);

  // 1. Fetch Student Profile, Reviews, Passport Items, and Projects
  const profile = marketplaceStore.getStudentProfile(studentId);
  const studentUser = marketplaceStore.getUsers().find((u) => u.id === studentId);
  const reviews = marketplaceStore.getReviews().filter((r) => r.targetUserId === studentId && r.reviewerRole === 'BUSINESS');
  const passportItems = marketplaceStore.getProofPassportItems(studentId, false);
  const projects = marketplaceStore.getProjects();

  const projectsMap = useMemo(() => {
    const map = new Map<string, ProjectListing>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // 2. Aggregate Verified Skills from Business Reviews and Completed Passport Deliverables
  const verifiedSkillsMap = useMemo(() => {
    const map = new Map<string, SkillEndorsementRecord>();

    // Helper to register an endorsement
    const addEndorsement = (
      rawSkill: string,
      details: {
        reviewId?: string;
        projectId: string;
        projectTitle: string;
        businessName: string;
        rating: number;
        commentSnippet: string;
        deliverableSummary: string;
        date: string;
      }
    ) => {
      const cleanSkill = rawSkill.trim();
      if (!cleanSkill) return;

      const existing = map.get(cleanSkill.toLowerCase());
      if (existing) {
        // Prevent duplicate endorsements for the same project
        const alreadyHasProject = existing.endorsements.some((e) => e.projectId === details.projectId);
        if (!alreadyHasProject) {
          existing.endorsements.push(details);
          existing.endorsementCount = existing.endorsements.length;
          const totalScore = existing.endorsements.reduce((acc, curr) => acc + curr.rating, 0);
          existing.averageRating = Number((totalScore / existing.endorsementCount).toFixed(1));
        }
      } else {
        map.set(cleanSkill.toLowerCase(), {
          skillName: cleanSkill,
          endorsementCount: 1,
          averageRating: details.rating,
          endorsements: [details],
        });
      }
    };

    // A. Process Business Reviews
    reviews.forEach((rev) => {
      const project = projectsMap.get(rev.projectId);
      const bizName = rev.reviewerName || project?.businessName || 'Verified Client';
      const skillsToCredit: string[] = [];

      if (rev.endorsedSkills && rev.endorsedSkills.length > 0) {
        skillsToCredit.push(...rev.endorsedSkills);
      } else if (project?.requiredSkills) {
        skillsToCredit.push(...project.requiredSkills);
      }

      skillsToCredit.forEach((skill) => {
        addEndorsement(skill, {
          reviewId: rev.id,
          projectId: rev.projectId,
          projectTitle: rev.projectTitle || project?.title || 'Completed Project Milestone',
          businessName: bizName,
          rating: rev.rating || 5,
          commentSnippet: rev.comment,
          deliverableSummary: rev.verifiedDeliverableSummary || 'Milestone approved and verified by client.',
          date: rev.createdAt,
        });
      });
    });

    // B. Process Completed Proof Passport Items (where completion is verified)
    passportItems.forEach((item) => {
      if (item.skills && item.skills.length > 0) {
        item.skills.forEach((skill) => {
          addEndorsement(skill, {
            projectId: item.projectId,
            projectTitle: item.projectTitle,
            businessName: item.businessName || 'Business Partner',
            rating: item.rating || 5,
            commentSnippet: item.reviewSnippet || 'Project successfully delivered and verified under platform terms.',
            deliverableSummary: item.sanitizedSummary || 'Deliverables verified and accepted.',
            date: item.completedAt || item.createdAt,
          });
        });
      }
    });

    return map;
  }, [reviews, passportItems, projectsMap]);

  // Convert map to sorted array (most endorsed first, then alphabetically)
  const allVerifiedSkills = useMemo(() => {
    const list = Array.from(verifiedSkillsMap.values());
    list.sort((a, b) => {
      if (b.endorsementCount !== a.endorsementCount) {
        return b.endorsementCount - a.endorsementCount;
      }
      return a.skillName.localeCompare(b.skillName);
    });
    return list;
  }, [verifiedSkillsMap]);

  // Self-Declared Profile Skills
  const selfDeclaredSkills = useMemo(() => {
    return (profile?.skills || []).map((s) => s.trim()).filter(Boolean);
  }, [profile]);

  // Categorization & Filtering
  const filteredSkills = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return allVerifiedSkills.filter((item) => {
      const sName = (item.skillName || '').toLowerCase();
      const matchesSearch = sName.includes(q) ||
        (item.endorsements || []).some((e) =>
          (e.businessName || '').toLowerCase().includes(q) ||
          (e.projectTitle || '').toLowerCase().includes(q)
        );

      if (!matchesSearch) return false;

      if (filterCategory === 'MULTI_ENDORSED') {
        return item.endorsementCount > 1;
      }

      const lower = item.skillName.toLowerCase();
      const isDesign = ['figma', 'ui', 'ux', 'design', 'vector', 'svg', 'illustration', 'branding', 'packaging'].some((k) => lower.includes(k));
      const isDev = ['react', 'next', 'typescript', 'javascript', 'tailwind', 'css', 'node', 'python', 'api', 'code', 'optimization'].some((k) => lower.includes(k));

      if (filterCategory === 'DESIGN') return isDesign;
      if (filterCategory === 'DEVELOPMENT') return isDev;

      return true;
    });
  }, [allVerifiedSkills, searchQuery, filterCategory]);

  // Copy shareable skill endorsement link
  const handleCopySkillProof = (skill: SkillEndorsementRecord) => {
    const text = `Verified Skill: ${skill.skillName} endorsed by ${skill.endorsementCount} business client(s) on Proof-to-Pay (Avg Rating: ${skill.averageRating}★).\nLatest Endorsement by: ${skill.endorsements[0]?.businessName} on "${skill.endorsements[0]?.projectTitle}"`;
    navigator.clipboard.writeText(text);
    setCopiedSkill(skill.skillName);
    setTimeout(() => setCopiedSkill(null), 2500);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header & Trust Stats Banner */}
      <div className="bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-900 p-6 sm:p-7 rounded-3xl border border-emerald-500/30 text-white relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Client-Endorsed Credentials</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Verified Skills & Client Endorsements
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every verified skill below is cryptographically backed by completed project deliverables and authentic feedback from verified businesses. These cannot be self-claimed—they must be earned.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-center shrink-0">
            <div className="px-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Endorsed Skills</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{allVerifiedSkills.length}</div>
            </div>
            <div className="px-2 border-x border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Rating</div>
              <div className="text-xl font-black text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>5.0</span>
              </div>
            </div>
            <div className="px-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Proofs</div>
              <div className="text-xl font-black text-teal-400 mt-0.5">{reviews.length + passportItems.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified skills, client names, or deliverables..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
              filterCategory === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Verified ({allVerifiedSkills.length})
          </button>
          <button
            onClick={() => setFilterCategory('DEVELOPMENT')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
              filterCategory === 'DEVELOPMENT'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-emerald-600'
            }`}
          >
            Engineering & Code
          </button>
          <button
            onClick={() => setFilterCategory('DESIGN')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
              filterCategory === 'DESIGN'
                ? 'bg-blue-600 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-blue-600'
            }`}
          >
            UI/UX & Design
          </button>
          <button
            onClick={() => setFilterCategory('MULTI_ENDORSED')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
              filterCategory === 'MULTI_ENDORSED'
                ? 'bg-purple-600 text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-purple-600'
            }`}
          >
            Multiple Endorsements
          </button>
        </div>
      </div>

      {/* 3. Verified Skills Cards Grid */}
      {filteredSkills.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">No verified skills match your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Skills are automatically unlocked and verified here when business clients approve your completed project deliverables and leave review ratings.
          </p>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setFilterCategory('ALL'); }}
              className="text-xs font-semibold text-emerald-600 hover:underline pt-1"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((skill) => {
            const isExpanded = expandedSkill === skill.skillName;
            const primaryEndorsement = skill.endorsements[0];

            return (
              <div
                key={skill.skillName}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Skill Badge Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {skill.skillName}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Verified</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Endorsed in {skill.endorsementCount} project{skill.endorsementCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{skill.averageRating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Primary Client Quote Snippet */}
                  {primaryEndorsement && (
                    <div className="my-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                      <div className="flex items-start gap-2">
                        <Quote className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5 opacity-80" />
                        <p className="italic text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                          "{primaryEndorsement.commentSnippet}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{primaryEndorsement.businessName}</span>
                        </span>
                        <span className="truncate max-w-[160px] text-slate-400">
                          {primaryEndorsement.projectTitle}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Expanded All Endorsements Details */}
                  {isExpanded && skill.endorsements.length > 1 && (
                    <div className="space-y-2.5 pt-2 mb-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        All Client Endorsements ({skill.endorsements.length}):
                      </div>
                      {skill.endorsements.slice(1).map((endorsement, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                            <span>{endorsement.businessName}</span>
                            <span className="text-amber-500 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{endorsement.rating}.0</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 italic">"{endorsement.commentSnippet}"</p>
                          <div className="text-[10px] text-slate-400 truncate">
                            Project: {endorsement.projectTitle}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 gap-2 text-xs">
                  {skill.endorsements.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setExpandedSkill(isExpanded ? null : skill.skillName)}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>{isExpanded ? 'Hide Extra Endorsements' : `View All (${skill.endorsements.length})`}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  ) : (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      <span>Single Project Delivery Verified</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCopySkillProof(skill)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition shadow-2xs"
                    title="Copy verified skill proof snippet for resumes"
                  >
                    {copiedSkill === skill.skillName ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied Proof!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy Proof</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Self-Declared vs Verified Comparison Section */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Self-Declared Profile Skills vs Client-Endorsed Skills
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Skills you declare on your profile highlight your interests. As businesses hire you and approve completed project deliverables, they graduate into <strong>Verified Skills</strong> with authenticated reviews.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {selfDeclaredSkills.map((skill) => {
            const isVerified = verifiedSkillsMap.has(skill.toLowerCase());
            return (
              <div
                key={skill}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isVerified
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{skill}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isVerified
                    ? 'bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium'
                }`}>
                  {isVerified ? 'Verified' : 'Pending Client Milestone'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
