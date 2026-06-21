import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { type MRT_ColumnDef } from 'material-react-table';
import { DataTable } from '@/components/data-table';

type Beehive = {
    hive_id: string;
    hive_name: string;
    hive_location: string;
};

type Inference = {
    inference_id: string;
    hive_id: string;
    audio_id: string | null;
    hive_state: string;
    confidence_score: number;
    inference_latency_ms: number | null;
    analyzed_at: string | null;
    created_at: string | null;
    beehive: Beehive | null;
};

type Paginator = {
    data: Inference[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type Stats = {
    total: number;
    avg_confidence: number | null;
    avg_latency: number | null;
    swarm_count: number;
};

type Props = {
    inferences: Paginator;
    beehives: Beehive[];
    stats: Stats;
    filters: { state: string; search: string };
};

const STATE_COLORS: Record<string, { bg: string; text: string }> = {
    // DB values (lowercase / snake_case)
    normal:             { bg: '#dcfce7', text: '#16a34a' },
    pre_swarm:          { bg: '#fef3c7', text: '#d97706' },
    swarm:              { bg: '#fee2e2', text: '#dc2626' },
    abscondence:        { bg: '#fce7f3', text: '#9d174d' },
    external_noise:     { bg: '#ffedd5', text: '#ea580c' },
    pest_disturbance:   { bg: '#ffedd5', text: '#ea580c' },
    uncertain:          { bg: '#f1f5f9', text: '#64748b' },
};

function stateStyle(state: string) {
    return STATE_COLORS[state] ?? { bg: '#f1f5f9', text: '#64748b' };
}

function fmtDate(val: string | null) {
    if (!val) return '—';
    return new Date(val).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function fmtScore(val: number) {
    return `${(val * 100).toFixed(1)}%`;
}

function scoreColor(val: number) {
    if (val >= 0.8) return '#16a34a';
    if (val >= 0.6) return '#d97706';
    return '#dc2626';
}

function shortId(id: string | null) {
    if (!id) return '—';
    return id.slice(0, 8) + '…';
}

function getPageNumbers(current: number, last: number): (number | '…')[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', last];
    if (current >= last - 3) return [1, '…', last - 4, last - 3, last - 2, last - 1, last];
    return [1, '…', current - 1, current, current + 1, '…', last];
}

export default function Inferences({ inferences, beehives = [], stats, filters }: Props) {
    const [search, setSearch]       = useState(filters?.search ?? '');
    const [stateFilter, setStateFilter] = useState(filters?.state ?? '');
    const [showModal, setShowModal] = useState(false);

    const columns = useMemo<MRT_ColumnDef<Inference>[]>(() => [
        {
            id: 'index',
            header: '#',
            enableSorting: false,
            enableColumnFilter: false,
            Cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: 'inference_id',
            header: 'Inference ID',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ row }) => (
                <span className="font-mono text-gray-500" title={row.original.inference_id}>
                    {shortId(row.original.inference_id)}
                </span>
            ),
        },
        {
            id: 'hive',
            header: 'Hive',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ row }) => {
                const r = row.original;
                return r.beehive ? (
                    <div>
                        <p className="font-semibold whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                            {r.beehive.hive_name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-normal">
                            {r.beehive.hive_location}
                        </p>
                    </div>
                ) : (
                    <span className="font-mono text-gray-400" title={r.hive_id}>
                        {shortId(r.hive_id)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'audio_id',
            header: 'Audio ID',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ row }) => (
                <span className="font-mono text-gray-400" title={row.original.audio_id ?? ''}>
                    {row.original.audio_id ? shortId(row.original.audio_id) : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'hive_state',
            header: 'Hive State',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['', 'normal', 'pre_swarm', 'swarm', 'abscondence', 'external_noise', 'pest_disturbance', 'uncertain'],
            Cell: ({ row }) => {
                const style = stateStyle(row.original.hive_state);
                return (
                    <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap"
                        style={{ backgroundColor: style.bg, color: style.text }}
                    >
                        {row.original.hive_state}
                    </span>
                );
            },
        },
        {
            accessorKey: 'confidence_score',
            header: 'Confidence Score',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ row }) => (
                <span className="font-bold tabular-nums" style={{ color: scoreColor(row.original.confidence_score) }}>
                    {fmtScore(row.original.confidence_score)}
                </span>
            ),
        },
        {
            accessorKey: 'inference_latency_ms',
            header: 'Latency (ms)',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ row }) => (
                <span className="tabular-nums text-gray-600">
                    {row.original.inference_latency_ms != null ? `${row.original.inference_latency_ms.toFixed(2)}` : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'analyzed_at',
            header: 'Analyzed At',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ row }) => fmtDate(row.original.analyzed_at),
        },
        {
            accessorKey: 'created_at',
            header: 'Created At',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ row }) => fmtDate(row.original.created_at),
        },
    ], []);

    const { data, setData, post, processing, errors, reset } = useForm({
        hive_id: '',
        audio_id: '',
        hive_state: 'swarm',
        confidence_score: '',
        inference_latency_ms: '',
        analyzed_at: '',
    });

    function applyFilters(overrides: { search?: string; state?: string } = {}) {
        router.get('/analytics', {
            search: overrides.search ?? search,
            state:  overrides.state  ?? stateFilter,
        }, { preserveScroll: true, preserveState: true });
    }

    function goToPage(url: string | null) {
        if (url) router.visit(url, { preserveScroll: true });
    }

    function goToPageNum(page: number) {
        router.get('/analytics', { search, state: stateFilter, page }, { preserveScroll: true });
    }

    const rows    = inferences?.data ?? [];
    const from    = ((inferences?.current_page ?? 1) - 1) * (inferences?.per_page ?? 10) + 1;
    const to      = Math.min((inferences?.current_page ?? 1) * (inferences?.per_page ?? 10), inferences?.total ?? 0);
    const pages   = getPageNumbers(inferences?.current_page ?? 1, inferences?.last_page ?? 1);
    const uniqueStates = [...new Set(rows.map((r) => r.hive_state))].sort();

    const handleExportCSV = () => {
        const header = [
            'Inference ID', 'Hive', 'Audio ID', 'Hive State',
            'Confidence Score', 'Latency (ms)', 'Analyzed At', 'Created At',
        ].join(',');
        const csvRows = rows.map((r) =>
            [
                r.inference_id,
                r.beehive?.hive_name ?? r.hive_id,
                r.audio_id ?? '',
                r.hive_state,
                fmtScore(r.confidence_score),
                r.inference_latency_ms ?? '',
                fmtDate(r.analyzed_at),
                fmtDate(r.created_at),
            ].join(',')
        );
        const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'inference_results.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/analytics', {
            onSuccess: () => { reset(); setShowModal(false); },
        });
    };

    return (
        <>
            <Head title="ML Inferences" />

            {/* ── Log Inference Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Log New Inference</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                            {/* Hive */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive *</label>
                                <select
                                    value={data.hive_id}
                                    onChange={(e) => setData('hive_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                    required
                                >
                                    <option value="">Select hive…</option>
                                    {beehives.map((b) => (
                                        <option key={b.hive_id} value={b.hive_id}>
                                            {b.hive_name} — {b.hive_location}
                                        </option>
                                    ))}
                                </select>
                                {errors.hive_id && <p className="text-xs text-red-500 mt-1">{errors.hive_id}</p>}
                            </div>

                            {/* Audio ID */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Audio ID (optional)</label>
                                <input
                                    type="text"
                                    value={data.audio_id}
                                    onChange={(e) => setData('audio_id', e.target.value)}
                                    placeholder="UUID of audio source…"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                />
                            </div>

                            {/* Hive State */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive State *</label>
                                <select
                                    value={data.hive_state}
                                    onChange={(e) => setData('hive_state', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                    required
                                >
                                    {[
                                        { value: 'normal',           label: 'Normal' },
                                        { value: 'pre_swarm',        label: 'Pre-Swarm' },
                                        { value: 'swarm',            label: 'Swarm' },
                                        { value: 'abscondence',      label: 'Abscondence' },
                                        { value: 'external_noise',   label: 'External Noise' },
                                        { value: 'pest_disturbance', label: 'Pest / Disturbance' },
                                        { value: 'uncertain',        label: 'Uncertain' },
                                    ].map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                {errors.hive_state && <p className="text-xs text-red-500 mt-1">{errors.hive_state}</p>}
                            </div>

                            {/* Confidence Score */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Confidence Score (0–1) *</label>
                                <input
                                    type="number"
                                    min="0" max="1" step="0.0001"
                                    value={data.confidence_score}
                                    onChange={(e) => setData('confidence_score', e.target.value)}
                                    placeholder="e.g. 0.8750"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                    required
                                />
                                {errors.confidence_score && <p className="text-xs text-red-500 mt-1">{errors.confidence_score}</p>}
                            </div>

                            {/* Latency */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Inference Latency (ms)</label>
                                <input
                                    type="number"
                                    min="0" step="0.01"
                                    value={data.inference_latency_ms}
                                    onChange={(e) => setData('inference_latency_ms', e.target.value)}
                                    placeholder="e.g. 142.50"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                />
                            </div>

                            {/* Analyzed At */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Analyzed At *</label>
                                <input
                                    type="datetime-local"
                                    value={data.analyzed_at}
                                    onChange={(e) => setData('analyzed_at', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                    required
                                />
                                {errors.analyzed_at && <p className="text-xs text-red-500 mt-1">{errors.analyzed_at}</p>}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                >
                                    {processing ? 'Saving…' : 'Log Inference'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="min-h-screen p-6 flex flex-col gap-6" style={{ backgroundColor: '#f8f9fa' }}>

                {/* ── Page heading ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>ML Inference Results</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Audio classification results from the hive monitoring ML engine.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#0d1b2a', color: 'white' }}
                        >
                            + Log Inference
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* ── Summary cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Inferences', value: (stats?.total ?? 0).toLocaleString(),                                                      color: '#0d1b2a' },
                        { label: 'Avg Confidence',   value: stats?.avg_confidence != null ? fmtScore(stats.avg_confidence) : '—',                      color: '#16a34a' },
                        { label: 'Avg Latency',      value: stats?.avg_latency    != null ? `${Number(stats.avg_latency).toFixed(1)} ms` : '—',        color: '#d97706' },
                        { label: 'Flagged (Swarm)',  value: (stats?.swarm_count ?? 0).toLocaleString(),                                                color: '#dc2626' },
                    ].map((c) => (
                        <div key={c.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{c.label}</p>
                            <p className="text-3xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Filters ── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        placeholder="Search by hive, state, or ID…"
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-amber-400 w-72"
                        style={{ color: '#0d1b2a' }}
                    />
                    <select
                        value={stateFilter}
                        onChange={(e) => { setStateFilter(e.target.value); applyFilters({ state: e.target.value }); }}
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-amber-400"
                        style={{ color: '#0d1b2a' }}
                    >
                        <option value="">All States</option>
                        {['swarm','pre_swarm','external_noise','normal','abscondence','pest_disturbance','uncertain'].map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                    {(search || stateFilter) && (
                        <button
                            onClick={() => { setSearch(''); setStateFilter(''); applyFilters({ search: '', state: '' }); }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                            Clear filters
                        </button>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                        {inferences?.total ?? 0} record{(inferences?.total ?? 0) !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={inferences?.data ?? []}
                        getRowId={(row) => row.inference_id}
                    />
                </div>

            </div>
        </>
    );
}

Inferences.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard',    href: '/dashboard' },
        { title: 'ML Inference Results', href: '/analytics' },
    ]}>
        {page}
    </AppLayout>
);
