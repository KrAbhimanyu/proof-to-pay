import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Lock,
  ArrowRight,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register_student' | 'register_business') => void;
}

export const HowItWorks: React.FC<Props> = ({ onNavigate, onOpenAuth }) => {
  const lifecycleSteps = [
    { num: '01', title: 'Business Verification', desc: 'Businesses register and submit GSTIN, CIN, PAN, or MSME documentation. Admin reviews and approves.' },
    { num: '02', title: 'Clear Project Scoping', desc: 'Business posts a listing with fixed budget in INR, required skills, deliverables, acceptance criteria, and revision limits.' },
    { num: '03', title: 'Listing Moderation', desc: 'Admin verifies the project adheres to safety rules and fair compensation before public visibility.' },
    { num: '04', title: 'Student Application', desc: 'Eligible adult students (18+) apply with their pitch and verified portfolio links. No unpaid spec work.' },
    { num: '05', title: 'Binding Offer Extended', desc: 'Business selects a student and issues a formal offer with locked scope and frozen budget terms.' },
    { num: '06', title: 'Offer Acceptance', desc: 'Student accepts the terms. Project becomes active, and neither party can unilaterally alter scope.' },
    { num: '07', title: 'Milestone Delivery', desc: 'Student submits deliverables and source files for client review.' },
    { num: '08', title: 'Permitted Revisions', desc: 'Client approves work or requests targeted feedback within the agreed revision limit.' },
    { num: '09', title: 'Audited Payment Release', desc: 'Client marks payment with verifiable bank UTR number. Payout is permanently logged.' },
    { num: '10', title: 'Verified Proof Badge', desc: 'Both parties leave mutual reviews, and the completed project is minted into the creator’s verified portfolio.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
          MARKETPLACE LIFECYCLE
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          How Proof-to-Pay Works
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          From first registration to bank UTR payout and verified portfolio outcome. Built from the ground up to prevent ghosting, scope creep, and unpaid spec tasks.
        </p>
      </div>

      {/* 10-Step Interactive Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">The 10-Step Protected Lifecycle</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lifecycleSteps.map((step) => (
            <div key={step.num} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                  {step.num}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{step.title}</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-11">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ & Policies */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Platform Safeguards & Policies</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Adult Participation (18+)</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              To enter legally binding project contracts and comply with Indian contract law, students must confirm they are at least 18 years old upon registration.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Zero Credential Storage</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We never store debit cards, netbanking passwords, or UPI PINs. Payments occur via direct bank transfer / UPI, verified by auditable UTR numbers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dispute Investigation</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              If client asks for work outside original deliverables or a student fails to deliver, either party can file a dispute for platform admin mediation.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-8 sm:p-12 rounded-3xl bg-emerald-600 text-white text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black">Ready to prove your skills and earn?</h2>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
          Join thousands of emerging creators in India taking on real business projects with guaranteed terms.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('browse')}
            className="px-6 py-3 rounded-xl bg-slate-950 text-white font-semibold text-xs hover:bg-slate-900 transition"
          >
            Find Projects
          </button>
          <button
            onClick={() => onOpenAuth('register_business')}
            className="px-6 py-3 rounded-xl bg-white text-emerald-900 font-semibold text-xs hover:bg-emerald-50 transition"
          >
            Post a Project
          </button>
        </div>
      </div>
    </div>
  );
};
