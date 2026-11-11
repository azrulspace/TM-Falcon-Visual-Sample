import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useAssets } from '@/contexts/AssetsContext';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { PolesPageHeader } from '@/components/assets/PolesPageHeader';
import { AssetsModuleTabs } from '@/components/assets/AssetsModuleTabs';
import { StatusBadge } from '@/components/common/StatusBadge';

export default function CableSpans() {
  const { selectedSite } = useAppContext();
  const { poles, cableSpans, permissions, isRefreshing, refreshAssets } = useAssets();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState<string>(selectedSite);

  const activePolesCount = useMemo(
    () => poles.filter((p) => p.lifecycle !== 'Deleted').length,
    [poles]
  );

  const filteredSpans = useMemo(() => {
    return cableSpans.filter((s) => {
      if (siteFilter && siteFilter !== 'ALL' && s.siteName !== siteFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          s.identifier.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.fromPole.toLowerCase().includes(q) ||
          s.toPole.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cableSpans, siteFilter, search]);

  const handleExport = () => {
    addToast('info', `Cable spans export (${filteredSpans.length} records) prepared.`);
  };

  const uniqueSites = useMemo(
    () => Array.from(new Set(cableSpans.map((s) => s.siteName))).sort(),
    [cableSpans]
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto pb-10">
      <PolesPageHeader
        title="Cable spans"
        subtitle="Fibre cable spans connecting poles on a site."
        moduleBreadcrumbLabel="Cable spans"
        isRefreshing={isRefreshing}
        onRefresh={refreshAssets}
        onExport={handleExport}
        exportDisabled={filteredSpans.length === 0}
        permissions={permissions}
        showRegisterAction={false}
      />

      <AssetsModuleTabs
        activeTab="cable_spans"
        polesCount={activePolesCount}
        cableSpansCount={cableSpans.length}
      />

      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search identifier, name, or pole"
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-border bg-card text-foreground cursor-pointer"
              aria-label="Filter cable spans by site"
            >
              <option value="ALL">All sites</option>
              {uniqueSites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {filteredSpans.length} cable spans
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 px-4">Identifier</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Site</th>
                <th className="py-2.5 px-4">Lifecycle</th>
                <th className="py-2.5 px-4">Endpoints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSpans.slice(0, 50).map((span) => (
                <tr key={span.identifier} className="hover:bg-muted/30 transition-colors h-12">
                  <td className="py-2 px-4 font-mono font-semibold text-foreground">
                    {span.identifier}
                  </td>
                  <td className="py-2 px-4 text-foreground">{span.name}</td>
                  <td className="py-2 px-4 text-muted-foreground">{span.siteName}</td>
                  <td className="py-2 px-4">
                    <StatusBadge status={span.lifecycle} size="sm" />
                  </td>
                  <td className="py-2 px-4 font-mono">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        to={`/assets/poles/${encodeURIComponent(span.fromPole)}`}
                        className="text-primary hover:underline"
                      >
                        {span.fromPole}
                      </Link>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <Link
                        to={`/assets/poles/${encodeURIComponent(span.toPole)}`}
                        className="text-primary hover:underline"
                      >
                        {span.toPole}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

