import { Head, Link } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

const clusterNodes = [
    { id: 'Hive 104-A', status: 'Normal',  temp: '34.1°C', hum: '62% Hum', color: '#22c55e', alert: false },
    { id: 'Hive 109-B', status: 'PRE-SWARM DETECTED', temp: '36.8°C', hum: '45% Hum', color: '#f5a623', alert: true },
    { id: 'Hive 112-C', status: 'Normal',  temp: '33.9°C', hum: '68% Hum', color: '#22c55e', alert: false },
    { id: 'Hive 115-A', status: 'Normal',  temp: '34.4°C', hum: '60% Hum', color: '#22c55e', alert: false },
];

// ── Per-hive chart data ──────────────────────────────────────────────────────
type HiveId = 'BH0001' | 'BH0002' | 'BH0003' | 'BH0004';

type HiveChartData = {
    label: string;
    status: 'Normal' | 'Pre-Swarm' | 'Swarm';
    alert: boolean;
    alertTitle: string;
    alertDesc: string;
    bars: { hz: number; amp: number; color: string }[];
};

const hiveChartData: Record<HiveId, HiveChartData> = {
    BH0001: {
        label: 'BH0001',
        status: 'Normal',
        alert: false,
        alertTitle: '',
        alertDesc: '',
        bars: [
            { hz: 200, amp: 15, color: '#3b82f6' },
            { hz: 250, amp: 28, color: '#3b82f6' },
            { hz: 300, amp: 42, color: '#3b82f6' },
            { hz: 320, amp: 60, color: '#3b82f6' },
            { hz: 350, amp: 50, color: '#3b82f6' },
            { hz: 380, amp: 38, color: '#3b82f6' },
            { hz: 400, amp: 25, color: '#3b82f6' },
            { hz: 410, amp: 18, color: '#3b82f6' },
        ],
    },
    BH0002: {
        label: 'BH0002',
        status: 'Pre-Swarm',
        alert: true,
        alertTitle: 'High-Pitch Piping Detected',
        alertDesc: 'Acoustic frequency spike detected at 452Hz. Exceeds swarm threshold of 420Hz. Classification: Pre-Swarm',
        bars: [
            { hz: 200, amp: 20, color: '#3b82f6' },
            { hz: 250, amp: 35, color: '#3b82f6' },
            { hz: 300, amp: 45, color: '#3b82f6' },
            { hz: 350, amp: 60, color: '#3b82f6' },
            { hz: 400, amp: 55, color: '#3b82f6' },
            { hz: 410, amp: 48, color: '#3b82f6' },
            { hz: 420, amp: 65, color: '#f5a623' },
            { hz: 452, amp: 85, color: '#f5a623' },
            { hz: 470, amp: 82, color: '#f5a623' },
            { hz: 490, amp: 75, color: '#f5a623' },
            { hz: 510, amp: 68, color: '#f5a623' },
            { hz: 530, amp: 55, color: '#f5a623' },
            { hz: 550, amp: 40, color: '#f5a623' },
            { hz: 570, amp: 30, color: '#f5a623' },
        ],
    },
    BH0003: {
        label: 'BH0003',
        status: 'Swarm',
        alert: true,
        alertTitle: 'Active Swarming Detected',
        alertDesc: 'Peak frequency at 480Hz — well above swarm threshold of 420Hz. Classification: Swarm. Immediate action required.',
        bars: [
            { hz: 200, amp: 22, color: '#f5a623' },
            { hz: 250, amp: 40, color: '#f5a623' },
            { hz: 300, amp: 55, color: '#f5a623' },
            { hz: 380, amp: 70, color: '#f5a623' },
            { hz: 420, amp: 78, color: '#f5a623' },
            { hz: 450, amp: 88, color: '#f5a623' },
            { hz: 480, amp: 95, color: '#f5a623' },
            { hz: 510, amp: 88, color: '#f5a623' },
            { hz: 540, amp: 72, color: '#f5a623' },
            { hz: 570, amp: 50, color: '#f5a623' },
        ],
    },
    BH0004: {
        label: 'BH0004',
        status: 'Normal',
        alert: false,
        alertTitle: '',
        alertDesc: '',
        bars: [
            { hz: 200, amp: 12, color: '#3b82f6' },
            { hz: 250, amp: 22, color: '#3b82f6' },
            { hz: 290, amp: 55, color: '#3b82f6' },
            { hz: 320, amp: 45, color: '#3b82f6' },
            { hz: 350, amp: 35, color: '#3b82f6' },
            { hz: 380, amp: 25, color: '#3b82f6' },
            { hz: 410, amp: 15, color: '#3b82f6' },
        ],
    },
};

