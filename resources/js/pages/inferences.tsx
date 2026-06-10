import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

const trendData = [
    { day: 'Mon', normal: 85, preSwarm: 32, swarm: 8,  abscondence: 3, pest: 9,  uncertain: 5 },
    { day: 'Tue', normal: 88, preSwarm: 28, swarm: 6,  abscondence: 2, pest: 13, uncertain: 5 },
    { day: 'Wed', normal: 80, preSwarm: 35, swarm: 10, abscondence: 3, pest: 9,  uncertain: 5 },
    { day: 'Thu', normal: 75, preSwarm: 42, swarm: 12, abscondence: 3, pest: 5,  uncertain: 5 },
    { day: 'Fri', normal: 82, preSwarm: 38, swarm: 9,  abscondence: 2, pest: 6,  uncertain: 5 },
    { day: 'Sat', normal: 90, preSwarm: 25, swarm: 5,  abscondence: 2, pest: 15, uncertain: 5 },
    { day: 'Sun', normal: 87, preSwarm: 30, swarm: 7,  abscondence: 3, pest: 10, uncertain: 5 },
];

interface ChartPoint {
    time: string;
    x: number;
    hz: number;
    rms: number;
    state: 'Normal' | 'Pre-swarm' | 'Swarm/Absconding' | 'Uncertain';
    confidence: string;
}

const chartPoints: ChartPoint[] = [
    { time: '00:00', x: 50,  hz: 220, rms: 0.15, state: 'Normal',           confidence: '95%' },
    { time: '04:00', x: 148, hz: 240, rms: 0.18, state: 'Normal',           confidence: '92%' },
    { time: '08:00', x: 247, hz: 310, rms: 0.25, state: 'Normal',           confidence: '89%' },
    { time: '12:00', x: 345, hz: 410, rms: 0.58, state: 'Pre-swarm',        confidence: '83%' },
    { time: '16:00', x: 443, hz: 285, rms: 0.32, state: 'Normal',           confidence: '91%' },
    { time: '20:00', x: 542, hz: 360, rms: 0.45, state: 'Uncertain',        confidence: '68%' },
    { time: '24:00', x: 640, hz: 485, rms: 0.88, state: 'Swarm/Absconding', confidence: '96%' },
];

const stateColors = {
    'Normal': '#22c55e',
    'Pre-swarm': '#f5a623',
    'Swarm/Absconding': '#ef4444',
    'Uncertain': '#9ca3af',
};

