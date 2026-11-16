import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface ReportHighlightFact {
  id: string;
  text: string;
  sectionId?: string;
  type?: 'neutral' | 'positive' | 'warning';
}

export interface ReportHighlightsProps {
  facts: ReportHighlightFact[];
  className?: string;
}

export const ReportHighlights: React.FC<ReportHighlightsProps> = ({ facts, className = '' }) => {
  if (!facts || facts.length === 0) return null;

  // Enforce at most 5 highlights per Section 5.2
  const visibleFacts = facts.slice(0, 5);

  const handleScrollToSection = (sectionId?: string) => {
    if (!sectionId) return;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className={`rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs space-y-2.5 ${className}`}
      data-testid="report-highlights"
    >
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Sparkles className="size-3.5" />
        </div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Highlights
        </h2>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          — key operational changes and findings this period
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {visibleFacts.map((fact) => {
          const isClickable = Boolean(fact.sectionId);

          return (
            <div
              key={fact.id}
              onClick={() => isClickable && handleScrollToSection(fact.sectionId)}
              className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-2 transition-colors ${
                fact.type === 'warning'
                  ? 'border-amber-500/30 bg-amber-500/5 text-foreground'
                  : fact.type === 'positive'
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                  : 'border-border/60 bg-muted/20 text-foreground'
              } ${isClickable ? 'cursor-pointer hover:border-primary/50 hover:bg-muted/40' : ''}`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`size-1.5 rounded-full mt-1.5 shrink-0 ${
                    fact.type === 'warning'
                      ? 'bg-amber-500'
                      : fact.type === 'positive'
                      ? 'bg-emerald-500'
                      : 'bg-primary'
                  }`}
                />
                <span className="leading-relaxed font-medium">{fact.text}</span>
              </div>

              {isClickable && (
                <ArrowRight className="size-3 text-muted-foreground mt-0.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
