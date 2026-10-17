import React, { useState } from 'react';
import {
  User,
  StudentProfile,
  RecruiterProfile,
  TalentCollection,
  TalentCollectionItem,
  ProjectOffer
} from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { TalentCollectionModal } from '../common/TalentCollectionModal';
import {
  Briefcase,
  Search,
  Filter,
  BookmarkCheck,
  FolderPlus,
  Share2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Users,
  Award,
  Star,
  MapPin,
  GraduationCap,
  Calendar,
  Send,
  Trash2,
  Edit3,
  Copy,
  Check,
  Plus,
  ArrowRight,
  TrendingUp,
  Tag,
  Gift,
  FolderHeart
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register_student' | 'register_business' | 'register_recruiter') => void;
  onLogout?: () => void;
}

export const RecruiterPortal: React.FC<Props> = ({
  currentUser,
  onNavigate,
  onOpenAuth,
  onLogout
}) => {
  // If not authenticated or not recruiter/admin, provide guest browsing of talent with prompt to register
  const isAuthorized = currentUser && (currentUser.role === 'RECRUITER' || currentUser.role === 'ADMIN');
  const activeUserId = currentUser?.id || 'recruiter-1';

  const recruiterProfile: RecruiterProfile = marketplaceStore.getRecruiterProfile(activeUserId) || {
    userId: activeUserId,
    companyName: 'TalentFoundry Tech Partners',
    designation: 'Principal Tech Recruiter & Talent Partner',
    industry: 'Engineering & Product Staffing',
    verificationStatus: 'VERIFIED',
    website: 'https://talentfoundry.in',
    hiringDomains: ['Frontend / React', 'Mobile (Android/iOS)', 'Fullstack', 'UI/UX Design'],
    totalHiresCount: 14,
    activeCollectionsCount: 2,
    referralCode: 'RHEA-TALENT-2026'
  };

  const [activeTab, setActiveTab] = useState<'discovery' | 'collections' | 'offers' | 'referrals'>('discovery');

  // --- Talent Discovery Search & Filter States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('ALL');
  const [selectedExpLevel, setSelectedExpLevel] = useState<string>('ALL');
  const [selectedMinProjects, setSelectedMinProjects] = useState<number>(0);
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // --- Collections States ---
  const [collections, setCollections] = useState<TalentCollection[]>(() =>
    marketplaceStore.getTalentCollections(activeUserId)
  );
  const [collectionSubTab, setCollectionSubTab] = useState<'curated' | 'private'>('curated');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [isCreateColModalOpen, setIsCreateColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColColor, setNewColColor] = useState<'indigo' | 'emerald' | 'blue' | 'purple' | 'amber'>('indigo');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Curated collections from platform administrators
  const curatedCollections = marketplaceStore.getCuratedCollections();

  const handleCloneCuratedCohort = (curatedColId: string) => {
    try {
      const cloned = marketplaceStore.cloneCuratedCollectionForRecruiter(activeUserId, curatedColId);
      setCollections(marketplaceStore.getTalentCollections(activeUserId));
      setCollectionSubTab('private');
      setActiveCollectionId(cloned.id);
      showToast(`Curated cohort "${cloned.name}" saved to your private collections!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to clone cohort');
    }
  };

  // --- Save to Collection Modal State ---
  const [savingCreator, setSavingCreator] = useState<{
    user: User;
    profile: StudentProfile;
  } | null>(null);

  // Load all creators
  const allUsers = marketplaceStore.getUsers();
  const allStudentProfiles = marketplaceStore.getStudentProfiles();
  const creators = allUsers
    .filter((u) => u.role === 'STUDENT')
    .map((u) => ({
      user: u,
      profile: allStudentProfiles[u.id] || {
        userId: u.id,
        headline: 'Emerging Creator',
        bio: '',
        age: 20,
        skills: ['React', 'TypeScript'],
        experienceLevel: 'INTERMEDIATE',
        portfolioLinks: [],
        verifiedPortfolioSlug: u.name.toLowerCase().replace(/\s+/g, '-'),
        totalEarnedINR: 0,
        completedProjectsCount: 0,
        averageRating: 5.0,
      }
    }));

  // Filtered creators list
  const filteredCreators = creators.filter(({ user, profile }) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = user.name.toLowerCase().includes(q);
      const matchHeadline = profile.headline.toLowerCase().includes(q);
      const matchCollege = (profile.college || '').toLowerCase().includes(q);
      const matchSkills = profile.skills.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchHeadline && !matchCollege && !matchSkills) return false;
    }

    // Skill filter
    if (selectedSkill !== 'ALL') {
      const hasSkill = profile.skills.some((s) => s.toLowerCase().includes(selectedSkill.toLowerCase()));
      if (!hasSkill) return false;
    }

    // Experience filter
    if (selectedExpLevel !== 'ALL' && profile.experienceLevel !== selectedExpLevel) {
      return false;
    }

    // Min projects
    if (selectedMinProjects > 0 && profile.completedProjectsCount < selectedMinProjects) {
      return false;
    }

    // Min rating
    if (selectedMinRating > 0 && profile.averageRating < selectedMinRating) {
      return false;
    }

    // City
    if (selectedCity !== 'ALL' && user.city !== selectedCity) {
      return false;
    }

    return true;
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const created = marketplaceStore.createTalentCollection(
      activeUserId,
      newColName.trim(),
      newColDesc.trim(),
      newColColor
    );
    const updated = marketplaceStore.getTalentCollections(activeUserId);
    setCollections(updated);
    setIsCreateColModalOpen(false);
    setNewColName('');
    setNewColDesc('');
    showToast(`Collection "${created.name}" created!`);
  };

  const handleDeleteCollection = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete collection "${name}"?`)) {
      marketplaceStore.deleteTalentCollection(id);
      const updated = marketplaceStore.getTalentCollections(activeUserId);
      setCollections(updated);
      if (activeCollectionId === id) setActiveCollectionId(null);
      showToast('Collection deleted');
    }
  };

  const handleRemoveCreatorFromCol = (colId: string, creatorId: string) => {
    marketplaceStore.removeCreatorFromCollection(colId, creatorId);
    setCollections(marketplaceStore.getTalentCollections(activeUserId));
    showToast('Candidate removed from collection');
  };

  const handleSaveNote = (colId: string, creatorId: string) => {
    marketplaceStore.updateCollectionItemNotes(colId, creatorId, noteContent);
    setCollections(marketplaceStore.getTalentCollections(activeUserId));
    setEditingNoteId(null);
    setNoteContent('');
    showToast('Private note saved');
  };

  const handleExportCollection = (col: TalentCollection) => {
    const candidateSummaries = col.items.map((item) => {
      const c = creators.find((cr) => cr.user.id === item.creatorId);
      if (!c) return '';
      return `• ${c.user.name} (${c.profile.headline}) | Skills: ${c.profile.skills.join(', ')} | Verified Earned: ₹${c.profile.totalEarnedINR} | Rating: ${c.profile.averageRating}★ | Portfolio: https://prooftopay.in/portfolio/${c.profile.verifiedPortfolioSlug}${item.privateNotes ? `\n  Recruiter Notes: ${item.privateNotes}` : ''}`;
    }).filter(Boolean).join('\n\n');

    const fullExport = `PROOF-TO-PAY TALENT COLLECTION: ${col.name}\nDescription: ${col.description}\nTotal Candidates: ${col.items.length}\nCreated: ${new Date(col.createdAt).toLocaleDateString()}\n\nCANDIDATES:\n${candidateSummaries}`;

    try {
      navigator.clipboard.writeText(fullExport);
      showToast('Collection summary copied to clipboard!');
    } catch {
      showToast('Could not copy to clipboard');
    }
  };

  // Selected collection object (searches both recruiter private collections and platform curated collections)
  const activeCol = activeCollectionId
    ? (collections.find((c) => c.id === activeCollectionId) || curatedCollections.find((c) => c.id === activeCollectionId))
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Unauthorized Banner if Visitor */}
        {!isAuthorized && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Recruiter Preview Mode:</strong> You are exploring Proof-to-Pay Verified Creators. Sign in or register as a Tech Recruiter to create unlimited talent collections and extend direct offers.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-semibold"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register_student')}
                className="px-3 py-1 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700"
              >
                Register Recruiter
              </button>
            </div>
          </div>
        )}

        {/* Recruiter Identity Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-md shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-black text-xl">
                {currentUser?.name?.charAt(0) || 'R'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {currentUser?.name || 'Rhea Sengupta'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  Verified Tech Recruiter
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {recruiterProfile.designation} · <strong className="text-slate-900 dark:text-white">{recruiterProfile.companyName}</strong>
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {recruiterProfile.hiringDomains.map((domain) => (
                  <span
                    key={domain}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium"
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsCreateColModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Collection</span>
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Gift className="w-4 h-4 text-emerald-500" />
              <span>Referral Network</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
          <button
            onClick={() => { setActiveTab('discovery'); setActiveCollectionId(null); }}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'discovery'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Talent Discovery</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredCreators.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'collections'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Talent Collections</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {collections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'referrals'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4 text-emerald-500" />
            <span>Referrals & Rewards</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* 1. TALENT DISCOVERY VIEW */}
        {/* ======================================================== */}
        {activeTab === 'discovery' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search creators by name, skills (React, Figma), college, or keywords..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value="ALL">All Skills</option>
                    <option value="React">React / TypeScript</option>
                    <option value="Figma">Figma / UI/UX</option>
                    <option value="Node">Node.js / Backend</option>
                    <option value="Tailwind">Tailwind CSS</option>
                    <option value="Mobile">Mobile / Android</option>
                    <option value="Design Systems">Design Systems</option>
                  </select>

                  <select
                    value={selectedExpLevel}
                    onChange={(e) => setSelectedExpLevel(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value="ALL">All Experience Levels</option>
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>

                  <select
                    value={selectedMinProjects}
                    onChange={(e) => setSelectedMinProjects(Number(e.target.value))}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value={0}>Any Completed Projects</option>
                    <option value={1}>1+ Verified Deliverables</option>
                    <option value={2}>2+ Verified Deliverables</option>
                    <option value={3}>3+ Verified Deliverables</option>
                  </select>

                  <select
                    value={selectedMinRating}
                    onChange={(e) => setSelectedMinRating(Number(e.target.value))}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={4.5}>4.5+ ★ Rating</option>
                    <option value={4.8}>4.8+ ★ Rating</option>
                    <option value={5.0}>5.0 ★ Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Creators Grid */}
            {filteredCreators.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                <Search className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  No verified creators found matching your criteria
                </h3>
                <p className="text-xs text-slate-500">
                  Try clearing skill or experience filters to see more emerging talent.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSkill('ALL');
                    setSelectedExpLevel('ALL');
                    setSelectedMinProjects(0);
                    setSelectedMinRating(0);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCreators.map(({ user, profile }) => (
                  <div
                    key={user.id}
                    className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                          alt={user.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">
                              {user.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              {profile.experienceLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {profile.headline}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            {profile.college && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 text-indigo-500" />
                                <span className="truncate max-w-[150px]">{profile.college}</span>
                              </span>
                            )}
                            {user.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                <span>{user.city}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{profile.averageRating.toFixed(1)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {profile.completedProjectsCount} completed
                        </span>
                      </div>
                    </div>

                    {/* Verified Telemetry Highlights */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Verified Earned</div>
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          ₹{profile.totalEarnedINR.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Delivery Rate</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          100% On-Time
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Status</div>
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                          {profile.availability || 'AVAILABLE'}
                        </div>
                      </div>
                    </div>

                    {/* Skills pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => onNavigate('portfolio', profile.verifiedPortfolioSlug)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Proof Passport</span>
                      </button>

                      <button
                        onClick={() => setSavingCreator({ user, profile })}
                        className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-semibold text-xs transition flex items-center gap-1.5"
                      >
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>Save to Collection</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. TALENT COLLECTIONS VIEW */}
        {/* ======================================================== */}
        {activeTab === 'collections' && (
          <div className="space-y-6">
            {!activeCol ? (
              // Collections List Grid with Sub-tab Switch
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <FolderHeart className="w-5 h-5 text-indigo-600" />
                      <span>Talent Collections & Showcases</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Explore official admin-curated cohorts or organize your private shortlists
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {collectionSubTab === 'private' && (
                      <button
                        onClick={() => setIsCreateColModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Private Collection</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-tab Pill Switch */}
                <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 w-fit border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setCollectionSubTab('curated')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      collectionSubTab === 'curated'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Official Curated Cohorts ({curatedCollections.length})</span>
                  </button>

                  <button
                    onClick={() => setCollectionSubTab('private')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      collectionSubTab === 'private'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>My Private Shortlists ({collections.length})</span>
                  </button>
                </div>

                {/* --- 2A. Curated Collections Sub-tab --- */}
                {collectionSubTab === 'curated' && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>
                          <strong>Admin-Curated Cohorts (Phase C):</strong> These candidate lists are hand-vetted and verified by Proof-to-Pay editorial staff. You can explore full candidate profiles or clone entire cohorts into your private workspace with a single click.
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {curatedCollections.map((col) => (
                        <div
                          key={col.id}
                          className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                                <Award className="w-3 h-3 text-indigo-500" />
                                <span>{col.badge || 'Staff Pick'}</span>
                              </span>

                              {col.isFeatured && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>Featured</span>
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {col.category || 'General'}
                              </span>
                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                                {col.name}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                {col.description}
                              </p>
                            </div>

                            {/* Candidate Avatars Teaser */}
                            <div className="pt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2 overflow-hidden">
                                  {col.items.slice(0, 4).map((item) => {
                                    const c = creators.find((cr) => cr.user.id === item.creatorId);
                                    return (
                                      <div
                                        key={item.id}
                                        title={c?.user.name}
                                        className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                                      >
                                        {c?.user.name.charAt(0) || 'C'}
                                      </div>
                                    );
                                  })}
                                </div>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {col.items.length} {col.items.length === 1 ? 'Endorsed Candidate' : 'Endorsed Candidates'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleCloneCuratedCohort(col.id)}
                              title="Clone this cohort into your private collections"
                              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Clone Cohort</span>
                            </button>

                            <button
                              onClick={() => {
                                marketplaceStore.recordCuratedCollectionView(col.id);
                                setActiveCollectionId(col.id);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1"
                            >
                              <span>Explore Cohort</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- 2B. Private Collections Sub-tab --- */}
                {collectionSubTab === 'private' && (
                  <div>
                    {collections.length === 0 ? (
                      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl space-y-3">
                        <BookmarkCheck className="w-10 h-10 text-indigo-500 mx-auto" />
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          No private collections created yet
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Create private collections like "React Candidates Q4" or clone an official curated cohort to get started.
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            onClick={() => setIsCreateColModalOpen(true)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                          >
                            Create First Collection
                          </button>
                          <button
                            onClick={() => setCollectionSubTab('curated')}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                          >
                            Browse Curated Cohorts
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {collections.map((col) => (
                          <div
                            key={col.id}
                            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  col.color === 'emerald' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  col.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                                  col.color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                                  col.color === 'amber' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                  'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                }`}>
                                  {col.items.length} {col.items.length === 1 ? 'Candidate' : 'Candidates'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleExportCollection(col)}
                                    title="Export collection candidate brief"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCollection(col.id, col.name)}
                                    title="Delete collection"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                                {col.name}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                {col.description || 'No description provided.'}
                              </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-[11px] text-slate-400">
                                Updated {new Date(col.updatedAt).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => setActiveCollectionId(col.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1"
                              >
                                <span>Open Roster</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Single Collection Detail View
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveCollectionId(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    ← Back to All Collections
                  </button>
                  <div className="flex items-center gap-2">
                    {activeCol.isCurated && (
                      <button
                        onClick={() => handleCloneCuratedCohort(activeCol.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Clone to My Collections</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleExportCollection(activeCol)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Export Candidate Brief</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeCol.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                        <Award className="w-3 h-3 text-indigo-500" />
                        <span>{activeCol.badge}</span>
                      </span>
                    )}
                    {activeCol.category && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {activeCol.category}
                      </span>
                    )}
                    {activeCol.isCurated && (
                      <span className="text-[11px] text-slate-400">
                        Curated by <strong>{activeCol.curatorName || 'Proof-to-Pay Staff'}</strong>
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {activeCol.name}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    {activeCol.description}
                  </p>
                </div>

                {activeCol.items.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl space-y-3">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500">
                      No candidates in this collection yet. Head to "Talent Discovery" to add creators.
                    </p>
                    <button
                      onClick={() => setActiveTab('discovery')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                    >
                      Browse Talent
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeCol.items.map((item) => {
                      const creatorMatch = creators.find((c) => c.user.id === item.creatorId);
                      if (!creatorMatch) return null;
                      const { user, profile } = creatorMatch;
                      const isEditingThis = editingNoteId === item.creatorId;

                      return (
                        <div
                          key={item.id}
                          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt={user.name}
                                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                              />
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                  {user.name}
                                </h4>
                                <p className="text-xs text-slate-500">{profile.headline}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-emerald-600 font-bold">
                                    ₹{profile.totalEarnedINR.toLocaleString('en-IN')} Earned
                                  </span>
                                  <span className="text-[10px] text-slate-400">·</span>
                                  <span className="text-[10px] text-amber-500 font-bold">
                                    {profile.averageRating.toFixed(1)} ★
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {activeCol.isCurated && (
                                <button
                                  onClick={() => setSavingCreator({ user, profile })}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1"
                                >
                                  <BookmarkCheck className="w-3.5 h-3.5" />
                                  <span>Shortlist Candidate</span>
                                </button>
                              )}
                              <button
                                onClick={() => onNavigate('portfolio', profile.verifiedPortfolioSlug)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold text-slate-700 dark:text-slate-300"
                              >
                                Portfolio
                              </button>
                              {!activeCol.isCurated && (
                                <button
                                  onClick={() => handleRemoveCreatorFromCol(activeCol.id, item.creatorId)}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                  title="Remove candidate from this collection"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Curator Endorsement Quote (if curated) */}
                          {item.endorsement && (
                            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">
                                <Award className="w-3 h-3 text-indigo-500" />
                                <span>Official Curator Endorsement</span>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                "{item.endorsement}"
                              </p>
                            </div>
                          )}

                          {/* Private Notes Section */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                              <span className="font-semibold text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Recruiter Screening Notes:
                              </span>
                              {!isEditingThis ? (
                                <button
                                  onClick={() => {
                                    setEditingNoteId(item.creatorId);
                                    setNoteContent(item.privateNotes || '');
                                  }}
                                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{item.privateNotes ? 'Edit Note' : 'Add Note'}</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditingNoteId(null)}
                                    className="text-[11px] text-slate-400 hover:text-slate-600"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveNote(activeCol.id, item.creatorId)}
                                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>

                            {isEditingThis ? (
                              <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                rows={2}
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                placeholder="Write internal recruiter feedback or candidate screening notes..."
                              />
                            ) : (
                              <p className="text-slate-700 dark:text-slate-300 italic">
                                {item.privateNotes || 'No notes added yet. Click "Add Note" to record private observations.'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. REFERRALS VIEW */}
        {/* ======================================================== */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 text-white space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                <Gift className="w-3.5 h-3.5" />
                <span>Recruiter Partner Referral Code</span>
              </div>
              <h2 className="text-2xl font-black">
                Earn ₹1,500 INR Per Verified Candidate Placement
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Share your partner invite code with peer recruiters, hiring agencies, or creators. When they complete their first milestone, reward credits are settled to your account.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 font-mono text-emerald-300 text-xs font-bold">
                  {recruiterProfile.referralCode || 'RHEA-TALENT-2026'}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://prooftopay.in/ref/${recruiterProfile.referralCode || 'RHEA-TALENT-2026'}`);
                    showToast('Referral link copied to clipboard!');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Partner Link</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Collection Modal */}
        {isCreateColModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
                Create New Talent Collection
              </h3>
              <form onSubmit={handleCreateCollectionSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="e.g. Fintech React Developers"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newColDesc}
                    onChange={(e) => setNewColDesc(e.target.value)}
                    placeholder="Short description of this talent shortlist..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    {(['indigo', 'emerald', 'blue', 'purple', 'amber'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          newColColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
                        } ${
                          c === 'indigo' ? 'bg-indigo-500' :
                          c === 'emerald' ? 'bg-emerald-500' :
                          c === 'blue' ? 'bg-blue-500' :
                          c === 'purple' ? 'bg-purple-500' : 'bg-amber-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateColModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                  >
                    Create Collection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Save Creator to Collection Modal */}
        {savingCreator && (
          <TalentCollectionModal
            isOpen={!!savingCreator}
            onClose={() => {
              setSavingCreator(null);
              setCollections(marketplaceStore.getTalentCollections(activeUserId));
            }}
            creator={savingCreator}
            currentUserId={activeUserId}
            onSuccess={(colName) => showToast(`Added to "${colName}"`)}
          />
        )}

      </div>
    </div>
  );
};
