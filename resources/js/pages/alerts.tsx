import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BellRing, CheckCircle, AlertCircle, Download, Inbox, Plus, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Alert } from '@/components/ui/alert';
import { type MRT_ColumnDef } from 'material-react-table';
import { DataTable } from '@/components/data-table';
import { formatDisplayText, cleanDataArray } from '@/lib/utils';
import { toSentenceCase, toTitleCase } from '@/lib/format-text';

type Beehive = {
    hive_id: string;
    hive_name: string;
    hive_location: string;
    hive_type: string;
    installation_date: string;
    current_state: string;
    owner: { id: string; name: string } | null;
};

type Beekeeper = {
    id: string;
    name: string;
};

type Inference = { 
    inference_id: string; 
    hive_id: string; 
    hive_state: string; 
    beehive?: { 
        hive_location: string; 
        owner?: { 
            id: string; 
            name: string; 
        }; 
    }; 
};
type Advisory  = { id: number; condition_label: string; advisory_text: string };

type Alert = {
    alert_id: string;
    inference_id: string;
    hive_id?: string;
    severity_level: string;
    alert_timestamp: string;
    action_status: string;
    recommended_action?: string | null;
    viewed_at?: string | null;
    inference?: Inference;
};

const severityConfig: Record<string, { label: string; bg: string; color: string }> = {
    critical: { label: 'Critical', bg: '#0d1b2a', color: '#ffffff' },
    high:     { label: 'High',     bg: '#fff7ed', color: '#f5a623' },
    medium:   { label: 'Medium',   bg: '#fffbeb', color: '#d97706' },
    low:      { label: 'Low',      bg: '#eff6ff', color: '#1d4ed8' },
    info:     { label: 'Info',     bg: '#f1f5f9', color: '#64748b' },
};
function severityCfg(level: string) {
    return severityConfig[level?.toLowerCase()] ?? { label: level ?? '—', bg: '#f1f5f9', color: '#64748b' };
}

const hiveStateColors: Record<string, string> = {
    swarm:            '#dc2626',
    pre_swarm:        '#d97706',
    normal:           '#16a34a',
    abscondment:      '#7c3aed',
    missing_queen:    '#ea580c',
    queenbee_present: '#16a34a',
    pest_infested:    '#ea580c',
    external_noise:   '#2563eb',
    uncertain:        '#64748b',
};
function hiveStateColor(state: string | null) {
    return state ? (hiveStateColors[state] ?? '#64748b') : '#94a3b8';
}



// Create a type for our log objects since we're using them in MRT
type Log = {
    ts: string;
    hive: string;
    hiveId: string | null;
    beekeeper: string | null;
    beekeeperId: string | null;
    hiveStatus: string | null;
    severity: string;
    desc: string;
    status: string;
    action: string;
    viewedAt: string | null;
    alertObj: Alert;
};

