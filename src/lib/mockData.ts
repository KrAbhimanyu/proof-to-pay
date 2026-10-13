import {
  User,
  StudentProfile,
  BusinessProfile,
  ProjectListing,
  Application,
  ProjectOffer,
  ProjectSubmission,
  PaymentRecord,
  VerifiedReview,
  DisputeRecord,
  AuditLog,
  PlatformCommissionRecord,
  PlatformMonetizationConfig,
  ProofPassportItem,
  ScopeChangeRequest
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'student-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@dtu.ac.in',
    role: 'STUDENT',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80',
    city: 'New Delhi',
    state: 'Delhi',
    createdAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'student-2',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@nid.edu',
    role: 'STUDENT',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    city: 'Ahmedabad',
    state: 'Gujarat',
    createdAt: '2026-08-20T11:30:00.000Z',
  },
  {
    id: 'business-1',
    name: 'Siddharth Menon',
    email: 'siddharth@hyperflow.ai',
    role: 'BUSINESS',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
    city: 'Bengaluru',
    state: 'Karnataka',
    createdAt: '2026-07-01T09:00:00.000Z',
  },
  {
    id: 'business-2',
    name: 'Kavita Singhania',
    email: 'kavita@kavitabotanicals.in',
    role: 'BUSINESS',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
    city: 'Mumbai',
    state: 'Maharashtra',
    createdAt: '2026-07-15T14:00:00.000Z',
  },
  {
    id: 'admin-1',
    name: 'Vikramaditya Roy',
    email: 'admin@prooftopay.in',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
    city: 'Bengaluru',
    state: 'Karnataka',
    createdAt: '2026-06-01T08:00:00.000Z',
  }
];

export const INITIAL_STUDENT_PROFILES: Record<string, StudentProfile> = {
  'student-1': {
    userId: 'student-1',
    headline: 'Full-Stack React & Node Engineer · Building high-performance web products',
    bio: 'Third-year CS student at Delhi Technological University (DTU). Passionate about TypeScript, modern web architectures, and micro-interactions. Committed to clean code and delivering verified milestones ahead of schedule.',
    age: 20,
    college: 'Delhi Technological University (DTU)',
    degree: 'B.Tech Computer Science & Engineering',
    graduationYear: 2027,
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Next.js'],
    experienceLevel: 'INTERMEDIATE',
    portfolioLinks: [
      { title: 'DevFlow Dashboard Repo', url: 'https://github.com/aarav-sharma/devflow', description: 'Next.js App Router full-stack telemetry app' },
      { title: 'Live Portfolio Site', url: 'https://aaravsharma.dev', description: 'Interactive personal showcase' }
    ],
    upiId: 'aarav.sharma@okhdfcbank',
    totalEarnedINR: 43000,
    completedProjectsCount: 3,
    averageRating: 5.0,
    verifiedPortfolioSlug: 'aarav-sharma',
    pinnedBadgeIds: ['early-adopter', 'top-rated', 'project-completed'],
    availability: 'AVAILABLE',
    coverImageUrl: '/src/assets/images/hero_student_creator_1791569699063.jpg',
    socialLinks: [
      { platform: 'github', url: 'https://github.com/aarav-sharma' },
      { platform: 'linkedin', url: 'https://linkedin.com/in/aarav-sharma-dev' },
      { platform: 'behance', url: 'https://behance.net/aaravsharma' }
    ]
  },
  'student-2': {
    userId: 'student-2',
    headline: 'Product & Visual Designer · Turning complex workflows into intuitive screens',
    bio: 'Product Design student at National Institute of Design (NID). Specialized in Figma component libraries, responsive mobile patterns, and Gen-Z aesthetic identity systems for modern Indian brands.',
    age: 21,
    college: 'National Institute of Design (NID Ahmedabad)',
    degree: 'B.Des Communication & Interaction Design',
    graduationYear: 2026,
    skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Mobile App UI', 'Brand Identity', 'Prototyping'],
    experienceLevel: 'ADVANCED',
    portfolioLinks: [
      { title: 'Dribbble Profile', url: 'https://dribbble.com/ananyaiyer', description: 'Selected mobile UI case studies' },
      { title: 'Behance Case Study', url: 'https://behance.net/ananyaiyer/fintech', description: 'Complete Indian micro-investing user flow' }
    ],
    upiId: 'ananya.iyer@okaxis',
    totalEarnedINR: 52000,
    completedProjectsCount: 4,
    averageRating: 4.9,
    verifiedPortfolioSlug: 'ananya-iyer',
    pinnedBadgeIds: ['early-adopter', 'top-rated', 'project-completed', 'direct-payout'],
    availability: 'AVAILABLE',
    coverImageUrl: '/src/assets/images/showcase_brand_design_1791569720240.jpg',
    socialLinks: [
      { platform: 'behance', url: 'https://behance.net/ananyaiyer' },
      { platform: 'linkedin', url: 'https://linkedin.com/in/ananyaiyer' },
      { platform: 'github', url: 'https://github.com/ananyaiyer' }
    ]
  }
};

