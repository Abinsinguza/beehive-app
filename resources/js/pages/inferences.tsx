import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import React, { useState } from 'react';
import { X } from 'lucide-react';

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

type Props = {
    inferences: Inference[];
    beehives: Beehive[];
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

export default function Inferences({ inferences = [], beehives = [] }: Props) {
    const [search, setSearch] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        hive_id: '',
        audio_id: '',
        hive_state: 'Normal',
        confidence_score: '',
        inference_latency_ms: '',
        analyzed_at: '',
    });

    const filtered = inferences.filter((r) => {
        const hiveName = r.beehive?.hive_name ?? '';
        const matchSearch =
            hiveName.toLowerCase().includes(search.toLowerCase()) ||
            r.hive_state.toLowerCase().includes(search.toLowerCase()) ||
            r.inference_id.toLowerCase().includes(search.toLowerCase());
        const matchState = stateFilter ? r.hive_state === stateFilter : true;
        return matchSearch && matchState;
    });

    const handleExportCSV = () => {
        const header = [
            'Inference ID', 'Hive', 'Audio ID', 'Hive State',
            'Confidence Score', 'Latency (ms)', 'Analyzed At', 'Created At',
        ].join(',');
        const rows = filtered.map((r) =>
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
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'inference_results.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inferences', {
            onSuccess: () => { reset(); setShowModal(false); },
        });
    };

    const uniqueStates = [...new Set(inferences.map((r) => r.hive_state))].sort();

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
                        { label: 'Total Inferences',  value: inferences.length.toLocaleString(),  color: '#0d1b2a' },
                        { label: 'Avg Confidence',    value: inferences.length ? fmtScore(inferences.reduce((s, r) => s + r.confidence_score, 0) / inferences.length) : '—', color: '#16a34a' },
                        { label: 'Avg Latency',       value: (() => { const vals = inferences.filter(r => r.inference_latency_ms != null); return vals.length ? `${(vals.reduce((s, r) => s + r.inference_latency_ms!, 0) / vals.length).toFixed(1)} ms` : '—'; })(), color: '#d97706' },
                        { label: 'Flagged (Swarm)', value: inferences.filter(r => r.hive_state === 'swarm' || r.hive_state === 'pre_swarm').length.toLocaleString(), color: '#dc2626' },
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
                        placeholder="Search by hive, state, or ID…"
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-amber-400 w-72"
                        style={{ color: '#0d1b2a' }}
                    />
                    <select
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-amber-400"
                        style={{ color: '#0d1b2a' }}
                    >
                        <option value="">All States</option>
                        {uniqueStates.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {(search || stateFilter) && (
                        <button
                            onClick={() => { setSearch(''); setStateFilter(''); }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                            Clear filters
                        </button>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-xs min-w-225">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                {[
                                    '#',
                                    'Inference ID',
                                    'Hive',
                                    'Audio ID',
                                    'Hive State',
                                    'Confidence Score',
                                    'Latency (ms)',
                                    'Analyzed At',
                                    'Created At',
                                ].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                                        No inference records found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((r, idx) => {
                                    const style = stateStyle(r.hive_state);
                                    return (
                                        <tr
                                            key={r.inference_id}
                                            className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                        >
                                            {/* # */}
                                            <td className="px-4 py-3 text-gray-400 tabular-nums">{idx + 1}</td>

                                            {/* Inference ID */}
                                            <td className="px-4 py-3 font-mono text-gray-500" title={r.inference_id}>
                                                {shortId(r.inference_id)}
                                            </td>

                                            {/* Hive */}
                                            <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                                                {r.beehive ? (
                                                    <div>
                                                        <p>{r.beehive.hive_name}</p>
                                                        <p className="text-[10px] text-gray-400 font-normal">{r.beehive.hive_location}</p>
                                                    </div>
                                                ) : (
                                                    <span className="font-mono text-gray-400" title={r.hive_id}>{shortId(r.hive_id)}</span>
                                                )}
                                            </td>

                                            {/* Audio ID */}
                                            <td className="px-4 py-3 font-mono text-gray-400" title={r.audio_id ?? ''}>
                                                {r.audio_id ? shortId(r.audio_id) : '—'}
                                            </td>

                                            {/* Hive State */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest whitespace-nowrap"
                                                    style={{ backgroundColor: style.bg, color: style.text }}
                                                >
                                                    {r.hive_state}
                                                </span>
                                            </td>

                                            {/* Confidence Score */}
                                            <td className="px-4 py-3">
                                                <span className="font-bold tabular-nums" style={{ color: scoreColor(r.confidence_score) }}>
                                                    {fmtScore(r.confidence_score)}
                                                </span>
                                            </td>

                                            {/* Latency */}
                                            <td className="px-4 py-3 tabular-nums text-gray-600">
                                                {r.inference_latency_ms != null ? `${r.inference_latency_ms.toFixed(2)}` : '—'}
                                            </td>

                                            {/* Analyzed At */}
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {fmtDate(r.analyzed_at)}
                                            </td>

                                            {/* Created At */}
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {fmtDate(r.created_at)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
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
