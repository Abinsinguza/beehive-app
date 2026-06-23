import { Head, useForm } from '@inertiajs/react';
import { CheckSquare, ClipboardList, Edit2, MessageSquareWarning, Plus, Trash2, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { formatDisplayText, cleanDataArray } from '@/lib/utils';
import { toSentenceCase } from '@/lib/format-text';

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
    const [editTemplate, setEditTemplate] = useState<Template | null>(null);
    const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [editItem, setEditItem] = useState<Advisory | null>(null);
    const [deleteItem, setDeleteItem] = useState<Advisory | null>(null);

    // Clean incoming data
    const cleanedTemplates = useMemo(() => {
        return cleanDataArray(templates, ['hive_state', 'advisory_type', 'description']);
    }, [templates]);

    const cleanedAdvisories = useMemo(() => {
        return cleanDataArray(advisories, ['template.hive_state', 'action_title', 'action_description']);
    }, [advisories]);

    const cleanedActions = useMemo(() => {
        return cleanDataArray(actions, ['hive.hive_name', 'hive.hive_location', 'action_title', 'action_description']);
    }, [actions]);

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

    const { delete: destroy, processing: deleting } = useForm({});
    const confirmDeleteTemplate = () => {
        if (!deleteTemplate) return;
        destroy(`/advisories/${deleteTemplate.template_id}`, { onSuccess: () => setDeleteTemplate(null) });
    };
    const confirmDeleteItem = () => {
        if (!deleteItem) return;
        destroy(`/advisory-items/${deleteItem.advisory_id}`, { onSuccess: () => setDeleteItem(null) });
    };

    // --- Templates MRT columns ---
    const templateColumns = useMemo<MRT_ColumnDef<Template>[]>(() => [
        {
            accessorKey: 'prediction_code',
            header: 'Code',
            size: 70,
            Cell: ({ cell }) => (
                <span className="font-mono text-xs font-semibold" style={{ color: '#0d1b2a' }}>
                    #{cell.getValue<number>()}
                </span>
            ),
        },
        {
            accessorKey: 'hive_state',
            header: 'Hive State',
            size: 130,
            Cell: ({ cell }) => (
                <span className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                    {toSentenceCase(cell.getValue<string>())}
                </span>
            ),
        },
        {
            accessorKey: 'advisory_type',
            header: 'Type',
            size: 100,
            Cell: ({ cell }) => (
                <span className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                    {toSentenceCase(cell.getValue<string>())}
                </span>
            ),
        },
        {
            accessorKey: 'severity',
            header: 'Severity',
            filterVariant: 'select',
            filterSelectOptions: [
                { text: 'Info', value: 'info' },
                { text: 'Low', value: 'low' },
                { text: 'Medium', value: 'medium' },
                { text: 'High', value: 'high' },
                { text: 'Critical', value: 'critical' },
            ],
            size: 100,
            Cell: ({ cell }) => {
                const sc = severityConfig[cell.getValue<string>()] ?? severityConfig.medium;
                return (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded tracking-widest"
                        style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {sc.label}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            enableSorting: false,
            enableColumnFilter: false,
            size: 90,
            Cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <button onClick={() => setEditTemplate(row.original)}
                        className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="Edit template">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTemplate(row.original)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete template">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ),
        },
    ], []);

    const renderTemplateDetailPanel = ({ row }: { row: any }) => {
        const tpl = row.original as Template;
        return (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Description</p>
                        <p className="text-sm leading-snug" style={{ color: '#0d1b2a' }}>{tpl.description ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Min Confidence</p>
                        <p className="text-sm" style={{ color: '#0d1b2a' }}>{fmtPct(tpl.min_confidence_threshold)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Created</p>
                        <p className="text-sm" style={{ color: '#0d1b2a' }}>{fmtDate(tpl.created_at)}</p>
                    </div>
                </div>
            </div>
        );
    };

    // --- Advisories MRT columns ---
    const advisoryColumns = useMemo<MRT_ColumnDef<Advisory>[]>(() => [
        {
            id: 'hive_state',
            accessorKey: 'template.hive_state',
            header: 'Hive State',
            size: 130,
            Cell: ({ row }) => (
                <span className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                    {toSentenceCase(row.original.template?.hive_state ?? `#${row.original.template_id}`)}
                </span>
            ),
        },
        {
            accessorKey: 'action_title',
            header: 'Action Title',
            size: 180,
            Cell: ({ cell }) => (
                <span className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                    {cell.getValue<string>()}
                </span>
            ),
        },
        {
            accessorKey: 'priority_level',
            header: 'Priority',
            filterVariant: 'select',
            filterSelectOptions: [
                { text: 'Low', value: 'low' },
                { text: 'Medium', value: 'medium' },
                { text: 'High', value: 'high' },
            ],
            size: 100,
            Cell: ({ cell }) => {
                const pc = priorityConfig[cell.getValue<string>()] ?? priorityConfig.medium;
                return (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded tracking-widest"
                        style={{ backgroundColor: pc.bg, color: pc.color }}>
                        {pc.label}
                    </span>
                );
            },
        },
        {
            accessorKey: 'is_active',
            header: 'Active',
            filterVariant: 'select',
            filterSelectOptions: [
                { text: 'Active', value: true },
                { text: 'Inactive', value: false },
            ],
            size: 90,
            Cell: ({ cell }) => (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded tracking-widest"
                    style={cell.getValue<boolean>()
                        ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
                        : { backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
                    {cell.getValue<boolean>() ? 'Active' : 'Inactive'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            enableSorting: false,
            enableColumnFilter: false,
            size: 90,
            Cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <button onClick={() => setEditItem(row.original)}
                        className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="Edit advisory">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteItem(row.original)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete advisory">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ),
        },
    ], []);

    const renderAdvisoryDetailPanel = ({ row }: { row: any }) => {
        const adv = row.original as Advisory;
        return (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Description</p>
                        <p className="text-sm leading-snug" style={{ color: '#0d1b2a' }}>{adv.action_description ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Confidence Range</p>
                        <p className="text-sm" style={{ color: '#0d1b2a' }}>{fmtPct(adv.confidence_threshold_min)} – {fmtPct(adv.confidence_threshold_max)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Order</p>
                        <p className="text-sm" style={{ color: '#0d1b2a' }}>{adv.action_order ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Created</p>
                        <p className="text-sm" style={{ color: '#0d1b2a' }}>{fmtDate(adv.created_at)}</p>
                    </div>
                </div>
            </div>
        );
    };

    // --- Advisory Actions MRT columns ---
    const actionColumns = useMemo<MRT_ColumnDef<ActionItem>[]>(() => [
        {
            id: 'hive',
            header: 'Hive',
            accessorKey: 'hive.hive_name',
            size: 140,
            Cell: ({ row }) => (
                <span className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                    {row.original.hive?.hive_name ?? row.original.hive?.hive_location ?? '—'}
                </span>
            ),
        },
        {
            accessorKey: 'action_title',
            header: 'Action Title',
            size: 180,
            Cell: ({ cell }) => (
                <span className="text-sm font-medium" style={{ color: '#0d1b2a' }}>
                    {cell.getValue<string>()}
                </span>
            ),
        },
        {
            accessorKey: 'priority_level',
            header: 'Priority',
            filterVariant: 'select',
            filterSelectOptions: [
                { text: 'Low', value: 'low' },
                { text: 'Medium', value: 'medium' },
                { text: 'High', value: 'high' },
            ],
            size: 100,
            Cell: ({ cell }) => {
                const pc = priorityConfig[cell.getValue<string>()] ?? priorityConfig.medium;
                return (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded tracking-widest"
                        style={{ backgroundColor: pc.bg, color: pc.color }}>
                        {pc.label}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            filterVariant: 'select',
            filterSelectOptions: [
                { text: 'Pending', value: 'pending' },
                { text: 'In Progress', value: 'in_progress' },
                { text: 'Completed', value: 'completed' },
                { text: 'Resolved', value: 'resolved' },
            ],
            size: 120,
            Cell: ({ cell }) => {
                const sc = statusConfig[cell.getValue<string>()] ?? statusConfig.pending;
                return (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded tracking-widest"
                        style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {sc.label}
                    </span>
                );
            },
        },
    ], []);

    const renderActionDetailPanel = ({ row }: { row: any }) => {
        const action = row.original as ActionItem;
        return (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Description</p>
                        <p className="text-sm leading-snug" style={{ color: '#0d1b2a' }}>{action.action_description ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Confidence</p>
                        <p className="text-sm" style={{ color: '#0d1b2a' }}>{fmtPct(action.confidence_score)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Created</p>
                        <p className="text-sm" style={{ color: '#0d1b2a' }}>{fmtDate(action.created_at)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Completed</p>
                        <p className="text-sm" style={{ color: '#0d1b2a' }}>{fmtDate(action.completed_at)}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="Advisories" />
            <div className="p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Page heading */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>Advisories</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {cleanedTemplates.length} template{cleanedTemplates.length !== 1 ? 's' : ''} · {cleanedAdvisories.length} advisor{cleanedAdvisories.length !== 1 ? 'ies' : 'y'} · {cleanedActions.length} triggered action{cleanedActions.length !== 1 ? 's' : ''}
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
                    {tab === 'advisories' && (
                        <button
                            onClick={() => setShowAddItem(true)}
                            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            <Plus className="w-4 h-4" /> Add Advisory
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
                            {cleanedTemplates.length}
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
                            {cleanedAdvisories.length}
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
                            {cleanedActions.length}
                        </span>
                    </button>
                </div>

                {/* ── Templates tab ── */}
                {tab === 'templates' && (
                    cleanedTemplates.length === 0 ? (
                        <EmptyState
                            label="No advisory templates yet"
                            hint="Add your first template to get started"
                            onAdd={() => setShowModal(true)}
                        />
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <DataTable
                                columns={templateColumns}
                                data={cleanedTemplates}
                                getRowId={(row) => String(row.template_id)}
                                renderDetailPanel={renderTemplateDetailPanel}
                            />
                        </div>
                    )
                )}

                {/* ── Advisories tab ── */}
                {tab === 'advisories' && (
                    cleanedAdvisories.length === 0 ? (
                        <EmptyState
                            label="No advisories yet"
                            hint="Add your first advisory action to get started"
                            onAdd={() => setShowAddItem(true)}
                            addLabel="Add Advisory"
                        />
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <DataTable
                                columns={advisoryColumns}
                                data={cleanedAdvisories}
                                getRowId={(row) => row.advisory_id}
                                renderDetailPanel={renderAdvisoryDetailPanel}
                            />
                        </div>
                    )
                )}

                {/* ── Advisory Actions tab ── */}
                {tab === 'actions' && (
                    cleanedActions.length === 0 ? (
                        <EmptyState
                            label="No advisory actions triggered yet"
                            hint="Actions are created automatically when an inference triggers an advisory"
                        />
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <DataTable
                                columns={actionColumns}
                                data={cleanedActions}
                                getRowId={(row) => row.action_id}
                                renderDetailPanel={renderActionDetailPanel}
                            />
                        </div>
                    )
                )}
            </div>

            {/* Add Template Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 modal-overlay">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl modal-content overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                            <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Add Advisory Template</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Prediction Code</label>
                                <input type="number" step="any" value={data.prediction_code} onChange={(e) => setData('prediction_code', e.target.value)}
                                    placeholder="e.g. 2"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none placeholder-gray-300 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required style={{ color: '#0d1b2a' }} />
                                {errors.prediction_code && <p className="text-xs text-red-500 mt-1">{errors.prediction_code}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive State</label>
                                <input type="text" value={data.hive_state} onChange={(e) => setData('hive_state', e.target.value)}
                                    placeholder="e.g. swarm"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none placeholder-gray-300 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required style={{ color: '#0d1b2a' }} />
                                {errors.hive_state && <p className="text-xs text-red-500 mt-1">{errors.hive_state}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Advisory Type</label>
                                <input type="text" value={data.advisory_type} onChange={(e) => setData('advisory_type', e.target.value)}
                                    placeholder="e.g. Reactive"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none placeholder-gray-300 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required style={{ color: '#0d1b2a' }} />
                                {errors.advisory_type && <p className="text-xs text-red-500 mt-1">{errors.advisory_type}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Severity</label>
                                <select value={data.severity} onChange={(e) => setData('severity', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none bg-white transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20 required" style={{ color: '#0d1b2a' }}>
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
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none placeholder-gray-300 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" style={{ color: '#0d1b2a' }} />
                                {errors.min_confidence_threshold && <p className="text-xs text-red-500 mt-1">{errors.min_confidence_threshold}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Description</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Describe this advisory condition..."
                                    rows={3}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none placeholder-gray-300 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20 resize-none" style={{ color: '#0d1b2a' }} />
                                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-400 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={processing}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                    {processing ? 'Saving…' : 'Save Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Template Modal */}
            {editTemplate && (
                <EditTemplateModal template={editTemplate} onClose={() => setEditTemplate(null)} />
            )}

            {/* Add Advisory Modal */}
            {showAddItem && (
                <AdvisoryItemModal templates={cleanedTemplates} onClose={() => setShowAddItem(false)} />
            )}

            {/* Edit Advisory Modal */}
            {editItem && (
                <AdvisoryItemModal templates={cleanedTemplates} item={editItem} onClose={() => setEditItem(null)} />
            )}

            {/* Delete Template confirmation */}
            {deleteTemplate && (
                <ConfirmDeleteModal
                    title="Delete Advisory Template"
                    message={`Delete the "${deleteTemplate.hive_state}" template? This cannot be undone.`}
                    processing={deleting}
                    onCancel={() => setDeleteTemplate(null)}
                    onConfirm={confirmDeleteTemplate}
                />
            )}

            {/* Delete Advisory confirmation */}
            {deleteItem && (
                <ConfirmDeleteModal
                    title="Delete Advisory"
                    message={`Delete "${deleteItem.action_title}"? This cannot be undone.`}
                    processing={deleting}
                    onCancel={() => setDeleteItem(null)}
                    onConfirm={confirmDeleteItem}
                />
            )}
        </>
    );
}

// ── Edit Template modal ──────────────────────────────────────────
function EditTemplateModal({ template, onClose }: { template: Template; onClose: () => void }) {
    const { data, setData, patch, processing, errors } = useForm({
        prediction_code: String(template.prediction_code),
        hive_state: template.hive_state,
        advisory_type: template.advisory_type,
        severity: template.severity,
        min_confidence_threshold: template.min_confidence_threshold != null ? String(template.min_confidence_threshold) : '',
        description: template.description ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/advisories/${template.template_id}`, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 modal-overlay">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl modal-content overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Edit Advisory Template</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={submit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Prediction Code</label>
                        <input type="number" step="any" value={data.prediction_code} onChange={(e) => setData('prediction_code', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required />
                        {errors.prediction_code && <p className="text-xs text-red-500 mt-1">{errors.prediction_code}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive State</label>
                        <input type="text" value={data.hive_state} onChange={(e) => setData('hive_state', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required />
                        {errors.hive_state && <p className="text-xs text-red-500 mt-1">{errors.hive_state}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Advisory Type</label>
                        <input type="text" value={data.advisory_type} onChange={(e) => setData('advisory_type', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required />
                        {errors.advisory_type && <p className="text-xs text-red-500 mt-1">{errors.advisory_type}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Severity</label>
                        <select value={data.severity} onChange={(e) => setData('severity', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required>
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
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" />
                        {errors.min_confidence_threshold && <p className="text-xs text-red-500 mt-1">{errors.min_confidence_threshold}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Description</label>
                        <textarea value={data.description} onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 resize-none transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={processing}
                            className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Add/Edit Advisory item modal ─────────────────────────────────
function AdvisoryItemModal({ templates, item, onClose }: { templates: Template[]; item?: Advisory; onClose: () => void }) {
    const { data, setData, post, patch, processing, errors } = useForm({
        template_id: item ? String(item.template_id) : '',
        action_title: item?.action_title ?? '',
        action_description: item?.action_description ?? '',
        priority_level: item?.priority_level ?? 'medium',
        confidence_threshold_min: item ? String(item.confidence_threshold_min) : '',
        confidence_threshold_max: item ? String(item.confidence_threshold_max) : '',
        action_order: item ? String(item.action_order) : '1',
        is_active: item ? item.is_active : true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (item) {
            patch(`/advisory-items/${item.advisory_id}`, { onSuccess: () => onClose() });
        } else {
            post('/advisory-items', { onSuccess: () => onClose() });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 modal-overlay">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl modal-content overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>{item ? 'Edit Advisory' : 'Add Advisory'}</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={submit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive State Template</label>
                        <select value={data.template_id} onChange={(e) => setData('template_id', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required>
                            <option value="">Select template…</option>
                            {templates.map((t) => (
                                <option key={t.template_id} value={t.template_id}>{t.hive_state}</option>
                            ))}
                        </select>
                        {errors.template_id && <p className="text-xs text-red-500 mt-1">{errors.template_id}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Action Title</label>
                        <input type="text" value={data.action_title} onChange={(e) => setData('action_title', e.target.value)}
                            placeholder="e.g. Inspect for Overcrowding"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required />
                        {errors.action_title && <p className="text-xs text-red-500 mt-1">{errors.action_title}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Action Description</label>
                        <textarea value={data.action_description} onChange={(e) => setData('action_description', e.target.value)}
                            rows={3}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 resize-none transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required />
                        {errors.action_description && <p className="text-xs text-red-500 mt-1">{errors.action_description}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Priority</label>
                        <select value={data.priority_level} onChange={(e) => setData('priority_level', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        {errors.priority_level && <p className="text-xs text-red-500 mt-1">{errors.priority_level}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Min Confidence</label>
                            <input type="number" min="0" max="1" step="0.01" value={data.confidence_threshold_min} onChange={(e) => setData('confidence_threshold_min', e.target.value)}
                                placeholder="0.70"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required />
                            {errors.confidence_threshold_min && <p className="text-xs text-red-500 mt-1">{errors.confidence_threshold_min}</p>}
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Max Confidence</label>
                            <input type="number" min="0" max="1" step="0.01" value={data.confidence_threshold_max} onChange={(e) => setData('confidence_threshold_max', e.target.value)}
                                placeholder="1.00"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required />
                            {errors.confidence_threshold_max && <p className="text-xs text-red-500 mt-1">{errors.confidence_threshold_max}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Order</label>
                        <input type="number" min="1" step="1" value={data.action_order} onChange={(e) => setData('action_order', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 transition-all focus:border-[#f5a623] focus:ring-2 focus:ring-[#f5a623]/20" required />
                        {errors.action_order && <p className="text-xs text-red-500 mt-1">{errors.action_order}</p>}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded" />
                        <span className="text-sm text-gray-600">Active</span>
                    </label>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={processing}
                            className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                            {processing ? 'Saving…' : item ? 'Save Changes' : 'Add Advisory'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Generic delete confirmation modal ────────────────────────────
function ConfirmDeleteModal({ title, message, processing, onCancel, onConfirm }: {
    title: string; message: string; processing: boolean; onCancel: () => void; onConfirm: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 modal-overlay">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 flex flex-col gap-4 modal-content">
                <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>{title}</h2>
                <p className="text-sm text-gray-500">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={processing}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                        style={{ backgroundColor: '#dc2626' }}>
                        {processing ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ label, hint, onAdd, addLabel = 'Add Template' }: { label: string; hint: string; onAdd?: () => void; addLabel?: string }) {
    return (
        <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 py-20 text-center shadow-sm">
            <div className="rounded-full p-4 mb-3" style={{ backgroundColor: '#fff7ed' }}>
                <MessageSquareWarning className="h-8 w-8" style={{ color: '#f5a623' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>{label}</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">{hint}</p>
            {onAdd && (
                <button onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                    <Plus className="w-4 h-4" /> {addLabel}
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
