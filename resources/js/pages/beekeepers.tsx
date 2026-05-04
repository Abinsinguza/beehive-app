import { Head, useForm } from '@inertiajs/react';
import { Download, Edit2, Eye, Shield, Trash2, UserPlus, X, Zap } from 'lucide-react';
import { useState } from 'react';

type Beekeeper = {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
};

const roleColors: Record<string, { bg: string; color: string }> = {
    Administrator: { bg: '#0d1b2a', color: '#ffffff' },
    Beekeeper:     { bg: '#f1f5f9', color: '#374151' },
};

const statusConfig: Record<string, { dot: string; label: string; labelColor: string }> = {
    active:    { dot: '#22c55e', label: 'Active',           labelColor: '#16a34a' },
    pending:   { dot: '#f59e0b', label: 'Pending Approval', labelColor: '#d97706' },
    suspended: { dot: '#94a3b8', label: 'Suspended',        labelColor: '#94a3b8' },
};

const auditLog = [
    { color: '#f5a623', text: "Arthur Denton modified hive permissions for User 'Elena Markov'", meta: 'October 24, 2023 at 14:22 PM • IP: 192.168.1.1' },
    { color: '#3b82f6', text: 'New system audit: Access tokens refreshed for all Beekeeper roles', meta: 'October 24, 2023 at 09:15 AM • Automatic System Task' },
    { color: '#ef4444', text: 'Security Alert: Failed login attempt from unrecognized device (User: LHuang)', meta: 'October 23, 2023 at 23:59 PM • Device: Android 12' },
];

function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function getRole(bk: Beekeeper): string {
    if (bk.email?.includes('swarmintel')) return 'Administrator';
    return 'Beekeeper';
}

function getStatus(bk: Beekeeper): string {
    if (!bk.email) return 'pending';
    if (bk.address?.toLowerCase().includes('suspend')) return 'suspended';
    return 'active';
}

