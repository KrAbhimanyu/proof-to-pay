import React, { useState, useMemo } from 'react';
import { ProjectListing } from '../../types';
import {
  Search,
  Filter,
  Calendar,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

interface Props {
  projects: ProjectListing[];
  onSelectProject: (projectId: string) => void;
}

export const BrowseProjects: React.FC<Props> = ({ projects, onSelectProject }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSkill, setSelectedSkill] = useState('ALL');
  const [budgetTier, setBudgetTier] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'BUDGET_HIGH' | 'DEADLINE_URGENT'>('NEWEST');

  // Categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(projects.map((p) => p.category)));
    return ['ALL', ...list];
  }, [projects]);

  // Skills
  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    projects.forEach((p) => p.requiredSkills.forEach((s) => skillsSet.add(s)));
    return ['ALL', ...Array.from(skillsSet)];
  }, [projects]);

  // Filtered & sorted projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Only show approved or active projects to students
        if (p.status !== 'APPROVED' && p.status !== 'IN_PROGRESS') return false;

        // Search text
        if (search) {
          const q = search.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCompany = p.businessName.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCompany) return false;
        }

        // Category
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

        // Skill
        if (selectedSkill !== 'ALL' && !p.requiredSkills.includes(selectedSkill)) return false;

        // Budget Tier
        if (budgetTier === 'UNDER_10K' && p.budgetINR >= 10000) return false;
        if (budgetTier === '10K_TO_20K' && (p.budgetINR < 10000 || p.budgetINR > 20000)) return false;
        if (budgetTier === 'ABOVE_20K' && p.budgetINR <= 20000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'BUDGET_HIGH') return b.budgetINR - a.budgetINR;
        if (sortBy === 'DEADLINE_URGENT') return a.deadlineDays - b.deadlineDays;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [projects, search, selectedCategory, selectedSkill, budgetTier, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Find Legitimate Paid Projects
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Every listing is moderated, has a defined INR budget, and includes verified business credentials.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keywords, technologies, skills, or business name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Category Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Skill Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {allSkills.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All Skills' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Budget Range
            </label>
            <select
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Any Budget</option>
              <option value="UNDER_10K">Under ₹10,000</option>
              <option value="10K_TO_20K">₹10,000 - ₹20,000</option>
              <option value="ABOVE_20K">₹20,000+</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="NEWEST">Recently Added</option>
              <option value="BUDGET_HIGH">Highest Budget</option>
              <option value="DEADLINE_URGENT">Shortest Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredProjects.length} available project{filteredProjects.length === 1 ? '' : 's'}</span>
          {(search || selectedCategory !== 'ALL' || selectedSkill !== 'ALL' || budgetTier !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setSelectedSkill('ALL');
                setBudgetTier('ALL');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">No projects found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No active listings match your current filters. Try resetting search parameters or selecting "All Categories".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                {project.coverImage && (
                  <div className="h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
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
                    {/* Metadata line without pills as per frontend-design */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{project.businessName}</span>
                      <span>·</span>
                      <span>{project.businessCity}</span>
                      {project.businessVerified && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition line-clamp-2">
                      {project.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                      {project.summary}
                    </p>

                    {/* Deliverables summary */}
                    <div className="mt-3 text-xs text-slate-500 space-y-1">
                      <div className="font-medium text-slate-700 dark:text-slate-300">Deliverables:</div>
                      <div className="text-[11px] text-slate-500">
                        {project.deliverables.map((d) => d.title).join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1">
                    {project.requiredSkills.map((sk) => (
                      <span key={sk} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {sk}
                      </span>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Agreed Budget</span>
                      <div className="font-black text-sm text-slate-900 dark:text-white">
                        ₹{project.budgetINR.toLocaleString('en-IN')} INR
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Duration</span>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        <span>{project.deadlineDays} Days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
