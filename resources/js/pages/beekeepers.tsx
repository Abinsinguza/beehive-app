import { Head, useForm } from '@inertiajs/react';
import { Download, Edit2, Shield, Trash2, UserPlus, X, Zap } from 'lucide-react';
import { useState } from 'react';

type Beekeeper = {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
};

const roleColors: Record<string, { bg: string; color: string }> = {
    Administrator:    { bg: '#0d1b2a', color: '#ffffff' },
    Beekeeper:        { bg: '#f1f5f9', color: '#374151' },
    'Research Analyst': { bg: '#f1f5f9', color: '#374151' },
};

const statusConfig: Record<string, { dot: string; label: string; labelColor: string }> = {
    active:   { dot: '#22c55e', label: 'Active',           labelColor: '#16a34a' },
    pending:  { dot: '#f59e0b', label: 'Pending Approval', labelColor: '#d97706' },
    suspended:{ dot: '#94a3b8', label: 'Suspended',        labelColor: '#94a3b8' },
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
    if (bk.email?.includes('science') || bk.email?.includes('research')) return 'Research Analyst';
    return 'Beekeeper';
}

function getStatus(bk: Beekeeper): string {
    if (!bk.email) return 'pending';
    if (bk.address?.toLowerCase().includes('suspend')) return 'suspended';
    return 'active';
}

export default function Beekeepers({ beekeepers = [] }: { beekeepers?: Beekeeper[] }) {
    const [showModal, setShowModal] = useState(false);
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [statusFilter, setStatusFilter] = useState('All Statuses');

    const { data, setData, post, processing, reset, errors } = useForm({
        name: '', phone: '', email: '', address: '', password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/beekeepers', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    const filtered = beekeepers.filter((bk) => {
        const role = getRole(bk);
        const status = getStatus(bk);
        const roleOk = roleFilter === 'All Roles' || role === roleFilter;
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
                        onClick={() => setShowModal(true)}
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
                            <option>Research Analyst</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 outline-none bg-white flex items-center gap-1"
                        >
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Pending</option>
                            <option>Suspended</option>
                        </select>
                        <span className="ml-auto text-xs text-gray-400">
                            Showing 1–{Math.min(10, filtered.length)} of {beekeepers.length} users
                        </span>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400">‹</button>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400">›</button>
                    </div>

                    {/* Table header */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">User Identity</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">System Role</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Activity</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                                        No users found. Add your first user to get started.
                                    </td>
                                </tr>
                            ) : (
                                filtered.slice(0, 10).map((bk) => {
                                    const role = getRole(bk);
                                    const status = getStatus(bk);
                                    const sc = statusConfig[status] ?? statusConfig.active;
                                    const rc = roleColors[role] ?? roleColors.Beekeeper;
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
                                                    <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
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
                        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
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
                            Administrators have full read/write access to hive sensors and swarm data. Beekeepers are limited to their assigned apiaries. Research roles have read-only access to historical acoustic datasets.
                        </p>
                        <button className="flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: '#0d1b2a' }}>
                            View Security Protocols →
                        </button>
                    </div>
                </div>
            </div>

            {/* Add User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Add New User</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'e.g. John Doe', required: true },
                                { label: 'Phone', key: 'phone', type: 'text', placeholder: '+1 555 000 0000', required: true },
                                { label: 'Email', key: 'email', type: 'email', placeholder: 'john@example.com', required: false },
                                { label: 'Address', key: 'address', type: 'text', placeholder: '123 Honey Lane', required: false },
                                { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••', required: true },
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
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                    {processing ? 'Saving…' : 'Save User'}
                                </button>
                            </div>
                        </form>
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