export default function Monitoring() {
    const [selectedHive, setSelectedHive] = useState<HiveId>('BH0002');
    const [liveBars, setLiveBars] = useState(hiveChartData['BH0002'].bars);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [lastUpdatedLabel, setLastUpdatedLabel] = useState('just now');
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // Compute "X mins ago" label
    useEffect(() => {
        const tick = setInterval(() => {
            const diffSec = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
            if (diffSec < 10) setLastUpdatedLabel('just now');
            else if (diffSec < 60) setLastUpdatedLabel(`${diffSec} secs ago`);
            else setLastUpdatedLabel(`${Math.floor(diffSec / 60)} min${Math.floor(diffSec / 60) > 1 ? 's' : ''} ago`);
        }, 5000);
        return () => clearInterval(tick);
    }, [lastUpdated]);

    // Vary bar amps by ±5, clamped to 5–100
    const jitterBars = useCallback((hiveId: HiveId) => {
        return hiveChartData[hiveId].bars.map((b) => ({
            ...b,
            amp: Math.min(100, Math.max(5, b.amp + Math.round((Math.random() - 0.5) * 10))),
        }));
    }, []);

    // Refresh logic (shared by button and auto-refresh)
    const doRefresh = useCallback((hiveId: HiveId, auto = false) => {
        if (refreshing) return;
        setRefreshing(true);
        setTimeout(() => {
            setLiveBars(jitterBars(hiveId));
            setRefreshing(false);
            setLastUpdated(new Date());
            setLastUpdatedLabel('just now');
            if (!auto) {
                const msg = `Data refreshed — ${hiveId} latest recording loaded`;
                setToast(msg);
                if (toastTimer.current) clearTimeout(toastTimer.current);
                toastTimer.current = setTimeout(() => setToast(null), 3000);
            }
        }, 1500);
    }, [refreshing, jitterBars]);

    // Reset live bars when hive changes
    useEffect(() => {
        setLiveBars(hiveChartData[selectedHive].bars);
        setLastUpdated(new Date());
        setLastUpdatedLabel('just now');
    }, [selectedHive]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current);
        autoRefreshTimer.current = setInterval(() => {
            doRefresh(selectedHive, true);
        }, 60000);
        return () => { if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current); };
    }, [selectedHive, doRefresh]);

    const hive = hiveChartData[selectedHive];
    return (
        <>
            <Head title="Live Monitoring" />
            <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Toast notification */}
                {toast && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-semibold" style={{ backgroundColor: '#0d1b2a' }}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        {toast}
                    </div>
                )}

                {/* Sub-header */}
                <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Live Monitoring</span>
                </div>

                <div className="p-6 flex flex-col gap-5">

                    {/* Stat cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Active Hives</p>
                            <p className="text-3xl font-bold mt-2" style={{ color: '#0d1b2a' }}>124</p>
                            <p className="mt-2 text-xs font-medium text-emerald-500">↑ 4% vs last week</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Average Colony Temp</p>
                            <p className="text-3xl font-bold mt-2" style={{ color: '#0d1b2a' }}>34.8°C</p>
                            <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full border-2 border-gray-300 inline-block" />
                                Within Optimal Range
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border-2 shadow-sm p-5" style={{ borderColor: '#f5a623' }}>
                            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>Pre-Swarm Alerts</p>
                            <p className="text-3xl font-bold mt-2" style={{ color: '#f5a623' }}>07</p>
                            <p className="mt-2 text-xs font-medium flex items-center gap-1" style={{ color: '#f5a623' }}>
                                <span>▲</span> Immediate Inspection Req.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-start justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Mean Humidity</p>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C12 3 6 10 6 14a6 6 0 0012 0c0-4-6-11-6-11z" />
                                </svg>
                            </div>
                            <p className="text-3xl font-bold mt-2" style={{ color: "#0d1b2a" }}>64%</p>
                            <p className="mt-2 text-xs text-gray-400">Average across all active hives</p>
                        </div>
                    </div>

                    {/* Main two-column */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                        {/* Acoustic Analysis */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col lg:row-span-2">
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
                                <div className="flex flex-col gap-0.5 flex-1">
                                    <span className="text-sm font-semibold" style={{ color: "#0d1b2a" }}>
                                        Real-time Acoustic Frequency Analysis — {selectedHive}
                                    </span>
                                    <p className="text-[10px] text-gray-400">FFT spectrum analysis of live hive acoustic signal</p>
                                </div>
                                {/* Hive selector dropdown */}
                                <select
                                    value={selectedHive}
                                    onChange={(e) => setSelectedHive(e.target.value as HiveId)}
                                    className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-1.5 outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors"
                                    style={{ color: '#0d1b2a' }}
                                >
                                    <option value="BH0001">BH0001 — Normal</option>
                                    <option value="BH0002">BH0002 — Pre-Swarm</option>
                                    <option value="BH0003">BH0003 — Swarm</option>
                                    <option value="BH0004">BH0004 — Normal</option>
                                </select>
                                {/* Latest Data button */}
                                <div className="flex flex-col items-end gap-0.5">
                                    <button
                                        onClick={() => doRefresh(selectedHive)}
                                        disabled={refreshing}
                                        className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded text-white uppercase tracking-wide transition-opacity disabled:opacity-70"
                                        style={{ backgroundColor: '#f5a623' }}
                                    >
                                        {refreshing ? (
                                            <>
                                                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                                                </svg>
                                                Loading…
                                            </>
                                        ) : 'Latest Data'}
                                    </button>
                                    <span className="text-[9px] text-gray-400">Last updated: {lastUpdatedLabel}</span>
                                </div>
                            </div>

                            <div className="relative flex-1" style={{ backgroundColor: "#0d1b2a", minHeight: "260px" }}>
                                {hive.alert && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-lg px-6 py-4 text-center" style={{ backgroundColor: "rgba(13,27,42,0.92)", border: "1px solid #f5a623" }}>
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <span style={{ color: "#f5a623" }}>!</span>
                                            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: "#f5a623" }}>{hive.alertTitle}</span>
                                        </div>
                                        <p className="text-xs text-slate-300">{hive.alertDesc}</p>
                                    </div>
                                )}
                                <svg viewBox="0 0 560 230" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                                    <text x="10" y="120" fontSize="8" fill="#64748b" transform="rotate(-90,10,120)" textAnchor="middle">Amplitude (dB)</text>
                                    {[0,25,50,75,100].map((v) => { const y = 20 + (100 - v) * 1.6; return (<g key={v}><line x1="48" y1={y} x2="545" y2={y} stroke="#1e3a5f" strokeWidth="0.5" /><text x="44" y={y + 3} fontSize="7" fill="#64748b" textAnchor="end">{v}</text></g>); })}
                                    {liveBars.map(({ hz, amp, color }) => { const x = 48 + ((hz - 200) / 400) * 497; const h = amp * 1.6; return <rect key={hz} x={x - 7} y={20 + (100 - amp) * 1.6} width={13} height={h} rx="2" fill={color} opacity="0.85" />; })}
                                    {(()=>{ const tx=48+((420-200)/400)*497; return (<g><line x1={tx} y1="15" x2={tx} y2="180" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3"/><text x={tx+3} y="24" fontSize="7" fill="#ef4444" fontWeight="bold">420Hz Threshold</text></g>); })()}
                                    <line x1="48" y1="180" x2="545" y2="180" stroke="#334155" strokeWidth="1"/>
                                    {[200,250,300,350,400,420,450,500,550,600].map((hz)=>{ const x=48+((hz-200)/400)*497; return(<g key={hz}><line x1={x} y1="180" x2={x} y2="184" stroke="#64748b" strokeWidth="1"/><text x={x} y="193" fontSize="6.5" fill="#64748b" textAnchor="middle">{hz}</text></g>); })}
                                    <text x="296" y="207" fontSize="8" fill="#94a3b8" textAnchor="middle">Frequency (Hz)</text>
                                    <rect x="370" y="10" width="8" height="8" rx="1" fill="#3b82f6" opacity="0.75"/>
                                    <text x="382" y="17" fontSize="7" fill="#94a3b8">Normal range (below 420Hz)</text>
                                    <rect x="370" y="22" width="8" height="8" rx="1" fill="#f5a623" opacity="0.85"/>
                                    <text x="382" y="29" fontSize="7" fill="#94a3b8">Above swarm threshold (420Hz+)</text>
                                </svg>
                            </div>
                        </div>

                        {/* Hive list panel */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100">
                                <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Active Hives</p>
                            </div>
                            <div className="flex flex-col divide-y divide-gray-100 flex-1">
                                {clusterNodes.map((node) => (
                                    <div key={node.id} className="flex items-center justify-between px-5 py-3 gap-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: node.color }}
                                            />
                                            <div>
                                                <p className="text-xs font-semibold" style={{ color: '#0d1b2a' }}>{node.id}</p>
                                                <p className="text-[10px] mt-0.5" style={{ color: node.alert ? '#f5a623' : '#94a3b8' }}>
                                                    {node.status}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-bold" style={{ color: node.alert ? '#f5a623' : '#0d1b2a' }}>{node.temp}</p>
                                            <p className="text-[10px] text-gray-400">{node.hum}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-5 py-3 border-t border-gray-100">
                                <Link
                                    href="/beehives"
                                    className="w-full block text-center py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    View All Hives
                                </Link>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </>
    );
}

Monitoring.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Live Monitoring', href: '/monitoring' },
    ],
};
