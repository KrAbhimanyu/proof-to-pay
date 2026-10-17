import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { marketplaceStore } from '../../lib/storage';
import { StudentRegistrationSchema, BusinessRegistrationSchema } from '../../lib/schemas';
import { X, GraduationCap, Building2, Shield, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { auth, googleAuthProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { supabaseService } from '../../lib/supabaseService';

interface Props {
  isOpen: boolean;
  initialMode: 'login' | 'register_student' | 'register_business' | 'register_recruiter';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register_student' | 'register_business' | 'register_recruiter'>(initialMode);
  
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
  const [studentReferralCode, setStudentReferralCode] = useState('');

  // Business registration fields
  const [bizRepName, setBizRepName] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPassword, setBizPassword] = useState('');
  const [bizCompanyName, setBizCompanyName] = useState('');
  const [bizIndustry, setBizIndustry] = useState('Technology & SaaS');
  const [bizCity, setBizCity] = useState('');
  const [bizWebsite, setBizWebsite] = useState('https://');
  const [bizReferralCode, setBizReferralCode] = useState('');

  // Recruiter registration fields
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPassword, setRecruiterPassword] = useState('');
  const [recruiterCompany, setRecruiterCompany] = useState('');
  const [recruiterDesignation, setRecruiterDesignation] = useState('Senior Technical Recruiter');
  const [recruiterIndustry, setRecruiterIndustry] = useState('Tech & Product Staffing');
  const [recruiterHiringDomains, setRecruiterHiringDomains] = useState('Frontend / React, Mobile (Android), UI/UX Design');
  const [recruiterReferralCode, setRecruiterReferralCode] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isLive = supabaseService.isLiveBackendConfigured();

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const users = marketplaceStore.getUsers();
      const existing = users.find((u) => u.email.toLowerCase() === fbUser.email?.toLowerCase());
      let appUser: User;
      if (existing) {
        appUser = existing;
      } else {
        appUser = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
          role: mode === 'register_business' ? 'BUSINESS' : 'STUDENT',
          avatarUrl: fbUser.photoURL || undefined,
          city: 'Bengaluru',
          createdAt: new Date().toISOString(),
        };
        marketplaceStore['set']('ptp_users', [appUser, ...users]);
      }

      try {
        localStorage.setItem('ptp_session_provider', 'firebase');
      } catch {}

      marketplaceStore.setCurrentUserId(appUser.id);
      onSuccess(appUser);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (isLive) {
        // --- Live Supabase Authentication ---
        const authResult = await supabaseService.signInWithEmail(loginEmail.trim(), loginPassword);
        const authUser = authResult?.user;
        if (!authUser) {
          throw new Error('Authentication succeeded but no active user session was returned.');
        }

        // Retrieve authoritative identity from PostgreSQL profiles table
        const profile = await supabaseService.getProfile(authUser.id);
        if (!profile) {
          throw new Error('Account authenticated, but user profile was not found. Please contact support.');
        }

        if (profile.isSuspended) {
          await supabaseService.signOut();
          throw new Error(`Account is suspended: ${profile.suspensionReason || 'Policy review'}`);
        }

        try {
          localStorage.setItem('ptp_session_provider', 'supabase');
        } catch {}

        marketplaceStore.setCurrentUserId(profile.id);
        onSuccess(profile);
        onClose();
      } else {
        // --- Offline / Demo Sandbox Authentication ---
        if (import.meta.env.PROD) {
          throw new Error('Live database backend is not configured for production deployment.');
        }

        const users = marketplaceStore.getUsers();
        const user = users.find((u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
        if (!user) {
          setErrorMsg('No user found with this email. In demo mode, select a test account below.');
          return;
        }
        if (user.isSuspended) {
          setErrorMsg(`Account is suspended: ${user.suspensionReason || 'Policy review'}`);
          return;
        }

        try {
          localStorage.setItem('ptp_session_provider', 'demo');
        } catch {}

        marketplaceStore.setCurrentUserId(user.id);
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const skillsArray = studentSkills.split(',').map((s) => s.trim()).filter(Boolean);

    const validation = StudentRegistrationSchema.safeParse({
      name: studentName.trim(),
      email: studentEmail.trim(),
      password: studentPassword,
      age: Number(studentAge),
      city: studentCity.trim(),
      college: studentCollege.trim(),
      headline: studentHeadline.trim(),
      skills: skillsArray,
      experienceLevel: 'INTERMEDIATE',
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please check all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLive) {
        // --- Live Supabase Registration ---
        const authData = await supabaseService.signUpWithEmail(
          studentEmail.trim(),
          studentPassword,
          { name: studentName.trim(), role: 'STUDENT' }
        );

        const newUserId = authData?.user?.id;
        if (!newUserId) {
          throw new Error('Registration failed: no user identifier returned from Supabase.');
        }

        // Check if an authenticated session was returned. If email confirmation is required,
        // GoTrue returns a user object with session: null. Do not attempt authenticated
        // profile updates or active session navigation until the user confirms their email.
        if (!authData?.session) {
          setConfirmationNotice(
            `Registration submitted for ${studentEmail.trim()}. Please check your email inbox and click the verification link before logging in to access the Creator Workspace.`
          );
          setIsLoading(false);
          return;
        }

        const slug = studentName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        await supabaseService.updateStudentProfile(newUserId, {
          headline: studentHeadline.trim(),
          bio: studentCollege ? `Student at ${studentCollege.trim()}` : '',
          age: Number(studentAge),
          college: studentCollege.trim(),
          skills: skillsArray,
          experienceLevel: 'INTERMEDIATE',
          portfolioLinks: [],
          verifiedPortfolioSlug: slug,
        });

        const profile = await supabaseService.getProfile(newUserId);
        const userObj: User = profile || {
          id: newUserId,
          name: studentName.trim(),
          email: studentEmail.trim(),
          role: 'STUDENT',
          city: studentCity.trim(),
          createdAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem('ptp_session_provider', 'supabase');
        } catch {}

        marketplaceStore.setCurrentUserId(userObj.id);
        onSuccess(userObj);
        onClose();
      } else {
        // --- Offline / Demo Sandbox Registration ---
        if (import.meta.env.PROD) {
          throw new Error('Live database backend is not configured for production deployment.');
        }

        const users = marketplaceStore.getUsers();
        const emailExists = users.some((u) => u.email.toLowerCase() === studentEmail.trim().toLowerCase());
        if (emailExists) {
          setErrorMsg('An account with this email address already exists. Please sign in instead.');
          return;
        }

        const newUser: User = {
          id: `student-${Date.now()}`,
          name: studentName.trim(),
          email: studentEmail.trim(),
          role: 'STUDENT', // Guaranteed student role
          city: studentCity.trim(),
          createdAt: new Date().toISOString(),
        };

        marketplaceStore['set']('ptp_users', [newUser, ...users]);

        marketplaceStore.updateStudentProfile(newUser.id, {
          userId: newUser.id,
          headline: studentHeadline.trim(),
          bio: studentCollege ? `Student at ${studentCollege.trim()}` : '',
          age: Number(studentAge),
          college: studentCollege.trim(),
          skills: skillsArray,
          experienceLevel: 'INTERMEDIATE',
          portfolioLinks: [],
          totalEarnedINR: 0,
          completedProjectsCount: 0,
          averageRating: 5.0,
          verifiedPortfolioSlug: studentName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        });

        if (studentReferralCode.trim()) {
          marketplaceStore.applyReferralCode(newUser.id, studentReferralCode.trim());
        }

        try {
          localStorage.setItem('ptp_session_provider', 'demo');
        } catch {}

        marketplaceStore.setCurrentUserId(newUser.id);
        onSuccess(newUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Student registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = BusinessRegistrationSchema.safeParse({
      name: bizRepName.trim(),
      email: bizEmail.trim(),
      password: bizPassword,
      companyName: bizCompanyName.trim(),
      industry: bizIndustry.trim(),
      city: bizCity.trim(),
      website: bizWebsite !== 'https://' ? bizWebsite.trim() : '',
    });

    if (!validation.success) {
      setErrorMsg(validation.error.issues[0]?.message || 'Please check all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLive) {
        // --- Live Supabase Registration ---
        const authData = await supabaseService.signUpWithEmail(
          bizEmail.trim(),
          bizPassword,
          { name: bizRepName.trim(), role: 'BUSINESS' }
        );

        const newUserId = authData?.user?.id;
        if (!newUserId) {
          throw new Error('Registration failed: no user identifier returned from Supabase.');
        }

        // Check if an authenticated session was returned. If email confirmation is required,
        // GoTrue returns a user object with session: null. Do not attempt authenticated
        // profile updates or active session navigation until the user confirms their email.
        if (!authData?.session) {
          setConfirmationNotice(
            `Registration submitted for ${bizEmail.trim()}. Please check your email inbox and click the verification link before logging in to access the Business Workspace.`
          );
          setIsLoading(false);
          return;
        }

        await supabaseService.updateBusinessProfile(newUserId, {
          companyName: bizCompanyName.trim(),
          industry: bizIndustry.trim(),
          city: bizCity.trim(),
          website: bizWebsite !== 'https://' ? bizWebsite.trim() : '',
        });

        const profile = await supabaseService.getProfile(newUserId);
        const userObj: User = profile || {
          id: newUserId,
          name: bizRepName.trim(),
          email: bizEmail.trim(),
          role: 'BUSINESS',
          city: bizCity.trim(),
          createdAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem('ptp_session_provider', 'supabase');
        } catch {}

        marketplaceStore.setCurrentUserId(userObj.id);
        onSuccess(userObj);
        onClose();
      } else {
        // --- Offline / Demo Sandbox Registration ---
        if (import.meta.env.PROD) {
          throw new Error('Live database backend is not configured for production deployment.');
        }

        const users = marketplaceStore.getUsers();
        const emailExists = users.some((u) => u.email.toLowerCase() === bizEmail.trim().toLowerCase());
        if (emailExists) {
          setErrorMsg('An account with this email address already exists. Please sign in instead.');
          return;
        }

        const newUser: User = {
          id: `business-${Date.now()}`,
          name: bizRepName.trim(),
          email: bizEmail.trim(),
          role: 'BUSINESS', // Guaranteed business role
          city: bizCity.trim(),
          createdAt: new Date().toISOString(),
        };

        marketplaceStore['set']('ptp_users', [newUser, ...users]);

        marketplaceStore.updateBusinessProfile(newUser.id, {
          userId: newUser.id,
          companyName: bizCompanyName.trim(),
          industry: bizIndustry.trim(),
          city: bizCity.trim(),
          website: bizWebsite,
          verificationStatus: 'UNVERIFIED',
          totalSpentINR: 0,
          projectsPostedCount: 0,
        });

        if (bizReferralCode.trim()) {
          marketplaceStore.applyReferralCode(newUser.id, bizReferralCode.trim());
        }

        try {
          localStorage.setItem('ptp_session_provider', 'demo');
        } catch {}

        marketplaceStore.setCurrentUserId(newUser.id);
        onSuccess(newUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Business registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecruiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!recruiterName.trim() || !recruiterEmail.trim() || !recruiterPassword) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (recruiterPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (!recruiterCompany.trim()) {
      setErrorMsg('Please enter your company or agency name.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLive) {
        const authData = await supabaseService.signUpWithEmail(
          recruiterEmail.trim(),
          recruiterPassword,
          { name: recruiterName.trim(), role: 'RECRUITER' }
        );

        if (!authData?.session) {
          setConfirmationNotice(
            `Registration submitted for ${recruiterEmail.trim()}. Please verify your email before logging in to access the Recruiter Portal.`
          );
          setIsLoading(false);
          return;
        }

        const newUserId = authData.user?.id;
        if (!newUserId) throw new Error('Registration failed');

        const profile = await supabaseService.getProfile(newUserId);
        const userObj: User = profile || {
          id: newUserId,
          name: recruiterName.trim(),
          email: recruiterEmail.trim(),
          role: 'RECRUITER',
          createdAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem('ptp_session_provider', 'supabase');
        } catch {}

        marketplaceStore.setCurrentUserId(userObj.id);
        onSuccess(userObj);
        onClose();
      } else {
        if (import.meta.env.PROD) {
          throw new Error('Live database backend is not configured for production deployment.');
        }

        const users = marketplaceStore.getUsers();
        const emailExists = users.some((u) => u.email.toLowerCase() === recruiterEmail.trim().toLowerCase());
        if (emailExists) {
          setErrorMsg('An account with this email address already exists. Please sign in instead.');
          return;
        }

        const newUser: User = {
          id: `recruiter-${Date.now()}`,
          name: recruiterName.trim(),
          email: recruiterEmail.trim(),
          role: 'RECRUITER',
          city: 'Bengaluru',
          createdAt: new Date().toISOString(),
        };

        marketplaceStore['set']('ptp_users', [newUser, ...users]);

        marketplaceStore.updateRecruiterProfile(newUser.id, {
          userId: newUser.id,
          companyName: recruiterCompany.trim(),
          designation: recruiterDesignation.trim(),
          industry: recruiterIndustry.trim(),
          verificationStatus: 'PENDING',
          hiringDomains: recruiterHiringDomains.split(',').map((d) => d.trim()).filter(Boolean),
          totalHiresCount: 0,
          activeCollectionsCount: 0,
          referralCode: `REC-${newUser.id.slice(-4).toUpperCase()}`
        });

        if (recruiterReferralCode.trim()) {
          marketplaceStore.applyReferralCode(newUser.id, recruiterReferralCode.trim());
        }

        try {
          localStorage.setItem('ptp_session_provider', 'demo');
        } catch {}

        marketplaceStore.setCurrentUserId(newUser.id);
        onSuccess(newUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Recruiter registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick One-Click Demo Login (Available only in non-production demo mode)
  const handleQuickDemo = (userId: string) => {
    if (import.meta.env.PROD || isLive) return;
    const users = marketplaceStore.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      try {
        localStorage.setItem('ptp_session_provider', 'demo');
      } catch {}
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 gap-3 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => { setMode('login'); setErrorMsg(null); setConfirmationNotice(null); }}
            className={`pb-1 border-b-2 transition whitespace-nowrap ${
              mode === 'login' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register_student'); setErrorMsg(null); setConfirmationNotice(null); }}
            className={`pb-1 border-b-2 transition whitespace-nowrap ${
              mode === 'register_student' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            Student Creator
          </button>
          <button
            onClick={() => { setMode('register_business'); setErrorMsg(null); setConfirmationNotice(null); }}
            className={`pb-1 border-b-2 transition whitespace-nowrap ${
              mode === 'register_business' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            Business
          </button>
          <button
            onClick={() => { setMode('register_recruiter'); setErrorMsg(null); setConfirmationNotice(null); }}
            className={`pb-1 border-b-2 transition whitespace-nowrap ${
              mode === 'register_recruiter' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            Tech Recruiter
          </button>
        </div>

        {confirmationNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">Verify Your Email Address</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed mb-3">{confirmationNotice}</p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationNotice(null);
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full mb-3 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-medium">or continue with email</span>
          </div>
        </div>

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
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Proof-to-Pay'}</span>
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={studentReferralCode}
                onChange={(e) => setStudentReferralCode(e.target.value)}
                placeholder="e.g. AARAV2026 (unlock ₹500 milestone bonus)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 uppercase font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? 'Creating Creator Account...' : 'Create Creator Account (Age 18+ Verified)'}</span>
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={bizReferralCode}
                onChange={(e) => setBizReferralCode(e.target.value)}
                placeholder="e.g. HYPERFLOW26 (unlock 0% fee credit)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 uppercase font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? 'Registering Business...' : 'Register Business Account'}</span>
            </button>
          </form>
        )}

        {/* 4. Register Recruiter */}
        {mode === 'register_recruiter' && (
          <form onSubmit={handleRecruiterSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  placeholder="e.g. Rhea Sengupta"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Agency *</label>
                <input
                  type="text"
                  value={recruiterCompany}
                  onChange={(e) => setRecruiterCompany(e.target.value)}
                  placeholder="e.g. TalentFoundry Partners"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Email *</label>
              <input
                type="email"
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                placeholder="recruiter@agency.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
              <input
                type="password"
                value={recruiterPassword}
                onChange={(e) => setRecruiterPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  value={recruiterDesignation}
                  onChange={(e) => setRecruiterDesignation(e.target.value)}
                  placeholder="e.g. Lead Talent Partner"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hiring Focus</label>
                <input
                  type="text"
                  value={recruiterHiringDomains}
                  onChange={(e) => setRecruiterHiringDomains(e.target.value)}
                  placeholder="e.g. React, Android, UI/UX"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={recruiterReferralCode}
                onChange={(e) => setRecruiterReferralCode(e.target.value)}
                placeholder="e.g. RHEA-TALENT-2026 (unlock ₹1,500 bonus credit)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 uppercase font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? 'Creating Recruiter Account...' : 'Register as Tech Recruiter'}</span>
            </button>
          </form>
        )}

        {/* Quick Demo Switcher Section (Development / Sandbox Demo Mode Only - Never rendered in Production or Live Supabase) */}
        {!import.meta.env.PROD && !isLive && (
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              ⚡ Quick 1-Click Sandbox Logins (Demo Sandbox Only):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
                <div className="text-[10px] text-blue-600 dark:text-blue-400">Business</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('recruiter-1')}
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-left hover:scale-[1.02] transition"
              >
                <div className="font-bold truncate">Rhea S.</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400">Recruiter</div>
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
        )}
      </div>
    </div>
  );
};
