import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    BarChart2,
    CheckCircle2,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { dashboard } from '@/routes';

type DashboardProps = {
    stats?: {
        total_beekeepers: number;
        total_beehives: number;
        active_beehives: number;
        inactive_beehives: number;
    };
    recent_beehives?: Array<{
        id: string;
        hive_location: string;
        hive_type: string;
        current_state: string;
        owner: { name: string };
    }>;
};

// ── Chart path data per time range ──────────────────────────────────────────
const chartPaths = {
    '1H': {
        dark: 'M50,200 C70,160 90,240 110,180 C130,120 150,260 170,200 C190,140 210,220 230,160 C250,100 270,240 290,180 C310,120 330,200 350,140 C370,80 390,220 410,160 C430,100 450,180 470,120 C490,80 530,160 590,100',
        orange: 'M50,280 C80,260 110,240 140,210 C170,180 200,200 230,170 C260,140 290,160 320,130 C350,100 380,120 410,90 C440,60 470,80 510,50 C540,35 565,25 590,15',
    },
    '24H': {
        dark: 'M50,240 C120,240 150,80 220,100 C290,120 320,260 390,240 C460,220 500,120 590,80',
        orange: 'M50,290 C100,280 150,260 200,230 C250,200 300,170 350,140 C400,110 450,80 500,55 C530,40 560,30 590,20',
    },
    '7D': {
        dark: 'M50,220 C130,215 200,190 280,180 C360,170 430,160 510,140 C545,132 568,120 590,110',
        orange: 'M50,270 C130,255 200,240 280,220 C360,200 430,175 510,145 C545,130 568,110 590,90',
    },
} as const;

type TimeRange = '1H' | '24H' | '7D';

// ── Mock hive pins for Hive Locator ─────────────────────────────────────────
const hivePins = [
    { id: 'HIVE-A12', status: 'Pre-Swarm', color: '#f5a623', top: '22%', left: '18%' },
    { id: 'HIVE-C08', status: 'Humidity Alert', color: '#f5a623', top: '55%', left: '62%' },
    { id: 'HIVE-B11', status: 'Stable', color: '#22c55e', top: '35%', left: '40%' },
    { id: 'HIVE-A03', status: 'Stable', color: '#22c55e', top: '68%', left: '28%' },
    { id: 'HIVE-D07', status: 'Maintenance', color: '#94a3b8', top: '20%', left: '72%' },
    { id: 'HIVE-E02', status: 'Swarm Likely', color: '#ef4444', top: '75%', left: '80%' },
];

// ── Forecast hive data ───────────────────────────────────────────────────────
const forecastHives = [
    { id: 'HIVE-A12', risk: 89, temp: '36.2°C', humidity: '78%', pressure: 'Rising' },
    { id: 'HIVE-C08', risk: 72, temp: '35.8°C', humidity: '85%', pressure: 'Stable' },
    { id: 'HIVE-B11', risk: 61, temp: '34.1°C', humidity: '71%', pressure: 'Falling' },
    { id: 'HIVE-A03', risk: 45, temp: '33.9°C', humidity: '68%', pressure: 'Stable' },
];

// ── Checklist items ──────────────────────────────────────────────────────────
const initialChecklist = [
    { id: 1, text: 'Inspect Hive-C08 for queen cells', done: false },
    { id: 2, text: 'Add super to Hive-A03 to reduce congestion', done: false },
    { id: 3, text: 'Set swarm trap near Hive-B11', done: false },
    { id: 4, text: 'Check ventilation on Hive-A12', done: false },
    { id: 5, text: 'Prepare nucleus colony box', done: false },
    { id: 6, text: 'Brief field team on swarm protocol', done: false },
];

const criticalAlerts = [
    {
        id: 1,
        color: '#f5a623',
        title: 'Hive-A12: Pre-Swarm Detected',
        time: '2m ago',
        desc: 'Acoustic signature exceeded 420Hz threshold. Temperature spike of 2.4°C.',
        actions: ['DEPLOY TEAM', 'DISMISS'],
        hive: 'A12',
    },
    {
        id: 2,
        color: '#94a3b8',
        title: 'Hive Node 04: Offline',
        time: '14m ago',
        desc: 'Low battery detected before connection timeout at Sector 4-B.',
        actions: [],
        hive: null,
    },
    {
        id: 3,
        color: '#f5a623',
        title: 'Hive-C08: Humidity Alert',
        time: '45m ago',
        desc: 'Relative humidity above 85%. Possible moisture accumulation in brood chamber.',
        actions: ['CHECK HIVE'],
        hive: 'C08',
    },
];

