import { Head, router } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, Download, Info } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import AppLayout from '@/layouts/app-layout';
import { DataTable } from '@/components/data-table';
import { toSentenceCase, toTitleCase } from '@/lib/format-text';

interface Log {
    log_id: string;
    level: string;
    event_type: string;
    message: string;
    details: Record<string, unknown> | null;
    hive_name: string | null;
    user_name: string | null;
    created_at: string;
}

interface Paginator {
    data: Log[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    logs: Paginator;
    stats: { total: number; errors: number; warnings: number; info: number };
    eventTypes: string[];
    filters: { level: string; eventType: string };
}

const levelConfig: Record<string, { badge: string; dot: string; icon: React.ReactNode; label: string }> = {
    error: {
        badge: 'text-red-700',
        dot: '#ef4444',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: 'Error',
    },
    warning: {
        badge: 'text-yellow-700',
        dot: '#f59e0b',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        label: 'Warning',
    },
    info: {
        badge: 'text-blue-700',
        dot: '#3b82f6',
        icon: <Info className="w-3.5 h-3.5" />,
        label: 'Info',
    },
};

function fmt(iso: string) {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
}

function getPageNumbers(current: number, last: number): (number | '…')[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '…', last];
    if (current >= last - 3) return [1, '…', last - 4, last - 3, last - 2, last - 1, last];
    return [1, '…', current - 1, current, current + 1, '…', last];
}

