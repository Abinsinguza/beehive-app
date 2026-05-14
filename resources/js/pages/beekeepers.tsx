import { Head, router, useForm } from '@inertiajs/react';
import { ChevronDown, Download, Edit2, Eye, UserPlus, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Beekeeper = {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    status?: string;
    beehives_count?: number;
    created_at?: string;
};

const roleColors: Record<string, { bg: string; color: string }> = {
    Administrator: { bg: '#0d1b2a', color: '#ffffff' },
    Beekeeper:     { bg: '#f1f5f9', color: '#374151' },
};

const statusConfig: Record<string, { dot: string; label: string; labelColor: string }> = {
    active:    { dot: '#22c55e', label: 'Active',    labelColor: '#16a34a' },
    pending:   { dot: '#f59e0b', label: 'Pending',   labelColor: '#d97706' },
    revoked:   { dot: '#94a3b8', label: 'Revoked',   labelColor: '#94a3b8' },
    suspended: { dot: '#94a3b8', label: 'Suspended', labelColor: '#94a3b8' },
};

const auditLog = [
    { color: '#f5a623', text: "Arthur Denton modified hive permissions for User 'Elena Markov'", meta: 'October 24, 2023 at 14:22 PM â€¢ IP: 192.168.1.1' },
    { color: '#3b82f6', text: 'New system audit: Access tokens refreshed for all Beekeeper roles', meta: 'October 24, 2023 at 09:15 AM â€¢ Automatic System Task' },
    { color: '#ef4444', text: 'Security Alert: Failed login attempt from unrecognized device (User: LHuang)', meta: 'October 23, 2023 at 23:59 PM â€¢ Device: Android 12' },
];

function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function getRole(bk: Beekeeper): string {
    if (bk.email?.includes('swarmintel')) return 'Administrator';
    return 'Beekeeper';
}

function getStatus(bk: Beekeeper): string {
    if (bk.status) return bk.status;
    if (bk.email) return 'active';
    return 'pending';
}

// â”€â”€ Add Beekeeper form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddBeekeeperModal({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '', phone: '', email: '', address: '', password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/beekeepers', { onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <ModalShell title="Add New Beekeeper" onClose={onClose}>
            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                {[
                    { label: 'Full Name', key: 'name',     type: 'text',     placeholder: 'e.g. John Doe',         required: true  },
                    { label: 'Phone',     key: 'phone',    type: 'text',     placeholder: '+256 700 000 000',       required: true  },
                    { label: 'Email',     key: 'email',    type: 'email',    placeholder: 'john@example.com',       required: false },
                    { label: 'Password',  key: 'password', type: 'password', placeholder: 'Auto-generated password', required: false },
                    { label: 'Address',   key: 'address',  type: 'text',     placeholder: '123 Honey Lane',         required: false },
                ].map((f) => (
                    <div key={f.key}>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">{f.label}</label>
                        <input
                            type={f.type}
                            value={data[f.key as keyof typeof data]}
                            onChange={(e) => setData(f.key as keyof typeof data, e.target.value)}
                            placeholder={f.placeholder}
                            required={f.required}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300"
                        />
                        {errors[f.key as keyof typeof errors] && (
                            <p className="text-xs text-red-500 mt-1">{errors[f.key as keyof typeof errors]}</p>
                        )}
                    </div>
                ))}
                <ModalActions onCancel={onClose} processing={processing} label="Save" />
            </form>
        </ModalShell>
    );
}