export const INITIAL_BUSINESS_PROFILES: Record<string, BusinessProfile> = {
  'business-1': {
    userId: 'business-1',
    companyName: 'HyperFlow Labs',
    tagline: 'Developer infrastructure & AI automation tools for modern teams',
    website: 'https://hyperflow.ai',
    industry: 'Enterprise Software & DevTools',
    city: 'Bengaluru',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      legalEntityName: 'Hyperflow Technologies Private Limited',
      documentType: 'GSTIN',
      documentNumber: '29AABCH9182K1Z9',
      submittedAt: '2026-07-02T10:00:00.000Z',
      verifiedAt: '2026-07-03T14:30:00.000Z',
      adminNotes: 'Government portal verified against MCA records and active GSTIN filings.',
    },
    totalSpentINR: 78000,
    projectsPostedCount: 4,
  },
  'business-2': {
    userId: 'business-2',
    companyName: 'Kavita Botanicals',
    tagline: 'Modern organic Ayurvedic formulations and ceremonial teas',
    website: 'https://kavitabotanicals.in',
    industry: 'Consumer Goods & D2C',
    city: 'Mumbai',
    verificationStatus: 'VERIFIED',
    verificationDetails: {
      legalEntityName: 'Kavita Organics & Botanicals LLP',
      documentType: 'CIN',
      documentNumber: 'U24233MH2021PTC367891',
      submittedAt: '2026-07-16T12:00:00.000Z',
      verifiedAt: '2026-07-17T09:15:00.000Z',
      adminNotes: 'Verified LLP identity and active Indian trademark documents.',
    },
    totalSpentINR: 65000,
    projectsPostedCount: 3,
  }
};

