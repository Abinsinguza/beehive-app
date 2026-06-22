import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    Circle,
    ExternalLink,
    Mic,
    Play,
    RefreshCw,
    Search,
    X,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type MRT_ColumnDef, type MRT_PaginationState } from 'material-react-table';
import { MenuItem } from '@mui/material';
import { DataTable } from '@/components/data-table';
import { toast } from 'sonner';

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
    if (secs === null) return '—';
    return `${Math.round(secs)}s`;
}

function formatDate(iso: string | null) {
    if (!iso) return '—';
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



// ── Add recording modal ──────────────────────────────────────────
function AddRecordingModal({ hives, onClose }: { hives: HiveRef[]; onClose: () => void }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        hive_id: '', source_url: '', file_format: 'WAV',
        duration_seconds: '', captured_at: '', status: 'pending',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/audio-recordings', { onSuccess: () => { reset(); onClose(); } });
    };

    const overlayRef = useRef<HTMLDivElement>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
             ref={overlayRef}
             onClick={(e) => e.target === overlayRef.current && onClose()}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Add Recording</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    {/* Hive */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">
                            Hive <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.hive_id}
                            onChange={(e) => setData('hive_id', e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            style={{ borderColor: errors.hive_id ? '#f87171' : '#d1d5db' }}
                            required>
                            <option value="">Select hive…</option>
                            {hives.map((h) => (
                                <option key={h.hive_id} value={h.hive_id}>{h.hive_name} — {h.hive_location}</option>
                            ))}
                        </select>
                        {errors.hive_id && <p className="text-xs text-red-500">{errors.hive_id}</p>}
                    </div>

                    {/* Source URL */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">
                            Source file path <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.source_url}
                            onChange={(e) => setData('source_url', e.target.value)}
                            placeholder="e.g. recordings/hive1/rec_001.wav"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            style={{ borderColor: errors.source_url ? '#f87171' : '#d1d5db' }}
                            required />
                        {errors.source_url && <p className="text-xs text-red-500">{errors.source_url}</p>}
                    </div>

                    {/* Format + Duration */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700">
                                Format <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.file_format}
                                onChange={(e) => setData('file_format', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                required>
                                {['WAV', 'MP3', 'FLAC', 'OGG', 'AAC'].map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700">Duration (s)</label>
                            <input
                                type="number"
                                value={data.duration_seconds}
                                onChange={(e) => setData('duration_seconds', e.target.value)}
                                placeholder="e.g. 30"
                                min="0"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                        </div>
                    </div>

                    {/* Captured at */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">
                            Captured at <span className="text-gray-400 text-xs font-normal">(optional)</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={data.captured_at}
                            onChange={(e) => setData('captured_at', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Status <span className="text-red-500">*</span></label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            required>
                            <option value="pending">Pending</option>
                            <option value="processed">Processed</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: '#0d1b2a' }}>
                            {processing ? 'Saving…' : 'Add Recording'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────
export default function AudioRecordings({ recordings, stats, formats, hives, filters }: Props) {
    const [showAdd, setShowAdd]     = useState(false);
    const [search, setSearch]       = useState(filters.search);
    const [status, setStatus]       = useState(filters.status);
    const [format, setFormat]       = useState(filters.format);
    const [hive, setHive]           = useState(filters.hive);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Debug: Check recordings data reference stability
    if (typeof window !== 'undefined') {
        console.log('recordings data reference same:', recordings.data === (window as any).__lastRecordingData);
        (window as any).__lastRecordingData = recordings.data;
    }

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

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => applyFilters({ search }), 350);
        return () => clearTimeout(t);
    }, [search]);

    function applyFilters(overrides: Record<string, string> = {}) {
        const params = {
            search: overrides.search  ?? search,
            status: overrides.status  ?? status,
            format: overrides.format  ?? format,
            hive:   overrides.hive    ?? hive,
        };
        // strip empty
        const q = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ''));
        router.get('/audio-recordings', q, { preserveState: true, replace: true });
    }

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
            id: 'play',
            header: '',
            enableSorting: false,
            enableColumnFilter: false,
            enableHiding: false,
            size: 60,
            Cell: () => (
                <button className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors">
                    <Play className="w-3 h-3 text-gray-400 ml-0.5" />
                </button>
            ),
        },
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
            header: 'Source file',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ cell }) => (
                <span className="text-xs text-gray-600 font-mono">
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
            Cell: ({ cell }) => formatBadge(cell.getValue<string>()),
        },
        {
            accessorKey: 'duration_seconds',
            header: 'Duration',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ cell }) => (
                <span className="text-xs text-gray-600 tabular-nums">
                    {formatDuration(cell.getValue<number | null>())}
                </span>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Recorded',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ cell }) => (
                <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
                    {formatDate(cell.getValue<string | null>())}
                </span>
            ),
        },
        {
            accessorKey: 'detected_state',
            header: 'ML Detected',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['swarm', 'pre_swarm', 'normal', 'abscondment', 'missing_queen', 'queenbee_present', 'pest_infested', 'external_noise', 'uncertain'],
            Cell: ({ cell }) => {
                const val = cell.getValue<string | null>();
                return val ? (
                    <span className="text-xs font-semibold" style={{ color: hiveStateColor(val) }}>
                        {val}
                    </span>
                ) : (
                    <span className="text-xs text-gray-400 italic">Not analysed</span>
                );
            },
        },
        {
            accessorKey: 'confidence_score',
            header: 'Confidence',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ cell }) => {
                const val = cell.getValue<number | null>();
                return val != null ? (
                    <span className="text-xs text-gray-600 tabular-nums">
                        {(val * 100).toFixed(1)}%
                    </span>
                ) : '—';
            },
        },
        {
            accessorKey: 'analyzed_at',
            header: 'Analysed At',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ cell }) => (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(cell.getValue<string | null>())}
                </span>
            ),
        },
        {
            accessorKey: 'inference_latency_ms',
            header: 'Latency',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ cell }) => {
                const val = cell.getValue<number | null>();
                return val != null ? (
                    <span className="text-xs text-gray-600 tabular-nums">{val}ms</span>
                ) : '—';
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['processed', 'pending', 'failed'],
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
            size: 60,
            Cell: ({ row }) => (
                <button
                    onClick={() => row.original.hive && router.visit(`/beehives/${row.original.hive_id}`)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </button>
            ),
        },
    ], [formats]);

    // Add MRT state for pagination
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: recordings.current_page - 1, // MRT is 0-based, our server is 1-based
        pageSize: recordings.per_page,
    });

    return (
        <>
            <Head title="Audio Recordings" />
            {showAdd && <AddRecordingModal hives={hives} onClose={() => setShowAdd(false)} />}

            <div className="flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="flex-1 p-6 flex flex-col gap-5">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Mic className="w-5 h-5 text-gray-500" />
                                <h1 className="text-xl font-bold" style={{ color: '#0d1b2a' }}>Audio recordings</h1>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">All audio sources captured from hives</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={() => setShowAdd(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
                                style={{ backgroundColor: '#0d1b2a' }}>
                                <span className="text-lg leading-none">+</span>
                                Add recording
                                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                            </button>
                        </div>
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
                                    <p className="text-xs text-gray-500">{label}</p>
                                </div>
                                <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Filters ── */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-amber-400 text-gray-600">
                            <option value="">All statuses</option>
                            <option value="processed">Processed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>

                        <select
                            value={format}
                            onChange={(e) => { setFormat(e.target.value); applyFilters({ format: e.target.value }); }}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-amber-400 text-gray-600">
                            <option value="">All formats</option>
                            {formats.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>

                        <select
                            value={hive}
                            onChange={(e) => { setHive(e.target.value); applyFilters({ hive: e.target.value }); }}
                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-amber-400 text-gray-600">
                            <option value="">All hives</option>
                            {hives.map((h) => (
                                <option key={h.hive_id} value={h.hive_id}>{h.hive_name}</option>
                            ))}
                        </select>

                        {hasFilters && (
                            <button onClick={clearFilters}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 shadow-sm transition-colors">
                                <X className="w-3.5 h-3.5" />
                                Clear
                            </button>
                        )}
                    </div>

                    {/* ── Material React Table ── */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <DataTable
                                columns={columns}
                                data={recordings.data}
                                getRowId={(row) => row.audio_id}
                                manualPagination={true}
                                rowCount={recordings.total}
                                state={{ pagination }}
                                onPaginationChange={(updater: MRT_PaginationState | ((prev: MRT_PaginationState) => MRT_PaginationState)) => {
                                    const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
                                    setPagination(newPagination);
                                    // Update the page in the router (convert to 1-based index)
                                    router.get('/audio-recordings', {
                                        search, status, format, hive, page: String(newPagination.pageIndex + 1),
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

