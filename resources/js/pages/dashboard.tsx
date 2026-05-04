import { Head, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    BarChart2,
    CheckCircle2,
    Users,
} from 'lucide-react';
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

const criticalAlerts = [
    {
        id: 1,
        color: '#f5a623',
        title: 'Hive-A12: Pre-Swarm Detected',
        time: '2m ago',
        desc: 'Acoustic signature exceeded 420Hz threshold. Temperature spike of 2.4°C.',
        actions: ['DEPLOY TEAM', 'DISMISS'],
    },
    {
        id: 2,
        color: '#94a3b8',
        title: 'Hive Node 04: Offline',
        time: '14m ago',
        desc: 'Low battery detected before connection timeout at Sector 4-B.',
        actions: [],
    },
    {
        id: 3,
        color: '#f5a623',
        title: 'Hive-C08: Humidity Alert',
        time: '45m ago',
        desc: 'Relative humidity above 85%. Possible moisture accumulation in brood chamber.',
        actions: ['CHECK HIVE'],
    },
];

export default function Dashboard({ stats, recent_beehives = [] }: DashboardProps) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Dashboard" />
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
                                        d="M50,240 C120,240 150,80 220,100 C290,120 320,260 390,240 C460,220 500,120 590,80"
                                        fill="none"
                                        stroke="#0d1b2a"
                                        strokeWidth="2.5"
                                    />
                                    {/* Orange dashed rising line */}
                                    <path
                                        d="M50,290 C100,280 150,260 200,230 C250,200 300,170 350,140 C400,110 450,80 500,55 C530,40 560,30 590,20"
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
                                {criticalAlerts.map((alert) => (
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
                                                {alert.actions.map((action) => (
                                                    <button
                                                        key={action}
                                                        className="text-[10px] font-bold px-3 py-1.5 rounded"
                                                        style={
                                                            action === 'DISMISS'
                                                                ? { backgroundColor: '#f1f5f9', color: '#64748b' }
                                                                : { backgroundColor: '#0d1b2a', color: 'white' }
                                                        }
                                                    >
                                                        {action}
                                                    </button>
                                                ))}
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
                                {['1H', '24H', '7D'].map((t) => (
                                    <button
                                        key={t}
                                        className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${t === '24H' ? 'border-gray-800 text-gray-800' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* View All Incidents + quick actions */}
                        <div className="flex flex-col gap-3">
                            <button
                                className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                                style={{ backgroundColor: '#0d1b2a' }}
                            >
                                View All Incidents
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-4 gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Export Report</span>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-4 gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
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
                                    className="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                >
                                    View Full Forecast
                                </button>
                                <button
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