export default function Inferences() {
    const [toast, setToast] = useState(false);
    const [viewMode, setViewMode] = useState<'frequency' | 'intensity'>('frequency');
    const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

    const getPointY = (p: ChartPoint) => {
        if (viewMode === 'frequency') {
            return 230 - ((p.hz - 200) / 300) * 215;
        } else {
            return 230 - p.rms * 215;
        }
    };

    const showToast = () => {
        setToast(true);
        setTimeout(() => setToast(false), 3000);
    };

    const handleExportCSV = () => {
        const headers = ['Day', 'Normal', 'Pre-Swarm', 'Swarm/Abscondence', 'Pest/Disturbance', 'Uncertain'];
        const rows = trendData.map((d) =>
            [d.day, d.normal, d.preSwarm, d.swarm, d.pest, d.uncertain].join(',')
        );
        const csv  = [headers.join(','), ...rows].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'BSADS_Analytics_Report.csv';
        a.click();
        URL.revokeObjectURL(url);
        showToast();
    };

    const handleExportPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();

        // Title
        doc.setFontSize(14);
        doc.setTextColor(13, 27, 42);
        doc.text('BSADS Acoustic & Environmental Analytics Report', 14, 18);

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

        // Stat cards
        doc.setFontSize(11);
        doc.setTextColor(13, 27, 42);
        doc.text('Summary Statistics', 14, 36);

        const stats = [
            ['Average ML Confidence Score', '84.2%'],
            ['Acoustic Peak (Hz)',           '248 Hz — Within Normal Range'],
            ['Mean Hive Temp',               '35.2°C — Stable within range'],
            ['Monitoring Hives',             '142 — Active audio classifications'],
        ];
        doc.setFontSize(9);
        stats.forEach(([label, value], i) => {
            const y = 44 + i * 8;
            doc.setTextColor(100, 116, 139);
            doc.text(label, 14, y);
            doc.setTextColor(13, 27, 42);
            doc.text(value, 90, y);
        });

        // Health Profile
        doc.setFontSize(11);
        doc.setTextColor(13, 27, 42);
        doc.text('Health Profile', 14, 84);

        const health = [
            ['Normal State',      '82 Hives', '51%'],
            ['Pre-Swarm',         '48 Hives', '30%'],
            ['Swarm/Abscondence', '12 Hives', '8%' ],
            ['Pest/Disturbance',  '14 Hives', '9%' ],
            ['Uncertain',         '5 Hives',  '3%' ],
        ];
        doc.setFontSize(9);
        doc.setFillColor(13, 27, 42);
        doc.rect(14, 88, 182, 7, 'F');
        doc.setTextColor(255, 255, 255);
        ['State', 'Count', 'Share'].forEach((h, i) => doc.text(h, 16 + i * 55, 93));
        health.forEach(([state, count, share], i) => {
            const y = 100 + i * 8;
            if (i % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(14, y - 4, 182, 8, 'F'); }
            doc.setTextColor(13, 27, 42);
            doc.text(state, 16, y);
            doc.text(count, 71, y);
            doc.text(share, 126, y);
        });

        // 7-Day Trend Table
        const trendY = 148;
        doc.setFontSize(11);
        doc.setTextColor(13, 27, 42);
        doc.text('7-Day Classification Trend', 14, trendY);

        doc.setFontSize(9);
        doc.setFillColor(13, 27, 42);
        doc.rect(14, trendY + 4, 182, 7, 'F');
        doc.setTextColor(255, 255, 255);
        const tHeaders = ['Day', 'Normal', 'Pre-Swarm', 'Swarm', 'Pest/Dist.', 'Uncertain'];
        tHeaders.forEach((h, i) => doc.text(h, 16 + i * 30, trendY + 9));

        trendData.forEach((d, i) => {
            const y = trendY + 18 + i * 8;
            if (i % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(14, y - 4, 182, 8, 'F'); }
            doc.setTextColor(13, 27, 42);
            [d.day, d.normal, d.preSwarm, d.swarm, d.pest, d.uncertain].forEach((v, j) => doc.text(String(v), 16 + j * 30, y));
        });

        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('BSADS — Bee Swarm Acoustic Detection System — Confidential', 14, 285);

        doc.save('BSADS_Analytics_Report.pdf');
        showToast();
    };

    return (
        <>
            <Head title="Analytics & Reports" />
            <div className="min-h-screen p-6 flex flex-col gap-6" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Toast */}
                {toast && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-semibold" style={{ backgroundColor: '#0d1b2a' }}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        Report exported successfully
                    </div>
                )}

                {/* Page heading */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>
                            Acoustic &amp; Environmental Analytics
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Comprehensive historical data for swarm prediction models.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Export PDF
                        </button>
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">Average ML<br />Confidence Score</p>
                        <p className="text-4xl font-bold mt-3" style={{ color: '#0d1b2a' }}>84.2%</p>
                        <p className="mt-2 text-xs font-medium text-emerald-500">↗ +12% vs last month</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">Acoustic Peak<br />(Hz)</p>
                        <p className="text-4xl font-bold mt-3" style={{ color: '#22c55e' }}>248</p>
                        <p className="mt-2 text-xs font-medium text-emerald-500">↔ Within Normal Range</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Mean Hive Temp</p>
                        <p className="text-4xl font-bold mt-3" style={{ color: '#0d1b2a' }}>35.2°C</p>
                        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full border-2 border-gray-300 inline-block" />
                            Stable within range
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Monitoring Hives</p>
                        <p className="text-4xl font-bold mt-3" style={{ color: '#0d1b2a' }}>142</p>
                        <p className="mt-2 text-xs text-gray-400">↔ Active audio classifications</p>
                    </div>
                </div>

                {/* Chart + Health Profile */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Frequency chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Acoustic Frequency Trends (24h)</span>
                                <span
                                    className="text-[10px] font-bold rounded px-2.5 py-0.5 border uppercase tracking-wide animate-pulse"
                                    style={{
                                        backgroundColor: '#fef2f2',
                                        color: '#b91c1c',
                                        borderColor: '#fecaca',
                                    }}
                                >
                                    Current State: Swarm / Absconding
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('frequency')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        viewMode === 'frequency'
                                            ? 'bg-[#0d1b2a] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Frequency (Hz)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('intensity')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        viewMode === 'intensity'
                                            ? 'bg-[#0d1b2a] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    Intensity (RMS)
                                </button>
                            </div>
                        </div>
                        <div className="relative" style={{ backgroundColor: '#0d1b2a' }}>
                            {/* Tooltip */}
                            {hoveredPoint && (
                                <div
                                    className="absolute z-10 p-3 rounded-lg text-white shadow-xl pointer-events-none flex flex-col gap-1 text-[11px]"
                                    style={{
                                        left: `${(hoveredPoint.x / 660) * 100}%`,
                                        top: `${(getPointY(hoveredPoint) / 310) * 100}%`,
                                        transform: 'translate(-50%, -110%)',
                                        backgroundColor: 'rgba(13, 27, 42, 0.95)',
                                        border: `1px solid ${stateColors[hoveredPoint.state]}`,
                                        minWidth: '140px',
                                    }}
                                >
                                    <p className="font-bold text-slate-300">{hoveredPoint.time}</p>
                                    <p className="font-semibold text-white">
                                        {viewMode === 'frequency' ? `Frequency: ${hoveredPoint.hz} Hz` : `Intensity: ${hoveredPoint.rms} RMS`}
                                    </p>
                                    <p style={{ color: stateColors[hoveredPoint.state] }} className="font-bold">
                                        State: {hoveredPoint.state}
                                    </p>
                                    <p className="text-slate-400">Confidence: {hoveredPoint.confidence}</p>
                                </div>
                            )}

                            <svg viewBox="0 0 660 310" className="w-full" preserveAspectRatio="xMidYMid meet">

                                {/* ── Y-axis label (rotated) ── */}
                                <text x="-122" y="12" fontSize="8" fill="#94a3b8" fontWeight="600"
                                    transform="rotate(-90)" textAnchor="middle">
                                    {viewMode === 'frequency' ? 'Frequency (Hz)' : 'Intensity (RMS)'}
                                </text>

                                {/* ── Color-coded Background Zones (Frequency view only) ── */}
                                {viewMode === 'frequency' && (
                                    <g>
                                        {/* Red Zone: 450+ Hz */}
                                        <rect x="50" y="15" width="590" height="35.83" fill="#ef4444" opacity="0.08" />
                                        <text x="635" y="32" fontSize="6.5" fill="#ef4444" opacity="0.6" textAnchor="end" fontWeight="bold">Swarm / Absconding (&gt;450 Hz)</text>

                                        {/* Amber Zone: 350-450 Hz */}
                                        <rect x="50" y="50.83" width="590" height="71.67" fill="#f5a623" opacity="0.08" />
                                        <text x="635" y="80" fontSize="6.5" fill="#f5a623" opacity="0.6" textAnchor="end" fontWeight="bold">Pre-swarm (350-450 Hz)</text>

                                        {/* Green Zone: 200-350 Hz */}
                                        <rect x="50" y="122.5" width="590" height="107.5" fill="#22c55e" opacity="0.08" />
                                        <text x="635" y="150" fontSize="6.5" fill="#22c55e" opacity="0.6" textAnchor="end" fontWeight="bold">Normal (200-350 Hz)</text>
                                    </g>
                                )}

                                {/* ── Y-axis ticks + grid lines ── */}
                                {(viewMode === 'frequency'
                                    ? [
                                        { label: '500', y: 15 },
                                        { label: '420', y: 72 },
                                        { label: '400', y: 86 },
                                        { label: '300', y: 158 },
                                        { label: '200', y: 230 },
                                      ]
                                    : [
                                        { label: '1.0', y: 15 },
                                        { label: '0.8', y: 58 },
                                        { label: '0.6', y: 101 },
                                        { label: '0.4', y: 144 },
                                        { label: '0.2', y: 187 },
                                        { label: '0.0', y: 230 },
                                      ]
                                ).map(({ label, y }) => (
                                    <g key={label}>
                                        <line x1="50" y1={y} x2="640" y2={y} stroke="#1e3a5f" strokeWidth="0.8" />
                                        <text x="46" y={y + 3} fontSize="7.5" fill="#64748b" textAnchor="end">{label}</text>
                                    </g>
                                ))}

                                {/* ── Connected line path ── */}
                                <path
                                    d={chartPoints.reduce((acc, p, idx) => {
                                        const x = p.x;
                                        const y = getPointY(p);
                                        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                                    }, '')}
                                    fill="none" stroke="#f5a623" strokeWidth="2.5"
                                />

                                {/* ── Dynamic Colored Data Points ── */}
                                {chartPoints.map((p) => {
                                    const cy = getPointY(p);
                                    const color = stateColors[p.state];
                                    const isHovered = hoveredPoint?.time === p.time;
                                    return (
                                        <g key={p.time}>
                                            {/* Large hit target circle */}
                                            <circle
                                                cx={p.x}
                                                cy={cy}
                                                r="14"
                                                fill="transparent"
                                                className="cursor-pointer"
                                                onMouseEnter={() => setHoveredPoint(p)}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            />
                                            {/* Visual circle dot */}
                                            <circle
                                                cx={p.x}
                                                cy={cy}
                                                r={isHovered ? 6.5 : 4.5}
                                                fill={color}
                                                stroke="#0d1b2a"
                                                strokeWidth={isHovered ? 2 : 1.5}
                                                className="pointer-events-none transition-all duration-150"
                                            />
                                        </g>
                                    );
                                })}

                                {/* ── X-axis baseline ── */}
                                <line x1="50" y1="230" x2="640" y2="230" stroke="#334155" strokeWidth="0.8" />

                                {/* ── X-axis tick labels ── */}
                                {[
                                    { label: '00:00', x: 50  },
                                    { label: '04:00', x: 148 },
                                    { label: '08:00', x: 247 },
                                    { label: '12:00', x: 345 },
                                    { label: '16:00', x: 443 },
                                    { label: '20:00', x: 542 },
                                    { label: '24:00', x: 640 },
                                ].map(({ label, x }) => (
                                    <text key={label} x={x} y="244" fontSize="7.5" fill="#64748b" textAnchor="middle">{label}</text>
                                ))}

                                {/* ── X-axis label ── */}
                                <text x="345" y="260" fontSize="8" fill="#94a3b8" fontWeight="600" textAnchor="middle">Time</text>
                            </svg>
                        </div>

                        {/* Metric summary cards directly below the chart */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-gray-100 bg-gray-50">
                            <div className="p-4 border-r border-gray-100 flex flex-col gap-1">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Current State</p>
                                <p className="text-sm font-bold text-red-600">Swarm / Absconding</p>
                                <p className="text-[10px] text-gray-500">Critical state detected</p>
                            </div>
                            <div className="p-4 border-r border-gray-100 flex flex-col gap-1">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Peak Frequency</p>
                                <p className="text-sm font-bold text-gray-800">485 Hz</p>
                                <p className="text-[10px] text-gray-500">At 24:00 (Today)</p>
                            </div>
                            <div className="p-4 border-r border-gray-100 flex flex-col gap-1">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Alerts Today</p>
                                <p className="text-sm font-bold text-amber-600">3 Alerts</p>
                                <p className="text-[10px] text-gray-500">2 Pre-swarm, 1 Swarm</p>
                            </div>
                            <div className="p-4 flex flex-col gap-1">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Last Sync Time</p>
                                <p className="text-sm font-bold text-gray-800">07:45 AM</p>
                                <p className="text-[10px] text-gray-500">Acoustic feed active</p>
                            </div>
                        </div>
                    </div>

                    {/* Health Profile + Live Environment */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                            <div>
                                <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Health Profile</p>
                                <div className="h-0.5 w-8 mt-1 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                            </div>
                            {[
                                { label: 'Normal State',       count: '82 Hives', pct: 51, color: '#22c55e' },
                                { label: 'Pre-Swarm',          count: '48 Hives', pct: 30, color: '#f5a623' },
                                { label: 'Swarm/Abscondence',  count: '12 Hives', pct: 8,  color: '#ef4444' },
                                { label: 'Pest/Disturbance',   count: '14 Hives', pct: 9,  color: '#f97316' },
                                { label: 'Uncertain',          count: '5 Hives',  pct: 3,  color: '#9ca3af' },
                            ].map((row) => (
                                <div key={row.label} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600">{row.label}</span>
                                        <span className="font-semibold" style={{ color: row.color }}>{row.count}</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-gray-100">
                                        <div className="h-1.5 rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                                    </div>
                                </div>
                            ))}
                            <Link href="/beehives" className="w-full block text-center py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors mt-1">
                                Detailed Hive Audit
                            </Link>
                        </div>

                        {/* Latest Environment Readings */}
                        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#0d1b2a' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f5a623' }}>Latest Environment Readings</p>
                            <div className="flex items-center gap-3">
                                {/* Thermometer icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
                                </svg>
                                <div>
                                    <p className="text-[10px] text-slate-400">Avg. Internal Temperature</p>
                                    <p className="text-2xl font-bold text-white">34.8°C</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Average across 142 active hives</p>
                                    <p className="text-[10px] text-slate-500">Range: 31.2°C — 38.4°C</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Water droplet icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C12 3 5 10.5 5 15a7 7 0 0014 0c0-4.5-7-12-7-12z" />
                                </svg>
                                <div>
                                    <p className="text-[10px] text-slate-400">Relative Humidity</p>
                                    <p className="text-2xl font-bold text-white">58.2%</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Average across 142 active hives</p>
                                    <p className="text-[10px] text-slate-500">Range: 45% — 91%</p>
                                </div>
                            </div>
                            <div className="border-t border-slate-700 pt-3 mt-1">
                                <p className="text-[10px] text-slate-500">Last updated: June 6, 2026 at 10:33 AM</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7-Day Classification Trend */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>7-Day Classification Trend</h2>
                        <p className="text-[11px] text-gray-400 mt-0.5">Daily ML classification results across all active hives</p>
                    </div>
                    <div className="p-6">
                        {/*
                            SVG bar chart — viewBox 660×220
                            Plot area: x=40..620, y=10..160
                            Y range 0–100 → y = 160 - (val/100)*150
                            7 groups, each group 3 bars (w=10) + gap, group width ~82px
                        */}
                        <svg viewBox="0 0 660 220" className="w-full" preserveAspectRatio="xMidYMid meet">

                            {/* Y-axis label */}
                            <text x="-90" y="12" fontSize="8" fill="#94a3b8" fontWeight="600"
                                transform="rotate(-90)" textAnchor="middle">Number of Hives</text>

                            {/* Y-axis ticks + grid lines */}
                            {[0, 25, 50, 75, 100].map((v) => {
                                const y = 160 - (v / 100) * 150;
                                return (
                                    <g key={v}>
                                        <line x1="40" y1={y} x2="625" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                        <text x="36" y={y + 3} fontSize="8" fill="#94a3b8" textAnchor="end">{v}</text>
                                    </g>
                                );
                            })}

                            {/* Bars */}
                            {trendData.map((d, i) => {
                                // 7 groups across x=40..625, group width = 585/7 ≈ 83.6
                                // 6 bars per group, barW=8, gap=2 → span = 6*8 + 5*2 = 58
                                const groupW = 585 / 7;
                                const groupX = 40 + i * groupW;
                                const barW   = 8;
                                const gap    = 2;
                                const spanW  = 6 * barW + 5 * gap;
                                const bx1    = groupX + (groupW - spanW) / 2;
                                const bx2    = bx1 + barW + gap;
                                const bx3    = bx2 + barW + gap;
                                const bx4    = bx3 + barW + gap;
                                const bx5    = bx4 + barW + gap;
                                const bx6    = bx5 + barW + gap;
                                const yN  = 160 - (d.normal      / 100) * 150;
                                const yPS = 160 - (d.preSwarm    / 100) * 150;
                                const yS  = 160 - (d.swarm       / 100) * 150;
                                const yA  = 160 - (d.abscondence / 100) * 150;
                                const yP  = 160 - (d.pest        / 100) * 150;
                                const yU  = 160 - (d.uncertain   / 100) * 150;
                                return (
                                    <g key={d.day}>
                                        <rect x={bx1} y={yN}  width={barW} height={160 - yN}  rx="2" fill="#22c55e" opacity="0.85" />
                                        <rect x={bx2} y={yPS} width={barW} height={160 - yPS} rx="2" fill="#f5a623" opacity="0.85" />
                                        <rect x={bx3} y={yS}  width={barW} height={160 - yS}  rx="2" fill="#ef4444" opacity="0.85" />
                                        <rect x={bx4} y={yA}  width={barW} height={160 - yA}  rx="2" fill="#991b1b" opacity="0.85" />
                                        <rect x={bx5} y={yP}  width={barW} height={160 - yP}  rx="2" fill="#f97316" opacity="0.85" />
                                        <rect x={bx6} y={yU}  width={barW} height={160 - yU}  rx="2" fill="#9ca3af" opacity="0.85" />
                                        <text x={groupX + groupW / 2} y={176} fontSize="8.5" fill="#64748b" textAnchor="middle">{d.day}</text>
                                    </g>
                                );
                            })}

                            {/* X-axis baseline */}
                            <line x1="40" y1="160" x2="625" y2="160" stroke="#e2e8f0" strokeWidth="1" />

                            {/* X-axis label */}
                            <text x="332" y="192" fontSize="8" fill="#94a3b8" fontWeight="600" textAnchor="middle">Day</text>
                        </svg>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-2 justify-center flex-wrap">
                            {[
                                { color: '#22c55e', label: 'Normal'           },
                                { color: '#f5a623', label: 'Pre-Swarm'        },
                                { color: '#ef4444', label: 'Swarm'            },
                                { color: '#991b1b', label: 'Abscondence'      },
                                { color: '#f97316', label: 'Pest/Disturbance' },
                                { color: '#9ca3af', label: 'Uncertain'        },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
                                    <span className="text-[11px] font-semibold text-gray-500">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}

Inferences.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Analytics & Historical Reports', href: '/analytics' },
    ],
};
