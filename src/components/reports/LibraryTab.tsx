import React, { useMemo, useState } from 'react';
import { Search, Sparkles, Layers, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickReportCard } from './QuickReportCard';
import { ReportCatalogCard } from './ReportCatalogCard';
import { REPORT_TEMPLATES, getRecommendedReportIdsForRole } from '@/data/reportsCatalog';
import type { ReportTemplateMeta, ReportAudience, ReportCategory } from '@/types/reports';
import type { ReportPermissions } from '@/lib/permissions';

export interface LibraryTabProps {
  userRole?: string | null;
  permissions: ReportPermissions;
  onOpenReport: (template: ReportTemplateMeta) => void;
  isLoading?: boolean;
}

const ALL_AUDIENCES: ReportAudience[] = [
  'Operator',
  'Supervisor',
  'Executive',
  'Planner',
  'Administrator',
  'Government reviewer',
];

const CATEGORY_ORDER: ReportCategory[] = [
  'Operations',
  'Cases',
  'Network and devices',
  'Risk and planning',
  'Assets',
  'Review and compliance',
];

export const LibraryTab: React.FC<LibraryTabProps> = ({
  userRole,
  permissions,
  onOpenReport,
  isLoading = false,
}) => {
  void permissions;
  const [search, setSearch] = useState<string>('');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Quick reports (R1, R2, R10)
  const quickReports = useMemo(() => {
    return REPORT_TEMPLATES.filter((t) => t.isQuickReport).sort(
      (a, b) => (a.quickReportRank || 0) - (b.quickReportRank || 0)
    );
  }, []);

  // Recommended reports based on user role
  const recommendedReports = useMemo(() => {
    const recommendedIds = getRecommendedReportIdsForRole(userRole);
    if (!recommendedIds || recommendedIds.length === 0) return [];
    return REPORT_TEMPLATES.filter((t) => recommendedIds.includes(t.id));
  }, [userRole]);

  // Filtered catalog
  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return REPORT_TEMPLATES.filter((template) => {
      // Search filter matches name, purpose, category, or audience
      if (query) {
        const matchesName = template.name.toLowerCase().includes(query);
        const matchesPurpose = template.purpose.toLowerCase().includes(query);
        const matchesCategory = template.category.toLowerCase().includes(query);
        const matchesAudience = template.audience.some((a) => a.toLowerCase().includes(query));
        if (!matchesName && !matchesPurpose && !matchesCategory && !matchesAudience) {
          return false;
        }
      }

      // Audience filter
      if (selectedAudience !== 'all') {
        if (!template.audience.includes(selectedAudience as ReportAudience)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (template.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [search, selectedAudience, selectedCategory]);

  // Grouped filtered catalog by category
  const groupedCatalog = useMemo(() => {
    const groups = new Map<ReportCategory, ReportTemplateMeta[]>();
    for (const cat of CATEGORY_ORDER) {
      groups.set(cat, []);
    }
    for (const item of filteredTemplates) {
      const list = groups.get(item.category) || [];
      list.push(item);
      groups.set(item.category, list);
    }
    return groups;
  }, [filteredTemplates]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted/50 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 bg-muted/40 rounded-xl" />
          <div className="h-44 bg-muted/40 rounded-xl" />
          <div className="h-44 bg-muted/40 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Quick Reports Row */}
      <section aria-labelledby="quick-reports-heading">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 id="quick-reports-heading" className="text-sm font-semibold text-foreground">
              Quick reports
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            One-click runs with standard parameters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickReports.map((template) => {
            let periodLabel = 'Today so far';
            if (template.id === 'R2') periodLabel = 'Last full week';
            if (template.id === 'R10') periodLabel = 'Last full month';

            return (
              <QuickReportCard
                key={template.id}
                template={template}
                periodLabel={periodLabel}
                onOpen={onOpenReport}
              />
            );
          })}
        </div>
      </section>

      {/* 2. Recommended for you (based on user role) */}
      {recommendedReports.length > 0 && (
        <section aria-labelledby="recommended-reports-heading">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                Recommended for your role ({userRole})
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Tailored for operational workflows
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedReports.map((template) => (
              <ReportCatalogCard
                key={`rec-${template.id}`}
                template={template}
                onOpen={onOpenReport}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Search and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search report by name, purpose, or audience..."
            className="w-full h-8 pl-8 pr-4 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Audience filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Audience:</span>
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="h-8 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All audiences</option>
            {ALL_AUDIENCES.map((aud) => (
              <option key={aud} value={aud}>
                {aud}
              </option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All categories</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Full Catalog Grouped by Purpose */}
      {filteredTemplates.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card">
          <AlertCircle className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-semibold text-foreground">No reports found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No report templates matched &ldquo;{search}&rdquo;. Try clearing your search or filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedAudience('all');
              setSelectedCategory('all');
            }}
            className="mt-4 h-7 text-xs border-border"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORY_ORDER.map((category) => {
            const templates = groupedCatalog.get(category) || [];
            if (templates.length === 0) return null;

            return (
              <section key={category} aria-labelledby={`category-${category}`}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <h3 id={`category-${category}`} className="text-sm font-semibold text-foreground">
                      {category}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {templates.length} report{templates.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <ReportCatalogCard
                      key={template.id}
                      template={template}
                      onOpen={onOpenReport}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
