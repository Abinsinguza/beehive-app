// import { Head } from '@inertiajs/react';

// const clusterNodes = [
//     { id: 'Hive 104-A', status: 'Stable Condition',  temp: '34.1°C', hum: '62% Hum', color: '#22c55e', alert: false },
//     { id: 'Hive 109-B', status: 'ALERT: SWARM RISK', temp: '36.8°C', hum: '45% Hum', color: '#f5a623', alert: true },
//     { id: 'Hive 112-C', status: 'Stable Condition',  temp: '33.9°C', hum: '68% Hum', color: '#22c55e', alert: false },
//     { id: 'Hive 115-A', status: 'Stable Condition',  temp: '34.4°C', hum: '60% Hum', color: '#22c55e', alert: false },
// ];

// export default function Monitoring() {
//     return (
//         <>
//             <Head title="Live Monitoring" />
//             <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>

//                 {/* Sub-header */}
//                 <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200">
//                     <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Live Monitoring</span>
//                     <div className="flex items-center gap-1.5">
//                         <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
//                         <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">System Live</span>
//                     </div>
//                 </div>

//                 <div className="p-6 flex flex-col gap-5">

//                     {/* Stat cards */}
//                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//                         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
//                             <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Active Hive Clusters</p>
//                             <p className="text-3xl font-bold mt-2" style={{ color: '#0d1b2a' }}>124</p>
//                             <p className="mt-2 text-xs font-medium text-emerald-500">↑ 4% vs last week</p>
//                         </div>
//                         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
//                             <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Average Colony Temp</p>
//                             <p className="text-3xl font-bold mt-2" style={{ color: '#0d1b2a' }}>34.8°C</p>
//                             <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
//                                 <span className="w-3 h-3 rounded-full border-2 border-gray-300 inline-block" />
//                                 Within Optimal Range
//                             </p>
//                         </div>
//                         <div className="bg-white rounded-xl border-2 shadow-sm p-5" style={{ borderColor: '#f5a623' }}>
//                             <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>Pre-Swarm Alerts</p>
//                             <p className="text-3xl font-bold mt-2" style={{ color: '#f5a623' }}>07</p>
//                             <p className="mt-2 text-xs font-medium flex items-center gap-1" style={{ color: '#f5a623' }}>
//                                 <span>▲</span> Immediate Inspection Req.
//                             </p>
//                         </div>
//                         <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: '#0d1b2a' }}>
//                             <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">System Health</p>
//                             <p className="text-3xl font-bold mt-2 text-white">99.2%</p>
//                             <p className="mt-2 text-xs text-slate-400">↔ All nodes reporting</p>
//                         </div>
//                     </div>

//                     {/* Main two-column */}
//                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

//                         {/* Acoustic Analysis */}
//                         <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
//                             <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
//                                 <span className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Real-time Acoustic Frequency Analysis</span>
//                                 <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-gray-300 text-gray-500 uppercase tracking-wide ml-auto">Node: Alpha-09</span>
//                                 <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wide" style={{ backgroundColor: '#f5a623' }}>Streaming Live</span>
//                             </div>