export default function SystemLogs({ logs, stats, eventTypes, filters }: Props) {
    const [level, setLevel]           = useState(filters.level);
    const [eventType, setEventType]   = useState(filters.eventType);
    const [expanded, setExpanded]     = useState<string | null>(null);

    const columns = useMemo<MRT_ColumnDef<Log>[]>(() => [
        {
            accessorKey: 'created_at',
            header: 'Time',
            enableSorting: true,
            enableColumnFilter: false,
            size: 120,
            Cell: ({ row }) => {
                const { date, time } = fmt(row.original.created_at);
                return (
                    <div>
                        <span className="block font-mono text-gray-700">{time}</span>
                        <span className="block text-gray-400">{date}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'level',
            header: 'Level',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['', 'error', 'warning', 'info'],
            size: 100,
            Cell: ({ row }) => {
                const cfg = levelConfig[row.original.level] ?? levelConfig.info;
                return (
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${cfg.badge}`}
                        style={{ backgroundColor: `${cfg.dot}15` }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: cfg.dot }}
                        />
                        {toSentenceCase(row.original.level)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'event_type',
            header: 'Event',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['', ...eventTypes],
            size: 140,
            Cell: ({ row }) => (
                <span className="font-mono text-[11px] px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-600 whitespace-nowrap">
                    {toSentenceCase(row.original.event_type) ?? '—'}
                </span>
            ),
        },
    ], [eventTypes]);

    const renderDetailPanel = ({ row }: { row: any }) => {
        const log = row.original as Log;
        return (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Message</p>
                        <p className="text-sm text-gray-700 leading-snug">{toSentenceCase(log.message)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Hive</p>
                        {log.hive_name ? (
                            <span
                                className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded"
                                style={{ backgroundColor: '#fff7ed', color: '#f5a623' }}
                            >
                                {log.hive_name}
                            </span>
                        ) : (
                            <span className="text-sm text-gray-400">—</span>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">User</p>
                        <p className="text-sm text-gray-700">{log.user_name ? toTitleCase(log.user_name) : '—'}</p>
                    </div>
                </div>
            </div>
        );
    };

    function applyFilters(overrides: Partial<{ level: string; eventType: string }> = {}) {
        router.get('/system-logs', {
            level:      overrides.level      ?? level,
            event_type: overrides.eventType  ?? eventType,
        }, { preserveScroll: true, preserveState: true });
    }

    function goToPage(url: string | null) {
        if (url) router.visit(url, { preserveScroll: true });
    }

    function goToPageNum(page: number) {
        router.get('/system-logs', {
            level,
            event_type: eventType,
            page,
        }, { preserveScroll: true, preserveState: true });
    }

    function exportCsv() {
        const headers = ['Time', 'Level', 'Event Type', 'Message', 'Hive', 'User'];
        const escape  = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows    = logs.data.map((l) => [
            new Date(l.created_at).toLocaleString('en-GB'),
            l.level,
            l.event_type,
            l.message,
            l.hive_name ?? '',
            l.user_name ?? '',
        ]);
        const csv  = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'system-logs.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    const from  = (logs.current_page - 1) * logs.per_page + 1;
    const to    = Math.min(logs.current_page * logs.per_page, logs.total);
    const pages = getPageNumbers(logs.current_page, logs.last_page);

    return (
        <>
            <Head title="System Logs" />
            <div className="flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Sub-header — subtitle only (breadcrumb is in the top AppHeader) */}
                <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Real-time application event history and diagnostics. Monitoring the hive ecosystem's digital pulse.
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Live
                    </span>
                </div>

                <div className="p-6 flex flex-col gap-5 flex-1">

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Total */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total</p>
                                <span className="text-[10px] font-semibold text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">24h</span>
                            </div>
                            <p className="text-4xl font-bold mt-2" style={{ color: '#0d1b2a' }}>
                                {stats.total.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
                        </div>

                        {/* Errors */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Errors</p>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                                    ↑ +12%
                                </span>
                            </div>
                            <p className="text-4xl font-bold mt-2 text-red-600">
                                {stats.errors.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">+12% increase</p>
                        </div>

                        {/* Warnings */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Warnings</p>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                                    Review
                                </span>
                            </div>
                            <p className="text-4xl font-bold mt-2 text-yellow-600">
                                {stats.warnings.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Requires review</p>
                        </div>

                        {/* Info */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Info</p>
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                                    OK
                                </span>
                            </div>
                            <p className="text-4xl font-bold mt-2 text-blue-600">
                                {stats.info.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Routine operations</p>
                        </div>
                    </div>

                    {/* Filter bar */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
                        <select
                            className="text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-gray-400 transition-colors"
                            value={level}
                            onChange={e => { setLevel(e.target.value); applyFilters({ level: e.target.value }); }}
                            style={{ color: '#0d1b2a' }}
                        >
                            <option value="">All Levels</option>
                            <option value="error">Error</option>
                            <option value="warning">Warning</option>
                            <option value="info">Info</option>
                        </select>

                        <select
                            className="text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-gray-400 transition-colors"
                            value={eventType}
                            onChange={e => { setEventType(e.target.value); applyFilters({ eventType: e.target.value }); }}
                            style={{ color: '#0d1b2a' }}
                        >
                            <option value="">All Event Types</option>
                            {eventTypes.map(et => <option key={et} value={et}>{et}</option>)}
                        </select>

                        <div className="flex-1" />

                        <button
                            onClick={exportCsv}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#0d9488' }}
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">

                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                            <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Event Log</span>
                            <span className="text-xs text-gray-400 ml-1">{logs.total.toLocaleString()} total entries</span>
                        </div>

                        <DataTable
                        columns={columns}
                        data={logs.data}
                        getRowId={(row) => row.log_id}
                        renderDetailPanel={renderDetailPanel}
                    />
                    </div>
                </div>

                {/* Footer status bar */}
                <div
                    className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-xs"
                    style={{ backgroundColor: '#ffffff', color: '#94a3b8' }}
                >
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            DB Sync Active
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                            12.4 GB Storage Used
                        </span>
                    </div>
                    <span>© {new Date().getFullYear()} BSADS — Bee Swarming &amp; Abscondence Detection System</span>
                </div>

            </div>
        </>
    );
}

SystemLogs.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'System Logs',     href: '/system-logs' },
    ]}>
        {page}
    </AppLayout>
);