export const INITIAL_PROJECTS: ProjectListing[] = [
  {
    id: 'proj-1',
    businessId: 'business-2',
    businessName: 'Kavita Botanicals',
    businessCity: 'Mumbai',
    businessVerified: true,
    title: 'Mobile Micro-Savings App UI Prototype (Figma)',
    summary: 'Design a high-fidelity 12-screen mobile interface for our upcoming botanical subscription & recurring wallet.',
    description: 'We are launching an Indian wellness micro-savings program where customers earn wellness points and invest in recurring herbal bundles. We need an emerging UI designer who understands mobile-first touch ergonomics, clean Indian payment cues (UPI icons, rupee figures), and high-contrast accessibility. The student will receive full brand guidelines and wireframe sketches.',
    category: 'UI/UX & Product Design',
    requiredSkills: ['Figma', 'UI/UX Design', 'Design Systems', 'Mobile App UI'],
    deliverables: [
      { id: 'del-1', title: 'Design System & Component Library', description: 'Color styles, typography scale, buttons, input fields in Figma', format: 'Figma Component Library' },
      { id: 'del-2', title: '12 Core Mobile Application Screens', description: 'Onboarding, savings plan setup, UPI auto-pay auth screen, and wallet history', format: 'Figma Auto-Layout Frames (390px)' },
      { id: 'del-3', title: 'Interactive Prototype', description: 'Clickable prototype demonstrating subscription checkout flow', format: 'Figma Prototype Link' }
    ],
    acceptanceCriteria: [
      'All frames built strictly in Auto-Layout with scalable mobile constraints (390px baseline)',
      'Design follows WCAG AA contrast standards for all text elements',
      'Includes empty states, error validation states, and completed transaction screen',
      'Organized naming conventions and zero detached library components'
    ],
    budgetINR: 18000,
    deadlineDays: 10,
    expectedDeliveryDate: '2026-10-25',
    permittedRevisions: 2,
    applicationClosingDate: '2026-10-18',
    paymentTerms: '100% (₹18,000 INR) paid via direct bank transfer / UPI within 24 hours of client acceptance of final Figma files.',
    status: 'APPROVED',
    coverImage: '/src/assets/images/showcase_mobile_ui_1791569710272.jpg',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-02T12:00:00.000Z',
  },
  {
    id: 'proj-2',
    businessId: 'business-2',
    businessName: 'Kavita Botanicals',
    businessCity: 'Mumbai',
    businessVerified: true,
    title: 'Artisanal Herbal Tea Brand Identity & Packaging Suite',
    summary: 'Create premium visual identity, logo variations, and 4 retail pouch packaging labels for export chai collection.',
    description: 'We are introducing a high-altitude artisanal tea collection for youth and wellness enthusiasts. We are looking for an emerging graphic designer or communication design student to build the packaging identity. We love modern Indian heritage motifs paired with clean editorial typography.',
    category: 'Brand Identity & Packaging',
    requiredSkills: ['Brand Identity', 'Packaging Design', 'Illustrator', 'Typography'],
    deliverables: [
      { id: 'del-p1', title: 'Primary Brandmark & Secondary Badges', description: 'Scalable vector logos in dark, light, and monochrome variants', format: 'AI / SVG / PNG Package' },
      { id: 'del-p2', title: '4 Ready-to-Print Pouch Die-Line Artwork', description: 'Front & back packaging artwork with nutrition box and barcode zones', format: 'Print-Ready PDF with 3mm Bleed' },
      { id: 'del-p3', title: '12-Page Brand Style Guide', description: 'Usage rules, typography specimen, Pantone color formulas', format: 'PDF Guide' }
    ],
    acceptanceCriteria: [
      'Vector artwork in CMYK with all fonts converted to outlines',
      'Packaging labels verified against standard FSSAI label dimension guidelines',
      'Realistic 3D mockup renders included for investor deck showcase'
    ],
    budgetINR: 25000,
    deadlineDays: 14,
    expectedDeliveryDate: '2026-10-28',
    permittedRevisions: 3,
    applicationClosingDate: '2026-10-15',
    paymentTerms: 'Fixed ₹25,000 INR upon delivery and pre-print sign-off. Audited UTR recorded on platform.',
    status: 'IN_PROGRESS',
    selectedStudentId: 'student-2',
    selectedStudentName: 'Ananya Iyer',
    activeOfferId: 'offer-proj-2',
    coverImage: '/src/assets/images/showcase_brand_design_1791569720240.jpg',
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-24T15:00:00.000Z',
  },
  {
    id: 'proj-3',
    businessId: 'business-1',
    businessName: 'HyperFlow Labs',
    businessCity: 'Bengaluru',
    businessVerified: true,
    title: 'Next.js + Tailwind Marketing Landing Page & Component Library',
    summary: 'Develop a responsive, ultra-fast landing page with interactive syntax highlighter and pricing calculator.',
    description: 'We need an ambitious frontend student to turn our Figma designs into production-ready Next.js App Router code using TypeScript and Tailwind CSS. The page needs to achieve 95+ performance on Google Lighthouse, have smooth scroll tabs, and clean accessible semantic markup.',
    category: 'Web & Mobile Development',
    requiredSkills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    deliverables: [
      { id: 'del-c1', title: 'Complete Next.js Codebase', description: 'Clean git repository with modular components', format: 'GitHub Pull Request' },
      { id: 'del-c2', title: 'Pricing & Currency Calculator Widget', description: 'Interactive toggle between Monthly/Annual and INR/USD conversion', format: 'TypeScript Component' },
      { id: 'del-c3', title: 'Vercel Preview Deployment', description: 'Live preview link passing all ESLint and build checks', format: 'Vercel Live URL' }
    ],
    acceptanceCriteria: [
      'TypeScript compilation with zero type errors and strict mode enabled',
      'Lighthouse Performance score >= 90 on mobile viewport',
      'Full responsiveness across 375px mobile, 768px tablet, and 1440px desktop'
    ],
    budgetINR: 15000,
    deadlineDays: 7,
    expectedDeliveryDate: '2026-09-18',
    permittedRevisions: 2,
    applicationClosingDate: '2026-09-08',
    paymentTerms: '100% (₹15,000 INR) paid immediately upon GitHub PR merge and verified Lighthouse benchmark.',
    status: 'COMPLETED',
    selectedStudentId: 'student-1',
    selectedStudentName: 'Aarav Sharma',
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-16T18:00:00.000Z',
  },
  {
    id: 'proj-4',
    businessId: 'business-1',
    businessName: 'HyperFlow Labs',
    businessCity: 'Bengaluru',
    businessVerified: true,
    title: 'Technical Explainer Motion Graphics Reel (45s Video)',
    summary: 'Create a dynamic 45-second motion graphics reel explaining how our API caches distributed queries.',
    description: 'Looking for a student animator or motion designer skilled in After Effects or Motion. We provide the voiceover WAV file and script. You create smooth kinetic typography, isometric server icons, and energetic transitions for Twitter/LinkedIn.',
    category: 'Video Editing & Motion Graphics',
    requiredSkills: ['Motion Graphics', 'After Effects', 'Kinetic Typography', 'Video Editing'],
    deliverables: [
      { id: 'del-v1', title: 'Master 4K 60fps MP4 Reel', description: '45-second master export formatted for 16:9 widescreen and 9:16 vertical crop', format: 'MP4 ProRes / H.264' },
      { id: 'del-v2', title: 'Source Project Files', description: 'After Effects .aep project file with neatly organized composition folders', format: 'ZIP Archive' }
    ],
    acceptanceCriteria: [
      'Accurate timing synced with provided voiceover track',
      'Custom animations without stock template watermarks',
      'Rendered in high-bitrate color accurate output'
    ],
    budgetINR: 12000,
    deadlineDays: 6,
    expectedDeliveryDate: '2026-10-22',
    permittedRevisions: 2,
    applicationClosingDate: '2026-10-16',
    paymentTerms: '₹12,000 INR upon delivery of master MP4 and source archive.',
    status: 'APPROVED',
    createdAt: '2026-10-04T14:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  }
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    projectId: 'proj-1',
    projectTitle: 'Mobile Micro-Savings App UI Prototype (Figma)',
    studentId: 'student-2',
    studentName: 'Ananya Iyer',
    studentSkills: ['Figma', 'UI/UX Design', 'Design Systems'],
    pitchMessage: 'Hi Kavita team! I have designed 4 financial and wellness flows during my 3rd year at NID. I specialize in clean thumb-zone ergonomics for Indian payment apps and have created auto-layout systems tested on multiple screen sizes. I can deliver the 12 screens and clickable prototype within 7 days.',
    portfolioSamples: [
      { title: 'Fintech Mobile Flow Case Study', url: 'https://behance.net/ananyaiyer/fintech' },
      { title: 'Design System Playground', url: 'https://figma.com/@ananyaiyer' }
    ],
    proposedDeliveryDays: 7,
    status: 'SHORTLISTED',
    createdAt: '2026-10-02T15:00:00.000Z',
  },
  {
    id: 'app-2',
    projectId: 'proj-1',
    projectTitle: 'Mobile Micro-Savings App UI Prototype (Figma)',
    studentId: 'student-1',
    studentName: 'Aarav Sharma',
    studentSkills: ['React', 'TypeScript', 'Figma'],
    pitchMessage: 'Hello! While my core is frontend development, I have strong UI prototyping experience in Figma and love building clean, accessible financial dashboards. Happy to contribute to this!',
    portfolioSamples: [
      { title: 'DevFlow Dashboard UI', url: 'https://aaravsharma.dev' }
    ],
    proposedDeliveryDays: 9,
    status: 'PENDING',
    createdAt: '2026-10-03T11:00:00.000Z',
  },
  {
    id: 'app-3',
    projectId: 'proj-2',
    projectTitle: 'Artisanal Herbal Tea Brand Identity & Packaging Suite',
    studentId: 'student-2',
    studentName: 'Ananya Iyer',
    studentSkills: ['Brand Identity', 'Packaging Design', 'Illustrator'],
    pitchMessage: 'I would be thrilled to work on this tea packaging project. At NID, my major is packaging and visual communication. I have hands-on experience preparing print-ready CMYK dielines for Indian box printers and understand FSSAI compliance.',
    portfolioSamples: [
      { title: 'Artisanal Beverage Packaging Behance', url: 'https://behance.net/ananyaiyer/tea-identity' }
    ],
    proposedDeliveryDays: 12,
    status: 'ACCEPTED',
    createdAt: '2026-09-21T09:30:00.000Z',
  }
];