//                             <div className="relative flex-1" style={{ backgroundColor: '#0d1b2a', minHeight: '220px' }}>
//                                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-lg px-6 py-4 text-center" style={{ backgroundColor: 'rgba(13,27,42,0.92)', border: '1px solid #f5a623' }}>
//                                     <div className="flex items-center justify-center gap-2 mb-1">
//                                         <span style={{ color: '#f5a623' }}>⚠</span>
//                                         <span className="text-sm font-bold uppercase tracking-wide" style={{ color: '#f5a623' }}>High-Pitch Piping Detected</span>
//                                     </div>
//                                     <p className="text-xs text-slate-300">Frequency shift to 450Hz matches pre-swarm signature.</p>
//                                 </div>
//                                 <svg viewBox="0 0 460 180" className="w-full h-full" preserveAspectRatio="none">
//                                     {Array.from({ length: 30 }).map((_, i) => {
//                                         const heights = [25,30,28,35,32,38,40,36,42,45,50,55,70,75,80,78,72,68,60,55,48,42,38,35,32,30,28,26,24,22];
//                                         const h = heights[i] ?? 30;
//                                         const isHigh = i > 11 && i < 20;
//                                         return (
//                                             <rect key={i} x={i * 16 + 5} y={180 - h} width={10} height={h} rx="2"
//                                                 fill={isHigh ? '#f5a623' : '#1e3a5f'} opacity={isHigh ? 0.9 : 0.6} />
//                                         );
//                                     })}
//                                     <line x1="0" y1="60" x2="460" y2="60" stroke="#f5a623" strokeWidth="1" strokeDasharray="6 4" opacity="0.4" />
//                                 </svg>
//                             </div>

//                             <div className="flex items-center gap-8 px-5 py-4 border-t border-gray-100">
//                                 <div>
//                                     <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Base Frequency</p>
//                                     <p className="text-sm font-bold mt-0.5" style={{ color: '#0d1b2a' }}>225 Hz</p>
//                                 </div>
//                                 <div>
//                                     <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Peak Frequency</p>
//                                     <p className="text-sm font-bold mt-0.5" style={{ color: '#f5a623' }}>452 Hz</p>
//                                 </div>
//                                 <div>
//                                     <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Vibration Index</p>
//                                     <p className="text-sm font-bold mt-0.5" style={{ color: '#0d1b2a' }}>0.88 RMS</p>
//                                 </div>
//                                 <button className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
//                                     style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
//                                     🔊 Listen Live
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Right column */}
//                         <div className="flex flex-col gap-4">
//                             {/* Cluster nodes */}
//                             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
//                                 <div className="flex items-center justify-between mb-3">
//                                     <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#0d1b2a' }}>Cluster: North Sector</p>
//                                     <button className="text-gray-400 hover:text-gray-600">⋮</button>
//                                 </div>
//                                 <div className="flex flex-col divide-y divide-gray-50">
//                                     {clusterNodes.map((node) => (
//                                         <div key={node.id} className="flex items-center gap-3 py-2.5">
//                                             <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
//                                             <div className="flex-1 min-w-0">
//                                                 <p className="text-xs font-semibold" style={{ color: '#0d1b2a' }}>{node.id}</p>
//                                                 <p className="text-[10px]" style={{ color: node.alert ? '#f5a623' : '#94a3b8' }}>{node.status}</p>
//                                             </div>
//                                             <div className="text-right shrink-0">
//                                                 <p className="text-xs font-bold" style={{ color: node.alert ? '#f5a623' : '#0d1b2a' }}>{node.temp}</p>
//                                                 <p className="text-[10px] text-gray-400">{node.hum}</p>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                                 <button className="w-full mt-2 py-2 rounded-lg border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors">
//                                     View All Cluster Nodes
//                                 </button>
//                             </div>

