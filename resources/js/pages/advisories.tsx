import { Head, useForm } from '@inertiajs/react';
import { CheckSquare, ClipboardList, MessageSquareWarning, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

type Template = {
    template_id: number;
    prediction_code: number;
    hive_state: string;
    advisory_type: string;
    severity: string;
    min_confidence_threshold: number | null;
    description: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type Advisory = {
    advisory_id: string;
    template_id: number;
    action_title: string;
    action_description: string;
    priority_level: string;
    confidence_threshold_min: number;
    confidence_threshold_max: number;
    action_order: number;
    is_active: boolean;
    created_at: string | null;
    template?: { template_id: number; hive_state: string } | null;
};

type ActionItem = {
    action_id: string;
    hive_id: string;
    action_title: string;
    action_description: string;
    priority_level: string;
    confidence_score: number | null;
    status: string;
    completed_at: string | null;
    notes: string | null;
    created_at: string | null;
    hive?: { hive_id: string; hive_name: string | null; hive_location: string } | null;
};

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    pending:     { label: 'Pending',     bg: '#fff7ed', color: '#c2410c' },
    in_progress: { label: 'In Progress', bg: '#eff6ff', color: '#1d4ed8' },
    completed:   { label: 'Completed',   bg: '#f0fdf4', color: '#16a34a' },
    resolved:    { label: 'Resolved',    bg: '#f0fdf4', color: '#16a34a' },
};

const severityConfig: Record<string, { label: string; bg: string; color: string }> = {
    info:     { label: 'Info',     bg: '#f1f5f9', color: '#64748b' },
    low:      { label: 'Low',      bg: '#f0fdf4', color: '#16a34a' },
    medium:   { label: 'Medium',   bg: '#fffbeb', color: '#d97706' },
    high:     { label: 'High',     bg: '#fff7ed', color: '#f5a623' },
    critical: { label: 'Critical', bg: '#0d1b2a', color: '#ffffff' },
};

const priorityConfig: Record<string, { label: string; bg: string; color: string }> = {
    low:    { label: 'Low',    bg: '#f0fdf4', color: '#16a34a' },
    medium: { label: 'Medium', bg: '#fffbeb', color: '#d97706' },
    high:   { label: 'High',   bg: '#fff7ed', color: '#f5a623' },
};

function fmtPct(v: number | null) {
    return v == null ? '—' : `${(v * 100).toFixed(0)}%`;
}

function fmtDate(v: string | null) {
    if (!v) return '—';
    return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Advisories({
    templates = [],
    advisories = [],
    actions = [],
}: {
    templates?: Template[];
    advisories?: Advisory[];
    actions?: ActionItem[];
}) {
    const [tab, setTab] = useState<'templates' | 'advisories' | 'actions'>('templates');
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, reset, processing, errors } = useForm({
        prediction_code: '',
        hive_state: '',
        advisory_type: '',
        severity: '',
        min_confidence_threshold: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/advisories', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    return (
        <>
            <Head title="Advisories" />
            <div className="min-h-screen p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Page heading */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>Advisories</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {templates.length} template{templates.length !== 1 ? 's' : ''} · {advisories.length} advisor{advisories.length !== 1 ? 'ies' : 'y'} · {actions.length} triggered action{actions.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {tab === 'templates' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            <Plus className="w-4 h-4" /> Add Template
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 shadow-sm p-1 w-fit">
                    <button
                        onClick={() => setTab('templates')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={tab === 'templates' ? { backgroundColor: '#0d1b2a', color: '#ffffff' } : { color: '#64748b' }}
                    >
                        <MessageSquareWarning className="w-4 h-4" />
                        Templates
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={tab === 'templates' ? { backgroundColor: '#f5a623', color: '#0d1b2a' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                            {templates.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setTab('advisories')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={tab === 'advisories' ? { backgroundColor: '#0d1b2a', color: '#ffffff' } : { color: '#64748b' }}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Advisories
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={tab === 'advisories' ? { backgroundColor: '#f5a623', color: '#0d1b2a' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                            {advisories.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setTab('actions')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={tab === 'actions' ? { backgroundColor: '#0d1b2a', color: '#ffffff' } : { color: '#64748b' }}
                    >
                        <CheckSquare className="w-4 h-4" />
                        Advisory Actions
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={tab === 'actions' ? { backgroundColor: '#f5a623', color: '#0d1b2a' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                            {actions.length}
                        </span>
                    </button>
                </div>

                {/* ── Templates tab ── */}
                {tab === 'templates' && (
                    templates.length === 0 ? (
                        <EmptyState
                            label="No advisory templates yet"
                            hint="Add your first template to get started"
                            onAdd={() => setShowModal(true)}
                        />
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        {['Code', 'Hive State', 'Type', 'Severity', 'Min Confidence', 'Description', 'Created'].map((h) => (
                                            <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map((t) => {
                                        const sc = severityConfig[t.severity] ?? severityConfig.medium;
                                        return (
                                            <tr key={t.template_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-4 font-mono text-xs font-semibold whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                                                    #{t.prediction_code}
                                                </td>
                                                <td className="px-5 py-4 text-sm font-medium whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                                                    {t.hive_state}
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{t.advisory_type}</td>
                                                <td className="px-5 py-4">
                                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest whitespace-nowrap"
                                                        style={{ backgroundColor: sc.bg, color: sc.color }}>
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-semibold tabular-nums whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                                                    {fmtPct(t.min_confidence_threshold)}
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-500 max-w-xs">{t.description ?? '—'}</td>
                                                <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(t.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {/* ── Advisories tab ── */}
                {tab === 'advisories' && (
                    advisories.length === 0 ? (
                        <EmptyState
                            label="No advisory actions yet"
                            hint="Advisory actions are created per template and appear here"
                        />
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        {['Hive State', 'Action Title', 'Description', 'Priority', 'Confidence Range', 'Order', 'Active', 'Created'].map((h) => (
                                            <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {advisories.map((a) => {
                                        const pc = priorityConfig[a.priority_level] ?? priorityConfig.medium;
                                        return (
                                            <tr key={a.advisory_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-4 text-sm font-medium whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                                                    {a.template?.hive_state ?? `#${a.template_id}`}
                                                </td>
                                                <td className="px-5 py-4 text-sm font-medium whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                                                    {a.action_title}
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-500 max-w-sm">{a.action_description}</td>
                                                <td className="px-5 py-4">
                                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest whitespace-nowrap"
                                                        style={{ backgroundColor: pc.bg, color: pc.color }}>
                                                        {pc.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                                                    {fmtPct(a.confidence_threshold_min)} – {fmtPct(a.confidence_threshold_max)}
                                                </td>
                                                <td className="px-5 py-4 text-xs tabular-nums text-gray-500">{a.action_order}</td>
                                                <td className="px-5 py-4">
                                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest whitespace-nowrap"
                                                        style={a.is_active
                                                            ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
                                                            : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                                                        {a.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(a.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {/* ── Advisory Actions tab ── */}
                {tab === 'actions' && (
                    actions.length === 0 ? (
                        <EmptyState
                            label="No advisory actions triggered yet"
                            hint="Actions are created automatically when an inference triggers an advisory"
                        />
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        {['Hive', 'Action Title', 'Description', 'Priority', 'Confidence', 'Status', 'Completed', 'Created'].map((h) => (
                                            <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {actions.map((a) => {
                                        const pc = priorityConfig[a.priority_level] ?? priorityConfig.medium;
                                        const sc = statusConfig[a.status] ?? statusConfig.pending;
                                        return (
                                            <tr key={a.action_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-4 text-sm font-medium whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                                                    {a.hive?.hive_name ?? a.hive?.hive_location ?? '—'}
                                                </td>
                                                <td className="px-5 py-4 text-sm font-medium whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                                                    {a.action_title}
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-500 max-w-sm">{a.action_description}</td>
                                                <td className="px-5 py-4">
                                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest whitespace-nowrap"
                                                        style={{ backgroundColor: pc.bg, color: pc.color }}>
                                                        {pc.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs font-semibold tabular-nums whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                                                    {fmtPct(a.confidence_score)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest whitespace-nowrap"
                                                        style={{ backgroundColor: sc.bg, color: sc.color }}>
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(a.completed_at)}</td>
                                                <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(a.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* Add Template Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Add Advisory Template</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Prediction Code</label>
                                <input type="number" step="any" value={data.prediction_code} onChange={(e) => setData('prediction_code', e.target.value)}
                                    placeholder="e.g. 2"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300" required />
                                {errors.prediction_code && <p className="text-xs text-red-500 mt-1">{errors.prediction_code}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive State</label>
                                <input type="text" value={data.hive_state} onChange={(e) => setData('hive_state', e.target.value)}
                                    placeholder="e.g. swarm"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300" required />
                                {errors.hive_state && <p className="text-xs text-red-500 mt-1">{errors.hive_state}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Advisory Type</label>
                                <input type="text" value={data.advisory_type} onChange={(e) => setData('advisory_type', e.target.value)}
                                    placeholder="e.g. Reactive"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300" required />
                                {errors.advisory_type && <p className="text-xs text-red-500 mt-1">{errors.advisory_type}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Severity</label>
                                <select value={data.severity} onChange={(e) => setData('severity', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="">Select severity</option>
                                    <option value="info">Info</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                                {errors.severity && <p className="text-xs text-red-500 mt-1">{errors.severity}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Min Confidence Threshold (0–1)</label>
                                <input type="number" min="0" max="1" step="0.01" value={data.min_confidence_threshold} onChange={(e) => setData('min_confidence_threshold', e.target.value)}
                                    placeholder="e.g. 0.70"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300" />
                                {errors.min_confidence_threshold && <p className="text-xs text-red-500 mt-1">{errors.min_confidence_threshold}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Description</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe this advisory condition..."
                                    rows={3}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300 resize-none" />
                                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={processing}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                    {processing ? 'Saving…' : 'Save Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function EmptyState({ label, hint, onAdd }: { label: string; hint: string; onAdd?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 py-20 text-center shadow-sm">
            <div className="rounded-full p-4 mb-3" style={{ backgroundColor: '#fff7ed' }}>
                <MessageSquareWarning className="h-8 w-8" style={{ color: '#f5a623' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>{label}</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">{hint}</p>
            {onAdd && (
                <button onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                    <Plus className="w-4 h-4" /> Add Template
                </button>
            )}
        </div>
    );
}

Advisories.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Advisories', href: '/advisories' },
    ]}>
        {page}
    </AppLayout>
);