export const INITIAL_OFFERS: ProjectOffer[] = [
  {
    id: 'offer-proj-2',
    projectId: 'proj-2',
    projectTitle: 'Artisanal Herbal Tea Brand Identity & Packaging Suite',
    businessId: 'business-2',
    businessName: 'Kavita Botanicals',
    studentId: 'student-2',
    studentName: 'Ananya Iyer',
    agreedBudgetINR: 25000,
    agreedDeadline: '2026-10-28',
    agreedRevisions: 3,
    scopeSummary: 'Creation of vector logo assets, 4 pouch packaging dielines, and 12-page style guide as specified in listing. Binding fixed fee of ₹25,000 INR with 3 structured review rounds.',
    status: 'ACCEPTED',
    commissionRatePercent: 5,
    platformFeeINR: 1250,
    creatorReceivesINR: 25000,
    feePayer: 'BUSINESS',
    commissionTermsSnapshot: 'Agreed: ₹25,000 INR. Platform fee: ₹1,250 INR (5%) payable separately by Kavita Botanicals to Proof-to-Pay upon completion. Creator Ananya Iyer receives 100% (₹25,000 INR) directly with ₹0 deductions.',
    cancellationTerms: 'Mutual agreement allows pro-rata release for completed dielines. Unilateral cancellation without breach requires full agreed compensation for accepted milestones.',
    deliverablesSnapshot: [
      { id: 'del-p1', title: 'Vector Brand Identity Suite', description: 'Primary logo, alternate marks, typography scale, CMYK/Pantone color swatch book', format: 'AI / SVG / PDF' },
      { id: 'del-p2', title: 'Print-Ready Pouch Dielines (4 SKUs)', description: 'Print-ready packaging templates formatted with bleed, crop marks, and barcode zones', format: 'Adobe Illustrator Vector' },
      { id: 'del-p3', title: 'Brand Guidelines Style Sheet (12 Pages)', description: 'Minimum clear-space, improper usage, packaging layout hierarchy, and typography rules', format: 'Interactive PDF' }
    ],
    scopeLocked: true,
    lockedAt: '2026-09-24T08:30:00.000Z',
    explicitAcceptedAt: '2026-09-24T08:30:00.000Z',
    explicitAcceptedByStudent: true,
    acceptedChecklist: {
      deliverablesAgreed: true,
      deadlineAgreed: true,
      revisionsAgreed: true,
      cancellationAgreed: true,
      feeTermsAgreed: true,
    },
    createdAt: '2026-09-23T11:00:00.000Z',
    respondedAt: '2026-09-24T08:30:00.000Z',
  },
  {
    id: 'offer-proj-3',
    projectId: 'proj-3',
    projectTitle: 'Next.js + Tailwind Marketing Landing Page & Component Library',
    businessId: 'business-1',
    businessName: 'HyperFlow Labs',
    studentId: 'student-1',
    studentName: 'Aarav Sharma',
    agreedBudgetINR: 15000,
    agreedDeadline: '2026-09-18',
    agreedRevisions: 2,
    scopeSummary: 'Delivery of production Next.js App Router codebase, interactive currency pricing calculator widget, and live Vercel deployment with >= 90 Lighthouse score.',
    status: 'ACCEPTED',
    commissionRatePercent: 5,
    platformFeeINR: 750,
    creatorReceivesINR: 15000,
    feePayer: 'BUSINESS',
    commissionTermsSnapshot: 'Agreed: ₹15,000 INR. Platform fee: ₹750 INR (5%) payable separately by HyperFlow Labs to Proof-to-Pay upon completion. Creator Aarav Sharma receives full ₹15,000 INR with ₹0 deductions.',
    cancellationTerms: 'Standard Beta Terms: 100% payout upon passing automated GitHub PR checks and Lighthouse benchmarks. Zero deduction for platform fee.',
    deliverablesSnapshot: [
      { id: 'del-c1', title: 'Complete Next.js Codebase', description: 'Clean git repository with modular components', format: 'GitHub Pull Request' },
      { id: 'del-c2', title: 'Pricing & Currency Calculator Widget', description: 'Interactive toggle between Monthly/Annual and INR/USD conversion', format: 'TypeScript Component' },
      { id: 'del-c3', title: 'Vercel Preview Deployment', description: 'Live preview link passing all ESLint and build checks', format: 'Vercel Live URL' }
    ],
    scopeLocked: true,
    lockedAt: '2026-09-02T10:00:00.000Z',
    explicitAcceptedAt: '2026-09-02T10:00:00.000Z',
    explicitAcceptedByStudent: true,
    acceptedChecklist: {
      deliverablesAgreed: true,
      deadlineAgreed: true,
      revisionsAgreed: true,
      cancellationAgreed: true,
      feeTermsAgreed: true,
    },
    createdAt: '2026-09-01T15:00:00.000Z',
    respondedAt: '2026-09-02T10:00:00.000Z',
  }
];

