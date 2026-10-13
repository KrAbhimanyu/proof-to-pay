import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, bigint } from 'drizzle-orm/pg-core';

// Primary users table linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull().default(''),
  role: text('role').notNull().default('STUDENT'), // STUDENT | BUSINESS | ADMIN
  avatarUrl: text('avatar_url'),
  city: text('city').default(''),
  state: text('state').default(''),
  isSuspended: boolean('is_suspended').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Student profiles table
export const studentProfiles = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  userUid: text('user_uid').notNull(),
  headline: text('headline').default(''),
  bio: text('bio').default(''),
  college: text('college').default(''),
  degree: text('degree').default(''),
  skills: text('skills').default(''), // Comma-delimited list of skills
  portfolioLinks: text('portfolio_links').default('[]'), // JSON string
  totalEarnedPaise: bigint('total_earned_paise', { mode: 'number' }).notNull().default(0),
  completedProjectsCount: integer('completed_projects_count').notNull().default(0),
  verifiedPortfolioSlug: text('verified_portfolio_slug').unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Business profiles table
export const businessProfiles = pgTable('business_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  userUid: text('user_uid').notNull(),
  companyName: text('company_name').notNull(),
  industry: text('industry').notNull().default('Technology'),
  website: text('website').default(''),
  verificationStatus: text('verification_status').notNull().default('UNVERIFIED'),
  totalSpentPaise: bigint('total_spent_paise', { mode: 'number' }).notNull().default(0),
  projectsPostedCount: integer('projects_posted_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Projects table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  businessId: integer('business_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  businessUid: text('business_uid').notNull(),
  businessName: text('business_name').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  description: text('description').notNull(),
  category: text('category').notNull(),
  requiredSkills: text('required_skills').notNull().default(''),
  budgetPaise: bigint('budget_paise', { mode: 'number' }).notNull(),
  deadlineDays: integer('deadline_days').notNull().default(14),
  status: text('status').notNull().default('APPROVED'), // DRAFT | PENDING_REVIEW | APPROVED | IN_PROGRESS | SUBMITTED | COMPLETED | DISPUTED
  selectedStudentId: integer('selected_student_id').references(() => users.id, { onDelete: 'set null' }),
  selectedStudentUid: text('selected_student_uid'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Applications table
export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  studentUid: text('student_uid').notNull(),
  studentName: text('student_name').notNull(),
  coverLetter: text('cover_letter').notNull(),
  proposedBudgetPaise: bigint('proposed_budget_paise', { mode: 'number' }).notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING | SHORTLISTED | OFFER_EXTENDED | ACCEPTED | REJECTED
  createdAt: timestamp('created_at').defaultNow(),
});

// Project offers table
export const offers = pgTable('offers', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  businessId: integer('business_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  agreedBudgetPaise: bigint('agreed_budget_paise', { mode: 'number' }).notNull(),
  status: text('status').notNull().default('PENDING'), // PENDING | ACCEPTED | DECLINED
  createdAt: timestamp('created_at').defaultNow(),
});

// Submissions table
export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  notes: text('notes').notNull().default(''),
  deliverableLinks: text('deliverable_links').notNull().default('[]'), // JSON string
  status: text('status').notNull().default('SUBMITTED'), // SUBMITTED | REVISION_REQUESTED | APPROVED
  createdAt: timestamp('created_at').defaultNow(),
});

// Verified reviews table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  businessId: integer('business_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(),
  feedback: text('feedback').notNull(),
  skillsDemonstrated: text('skills_demonstrated').default(''),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations definitions
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  businessProfile: one(businessProfiles, {
    fields: [users.id],
    references: [businessProfiles.userId],
  }),
  projects: many(projects),
  applications: many(applications),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  business: one(users, {
    fields: [projects.businessId],
    references: [users.id],
  }),
  selectedStudent: one(users, {
    fields: [projects.selectedStudentId],
    references: [users.id],
  }),
  applications: many(applications),
  submissions: many(submissions),
  reviews: many(reviews),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  project: one(projects, {
    fields: [applications.projectId],
    references: [projects.id],
  }),
  student: one(users, {
    fields: [applications.studentId],
    references: [users.id],
  }),
}));