export default function Dashboard({ stats, recent_beehives = [] }: DashboardProps) {
    const { auth } = usePage().props;

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
                <div className="flex-1 p-6 flex flex-col gap-5">

                    {/* ── Page heading ── */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: '#0d1b2a' }}>
                                Operational Overview
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Real-time acoustic signatures and environmental telemetry.
                            </p>
                        </div>
                    </div>

                    {/* ── Stat cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Total Active Hives */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-1">
                            <div className="flex items-start justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">
                                    Total Active<br />Hives
                                </p>
                                <BarChart2 className="w-5 h-5 text-gray-300 shrink-0" />
                            </div>
                            <p className="text-4xl font-bold mt-2" style={{ color: '#0d1b2a' }}>
                                {(stats?.active_beehives ?? 1284).toLocaleString()}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-emerald-500 text-xs font-medium">
                                <Activity className="w-3 h-3" />
                                +12% vs last month
                            </div>
                        </div>

                        {/* Active Alerts */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-1">
                            <div className="flex items-start justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                    Active Alerts
                                </p>
                                <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#f5a623' }} />
                            </div>
                            <p className="text-4xl font-bold mt-2" style={{ color: '#f5a623' }}>
                                {String(stats?.inactive_beehives ?? 8).padStart(2, '0')}
                            </p>
                            <div className="mt-2 border-t border-orange-100 pt-2 flex items-center gap-1 text-xs font-medium" style={{ color: '#f5a623' }}>
                                <span className="w-1 h-1 rounded-full inline-block" style={{ backgroundColor: '#f5a623' }} />
                                Immediate attention required
                            </div>
                        </div>

                        {/* System Health */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-1">
                            <div className="flex items-start justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">
                                    System<br />Health
                                </p>
                                <CheckCircle2 className="w-5 h-5 text-gray-300 shrink-0" />
                            </div>
                            <p className="text-4xl font-bold mt-2" style={{ color: '#0d1b2a' }}>
                                98<span className="text-2xl">%</span>
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs">
                                <BarChart2 className="w-3 h-3" />
                                All nodes communicating
                            </div>
                        </div>

                        {/* Active Users */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-1">
                            <div className="flex items-start justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                    Active Users
                                </p>
                                <Users className="w-5 h-5 text-gray-300 shrink-0" />
                            </div>
                            <p className="text-4xl font-bold mt-2" style={{ color: '#0d1b2a' }}>
                                {stats?.total_beekeepers ?? 24}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                                14 currently online
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom two-column section ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">

                        {/* Frequency chart panel */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>
                                    Acoustic Swarm Frequency Analysis
                                </span>
                                <span className="text-[10px] font-semibold border border-gray-300 rounded px-2 py-0.5 text-gray-500 uppercase tracking-wide">
                                    Live Data
                                </span>
                                <span className="text-[10px] font-semibold rounded px-2 py-0.5 text-white uppercase tracking-wide ml-auto" style={{ backgroundColor: '#0d1b2a' }}>
                                    250Hz – 450Hz Range
                                </span>
                            </div>

                            {/* SVG chart */}
                            <div className="flex-1 relative p-4">
                                <svg viewBox="0 0 600 320" className="w-full h-full" preserveAspectRatio="none">
                                    {/* Y-axis labels */}
                                    {['MAX', '800Hz', '600Hz', '400Hz', '200Hz'].map((label, i) => (
                                        <text key={label} x="8" y={30 + i * 68} fontSize="9" fill="#94a3b8">{label}</text>
                                    ))}
                                    {/* Grid lines */}
                                    {[30, 98, 166, 234, 302].map((y) => (
                                        <line key={y} x1="50" y1={y} x2="590" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                    ))}
                                    {/* Dark wave (sine-like) */}
                                    <path
                                        d={chartPaths[activeRange].dark}
                                        fill="none"
                                        stroke="#0d1b2a"
                                        strokeWidth="2.5"
                                    />
                                    {/* Orange dashed rising line */}
                                    <path
                                        d={chartPaths[activeRange].orange}
                                        fill="none"
                                        stroke="#f5a623"
                                        strokeWidth="2"
                                        strokeDasharray="6 4"
                                    />
                                    {/* Alert tooltip */}
                                    <rect x="330" y="110" width="90" height="36" rx="4" fill="#0d1b2a" />
                                    <text x="375" y="126" fontSize="9" fill="white" textAnchor="middle" fontWeight="bold">ALERT: 432 Hz</text>
                                    <text x="375" y="139" fontSize="8" fill="#f5a623" textAnchor="middle">▲ threshold</text>
                                </svg>
                            </div>
                        </div>

                        {/* Critical Alerts panel */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Critical Alerts</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: '#f5a623' }}>
                                    8 NEW
                                </span>
                            </div>
                            <div className="flex flex-col divide-y divide-gray-100 overflow-y-auto">
                                {visibleAlerts.map((alert) => (
                                    <div key={alert.id} className="p-4 flex flex-col gap-2">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5"
                                                style={{ backgroundColor: alert.color === '#f5a623' ? '#fff7ed' : '#f1f5f9' }}
                                            >
                                                <AlertTriangle className="w-4 h-4" style={{ color: alert.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-1">
                                                    <p className="text-xs font-semibold leading-tight" style={{ color: '#0d1b2a' }}>
                                                        {alert.title}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">{alert.time}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-1 leading-snug">{alert.desc}</p>
                                            </div>
                                        </div>
                                        {alert.actions.length > 0 && (
                                            <div className="flex gap-2 pl-11">
                                                {alert.actions.map((action) => {
                                                    if (action === 'DEPLOY TEAM') {
                                                        return (
                                                            <button
                                                                key={action}
                                                                onClick={() => setDeployTarget(alert)}
                                                                className="text-[10px] font-bold px-3 py-1.5 rounded"
                                                                style={{ backgroundColor: '#0d1b2a', color: 'white' }}
                                                            >
                                                                {action}
                                                            </button>
                                                        );
                                                    }
                                                    if (action === 'DISMISS') {
                                                        return (
                                                            <button
                                                                key={action}
                                                                onClick={() => setDismissTarget(alert)}
                                                                className="text-[10px] font-bold px-3 py-1.5 rounded"
                                                                style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                                                            >
                                                                {action}
                                                            </button>
                                                        );
                                                    }
                                                    if (action === 'CHECK HIVE') {
                                                        return (
                                                            <Link
                                                                key={action}
                                                                href="/beehives"
                                                                className="text-[10px] font-bold px-3 py-1.5 rounded"
                                                                style={{ backgroundColor: '#0d1b2a', color: 'white' }}
                                                            >
                                                                {action}
                                                            </Link>
                                                        );
                                                    }
                                                    return (
                                                        <button
                                                            key={action}
                                                            className="text-[10px] font-bold px-3 py-1.5 rounded"
                                                            style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                                                        >
                                                            {action}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom section: legend + actions row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Chart legend + time controls */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#0d1b2a' }} />
                                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Baseline Activity</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm border-2 border-dashed inline-block" style={{ borderColor: '#f5a623' }} />
                                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Swarm Intensity Score</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                {(['1H', '24H', '7D'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveRange(t)}
                                        className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${activeRange === t ? 'border-gray-800 text-gray-800 bg-gray-100' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* View All Incidents + quick actions */}
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/alerts"
                                className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 text-center block"
                                style={{ backgroundColor: '#0d1b2a' }}
                            >
                                View All Incidents
                            </Link>
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    onClick={() => setShowExportModal(true)}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-4 gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Export Report</span>
                                </div>
                                <div
                                    onClick={() => setShowLocatorModal(true)}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-4 gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Hive Locator</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Swarm Risk + Seasonal Forecast row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Swarm Risk Factor */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
                            {/* Circular progress */}
                            <div className="relative w-16 h-16 shrink-0">
                                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                    <circle
                                        cx="18" cy="18" r="15.9" fill="none"
                                        stroke="#f5a623" strokeWidth="3"
                                        strokeDasharray="75 25"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: '#0d1b2a' }}>
                                    75%
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-bold" style={{ color: '#0d1b2a' }}>Swarm Risk Factor</p>
                                <p className="text-xs text-gray-400 mt-1 leading-snug">
                                    Regional aggregate based on current environmental pressure.
                                </p>
                            </div>
                        </div>

                        {/* Seasonal Forecast banner */}
                        <div className="lg:col-span-2 rounded-xl p-6 flex flex-col justify-between gap-4 relative overflow-hidden" style={{ backgroundColor: '#0d1b2a' }}>
                            {/* Decorative checkmark watermark */}
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base font-bold" style={{ color: '#f5a623' }}>Seasonal Forecast Active</p>
                                <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-lg">
                                    Our AI models predict a 20% increase in swarming events over the next 48 hours due to the upcoming high-pressure system.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowForecastModal(true)}
                                    className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                >
                                    View Full Forecast
                                </button>
                                <button
                                    onClick={() => setShowChecklistModal(true)}
                                    className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-slate-500 text-slate-300 hover:border-slate-300 transition-colors"
                                >
                                    Prepare Assets
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Admin Dashboard', href: dashboard() }],
};
