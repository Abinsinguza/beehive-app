import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, Info, Search, ScrollText } from 'lucide-react';
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
}

interface Props {
    logs: Paginator;
    stats: { total: number; errors: number; warnings: number; info: number };
    eventTypes: string[];
    filters: { level: string; eventType: string; search: string };
}

const levelStyle: Record<string, { badge: string; icon: React.ReactNode }> = {
    error:   { badge: 'bg-red-100 text-red-700',    icon: <AlertCircle className="w-3.5 h-3.5" /> },
    warning: { badge: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    info:    { badge: 'bg-blue-100 text-blue-700',  icon: <Info className="w-3.5 h-3.5" /> },
};

function fmt(iso: string) {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium' });
}

export default function SystemLogs({ logs, stats, eventTypes, filters }: Props) {
    const [search, setSearch]     = useState(filters.search);
    const [level, setLevel]       = useState(filters.level);
    const [eventType, setEventType] = useState(filters.eventType);
    const [expanded, setExpanded] = useState<string | null>(null);

    function applyFilters(overrides: Partial<typeof filters> = {}) {
        router.get('/system-logs', {
            search:     overrides.search     ?? search,
            level:      overrides.level      ?? level,
            event_type: overrides.eventType  ?? eventType,
        }, { preserveScroll: true, preserveState: true });
    }

    function goToPage(url: string | null) {
        if (url) router.visit(url, { preserveScroll: true });
    }

    return (
        <AppLayout>
            <Head title="System Logs" />

            <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <ScrollText className="w-6 h-6 text-amber-500" />
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">System Logs</h1>
                        <p className="text-sm text-slate-500">Application event history and diagnostics</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total', value: stats.total,    color: 'text-slate-700' },
                        { label: 'Errors',   value: stats.errors,   color: 'text-red-600' },
                        { label: 'Warnings', value: stats.warnings, color: 'text-yellow-600' },
                        { label: 'Info',     value: stats.info,     color: 'text-blue-600' },
                    ].map(s => (
                        <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="Search messages…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                        />
                    </div>

                    <select
                        className="text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        value={level}
                        onChange={e => { setLevel(e.target.value); applyFilters({ level: e.target.value }); }}
                    >
                        <option value="">All levels</option>
                        <option value="error">Error</option>
                        <option value="warning">Warning</option>
                        <option value="info">Info</option>
                    </select>

                    <select
                        className="text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        value={eventType}
                        onChange={e => { setEventType(e.target.value); applyFilters({ eventType: e.target.value }); }}
                    >
                        <option value="">All event types</option>
                        {eventTypes.map(et => <option key={et} value={et}>{et}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Level</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Event</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Message</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hive / User</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-slate-400">No logs found</td>
                                    </tr>
                                ) : logs.data.map(log => {
                                    const style = levelStyle[log.level] ?? levelStyle.info;
                                    const isExpanded = expanded === log.log_id;
                                    return (
                                        <>
                                            <tr
                                                key={log.log_id}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer"
                                                onClick={() => setExpanded(isExpanded ? null : log.log_id)}
                                            >
                                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                                                    {fmt(log.created_at)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                                                        {style.icon} {log.level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">{log.event_type}</td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-sm truncate">{log.message}</td>
                                                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                                                    {log.hive_name && <span className="block">{log.hive_name}</span>}
                                                    {log.user_name && <span className="block">{log.user_name}</span>}
                                                </td>
                                            </tr>
                                            {isExpanded && log.details && (
                                                <tr key={`${log.log_id}-detail`} className="bg-slate-50 dark:bg-slate-900/40">
                                                    <td colSpan={5} className="px-6 py-3">
                                                        <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-all">
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs text-slate-500">
                            Showing {((logs.current_page - 1) * logs.per_page) + 1}–{Math.min(logs.current_page * logs.per_page, logs.total)} of {logs.total.toLocaleString()} logs
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => goToPage(logs.prev_page_url)}
                                disabled={!logs.prev_page_url}
                                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1.5 text-xs text-slate-500">
                                {logs.current_page} / {logs.last_page}
                            </span>
                            <button
                                onClick={() => goToPage(logs.next_page_url)}
                                disabled={!logs.next_page_url}
                                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
