import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, Download, Info, Search, SlidersHorizontal } from 'lucide-react';
import React, { useState } from 'react';

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
    filters: { level: string; eventType: string; search: string };
}

const levelConfig: Record<string, { badge: string; dot: string; icon: React.ReactNode; label: string }> = {
    error: {
        badge: 'text-red-700',
        dot: '#ef4444',
        icon: <AlertCircle className="w-3.5 h-3.5" />,
        label: 'ERROR',
    },
    warning: {
        badge: 'text-yellow-700',
        dot: '#f59e0b',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        label: 'WARNING',
    },
    info: {
        badge: 'text-blue-700',
        dot: '#3b82f6',
        icon: <Info className="w-3.5 h-3.5" />,
        label: 'INFO',
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
    const [search, setSearch]         = useState(filters.search);
    const [level, setLevel]           = useState(filters.level);
    const [eventType, setEventType]   = useState(filters.eventType);
    const [expanded, setExpanded]     = useState<string | null>(null);

    function applyFilters(overrides: Partial<{ level: string; eventType: string; search: string }> = {}) {
        router.get('/system-logs', {
            search:     overrides.search     ?? search,
            level:      overrides.level      ?? level,
            event_type: overrides.eventType  ?? eventType,
        }, { preserveScroll: true, preserveState: true });
    }

    function goToPage(url: string | null) {
        if (url) router.visit(url, { preserveScroll: true });
    }

    function goToPageNum(page: number) {
        router.get('/system-logs', {
            search,
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
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Breadcrumb sub-header */}
                <div className="px-6 py-3 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                        <Link
                            href="/dashboard"
                            className="font-semibold hover:underline"
                            style={{ color: '#0d1b2a' }}
                        >
                            Admin Dashboard
                        </Link>
                        <span className="text-gray-300 font-light">/</span>
                        <span className="font-semibold" style={{ color: '#f5a623' }}>System Logs</span>
                    </div>
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

                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 outline-none bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors"
                                placeholder="Filter messages, PIDs, or hex codes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                style={{ color: '#0d1b2a' }}
                            />
                        </div>

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

                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Advanced
                        </button>

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

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Time</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Level</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Event</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Message</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">Hive / User</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-16 text-gray-400 text-sm">
                                                No log entries found
                                            </td>
                                        </tr>
                                    ) : logs.data.map(log => {
                                        const cfg        = levelConfig[log.level] ?? levelConfig.info;
                                        const isExpanded = expanded === log.log_id;
                                        const { date, time } = fmt(log.created_at);
                                        return (
                                            <>
                                                <tr
                                                    key={log.log_id}
                                                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => setExpanded(isExpanded ? null : log.log_id)}
                                                >
                                                    {/* TIME */}
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="block font-mono text-gray-700">{time}</span>
                                                        <span className="block text-gray-400">{date}</span>
                                                    </td>

                                                    {/* LEVEL */}
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}
                                                            style={{ backgroundColor: `${cfg.dot}15` }}
                                                        >
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                style={{ backgroundColor: cfg.dot }}
                                                            />
                                                            {cfg.label}
                                                        </span>
                                                    </td>

                                                    {/* EVENT */}
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className="font-mono text-[11px] px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-600 whitespace-nowrap"
                                                        >
                                                            {log.event_type ?? '—'}
                                                        </span>
                                                    </td>

                                                    {/* MESSAGE */}
                                                    <td className="px-4 py-3 max-w-sm">
                                                        <span className="block truncate text-gray-700">{log.message}</span>
                                                    </td>

                                                    {/* HIVE / USER */}
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {log.hive_name && (
                                                            <span
                                                                className="block text-[11px] font-semibold px-2 py-0.5 rounded mb-0.5 w-fit"
                                                                style={{ backgroundColor: '#fff7ed', color: '#f5a623' }}
                                                            >
                                                                {log.hive_name}
                                                            </span>
                                                        )}
                                                        {log.user_name && (
                                                            <span className="block text-gray-400">{log.user_name}</span>
                                                        )}
                                                        {!log.hive_name && !log.user_name && (
                                                            <span className="text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {isExpanded && log.details && (
                                                    <tr key={`${log.log_id}-detail`} className="bg-gray-50 border-b border-gray-100">
                                                        <td colSpan={5} className="px-6 py-3">
                                                            <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap break-all bg-white rounded-lg border border-gray-200 p-3">
                                                                {JSON.stringify(log.details, null, 2)}
                                                            </pre>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {logs.last_page > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                    Showing <span className="font-semibold text-gray-700">{from}</span> to{' '}
                                    <span className="font-semibold text-gray-700">{to}</span> of{' '}
                                    <span className="font-semibold text-gray-700">{logs.total.toLocaleString()}</span> results
                                </p>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => goToPage(logs.prev_page_url)}
                                        disabled={!logs.prev_page_url}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                    >
                                        Previous
                                    </button>

                                    {pages.map((p, i) =>
                                        p === '…' ? (
                                            <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-xs text-gray-400">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => goToPageNum(p as number)}
                                                className="w-8 h-8 text-xs rounded-lg border transition-colors font-medium"
                                                style={
                                                    p === logs.current_page
                                                        ? { backgroundColor: '#0d1b2a', color: '#ffffff', borderColor: '#0d1b2a' }
                                                        : { backgroundColor: '#ffffff', color: '#374151', borderColor: '#e5e7eb' }
                                                }
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}

                                    <button
                                        onClick={() => goToPage(logs.next_page_url)}
                                        disabled={!logs.next_page_url}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
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
                    <span>© {new Date().getFullYear()} SwarmIntel — Bee Monitoring Pro</span>
                </div>

            </div>
        </>
    );
}
