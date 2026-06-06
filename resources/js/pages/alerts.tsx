import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BellRing, CheckCircle, AlertCircle, Download, X } from 'lucide-react';
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
    { ts: '2026-10-27 14:52:10', hive: 'HIVE-A102', severity: 'Critical', desc: 'Acoustic frequency spike detected (>450Hz). Swarm imminent.',                                                             action: 'ACKNOWLEDGE', mlBadge: { label: 'SWARM',     bg: '#fef2f2', color: '#ef4444' } },
    { ts: '2026-10-27 14:15:05', hive: 'HIVE-B204', severity: 'Warning',  desc: 'Internal temperature deviation +2.5°C above baseline.',                                                                   action: 'MONITOR',     mlBadge: { label: 'PRE-SWARM', bg: '#fff7ed', color: '#f5a623' } },
    { ts: '2026-10-27 13:58:44', hive: 'HIVE-C301', severity: 'Info',     desc: 'Automatic health scan completed. All metrics stable.',                                                                     action: 'DETAILS',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
    { ts: '2026-10-27 13:42:12', hive: 'HIVE-A102', severity: 'Critical', desc: 'Queen piping sounds detected. Prepare for secondary swarm.',                                                               action: 'ACKNOWLEDGE', mlBadge: { label: 'SWARM',     bg: '#fef2f2', color: '#ef4444' } },
    { ts: '2026-10-27 13:30:00', hive: 'HIVE-B109', severity: 'Info',     desc: 'Acoustic baseline scan completed. Frequency within normal range (280-350Hz).',                                             action: 'DETAILS',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
    { ts: '2026-10-27 12:45:10', hive: 'HIVE-B109', severity: 'Warning',  desc: 'Battery level critical (3%). Microphone may go offline. Audio recording and classification at risk.',                     action: 'MONITOR',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
];

const staticLogsPage2 = [
    { ts: '2026-10-27 12:10:33', hive: 'HIVE-D401', severity: 'Critical', desc: 'Sustained high-frequency piping at 438Hz for >10 minutes. Swarm preparation likely.',                                    action: 'ACKNOWLEDGE', mlBadge: { label: 'SWARM',     bg: '#fef2f2', color: '#ef4444' } },
    { ts: '2026-10-27 11:55:20', hive: 'HIVE-C301', severity: 'Warning',  desc: 'Humidity reading 91% RH. Condensation risk detected inside brood chamber.',                                               action: 'MONITOR',     mlBadge: { label: 'NORMAL',          bg: '#f0fdf4', color: '#16a34a' } },
    { ts: '2026-10-27 11:30:08', hive: 'HIVE-A205', severity: 'Info',     desc: 'Scheduled audio classification completed. 12 recordings processed, all normal.',                                          action: 'DETAILS',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
    { ts: '2026-10-27 11:14:45', hive: 'HIVE-B204', severity: 'Critical', desc: 'Acoustic signature matches active swarming pattern. Colony exit behavior detected.',                                      action: 'ACKNOWLEDGE', mlBadge: { label: 'SWARM',     bg: '#fef2f2', color: '#ef4444' } },
    { ts: '2026-10-27 10:58:00', hive: 'HIVE-D401', severity: 'Info',     desc: 'Temperature stabilised at 34.6°C. Hive returned to baseline after morning activity.',                                     action: 'DETAILS',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
    { ts: '2026-10-27 10:32:17', hive: 'HIVE-A102', severity: 'Warning',  desc: 'Vibration anomaly detected in acoustic recording. Possible external disturbance pattern near hive.',                     action: 'MONITOR',     mlBadge: { label: 'PEST/DISTURBANCE', bg: '#fff3e0', color: '#f97316' } },
];

const staticLogsPage3 = [
    { ts: '2026-10-27 10:05:50', hive: 'HIVE-C301', severity: 'Info',     desc: 'Acoustic preprocessing pipeline completed. All frequency filters calibrated successfully.',                               action: 'DETAILS',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
    { ts: '2026-10-27 09:48:22', hive: 'HIVE-A205', severity: 'Warning',  desc: 'Ambient temperature outside hive dropped to 11°C. Colony may cluster to conserve heat.',                                 action: 'MONITOR',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
    { ts: '2026-10-27 09:20:05', hive: 'HIVE-B109', severity: 'Info',     desc: 'Daily acoustic summary: 48 recordings classified, 46 normal, 2 flagged for review.',                                     action: 'DETAILS',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
    { ts: '2026-10-27 08:55:33', hive: 'HIVE-D401', severity: 'Critical', desc: 'Peak frequency 461Hz recorded at dawn. High swarm-risk window. Deploy inspection team.',                                  action: 'ACKNOWLEDGE', mlBadge: { label: 'SWARM',     bg: '#fef2f2', color: '#ef4444' } },
    { ts: '2026-10-27 08:30:11', hive: 'HIVE-A102', severity: 'Info',     desc: 'Acoustic recording completed. Classification: Normal. Confidence score 96%.',                                            action: 'DETAILS',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
    { ts: '2026-10-27 08:00:00', hive: 'HIVE-B204', severity: 'Warning',  desc: 'Humidity level risen to 89%. Possible moisture accumulation in brood chamber.',                                          action: 'MONITOR',     mlBadge: { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' } },
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
    const [severityTab, setSeverityTab] = useState<'ALL' | 'NORMAL' | 'ELEVATED' | 'CRITICAL'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);

    const initialChecklist = [
        { id: 1, text: 'Inspect Hive-A102 for queen cells',       done: false },
        { id: 2, text: 'Add super to Hive-A102 to reduce congestion', done: false },
        { id: 3, text: 'Set swarm trap near Hive-A102',           done: false },
        { id: 4, text: 'Check ventilation on Hive-A102',          done: false },
        { id: 5, text: 'Prepare nucleus colony box',              done: false },
        { id: 6, text: 'Brief field team on swarm protocol',      done: false },
    ];
    const [showChecklist, setShowChecklist] = useState(false);
    const [checklist, setChecklist] = useState(initialChecklist);
    const doneCount = checklist.filter((i) => i.done).length;
    const donePct   = Math.round((doneCount / checklist.length) * 100);
    const toggleCheck = (id: number) => setChecklist((prev) => prev.map((i) => i.id === id ? { ...i, done: !i.done } : i));
    const markAllDone = () => setChecklist((prev) => prev.map((i) => ({ ...i, done: true })));
    const closeChecklist = () => { setShowChecklist(false); setChecklist(initialChecklist); };
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

    const pageStaticLogs = currentPage === 2 ? staticLogsPage2 : currentPage === 3 ? staticLogsPage3 : staticLogs;

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
        : pageStaticLogs.map((l) => ({ ...l, beekeeper: null, status: null, alertObj: null }));

    // Filter logs by date range using local date string comparison
    const filteredLogs = logs.filter((log) => {
        const datePart = log.ts.slice(0, 10); // "YYYY-MM-DD"
        if (dateFrom && datePart < dateFrom) return false;
        if (dateTo   && datePart > dateTo)   return false;
        if (severityTab === 'NORMAL'   && (severityConfig[log.severity] ?? severityConfig.Info).label !== 'NORMAL')   return false;
        if (severityTab === 'ELEVATED' && (severityConfig[log.severity] ?? severityConfig.Info).label !== 'ELEVATED') return false;
        if (severityTab === 'CRITICAL' && (severityConfig[log.severity] ?? severityConfig.Info).label !== 'CRITICAL') return false;
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
                    <div className="ml-auto flex items-center gap-3">
                        <button
                            onClick={exportLog}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            <Download className="w-4 h-4" /> Export Log
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


                    </div>

                    {/* System Activity Logs table — full width */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>System Activity Logs</span>
                                <div className="ml-auto flex items-center gap-1">
                                    {(['ALL', 'NORMAL', 'ELEVATED', 'CRITICAL'] as const).map((tab) => {
                                        const active = severityTab === tab;
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => { setSeverityTab(tab); setCurrentPage(1); }}
                                                className="text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-widest transition-colors"
                                                style={active
                                                    ? { backgroundColor: '#f5a623', color: '#0d1b2a' }
                                                    : { border: '1px solid #e5e7eb', color: '#9ca3af', backgroundColor: 'transparent' }
                                                }
                                            >
                                                {tab}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Timestamp</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Hive ID</th>
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
                                                    ) : isStatic && (log as any).mlBadge ? (
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest"
                                                            style={{ backgroundColor: (log as any).mlBadge.bg, color: (log as any).mlBadge.color }}>
                                                            {(log as any).mlBadge.label}
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
                                <span className="text-xs text-gray-400">
                                    {severityTab === 'ALL'
                                        ? `Showing ${(currentPage - 1) * 6 + 1} to ${(currentPage - 1) * 6 + filteredLogs.length} of 142 events`
                                        : `Showing ${filteredLogs.length} ${severityTab.toLowerCase()} event${filteredLogs.length !== 1 ? 's' : ''}`
                                    }
                                </span>
                                {severityTab === 'ALL' && (
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="w-7 h-7 rounded text-xs text-gray-400 hover:bg-gray-100">‹</button>
                                        {[1, 2, 3].map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setCurrentPage(p)}
                                                className="w-7 h-7 rounded text-xs font-semibold transition-colors"
                                                style={p === currentPage ? { backgroundColor: '#f5a623', color: '#0d1b2a' } : { color: '#6b7280' }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button onClick={() => setCurrentPage((p) => Math.min(3, p + 1))} className="w-7 h-7 rounded text-xs text-gray-400 hover:bg-gray-100">›</button>
                                    </div>
                                )}
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
                                <button onClick={() => setShowChecklist(true)} className="self-start mt-1 px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-colors">
                                    View Protocol Checklist
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#0d1b2a' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f5a623' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#0d1b2a" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <p className="font-semibold text-sm text-white">ML Classification Summary</p>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Based on today's acoustic analysis across all active hives:
                            </p>
                            <div className="flex flex-col gap-2">
                                {[
                                    { label: 'Total recordings processed',           value: '47' },
                                    { label: 'Classifications above 80% confidence', value: '38' },
                                    { label: 'Flagged as Uncertain',                 value: '5'  },
                                    { label: 'Awaiting expert review',               value: '5'  },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400">{label}</span>
                                        <span className="text-xs font-bold" style={{ color: '#f5a623' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2">
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
                                    className="w-full px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-600 text-slate-300 hover:border-slate-400 transition-colors"
                                >
                                    Generate Full Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Swarm Preparation Checklist Modal */}
            {showChecklist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Swarm Preparation Checklist</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Recommended actions based on current risk level — HIVE-A102</p>
                            </div>
                            <button onClick={closeChecklist} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {/* Progress */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-400">{doneCount} / {checklist.length} completed</span>
                                    <span className="text-xs font-bold" style={{ color: '#f5a623' }}>{donePct}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{ width: `${donePct}%`, backgroundColor: '#f5a623' }}
                                    />
                                </div>
                            </div>
                            {/* Items */}
                            <div className="flex flex-col gap-2">
                                {checklist.map((item) => (
                                    <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={item.done}
                                            onChange={() => toggleCheck(item.id)}
                                            className="mt-0.5 accent-amber-500 w-4 h-4 shrink-0"
                                        />
                                        <span
                                            className="text-sm transition-colors"
                                            style={{ color: item.done ? '#94a3b8' : '#0d1b2a', textDecoration: item.done ? 'line-through' : 'none' }}
                                        >
                                            {item.text}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={markAllDone}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                >
                                    Mark All Done
                                </button>
                                <button
                                    onClick={closeChecklist}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
