import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Circle,
    ExternalLink,
    Mic,
    Play,
    RefreshCw,
    Search,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type HiveRef   = { hive_id: string; hive_name: string; hive_location: string };
type Recording = {
    audio_id: string;
    hive_id: string;
    source_url: string;
    file_format: string;
    duration_seconds: number | null;
    captured_at: string | null;
    ingestion_timestamp: string | null;
    status: string;
    hive: HiveRef | null;
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
    stats: { total: number; ingested: number; pending: number; failed: number };
    formats: string[];
    hives: HiveRef[];
    filters: { search: string; status: string; format: string; hive: string };
};

// ── helpers ──────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
    ingested: {
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        bg: '#dcfce7', text: '#15803d', label: 'Ingested',
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
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
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">Status <span className="text-red-500">*</span></label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            required>
                            <option value="pending">Pending</option>
                            <option value="ingested">Ingested</option>
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

    function goToPage(page: number) {
        router.get('/audio-recordings', {
            search, status, format, hive, page: String(page),
        }, { preserveState: true });
    }

    const hasFilters = search || status || format || hive;

    const formatBadge = (f: string) => (
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
            {f}
        </span>
    );

    const pages = Array.from({ length: recordings.last_page }, (_, i) => i + 1);
    const shownPages = pages.filter(p =>
        p === 1 || p === recordings.last_page ||
        Math.abs(p - recordings.current_page) <= 1
    );

    return (
        <>
            <Head title="Audio Recordings" />
            {showAdd && <AddRecordingModal hives={hives} onClose={() => setShowAdd(false)} />}

            <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
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
                                onClick={() => router.reload()}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                                <RefreshCw className="w-4 h-4" />
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
                            { label: 'Total',    value: stats.total,    icon: null,           color: '#0d1b2a', border: 'border-gray-200' },
                            { label: 'Ingested', value: stats.ingested, icon: <CheckCircle2 className="w-4 h-4" style={{ color: '#15803d' }} />, color: '#15803d', border: 'border-green-200' },
                            { label: 'Pending',  value: stats.pending,  icon: <Circle        className="w-4 h-4" style={{ color: '#b45309' }} />, color: '#b45309', border: 'border-amber-200' },
                            { label: 'Failed',   value: stats.failed,   icon: <XCircle       className="w-4 h-4" style={{ color: '#b91c1c' }} />, color: '#b91c1c', border: 'border-red-200'   },
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
                    <div className="flex flex-col gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search hive, file or format…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            />
                        </div>

                        {/* Dropdowns row */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-amber-400 text-gray-600">
                                <option value="">All statuses</option>
                                <option value="ingested">Ingested</option>
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
                    </div>

                    {/* ── Table ── */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400 w-10" />
                                        <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Hive</th>
                                        <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Source file</th>
                                        <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Format</th>
                                        <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Duration</th>
                                        <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                            Captured at ↓
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recordings.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-16 text-sm text-gray-400">
                                                No recordings found
                                            </td>
                                        </tr>
                                    ) : recordings.data.map((rec) => {
                                        const cfg  = statusCfg(rec.status);
                                        const hiveShort = rec.audio_id.substring(0, 4);
                                        return (
                                            <tr key={rec.audio_id} className="hover:bg-gray-50 transition-colors">
                                                {/* Play button */}
                                                <td className="px-4 py-3">
                                                    <button className="w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors">
                                                        <Play className="w-3 h-3 text-gray-400 ml-0.5" />
                                                    </button>
                                                </td>

                                                {/* Hive */}
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-xs leading-tight" style={{ color: '#0d1b2a' }}>
                                                        {rec.hive?.hive_name ?? '—'}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{hiveShort}</p>
                                                </td>

                                                {/* Source file */}
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-gray-600 font-mono">
                                                        {truncatePath(rec.source_url)}
                                                    </span>
                                                </td>

                                                {/* Format */}
                                                <td className="px-4 py-3">{formatBadge(rec.file_format)}</td>

                                                {/* Duration */}
                                                <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">
                                                    {formatDuration(rec.duration_seconds)}
                                                </td>

                                                {/* Captured at */}
                                                <td className="px-4 py-3 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                                                    {formatDate(rec.captured_at)}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                        style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                                                        {cfg.icon}
                                                        {cfg.label}
                                                    </span>
                                                </td>

                                                {/* Link */}
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => rec.hive && router.visit(`/beehives/${rec.hive_id}`)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {recordings.total > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                    {recordings.from ?? 0}–{recordings.to ?? 0} of {recordings.total} recordings
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => goToPage(recordings.current_page - 1)}
                                        disabled={recordings.current_page === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {shownPages.map((p, i) => {
                                        const prev = shownPages[i - 1];
                                        const gap  = prev !== undefined && p - prev > 1;
                                        return (
                                            <span key={p} className="flex items-center gap-1">
                                                {gap && <span className="text-gray-400 text-xs px-1">…</span>}
                                                <button
                                                    onClick={() => goToPage(p)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium border transition-colors"
                                                    style={p === recordings.current_page
                                                        ? { backgroundColor: '#0d1b2a', color: 'white', borderColor: '#0d1b2a' }
                                                        : { backgroundColor: 'white', color: '#374151', borderColor: '#e5e7eb' }}>
                                                    {p}
                                                </button>
                                            </span>
                                        );
                                    })}

                                    <button
                                        onClick={() => goToPage(recordings.current_page + 1)}
                                        disabled={recordings.current_page === recordings.last_page}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}

AudioRecordings.layout = {
    breadcrumbs: [{ title: 'Audio Recordings', href: '/audio-recordings' }],
};