//                             {/* Hive Population Density */}
//                             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
//                                 <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Hive Population Density</p>
//                                 <div className="flex items-center justify-center my-2 gap-4">
//                                     <div className="relative w-24 h-24">
//                                         <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
//                                             <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
//                                             <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f5a623" strokeWidth="3"
//                                                 strokeDasharray="82 18" strokeLinecap="round" />
//                                         </svg>
//                                         <div className="absolute inset-0 flex flex-col items-center justify-center">
//                                             <span className="text-xl font-bold" style={{ color: '#0d1b2a' }}>82%</span>
//                                             <span className="text-[9px] text-gray-400 uppercase tracking-widest">Capacity</span>
//                                         </div>
//                                     </div>
//                                     <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f5a623' }}>
//                                         <span className="text-white font-bold text-lg">✳</span>
//                                     </div>
//                                 </div>
//                                 <div className="mt-2 flex flex-col gap-2">
//                                     <div className="flex items-center justify-between text-xs">
//                                         <span className="text-gray-500">Foraging Activity</span>
//                                     </div>
//                                     <div className="flex items-center justify-between text-xs">
//                                         <span className="text-gray-500">Internal CO2 Level</span>
//                                         <span className="font-semibold text-gray-600">Normal</span>
//                                     </div>
//                                     <div className="w-full h-1.5 rounded-full bg-gray-100">
//                                         <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: '#0d1b2a' }} />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Bottom row */}
//                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//                         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
//                             <div className="flex items-center gap-2 mb-4">
//                                 <span className="text-gray-400">🌡</span>
//                                 <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Temperature Variance (24h)</p>
//                             </div>
//                             <svg viewBox="0 0 200 80" className="w-full" preserveAspectRatio="none">
//                                 {[20, 40, 60].map((y) => <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#f1f5f9" strokeWidth="1" />)}
//                                 {[10,30,50,70,90,110,130,150,170,190].map((x, i) => {
//                                     const h = [30,35,40,55,65,70,50,45,38,32][i];
//                                     return <rect key={x} x={x-7} y={80-h} width={14} height={h} rx="2"
//                                         fill={(i===4||i===5) ? '#f5a623' : '#e2e8f0'} />;
//                                 })}
//                             </svg>
//                             <div className="flex justify-between text-[10px] text-gray-400 mt-2">
//                                 <span>06:00 AM</span><span>12:00 PM</span><span>06:00 PM</span>
//                             </div>
//                         </div>

//                         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
//                             <div className="flex items-center gap-2 mb-4">
//                                 <span className="text-gray-400">💧</span>
//                                 <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Humidity Trends</p>
//                             </div>
//                             <svg viewBox="0 0 200 80" className="w-full" preserveAspectRatio="none">
//                                 {[20,40,60].map((y) => <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#f1f5f9" strokeWidth="1" />)}
//                                 <path d="M0,70 C30,65 50,55 80,45 C110,35 140,30 170,25 C185,22 195,20 200,18"
//                                     fill="none" stroke="#0d1b2a" strokeWidth="2" />
//                                 <circle cx="170" cy="25" r="4" fill="#f5a623" />
//                             </svg>
//                             <div className="flex justify-between text-[10px] text-gray-400 mt-2">
//                                 <span>Avg: 64%</span><span>Current: 58%</span>
//                             </div>
//                         </div>

//                         <div className="rounded-xl p-5 flex flex-col gap-3" style={{ backgroundColor: '#0d1b2a' }}>
//                             <div className="flex items-center gap-2">
//                                 <span style={{ color: '#f5a623' }}>✳</span>
//                                 <p className="text-sm font-semibold text-white">Network Gateway Status</p>
//                             </div>
//                             <div className="flex flex-col gap-2.5">
//                                 {[
//                                     { label: 'Main Gateway (London_N)', value: 'CONNECTED', color: '#22c55e' },
//                                     { label: 'Satellite Link',           value: 'STANDBY',   color: '#94a3b8' },
//                                     { label: 'Packet Loss',              value: '0.002%',    color: '#22c55e' },
//                                 ].map((row) => (
//                                     <div key={row.label} className="flex items-center justify-between">
//                                         <span className="text-xs text-slate-400">{row.label}</span>
//                                         <span className="text-xs font-bold" style={{ color: row.color }}>{row.value}</span>
//                                     </div>
//                                 ))}
//                             </div>
//                             <div className="border-t border-slate-700 pt-3 mt-1">
//                                 <p className="text-[10px] text-slate-500 uppercase tracking-widest">Last Sync</p>
//                                 <p className="text-xs font-mono text-slate-300 mt-0.5">2023-10-27 14:32:05 UTC</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }

// Monitoring.layout = {
//     breadcrumbs: [
//         { title: 'Admin Dashboard', href: '/dashboard' },
//         { title: 'Live Monitoring', href: '/monitoring' },
//     ],
// };