export const INITIAL_PROOF_PASSPORT_ITEMS: ProofPassportItem[] = [
  {
    id: 'passport-item-1',
    studentId: 'student-1',
    projectId: 'proj-3',
    projectTitle: 'Next.js + Tailwind Marketing Landing Page & Component Library',
    category: 'Web & Mobile Development',
    completedAt: '2026-09-16T18:00:00.000Z',
    completionSource: 'BUSINESS_APPROVAL',
    businessName: 'HyperFlow Labs',
    businessCity: 'Bengaluru',
    sanitizedSummary: 'Engineered modular Next.js App Router marketing interface with dynamic pricing calculator and verified 98 Lighthouse performance score.',
    rating: 5,
    reviewSnippet: 'Aarav is an extraordinary emerging engineer... clean TypeScript types and delivered two days before the deadline.',
    isPublic: true,
    displayOrder: 1,
    badgeTitle: 'Verified Work Delivery',
    createdAt: '2026-09-16T18:00:00.000Z',
    skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    deliverables: ['Production Next.js Codebase', 'Interactive Pricing & Currency Widget', 'Lighthouse 98 Performance Audit'],
    coverImage: '/src/assets/images/showcase_mobile_ui_1791569710272.jpg',
  },
  {
    id: 'passport-item-2',
    studentId: 'student-1',
    projectId: 'proj-old-demo',
    projectTitle: 'E-Commerce Icon Pack Vector Design Suite',
    category: 'Design & Creative',
    completedAt: '2026-08-10T14:00:00.000Z',
    completionSource: 'DISPUTE_RESOLUTION',
    businessName: 'Acme Ventures',
    businessCity: 'Bengaluru',
    sanitizedSummary: 'Vector icon system consisting of 40 scalable SVG icons verified compliant with original agreed scope specifications.',
    rating: 5,
    reviewSnippet: 'Deliverables verified 100% compliant with agreed project specifications through authorized platform dispute investigation.',
    isPublic: true,
    displayOrder: 2,
    badgeTitle: 'Dispute Confirmed Outcome',
    createdAt: '2026-08-10T14:00:00.000Z',
    skills: ['SVG Vectors', 'Iconography', 'Illustrator', 'Design Systems'],
    deliverables: ['40 Scalable Vector Icons (Dark/Light)', 'Icon Spec Sheet & Usage Rules'],
    coverImage: '/src/assets/images/showcase_brand_design_1791569720240.jpg',
  }
];

