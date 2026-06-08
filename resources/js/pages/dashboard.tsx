import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    CheckSquare,
    Clock,
    ExternalLink,
    Hexagon,
    Mic,
    Terminal,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboard } from '@/routes';

type Stats = {
    total_hives: number;
    hives_this_month: number;
    total_beekeepers: number;
    active_alerts: number;
    alerts_yesterday: number;
    recordings_today: number;
    recordings_yesterday: number;
    need_attention: number;
};

type HiveItem = {
    id: string;
    name: string;
    type: string;
    location: string;
    hive_state: string;
    confidence: number | null;
};

type HiveCategories = { normal: number; at_risk: number; critical: number };
type InferenceRow   = { state: string; percentage: number };

type AlertItem = {
    id: string;
    hive_name: string;
    hive_location: string;
    severity_level: string;
    recommended_action: string;
    action_status: string;
    alert_timestamp: string | null;
};

type ActionItem     = { description: string; hive_name: string | null };
type ActionCounts   = Record<string, number>;
type LogItem        = { level: string; message: string; created_at: string | null };

type DashboardProps = {
    stats: Stats;
    greeting_name: string;
    hives_list: HiveItem[];
    hive_categories: HiveCategories;
    inference_distribution: InferenceRow[];
    recent_alerts: AlertItem[];
    action_counts: ActionCounts;
    high_priority_actions: ActionItem[];
    system_logs: LogItem[];
};

// ── Helpers ──────────────────────────────────────────────────────
function getDayLabel() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

const STATE_META: Record<string, { label: string; bg: string; text: string }> = {
    normal:     { label: 'Normal',     bg: '#dcfce7', text: '#15803d' },
    healthy:    { label: 'Normal',     bg: '#dcfce7', text: '#15803d' },
    swarming:   { label: 'Swarming',   bg: '#ffedd5', text: '#c2410c' },
    critical:   { label: 'Critical',   bg: '#fee2e2', text: '#b91c1c' },
    queen_risk: { label: 'Queen risk', bg: '#fef3c7', text: '#b45309' },
    queenless:  { label: 'Queenless',  bg: '#fef3c7', text: '#b45309' },
    high_temp:  { label: 'High temp',  bg: '#fef3c7', text: '#b45309' },
    at_risk:    { label: 'At risk',    bg: '#fef3c7', text: '#b45309' },
    unknown:    { label: 'Unknown',    bg: '#f1f5f9', text: '#64748b' },
};

function stateMeta(state: string) {
    return STATE_META[state] ?? {
        label: state.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        bg: '#f1f5f9', text: '#64748b',
    };
}

const SEVERITY_DOT: Record<string, string> = {
    critical: '#dc2626', high: '#dc2626',
    medium: '#f59e0b', low: '#3b82f6',
};
function severityDot(s: string) { return SEVERITY_DOT[s?.toLowerCase()] ?? '#94a3b8'; }

const SEVERITY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: '#fee2e2', text: '#b91c1c', label: 'Critical' },
    high:     { bg: '#fee2e2', text: '#b91c1c', label: 'High'     },
    medium:   { bg: '#fef3c7', text: '#b45309', label: 'Medium'   },
    low:      { bg: '#eff6ff', text: '#1d4ed8', label: 'Low'      },
};
function severityBadge(s: string) {
    return SEVERITY_BADGE[s?.toLowerCase()] ?? { bg: '#f1f5f9', text: '#64748b', label: s };
}

function timeAgo(iso: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return 'Yesterday ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const LOG_STYLE: Record<string, { bg: string; text: string }> = {
    ERROR: { bg: '#fee2e2', text: '#b91c1c' },
    WARN:  { bg: '#fef3c7', text: '#92400e' },
    INFO:  { bg: '#eff6ff', text: '#1e40af' },
};
function logStyle(level: string) { return LOG_STYLE[level] ?? { bg: '#f1f5f9', text: '#475569' }; }

