import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Coins,
  Building2,
  ShieldCheck,
  Globe,
  ArrowRight,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  Rocket,
} from 'lucide-react';
import {
  marketIntelligenceService,
  MarketTrendsResponse,
  MarketTrendTopic,
  GroundingSource,
} from '../../lib/marketIntelligenceService';

interface Props {
  variant?: 'embedded' | 'full';
  onNavigateToProjects?: () => void;
  initialTopic?: MarketTrendTopic;
  initialQuery?: string;
  title?: string;
  description?: string;
  badgeLabel?: string;
  hideCategorySwitcher?: boolean;
}

export const MarketTrendsExplorer: React.FC<Props> = ({
  variant = 'full',
  onNavigateToProjects,
  initialTopic = 'opportunities',
  initialQuery = '',
  title = 'Market Trends & Emerging Opportunities',
  description = 'Real-time market insights grounded in live Google Search results to fetch the latest industry news, emerging project opportunities, and fair pay benchmarks across India.',
  badgeLabel = 'Google Search Grounding · Live Industry Intelligence',
  hideCategorySwitcher = false,
}) => {
  const [activeTopic, setActiveTopic] = useState<MarketTrendTopic>(initialTopic);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState<string>(initialQuery);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<MarketTrendsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async (topic: MarketTrendTopic, customQ?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await marketIntelligenceService.fetchMarketTrends(topic, customQ);
      setData(result);
    } catch (_err: any) {
      setError('Failed to fetch grounded intelligence. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setSearchQuery(initialQuery.trim());
      setSubmittedQuery(initialQuery.trim());
      fetchTrends('custom', initialQuery.trim());
    } else {
      setActiveTopic(initialTopic);
      fetchTrends(initialTopic);
    }
  }, [initialTopic, initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSubmittedQuery(searchQuery.trim());
    fetchTrends('custom', searchQuery.trim());
  };

  const handleTopicClick = (topic: MarketTrendTopic) => {
    setActiveTopic(topic);
    setSearchQuery('');
    setSubmittedQuery('');
    fetchTrends(topic);
  };

  const presetTopics = [
    {
      id: 'opportunities' as MarketTrendTopic,
      label: 'Emerging Opportunities',
      icon: Rocket,
      desc: 'High-growth creator niches & startup gigs',
    },
    {
      id: 'skills' as MarketTrendTopic,
      label: 'Trending Skills',
      icon: TrendingUp,
      desc: 'Top in-demand tech & creator skills',
    },
    {
      id: 'rates' as MarketTrendTopic,
      label: 'Fair Pay & Scopes (₹)',
      icon: Coins,
      desc: 'Live INR rate benchmarks for deliverables',
    },
    {
      id: 'startups' as MarketTrendTopic,
      label: 'Startup Hiring',
      icon: Building2,
      desc: 'What Indian startups are hiring for',
    },
  ];

  const suggestedQueries = [
    'Emerging project opportunities for student developers 2026',
    'What do Indian startups pay for React MVPs?',
    'Top video editing scopes for D2C brands',
    'How college creators avoid unpaid spec work',
    'Fair INR freelance rates for Figma design 2026',
  ];

  // Helper to render formatted text with headers, lists, and bold text
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // H3 headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-base sm:text-lg font-bold text-slate-900 dark:text-white pt-2 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded bg-indigo-600 inline-block" />
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          // H2 headers
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white pt-3 border-b border-slate-100 dark:border-slate-800 pb-1">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          // Bullet items
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bulletText = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <div>{parseBoldMarkdown(bulletText)}</div>
              </div>
            );
          }

          // Numbered items
          if (/^\d+\.\s/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+\.)\s(.*)/);
            if (numMatch) {
              return (
                <div key={idx} className="flex items-start gap-2.5 pl-1 pt-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 shrink-0 mt-0.5">
                    {numMatch[1]}
                  </span>
                  <div>{parseBoldMarkdown(numMatch[2])}</div>
                </div>
              );
            }
          }

          return <p key={idx}>{parseBoldMarkdown(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Helper to parse **bold** inside markdown lines
  const parseBoldMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden ${variant === 'full' ? 'p-6 sm:p-8' : 'p-5 sm:p-6'}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>{badgeLabel}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {description}
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {data?.isLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Grounded</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Verified Benchmarks</span>
            </span>
          )}

          <button
            onClick={() => fetchTrends(activeTopic, submittedQuery || undefined)}
            disabled={isLoading}
            title="Refresh live intelligence"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Preset Category Switcher */}
      {!hideCategorySwitcher && (
        <div className="pt-6 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presetTopics.map((topic) => {
            const Icon = topic.icon;
            const isSelected = activeTopic === topic.id && !submittedQuery;
            return (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-bold text-sm ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {topic.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {topic.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Custom Search Input */}
      <form onSubmit={handleSearchSubmit} className="pt-2 pb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ask anything (e.g. 'What are Indian startups paying for full-stack MVPs in 2026?')"
            className="w-full pl-11 pr-24 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="absolute right-2 top-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>Ask</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick query pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2.5">
          <span className="text-[11px] text-slate-400 font-medium">Try:</span>
          {suggestedQueries.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSearchQuery(q);
                setSubmittedQuery(q);
                fetchTrends('custom', q);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 transition"
            >
              {q}
            </button>
          ))}
        </div>
      </form>

      {/* Intelligence Results Area */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>Grounding live search with Gemini 3.8 Flash...</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synthesizing real-time Indian tech and creator market data
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Notice banner if fallback */}
            {data.notice && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{data.notice}</span>
              </div>
            )}

            {/* Formatted Content */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80">
              {renderFormattedContent(data.text)}
            </div>

            {/* Verified Grounding Sources (from Search Grounding Chunks) */}
            {data.sources && data.sources.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Grounding Sources & Citations ({data.sources.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {data.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 text-left transition group shadow-2xs flex flex-col justify-between"
                    >
                      <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {source.title}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-2 mt-auto">
                        <span className="truncate max-w-[180px]">
                          {new URL(source.url.startsWith('http') ? source.url : `https://${source.url}`).hostname}
                        </span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0 ml-1 text-slate-400" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Web Search Queries Used */}
            {data.searchQueries && data.searchQueries.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-400">
                <span className="font-medium">Google Search queries used:</span>
                {data.searchQueries.map((sq, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                    "{sq}"
                  </span>
                ))}
              </div>
            )}

            {/* Next Steps / CTA */}
            {onNavigateToProjects && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-emerald-50 dark:from-indigo-950/30 dark:to-emerald-950/30 border border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    Ready to monetize these in-demand skills?
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    Apply to locked-scope projects on Proof-to-Pay and earn full milestone pay in INR.
                  </div>
                </div>
                <button
                  onClick={onNavigateToProjects}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
                >
                  <span>Browse Projects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