export const INITIAL_SCOPE_CHANGE_REQUESTS: ScopeChangeRequest[] = [
  {
    id: 'scr-demo-1',
    projectId: 'proj-2',
    offerId: 'offer-proj-2',
    requestedByUserId: 'business-2',
    requestedByName: 'Kavita Botanicals',
    requestedByRole: 'BUSINESS',
    reason: 'We want to expand the pouch range from 4 to 6 herbal flavors (adding Chamomile Calm and Tulsi Ginger).',
    proposedBudgetINR: 32000,
    proposedDeadline: '2026-11-05',
    proposedRevisions: 3,
    proposedDeliverables: [
      { id: 'del-p1', title: 'Vector Brand Identity Suite', description: 'Primary logo, alternate marks, typography scale, CMYK/Pantone color swatch book', format: 'AI / SVG / PDF' },
      { id: 'del-p2', title: 'Print-Ready Pouch Dielines (6 SKUs Expanded)', description: 'Print-ready packaging templates for 6 complete pouch blends with FSSAI typography compliance', format: 'Adobe Illustrator Vector' },
      { id: 'del-p3', title: 'Brand Guidelines Style Sheet (12 Pages)', description: 'Minimum clear-space, packaging layout hierarchy, and typography rules', format: 'Interactive PDF' }
    ],
    proposedScopeSummary: 'Addition of 2 SKUs (Chamomile Calm & Tulsi Ginger) to packaging suite with budget increase of ₹7,000 INR (total ₹32,000 INR) and 8-day deadline extension.',
    previousTermsSnapshot: {
      budgetINR: 25000,
      deadline: '2026-10-28',
      revisions: 3,
      scopeSummary: 'Creation of vector logo assets, 4 pouch packaging dielines, and 12-page style guide as specified in listing.',
      deliverables: [
        { id: 'del-p1', title: 'Vector Brand Identity Suite', description: 'Primary logo, alternate marks, typography scale, CMYK/Pantone color swatch book', format: 'AI / SVG / PDF' },
        { id: 'del-p2', title: 'Print-Ready Pouch Dielines (4 SKUs)', description: 'Print-ready packaging templates formatted with bleed, crop marks, and barcode zones', format: 'Adobe Illustrator Vector' },
        { id: 'del-p3', title: 'Brand Guidelines Style Sheet (12 Pages)', description: 'Minimum clear-space, improper usage, packaging layout hierarchy, and typography rules', format: 'Interactive PDF' }
      ]
    },
    status: 'PENDING',
    createdAt: '2026-09-28T14:00:00.000Z',
  }
];