// â”€â”€ Edit Beekeeper form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EditBeekeeperModal({ beekeeper, onClose }: { beekeeper: Beekeeper; onClose: () => void }) {
    const { data, setData, patch, processing, errors } = useForm({
        name:     beekeeper.name,
        phone:    beekeeper.phone,
        email:    beekeeper.email    ?? '',
        address:  beekeeper.address  ?? '',
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/beekeepers/${beekeeper.id}`, { onSuccess: () => onClose() });
    };

    return (
        <ModalShell title="Edit Beekeeper" onClose={onClose}>
            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                {[
                    { label: 'Full Name',     key: 'name',     type: 'text',     placeholder: 'e.g. John Doe',              required: true  },
                    { label: 'Phone',         key: 'phone',    type: 'text',     placeholder: '+1 555 000 0000',            required: true  },
                    { label: 'Email',         key: 'email',    type: 'email',    placeholder: 'john@example.com',           required: false },
                    { label: 'Address',       key: 'address',  type: 'text',     placeholder: '123 Honey Lane',             required: false },
                    { label: 'New Password',  key: 'password', type: 'password', placeholder: 'Leave blank to keep current', required: false },
                ].map((f) => (
                    <div key={f.key}>
                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">{f.label}</label>
                        <input
                            type={f.type}
                            value={data[f.key as keyof typeof data]}
                            onChange={(e) => setData(f.key as keyof typeof data, e.target.value)}
                            placeholder={f.placeholder}
                            required={f.required}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300"
                        />
                        {errors[f.key as keyof typeof errors] && (
                            <p className="text-xs text-red-500 mt-1">{errors[f.key as keyof typeof errors]}</p>
                        )}
                    </div>
                ))}
                <ModalActions onCancel={onClose} processing={processing} label="Update Beekeeper" />
            </form>
        </ModalShell>
    );
}

// â”€â”€ View Beekeeper modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ViewBeekeeperModal({ beekeeper, onClose }: { beekeeper: Beekeeper; onClose: () => void }) {
    const role   = getRole(beekeeper);
    const status = getStatus(beekeeper);
    const sc     = statusConfig[status] ?? statusConfig.active;
    const rc     = roleColors[role]     ?? roleColors.Beekeeper;

    return (
        <ModalShell title="Beekeeper Details" onClose={onClose}>
            <div className="p-6 flex flex-col gap-5">
                {/* Avatar + name + id */}
                <div className="flex items-center gap-4">
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                        style={{ backgroundColor: '#0d1b2a' }}
                    >
                        {getInitials(beekeeper.name)}
                    </div>
                    <div>
                        <p className="font-bold text-base" style={{ color: '#0d1b2a' }}>{beekeeper.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{beekeeper.id}</p>
                    </div>
                </div>

                {/* Detail rows */}
                <div className="flex flex-col gap-3 divide-y divide-gray-50">
                    {/* Full Name */}
                    <div className="flex flex-col gap-0.5 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</span>
                        <span className="text-sm text-gray-700">{beekeeper.name}</span>
                    </div>
                    {/* Email */}
                    <div className="flex flex-col gap-0.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</span>
                        <span className="text-sm text-gray-700">{beekeeper.email ?? 'â€”'}</span>
                    </div>
                    {/* Phone */}
                    <div className="flex flex-col gap-0.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone</span>
                        <span className="text-sm text-gray-700">{beekeeper.phone}</span>
                    </div>
                    {/* Address */}
                    <div className="flex flex-col gap-0.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Address</span>
                        <span className="text-sm text-gray-700">{beekeeper.address ?? 'â€”'}</span>
                    </div>
                    {/* Role */}
                    <div className="flex flex-col gap-0.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</span>
                        <span className="inline-flex">
                            <span
                                className="text-[11px] font-bold px-2.5 py-1 rounded border uppercase tracking-widest"
                                style={{ backgroundColor: rc.bg, color: rc.color, borderColor: rc.bg === '#f1f5f9' ? '#e5e7eb' : rc.bg }}
                            >
                                {role}
                            </span>
                        </span>
                    </div>
                    {/* Status */}
                    <div className="flex flex-col gap-0.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sc.dot }} />
                            <span className="text-xs font-medium" style={{ color: sc.labelColor }}>{sc.label}</span>
                        </div>
                    </div>
                    {/* Hives */}
                    <div className="flex flex-col gap-0.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hives</span>
                        <span
                            className="inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold"
                            style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                        >
                            {beekeeper.beehives_count ?? 0}
                        </span>
                    </div>
                    {/* Sign Up Date */}
                    <div className="flex flex-col gap-0.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sign Up Date</span>
                        <span className="text-sm text-gray-700">
                            {beekeeper.created_at ? new Date(beekeeper.created_at).toLocaleDateString() : ''}
                        </span>
                    </div>
                    {/* Last Login */}
                    <div className="flex flex-col gap-0.5 pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Login</span>
                        <span className="text-sm text-gray-400">â€”</span>
                    </div>
                </div>

                <div className="flex justify-end pt-1">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

// â”€â”€ Shared modal shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => document.body.classList.remove('overflow-hidden');
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-hidden">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>{title}</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

function ModalActions({ onCancel, processing, label }: { onCancel: () => void; processing: boolean; label: string }) {
    return (
        <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
            </button>
            <button type="submit" disabled={processing}
                className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                {processing ? 'Savingâ€¦' : label}
            </button>
        </div>
    );
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Beekeepers({
    beekeepers = [],
    search: initialSearch = '',
}: {
    beekeepers?: Beekeeper[];
    search?: string;
}) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewTarget, setViewTarget]     = useState<Beekeeper | null>(null);
    const [editTarget, setEditTarget]     = useState<Beekeeper | null>(null);
    const [revokeTarget, setRevokeTarget]     = useState<Beekeeper | null>(null);
    const [restoreTarget, setRestoreTarget]   = useState<Beekeeper | null>(null);
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [showColMenu, setShowColMenu]   = useState(false);
    const colMenuRef                      = useRef<HTMLDivElement>(null);

    // Close columns dropdown when clicking outside
    useEffect(() => {
        if (!showColMenu) return;
        const handler = (e: MouseEvent) => {
            if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
                setShowColMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showColMenu]);
    const [visibleCols, setVisibleCols]   = useState({
        status:     true,
        hives:      true,
        lastLogin:  true,
        address:    true,
        signUpDate: true,
    });

    // Revoke logic
    const { patch: revokePatch, processing: revoking } = useForm({});
    const confirmRevoke = () => {
        if (!revokeTarget) return;
        revokePatch('/beekeepers/' + revokeTarget.id + '/revoke', {
            onSuccess: () => setRevokeTarget(null),
        });
    };

    // Restore logic
    const { patch: restorePatch, processing: restoring } = useForm({});
    const confirmRestore = () => {
        if (!restoreTarget) return;
        restorePatch('/beekeepers/' + restoreTarget.id + '/restore', {
            onSuccess: () => setRestoreTarget(null),
        });
    };

    const toggleCol = (col: keyof typeof visibleCols) => {
        setVisibleCols((prev) => ({ ...prev, [col]: !prev[col] }));
    };

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Hives', 'Address', 'Sign Up Date'];
        const rows = beekeepers.map((bk) => [
            bk.name,
            bk.email ?? '',
            bk.phone,
            getRole(bk),
            getStatus(bk),
            String(bk.beehives_count ?? 0),
            bk.address ?? '',
            bk.created_at ? new Date(bk.created_at).toLocaleDateString() : '',
        ]);

        const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
        const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'beekeepers.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const filtered = beekeepers.filter((bk) => {
        const status = getStatus(bk);
        return statusFilter === 'All Statuses' || status === statusFilter.toLowerCase();
    });

    // Count visible columns for colSpan
    const visibleColCount =
        1 + // USER IDENTITY always
        (visibleCols.status ? 1 : 0) +
        (visibleCols.hives ? 1 : 0) +
        (visibleCols.lastLogin ? 1 : 0) +
        (visibleCols.address ? 1 : 0) +
        (visibleCols.signUpDate ? 1 : 0) +
        1; // ACTIONS always

    return (
        <>
            <Head title="Beekeeper Management" />
            <div className="min-h-screen p-6 flex flex-col gap-6" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Page heading */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>Beekeeper Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage and monitor all registered beekeepers in the system.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                    >
                        <UserPlus className="w-4 h-4" /> Add Beekeeper
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Total Beekeepers</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-4xl font-bold" style={{ color: '#0d1b2a' }}>{beekeepers.length}</p>
                            <span className="text-xs font-semibold text-emerald-500 mb-1">â†— +3</span>
                        </div>
                        <div className="mt-3 h-1 w-16 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Active Sessions</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-4xl font-bold" style={{ color: '#0d1b2a' }}>12</p>
                            <span className="text-xs text-gray-400 mb-1">Currently Online</span>
                        </div>
                        <div className="mt-3 h-1 w-16 rounded-full bg-gray-200" />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Active Beekeepers</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-4xl font-bold text-emerald-500">
                                {beekeepers.filter((bk) => getStatus(bk) === 'active').length}
                            </p>
                        </div>
                        <div className="mt-3 h-1 w-16 rounded-full bg-emerald-100" />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Inactive / Revoked</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-4xl font-bold text-gray-400">
                                {beekeepers.filter((bk) => getStatus(bk) !== 'active').length}
                            </p>
                        </div>
                        <div className="mt-3 h-1 w-16 rounded-full bg-gray-200" />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Filter bar */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 outline-none bg-white"
                        >
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Pending</option>
                            <option>Revoked</option>
                        </select>

                        {/* Columns toggle */}
                        <div className="relative" ref={colMenuRef}>
                            <button
                                onClick={() => setShowColMenu((v) => !v)}
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-1.5 text-gray-600 hover:bg-gray-50"
                            >
                                Columns <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {showColMenu && (
                                <div className="absolute z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-48 top-full mt-1">
                                    {/* Always-on identity row */}
                                    <div className="flex items-center gap-2 px-1 py-1.5 opacity-50 cursor-not-allowed">
                                        <input type="checkbox" checked readOnly className="rounded" />
                                        <span className="text-xs text-gray-600">User Identity</span>
                                    </div>
                                    {(
                                        [
                                            { key: 'status',     label: 'Status' },
                                            { key: 'hives',      label: 'Hives' },
                                            { key: 'lastLogin',  label: 'Last Login' },
                                            { key: 'address',    label: 'Address' },
                                            { key: 'signUpDate', label: 'Sign Up Date' },
                                        ] as { key: keyof typeof visibleCols; label: string }[]
                                    ).map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 px-1 py-1.5 cursor-pointer hover:bg-gray-50 rounded">
                                            <input
                                                type="checkbox"
                                                checked={visibleCols[key]}
                                                onChange={() => toggleCol(key)}
                                                className="rounded"
                                            />
                                            <span className="text-xs text-gray-600">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <span className="ml-auto text-xs text-gray-400">
                            Showing {Math.min(10, filtered.length)} of {filtered.length} beekeepers
                        </span>
                    </div>

                    {/* Table */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">User Identity</th>
                                {visibleCols.status     && <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>}
                                {visibleCols.hives      && <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Hives</th>}
                                {visibleCols.lastLogin  && <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Login</th>}
                                {visibleCols.address    && <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Address</th>}
                                {visibleCols.signUpDate && <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Sign Up Date</th>}
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleColCount} className="px-5 py-12 text-center text-sm text-gray-400">
                                        {statusFilter !== 'All Statuses'
                                            ? 'No beekeepers match your filters.'
                                            : 'No beekeepers found. Add your first beekeeper to get started.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.slice(0, 10).map((bk) => {
                                    const role      = getRole(bk);
                                    const status    = getStatus(bk);
                                    const sc        = statusConfig[status] ?? statusConfig.active;
                                    const rc        = roleColors[role]     ?? roleColors.Beekeeper;
                                    const isRevoked = status === 'revoked';
                                    return (
                                        <tr key={bk.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            {/* USER IDENTITY */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                                        style={{ backgroundColor: '#0d1b2a' }}
                                                    >
                                                        {getInitials(bk.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>{bk.name}</p>
                                                        <p className="text-xs text-gray-400">{bk.email ?? bk.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* STATUS */}
                                            {visibleCols.status && (
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sc.dot }} />
                                                        <span className="text-xs font-medium" style={{ color: sc.labelColor }}>{sc.label}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {/* HIVES */}
                                            {visibleCols.hives && (
                                                <td className="px-5 py-4">
                                                    <span
                                                        className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded text-xs font-bold"
                                                        style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                                                    >
                                                        {bk.beehives_count ?? 0}
                                                    </span>
                                                </td>
                                            )}
                                            {/* LAST LOGIN */}
                                            {visibleCols.lastLogin && (
                                                <td className="px-5 py-4 text-xs italic text-gray-400">Never</td>
                                            )}
                                            {/* ADDRESS */}
                                            {visibleCols.address && (
                                                <td className="px-5 py-4 text-xs text-gray-400">{bk.address ?? '—'}</td>
                                            )}
                                            {/* SIGN UP DATE */}
                                            {visibleCols.signUpDate && (
                                                <td className="px-5 py-4 text-xs text-gray-400">
                                                    {bk.created_at ? new Date(bk.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : <span className="italic text-gray-400">Never</span>}
                                                </td>
                                            )}
                                            {/* ACTIONS */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setViewTarget(bk)}
                                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="View beekeeper"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditTarget(bk)}
                                                        className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                                                        title="Edit beekeeper"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    {isRevoked ? (
                                                        <button
                                                            onClick={() => setRestoreTarget(bk)}
                                                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                                                        >
                                                            Restore
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => setRevokeTarget(bk)}
                                                            className="text-xs font-semibold text-orange-500 hover:text-orange-700 px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {/* Table footer */}
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                            <Download className="w-3.5 h-3.5" /> Export CSV
                        </button>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, '...', 5].map((p, i) => (
                                <button key={i}
                                    className="w-7 h-7 rounded text-xs font-semibold transition-colors"
                                    style={p === 1 ? { backgroundColor: '#f5a623', color: '#0d1b2a' } : { color: '#6b7280' }}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Audit log */}
                    <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Recent Administrative Actions</h2>
                            <Zap className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="flex flex-col gap-4">
                            {auditLog.map((log, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: log.color }} />
                                    <div>
                                        <p className="text-sm text-gray-700">{log.text}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{log.meta}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Access Guidelines */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
                            <span className="text-blue-500 font-bold text-sm">i</span>
                        </div>
                        <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Access Guidelines</h2>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Administrators have full read/write access to hive data and swarm records. Beekeepers are limited to their assigned apiaries.
                        </p>
                        <button className="flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: '#0d1b2a' }}>
                            View Security Protocols â†’
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddModal && <AddBeekeeperModal onClose={() => setShowAddModal(false)} />}
            {viewTarget   && <ViewBeekeeperModal beekeeper={viewTarget}  onClose={() => setViewTarget(null)}   />}
            {editTarget   && <EditBeekeeperModal beekeeper={editTarget}  onClose={() => setEditTarget(null)}   />}

            {/* Revoke confirmation modal */}
            {revokeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 flex flex-col gap-4">
                        <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Revoke Access</h2>
                        <p className="text-sm text-gray-500">
                            Revoke access for{' '}
                            <span className="font-semibold text-gray-700">{revokeTarget.name}</span>?
                            They will no longer be able to access the system.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRevokeTarget(null)}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRevoke}
                                disabled={revoking}
                                className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                            >
                                {revoking ? 'Revoking\u2026' : 'Revoke Access'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restore confirmation modal */}
            {restoreTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 flex flex-col gap-4">
                        <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Restore Access</h2>
                        <p className="text-sm text-gray-500">
                            Restore access for{' '}
                            <span className="font-semibold text-gray-700">{restoreTarget.name}</span>?
                            They will regain full access to the system.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRestoreTarget(null)}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRestore}
                                disabled={restoring}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 bg-emerald-600"
                            >
                                {restoring ? 'Restoring\u2026' : 'Restore Access'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Beekeepers.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Beekeeper Management', href: '/beekeepers' },
    ],
};