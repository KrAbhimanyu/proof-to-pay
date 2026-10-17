import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  GraduationCap,
  Building2,
  ShieldCheck,
  CreditCard,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowLeft,
  LifeBuoy,
  FileCheck2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { User } from '../../types';

interface Props {
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth?: (mode?: 'login' | 'register_student' | 'register_business') => void;
  currentUser?: User | null;
}

interface FAQItem {
  id: string;
  category: 'students' | 'businesses' | 'payments' | 'scope_lock' | 'troubleshooting';
  question: string;
  answer: string;
  audience: 'student' | 'business' | 'both';
  steps?: string[];
}

export const HelpCenter: React.FC<Props> = ({
  onNavigate,
  onOpenAuth,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('faq-1');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Payment & UTR');
  const [isTicketSubmitted, setIsTicketSubmitted] = useState(false);

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'payments',
      audience: 'student',
      question: 'How do creators get paid, and what fees are deducted?',
      answer:
        'Proof-to-Pay guarantees a 100% net creator payout policy. Zero commission is deducted from creators. When a business hires you for ₹15,000, you receive the full ₹15,000 directly via bank transfer (UPI, NEFT, or IMPS). The 5% platform service fee is paid separately by the business client directly to Proof-to-Pay.',
      steps: [
        'Complete agreed milestones or the full project scope.',
        'Submit deliverables through your Creator Workspace.',
        'Business reviews and approves your submission.',
        'Business sends funds directly to your UPI ID and logs the 12-digit bank UTR reference.',
        'Verify receipt in your bank/UPI app and click "Confirm Receipt" in your Creator Workspace to release your Proof Passport entry.',
      ],
    },
    {
      id: 'faq-2',
      category: 'scope_lock',
      audience: 'both',
      question: 'What is Scope Lock and how does it prevent infinite revisions?',
      answer:
        'Scope Lock is a binding contract snapshot created upon offer acceptance. It freezes the deliverables list, delivery deadline (2–90 days), and permitted revision cap (1 to 5 rounds). Once the revision cap is exhausted, clients cannot demand further changes without filing a mutual Scope Change Request.',
      steps: [
        'Business defines deliverables and specifies revision cap (default: 2 rounds).',
        'Creator explicitly checks off the agreement terms before starting work.',
        'Revision requests must cite specific feedback linked to the original deliverables.',
        'If the revision cap is reached, the client can either approve the project or propose a Scope Change Request with additional compensation.',
      ],
    },
    {
      id: 'faq-3',
      category: 'students',
      audience: 'student',
      question: 'How do I earn a verified Proof Passport credential?',
      answer:
        'Your Proof Passport is an immutable, client-endorsed public portfolio item. It cannot be created by self-uploading arbitrary screenshots. It is automatically minted only when a business approves your deliverable, records a valid payment UTR, and leaves a verified review rating.',
      steps: [
        'Deliver approved project work.',
        'Confirm receipt of payment in your Creator Workspace.',
        'The completed outcome is minted with verified badges, client name, and testimonial.',
        'Share your unique portfolio URL (e.g. prooftopay.in/portfolio/your-name) with recruiters and on your resume.',
      ],
    },
    {
      id: 'faq-4',
      category: 'businesses',
      audience: 'business',
      question: 'What is the "Zero Spec Work" policy?',
      answer:
        'Proof-to-Pay strictly prohibits unpaid "test tasks," free sample designs, or trial assignments. Under our Fair Creator Charter, businesses evaluate applicants based on their existing verified Proof Passport credentials and initial proposals. Work on project deliverables begins only after a formal paid offer is extended and locked.',
    },
    {
      id: 'faq-5',
      category: 'businesses',
      audience: 'business',
      question: 'How does business verification work, and what documents are required?',
      answer:
        'To protect creators from ghosting and maintain marketplace integrity, businesses can submit legal entity documentation for verified employer status. Verified businesses receive a trust badge and priority placement on project listings.',
      steps: [
        'Navigate to Business Workspace > Settings & Verification.',
        'Provide your registered legal entity name and document type (GSTIN, PAN, or CIN).',
        'Enter the registration document number and submit for compliance review.',
        'Compliance administrators verify the registration against official registries within 24–48 hours.',
        'Tax document numbers and administrative review notes remain confidential and are never exposed publicly.',
      ],
    },
    {
      id: 'faq-6',
      category: 'troubleshooting',
      audience: 'student',
      question: 'Troubleshooting: What should I do if a business delays payment confirmation or provides an invalid UTR?',
      answer:
        'If a business marks a project as paid but you have not received funds in your bank account, or if the provided UTR does not reflect in your bank statement after 24 hours, follow these steps:',
      steps: [
        'Check your bank transaction history using your UPI ID reference.',
        'Message the client through project communications to verify the transaction details.',
        'If unresolved after 24 hours, click "Raise Dispute" on the project card.',
        'Platform administrators will pause project completion, request official bank settlement receipts from the business, and resolve the case within 48 hours.',
      ],
    },
    {
      id: 'faq-7',
      category: 'troubleshooting',
      audience: 'business',
      question: 'Troubleshooting: What happens if a creator misses a delivery deadline?',
      answer:
        'If a creator is approaching a deadline without communication or has missed the agreed delivery date:',
      steps: [
        'Check the project details card for recent submission drafts or notes.',
        'Message the creator to request a progress update or mutually agreed timeline extension.',
        'If the creator remains unresponsive for more than 48 hours past the deadline, click "Raise Dispute / Cancellation".',
        'Administrators review communication logs and can reassign the project or cancel without penalty.',
      ],
    },
    {
      id: 'faq-8',
      category: 'students',
      audience: 'student',
      question: 'Why is there a strict 18+ age requirement for Student Creators?',
      answer:
        'Under Section 11 of the Indian Contract Act (1872), minors (individuals under 18 years of age) do not have legal capacity to enter into binding commercial contracts. Because Proof-to-Pay operates legally binding freelance contracts and milestone payouts in INR, all creators must be at least 18 years old upon registration.',
    },
    {
      id: 'faq-9',
      category: 'payments',
      audience: 'business',
      question: 'How and when does the business pay the 5% platform commission?',
      answer:
        'The 5% platform fee (500 basis points) is settled separately upon project completion. Once you approve the creator\'s work and complete their direct UPI payout, the platform fee invoice is generated in your Business Workspace. You transfer the 5% fee to Proof-to-Pay Technologies and enter the UTR reference for administrator reconciliation.',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      faq.category === selectedCategory ||
      (selectedCategory === 'students' && faq.audience === 'student') ||
      (selectedCategory === 'businesses' && faq.audience === 'business');

    return matchesSearch && matchesCategory;
  });

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setIsTicketSubmitted(true);
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Top Header & Breadcrumb */}
        <div className="space-y-4">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Proof-to-Pay Support & Knowledge Base</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Help Center & Troubleshooting
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Comprehensive answers, payment guides, Scope Lock workflows, and dispute resolution procedures for Indian student creators and business clients.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('how_it_works')}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                How It Works Guide
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs (e.g., 'UPI payment', 'revision cap', '18+ age', 'scope lock', 'UTR')..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {[
            { id: 'all', label: 'All Topics', icon: HelpCircle },
            { id: 'students', label: 'For Creators / Students', icon: GraduationCap },
            { id: 'businesses', label: 'For Businesses / Employers', icon: Building2 },
            { id: 'payments', label: 'Payments & UTR Tracking', icon: CreditCard },
            { id: 'scope_lock', label: 'Scope Lock & Revisions', icon: Lock },
            { id: 'troubleshooting', label: 'Troubleshooting & Disputes', icon: AlertTriangle },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Troubleshooting Guide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creator Troubleshooting Card */}
          <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-800/30 dark:border-emerald-700/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Creator Quick Resolution Steps
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Fast resolutions for work, revisions, and payment
                </p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Client asking for out-of-scope work?</strong> Politely refer to the accepted Scope Lock and propose a bilateral Scope Change Request.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Revision cap reached?</strong> The client must either approve the submission or extend additional budget for further iterations.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Payment delayed?</strong> Verify your UPI ID in your Creator profile, check your bank history, and escalate to admin dispute if unpaid after 24h.
                </span>
              </li>
            </ul>
          </div>

          {/* Business Troubleshooting Card */}
          <div className="p-6 rounded-3xl bg-blue-950/20 border border-blue-800/30 dark:border-blue-700/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-blue-900 dark:text-blue-200">
                  Business Quick Resolution Steps
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Hiring, deliverables inspection, and settlement
                </p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Unresponsive applicant?</strong> Review other applicants or close applications to select from qualified pitches.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Need edits to submitted work?</strong> Use the "Request Revision" action and provide specific bullet points within the agreed cap.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Paying the creator:</strong> Send payment via UPI or IMPS to the creator\'s verified UPI ID and input the 12-digit bank UTR reference.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* FAQs Accordion Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions ({filteredFaqs.length})
            </h2>
            <span className="text-xs text-slate-500">
              Showing {selectedCategory === 'all' ? 'All' : selectedCategory} topics
            </span>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No matching questions found for "{searchQuery}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            faq.audience === 'student'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : faq.audience === 'business'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {faq.audience}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {faq.question}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                        <p>{faq.answer}</p>
                        {faq.steps && faq.steps.length > 0 && (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                              Action Steps:
                            </span>
                            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
                              {faq.steps.map((step, idx) => (
                                <li key={idx} className="leading-normal">
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dispute Resolution SLA & Contact Support Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-slate-900 to-slate-800 text-white border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Arbitration & Mediation SLA: 48 Hours</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">Need Platform Arbitration or Dispute Support?</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Proof-to-Pay administrators mediate scope disagreements, non-payment allegations, and quality disputes objectively using logged deliverables and communication history.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('support-ticket-form');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-sm"
              >
                Submit Support Request
              </button>
            </div>
          </div>

          {/* Embedded Support Form */}
          <div id="support-ticket-form" className="pt-4 border-t border-slate-700">
            {isTicketSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">Support Inquiry Received</p>
                  <p>Our arbitration team will review your inquiry within 24 to 48 hours. Reference logged in audit records.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Inquiry Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Payment & UTR">Payment Settlement & UTR Discrepancy</option>
                      <option value="Scope Lock & Revision">Scope Creep / Revision Cap Disagreement</option>
                      <option value="Proof Passport">Proof Passport Minting & Endorsements</option>
                      <option value="Account & 18+ Verification">Account Deletion & Age Verification</option>
                      <option value="Other">General Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Brief summary of issue..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Project Details</label>
                  <textarea
                    required
                    rows={3}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Provide relevant project ID, UTR number, or deliverable context..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                  >
                    Send Support Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