export const INITIAL_MONETIZATION_CONFIG: PlatformMonetizationConfig = {
  defaultCommissionRatePercent: 5,
  minProjectBudgetINR: 500,
  paymentWindowDays: 5,
  updatedAt: '2026-09-01T00:00:00.000Z',
  updatedByUserId: 'admin-1',
};

export const INITIAL_PLATFORM_COMMISSIONS: PlatformCommissionRecord[] = [
  {
    id: 'comm-proj-3',
    projectId: 'proj-3',
    projectTitle: 'Next.js + Tailwind Marketing Landing Page & Component Library',
    businessId: 'business-1',
    businessName: 'HyperFlow Labs',
    studentId: 'student-1',
    studentName: 'Aarav Sharma',
    projectBudgetINR: 15000,
    commissionRatePercent: 5,
    platformFeeINR: 750,
    status: 'VERIFIED_COLLECTED',
    dueDate: '2026-09-21',
    paymentMethod: 'UPI',
    reportedUTR: 'COMM-UPI-HDFC-8829104',
    reportedAt: '2026-09-17T12:00:00.000Z',
    reportedNotes: 'Transferred 5% platform fee for Project 3 via HDFC UPI',
    verifiedByUserId: 'admin-1',
    verifiedByName: 'Proof-to-Pay Admin Team',
    verifiedAt: '2026-09-17T14:30:00.000Z',
    evidenceReviewedNotes: 'Verified ₹750 INR credit match in platform current account statement via HDFC NetBanking against UTR COMM-UPI-HDFC-8829104.',
    createdAt: '2026-09-16T18:30:00.000Z',
    updatedAt: '2026-09-17T14:30:00.000Z',
  },
  {
    id: 'comm-proj-2',
    projectId: 'proj-2',
    projectTitle: 'Artisanal Herbal Tea Brand Identity & Packaging Suite',
    businessId: 'business-2',
    businessName: 'Kavita Botanicals',
    studentId: 'student-2',
    studentName: 'Ananya Iyer',
    projectBudgetINR: 25000,
    commissionRatePercent: 5,
    platformFeeINR: 1250,
    status: 'NOT_DUE',
    dueDate: '2026-11-02',
    createdAt: '2026-09-24T08:30:00.000Z',
    updatedAt: '2026-09-24T08:30:00.000Z',
  }
];

export const INITIAL_SUBMISSIONS: ProjectSubmission[] = [
  {
    id: 'sub-proj-2-v1',
    projectId: 'proj-2',
    studentId: 'student-2',
    version: 1,
    notes: 'Uploaded Version 1 of the tea packaging suite! Attached primary logos (SVG/AI), color palettes, and 2 sample pouch dielines for the Cardamom Chai and Kashmiri Saffron blend. Please review the typography balance.',
    liveLink: 'https://figma.com/file/mock-kavita-tea-packaging',
    files: [
      { name: 'Kavita_Tea_Identity_V1.pdf', url: '/src/assets/images/showcase_brand_design_1791569720240.jpg', sizeMb: 8.4, type: 'application/pdf' },
      { name: 'Dieline_CardamomChai_Print.ai', url: '/src/assets/images/showcase_brand_design_1791569720240.jpg', sizeMb: 14.2, type: 'application/illustrator' }
    ],
    submittedAt: '2026-10-06T16:00:00.000Z',
    status: 'PENDING_REVIEW',
  },
  {
    id: 'sub-proj-3-final',
    projectId: 'proj-3',
    studentId: 'student-1',
    version: 2,
    notes: 'Completed all requested adjustments! Merged into main branch, implemented dark-mode toggle, verified 98 mobile Lighthouse score, and fixed tablet layout wrap.',
    liveLink: 'https://github.com/hyperflow-labs/marketing-site/pull/14',
    files: [
      { name: 'Lighthouse_Audit_Report.pdf', url: 'https://hyperflow.ai', sizeMb: 1.2, type: 'application/pdf' }
    ],
    submittedAt: '2026-09-15T12:00:00.000Z',
    status: 'APPROVED',
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-proj-3',
    projectId: 'proj-3',
    projectTitle: 'Next.js + Tailwind Marketing Landing Page & Component Library',
    businessId: 'business-1',
    studentId: 'student-1',
    amountINR: 15000,
    status: 'PAID',
    paymentMethod: 'UPI',
    transactionReferenceUTR: 'UTR-HDFC-992182049182',
    paymentProofUrl: 'https://prooftopay.in/receipts/proof-pay-proj-3.pdf',
    recordedByUserId: 'business-1',
    recordedAt: '2026-09-16T18:30:00.000Z',
    notes: 'Paid ₹15,000 INR directly to student UPI (aarav.sharma@okhdfcbank) following code verification.',
  },
  {
    id: 'pay-proj-2',
    projectId: 'proj-2',
    projectTitle: 'Artisanal Herbal Tea Brand Identity & Packaging Suite',
    businessId: 'business-2',
    studentId: 'student-2',
    amountINR: 25000,
    status: 'NOT_DUE',
    paymentMethod: 'BANK_TRANSFER',
    recordedByUserId: 'business-2',
    notes: 'Payment scheduled upon student submission approval.',
  }
];

