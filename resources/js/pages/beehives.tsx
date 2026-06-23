import { Head, router, useForm } from '@inertiajs/react';
import { Eye, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import { MenuItem } from '@mui/material';
import { DataTable } from '@/components/data-table';
import { formatDisplayText, cleanDataArray } from '@/lib/utils';

type Owner = { id: string; name: string };
type Beehive = {
    id: string;
    hive_name: string;
    hive_location: string;
    hive_type: string;
    installation_date: string;
    current_state: string;
    owner: { id: string; name: string } | null;
};

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    active:           { label: 'Stable',       bg: '#0d1b2a', color: '#ffffff' },
    inactive:         { label: 'Maintenance',  bg: '#0d1b2a', color: '#ffffff' },
    migrated:         { label: 'Temp Warning', bg: '#fff7ed', color: '#f5a623' },
    lost:             { label: 'Swarm Likely', bg: '#fff7ed', color: '#f5a623' },
    unknown:          { label: 'Unknown',      bg: '#f1f5f9', color: '#64748b' },
    // ML-detected hive states — same colors as the ML Results table (inferences.tsx)
    normal:           { label: 'Normal',         bg: '#dcfce7', color: '#16a34a' },
    pre_swarm:        { label: 'Pre-swarm',       bg: '#fef3c7', color: '#d97706' },
    swarm:            { label: 'Swarm',           bg: '#fee2e2', color: '#dc2626' },
    abscondence:      { label: 'Abscondence',     bg: '#fce7f3', color: '#9d174d' },
    external_noise:   { label: 'External Noise',  bg: '#ffedd5', color: '#ea580c' },
    pest_disturbance: { label: 'Pest Disturbance', bg: '#ffedd5', color: '#ea580c' },
    uncertain:        { label: 'Uncertain',       bg: '#f1f5f9', color: '#64748b' },
};

const defaultStatusStyle = { label: 'Unknown', bg: '#f1f5f9', color: '#64748b' };

function fmtDate(v: string | null) {
    if (!v) return '—';
    return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}



