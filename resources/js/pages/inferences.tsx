import { Head } from '@inertiajs/react';

const eventLog = [
    { time: 'Oct 24, 09:12:04', hive: 'HV-4922-A', type: 'Acoustic Shift', measurement: '294 Hz',   status: 'SWARM PROB.', statusColor: '#f5a623', statusBg: '#fff7ed', action: 'View Spectra' },
    { time: 'Oct 24, 08:45:12', hive: 'HV-1288-C', type: 'Temp Spike',     measurement: '38.4 °C',  status: 'CRITICAL',    statusColor: '#ffffff', statusBg: '#0d1b2a', action: 'View Spectra' },
    { time: 'Oct 24, 07:22:58', hive: 'HV-3310-B', type: 'Weight Loss',    measurement: '-1.2 kg',  status: 'NORMAL',      statusColor: '#374151', statusBg: '#f3f4f6', action: 'View Spectra' },
];

export default function Inferences() {
    return (
        <>
            <Head title="Analytics & Reports" />
            <div className="min-h-screen p-6 flex flex-col gap-6" style={{ backgroundColor: '#f8f9fa' }}>

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
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Export PDF
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">Total Colony<br />Activity</p>
                        <p className="text-4xl font-bold mt-3" style={{ color: '#0d1b2a' }}>84.2%</p>
                        <p className="mt-2 text-xs font-medium text-emerald-500">↗ +12% vs last month</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 leading-tight">Acoustic Peak<br />(Hz)</p>
                        <p className="text-4xl font-bold mt-3" style={{ color: '#f5a623' }}>248</p>
                        <p className="mt-2 text-xs font-medium" style={{ color: '#f5a623' }}>▲ Elevated – Swarm risk</p>
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
                        <p className="mt-2 text-xs text-gray-400">↔ 98% Data Integrity</p>
                    </div>
                </div>

                {/* Chart + Health Profile */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Frequency chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                            <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Acoustic Frequency Trends (24h)</span>
                            <span className="text-[10px] font-bold border border-gray-300 rounded px-2 py-0.5 text-gray-500 uppercase tracking-wide">Live</span>
                            <span className="text-[10px] font-bold border border-gray-300 rounded px-2 py-0.5 text-gray-500 uppercase tracking-wide">Periodic</span>
                        </div>
                        <div className="relative" style={{ backgroundColor: '#0d1b2a' }}>
                            <svg viewBox="0 0 660 280" className="w-full" preserveAspectRatio="none">
                                {/* Grid lines */}
                                {[40, 100, 160, 220].map((y) => (
                                    <line key={y} x1="0" y1={y} x2="660" y2={y} stroke="#1e3a5f" strokeWidth="1" />
                                ))}
                                {/* Orange wave */}
                                <path
                                    d="M0,220 C60,215 100,200 150,180 C200,160 220,130 260,110 C300,90 320,95 360,120 C400,145 420,170 460,160 C500,150 540,120 600,100 C630,90 650,85 660,80"
                                    fill="none" stroke="#f5a623" strokeWidth="2.5"
                                />
                                {/* Peak tooltip */}
                                <rect x="370" y="60" width="130" height="38" rx="4" fill="#f5a623" />
                                <text x="435" y="76" fontSize="10" fill="#0d1b2a" textAnchor="middle" fontWeight="bold">Peak: 285Hz (Pre-</text>
                                <text x="435" y="90" fontSize="10" fill="#0d1b2a" textAnchor="middle" fontWeight="bold">Swarm)</text>
                                {/* Dot on curve */}
                                <circle cx="360" cy="120" r="5" fill="#f5a623" />
                            </svg>
                            {/* X-axis labels */}
                            <div className="flex justify-between px-4 pb-3 text-[10px] text-slate-500">
                                {['06:00','10:00','14:00','18:00','22:00','02:00'].map((t) => <span key={t}>{t}</span>)}
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
                                { label: 'Normal State',      count: '82 Hives', pct: 58, color: '#0d1b2a' },
                                { label: 'Elevated State',    count: '48 Hives', pct: 34, color: '#f5a623' },
                                { label: 'Critical / Swarming', count: '12 Hives', pct: 8,  color: '#ef4444' },
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
                            <button className="w-full py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors mt-1">
                                Detailed Hive Audit
                            </button>
                        </div>

                        {/* Live Environment */}
                        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#0d1b2a' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f5a623' }}>Live Environment</p>
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <div>
                                    <p className="text-[10px] text-slate-400">Avg. Internal Temperature</p>
                                    <p className="text-2xl font-bold text-white">34.8°C</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                </svg>
                                <div>
                                    <p className="text-[10px] text-slate-400">Relative Humidity</p>
                                    <p className="text-2xl font-bold text-white">58.2%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Significant Event Log */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-wrap gap-3">
                        <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Significant Event Log</h2>
                        <div className="flex items-center gap-3">
                            <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 outline-none bg-white">
                                <option>All Types</option>
                                <option>Acoustic Shift</option>
                                <option>Temp Spike</option>
                                <option>Weight Loss</option>
                            </select>
                            <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 outline-none bg-white">
                                <option>Last 30 Days</option>
                                <option>Last 7 Days</option>
                                <option>Last 24 Hours</option>
                            </select>
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                {['Timestamp','Hive ID','Event Type','Measurement','Status','Action'].map((h) => (
                                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {eventLog.map((row, i) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{row.time}</td>
                                    <td className="px-6 py-4 text-xs font-medium" style={{ color: '#0d1b2a' }}>{row.hive}</td>
                                    <td className="px-6 py-4 text-xs text-gray-600">{row.type}</td>
                                    <td className="px-6 py-4 text-xs text-gray-600">{row.measurement}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide"
                                            style={{ backgroundColor: row.statusBg, color: row.statusColor }}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-xs font-semibold hover:underline" style={{ color: '#f5a623' }}>
                                            {row.action}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
