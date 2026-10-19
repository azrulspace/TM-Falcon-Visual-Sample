import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type { SortingState } from '@tanstack/react-table';
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Download,
  MoreHorizontal,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge } from '@/components/common/StatusBadge';
import { devices } from '@/data/devices';

interface DeviceStatusDrawerProps {
  selectedId: string | null;
  onSelectDevice: (id: string) => void;
  timeMode?: string;
  isSheet?: boolean;
  onClose?: () => void;
}

interface DeviceRow {
  id: string;
  name: string;
  type: string;
  site: string;
  status: string;
  lastContact: string;
  details: string;
  asset: string;
}

const columnHelper = createColumnHelper<DeviceRow>();

export const DeviceStatusDrawer: React.FC<DeviceStatusDrawerProps> = ({
  selectedId,
  onSelectDevice,
  timeMode = 'Active now',
  isSheet = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Enrich device rows with diagnostic details from prompt concepts
  const data: DeviceRow[] = useMemo(() => {
    const detailsMap: Record<string, string> = {
      DEV_004: 'LiDAR candidate (Overheight trigger)',
      DEV_011: 'No heartbeat received (Timeout)',
      DEV_003: 'Delayed telemetry reporting',
      DEV_007: 'Gateway unreachable on Port 554',
      DEV_001: 'Optical sensor nominal',
      DEV_002: 'Monkey near cable alert active',
      DEV_005: 'Person near pole incident',
    };

    return devices.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      site: d.site,
      status: d.status,
      lastContact: d.lastContact,
      details: detailsMap[d.id] || 'Nominal telemetry stream',
      asset: d.asset,
    }));
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
            aria-label="Select all rows"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(val) => row.toggleSelected(!!val)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
            className="translate-y-[2px]"
          />
        ),
      }),
      columnHelper.accessor('id', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-foreground font-semibold"
          >
            <span>DEVICE</span>
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: (info) => (
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-xs font-bold text-primary">{info.getValue()}</span>
            <span className="text-[11px] text-muted-foreground truncate">{info.row.original.type}</span>
          </div>
        ),
      }),
      columnHelper.accessor('site', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-foreground font-semibold"
          >
            <span>SITE / ASSET</span>
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: (info) => (
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-foreground truncate">{info.getValue()}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{info.row.original.asset}</span>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-foreground font-semibold"
          >
            <span>STATUS</span>
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: (info) => <StatusBadge status={info.getValue()} size="sm" />,
      }),
      columnHelper.accessor('lastContact', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-foreground font-semibold"
          >
            <span>LAST SEEN</span>
            <ArrowUpDown className="size-3" />
          </button>
        ),
        cell: (info) => (
          <Tooltip>
            <TooltipTrigger render={
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums cursor-default">
                {info.getValue()}
              </span>
            } />
            <TooltipContent side="top" className="text-xs font-mono">
              Absolute contact timestamp: 2025-10-05 {info.getValue()} MYT
            </TooltipContent>
          </Tooltip>
        ),
      }),
      columnHelper.accessor('details', {
        header: 'DETAILS',
        cell: (info) => (
          <span className="text-xs text-muted-foreground truncate block max-w-xs">{info.getValue()}</span>
        ),
      }),
      columnHelper.display({
        id: 'action',
        header: 'ACTION',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/assets/inventory/devices/${row.original.id}`)}
              className="h-7 px-2.5 text-[11px] border-border hover:bg-muted"
            >
              Investigate
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44 text-xs z-50 bg-popover border border-border">
                <DropdownMenuItem onClick={() => onSelectDevice(row.original.id)} className="cursor-pointer">
                  Focus on Map
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`/assets/inventory/devices/${row.original.id}`)}
                  className="cursor-pointer"
                >
                  <ExternalLink className="mr-2 size-3" />
                  Open Device Detail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      }),
    ],
    [navigate, onSelectDevice]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const onlineCount = data.filter((d) => d.status === 'online').length;
  const offlineCount = data.filter((d) => d.status === 'offline').length;
  const staleCount = data.filter((d) => d.status === 'stale').length;

  if (isSheet) {
    return (
      <div className="flex flex-col h-full bg-card text-foreground select-none overflow-hidden">
        {/* Sheet Header */}
        <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0 bg-muted/40">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              Assets & devices ({data.length})
            </span>
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
              <span className="text-status-online font-semibold">● {onlineCount} online</span> •{' '}
              <span className="text-status-offline font-semibold">● {offlineCount} offline</span> •{' '}
              <span className="text-status-stale font-semibold">● {staleCount} stale</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 px-2.5 text-xs gap-1.5 border-border opacity-70 cursor-not-allowed"
                >
                  <Download className="size-3.5" />
                  <span>Export CSV</span>
                </Button>
              } />
              <TooltipContent side="top" className="text-xs">
                Export telemetry CSV
              </TooltipContent>
            </Tooltip>

            {onClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="size-8 text-muted-foreground hover:text-foreground"
                aria-label="Close assets table"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-semibold py-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const isSelected = selectedId === row.original.id;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => onSelectDevice(row.original.id)}
                    className={`cursor-pointer transition-colors text-xs ${
                      isSelected ? 'bg-accent font-semibold border-l-2 border-l-primary' : 'hover:bg-muted/40'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card shrink-0 select-none shadow-lg z-30 transition-all duration-200">
      {/* Collapsed 40px Summary Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-tight text-foreground flex items-center gap-2">
            <SlidersHorizontal className="size-3.5 text-primary" />
            Device status
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {data.length} total • <span className="text-status-online font-semibold">{onlineCount} online</span> •{' '}
            <span className="text-status-offline font-semibold">{offlineCount} offline</span> •{' '}
            <span className="text-status-stale font-semibold">{staleCount} stale</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] text-muted-foreground font-mono hidden md:inline">
            Mode: {timeMode}
          </div>

          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="outline"
                size="sm"
                disabled
                onClick={(e) => e.stopPropagation()}
                className="h-7 px-2 text-xs gap-1 border-border opacity-70 cursor-not-allowed"
              >
                <Download className="size-3" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            } />
            <TooltipContent side="top" className="text-xs">
              Export telemetry CSV requires backend endpoint
            </TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? "Collapse device drawer" : "Expand device drawer"}
          >
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Table Area (280px resizable/scrollable) */}
      {isExpanded && (
        <div className="h-[280px] border-t border-border overflow-y-auto overflow-x-auto bg-card animate-in slide-in-from-bottom-2 duration-150">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const isSelected = selectedId === row.original.id;
                return (
                  <TableRow
                    key={row.id}
                    onClick={() => onSelectDevice(row.original.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-accent font-semibold border-l-2 border-l-primary' : 'hover:bg-muted/40'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
