import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import React from 'react';

type Owner = { id: string; name: string };
type Beehive = {
    id: string;
    hive_location: string;
    hive_type: string;
    installation_date: string;
    current_state: string;
    owner: { id: string; name: string };
    latitude?: number | null;
    longitude?: number | null;
};

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    active:      { label: 'NORMAL',    bg: '#f0fdf4', color: '#16a34a' },
    inactive:    { label: 'MAINTENANCE',  bg: '#0d1b2a', color: '#ffffff' },
    migrated:    { label: 'PRE-SWARM', bg: '#fff7ed', color: '#f59e0b' },
    lost:        { label: 'SWARM',     bg: '#fef2f2', color: '#ef4444' },
};

// Fake battery levels for demo when no real data
const fakeBattery: Record<number, { pct: number; color: string }> = {
    0: { pct: 12,  color: '#ef4444' },
    1: { pct: 88,  color: '#22c55e' },
    2: { pct: 95,  color: '#22c55e' },
    3: { pct: 64,  color: '#22c55e' },
    4: { pct: 22,  color: '#f59e0b' },
};

const deploymentLog = [
    { color: '#f5a623', title: 'Hive Inspection Completed',        sub: 'Hive HV-8812-B • 2h ago' },
    { color: '#94a3b8', title: 'Maintenance Complete',             sub: 'Hive HV-1002-K • 5h ago' },
    { color: '#f5a623', title: 'Swarm Alert Threshold Adjusted',   sub: 'System Global • 8h ago' },
];


const stateColorMap: Record<string, string> = {
    active:      '#22c55e',
    migrated:    '#f59e0b',
    lost:        '#ef4444',
    abscondence: '#991b1b',
    pest:        '#f97316',
    uncertain:   '#9ca3af',
};

const stateLabelMap: Record<string, string> = {
    active:      'NORMAL',
    migrated:    'PRE-SWARM',
    lost:        'SWARM',
    abscondence: 'ABSCONDENCE',
    pest:        'PEST/DISTURBANCE',
    uncertain:   'UNCERTAIN',
};

