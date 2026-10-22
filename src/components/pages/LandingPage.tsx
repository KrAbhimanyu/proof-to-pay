import React from 'react';
import { ProjectListing, User } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award,
  Lock,
  Sparkles,
  Smartphone,
  ChevronRight,
  Clock,
  Briefcase
} from 'lucide-react';
import heroStudentCreatorImage from '../../assets/images/hero_student_creator_1791569699063.jpg';
import { MarketTrendsExplorer } from '../common/MarketTrendsExplorer';

interface Props {
  projects: ProjectListing[];
  currentUser: User | null;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register_student' | 'register_business') => void;
  onOpenFeedback?: () => void;
}

export const LandingPage: React.FC<Props> = ({
  projects,
  currentUser,
  onNavigate,
  onOpenAuth,
  onOpenFeedback,
}) => {
  const approvedProjects = projects.filter((p) => p.status === 'APPROVED' || p.status === 'IN_PROGRESS' || p.status === 'COMPLETED').slice(0, 3);

  return (
    <div className="space-y-16 md:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 md:pt-16 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>₹0 LAUNCH BETA · THE WORK-EXPERIENCE PLATFORM FOR INDIA</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Your skills deserve more than a certificate.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
              Find real projects, get paid for your work in INR, and build a portfolio that proves what you can do.
            </p>

            {/* Separate Dual Role Signup Paths */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 hover:border-emerald-500 shadow-sm transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">For Creators (18+)</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">₹0 Fees</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Get Paid & Build Real Proof</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Browse approved scopes, submit deliverables, and earn milestone pay with strict revision limits.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuth('register_student')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <span>Join as Creator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onNavigate('browse')}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition"
                  >
                    Browse
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 hover:border-indigo-500 shadow-sm transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">For Businesses</span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-full">Verified GSTIN</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Hire Verified Indian Talent</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Post locked-scope projects, review vetted creator pitches, and settle payments directly via bank transfer.
                </p>
                <div className="pt-1">
                  <button
                    onClick={() => {
                      if (currentUser?.role === 'BUSINESS') onNavigate('business_dashboard');
                      else onOpenAuth('register_business');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <span>Hire Emerging Talent</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Value Highlights */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 sm:gap-4 text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-base">₹1,000+</div>
                <div className="text-slate-500 dark:text-slate-400">Minimum paid per project</div>
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-base">100% Verified</div>
                <div className="text-slate-500 dark:text-slate-400">GSTIN / CIN checked clients</div>
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-base">0 Spec Work</div>
                <div className="text-slate-500 dark:text-slate-400">Locked scope & revision caps</div>
              </div>
            </div>
          </div>

          {/* Right Hero Image Asset */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 aspect-[4/3] lg:aspect-auto lg:h-[460px]">
              <img
                src={heroStudentCreatorImage}
                alt="Indian student creator collaborating on projects"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                <div className="text-white space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/90 text-slate-950 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>VERIFIED PROOF BADGE</span>
                  </div>
                  <h3 className="font-bold text-sm">Real work. Legitimate pay. Tangible proof.</h3>
                  <p className="text-xs text-slate-200">Every deliverable adds a cryptographically verifiable showcase to your profile.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Lifecycle */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Clear, transparent, zero exploitation
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            How Proof-to-Pay works
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            A complete lifecycle designed to protect emerging creators while delivering reliable execution for businesses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Verified Scopes</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Businesses submit tax documents (GSTIN/CIN) and define clear deliverables, fixed INR budget, and strict revision limits before moderation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Formal Offers</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Students apply with real work samples. The business issues a binding project offer with frozen terms that cannot be edited unilaterally.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Structured Delivery</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Students submit deliverables and source files. Revisions are capped to the agreed count to prevent scope creep.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Audited Pay & Proof</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Payment is recorded with bank UTR proof. Both parties leave verified reviews, and the project becomes a shareable portfolio proof.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Projects Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Active Verified Projects
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Real projects posted by verified companies with transparent INR compensation
            </p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {approvedProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onNavigate('project_detail', project.id)}
              className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
            >
              {project.coverImage && (
                <div className="h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    {project.category}
                  </div>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{project.businessName}</span>
                    <span>{project.businessCity}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                    {project.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">Fixed Budget</span>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      ₹{project.budgetINR.toLocaleString('en-IN')} INR
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Revisions</span>
                    <div className="font-medium text-xs text-slate-700 dark:text-slate-300">
                      {project.permittedRevisions} Cycles
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Market Intelligence Section (Powered by Google Search Grounding) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <MarketTrendsExplorer
          variant="full"
          onNavigateToProjects={() => onNavigate('browse')}
        />
      </section>

      {/* Beta Launch Invitation & ₹0 Community Commitment */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>BETA PHASE 1 INVITATION · ₹0 COMMISSION</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Help Us Build India's Most Honest Work-Experience Network
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Proof-to-Pay operates with <strong>₹0 platform take rate</strong> throughout the controlled Beta launch. Every rupee from a business reaches the creator directly via bank transfer/UPI. In return, we ask for your candid feedback, bug reports, and suggestions.
              </p>
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No fake balances or simulated escrow</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Strict 18+ adult student protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>GSTIN / CIN business moderation</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              {onOpenFeedback && (
                <button
                  onClick={onOpenFeedback}
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95 text-center flex items-center justify-center gap-2"
                >
                  <span>Share Beta Feedback</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onNavigate('how_it_works')}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition text-center"
              >
                Learn How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Manifesto for Indian Creators */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
              <span>THE PROOF-TO-PAY PROMISE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              No unpaid "test tasks." No ghosting. No uncredited work.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Traditional internships often demand hours of unpaid work with vague promises of full-time offers. Proof-to-Pay establishes clear contractual boundaries: every project has an authorized budget in INR, frozen deliverables, an audit trail of feedback, and permanent verification.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('browse')}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition"
              >
                Browse Projects Now
              </button>
              <button
                onClick={() => onNavigate('how_it_works')}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700"
              >
                Read Verification Rules
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