export default function AlertsPage({
    alerts = [],
    inferences = [],
    advisories = [],
    beehives = [],
    hives = [],
    beekeepers = [],
}: {
    alerts?: Alert[];
    inferences?: Inference[];
    advisories?: Advisory[];
    beehives?: Beehive[];
    hives?: Beehive[];
    beekeepers?: Beekeeper[];
}) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    // Clean the incoming data
    const cleanedAlerts = useMemo(() => {
        return cleanDataArray(alerts, ['inference.hive_state', 'inference.beehive.hive_location', 'inference.beehive.owner.name', 'recommended_action']);
    }, [alerts]);

    const cleanedInferences = useMemo(() => {
        return cleanDataArray(inferences, ['hive_state', 'beehive.hive_location', 'beehive.owner.name']);
    }, [inferences]);

    const cleanedHives = useMemo(() => {
        const hiveList = beehives.length > 0 ? beehives : hives;
        return cleanDataArray(hiveList, ['hive_name', 'hive_location', 'owner.name']);
    }, [beehives, hives]);

    const cleanedBeekeepers = useMemo(() => {
        return cleanDataArray(beekeepers, ['name']);
    }, [beekeepers]);

    const [showModal, setShowModal] = useState(false);
    const [notifying, setNotifying] = useState<string | null>(null);
    const [flashDismissed, setFlashDismissed] = useState(false);

    useEffect(() => { setFlashDismissed(false); }, [flash?.success, flash?.error]);
    const [selectedHiveId, setSelectedHiveId] = useState('all');
    const [selectedBeekeeperId, setSelectedBeekeeperId] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('All Levels');
    
    // No extra MRT state needed - let MRT handle it internally

    // Use either beehives or hives prop
    const hiveList = cleanedHives;
    
    // Get unique beekeepers from beehives or use beekeepers prop
    const beekeeperList = (cleanedBeekeepers.length > 0 
        ? cleanedBeekeepers 
        : [...new Map(hiveList
            .filter(h => h.owner)
            .map(h => [h.owner!.id, h.owner])
        ).values()])
        .filter((b): b is Beekeeper => b !== null);

    const { data, setData, post, reset, processing, errors } = useForm({
        inference_id: '',
        hive_id: '',
        severity_level: '',
        alert_timestamp: '',
        action_status: 'pending',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/alerts', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    const handleNotify = (alert: Alert) => {
        setNotifying(alert.alert_id);
        router.patch(`/alerts/${alert.alert_id}/notify`, {}, { onFinish: () => setNotifying(null) });
    };

    const pendingCount  = cleanedAlerts.filter((a) => a.action_status === 'pending').length;
    const sentCount     = cleanedAlerts.filter((a) => a.action_status === 'sent').length;

    const severityLevels = [...new Set(cleanedAlerts.map((a) => a.severity_level))];
    const typeCounts = severityLevels.map((level) => ({
        type:  level,
        count: cleanedAlerts.filter((a) => a.severity_level === level).length,
    }));

    const logs = cleanedAlerts.map((a) => ({
        ts:          new Date(a.alert_timestamp).toLocaleString(),
        hive:        a.inference?.beehive?.hive_location ?? 'SYSTEM',
        hiveId:      a.hive_id ?? a.inference?.hive_id ?? null,
        beekeeper:   a.inference?.beehive?.owner?.name   ?? null,
        beekeeperId: a.inference?.beehive?.owner?.id   ?? null,
        hiveStatus:  a.inference?.hive_state ?? null,
        severity:    a.severity_level,
        desc:        a.recommended_action ?? '—',
        status:      a.action_status,
        action:      a.action_status === 'pending' ? 'NOTIFY' : 'SENT',
        viewedAt:    a.viewed_at ?? null,
        alertObj:    a,
    }));

    // Filter logs by hive, beekeeper, and severity
    const filteredLogs = logs.filter((log) => {
        if (selectedHiveId !== 'all') {
            if (log.hiveId !== selectedHiveId) return false;
        }
        if (selectedBeekeeperId !== 'all') {
            if (log.beekeeperId !== selectedBeekeeperId) return false;
        }
        if (severityFilter !== 'All Levels') {
            const level = log.severity?.toLowerCase();
            if (severityFilter === 'Critical' && level !== 'critical') return false;
            if (severityFilter === 'Warning' && !['high', 'medium'].includes(level)) return false;
            if (severityFilter === 'Info' && !['low', 'info'].includes(level)) return false;
        }
        return true;
    });

    const exportLog = () => {
        const headers = ['Timestamp', 'Hive ID', 'Severity', 'Event Description', 'Status'];
        const escape  = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
        const rows    = filteredLogs.map((l) => {
            const sc = severityCfg(l.severity);
            return [l.ts, l.hive, sc.label, l.desc, l.status];
        });
        const csv  = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `alerts-log.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateReport = () => {
        const rows = filteredLogs.map((l) =>
            `<tr>
                <td>${l.ts}</td>
                <td>${l.hive}</td>
                <td><strong>${severityCfg(l.severity).label}</strong></td>
                <td>${l.desc}</td>
                <td>${l.status}</td>
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
    ${selectedHiveId !== 'all' ? ` &nbsp;|&nbsp; Hive: ${hiveList.find(h => h.hive_id === selectedHiveId)?.hive_name || `Hive #${selectedHiveId}`}` : ''}
    ${severityFilter !== 'All Levels' ? ` &nbsp;|&nbsp; Severity: ${severityFilter}` : ''}
  </div>
  <div class="summary">
    <div class="stat"><div class="stat-val">${filteredLogs.length}</div><div class="stat-lbl">Total Events</div></div>
    <div class="stat"><div class="stat-val">${filteredLogs.filter(l => l.severity?.toLowerCase() === 'critical').length}</div><div class="stat-lbl">Critical</div></div>
    <div class="stat"><div class="stat-val">${filteredLogs.filter(l => ['high', 'medium'].includes(l.severity?.toLowerCase())).length}</div><div class="stat-lbl">Warning</div></div>
    <div class="stat"><div class="stat-val">${filteredLogs.filter(l => ['low', 'info'].includes(l.severity?.toLowerCase())).length}</div><div class="stat-lbl">Info</div></div>
  </div>
  <table>
    <thead><tr><th>Timestamp</th><th>Hive ID</th><th>Severity</th><th>Event Description</th><th>Status</th></tr></thead>
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

    // Define MRT Columns
    const columns = useMemo<MRT_ColumnDef<Log>[]>(() => [
        {
            accessorKey: 'ts',
            header: 'Timestamp',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ cell, row }) => {
                return (
                    <div>
                        <p className="text-gray-400 whitespace-nowrap font-mono text-xs">{cell.getValue<string>()}</p>
                        <p className="text-[9px] mt-0.5" style={{ color: row.original.viewedAt ? '#16a34a' : '#94a3b8' }}>
                            {row.original.viewedAt
                                ? `Viewed ${new Date(row.original.viewedAt).toLocaleString()}`
                                : 'Not yet viewed'}
                        </p>
                    </div>
                );
            },
        },
        {
            id: 'hive',
            header: 'Hive / Beekeeper',
            accessorFn: (row) => row.hive,
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ row }) => {
                return (
                    <div>
                        <p className="font-semibold text-xs" style={{ color: '#0d1b2a' }}>{row.original.hive}</p>
                        {row.original.beekeeper && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{toTitleCase(row.original.beekeeper)}</p>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'hiveStatus',
            header: 'Hive Status',
            accessorFn: (row) => row.hiveStatus,
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['swarm', 'pre_swarm', 'normal', 'abscondment', 'missing_queen', 'queenbee_present', 'pest_infested', 'external_noise', 'uncertain'],
            Cell: ({ row }) => {
                return row.original.hiveStatus ? (
                    <span className="text-[10px] font-bold px-2 py-1 rounded tracking-widest"
                        style={{ backgroundColor: `${hiveStateColor(row.original.hiveStatus)}15`, color: hiveStateColor(row.original.hiveStatus) }}>
                        {toSentenceCase(row.original.hiveStatus)}
                    </span>
                ) : (
                    <span className="text-[10px] text-gray-400">—</span>
                );
            },
        },
        {
            accessorKey: 'severity',
            header: 'Severity',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['critical', 'high', 'medium', 'low', 'info'],
            Cell: ({ cell }) => {
                const sc = severityCfg(cell.getValue<string>());
                return (
                    <span className="text-[10px] font-bold px-2 py-1 rounded tracking-widest"
                        style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {sc.label}
                    </span>
                );
            },
        },
        {
            accessorKey: 'desc',
            header: 'Event Description',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ cell }) => <p className="text-gray-600 leading-snug max-w-xs text-xs">{cell.getValue<string>()}</p>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['pending', 'sent'],
            Cell: ({ row }) => {
                const isSent = row.original.status === 'sent';
                const isPending = row.original.status === 'pending';
                return isSent ? (
                    <span className="text-[10px] font-bold px-2 py-1 rounded tracking-widest"
                        style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>
                        Sent
                    </span>
                ) : isPending ? (
                    <span className="text-[10px] font-bold px-2 py-1 rounded tracking-widest"
                        style={{ backgroundColor: '#fff7ed', color: '#c2410c' }}>
                        Pending
                    </span>
                ) : (
                    <span className="text-[10px] text-gray-400">—</span>
                );
            },
        },
    ], []);

    return (
        <>
            <Head title="Alerts & Logs" />
            <div style={{ backgroundColor: '#f8f9fa' }}>

                {/* Sub-header */}
                <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
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
                        <select 
                            value={selectedHiveId} 
                            onChange={(e) => setSelectedHiveId(e.target.value)} 
                            className="border border-gray-300 rounded-lg p-2 text-sm bg-white" 
                        > 
                            <option value="all">All Hives</option> 
                            {hiveList?.map((hive) => ( 
                                <option key={hive.hive_id} value={hive.hive_id}> 
                                    {hive.hive_name || `Hive #${hive.hive_id}`} 
                                </option> 
                            ))} 
                        </select>
                        <select 
                            value={selectedBeekeeperId} 
                            onChange={(e) => setSelectedBeekeeperId(e.target.value)} 
                            className="border border-gray-300 rounded-lg p-2 text-sm bg-white" 
                        > 
                            <option value="all">All Beekeepers</option> 
                            {beekeeperList?.map((beekeeper) => (
                                <option key={beekeeper.id} value={beekeeper.id}>
                                    {toTitleCase(beekeeper.name)}
                                </option>
                            ))} 
                        </select>
                        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
                            <option>All Levels</option>
                            <option>Critical</option>
                            <option>Warning</option>
                            <option>Info</option>
                        </select>
                    </div>

                    {/* Cards row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-4">
                        {typeCounts.map(({ type, count }) => {
                            const sc = severityCfg(type);
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

                    {/* Material React Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>All Alert Logs</span>
                            </div>

                                <DataTable
                                columns={columns}
                                data={filteredLogs}
                                getRowId={(row) => row.alertObj.alert_id}
                                renderEmptyRowsFallback={() => (
                                    <div className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Inbox className="w-8 h-8 text-gray-300" />
                                            <p className="text-sm font-semibold text-gray-500">No alerts found</p>
                                            <p className="text-xs text-gray-400">
                                                {cleanedAlerts.length === 0
                                                    ? 'No alerts have been recorded yet.'
                                                    : 'No alerts match the current filters.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            />
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
                                <select value={data.inference_id} onChange={(e) => {
                                        const selected = cleanedInferences.find((inf) => inf.inference_id === e.target.value);
                                        setData('inference_id', e.target.value);
                                        setData('hive_id', selected?.hive_id ?? '');
                                    }}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="" disabled>Select an inference</option>
                                    {cleanedInferences.map((inf) => (
                                        <option key={inf.inference_id} value={inf.inference_id}>
                                            {inf.hive_state} @ {inf.beehive?.hive_location ?? inf.hive_id}
                                        </option>
                                    ))}
                                </select>
                                {errors.inference_id && <p className="text-xs text-red-500 mt-1">{errors.inference_id}</p>}
                                {errors.hive_id && <p className="text-xs text-red-500 mt-1">{errors.hive_id}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Severity Level</label>
                                <select value={data.severity_level} onChange={(e) => setData('severity_level', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="" disabled>Select severity</option>
                                    <option value="info">Info</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                                {errors.severity_level && <p className="text-xs text-red-500 mt-1">{errors.severity_level}</p>}
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

AlertsPage.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Alerts & Logs', href: '/alerts' },
    ]}>
        {page}
    </AppLayout>
);
