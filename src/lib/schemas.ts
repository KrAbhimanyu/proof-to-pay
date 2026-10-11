import { z } from 'zod';

export const StudentRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.coerce.number().min(18, 'You must be at least 18 years old to join Proof-to-Pay'),
  city: z.string().min(2, 'City is required'),
  college: z.string().optional(),
  degree: z.string().optional(),
  headline: z.string().min(5, 'Headline must be at least 5 characters'),
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
});

export const BusinessRegistrationSchema = z.object({
  name: z.string().min(2, 'Representative name is required'),
  email: z.string().email('Work email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().min(2, 'Company name is required'),
  industry: z.string().min(2, 'Industry is required'),
  city: z.string().min(2, 'City is required'),
  website: z.string().url('Valid website URL is required').optional().or(z.literal('')),
});

export const BusinessVerificationSchema = z.object({
  legalEntityName: z.string().min(3, 'Registered legal entity name is required'),
  documentType: z.enum(['GSTIN', 'CIN', 'PAN', 'UDYAM_MSME']),
  documentNumber: z.string().min(10, 'Valid government identifier is required')
    .refine((val) => {
      // Basic format checks for Indian identifiers
      if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val)) return true; // GSTIN format
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val)) return true; // PAN format
      if (/^[LUu][0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$/.test(val)) return true; // CIN format
      if (/^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/.test(val)) return true; // MSME format
      return val.length >= 10;
    }, 'Please enter a valid format for the selected document type'),
});

export const ProjectListingSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title is too long'),
  summary: z.string().min(20, 'Brief summary must be at least 20 characters').max(200),
  description: z.string().min(50, 'Provide a thorough project description (at least 50 chars)'),
  category: z.string().min(1, 'Category is required'),
  requiredSkills: z.array(z.string()).min(1, 'List at least one skill'),
  budgetINR: z.coerce.number().min(1000, 'Minimum project budget is ₹1,000 INR').max(1000000, 'Budget exceeds standard threshold'),
  deadlineDays: z.coerce.number().min(2, 'Minimum duration is 2 days').max(90, 'Maximum duration is 90 days'),
  permittedRevisions: z.coerce.number().min(1, 'Provide at least 1 revision cycle').max(5, 'Maximum permitted revisions is 5 to protect creator time'),
  deliverables: z.array(z.object({
    id: z.string(),
    title: z.string().min(3, 'Deliverable title required'),
    description: z.string().min(5, 'Deliverable description required'),
    format: z.string().min(2, 'File/deliverable format required'),
  })).min(1, 'Specify at least 1 concrete deliverable'),
  acceptanceCriteria: z.array(z.string()).min(1, 'Provide at least 1 objective acceptance criteria'),
  paymentTerms: z.string().min(10, 'Specify clear payment terms (e.g. 100% on approved delivery within 48h)'),
});

export const ApplicationSubmissionSchema = z.object({
  pitchMessage: z.string().min(30, 'Application pitch must be at least 30 characters explaining your approach'),
  proposedDeliveryDays: z.coerce.number().min(1, 'Proposed days must be at least 1'),
  portfolioSamples: z.array(z.object({
    title: z.string().min(2, 'Sample title required'),
    url: z.string().url('Must be a valid URL'),
  })).min(1, 'Include at least one verifiable portfolio sample or case link'),
});

export const ProjectOfferSchema = z.object({
  agreedBudgetINR: z.coerce.number().min(1000, 'Budget must be at least ₹1,000'),
  agreedDeadline: z.string().min(1, 'Deadline date is required'),
  agreedRevisions: z.coerce.number().min(1).max(5),
  scopeSummary: z.string().min(20, 'Explicitly summarize scope and acceptance criteria in the binding offer'),
  cancellationTerms: z.string().min(15, 'Specify mutual cancellation and pro-rata deliverable terms').optional(),
});

export const ScopeChangeRequestSchema = z.object({
  reason: z.string().min(15, 'Provide a clear rationale for the proposed scope change (at least 15 characters)'),
  proposedBudgetINR: z.coerce.number().min(1000, 'Budget must be at least ₹1,000'),
  proposedDeadline: z.string().min(1, 'Valid proposed deadline date is required'),
  proposedRevisions: z.coerce.number().min(1).max(5),
  proposedScopeSummary: z.string().min(15, 'Updated scope summary is required'),
});

export const ProofPassportVisibilitySchema = z.object({
  isPublic: z.boolean(),
  sanitizedSummary: z.string().min(10, 'Sanitized summary must be at least 10 characters').optional(),
});

export const WorkSubmissionSchema = z.object({
  notes: z.string().min(10, 'Provide delivery summary and instructions for client review'),
  liveLink: z.string().url('Provide live demo / Figma / repository / cloud link').optional().or(z.literal('')),
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
    sizeMb: z.number().max(50, 'Max file size is 50MB per file'),
    type: z.string(),
  })).min(1, 'Attach at least one deliverable file or asset link'),
});

export const RevisionRequestSchema = z.object({
  feedback: z.string().min(20, 'Revision feedback must be specific and strictly within agreed project scope'),
});

export const RecordPaymentSchema = z.object({
  transactionReferenceUTR: z.string().min(6, 'Bank UTR or UPI Reference Number is required for payment audit'),
  paymentMethod: z.enum(['UPI', 'NEFT_IMPS', 'BANK_TRANSFER']),
  notes: z.string().optional(),
});

export const ReviewSubmissionSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(15, 'Review comment must be at least 15 characters'),
  verifiedDeliverableSummary: z.string().min(5, 'Briefly summarize what was built/delivered'),
});

export const DisputeSubmissionSchema = z.object({
  reason: z.string().min(10, 'State reason for dispute'),
  evidenceNotes: z.string().min(30, 'Detail specific violation of agreed scope or deliverables'),
});
