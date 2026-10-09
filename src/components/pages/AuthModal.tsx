import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { StudentRegistrationSchema, BusinessRegistrationSchema } from '../../lib/schemas';
import { X, GraduationCap, Building2, Shield, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialMode: 'login' | 'register_student' | 'register_business';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register_student' | 'register_business'>(initialMode);
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Student registration fields
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentAge, setStudentAge] = useState(19);
  const [studentCity, setStudentCity] = useState('');
  const [studentCollege, setStudentCollege] = useState('');
  const [studentHeadline, setStudentHeadline] = useState('');
  const [studentSkills, setStudentSkills] = useState('React, TypeScript, Figma');

  // Business registration fields
  const [bizRepName, setBizRepName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPassword, setBizPassword] = useState('');
  const [bizCompanyName, setBizCompanyName] = useState('');
  const [bizIndustry, setBizIndustry] = useState('Technology & SaaS');
  const [bizCity, setBizCity] = useState('');
  const [bizWebsite, setBizWebsite] = useState('https://');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const users = marketplaceStore.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (!user) {
      setErrorMsg('No user found with this email. Try quick test accounts below.');
      return;
    }
    if (user.isSuspended) {
      setErrorMsg(`Account is suspended: ${user.suspensionReason || 'Policy review'}`);
      return;
    }
    marketplaceStore.setCurrentUserId(user.id);
    onSuccess(user);
    onClose();
  };

  const handleRegisterStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const skillsArray = studentSkills.split(',').map((s) => s.trim()).filter(Boolean);

    const validation = StudentRegistrationSchema.safeParse({
      name: studentName,
      email: studentEmail,
      password: studentPassword,
      age: Number(studentAge),
      city: studentCity,
      college: studentCollege,
      headline: studentHeadline,
      skills: skillsArray,
      experienceLevel: 'INTERMEDIATE',
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please check all required fields.');
      return;
    }

    const newUser: User = {
      id: `student-${Date.now()}`,
      name: studentName,
      email: studentEmail,
      role: 'STUDENT',
      city: studentCity,
      createdAt: new Date().toISOString(),
    };

    const users = marketplaceStore.getUsers();
    marketplaceStore['set']('ptp_users', [newUser, ...users]);

    marketplaceStore.updateStudentProfile(newUser.id, {
      userId: newUser.id,
      headline: studentHeadline,
      bio: `Student at ${studentCollege}`,
      age: Number(studentAge),
      college: studentCollege,
      skills: skillsArray,
      experienceLevel: 'INTERMEDIATE',
      portfolioLinks: [],
      totalEarnedINR: 0,
      completedProjectsCount: 0,
      averageRating: 5.0,
      verifiedPortfolioSlug: studentName.toLowerCase().replace(/\s+/g, '-'),
    });

    marketplaceStore.setCurrentUserId(newUser.id);
    onSuccess(newUser);
    onClose();
  };

  const handleRegisterBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = BusinessRegistrationSchema.safeParse({
      name: bizRepName,
      email: bizEmail,
      password: bizPassword,
      companyName: bizCompanyName,
      industry: bizIndustry,
      city: bizCity,
      website: bizWebsite !== 'https://' ? bizWebsite : '',
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please check all required fields.');
      return;
    }

    const newUser: User = {
      id: `business-${Date.now()}`,
      name: bizRepName,
      email: bizEmail,
      role: 'BUSINESS',
      city: bizCity,
      createdAt: new Date().toISOString(),
    };

    const users = marketplaceStore.getUsers();
    marketplaceStore['set']('ptp_users', [newUser, ...users]);

    marketplaceStore.updateBusinessProfile(newUser.id, {
      userId: newUser.id,
      companyName: bizCompanyName,
      industry: bizIndustry,
      city: bizCity,
      website: bizWebsite,
      verificationStatus: 'UNVERIFIED',
      totalSpentINR: 0,
      projectsPostedCount: 0,
    });

    marketplaceStore.setCurrentUserId(newUser.id);
    onSuccess(newUser);
    onClose();
  };

  // Quick One-Click Demo Login
  const handleQuickDemo = (userId: string) => {
    const users = marketplaceStore.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      marketplaceStore.setCurrentUserId(user.id);
      onSuccess(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mode switcher tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 gap-4 text-xs font-semibold">
          <button
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`pb-1 border-b-2 transition ${
              mode === 'login' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register_student'); setErrorMsg(null); }}
            className={`pb-1 border-b-2 transition ${
              mode === 'register_student' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            Join as Student Creator
          </button>
          <button
            onClick={() => { setMode('register_business'); setErrorMsg(null); }}
            className={`pb-1 border-b-2 transition ${
              mode === 'register_business' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            Hire as Business
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
            >
              Sign In to Proof-to-Pay
            </button>
          </form>
        )}

        {/* 2. Register Student */}
        {mode === 'register_student' && (
          <form onSubmit={handleRegisterStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Age (18+ Policy) *</label>
                <input
                  type="number"
                  min={18}
                  max={65}
                  value={studentAge}
                  onChange={(e) => setStudentAge(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password (min 8 chars) *</label>
              <input
                type="password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City in India *</label>
                <input
                  type="text"
                  value={studentCity}
                  onChange={(e) => setStudentCity(e.target.value)}
                  placeholder="e.g. Delhi, Pune"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">College / University</label>
                <input
                  type="text"
                  value={studentCollege}
                  onChange={(e) => setStudentCollege(e.target.value)}
                  placeholder="e.g. DTU, IIT, NID"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Professional Headline *</label>
              <input
                type="text"
                value={studentHeadline}
                onChange={(e) => setStudentHeadline(e.target.value)}
                placeholder="e.g. React & TypeScript Developer"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
            >
              Create Creator Account (Age 18+ Verified)
            </button>
          </form>
        )}

        {/* 3. Register Business */}
        {mode === 'register_business' && (
          <form onSubmit={handleRegisterBusiness} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Representative Name *</label>
                <input
                  type="text"
                  value={bizRepName}
                  onChange={(e) => setBizRepName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Brand Name *</label>
                <input
                  type="text"
                  value={bizCompanyName}
                  onChange={(e) => setBizCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Email *</label>
              <input
                type="email"
                value={bizEmail}
                onChange={(e) => setBizEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
              <input
                type="password"
                value={bizPassword}
                onChange={(e) => setBizPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                <input
                  type="text"
                  value={bizCity}
                  onChange={(e) => setBizCity(e.target.value)}
                  placeholder="e.g. Bengaluru, Mumbai"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Industry *</label>
                <input
                  type="text"
                  value={bizIndustry}
                  onChange={(e) => setBizIndustry(e.target.value)}
                  placeholder="e.g. D2C, FinTech"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
            >
              Register Business Account
            </button>
          </form>
        )}

        {/* Quick Demo Switcher Section */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            ⚡ Quick 1-Click Sandbox Logins:
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('student-1')}
              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-left hover:scale-[1.02] transition"
            >
              <div className="font-bold truncate">Aarav S.</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">Student (CS)</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('business-1')}
              className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-left hover:scale-[1.02] transition"
            >
              <div className="font-bold truncate">HyperFlow</div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400">Verified Business</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin-1')}
              className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-left hover:scale-[1.02] transition"
            >
              <div className="font-bold truncate">Admin Roy</div>
              <div className="text-[10px] text-purple-600 dark:text-purple-400">Super Admin</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