export const INITIAL_REVIEWS: VerifiedReview[] = [
  {
    id: 'rev-1',
    projectId: 'proj-3',
    projectTitle: 'Next.js + Tailwind Marketing Landing Page & Component Library',
    reviewerId: 'business-1',
    reviewerName: 'Siddharth Menon (HyperFlow Labs)',
    reviewerRole: 'BUSINESS',
    targetUserId: 'student-1',
    rating: 5,
    comment: 'Aarav is an extraordinary emerging engineer. He did not just write the code—he optimized our bundle size, wrote clean TypeScript types, and delivered two days before the deadline. Will hire again!',
    verifiedDeliverableSummary: 'Production Next.js repository with 98 Lighthouse performance score.',
    createdAt: '2026-09-17T10:00:00.000Z',
  },
  {
    id: 'rev-2',
    projectId: 'proj-3',
    projectTitle: 'Next.js + Tailwind Marketing Landing Page & Component Library',
    reviewerId: 'student-1',
    reviewerName: 'Aarav Sharma',
    reviewerRole: 'STUDENT',
    targetUserId: 'business-1',
    rating: 5,
    comment: 'Siddharth and HyperFlow Labs provided crystal clear specifications and tested the PR promptly. Payment was confirmed within 30 minutes of approval. Ideal client experience!',
    verifiedDeliverableSummary: 'Delivered marketing codebase and dynamic pricing widget.',
    createdAt: '2026-09-17T11:30:00.000Z',
  }
];

export const INITIAL_DISPUTES: DisputeRecord[] = [
  {
    id: 'disp-demo-1',
    projectId: 'proj-old-demo',
    projectTitle: 'E-Commerce Icon Pack Revision Dispute (Resolved Demo)',
    raisedByUserId: 'student-1',
    raisedByName: 'Aarav Sharma',
    raisedByRole: 'STUDENT',
    reason: 'Client requested 7 revisions when agreement specified maximum 2 cycles.',
    evidenceNotes: 'Student delivered 40 requested vector icons strictly matching prompt. Client repeatedly requested new scope additions (3D renders) outside agreed deliverables.',
    status: 'RESOLVED_STUDENT_PAID',
    adminDecision: 'Admin reviewed original deliverables against scope. Ruled that student fulfilled 100% of agreed terms. Client authorized to compensate student full fee ₹6,000 INR.',
    resolvedAt: '2026-08-10T14:00:00.000Z',
    createdAt: '2026-08-08T10:00:00.000Z',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    actorUserId: 'admin-1',
    actorName: 'Vikramaditya Roy',
    actorRole: 'ADMIN',
    action: 'BUSINESS_VERIFIED',
    targetType: 'VERIFICATION',
    targetId: 'business-1',
    details: 'Verified HyperFlow Labs against MCA registration and active GSTIN filings.',
    timestamp: '2026-07-03T14:30:00.000Z',
  },
  {
    id: 'log-2',
    actorUserId: 'admin-1',
    actorName: 'Vikramaditya Roy',
    actorRole: 'ADMIN',
    action: 'PROJECT_APPROVED',
    targetType: 'PROJECT',
    targetId: 'proj-1',
    details: 'Reviewed and approved project "Mobile Micro-Savings App UI Prototype" from Kavita Botanicals.',
    timestamp: '2026-10-02T12:00:00.000Z',
  },
  {
    id: 'log-3',
    actorUserId: 'business-1',
    actorName: 'Siddharth Menon',
    actorRole: 'BUSINESS',
    action: 'PAYMENT_RECORDED',
    targetType: 'PAYMENT',
    targetId: 'pay-proj-3',
    details: 'Recorded payment of ₹15,000 INR with UTR-HDFC-992182049182 for project proj-3.',
    timestamp: '2026-09-16T18:30:00.000Z',
  }
];
