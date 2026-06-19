import { Head, router, usePage } from '@inertiajs/react';
import { BellRing, CheckCircle, AlertCircle, Download, Inbox, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Inference = { id: number; prediction: string; beehive?: { hive_location: string } };
type Advisory  = { id: number; condition_label: string; advisory_text: string };

type Alert = {
    id: number;
    alert_id: string;
    inference_id: number;
    alert_type: string;
    alert_timestamp: string;
    status: 'pending' | 'sent';
    recommended_action?: string | null;
    viewed_at?: string | null;
    inference?: Inference & { beehive?: { hive_location: string; owner?: { name: string } } };
};

const severityConfig: Record<string, { label: string; bg: string; color: string }> = {
    Critical: { label: 'CRITICAL', bg: '#0d1b2a', color: '#ffffff' },
    Warning:  { label: 'ELEVATED', bg: '#fff7ed', color: '#f5a623' },
    Info:     { label: 'NORMAL',   bg: '#f1f5f9', color: '#64748b' },
    Threat:   { label: 'CRITICAL', bg: '#0d1b2a', color: '#ffffff' },
};

export default function AlertsPage({
    alerts = [],
    inferences = [],
    advisories = [],
}: {
    alerts?: Alert[];
    inferences?: Inference[];
    advisories?: Advisory[];
}) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [notifying, setNotifying] = useState<number | null>(null);
    const [flashDismissed, setFlashDismissed] = useState(false);
    const [logTypeFilter, setLogTypeFilter] = useState<'all' | 'normal' | 'alert'>('all');

    useEffect(() => { setFlashDismissed(false); }, [flash?.success, flash?.error]);
    const [hiveFilter, setHiveFilter] = useState('All Hives');
    const [severityFilter, setSeverityFilter] = useState('All Levels');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo]     = useState('');

    const handleNotify = (alert: Alert) => {
        setNotifying(alert.id);
        router.patch(`/alerts/${alert.id}/notify`, {}, { onFinish: () => setNotifying(null) });
    };

    const pendingCount  = alerts.filter((a) => a.status === 'pending').length;
    const sentCount     = alerts.filter((a) => a.status === 'sent').length;

    const typeCounts = (['Critical', 'Threat', 'Warning', 'Info'] as const).map((type) => ({
        type,
        count: alerts.filter((a) => a.alert_type === type).length,
    }));

    const logs = alerts.map((a) => ({
        ts:         new Date(a.alert_timestamp).toLocaleString(),
        hive:       a.inference?.beehive?.hive_location ?? 'SYSTEM',
        beekeeper:  a.inference?.beehive?.owner?.name   ?? null,
        severity:   a.alert_type,
        desc:       a.recommended_action ?? '—',
        status:     a.status,
        action:     a.status === 'pending' ? 'NOTIFY' : 'SENT',
        viewedAt:   a.viewed_at ?? null,
        alertObj:   a,
    }));

    const uniqueHives = [...new Set(logs.map((l) => l.hive))].sort();

    // Filter logs by hive, severity, date range, and log type
    const filteredLogs = logs.filter((log) => {
        if (hiveFilter !== 'All Hives' && log.hive !== hiveFilter) return false;
        if (severityFilter !== 'All Levels') {
            const sc = severityConfig[log.severity] ?? severityConfig.Info;
            if (sc.label.toLowerCase() !== severityFilter.toLowerCase()) return false;
        }
        const isoDate = new Date(log.alertObj.alert_timestamp).toISOString().slice(0, 10);
        if (dateFrom && isoDate < dateFrom) return false;
        if (dateTo   && isoDate > dateTo)   return false;
        if (logTypeFilter === 'normal' && log.severity !== 'Info') return false;
        if (logTypeFilter === 'alert' && log.severity === 'Info') return false;
        return true;
    });

    const exportLog = () => {
        const headers = ['Timestamp', 'Hive ID', 'Severity', 'Event Description', 'Action'];
        const escape  = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
        const rows    = filteredLogs.map((l) => {
            const sc = severityConfig[l.severity] ?? severityConfig.Info;
            return [l.ts, l.hive, sc.label, l.desc, l.action];
        });
        const csv  = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `alerts-log${dateFrom ? `-from-${dateFrom}` : ''}${dateTo ? `-to-${dateTo}` : ''}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateReport = () => {
        const sc = (sev: string) => (severityConfig[sev] ?? severityConfig.Info).label;
        const rows = filteredLogs.map((l) =>
            `<tr>
                <td>${l.ts}</td>
                <td>${l.hive}</td>
                <td><strong>${sc(l.severity)}</strong></td>
                <td>${l.desc}</td>
                <td>${l.action}</td>
            </tr>`
        ).join('');

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>BSADS – Full Alert Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0d1b2a; padding: 32px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; }
    .stat { background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 20px; }
    .stat-val { font-size: 28px; font-weight: bold; color: #f5a623; }
    .stat-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #0d1b2a; color: white; text-align: left; padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:nth-child(even) td { background: #f8f9fa; }
    .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>BSADS – Full Alert Report</h1>
  <div class="meta">
    Generated: ${new Date().toLocaleString()}
    ${dateFrom ? ` &nbsp;|&nbsp; Date filter: ${dateFrom}` : ''}
    ${hiveFilter !== 'All Hives' ? ` &nbsp;|&nbsp; Hive: ${hiveFilter}` : ''}
    ${severityFilter !== 'All Levels' ? ` &nbsp;|&nbsp; Severity: ${severityFilter}` : ''}
  </div>
  <div class="summary">
    <div class="stat"><div class="stat-val">${filteredLogs.length}</div><div class="stat-lbl">Total Events</div></div>
    <div class="stat"><div class="stat-val">${filteredLogs.filter(l => l.severity === 'Critical' || l.severity === 'Threat').length}</div><div class="stat-lbl">Critical</div></div>
    <div class="stat"><div class="stat-val">${filteredLogs.filter(l => l.severity === 'Warning').length}</div><div class="stat-lbl">Elevated</div></div>
    <div class="stat"><div class="stat-val">${filteredLogs.filter(l => l.severity === 'Info').length}</div><div class="stat-lbl">Normal</div></div>
  </div>
  <table>
    <thead><tr><th>Timestamp</th><th>Hive ID</th><th>Severity</th><th>Event Description</th><th>Action</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="actions" style="margin-top:24px; display:flex; gap:12px;">
    <button onclick="window.print()" style="padding:10px 24px; background:#f5a623; color:#0d1b2a; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">🖨 Print / Save as PDF</button>
    <button onclick="window.close()" style="padding:10px 24px; background:#0d1b2a; color:white; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">← Back to App</button>
  </div>
  <div class="footer">BSADS — Bee Swarming &amp; Abscondence Detection System &nbsp;|&nbsp; System Health: Active Monitoring &nbsp;|&nbsp; Confidential</div>
</body>
</html>`;

        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    };

    return (
        <>
            <Head title="Alerts & Logs" />
            <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Sub-header */}
                <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Alerts and Logs</span>
                    <span className="text-sm text-gray-400">System Health:</span>
                    <span className="text-sm font-semibold" style={{ color: '#f5a623' }}>Active Monitoring</span>
                    <div className="ml-auto flex items-center gap-3">
                        <button
                            onClick={exportLog}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            <Download className="w-4 h-4" /> Export Log
                        </button>
                        <button
                            onClick={generateReport}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Generate Report
                        </button>
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-5">

                    {/* Flash messages */}
                    {!flashDismissed && flash?.success && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                            style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span>{flash.success}</span>
                            </div>
                            <button onClick={() => setFlashDismissed(true)} className="p-0.5 rounded hover:opacity-70">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {!flashDismissed && flash?.error && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                            style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{flash.error}</span>
                            </div>
                            <button onClick={() => setFlashDismissed(true)} className="p-0.5 rounded hover:opacity-70">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Hive ID</label>
                            <select value={hiveFilter} onChange={(e) => setHiveFilter(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
                                <option>All Hives</option>
                                {uniqueHives.map((h) => <option key={h}>{h}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Severity</label>
                            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
                                <option>All Levels</option>
                                <option>Critical</option>
                                <option>Elevated</option>
                                <option>Normal</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Date Range</label>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-300">From</span>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch(err) {} }}
                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors"
                                    />
                                </div>
                                <span className="text-xs text-gray-400 mt-4">—</span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-300">To</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        min={dateFrom}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch(err) {} }}
                                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cards row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {typeCounts.map(({ type, count }) => {
                            const sc = severityConfig[type];
                            return (
                                <div key={type} className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{type}</p>
                                    <p className="text-2xl font-bold mt-1" style={{ color: sc.bg === '#0d1b2a' ? '#0d1b2a' : sc.color }}>
                                        {count}
                                    </p>
                                </div>
                            );
                        })}

                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Pending</p>
                            <p className="text-2xl font-bold mt-1" style={{ color: '#c2410c' }}>{pendingCount}</p>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Sent</p>
                            <p className="text-2xl font-bold mt-1" style={{ color: '#065f46' }}>{sentCount}</p>
                        </div>
                    </div>

                    {/* System Activity Logs table — full width */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>System Activity Logs</span>
                                <div className="ml-auto flex items-center gap-2">
                                    <button
                                        onClick={() => setLogTypeFilter('normal')}
                                        className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest transition-colors"
                                        style={{
                                            backgroundColor: logTypeFilter === 'normal' ? '#f1f5f9' : 'transparent',
                                            color: logTypeFilter === 'normal' ? '#0d1b2a' : '#64748b',
                                            border: logTypeFilter === 'normal' ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Normal
                                    </button>
                                    <button
                                        onClick={() => setLogTypeFilter('alert')}
                                        className="text-[10px] font-bold px-2 py-1 rounded text-white uppercase tracking-widest transition-colors"
                                        style={{
                                            backgroundColor: logTypeFilter === 'alert' ? '#f5a623' : '#e8b344',
                                            opacity: logTypeFilter === 'alert' ? 1 : 0.6,
                                            cursor: 'pointer',
                                            border: 'none'
                                        }}
                                    >
                                        Alert
                                    </button>
                                </div>
                            </div>

                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Timestamp</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Hive / Beekeeper</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Severity</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Event Description</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-16 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Inbox className="w-8 h-8 text-gray-300" />
                                                    <p className="text-sm font-semibold text-gray-500">No alerts found</p>
                                                    <p className="text-xs text-gray-400">
                                                        {alerts.length === 0
                                                            ? 'No alerts have been recorded yet.'
                                                            : 'No alerts match the current filters.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredLogs.map((log, i) => {
                                        const sc        = severityConfig[log.severity] ?? severityConfig.Info;
                                        const isPending = log.alertObj.status === 'pending';
                                        const isSent    = log.alertObj.status === 'sent';
                                        return (
                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 text-gray-400 whitespace-nowrap font-mono">
                                                    {log.ts}
                                                    <p className="text-[9px] mt-0.5" style={{ color: log.viewedAt ? '#16a34a' : '#94a3b8' }}>
                                                        {log.viewedAt
                                                            ? `Viewed ${new Date(log.viewedAt).toLocaleString()}`
                                                            : 'Not yet viewed'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-semibold text-xs" style={{ color: '#0d1b2a' }}>{log.hive}</p>
                                                    {log.beekeeper && (
                                                        <p className="text-[10px] text-gray-400 mt-0.5">{log.beekeeper}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest"
                                                        style={{ backgroundColor: sc.bg, color: sc.color }}>
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-gray-600 leading-snug max-w-xs">{log.desc}</td>
                                                <td className="px-4 py-4">
                                                    {isSent ? (
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest"
                                                            style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>
                                                            Sent
                                                        </span>
                                                    ) : isPending ? (
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest"
                                                            style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                                                            Pending
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {isPending ? (
                                                        <button
                                                            onClick={() => handleNotify(log.alertObj!)}
                                                            disabled={notifying === log.alertObj!.id}
                                                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
                                                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                                        >
                                                            <BellRing className="w-3 h-3" />
                                                            {notifying === log.alertObj!.id ? 'Sending…' : 'Notify'}
                                                        </button>
                                                    ) : isSent ? (
                                                        <button
                                                            onClick={() => handleNotify(log.alertObj!)}
                                                            disabled={notifying === log.alertObj!.id}
                                                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-gray-50 disabled:opacity-50"
                                                            style={{ borderColor: '#d1d5db', color: '#6b7280' }}
                                                        >
                                                            <BellRing className="w-3 h-3" />
                                                            {notifying === log.alertObj!.id ? 'Sending…' : 'Resend'}
                                                        </button>
                                                    ) : (
                                                        <button className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
                                                            {log.action}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                                <span className="text-xs text-gray-400">
                                    Showing {filteredLogs.length} of {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                </div>
            </div>


        </>
    );
}

AlertsPage.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Alerts & Logs', href: '/alerts' },
    ],
};