export default function Beehives({ beehives = [], owners = [], search: initialSearch = '' }: { beehives?: Beehive[]; owners?: Owner[]; search?: string }) {
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState<Beehive | null>(null);

    // Clean the beehives data on load
    const cleanedBeehives = useMemo(() => {
        return cleanDataArray(beehives, [
            'hive_name',
            'hive_location',
            'hive_type',
            'owner.name'
        ]);
    }, [beehives]);

    // Debug: Check beehives reference stability
    if (typeof window !== 'undefined') {
        console.log('beehives reference same:', beehives === (window as any).__lastBeehives);
        (window as any).__lastBeehives = beehives;
    }
    
    // No extra MRT state needed - let MRT handle it internally

    const { data, setData, post, reset, processing, errors } = useForm({
        owner_id:          '',
        hive_name:         '',
        hive_location:     '',
        hive_type:         '',
        installation_date: '',
        latitude:          '',
        longitude:         '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/beehives', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    const filteredHives = cleanedBeehives;

    const statusCounts = [...new Set(cleanedBeehives.map((h) => h.current_state))]
        .sort()
        .map((state) => ({
            state,
            count: cleanedBeehives.filter((h) => h.current_state === state).length,
        }));

    // Export CSV
    const exportCSV = () => {
        const headers = ['Hive Name', 'Location', 'Hive Type', 'Current Status', 'Owner', 'Installation Date'];
        const escape  = (v: string) => `"${v.replace(/"/g, '""')}"`;
        const csvRows = cleanedBeehives.map((h) => {
            const sc = statusConfig[h.current_state] ?? statusConfig.active;
            return [h.hive_name ?? '—', h.hive_location, h.hive_type, sc.label, h.owner?.name ?? '—', h.installation_date];
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

    const handleDelete = (hive: Beehive) => {
        const displayName = formatDisplayText(hive.hive_name) || formatDisplayText(hive.hive_location);
        if (window.confirm(`Delete "${displayName}"? This cannot be undone.`)) {
            router.delete(`/beehives/${hive.id}`);
        }
    };

    const columns = useMemo<MRT_ColumnDef<Beehive>[]>(() => [
        {
            id: 'index',
            header: '#',
            enableSorting: false,
            enableColumnFilter: false,
            size: 40,
            minSize: 40,
            maxSize: 50,
            muiTableHeadCellProps: { sx: { paddingLeft: '8px', paddingRight: '4px' } },
            muiTableBodyCellProps: { sx: { paddingLeft: '8px', paddingRight: '4px' } },
            Cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: 'hive_name',
            header: 'Hive Name',
            enableSorting: true,
            enableColumnFilter: true,
            size: 200,
            Cell: ({ row }) => {
                const name = row.original.hive_name;
                return (
                    <div>
                        <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>{name || '—'}</p>
                        <p className="text-xs text-gray-400">{row.original.hive_type}</p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'hive_location',
            header: 'Location',
            enableSorting: true,
            enableColumnFilter: true,
            size: 140,
            Cell: ({ cell }) => {
                return <p className="text-sm text-gray-600">{cell.getValue<string>()}</p>;
            },
        },
        {
            accessorKey: 'current_state',
            header: 'Current Status',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['active', 'inactive', 'migrated', 'lost', 'unknown', 'normal', 'pre_swarm', 'swarm', 'abscondence', 'external_noise', 'pest_disturbance', 'uncertain'],
            size: 140,
            Cell: ({ row }) => {
                const sc = statusConfig[row.original.current_state] ?? defaultStatusStyle;
                return (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-widest whitespace-nowrap"
                        style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {sc.label}
                    </span>
                );
            },
        },
        {
            accessorKey: 'owner.name',
            header: 'Owner',
            enableSorting: true,
            enableColumnFilter: true,
            size: 160,
            Cell: ({ row }) => {
                return <p className="text-sm text-gray-600">{row.original.owner?.name ?? '—'}</p>;
            },
        },
        {
            accessorKey: 'installation_date',
            header: 'Installation Date',
            enableSorting: true,
            enableColumnFilter: false,
            size: 130,
            Cell: ({ cell }) => {
                return <p className="text-xs text-gray-400">{fmtDate(cell.getValue<string>())}</p>;
            },
        },
    ], []);

    return (
        <>
            <Head title="Hive Inventory" />
            <div className="p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

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

                {/* Stat cards — total + breakdown by current_state */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Total Hives</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: '#0d1b2a' }}>{cleanedBeehives.length}</p>
                    </div>
                    {statusCounts.map(({ state, count }) => {
                        const sc = statusConfig[state] ?? defaultStatusStyle;
                        return (
                            <div key={state} className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{sc.label}</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: sc.bg === '#0d1b2a' ? '#0d1b2a' : sc.color }}>
                                    {count}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Material React Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Active Monitoring Registry</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                                {initialSearch ? `Results for "${initialSearch}"` : `${cleanedBeehives.length} hives`}
                            </span>
                            <button
                                onClick={exportCSV}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={cleanedBeehives}
                        getRowId={(row) => row.id}
                        enableRowActions={true}
                        renderRowActionMenuItems={({ closeMenu, row }) => [
                            <MenuItem
                                key="view"
                                onClick={() => {
                                    router.visit(`/beehives/${row.original.id}`);
                                    closeMenu();
                                }}
                            >
                                <Eye className="mr-2" />
                                View
                            </MenuItem>,
                            <MenuItem
                                key="edit"
                                onClick={() => {
                                    setEditTarget(row.original);
                                    closeMenu();
                                }}
                            >
                                <Pencil className="mr-2" />
                                Edit
                            </MenuItem>,
                            <MenuItem
                                key="delete"
                                onClick={() => {
                                    handleDelete(row.original);
                                    closeMenu();
                                }}
                                sx={{ color: '#ef4444' }}
                            >
                                <Trash2 className="mr-2" />
                                Delete
                            </MenuItem>,
                        ]}
                    />
                </div>

            </div>

            {/* Add Hive Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl my-4">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Add New Hive</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Fields marked <span className="text-red-500">*</span> are required</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="px-6 pb-6 pt-4 flex flex-col gap-5">

                            {/* Owner */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Owner <span className="text-red-500">*</span></label>
                                <select
                                    value={data.owner_id}
                                    onChange={(e) => setData('owner_id', e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 outline-none bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                >
                                    <option value="" disabled>Select a beekeeper…</option>
                                    {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                                {errors.owner_id && <p className="text-xs text-red-500">⚠ {errors.owner_id}</p>}
                            </div>

                            {/* Hive Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">
                                    Hive Name <span className="text-red-500">*</span>
                                    <span className="ml-2 text-xs font-normal text-gray-400">Friendly name e.g. "Hive #1"</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.hive_name}
                                    onChange={(e) => setData('hive_name', e.target.value)}
                                    placeholder='e.g. Hive #1'
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                />
                                {errors.hive_name && <p className="text-xs text-red-500">⚠ {errors.hive_name}</p>}
                            </div>

                            {/* Hive Location */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">Hive Location <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={data.hive_location}
                                    onChange={(e) => setData('hive_location', e.target.value)}
                                    placeholder="e.g. North Orchard – Plot 4"
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                />
                                {errors.hive_location && <p className="text-xs text-red-500">⚠ {errors.hive_location}</p>}
                            </div>

                            {/* Hive Type */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">
                                    Hive Type <span className="text-red-500">*</span>
                                    <span className="ml-2 text-xs font-normal text-gray-400">e.g. "Langstroth", "Kenyan Top Bar", "Warre"</span>
                                </label>
                                <select
                                    value={data.hive_type}
                                    onChange={(e) => setData('hive_type', e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 outline-none bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                >
                                    <option value="" disabled>Select hive type…</option>
                                    <option>Langstroth</option>
                                    <option>Kenyan Top Bar</option>
                                    <option>Warre</option>
                                    <option>Flow Hive</option>
                                    <option>Top Bar</option>
                                    <option>Other</option>
                                </select>
                                {errors.hive_type && <p className="text-xs text-red-500">⚠ {errors.hive_type}</p>}
                            </div>

                            {/* Installation Date */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">
                                    Installation Date <span className="text-red-500">*</span>
                                    <span className="ml-2 text-xs font-normal text-gray-400">Date the hive was set up</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.installation_date}
                                    onChange={(e) => setData('installation_date', e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                />
                                {errors.installation_date && <p className="text-xs text-red-500">⚠ {errors.installation_date}</p>}
                            </div>

                            {/* GPS Coordinates */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">
                                    GPS Coordinates <span className="text-xs font-normal text-gray-400">(optional — up to 6 decimal places)</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500 font-medium">Latitude</span>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            min="-90" max="90"
                                            value={data.latitude}
                                            onChange={(e) => setData('latitude', e.target.value)}
                                            placeholder="e.g. 0.347596"
                                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                        />
                                        {errors.latitude && <p className="text-xs text-red-500">⚠ {errors.latitude}</p>}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-gray-500 font-medium">Longitude</span>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            min="-180" max="180"
                                            value={data.longitude}
                                            onChange={(e) => setData('longitude', e.target.value)}
                                            placeholder="e.g. 32.582520"
                                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                                        />
                                        {errors.longitude && <p className="text-xs text-red-500">⚠ {errors.longitude}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-1">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing}
                                    className="px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                    {processing ? 'Saving…' : 'Save Hive'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
