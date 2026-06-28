import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Circle,
    ExternalLink,
    Mic,
    RefreshCw,
    Search,
    X,
    XCircle,
} from 'lucide-react';
import type {MRT_ColumnDef, MRT_PaginationState} from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { toSentenceCase } from '@/lib/format-text';
import { cleanDataArray } from '@/lib/utils';

type HiveRef   = { hive_id: string; hive_name: string; hive_location: string };
type Recording = {
    audio_id: string;
    hive_id: string;
    source_url: string;
    file_format: string;
    duration_seconds: number | null;
    captured_at: string | null;
    created_at: string | null;
    status: string;
    hive: HiveRef | null;
    detected_state: string | null;
    confidence_score: number | null;
    analyzed_at: string | null;
    inference_latency_ms: number | null;
};

type Paginator = {
    data: Recording[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Props = {
    recordings: Paginator;
    stats: { total: number; processed: number; pending: number; failed: number };
    formats: string[];
    hives: HiveRef[];
    filters: { search: string; status: string; format: string; hive: string };
};

// ── helpers ──────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
    processed: {
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        bg: '#dcfce7', text: '#15803d', label: 'Processed',
    },
    pending: {
        icon: <Circle className="w-3.5 h-3.5" />,
        bg: '#fef3c7', text: '#b45309', label: 'Pending',
    },
    failed: {
        icon: <XCircle className="w-3.5 h-3.5" />,
        bg: '#fee2e2', text: '#b91c1c', label: 'Failed',
    },
};

const HIVE_STATE_COLORS: Record<string, string> = {
    swarm:            '#dc2626',
    pre_swarm:        '#d97706',
    normal:           '#16a34a',
    abscondment:      '#7c3aed',
    missing_queen:    '#ea580c',
    queenbee_present: '#16a34a',
    pest_infested:    '#ea580c',
    external_noise:   '#2563eb',
    uncertain:        '#64748b',
};
function hiveStateColor(state: string | null) {
    return state ? (HIVE_STATE_COLORS[state] ?? '#64748b') : '#94a3b8';
}
function statusCfg(s: string) {
    return STATUS_CFG[s?.toLowerCase()] ?? { icon: null, bg: '#f1f5f9', text: '#64748b', label: s };
}

function formatDuration(secs: number | null) {
    if (secs === null) {
return '—';
}

    return `${Math.round(secs)}s`;
}

function formatDate(iso: string | null) {
    if (!iso) {
return '—';
}

    const d = new Date(iso);

    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' +
           d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function truncatePath(url: string, max = 28) {
    const parts = url.replace(/^\//, '').split('/');
    const last  = parts[parts.length - 1] ?? url;
    const dir   = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
    const full  = dir + last;

    return full.length > max ? full.substring(0, max) + '…' : full;
}



// ── Main component ───────────────────────────────────────────────
export default function AudioRecordings({ recordings, stats, formats, hives, filters }: Props) {
    const [search, setSearch]       = useState(filters.search);
    const [status, setStatus]       = useState(filters.status);
    const [format, setFormat]       = useState(filters.format);
    const [hive, setHive]           = useState(filters.hive);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Clean the incoming data
    const cleanedRecordings = useMemo(() => {
        return cleanDataArray(recordings.data, [
            'hive.hive_name',
            'hive.hive_location',
            'detected_state'
        ]);
    }, [recordings.data]);

    const cleanedHives = useMemo(() => {
        return cleanDataArray(hives, [
            'hive_name',
            'hive_location'
        ]);
    }, [hives]);

    function handleRefresh() {
        setIsRefreshing(true);
        router.reload({
            only: ['recordings', 'stats', 'filters'],
            onFinish: () => {
                setIsRefreshing(false);
                toast.success('Recordings refreshed');
            },
        });
    }

    // Only keep pagination state controlled (for server-side pagination)

    function applyFilters(overrides: Record<string, string> = {}) {
        const params = {
            search:   overrides.search  ?? search,
            status:   overrides.status  ?? status,
            format:   overrides.format  ?? format,
            hive:     overrides.hive    ?? hive,
            per_page: String(pagination.pageSize),
        };
        // strip empty
        const q = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
        router.get('/audio-recordings', q, { preserveState: true, replace: true });
    }

    // Debounce search. Intentionally only depends on `search` — the other filters
    // (status/format/hive) already call applyFilters directly on change.
    useEffect(() => {
        const t = setTimeout(() => applyFilters({ search }), 350);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function clearFilters() {
        setSearch(''); setStatus(''); setFormat(''); setHive('');
        router.get('/audio-recordings', {}, { preserveState: false });
    }

    const hasFilters = search || status || format || hive;

    const formatBadge = (f: string) => (
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
            {f}
        </span>
    );

    // Define MRT Columns
    const columns = useMemo<MRT_ColumnDef<Recording>[]>(() => [
        {
            id: 'hive',
            header: 'Hive',
            accessorFn: (row) => row.hive?.hive_name ?? '—',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ row }) => {
                const hiveShort = row.original.audio_id.substring(0, 4);

                return (
                    <div>
                        <p className="font-semibold text-xs leading-tight" style={{ color: '#0d1b2a' }}>
                            {row.original.hive?.hive_name ?? '—'}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{hiveShort}</p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'source_url',
            header: 'Source File',
            enableSorting: true,
            enableColumnFilter: true,
            size: 140,
            Cell: ({ cell }) => (
                <span className="text-xs tabular-nums" style={{ color: '#0d1b2a' }}>
                    {truncatePath(cell.getValue<string>())}
                </span>
            ),
        },
        {
            accessorKey: 'file_format',
            header: 'Format',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: formats,
            size: 90,
            Cell: ({ cell }) => formatBadge(cell.getValue<string>()),
        },
        {
            accessorKey: 'duration_seconds',
            header: 'Duration',
            enableSorting: true,
            enableColumnFilter: false,
            size: 90,
            Cell: ({ cell }) => (
                <span className="text-xs tabular-nums" style={{ color: '#0d1b2a' }}>
                    {formatDuration(cell.getValue<number | null>())}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['processed', 'pending', 'failed'],
            size: 110,
            Cell: ({ row }) => {
                const cfg = statusCfg(row.original.status);

                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                        {cfg.icon}
                        {cfg.label}
                    </span>
                );
            },
        },
        {
            id: 'link',
            header: '',
            enableSorting: false,
            enableColumnFilter: false,
            enableHiding: false,
            size: 50,
            Cell: ({ row }) => (
                <button
                    onClick={() => row.original.hive && router.visit(`/beehives/${row.original.hive_id}`)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </button>
            ),
        },
    ], [formats]);

    const renderDetailPanel = ({ row }: { row: any }) => {
        const rec = row.original;

        return (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Recorded</p>
                        <p className="text-sm tabular-nums whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                            {formatDate(rec.created_at)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">ML Detected</p>
                        {rec.detected_state ? (
                            <span className="text-xs font-semibold" style={{ color: hiveStateColor(rec.detected_state) }}>
                                {toSentenceCase(rec.detected_state)}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400 italic">Not analysed</span>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Confidence</p>
                        <p className="text-sm tabular-nums" style={{ color: '#0d1b2a' }}>
                            {rec.confidence_score != null ? `${(rec.confidence_score * 100).toFixed(1)}%` : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Analysed At</p>
                        <p className="text-sm whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                            {formatDate(rec.analyzed_at)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Latency</p>
                        <p className="text-sm tabular-nums" style={{ color: '#0d1b2a' }}>
                            {rec.inference_latency_ms != null ? `${rec.inference_latency_ms}ms` : '—'}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    // Add MRT state for pagination
    const validPageSizes = [10, 20, 50, 100];
    const pageSize = validPageSizes.includes(recordings.per_page) ? recordings.per_page : 10;

    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: recordings.current_page - 1, // MRT is 0-based, our server is 1-based
        pageSize: pageSize,
    });

    return (
        <>
            <Head title="Audio Recordings" />

            <div className="flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="flex-1 p-6 flex flex-col gap-5">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Mic className="w-5 h-5 text-gray-400" />
                                <h1 className="text-xl font-bold" style={{ color: '#0d1b2a' }}>Audio recordings</h1>
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5">All audio sources captured from hives</p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-400 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0">
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {/* ── Stat cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total',     value: stats.total,     icon: null,           color: '#0d1b2a', border: 'border-gray-200' },
                            { label: 'Processed', value: stats.processed, icon: <CheckCircle2 className="w-4 h-4" style={{ color: '#15803d' }} />, color: '#15803d', border: 'border-green-200' },
                            { label: 'Pending',   value: stats.pending,   icon: <Circle        className="w-4 h-4" style={{ color: '#b45309' }} />, color: '#b45309', border: 'border-amber-200' },
                            { label: 'Failed',    value: stats.failed,    icon: <XCircle       className="w-4 h-4" style={{ color: '#b91c1c' }} />, color: '#b91c1c', border: 'border-red-200'   },
                        ].map(({ label, value, icon, color, border }) => (
                            <div key={label} className={`bg-white rounded-xl border ${border} p-4 shadow-sm flex flex-col gap-1`}>
                                <div className="flex items-center gap-1.5">
                                    {icon}
                                    <p className="text-xs text-gray-400">{label}</p>
                                </div>
                                <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Material React Table ── */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <DataTable
                                columns={columns}
                                data={cleanedRecordings}
                                getRowId={(row) => row.audio_id}
                                renderDetailPanel={renderDetailPanel}
                                manualPagination={true}
                                renderTopToolbarCustomActions={() => (
                                    <div className="flex flex-wrap gap-3 items-center">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search hive, file or format…"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                                style={{ color: '#0d1b2a' }}
                                            />
                                        </div>

                                        <select
                                            value={status}
                                            onChange={(e) => {
                                                setStatus(e.target.value); applyFilters({ status: e.target.value });
                                            }}
                                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-amber-400" style={{ color: '#0d1b2a' }}>
                                            <option value="">All statuses</option>
                                            <option value="processed">Processed</option>
                                            <option value="pending">Pending</option>
                                            <option value="failed">Failed</option>
                                        </select>

                                        <select
                                            value={format}
                                            onChange={(e) => {
                                                setFormat(e.target.value); applyFilters({ format: e.target.value });
                                            }}
                                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-amber-400" style={{ color: '#0d1b2a' }}>
                                            <option value="">All formats</option>
                                            {formats.map((f) => <option key={f} value={f}>{f}</option>)}
                                        </select>

                                        <select
                                            value={hive}
                                            onChange={(e) => {
                                                setHive(e.target.value); applyFilters({ hive: e.target.value });
                                            }}
                                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-amber-400" style={{ color: '#0d1b2a' }}>
                                            <option value="">All hives</option>
                                            {cleanedHives.map((h) => (
                                                <option key={h.hive_id} value={h.hive_id}>{h.hive_name}</option>
                                            ))}
                                        </select>

                                        {hasFilters && (
                                            <button onClick={clearFilters}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 shadow-sm transition-colors">
                                                <X className="w-3.5 h-3.5" />
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                )}
                                rowCount={recordings.total}
                                state={{ pagination }}
                                onPaginationChange={(updater: MRT_PaginationState | ((prev: MRT_PaginationState) => MRT_PaginationState)) => {
                                    const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
                                    const pageSizeChanged = newPagination.pageSize !== pagination.pageSize;
                                    const pageIndex = pageSizeChanged ? 0 : newPagination.pageIndex;
                                    setPagination({ pageIndex, pageSize: newPagination.pageSize });
                                    // Update the page in the router (convert to 1-based index)
                                    router.get('/audio-recordings', {
                                        search, status, format, hive,
                                        page: String(pageIndex + 1),
                                        per_page: String(newPagination.pageSize),
                                    }, { preserveState: true });
                                }}
                            />
                    </div>

                </div>
            </div>
        </>
    );
}

AudioRecordings.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard',  href: '/dashboard' },
        { title: 'Audio Recordings', href: '/audio-recordings' },
    ]}>
        {page}
    </AppLayout>
);

