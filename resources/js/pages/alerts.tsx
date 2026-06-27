import { Head, usePage } from '@inertiajs/react';
import { CheckCircle, AlertCircle, Download, Inbox, Search, X } from 'lucide-react';
import type {MRT_ColumnDef} from 'material-react-table';
import React, { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table';
import type { Alert } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { toSentenceCase, toTitleCase } from '@/lib/format-text';
import { cleanDataArray, exportToCsv } from '@/lib/utils';

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
    critical: { label: 'Critical', bg: '#fee2e2', color: '#dc2626' },
    warning:  { label: 'Warning',  bg: '#ffedd5', color: '#ea580c' },
    info:     { label: 'Info',     bg: '#dcfce7', color: '#16a34a' },
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
    tsDate: Date;
    hive: string;
    hiveId: string | null;
    beekeeper: string | null;
    beekeeperId: string | null;
    hiveStatus: string | null;
    severity: string;
    desc: string;
    viewedAt: string | null;
    alertObj: Alert;
};

export default function AlertsPage({
    alerts = [],
    beehives = [],
    hives = [],
    beekeepers = [],
}: {
    alerts?: Alert[];
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

    const cleanedHives = useMemo(() => {
        const hiveList = beehives.length > 0 ? beehives : hives;

        return cleanDataArray(hiveList, ['hive_name', 'hive_location', 'owner.name']);
    }, [beehives, hives]);

    const cleanedBeekeepers = useMemo(() => {
        return cleanDataArray(beekeepers, ['name']);
    }, [beekeepers]);

    const [dismissedFlash, setDismissedFlash] = useState<string | null>(null);
    const currentFlash = flash?.success ?? flash?.error ?? null;
    const flashDismissed = dismissedFlash !== null && dismissedFlash === currentFlash;

    const [selectedHiveId, setSelectedHiveId] = useState('all');
    const [selectedBeekeeperId, setSelectedBeekeeperId] = useState('all');
    const [severityFilter, setSeverityFilter] = useState('All Levels');
    const [search, setSearch] = useState('');

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

    const typeCounts = ['critical', 'warning', 'info'].map((level) => ({
        type:  level,
        count: cleanedAlerts.filter((a) => a.severity_level?.toLowerCase() === level).length,
    }));

    const logs = cleanedAlerts.map((a) => ({
        ts:          new Date(a.alert_timestamp).toLocaleString(),
        tsDate:      new Date(a.alert_timestamp),
        hive:        a.inference?.beehive?.hive_location ?? 'SYSTEM',
        hiveId:      a.hive_id ?? a.inference?.hive_id ?? null,
        beekeeper:   a.inference?.beehive?.owner?.name   ?? null,
        beekeeperId: a.inference?.beehive?.owner?.id   ?? null,
        hiveStatus:  a.inference?.hive_state ?? null,
        severity:    a.severity_level,
        desc:        a.recommended_action ?? '—',
        viewedAt:    a.viewed_at ?? null,
        alertObj:    a,
    }));

    // Filter logs by search, hive, beekeeper, and severity
    const filteredLogs = logs.filter((log) => {
        if (search.trim()) {
            const haystack = `${log.hive} ${log.beekeeper ?? ''} ${log.desc}`.toLowerCase();

            if (!haystack.includes(search.trim().toLowerCase())) {
return false;
}
        }

        if (selectedHiveId !== 'all') {
            if (log.hiveId !== selectedHiveId) {
return false;
}
        }

        if (selectedBeekeeperId !== 'all') {
            if (log.beekeeperId !== selectedBeekeeperId) {
return false;
}
        }

        if (severityFilter !== 'All Levels') {
            if (log.severity?.toLowerCase() !== severityFilter.toLowerCase()) {
return false;
}
        }

        return true;
    });

    const exportLog = () => {
        const headers = ['Timestamp', 'Hive', 'Beekeeper', 'Severity', 'Event Description'];
        const rows    = filteredLogs.map((l) => {
            const sc = severityCfg(l.severity);

            return [l.ts, l.hive, l.beekeeper ?? '—', sc.label, l.desc];
        });
        exportToCsv('alerts-log.csv', headers, rows);
    };

    const generateReport = () => {
        const rows = filteredLogs.map((l) =>
            `<tr>
                <td>${l.ts}</td>
                <td>${l.hive}</td>
                <td><strong>${severityCfg(l.severity).label}</strong></td>
                <td>${l.desc}</td>
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
    <div class="stat"><div class="stat-val">${filteredLogs.filter(l => l.severity?.toLowerCase() === 'warning').length}</div><div class="stat-lbl">Warning</div></div>
    <div class="stat"><div class="stat-val">${filteredLogs.filter(l => l.severity?.toLowerCase() === 'info').length}</div><div class="stat-lbl">Info</div></div>
  </div>
  <table>
    <thead><tr><th>Timestamp</th><th>Hive ID</th><th>Severity</th><th>Event Description</th></tr></thead>
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

        if (win) {
 win.document.write(html); win.document.close(); 
}
    };

    // Define MRT Columns
    const columns = useMemo<MRT_ColumnDef<Log>[]>(() => [
        {
            id: 'ts',
            accessorFn: (row) => row.tsDate,
            header: 'Time',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'datetime-range',
            size: 140,
            Cell: ({ row }) => {
                return <p className="text-gray-400 whitespace-nowrap font-mono text-xs">{row.original.ts}</p>;
            },
        },
        {
            id: 'hive',
            header: 'Hive',
            accessorFn: (row) => row.hive,
            enableSorting: true,
            enableColumnFilter: true,
            size: 120,
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
            accessorKey: 'severity',
            header: 'Severity',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['critical', 'warning', 'info'],
            size: 100,
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
    ], []);

    const renderDetailPanel = ({ row }: { row: any }) => {
        const log = row.original as Log;

        return (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Event Description</p>
                        <p className="text-sm leading-snug" style={{ color: '#0d1b2a' }}>{log.desc}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Hive Status</p>
                        {log.hiveStatus ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded tracking-widest"
                                style={{ backgroundColor: `${hiveStateColor(log.hiveStatus)}15`, color: hiveStateColor(log.hiveStatus) }}>
                                {toSentenceCase(log.hiveStatus)}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-400">—</span>
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Viewed</p>
                        <p className="text-sm text-gray-400 italic">
                            {log.viewedAt
                                ? `Viewed ${new Date(log.viewedAt).toLocaleString()}`
                                : 'Not yet viewed'}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="Alerts & Logs" />
            <div style={{ backgroundColor: '#f8f9fa' }}>
                <div className="p-6 flex flex-col gap-5">

                    {/* Flash messages */}
                    {!flashDismissed && flash?.success && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                            style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                <span>{flash.success}</span>
                            </div>
                            <button onClick={() => setDismissedFlash(currentFlash)} className="p-0.5 rounded hover:opacity-70">
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
                            <button onClick={() => setDismissedFlash(currentFlash)} className="p-0.5 rounded hover:opacity-70">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={exportLog}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity ml-auto"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            <Download className="w-4 h-4" /> Export Log
                        </button>
                        <button
                            onClick={generateReport}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-400 hover:bg-gray-50 transition-colors"
                        >
                            Generate Report
                        </button>
                    </div>

                    {/* Cards row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 w-full gap-4">
                        {typeCounts.map(({ type, count }) => {
                            const sc = severityCfg(type);

                            return (
                                <div key={type} className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{sc.label}</p>
                                    <p className="text-2xl font-bold mt-1" style={{ color: sc.color }}>
                                        {count}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Material React Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <DataTable
                                columns={columns}
                                data={filteredLogs}
                                getRowId={(row) => row.alertObj.alert_id}
                                renderDetailPanel={renderDetailPanel}
                                renderTopToolbarCustomActions={() => (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search hive, beekeeper or description…"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm bg-white"
                                            />
                                        </div>
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
                                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white" style={{ color: '#0d1b2a' }}>
                                            <option>All Levels</option>
                                            <option>Critical</option>
                                            <option>Warning</option>
                                            <option>Info</option>
                                        </select>
                                    </div>
                                )}
                                renderEmptyRowsFallback={() => (
                                    <div className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Inbox className="w-8 h-8 text-gray-400" />
                                            <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>No alerts found</p>
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
