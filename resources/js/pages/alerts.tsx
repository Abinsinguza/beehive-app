import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BellRing, CheckCircle, AlertCircle, Download, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Inference = { id: number; prediction: string; beehive?: { hive_location: string } };
type Advisory  = { id: number; condition_label: string; advisory_text: string };

type Alert = {
    id: number;
    alert_id: string;
    inference_id: number;
    advisory_id: number;
    alert_type: string;
    alert_timestamp: string;
    status: 'pending' | 'sent';
    inference?: Inference & { beehive?: { hive_location: string; owner?: { name: string } } };
    advisory?: Advisory;
};

const severityConfig: Record<string, { label: string; bg: string; color: string }> = {
    Critical: { label: 'CRITICAL', bg: '#0d1b2a', color: '#ffffff' },
    Warning:  { label: 'ELEVATED', bg: '#fff7ed', color: '#f5a623' },
    Info:     { label: 'NORMAL',   bg: '#f1f5f9', color: '#64748b' },
    Threat:   { label: 'CRITICAL', bg: '#0d1b2a', color: '#ffffff' },
};

const staticLogs = [
    { ts: '2026-10-27 14:52:10', hive: 'HIVE-A102', severity: 'Critical', desc: 'Acoustic frequency spike detected (>450Hz). Swarm imminent.', action: 'ACKNOWLEDGE' },
    { ts: '2026-10-27 14:15:05', hive: 'HIVE-B204', severity: 'Warning',  desc: 'Internal temperature deviation +2.5°C above baseline.',       action: 'MONITOR' },
    { ts: '2026-10-27 13:58:44', hive: 'HIVE-C301', severity: 'Info',     desc: 'Automatic health scan completed. All metrics stable.',          action: 'DETAILS' },
    { ts: '2026-10-27 13:42:12', hive: 'HIVE-A102', severity: 'Critical', desc: 'Queen piping sounds detected. Prepare for secondary swarm.',    action: 'ACKNOWLEDGE' },
    { ts: '2026-10-27 13:30:00', hive: 'SYSTEM',    severity: 'Info',     desc: 'Cloud sync successful. 4 nodes updated.',                       action: 'DETAILS' },
    { ts: '2026-10-27 12:45:10', hive: 'HIVE-B109', severity: 'Warning',  desc: 'Battery level critical on Node B109 (3%).',                     action: 'MONITOR' },
];

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

    const [showModal, setShowModal] = useState(false);
    const [notifying, setNotifying] = useState<number | null>(null);
    const [flashDismissed, setFlashDismissed] = useState(false);

    useEffect(() => { setFlashDismissed(false); }, [flash?.success, flash?.error]);
    const [hiveFilter, setHiveFilter] = useState('All Hives');
    const [severityFilter, setSeverityFilter] = useState('All Levels');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo]     = useState('');

    const { data, setData, post, reset, processing, errors } = useForm({
        inference_id: '',
        advisory_id: '',
        alert_type: '',
        alert_timestamp: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/alerts', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    const handleNotify = (alert: Alert) => {
        setNotifying(alert.id);
        router.patch(`/alerts/${alert.id}/notify`, {}, { onFinish: () => setNotifying(null) });
    };

    const criticalCount = alerts.filter((a) => a.alert_type === 'Critical' || a.alert_type === 'Threat').length || 4;
    const elevatedCount = alerts.filter((a) => a.alert_type === 'Warning').length || 12;

    // Use real alerts if available, otherwise show static demo logs
    const logs = alerts.length > 0
        ? alerts.map((a) => ({
            ts:         new Date(a.alert_timestamp).toLocaleString(),
            hive:       a.inference?.beehive?.hive_location ?? 'SYSTEM',
            beekeeper:  a.inference?.beehive?.owner?.name   ?? null,
            severity:   a.alert_type,
            desc:       a.advisory?.advisory_text ?? '—',
            status:     a.status,
            action:     a.status === 'pending' ? 'NOTIFY' : 'SENT',
            alertObj:   a,
        }))
        : staticLogs.map((l) => ({ ...l, beekeeper: null, status: null, alertObj: null }));

    // Filter logs by date range using local date string comparison
    const filteredLogs = logs.filter((log) => {
        const datePart = log.ts.slice(0, 10); // "YYYY-MM-DD"
        if (dateFrom && datePart < dateFrom) return false;
        if (dateTo   && datePart > dateTo)   return false;
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
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#0d1b2a', color: '#ffffff' }}
                        >
                            <Plus className="w-4 h-4" /> Add Alert
                        </button>
                        <button
                            onClick={exportLog}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            <Download className="w-4 h-4" /> Export Log
                        </button>
                        <button
                            onClick={() => {
                                setHiveFilter('All Hives');
                                setSeverityFilter('All Levels');
                                setDateFrom('');
                                setDateTo('');
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Clear All
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
                                <option>HIVE-A102</option>
                                <option>HIVE-B204</option>
                                <option>HIVE-C301</option>
                                <option>HIVE-B109</option>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Critical Events</p>
                            <div className="h-0.5 w-8 mt-1 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                            <p className="text-5xl font-bold mt-3" style={{ color: '#f5a623' }}>
                                {String(criticalCount).padStart(2, '0')}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Active Alerts</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Elevated Drift</p>
                            <div className="h-0.5 w-8 mt-1 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                            <p className="text-5xl font-bold mt-3" style={{ color: '#0d1b2a' }}>{elevatedCount}</p>
                            <p className="text-xs text-gray-400 mt-1">Acoustic Shifts</p>
                        </div>

                        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
                            <div className="relative h-32" style={{ backgroundColor: '#0a1628' }}>
                                <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none">
                                    {[20, 40, 60].map((y) => (
                                        <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#1e3a5f" strokeWidth="0.5" />
                                    ))}
                                    <path d="M0,60 C20,55 30,20 50,30 C70,40 80,55 100,50 C120,45 130,15 150,25 C170,35 180,55 200,45"
                                        fill="none" stroke="#f5a623" strokeWidth="2" />
                                    <path d="M0,65 C30,60 60,40 90,50 C120,60 150,30 200,35"
                                        fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                                </svg>
                            </div>
                            <div className="bg-white p-3">
                                <p className="text-xs font-semibold" style={{ color: '#0d1b2a' }}>Frequency Pulse</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Real-time hive vibration log for HIVE-A102</p>
                            </div>
                        </div>
                    </div>

                    {/* System Activity Logs table — full width */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>System Activity Logs</span>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-1 rounded border border-gray-300 text-gray-500 uppercase tracking-widest">Normal</span>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded text-white uppercase tracking-widest" style={{ backgroundColor: '#f5a623' }}>Alert</span>
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
                                    {filteredLogs.map((log, i) => {
                                        const sc        = severityConfig[log.severity] ?? severityConfig.Info;
                                        const isPending = log.alertObj?.status === 'pending';
                                        const isSent    = log.alertObj?.status === 'sent';
                                        const isStatic  = log.alertObj === null;
                                        return (
                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 text-gray-400 whitespace-nowrap font-mono">{log.ts}</td>
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

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                                <span className="text-xs text-gray-400">Showing 1 to 6 of 142 events</span>
                                <div className="flex items-center gap-1">
                                    <button className="w-7 h-7 rounded text-xs text-gray-400 hover:bg-gray-100">‹</button>
                                    {[1, 2, 3].map((p) => (
                                        <button key={p} className="w-7 h-7 rounded text-xs font-semibold transition-colors"
                                            style={p === 1 ? { backgroundColor: '#f5a623', color: '#0d1b2a' } : { color: '#6b7280' }}>
                                            {p}
                                        </button>
                                    ))}
                                    <button className="w-7 h-7 rounded text-xs text-gray-400 hover:bg-gray-100">›</button>
                                </div>
                            </div>
                        </div>

                    {/* Bottom: Swarm Prevention + Predictive Drift */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f5a623' }}>
                                <span className="text-white font-bold text-lg">✳</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Swarm Prevention Protocol</p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    System analysis suggests HIVE-A102 has entered pre-swarm behavior. Immediate physical inspection is recommended to verify queen cells.
                                </p>
                                <button className="self-start mt-1 px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-colors">
                                    View Protocol Checklist
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#eff6ff' }}>
                                <span className="text-blue-500 font-bold text-lg">↺</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Predictive Drift Analysis</p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Based on the last 72 hours of acoustic data, the colony health trend is shifting from foraging stability to overcrowding states across Yard B.
                                </p>
                                <button
                                    onClick={() => {
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
  <title>SwarmIntel – Full Alert Report</title>
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
  <h1>SwarmIntel – Full Alert Report</h1>
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
  <div class="footer">SwarmIntel Bee Monitoring Pro &nbsp;|&nbsp; System Health: Active Monitoring &nbsp;|&nbsp; Confidential</div>
</body>
</html>`;

                                        const win = window.open('', '_blank');
                                        if (win) { win.document.write(html); win.document.close(); }
                                    }}
                                    className="self-start mt-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: '#0d1b2a' }}
                                >
                                    Generate Full Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Alert Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Add New Alert</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Inference</label>
                                <select value={data.inference_id} onChange={(e) => setData('inference_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="" disabled>Select an inference</option>
                                    {inferences.map((inf) => (
                                        <option key={inf.id} value={inf.id}>#{inf.id} — {inf.prediction} @ {inf.beehive?.hive_location ?? inf.id}</option>
                                    ))}
                                </select>
                                {errors.inference_id && <p className="text-xs text-red-500 mt-1">{errors.inference_id}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Advisory</label>
                                <select value={data.advisory_id} onChange={(e) => setData('advisory_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="" disabled>Select an advisory</option>
                                    {advisories.map((adv) => (
                                        <option key={adv.id} value={adv.id}>{adv.condition_label} — {adv.advisory_text.substring(0, 50)}…</option>
                                    ))}
                                </select>
                                {errors.advisory_id && <p className="text-xs text-red-500 mt-1">{errors.advisory_id}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Alert Type</label>
                                <select value={data.alert_type} onChange={(e) => setData('alert_type', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="" disabled>Select type</option>
                                    <option>Info</option><option>Warning</option><option>Critical</option><option>Threat</option>
                                </select>
                                {errors.alert_type && <p className="text-xs text-red-500 mt-1">{errors.alert_type}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Timestamp</label>
                                <input type="datetime-local" value={data.alert_timestamp} onChange={(e) => setData('alert_timestamp', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required />
                                {errors.alert_timestamp && <p className="text-xs text-red-500 mt-1">{errors.alert_timestamp}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={processing}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                    {processing ? 'Saving…' : 'Save Alert'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

AlertsPage.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Alerts & Logs', href: '/alerts' },
    ],
};
