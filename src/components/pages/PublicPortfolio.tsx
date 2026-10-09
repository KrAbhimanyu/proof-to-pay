import React from 'react';
import { User, StudentProfile } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import {
  ShieldCheck,
  Star,
  ExternalLink,
  Award,
  CheckCircle2,
  Calendar,
  Share2,
  ChevronLeft,
  GraduationCap
} from 'lucide-react';

interface Props {
  slug: string;
  onBack: () => void;
  onNavigate: (view: string, param?: string) => void;
}

export const PublicPortfolio: React.FC<Props> = ({ slug, onBack, onNavigate }) => {
  // Find student by slug or id
  const users = marketplaceStore.getUsers();
  const studentUser = users.find(
    (u) => u.id === slug || u.name.toLowerCase().replace(/\s+/g, '-') === slug
  ) || users.find((u) => u.role === 'STUDENT') || users[0];

  const profile = marketplaceStore.getStudentProfile(studentUser.id);
  const reviews = marketplaceStore.getReviews().filter((r) => r.targetUserId === studentUser.id);
  const completedProjects = marketplaceStore.getProjects().filter(
    (p) => p.selectedStudentId === studentUser.id && p.status === 'COMPLETED'
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Public verified portfolio link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Portfolio</span>
        </button>
      </div>

      {/* Hero Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-1 shadow-lg shrink-0">
            {studentUser.avatarUrl ? (
              <img src={studentUser.avatarUrl} alt={studentUser.name} className="w-full h-full object-cover rounded-[14px]" />
            ) : (
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-bold text-2xl">
                {studentUser.name[0]}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {studentUser.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Proof-to-Pay Verified
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">{profile?.headline}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                {profile?.college || 'University Student'}
              </span>
              <span>·</span>
              <span>{studentUser.city || 'India'}</span>
            </div>
          </div>
        </div>

        {/* Aggregate Ratings */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-center min-w-[160px] shrink-0">
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>{profile?.averageRating.toFixed(1)}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Based on {reviews.length} verified project reviews
          </span>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Demonstrated Skills</h3>
        <div className="flex flex-wrap gap-2">
          {profile?.skills.map((s) => (
            <span key={s} className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Verified Work Proofs & Testimonials */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Verified Project Outcomes ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            No completed projects recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{rev.projectTitle}</h3>
                    <div className="text-slate-500 mt-0.5">Commissioned & reviewed by <strong>{rev.reviewerName}</strong></div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Deliverable: {rev.verifiedDeliverableSummary}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* External Work Links */}
      {profile?.portfolioLinks && profile.portfolioLinks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Case Studies & Code Repositories</h3>
          <div className="space-y-2">
            {profile.portfolioLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between text-xs group"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                    {link.title}
                  </div>
                  {link.description && <p className="text-slate-500 text-[11px]">{link.description}</p>}
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