// ── Donut chart ──────────────────────────────────────────────────
function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function donutArc(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) {
    const gap = 2; const s = startDeg + gap / 2; const e = endDeg - gap / 2;
    if (e <= s) return '';
    const o1 = polar(cx, cy, outerR, s), o2 = polar(cx, cy, outerR, e);
    const i1 = polar(cx, cy, innerR, e), i2 = polar(cx, cy, innerR, s);
    const large = e - s > 180 ? 1 : 0;
    return [
        `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
        `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
        `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
        `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`, 'Z',
    ].join(' ');
}
const DONUT_COLORS = { normal: '#3d7a3d', at_risk: '#b45309', critical: '#dc2626' };

function DonutChart({ categories }: { categories: HiveCategories }) {
    const total = categories.normal + categories.at_risk + categories.critical;
    const cx = 80, cy = 80, outerR = 68, innerR = 42;
    const segments = [
        { key: 'normal'   as const, count: categories.normal   },
        { key: 'at_risk'  as const, count: categories.at_risk  },
        { key: 'critical' as const, count: categories.critical },
    ];
    let cursor = 0;
    const arcs = segments.map((seg) => {
        const sweep = total > 0 ? (seg.count / total) * 360 : 0;
        const path  = donutArc(cx, cy, outerR, innerR, cursor, cursor + sweep);
        cursor += sweep;
        return { ...seg, path };
    });
    return (
        <svg viewBox="0 0 160 160" className="w-full h-full">
            {total === 0
                ? <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#e5e7eb" strokeWidth={outerR - innerR} />
                : arcs.map((arc) => arc.path ? <path key={arc.key} d={arc.path} fill={DONUT_COLORS[arc.key]} /> : null)
            }
        </svg>
    );
}

const INF_COLORS: Record<string, string> = {
    normal: '#3d7a3d', healthy: '#3d7a3d', swarming: '#dc2626',
    critical: '#dc2626', queenless: '#b45309', queen_risk: '#b45309',
    high_temp: '#f59e0b', at_risk: '#b45309',
};
function infColor(s: string) { return INF_COLORS[s] ?? '#94a3b8'; }

// ── Main component ───────────────────────────────────────────────
export default function Dashboard({
    stats, greeting_name,
    hives_list, hive_categories, inference_distribution,
    recent_alerts, action_counts, high_priority_actions, system_logs,
}: DashboardProps) {
    const alertDiff  = stats.active_alerts - stats.alerts_yesterday;
    const recDiff    = stats.recordings_today - stats.recordings_yesterday;
    const donutTotal = hive_categories.normal + hive_categories.at_risk + hive_categories.critical;

    const pendingCount    = action_counts['pending']     ?? 0;
    const inProgressCount = action_counts['in_progress'] ?? 0;
    const resolvedCount   = action_counts['resolved']    ?? 0;
    const actionTotal     = pendingCount + inProgressCount + resolvedCount || 1;

    // ── Modal visibility state ───────────────────────────────────────────────
    const [showExportModal, setShowExportModal]     = useState(false);
    const [showLocatorModal, setShowLocatorModal]   = useState(false);
    const [showForecastModal, setShowForecastModal] = useState(false);
    const [showChecklistModal, setShowChecklistModal] = useState(false);

    // ── Export modal state ───────────────────────────────────────────────────
    const [selectedRange, setSelectedRange]   = useState<'today' | '7d' | '30d' | 'custom'>('7d');
    const [customFrom, setCustomFrom]         = useState('');
    const [customTo, setCustomTo]             = useState('');
    const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('pdf');
    const [exportLoading, setExportLoading]   = useState(false);
    const [exportSuccess, setExportSuccess]   = useState(false);

    // ── Hive locator state ───────────────────────────────────────────────────
    const [activePin, setActivePin] = useState<string | null>(null);

    // ── Checklist state ──────────────────────────────────────────────────────
    const [checklist, setChecklist] = useState(initialChecklist);

    // ── Time range state ─────────────────────────────────────────────────────
    const [activeRange, setActiveRange] = useState<TimeRange>('24H');

    // ── Export handler ───────────────────────────────────────────────────────
    const handleExport = async () => {
        setExportLoading(true);
        try {
            const rangeLabel =
                selectedRange === 'today'  ? 'Today' :
                selectedRange === '7d'     ? 'Last 7 Days' :
                selectedRange === '30d'    ? 'Last 30 Days' :
                `${customFrom} to ${customTo}`;

            if (selectedFormat === 'csv') {
                const csvContent = [
                    'Hive ID,Timestamp,Status,Swarm Risk Score,Temperature,Humidity,Alert Type',
                    'Hive-A01,2026-05-11 08:00,Normal,32%,28°C,65%,None',
                    'Hive-B03,2026-05-11 08:00,Pre-Swarm,68%,30°C,72%,Warning',
                    'Hive-C08,2026-05-11 08:00,Normal,45%,27°C,87%,Humidity Alert',
                    'Hive-A12,2026-05-11 08:00,Pre-Swarm,89%,36°C,78%,Critical',
                    'Hive-B11,2026-05-11 08:00,Normal,61%,34°C,71%,None',
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url  = URL.createObjectURL(blob);
                const a    = document.createElement('a');
                a.href     = url;
                a.download = 'BSADS_Report.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

            } else {
                // PDF — dynamically import jsPDF to keep bundle lean
                const { jsPDF } = await import('jspdf');
                const doc = new jsPDF();

                doc.setFontSize(16);
                doc.setTextColor(13, 27, 42);
                doc.text('BSADS Hive Report', 20, 20);

                doc.setFontSize(11);
                doc.setTextColor(100, 116, 139);
                doc.text(`Date Range: ${rangeLabel}`, 20, 32);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);

                doc.setFontSize(10);
                doc.setTextColor(13, 27, 42);

                // Table header
                doc.setFillColor(13, 27, 42);
                doc.rect(20, 50, 170, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.text('Hive ID', 22, 56);
                doc.text('Status', 60, 56);
                doc.text('Risk', 100, 56);
                doc.text('Temp', 120, 56);
                doc.text('Humidity', 145, 56);
                doc.text('Alert', 175, 56);

                // Table rows
                const rows = [
                    ['Hive-A01', 'Normal',    '32%', '28°C', '65%', 'None'],
                    ['Hive-B03', 'Pre-Swarm', '68%', '30°C', '72%', 'Warning'],
                    ['Hive-C08', 'Normal',    '45%', '27°C', '87%', 'Humidity Alert'],
                    ['Hive-A12', 'Pre-Swarm', '89%', '36°C', '78%', 'Critical'],
                    ['Hive-B11', 'Normal',    '61%', '34°C', '71%', 'None'],
                ];

                rows.forEach((row, idx) => {
                    const y = 66 + idx * 10;
                    if (idx % 2 === 0) {
                        doc.setFillColor(248, 249, 250);
                        doc.rect(20, y - 4, 170, 10, 'F');
                    }
                    doc.setTextColor(13, 27, 42);
                    doc.text(row[0], 22, y + 2);
                    doc.text(row[1], 60, y + 2);
                    doc.text(row[2], 100, y + 2);
                    doc.text(row[3], 120, y + 2);
                    doc.text(row[4], 145, y + 2);
                    doc.text(row[5], 175, y + 2);
                });

                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text('SwarmIntel Bee Monitoring Pro — Confidential', 20, 280);

                doc.save('BSADS_Report.pdf');
            }

            // Download triggered successfully — show success
            setExportLoading(false);
            setExportSuccess(true);
            setTimeout(() => {
                setExportSuccess(false);
                setShowExportModal(false);
            }, 1200);

        } catch (err) {
            console.error('Export failed:', err);
            setExportLoading(false);
        }
    };

    const closeExportModal = () => {
        setShowExportModal(false);
        setExportLoading(false);
        setExportSuccess(false);
        setSelectedRange('7d');
        setSelectedFormat('pdf');
        setCustomFrom('');
        setCustomTo('');
    };

    // ── Checklist helpers ────────────────────────────────────────────────────
    const toggleCheckItem = (id: number) => {
        setChecklist((prev) => prev.map((item) => item.id === id ? { ...item, done: !item.done } : item));
    };
    const markAllDone = () => setChecklist((prev) => prev.map((item) => ({ ...item, done: true })));
    const doneCount = checklist.filter((i) => i.done).length;

    // ── Risk color helper ────────────────────────────────────────────────────
    const riskColor = (pct: number) => pct > 75 ? '#ef4444' : pct >= 50 ? '#f5a623' : '#22c55e';

    // ── Listen for search-triggered actions (from app-header) ────────────────
    useEffect(() => {
        const handler = (e: Event) => {
            const { action, target } = (e as CustomEvent).detail;
            if (action === 'scroll') {
                const el = document.getElementById(target);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (action === 'modal') {
                if (target === 'export')  setShowExportModal(true);
                if (target === 'locator') setShowLocatorModal(true);
            }
        };
        window.addEventListener('dashboard-search-action', handler);
        return () => window.removeEventListener('dashboard-search-action', handler);
    }, []);

    // ── Handle ?open= query param (from search on other pages) ──────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const open = params.get('open');
        if (open === 'export')  { setShowExportModal(true);  }
        if (open === 'locator') { setShowLocatorModal(true); }
        // Handle hash scroll
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            setTimeout(() => {
                const el = document.getElementById(hash);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, []);

    // ── Alert card state ─────────────────────────────────────────────────────
    type AlertCard = typeof criticalAlerts[number];
    const [visibleAlerts, setVisibleAlerts] = useState<AlertCard[]>(criticalAlerts);

    // Deploy Team modal
    const [deployTarget, setDeployTarget]   = useState<AlertCard | null>(null);
    const [deployNotes, setDeployNotes]     = useState('');
    const [deployDone, setDeployDone]       = useState(false);

    // Dismiss modal
    const [dismissTarget, setDismissTarget] = useState<AlertCard | null>(null);
    const [dismissReason, setDismissReason] = useState('False alarm');
    const [dismissDone, setDismissDone]     = useState(false);

    const handleConfirmDeploy = () => {
        if (!deployTarget) return;
        // Log action (console represents backend call)
        console.log('[DEPLOY]', {
            alertId: deployTarget.id,
            hive: deployTarget.hive,
            notes: deployNotes,
            timestamp: new Date().toISOString(),
            status: 'Team Dispatched',
        });
        setDeployDone(true);
        setTimeout(() => {
            setDeployDone(false);
            setDeployTarget(null);
            setDeployNotes('');
            router.visit('/alerts');
        }, 1000);
    };

    const handleConfirmDismiss = () => {
        if (!dismissTarget) return;
        console.log('[DISMISS]', {
            alertId: dismissTarget.id,
            hive: dismissTarget.hive,
            reason: dismissReason,
            timestamp: new Date().toISOString(),
            status: 'Dismissed',
        });
        // Remove from visible alerts
        setVisibleAlerts((prev) => prev.filter((a) => a.id !== dismissTarget.id));
        setDismissDone(true);
        setTimeout(() => {
            setDismissDone(false);
            setDismissTarget(null);
            setDismissReason('False alarm');
            router.visit('/alerts');
        }, 1000);
    };

    return (
        <>
            <Head title="Dashboard" />

            {/* ══════════════════════════════════════════════════════════════
                EXPORT REPORT MODAL
            ══════════════════════════════════════════════════════════════ */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Export Report</h2>
                            <button onClick={closeExportModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-5">
                            {exportSuccess ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
                                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Report exported successfully ✓</p>
                                </div>
                            ) : (
                                <>
                                    {/* Date range */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Date Range</p>
                                        <div className="flex flex-col gap-2">
                                            {([['today', 'Today'], ['7d', 'Last 7 Days'], ['30d', 'Last 30 Days'], ['custom', 'Custom']] as const).map(([val, label]) => (
                                                <label key={val} className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="dateRange"
                                                        value={val}
                                                        checked={selectedRange === val}
                                                        onChange={() => setSelectedRange(val)}
                                                        className="accent-amber-500"
                                                    />
                                                    <span className="text-sm" style={{ color: '#0d1b2a' }}>{label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {selectedRange === 'custom' && (
                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">From</label>
                                                    <input
                                                        type="date"
                                                        value={customFrom}
                                                        onChange={(e) => setCustomFrom(e.target.value)}
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                                                        style={{ color: '#0d1b2a' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">To</label>
                                                    <input
                                                        type="date"
                                                        value={customTo}
                                                        onChange={(e) => setCustomTo(e.target.value)}
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                                                        style={{ color: '#0d1b2a' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Format */}
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Format</p>
                                        <div className="flex gap-4">
                                            {(['pdf', 'csv'] as const).map((fmt) => (
                                                <label key={fmt} className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="format"
                                                        value={fmt}
                                                        checked={selectedFormat === fmt}
                                                        onChange={() => setSelectedFormat(fmt)}
                                                        className="accent-amber-500"
                                                    />
                                                    <span className="text-sm font-semibold uppercase" style={{ color: '#0d1b2a' }}>{fmt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleExport}
                                            disabled={exportLoading}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-70"
                                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                        >
                                            {exportLoading ? 'Exporting…' : 'Export'}
                                        </button>
                                        <button
                                            onClick={closeExportModal}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                HIVE LOCATOR MODAL
            ══════════════════════════════════════════════════════════════ */}
            {showLocatorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Hive Locator</h2>
                            <button onClick={() => { setShowLocatorModal(false); setActivePin(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Map placeholder */}
                            <div
                                className="relative w-full rounded-xl overflow-hidden"
                                style={{ backgroundColor: '#1a3a2a', height: '320px' }}
                            >
                                {/* Grid lines */}
                                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                    {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((pct) => (
                                        <g key={pct}>
                                            <line x1={`${pct}%`} y1="0" x2={`${pct}%`} y2="100%" stroke="#2d5a3d" strokeWidth="1" />
                                            <line x1="0" y1={`${pct}%`} x2="100%" y2={`${pct}%`} stroke="#2d5a3d" strokeWidth="1" />
                                        </g>
                                    ))}
                                </svg>
                                {/* Map label */}
                                <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-green-400/60">
                                    Apiary Zone — Sector 4
                                </div>
                                {/* Hive pins */}
                                {hivePins.map((pin) => (
                                    <div
                                        key={pin.id}
                                        className="absolute cursor-pointer"
                                        style={{ top: pin.top, left: pin.left, transform: 'translate(-50%, -50%)' }}
                                        onClick={() => setActivePin(activePin === pin.id ? null : pin.id)}
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125"
                                            style={{ backgroundColor: pin.color }}
                                        />
                                        {activePin === pin.id && (
                                            <div
                                                className="absolute z-10 bottom-6 left-1/2 -translate-x-1/2 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap"
                                                style={{ backgroundColor: '#0d1b2a' }}
                                            >
                                                <p className="text-[11px] font-bold text-white">{pin.id}</p>
                                                <p className="text-[10px] mt-0.5" style={{ color: pin.color }}>{pin.status}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {/* Legend */}
                                <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 bg-black/40 rounded-lg px-3 py-2">
                                    {([['#22c55e', 'Active/Stable'], ['#f5a623', 'Warning'], ['#ef4444', 'Swarm Likely'], ['#94a3b8', 'Inactive']] as const).map(([color, label]) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                            <span className="text-[10px] text-white/70">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Link
                                    href="/beehives"
                                    className="text-xs font-semibold underline underline-offset-2"
                                    style={{ color: '#f5a623' }}
                                >
                                    View All Hives →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                48-HOUR FORECAST MODAL
            ══════════════════════════════════════════════════════════════ */}
            {showForecastModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>48-Hour Swarm Risk Forecast</h2>
                            <button onClick={() => setShowForecastModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-5">
                            {/* Overall risk */}
                            <div className="flex items-center gap-5">
                                <div className="relative w-20 h-20 shrink-0">
                                    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f5a623" strokeWidth="3" strokeDasharray="75 25" strokeLinecap="round" />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-base font-bold" style={{ color: '#0d1b2a' }}>75%</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: '#0d1b2a' }}>Overall Risk Level</p>
                                    <p className="text-xs text-gray-400 mt-1 leading-snug">Aggregate swarm probability across all monitored hives in the next 48 hours.</p>
                                </div>
                            </div>
                            {/* Hive table */}
                            <div className="overflow-hidden rounded-xl border border-gray-100">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-widest text-[10px]">Hive</th>
                                            <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-widest text-[10px]">Risk</th>
                                            <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-widest text-[10px]">Temp</th>
                                            <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-widest text-[10px]">Humidity</th>
                                            <th className="text-left px-4 py-2.5 font-semibold text-gray-400 uppercase tracking-widest text-[10px]">Pressure</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {forecastHives.map((h) => (
                                            <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-semibold" style={{ color: '#0d1b2a' }}>{h.id}</td>
                                                <td className="px-4 py-3">
                                                    <span className="font-bold" style={{ color: riskColor(h.risk) }}>{h.risk}%</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">{h.temp}</td>
                                                <td className="px-4 py-3 text-gray-500">{h.humidity}</td>
                                                <td className="px-4 py-3 text-gray-500">{h.pressure}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                SWARM PREPARATION CHECKLIST MODAL
            ══════════════════════════════════════════════════════════════ */}
            {showChecklistModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Swarm Preparation Checklist</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Recommended actions based on current risk level</p>
                            </div>
                            <button onClick={() => setShowChecklistModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {/* Progress bar */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-400">{doneCount} / {checklist.length} completed</span>
                                    <span className="text-xs font-bold" style={{ color: '#f5a623' }}>{Math.round((doneCount / checklist.length) * 100)}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{ width: `${(doneCount / checklist.length) * 100}%`, backgroundColor: '#f5a623' }}
                                    />
                                </div>
                            </div>
                            {/* Checklist items */}
                            <div className="flex flex-col gap-2">
                                {checklist.map((item) => (
                                    <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={item.done}
                                            onChange={() => toggleCheckItem(item.id)}
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
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                >
                                    Mark All Done
                                </button>
                                <button
                                    onClick={() => setShowChecklistModal(false)}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                DEPLOY TEAM MODAL
            ══════════════════════════════════════════════════════════════ */}
            {deployTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Deploy Response Team</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Confirm deployment for this alert</p>
                            </div>
                            <button onClick={() => { setDeployTarget(null); setDeployNotes(''); setDeployDone(false); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {deployDone ? (
                                <div className="flex flex-col items-center justify-center py-6 gap-3">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f0fdf4' }}>
                                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Team Dispatched ✓</p>
                                    <p className="text-xs text-gray-400">Redirecting to Alerts & Logs…</p>
                                </div>
                            ) : (
                                <>
                                    {/* Alert summary */}
                                    <div className="rounded-xl p-4 flex flex-col gap-1" style={{ backgroundColor: '#fff7ed' }}>
                                        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#f5a623' }}>Alert Summary</p>
                                        <p className="text-sm font-semibold mt-1" style={{ color: '#0d1b2a' }}>{deployTarget.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{deployTarget.desc}</p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                            <span>Hive: <strong style={{ color: '#0d1b2a' }}>HIVE-{deployTarget.hive}</strong></span>
                                            <span>•</span>
                                            <span>{deployTarget.time}</span>
                                        </div>
                                    </div>
                                    {/* Deployment notes */}
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">
                                            Deployment Notes / Instructions
                                        </label>
                                        <textarea
                                            value={deployNotes}
                                            onChange={(e) => setDeployNotes(e.target.value)}
                                            placeholder="e.g. Bring protective gear, check queen cells, report back within 2 hours…"
                                            rows={3}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none resize-none placeholder-gray-300 focus:border-amber-400"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button
                                            onClick={handleConfirmDeploy}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                        >
                                            Confirm & Deploy
                                        </button>
                                        <button
                                            onClick={() => { setDeployTarget(null); setDeployNotes(''); }}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                DISMISS ALERT MODAL
            ══════════════════════════════════════════════════════════════ */}
            {dismissTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Dismiss Alert</h2>
                            <button onClick={() => { setDismissTarget(null); setDismissReason('False alarm'); setDismissDone(false); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {dismissDone ? (
                                <div className="flex flex-col items-center justify-center py-6 gap-3">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                                        <CheckCircle2 className="w-7 h-7 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Alert Dismissed</p>
                                    <p className="text-xs text-gray-400">Redirecting to Alerts & Logs…</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600">
                                        Dismiss this alert? <span className="font-semibold" style={{ color: '#0d1b2a' }}>{dismissTarget.title}</span>
                                    </p>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Reason</label>
                                        <select
                                            value={dismissReason}
                                            onChange={(e) => setDismissReason(e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white focus:border-amber-400"
                                        >
                                            <option>False alarm</option>
                                            <option>Already handled</option>
                                            <option>Will monitor</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button
                                            onClick={handleConfirmDismiss}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                            style={{ backgroundColor: '#0d1b2a', color: 'white' }}
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => { setDismissTarget(null); setDismissReason('False alarm'); }}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="flex-1 p-6 flex flex-col gap-6">

                    {/* ── Greeting ── */}
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>
                            Good morning, {greeting_name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {getDayLabel()}
                            {stats.need_attention > 0 && (
                                <> · <span className="text-red-500 font-medium">
                                    {stats.need_attention} hive{stats.need_attention !== 1 ? 's' : ''} need attention today
                                </span></>
                            )}
                        </p>
                    </div>

                    {/* ── Summary stat cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">Total hives</p>
                                <Clock className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold mt-1" style={{ color: '#0d1b2a' }}>{stats.total_hives}</p>
                            <p className={`text-xs font-medium mt-1 ${stats.hives_this_month > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                {stats.hives_this_month > 0 ? `↑ +${stats.hives_this_month} this month` : '— no change'}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">Beekeepers</p>
                                <Users className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold mt-1" style={{ color: '#0d1b2a' }}>{stats.total_beekeepers}</p>
                            <p className="text-xs text-gray-400 mt-1">— no change</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">Active alerts</p>
                                <AlertTriangle className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold mt-1" style={{ color: stats.active_alerts > 0 ? '#ef4444' : '#0d1b2a' }}>
                                {stats.active_alerts}
                            </p>
                            <p className={`text-xs font-medium mt-1 ${alertDiff > 0 ? 'text-red-500' : alertDiff < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                {alertDiff === 0 ? '— no change' : alertDiff > 0 ? `↑ +${alertDiff} since yesterday` : `↓ ${alertDiff} since yesterday`}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">Recordings today</p>
                                <Mic className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold mt-1" style={{ color: '#0d1b2a' }}>{stats.recordings_today}</p>
                            <p className={`text-xs font-medium mt-1 ${recDiff > 0 ? 'text-emerald-500' : recDiff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {recDiff === 0 ? '— no change' : recDiff > 0 ? `↑ +${recDiff} vs yesterday` : `↓ ${recDiff} vs yesterday`}
                            </p>
                        </div>
                    </div>

                    {/* ── Hive status + charts ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                        {/* Hive list */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Hexagon className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Hive status</span>
                                </div>
                                <button onClick={() => router.visit('/beehives')}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                    View all <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                            {hives_list.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-12 text-sm text-gray-400">No hives registered yet</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {hives_list.map((hive) => {
                                        const meta = stateMeta(hive.hive_state);
                                        return (
                                            <div key={hive.id}
                                                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => router.visit(`/beehives/${hive.id}`)}>
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#fff7ed' }}>
                                                    <Hexagon className="w-5 h-5" style={{ color: '#c2410c' }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold truncate leading-tight" style={{ color: '#0d1b2a' }}>
                                                        {hive.name}{hive.type ? ` — ${hive.type}` : ''}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{hive.location}</p>
                                                </div>
                                                <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ backgroundColor: meta.bg, color: meta.text }}>
                                                    {meta.label}
                                                </span>
                                                {hive.confidence !== null && (
                                                    <span className="shrink-0 text-xs font-medium text-gray-500 w-8 text-right">
                                                        {hive.confidence}%
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Donut + bar */}
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Hexagon className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Hive states</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-40 h-40 shrink-0"><DonutChart categories={hive_categories} /></div>
                                    <div className="flex flex-col gap-3">
                                        {([['normal','Normal'],['at_risk','At risk'],['critical','Critical']] as const).map(([key, label]) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[key] }} />
                                                <span className="text-sm text-gray-600">{label}</span>
                                                <span className="text-sm font-semibold ml-auto pl-4" style={{ color: '#0d1b2a' }}>
                                                    {hive_categories[key]}
                                                </span>
                                            </div>
                                        ))}
                                        {donutTotal === 0 && <p className="text-xs text-gray-400">No inference data yet</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Hexagon className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Inference states</span>
                                </div>
                                {inference_distribution.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-4 text-center">No inference results yet</p>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {inference_distribution.map((row) => (
                                            <div key={row.state} className="flex items-center gap-3">
                                                <span className="text-sm text-gray-600 w-24 shrink-0">{stateMeta(row.state).label}</span>
                                                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${row.percentage}%`, backgroundColor: infColor(row.state) }} />
                                                </div>
                                                <span className="text-sm font-medium text-gray-500 w-9 text-right shrink-0">{row.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Recent alerts + Advisory actions ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Recent alerts */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Recent alerts</span>
                                </div>
                                <button onClick={() => router.visit('/alerts')}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                    View all <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                            {recent_alerts.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-10 text-sm text-gray-400">No alerts yet</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {recent_alerts.map((a) => {
                                        const badge = severityBadge(a.severity_level);
                                        const dot   = severityDot(a.severity_level);
                                        const status = a.action_status?.replace(/_/g, ' ') ?? '';
                                        return (
                                            <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                                                <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: dot }} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold leading-tight" style={{ color: '#0d1b2a' }}>
                                                        {a.recommended_action} — {a.hive_name}, {a.hive_location}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        {timeAgo(a.alert_timestamp)} · {badge.label} · {status}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ backgroundColor: badge.bg, color: badge.text }}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Advisory actions */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Advisory actions</span>
                                </div>
                                <button onClick={() => router.visit('/advisories')}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                    View all <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="px-5 py-4 flex flex-col gap-3 border-b border-gray-100">
                                {[
                                    { label: 'Pending',     count: pendingCount,    color: '#dc2626' },
                                    { label: 'In progress', count: inProgressCount, color: '#b45309' },
                                    { label: 'Resolved',    count: resolvedCount,   color: '#15803d' },
                                ].map(({ label, count, color }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600 w-24 shrink-0">{label}</span>
                                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{
                                                width: `${Math.round((count / actionTotal) * 100)}%`,
                                                backgroundColor: color,
                                            }} />
                                        </div>
                                        <span className="text-sm font-semibold w-6 text-right shrink-0" style={{ color: '#0d1b2a' }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                            {high_priority_actions.length > 0 && (
                                <div className="px-5 py-4 flex flex-col gap-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                                        High priority pending
                                    </p>
                                    {high_priority_actions.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                            <p className="text-xs text-gray-700 flex-1">
                                                {a.description}{a.hive_name ? ` — ${a.hive_name}` : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── System logs ── */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>System logs</span>
                            </div>
                            <button className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                View all <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                        {system_logs.length === 0 ? (
                            <div className="flex items-center justify-center py-10 text-sm text-gray-400">No system logs yet</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {system_logs.map((log, i) => {
                                    const style = logStyle(log.level);
                                    return (
                                        <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded w-14 text-center"
                                                style={{ backgroundColor: style.bg, color: style.text }}>
                                                {log.level}
                                            </span>
                                            <p className="flex-1 text-xs text-gray-700 truncate">{log.message}</p>
                                            <span className="shrink-0 text-[11px] text-gray-400 tabular-nums">{log.created_at ?? ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Admin Dashboard', href: dashboard() }],
};