function HiveMap({ hives }: { hives: Beehive[] }) {
    const { useEffect, useRef } = React;
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        import('leaflet').then((L) => {
            // Fix default marker icon paths broken by bundlers
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false })
                .setView([0.3476, 32.5825], 7);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: ' OpenStreetMap contributors',
            }).addTo(map);

            hives.forEach((hive, idx) => {
                const lat = hive.latitude;
                const lng = hive.longitude;
                // Skip hives with missing or invalid coordinates
                if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return;

                const statusColor = stateColorMap[hive.current_state] ?? '#94a3b8';
                const statusLabel = stateLabelMap[hive.current_state] ?? hive.current_state.toUpperCase();

                const icon = L.divIcon({
                    className: '',
                    html: `<div style="width:14px;height:14px;border-radius:50%;background:${statusColor};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                });

                const bat = fakeBattery[idx] ?? { pct: 75, color: '#f5a623' };
                const batColor = bat.pct <= 20 ? '#ef4444' : bat.pct <= 50 ? '#f59e0b' : '#22c55e';
                const popup = `
                    <div style="font-family:sans-serif;min-width:160px;padding:4px 0">
                        <p style="font-weight:700;font-size:13px;color:#0d1b2a;margin:0 0 6px">${hive.id}</p>
                        <p style="font-size:11px;color:#64748b;margin:0 0 4px"> ${hive.hive_location}</p>
                        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px;background:${statusColor}20;color:${statusColor};text-transform:uppercase">${statusLabel}</span>
                        <p style="font-size:11px;color:#64748b;margin:6px 0 2px">🔋 Battery: <strong style="color:${batColor}">${bat.pct}%</strong></p>
                        <p style="font-size:11px;color:#64748b;margin:0 0 6px">📅 Last Activity: ${hive.installation_date}</p>
                        <a href="/beehives" style="font-size:11px;color:#f5a623;font-weight:600;text-decoration:none">View Details →</a>
                    </div>`;

                L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);
            });

            mapInstanceRef.current = map;
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return <div ref={mapRef} style={{ height: '224px', width: '100%' }} />;
}

export default function Beehives({ beehives = [], owners = [], search: initialSearch = '' }: { beehives?: Beehive[]; owners?: Owner[]; search?: string }) {
    const [showModal, setShowModal]     = useState(false);
    const [viewTarget, setViewTarget]   = useState<Beehive | null>(null);
    const [editTarget, setEditTarget]   = useState<Beehive | null>(null);
    const [otherHiveType, setOtherHiveType] = useState('');
    const [riskFilter, setRiskFilter]   = useState(false);
    const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle');

    const { data, setData, post, reset, processing } = useForm({
        owner_id: '',
        hive_location: '',
        hive_type: '',
        current_state: '',
        latitude: '',
        longitude: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/beehives', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    // Static demo rows used only when no real data exists
    const demoRows: Beehive[] = [
        { id: 'HV-9421-A', hive_location: 'North Orchard – Plot 4', hive_type: 'Langstroth 10-Frame', installation_date: '2 mins ago',  current_state: 'lost',     owner: { id: '1', name: 'Admin' }, latitude: -0.3136, longitude: 31.7333 },
        { id: 'HV-8812-B', hive_location: 'East Valley Ridge',       hive_type: 'Flow Hive Classic',   installation_date: '14 mins ago', current_state: 'active',   owner: { id: '2', name: 'Admin' }, latitude: -0.3736, longitude: 31.7833 },
        { id: 'HV-7701-C', hive_location: 'Riverside Apiary',        hive_type: 'Warre Hive',          installation_date: '42 mins ago', current_state: 'active',   owner: { id: '3', name: 'Admin' }, latitude:  0.3476, longitude: 32.5825 },
        { id: 'HV-2234-D', hive_location: 'North Orchard – Plot 2',  hive_type: 'Top Bar Hive',        installation_date: '1 hr ago',    current_state: 'migrated', owner: { id: '4', name: 'Admin' }, latitude:  0.3163, longitude: 32.5822 },
        { id: 'HV-1002-K', hive_location: 'South Meadow B',          hive_type: 'Langstroth 10-Frame', installation_date: '2 days ago',  current_state: 'inactive', owner: { id: '5', name: 'Admin' }, latitude:  0.0512, longitude: 32.4637 },
    ];

    // Server already filters when search param is present; demo rows filtered client-side
    const allRows: Beehive[] = beehives.length > 0 || initialSearch ? beehives : demoRows;
    const atRiskStates = ['lost', 'migrated'];
    const filteredHives = riskFilter
        ? allRows.filter((h) => atRiskStates.includes(h.current_state))
        : allRows;

    // Export CSV
    const exportCSV = () => {
        const headers = ['Hive ID', 'Location', 'Hive Type', 'Status', 'Last Activity', 'Owner'];
        const escape  = (v: string) => `"${v.replace(/"/g, '""')}"`;
        const csvRows = allRows.map((h, i) => {
            const bat = fakeBattery[i] ?? { pct: 75, color: '#f5a623' };
            const sc  = statusConfig[h.current_state] ?? statusConfig.active;
            return [h.id, h.hive_location, h.hive_type, sc.label, h.installation_date, bat.pct === 0 ? 'Offline' : `${bat.pct}%`];
        });
        const csv  = [headers, ...csvRows].map((r) => r.map(escape).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'hives.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Delete with confirm
    const handleDelete = (hive: Beehive) => {
        if (window.confirm(`Are you sure you want to delete this hive?`)) {
            router.delete(`/beehives/${hive.id}`);
        }
    };

    return (
        <>
            <Head title="Hive Inventory" />
            <div className="min-h-screen p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Page heading */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>Hive Inventory</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage and monitor active hives across all apiaries.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                    >
                        <Plus className="w-4 h-4" /> Add New Hive
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Total Hives</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-4xl font-bold" style={{ color: '#0d1b2a' }}>{beehives.length || 124}</p>
                            <span className="text-xs font-semibold text-emerald-500 mb-1">↑ 4%</span>
                        </div>
                        <div className="mt-3 h-1 w-12 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Elevated Risk</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-4xl font-bold" style={{ color: '#f5a623' }}>08</p>
                            <span className="text-xs text-gray-400 mb-1">Active Alerts</span>
                        </div>
                        <div className="mt-3 h-1 w-12 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Mean Temperature</p>
                        <div className="flex items-end gap-1 mt-2">
                            <p className="text-4xl font-bold" style={{ color: '#0d1b2a' }}>34.2°</p>
                            <span className="text-sm text-gray-400 mb-1">Celsius</span>
                        </div>
                        <div className="mt-3 h-1 w-12 rounded-full bg-gray-200" />
                    </div>
                    <button
                        onClick={() => setRiskFilter((v) => !v)}
                        className={`bg-white rounded-xl border shadow-sm p-5 text-left transition-all ${riskFilter ? "border-amber-400 ring-2 ring-amber-200" : "border-gray-200 hover:border-amber-300"}`}
                    >
                        <div className="flex items-start justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Hives at Risk</p>
                            <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "#f5a623" }} />
                        </div>
                        <div className="flex items-end gap-1 mt-2">
                            <p className="text-4xl font-bold" style={{ color: "#f5a623" }}>3</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Pre-Swarm, Swarm or Abscondence detected</p>
                        <div className="mt-3 h-1 w-12 rounded-full" style={{ backgroundColor: "#f5a623" }} />
                    </button>
                </div>

                {/* Active Monitoring Registry table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Active Monitoring Registry</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                                {initialSearch ? `Results for "${initialSearch}"` : `${filteredHives.length} hives`}
                            </span>
                            <button
                                onClick={exportCSV}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Hive ID</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Location</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Battery</th>

                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Activity</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHives.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                                        No hives found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredHives.map((hive) => {
                                const sc = statusConfig[hive.current_state] ?? statusConfig.active;
                                const origIdx = allRows.findIndex((h) => h.id === hive.id);

                                return (
                                    <tr key={hive.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>{hive.id}</p>
                                            <p className="text-xs text-gray-400">{hive.hive_type}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{hive.hive_location}</td>
                                        <td className="px-5 py-4">
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest"
                                                style={{ backgroundColor: sc.bg, color: sc.color }}>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {(() => {
                                                const bat = fakeBattery[origIdx] ?? { pct: 50, color: "#22c55e" };
                                                const batColor = bat.pct <= 20 ? "#ef4444" : bat.pct <= 50 ? "#f59e0b" : "#22c55e";
                                                return bat.pct === 0 ? (
                                                    <span className="text-xs text-gray-400">N/A</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 rounded-full bg-gray-100">
                                                            <div className="h-1.5 rounded-full" style={{ width: `${bat.pct}%`, backgroundColor: batColor }} />
                                                        </div>
                                                        <span className="text-xs text-gray-500">{bat.pct}%</span>
                                                    </div>
                                                );
                                            })()
                                            }
                                        </td>












                                        <td className="px-5 py-4 text-xs text-gray-400">{hive.installation_date}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => setViewTarget(hive)}
                                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                    title="View hive"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setEditTarget(hive)}
                                                    className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="Edit hive"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(hive)}
                                                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Delete hive"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400">Showing 1 to {Math.min(10, filteredHives.length)} of {filteredHives.length} Hives</span>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, '...', 25].map((p, i) => (
                                <button key={i} className="w-7 h-7 rounded text-xs font-semibold transition-colors"
                                    style={p === 1 ? { backgroundColor: '#f5a623', color: '#0d1b2a' } : { color: '#6b7280' }}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Hive Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Add New Hive</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Owner</label>
                                <select value={data.owner_id} onChange={(e) => setData('owner_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="" disabled>Select a beekeeper</option>
                                    {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Location</label>
                                <div className="relative">
                                    <input type="text" value={data.hive_location}
                                        onChange={(e) => { setData('hive_location', e.target.value); setGeoStatus('idle'); }}
                                        onBlur={async (e) => {
                                            const loc = e.target.value.trim();
                                            if (!loc) return;
                                            setGeoStatus('loading');
                                            try {
                                                const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc + ',Uganda')}&format=json&limit=1`);
                                                const json = await res.json();
                                                if (json.length > 0) {
                                                    setData('latitude', json[0].lat);
                                                    setData('longitude', json[0].lon);
                                                    setGeoStatus('found');
                                                } else {
                                                    setGeoStatus('notfound');
                                                }
                                            } catch {
                                                setGeoStatus('notfound');
                                            }
                                        }}
                                        placeholder="e.g. Masaka, Uganda"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none placeholder-gray-300 pr-8" required />
                                    {geoStatus === 'loading' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">...</span>}
                                    {geoStatus === 'found'   && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm"></span>}
                                    {geoStatus === 'notfound' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 text-sm"></span>}
                                </div>
                                {geoStatus === 'notfound' && <p className="text-[10px] text-amber-500 mt-1">Location not found. Coordinates will not be set.</p>}
                            </div>
                            <div>
                                <select value={data.hive_type} onChange={(e) => { setData('hive_type', e.target.value); if (e.target.value !== 'Other') setOtherHiveType(''); }}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>

                                    <option value="">Select type</option>
                                    <option value="Langstroth">Langstroth</option>
                                    <option value="Top-bar">Top-bar</option>
                                    <option value="Warre">Warre</option>
                                    <option value="Log Hive">Log Hive</option>
                                    <option value="Other">Other</option>
                                </select>
                            {data.hive_type === 'Other' && (
                                <input type="text" value={otherHiveType} onChange={(e) => setOtherHiveType(e.target.value)}
                                    placeholder="Please specify hive type"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none placeholder-gray-300 mt-2" />
                            )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Current State</label>
                                <select value={data.current_state} onChange={(e) => setData('current_state', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="">Select state</option>
                                    <option value="active">Normal</option>
                                    <option value="migrated">Pre-Swarm</option>
                                    <option value="lost">Swarm</option>
                                    <option value="abscondence">Abscondence</option>
                                    <option value="pest">Pest/Disturbance</option>
                                    <option value="uncertain">Uncertain</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={processing}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                    {processing ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Hive Modal */}
            {viewTarget && (() => {
                const sc  = statusConfig[viewTarget.current_state] ?? statusConfig.active;
                const idx = allRows.findIndex((h) => h.id === viewTarget.id);
                const bat = fakeBattery[idx] ?? { pct: 75, color: '#f5a623' };
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Hive Details</h2>
                                <button onClick={() => setViewTarget(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                {[
                                    { label: 'Hive ID',           value: viewTarget.id },
                                    { label: 'Location',          value: viewTarget.hive_location },
                                    { label: 'Hive Type',         value: viewTarget.hive_type },
                                    { label: 'Installation Date', value: viewTarget.installation_date },
                                    { label: 'Owner',             value: viewTarget.owner?.name ?? '—' },
                                ].map((r) => (
                                    <div key={r.label} className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{r.label}</span>
                                        <span className="text-sm text-gray-700">{r.value}</span>
                                    </div>
                                ))}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                                    <span className="inline-flex">
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest"
                                            style={{ backgroundColor: sc.bg, color: sc.color }}>
                                            {sc.label}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Battery</span>
                                    {bat.pct === 0 ? (
                                        <span className="text-sm text-gray-400">Offline</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 rounded-full bg-gray-100">
                                                <div className="h-1.5 rounded-full" style={{ width: `${bat.pct}%`, backgroundColor: bat.color }} />
                                            </div>
                                            <span className="text-xs text-gray-500">{bat.pct}%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button onClick={() => setViewTarget(null)}
                                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Edit Hive Modal */}
            {editTarget && <EditHiveModal hive={editTarget} owners={owners} onClose={() => setEditTarget(null)} />}
        </>
    );
}

// ── Edit Hive Modal ──────────────────────────────────────────────────────────
function EditHiveModal({ hive, owners, onClose }: { hive: Beehive; owners: Owner[]; onClose: () => void }) {
    const { data, setData, put, processing, errors } = useForm({
        owner_id:          hive.owner?.id ?? '',
        hive_location:     hive.hive_location,
        hive_type:         hive.hive_type,
        installation_date: hive.installation_date,
        current_state:     hive.current_state,
        latitude:          hive.latitude ?? '',
        longitude:         hive.longitude ?? '',
    });
    const [editOtherType, setEditOtherType] = useState(hive.hive_type === 'Other' ? '' : '');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/beehives/${hive.id}`, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Edit Hive</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Owner</label>
                        <select value={data.owner_id} onChange={(e) => setData('owner_id', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                            <option value="" disabled>Select a beekeeper</option>
                            {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                        {errors.owner_id && <p className="text-xs text-red-500 mt-1">{errors.owner_id}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Location</label>
                        <input type="text" value={data.hive_location} onChange={(e) => setData('hive_location', e.target.value)}
                            placeholder="e.g. North Field, Sector B"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none placeholder-gray-300" required />
                        {errors.hive_location && <p className="text-xs text-red-500 mt-1">{errors.hive_location}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Latitude</label>
                            <input type="number" step="any" value={data.latitude as string | number} onChange={(e) => setData('latitude', e.target.value)}
                                placeholder="e.g. 0.3476"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none placeholder-gray-300" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Longitude</label>
                            <input type="number" step="any" value={data.longitude as string | number} onChange={(e) => setData('longitude', e.target.value)}
                                placeholder="e.g. 32.5825"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none placeholder-gray-300" />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 -mt-2">You can get coordinates from Google Maps by right-clicking your location</p>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive Type</label>
                        <select value={data.hive_type} onChange={(e) => { setData('hive_type', e.target.value); if (e.target.value !== 'Other') setEditOtherType(''); }}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                            <option value="">Select type</option>
                            <option value="Langstroth">Langstroth</option>
                            <option value="Top-bar">Top-bar</option>
                            <option value="Warre">Warre</option>
                            <option value="Log Hive">Log Hive</option>
                            <option value="Other">Other</option>
                        </select>
                        {data.hive_type === 'Other' && (
                            <input type="text" value={editOtherType} onChange={(e) => setEditOtherType(e.target.value)}
                                placeholder="Please specify hive type"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none placeholder-gray-300 mt-2" />
                        )}
                        {errors.hive_type && <p className="text-xs text-red-500 mt-1">{errors.hive_type}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Installation Date</label>
                        <input type="date" value={data.installation_date} onChange={(e) => setData('installation_date', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none" required />
                        {errors.installation_date && <p className="text-xs text-red-500 mt-1">{errors.installation_date}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Current State</label>
                        <select value={data.current_state} onChange={(e) => setData('current_state', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                            <option value="">Select state</option>
                            <option value="active">Normal</option>
                            <option value="migrated">Pre-Swarm</option>
                            <option value="lost">Swarm</option>
                            <option value="abscondence">Abscondence</option>
                            <option value="pest">Pest/Disturbance</option>
                            <option value="uncertain">Uncertain</option>
                        </select>
                        {errors.current_state && <p className="text-xs text-red-500 mt-1">{errors.current_state}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={processing}
                            className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                            {processing ? 'Saving\u2026' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

Beehives.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Hives', href: '/beehives' },
    ],
};
