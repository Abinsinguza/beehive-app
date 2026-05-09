import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

type Owner = { id: string; name: string };
type Beehive = {
    id: string;
    hive_location: string;
    hive_type: string;
    installation_date: string;
    current_state: string;
    owner: { id: string; name: string };
};

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    active:      { label: 'STABLE',       bg: '#0d1b2a', color: '#ffffff' },
    inactive:    { label: 'MAINTENANCE',  bg: '#0d1b2a', color: '#ffffff' },
    migrated:    { label: 'TEMP WARNING', bg: '#fff7ed', color: '#f5a623' },
    lost:        { label: 'SWARM LIKELY', bg: '#fff7ed', color: '#f5a623' },
};

// Fake battery levels for demo when no real data
const fakeBattery: Record<number, { pct: number; color: string }> = {
    0: { pct: 12,  color: '#ef4444' },
    1: { pct: 88,  color: '#f5a623' },
    2: { pct: 95,  color: '#f5a623' },
    3: { pct: 64,  color: '#f5a623' },
    4: { pct: 0,   color: '#94a3b8' },
};

const deploymentLog = [
    { color: '#f5a623', title: 'Hive Inspection Completed',        sub: 'Hive HV-8812-B • 2h ago' },
    { color: '#94a3b8', title: 'Maintenance Complete',             sub: 'Hive HV-1002-K • 5h ago' },
    { color: '#f5a623', title: 'Swarm Alert Threshold Adjusted',   sub: 'System Global • 8h ago' },
];

export default function Beehives({ beehives = [], owners = [], search: initialSearch = '' }: { beehives?: Beehive[]; owners?: Owner[]; search?: string }) {
    const [showModal, setShowModal]     = useState(false);
    const [viewTarget, setViewTarget]   = useState<Beehive | null>(null);
    const [editTarget, setEditTarget]   = useState<Beehive | null>(null);

    const { data, setData, post, reset, processing } = useForm({
        owner_id: '',
        hive_location: '',
        hive_type: '',
        current_state: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/beehives', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    // Static demo rows used only when no real data exists
    const demoRows: Beehive[] = [
        { id: 'HV-9421-A', hive_location: 'North Orchard – Plot 4', hive_type: 'Langstroth 10-Frame', installation_date: '2 mins ago',  current_state: 'lost',     owner: { id: '1', name: 'Admin' } },
        { id: 'HV-8812-B', hive_location: 'East Valley Ridge',       hive_type: 'Flow Hive Classic',   installation_date: '14 mins ago', current_state: 'active',   owner: { id: '2', name: 'Admin' } },
        { id: 'HV-7701-C', hive_location: 'Riverside Apiary',        hive_type: 'Warre Hive',          installation_date: '42 mins ago', current_state: 'active',   owner: { id: '3', name: 'Admin' } },
        { id: 'HV-2234-D', hive_location: 'North Orchard – Plot 2',  hive_type: 'Top Bar Hive',        installation_date: '1 hr ago',    current_state: 'migrated', owner: { id: '4', name: 'Admin' } },
        { id: 'HV-1002-K', hive_location: 'South Meadow B',          hive_type: 'Langstroth 10-Frame', installation_date: '2 days ago',  current_state: 'inactive', owner: { id: '5', name: 'Admin' } },
    ];

    // Server already filters when search param is present; demo rows filtered client-side
    const allRows: Beehive[] = beehives.length > 0 || initialSearch ? beehives : demoRows;
    const filteredHives = allRows;

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
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Honey Production</p>
                        <div className="flex items-end gap-1 mt-2">
                            <p className="text-4xl font-bold" style={{ color: '#0d1b2a' }}>1.2t</p>
                            <span className="text-xs text-gray-400 mb-1">Est. Weight</span>
                        </div>
                        <div className="mt-3 h-1 w-12 rounded-full bg-gray-200" />
                    </div>
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
                                const bat = fakeBattery[origIdx] ?? { pct: 75, color: '#f5a623' };
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
                                            {bat.pct === 0 ? (
                                                <span className="text-xs text-gray-400">Offline</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 rounded-full bg-gray-100">
                                                        <div className="h-1.5 rounded-full" style={{ width: `${bat.pct}%`, backgroundColor: bat.color }} />
                                                    </div>
                                                    <span className="text-xs text-gray-500">{bat.pct}%</span>
                                                </div>
                                            )}
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

                {/* Bottom: Map + Deployment Log */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Regional Hive Concentration map */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Regional Hive Concentration</h2>
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f5a623' }}>Live Feed</span>
                        </div>
                        <div className="relative h-56" style={{ backgroundColor: '#c8d6c0' }}>
                            {/* Satellite-style map placeholder */}
                            <div className="absolute inset-0 opacity-60"
                                style={{
                                    background: 'linear-gradient(135deg, #8fa882 0%, #a8b89e 30%, #7a9470 60%, #6b8560 100%)',
                                }}
                            />
                            <div className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: 'repeating-linear-gradient(0deg, #4a6741 0px, #4a6741 1px, transparent 1px, transparent 30px), repeating-linear-gradient(90deg, #4a6741 0px, #4a6741 1px, transparent 1px, transparent 30px)',
                                }}
                            />
                            {/* Pin */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: '#f5a623', backgroundColor: 'rgba(245,166,35,0.2)' }}>
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deployment Log */}
                    <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#0d1b2a' }}>
                        <div>
                            <p className="font-bold text-sm text-white">Deployment Log</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Recent operational updates</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            {deploymentLog.map((log, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: log.color }} />
                                    <div>
                                        <p className="text-xs font-semibold text-white">{log.title}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{log.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link href="/alerts" className="w-full py-2.5 rounded-lg border border-slate-600 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-slate-400 transition-colors mt-auto text-center block">
                            View Full Audit Log
                        </Link>
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
                                <input type="text" value={data.hive_location} onChange={(e) => setData('hive_location', e.target.value)}
                                    placeholder="e.g. North Field, Sector B"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none placeholder-gray-300" required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive Type</label>
                                <input type="text" value={data.hive_type} onChange={(e) => setData('hive_type', e.target.value)}
                                    placeholder="e.g. Langstroth, Top-bar"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none placeholder-gray-300" required />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Current State</label>
                                <select value={data.current_state} onChange={(e) => setData('current_state', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="">Select state</option>
                                    <option value="active">Active / Stable</option>
                                    <option value="migrated">Temp Warning</option>
                                    <option value="lost">Swarm Likely</option>
                                    <option value="inactive">Maintenance</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={processing}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                    {processing ? 'Saving…' : 'Save Hive'}
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
    });

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
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive Type</label>
                        <input type="text" value={data.hive_type} onChange={(e) => setData('hive_type', e.target.value)}
                            placeholder="e.g. Langstroth, Top-bar"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none placeholder-gray-300" required />
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
                            <option value="active">Active / Stable</option>
                            <option value="migrated">Temp Warning</option>
                            <option value="lost">Swarm Likely</option>
                            <option value="inactive">Maintenance</option>
                        </select>
                        {errors.current_state && <p className="text-xs text-red-500 mt-1">{errors.current_state}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={processing}
                            className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                            {processing ? 'Saving…' : 'Update Hive'}
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