// ── Add User form ────────────────────────────────────────────────────────────
function AddUserModal({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '', phone: '', email: '', address: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/beekeepers', { onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <ModalShell title="Add New User" onClose={onClose}>
            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                {[
                    { label: 'Full Name', key: 'name',    type: 'text',  placeholder: 'e.g. John Doe',    required: true  },
                    { label: 'Phone',     key: 'phone',   type: 'text',  placeholder: '+1 555 000 0000',  required: true  },
                    { label: 'Email',     key: 'email',   type: 'email', placeholder: 'john@example.com', required: false },
                    { label: 'Address',   key: 'address', type: 'text',  placeholder: '123 Honey Lane',   required: false },
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
                <ModalActions onCancel={onClose} processing={processing} label="Save User" />
            </form>
        </ModalShell>
    );
}

// ── Edit User form ───────────────────────────────────────────────────────────
function EditUserModal({ beekeeper, onClose }: { beekeeper: Beekeeper; onClose: () => void }) {
    const { data, setData, patch, processing, errors } = useForm({
        name:    beekeeper.name,
        phone:   beekeeper.phone,
        email:   beekeeper.email  ?? '',
        address: beekeeper.address ?? '',
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/beekeepers/${beekeeper.id}`, { onSuccess: () => onClose() });
    };

    return (
        <ModalShell title="Edit User" onClose={onClose}>
            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                {[
                    { label: 'Full Name', key: 'name',     type: 'text',     placeholder: 'e.g. John Doe',    required: true  },
                    { label: 'Phone',     key: 'phone',    type: 'text',     placeholder: '+1 555 000 0000',  required: true  },
                    { label: 'Email',     key: 'email',    type: 'email',    placeholder: 'john@example.com', required: false },
                    { label: 'Address',   key: 'address',  type: 'text',     placeholder: '123 Honey Lane',   required: false },
                    { label: 'New Password', key: 'password', type: 'password', placeholder: 'Leave blank to keep current', required: false },
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
                <ModalActions onCancel={onClose} processing={processing} label="Update User" />
            </form>
        </ModalShell>
    );
}

// ── View User modal ──────────────────────────────────────────────────────────
function ViewUserModal({ beekeeper, onClose }: { beekeeper: Beekeeper; onClose: () => void }) {
    const role   = getRole(beekeeper);
    const status = getStatus(beekeeper);
    const sc     = statusConfig[status] ?? statusConfig.active;
    const rc     = roleColors[role]     ?? roleColors.Beekeeper;

    const rows: { label: string; value: string }[] = [
        { label: 'Full Name', value: beekeeper.name },
        { label: 'Email',     value: beekeeper.email   ?? '—' },
        { label: 'Phone',     value: beekeeper.phone },
        { label: 'Address',   value: beekeeper.address ?? '—' },
    ];

    return (
        <ModalShell title="User Details" onClose={onClose}>
            <div className="p-6 flex flex-col gap-5">
                {/* Avatar + name */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: '#0d1b2a' }}>
                        {getInitials(beekeeper.name)}
                    </div>
                    <div>
                        <p className="font-semibold text-base" style={{ color: '#0d1b2a' }}>{beekeeper.name}</p>
                        <p className="text-xs text-gray-400">{beekeeper.id}</p>
                    </div>
                </div>

                {/* Detail rows */}
                <div className="flex flex-col gap-3">
                    {rows.map((r) => (
                        <div key={r.label} className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{r.label}</span>
                            <span className="text-sm text-gray-700">{r.value}</span>
                        </div>
                    ))}

                    {/* Role */}
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">System Role</span>
                        <span className="inline-flex">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded border uppercase tracking-widest"
                                style={{ backgroundColor: rc.bg, color: rc.color, borderColor: rc.bg === '#f1f5f9' ? '#e5e7eb' : rc.bg }}>
                                {role}
                            </span>
                        </span>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sc.dot }} />
                            <span className="text-xs font-medium" style={{ color: sc.labelColor }}>{sc.label}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-1">
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                        Close
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

// ── Shared modal shell ───────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>{title}</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
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
                {processing ? 'Saving…' : label}
            </button>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Beekeepers({ beekeepers = [] }: { beekeepers?: Beekeeper[] }) {
    const [showAddModal, setShowAddModal]     = useState(false);
    const [viewTarget, setViewTarget]         = useState<Beekeeper | null>(null);
    const [editTarget, setEditTarget]         = useState<Beekeeper | null>(null);
    const [deleteTarget, setDeleteTarget]     = useState<Beekeeper | null>(null);
    const [roleFilter, setRoleFilter]         = useState('All Roles');
    const [statusFilter, setStatusFilter]     = useState('All Statuses');
    // Search is handled server-side via the header bar — beekeepers prop is already filtered

    const { delete: destroy, processing: deleting } = useForm({});

    const confirmDelete = () => {
        if (!deleteTarget) return;
        destroy(`/beekeepers/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Address'];
        const rows = beekeepers.map((bk) => [
            bk.name,
            bk.email ?? '',
            bk.phone,
            getRole(bk),
            getStatus(bk),
            bk.address ?? '',
        ]);

        const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
        const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'users.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const filtered = beekeepers.filter((bk) => {
        const role   = getRole(bk);
        const status = getStatus(bk);
        const roleOk   = roleFilter   === 'All Roles'    || role   === roleFilter;
        const statusOk = statusFilter === 'All Statuses' || status === statusFilter.toLowerCase();
        return roleOk && statusOk;
    });

    return (
        <>
            <Head title="User Management" />
            <div className="min-h-screen p-6 flex flex-col gap-6" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Page heading */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>User Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Configure access levels and monitor activity across the swarm telemetry network.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                    >
                        <UserPlus className="w-4 h-4" /> Add User
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Total Users</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-4xl font-bold" style={{ color: '#0d1b2a' }}>{beekeepers.length}</p>
                            <span className="text-xs font-semibold text-emerald-500 mb-1">↗ +3</span>
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
                    <div className="rounded-xl p-5 relative overflow-hidden" style={{ backgroundColor: '#0d1b2a' }}>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
                            <Shield className="w-20 h-20 text-white" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f5a623' }}>System Status</p>
                        <p className="text-base font-bold text-white mt-1">Telemetry Integrity Optimal</p>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">All user modifications are being logged to the secure audit trail in real-time.</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Filters */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 outline-none bg-white"
                        >
                            <option>All Roles</option>
                            <option>Administrator</option>
                            <option>Beekeeper</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 outline-none bg-white"
                        >
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Pending</option>
                            <option>Suspended</option>
                        </select>
                        <span className="ml-auto text-xs text-gray-400">
                            Showing {Math.min(10, filtered.length)} of {filtered.length} users
                        </span>
                    </div>

                    {/* Table */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">User Identity</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">System Role</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Address</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                                        {roleFilter !== 'All Roles' || statusFilter !== 'All Statuses'
                                            ? 'No users match your filters.'
                                            : 'No users found. Add your first user to get started.'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.slice(0, 10).map((bk) => {
                                    const role   = getRole(bk);
                                    const status = getStatus(bk);
                                    const sc     = statusConfig[status] ?? statusConfig.active;
                                    const rc     = roleColors[role]     ?? roleColors.Beekeeper;
                                    return (
                                        <tr key={bk.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                                        style={{ backgroundColor: '#0d1b2a' }}>
                                                        {getInitials(bk.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>{bk.name}</p>
                                                        <p className="text-xs text-gray-400">{bk.email ?? bk.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-[11px] font-bold px-2.5 py-1 rounded border uppercase tracking-widest"
                                                    style={{ backgroundColor: rc.bg, color: rc.color, borderColor: rc.bg === '#f1f5f9' ? '#e5e7eb' : rc.bg }}>
                                                    {role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sc.dot }} />
                                                    <span className="text-xs font-medium" style={{ color: sc.labelColor }}>{sc.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-400">
                                                {bk.address ?? 'Never'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setViewTarget(bk)}
                                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="View user"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditTarget(bk)}
                                                        className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                                                        title="Edit user"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(bk)}
                                                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
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
                            View Security Protocols →
                        </button>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} />}

            {/* View User Modal */}
            {viewTarget && <ViewUserModal beekeeper={viewTarget} onClose={() => setViewTarget(null)} />}

            {/* Edit User Modal */}
            {editTarget && <EditUserModal beekeeper={editTarget} onClose={() => setEditTarget(null)} />}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 flex flex-col gap-4">
                        <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Delete User</h2>
                        <p className="text-sm text-gray-500">
                            Are you sure you want to delete <span className="font-semibold text-gray-700">{deleteTarget.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                                style={{ backgroundColor: '#ef4444' }}
                            >
                                {deleting ? 'Deleting…' : 'Delete'}
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
        { title: 'User Management', href: '/beekeepers' },
    ],
};
