import React, { useState, useMemo } from 'react';
import {
  Users,
  User,
  UserX,
  Search,
  Check,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { AssigneeType } from '@/types/cases';

export interface AssigneeOption {
  id: string;
  name: string;
  type: AssigneeType;
  role?: string;
  initials?: string;
}

export const CANONICAL_ASSIGNEES: AssigneeOption[] = [
  { id: 'unassigned', name: 'Unassigned', type: 'unassigned', role: 'No assignee' },
  { id: 'team-field', name: 'Field Team', type: 'team', role: 'On-site Field Operations' },
  { id: 'team-alpha', name: 'Field Team Alpha', type: 'team', role: 'Fiber Restoration' },
  { id: 'team-beta', name: 'Field Team Beta', type: 'team', role: 'Inspection & Repair' },
  { id: 'user-ahmad', name: 'Ahmad Syukri', type: 'person', role: 'Operations Lead', initials: 'AS' },
  { id: 'user-farhan', name: 'Farhan Malik', type: 'person', role: 'Network Engineer', initials: 'FM' },
  { id: 'user-zulhilmi', name: 'Zulhilmi', type: 'person', role: 'Field Technician', initials: 'ZH' },
];

export interface AssignPopoverProps {
  currentAssignee?: string | null;
  onAssign: (assignee: string | null, assigneeType: AssigneeType) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
}

export const AssignPopover: React.FC<AssignPopoverProps> = ({
  currentAssignee,
  onAssign,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  align = 'end',
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState('');

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onToggle = (next: boolean) => {
    if (setControlledOpen) {
      setControlledOpen(next);
    } else {
      setInternalOpen(next);
    }
    if (!next) {
      setQuery('');
    }
  };

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CANONICAL_ASSIGNEES;
    return CANONICAL_ASSIGNEES.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.role && opt.role.toLowerCase().includes(q))
    );
  }, [query]);

  const teams = filteredOptions.filter((opt) => opt.type === 'team');
  const people = filteredOptions.filter((opt) => opt.type === 'person');
  const hasUnassigned = filteredOptions.some((opt) => opt.type === 'unassigned');

  const handleSelect = (opt: AssigneeOption) => {
    if (opt.type === 'unassigned') {
      onAssign(null, 'unassigned');
    } else {
      onAssign(opt.name, opt.type);
    }
    onToggle(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={onToggle}>
      {trigger && <PopoverTrigger render={trigger as React.ReactElement} />}
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-72 p-2 bg-popover border border-border shadow-2xl z-50 text-xs rounded-xl"
      >
        {/* Search header */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search team or person..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-muted/40 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
          {/* Unassigned Option */}
          {hasUnassigned && (
            <div>
              <button
                type="button"
                onClick={() => handleSelect(CANONICAL_ASSIGNEES[0])}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-muted/60 cursor-pointer',
                  (!currentAssignee || currentAssignee.toLowerCase() === 'unassigned') &&
                    'bg-primary/10 text-primary font-medium'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                    <UserX className="size-3.5" />
                  </div>
                  <div>
                    <span className="block font-medium">Unassigned</span>
                    <span className="text-[10px] text-muted-foreground block">
                      Clear current assignee
                    </span>
                  </div>
                </div>
                {(!currentAssignee || currentAssignee.toLowerCase() === 'unassigned') && (
                  <Check className="size-3.5 text-primary" />
                )}
              </button>
            </div>
          )}

          {/* Teams Section */}
          {teams.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Teams
              </div>
              <div className="space-y-0.5">
                {teams.map((team) => {
                  const isSelected = currentAssignee === team.name;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleSelect(team)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-muted/60 cursor-pointer',
                        isSelected && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-md bg-sky-500/10 text-sky-500 flex items-center justify-center">
                          <Users className="size-3.5" />
                        </div>
                        <div>
                          <span className="block font-medium">{team.name}</span>
                          {team.role && (
                            <span className="text-[10px] text-muted-foreground block">
                              {team.role}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="size-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* People Section */}
          {people.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Members
              </div>
              <div className="space-y-0.5">
                {people.map((person) => {
                  const isSelected = currentAssignee === person.name;
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => handleSelect(person)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-muted/60 cursor-pointer',
                        isSelected && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-primary/10 text-primary font-semibold text-[10px] flex items-center justify-center">
                          {person.initials || <User className="size-3" />}
                        </div>
                        <div>
                          <span className="block font-medium">{person.name}</span>
                          {person.role && (
                            <span className="text-[10px] text-muted-foreground block">
                              {person.role}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="size-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredOptions.length === 0 && (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No matching assignees found.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
