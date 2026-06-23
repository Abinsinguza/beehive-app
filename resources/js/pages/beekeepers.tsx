import { Head, router, useForm } from '@inertiajs/react';
import { Download, Edit2, Eye, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { type MRT_ColumnDef } from 'material-react-table';
import { MenuItem } from '@mui/material';
import { DataTable } from '@/components/data-table';
import { cleanDataArray, formatDisplayText } from '@/lib/utils';
import { toTitleCase } from '@/lib/format-text';

type Beekeeper = {
    user_id: string;
    full_name: string;
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


function getInitials(full_name: string) {
    return full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
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

// ── Add Beekeeper form ─────────────────────────────────────────────────────
function AddBeekeeperModal({ onClose }: { onClose: () => void }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        full_name: '', email: '', phone: '', password: '', address: '', server_url: '', api_key: '',
    });
    const [generating, setGenerating] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/beekeepers', { onSuccess: () => { reset(); onClose(); } });
    };

    const generateApiKey = () => {
        if (!data.full_name.trim()) return;
        setGenerating(true);
        router.post('/api-keys/generate', { client_name: data.full_name }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const key = (page.props.flash as { generated_api_key?: string } | undefined)?.generated_api_key;
                if (key) setData('api_key', key);
            },
            onFinish: () => setGenerating(false),
        });
    };

    const fields: { label: string; key: keyof typeof data; type: string; placeholder: string; required: boolean; hint?: string }[] = [
        { label: 'Full Name',     key: 'full_name',  type: 'text',     placeholder: 'e.g. Jane Namutebi',   required: true  },
        { label: 'Email Address', key: 'email',      type: 'email',    placeholder: 'jane@example.com',      required: true  },
        { label: 'Phone Number',  key: 'phone',      type: 'text',     placeholder: '+256 700 000 000',      required: true  },
        { label: 'Password',      key: 'password',   type: 'password', placeholder: 'Min. 4 characters',    required: true  },
        { label: 'Address',       key: 'address',    type: 'text',     placeholder: 'e.g. Kampala, Uganda', required: false, hint: 'Optional' },
        { label: 'Server URL',    key: 'server_url', type: 'text',     placeholder: 'http://192.168.1.10:8085', required: true },
    ];

    return (
        <ModalShell title="Add New Beekeeper" onClose={onClose}>
            <form onSubmit={submit} className="px-6 pb-6 pt-2 flex flex-col gap-5">
                {/* Header note */}
                <p className="text-sm text-gray-500 border-l-4 pl-3" style={{ borderColor: '#f5a623' }}>
                    Fields marked <span className="text-red-500 font-bold">*</span> are required.
                </p>
                {fields.map((f) => (
                    <div key={f.key} className="flex flex-col gap-1.5">
                        {/* Label */}
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                            {f.label}
                            {f.required
                                ? <span className="text-red-500 font-bold">*</span>
                                : f.hint
                                    ? <span className="text-xs font-normal text-gray-400">({f.hint})</span>
                                    : <span className="text-xs font-normal text-gray-400">(optional)</span>
                            }
                        </label>

                        {/* Input */}
                        <input
                            type={f.type}
                            value={data[f.key]}
                            onChange={(e) => setData(f.key, e.target.value)}
                            placeholder={f.placeholder}
                            required={f.required}
                            className={[
                                'w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400',
                                'border outline-none transition-colors',
                                errors[f.key]
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-gray-300 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
                            ].join(' ')}
                        />

                        {/* Error */}
                        {errors[f.key] && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <span>⚠</span> {errors[f.key]}
                            </p>
                        )}
                    </div>
                ))}

                {/* API Key — generated, not typed */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        API Key
                        <span className="text-red-500 font-bold">*</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={data.api_key}
                            readOnly
                            placeholder="Click Generate to mint a key"
                            required
                            className={[
                                'flex-1 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-gray-50',
                                'border outline-none',
                                errors.api_key ? 'border-red-400' : 'border-gray-300',
                            ].join(' ')}
                        />
                        <button
                            type="button"
                            onClick={generateApiKey}
                            disabled={generating || !data.full_name.trim()}
                            className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {generating ? 'Generating…' : 'Generate'}
                        </button>
                    </div>
                    {!data.full_name.trim() && (
                        <p className="text-xs text-gray-400">Enter the full name first — it's used to label the key.</p>
                    )}
                    {errors.api_key && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <span>⚠</span> {errors.api_key}
                        </p>
                    )}
                </div>

                <ModalActions onCancel={onClose} processing={processing} label="Add Beekeeper" />
            </form>
        </ModalShell>
    );
}

// ── Edit Beekeeper form ───────────────────────────────────────────────────
function EditBeekeeperModal({ beekeeper, onClose }: { beekeeper: Beekeeper; onClose: () => void }) {
    const { data, setData, patch, processing, errors } = useForm({
        full_name: beekeeper.full_name,
        phone:     beekeeper.phone,
        email:     beekeeper.email   ?? '',
        address:   beekeeper.address ?? '',
        password:  '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/beekeepers/${beekeeper.user_id}`, { onSuccess: () => onClose() });
    };

    return (
        <ModalShell title="Edit Beekeeper" onClose={onClose}>
            <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                {[
                    { label: 'Full Name',     key: 'full_name', type: 'text',     placeholder: 'e.g. John Doe',              required: true  },
                    { label: 'Phone',         key: 'phone',     type: 'text',     placeholder: '+1 555 000 000',             required: true  },
                    { label: 'Email',         key: 'email',     type: 'email',    placeholder: 'john@example.com',           required: false },
                    { label: 'Address',       key: 'address',   type: 'text',     placeholder: '123 Honey Lane',             required: false },
                    { label: 'New Password',  key: 'password',  type: 'password', placeholder: 'Leave blank to keep current', required: false },
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

// ── Shared modal shell ───────────────────────────────────────────────────
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
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
                Cancel
            </button>
            <button type="submit" disabled={processing}
                className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
            >
                {processing ? 'Saving…' : label}
            </button>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Beekeepers({
    beekeepers = [],
}: {
    beekeepers?: Beekeeper[];
}) {
    // Clean the data immediately when props are received!
    const cleanedBeekeepers = useMemo(() => {
        return cleanDataArray(beekeepers, [
            'full_name',
            'address'
        ]);
    }, [beekeepers]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editTarget, setEditTarget]     = useState<Beekeeper | null>(null);
    const [revokeTarget, setRevokeTarget]     = useState<Beekeeper | null>(null);
    const [restoreTarget, setRestoreTarget]   = useState<Beekeeper | null>(null);

    // Revoke logic
    const { patch: revokePatch, processing: revoking } = useForm({});
    const confirmRevoke = () => {
        if (!revokeTarget) return;
        revokePatch('/beekeepers/' + revokeTarget.user_id + '/revoke', {
            onSuccess: () => setRevokeTarget(null),
        });
    };

    // Restore logic
    const { patch: restorePatch, processing: restoring } = useForm({});
    const confirmRestore = () => {
        if (!restoreTarget) return;
        restorePatch('/beekeepers/' + restoreTarget.user_id + '/restore', {
            onSuccess: () => setRestoreTarget(null),
        });
    };

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Hives', 'Address', 'Sign Up Date'];
        const rows = cleanedBeekeepers.map((bk) => [
            bk.full_name,
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

    const columns = useMemo<MRT_ColumnDef<Beekeeper>[]>(() => [
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
            accessorKey: 'full_name',
            header: 'Name',
            enableSorting: true,
            enableColumnFilter: true,
            size: 180,
            Cell: ({ row }) => {
                const bk = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: '#0d1b2a' }}
                        >
                            {getInitials(bk.full_name)}
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>{toTitleCase(bk.full_name)}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorFn: (row) => getStatus(row),
            id: 'status',
            header: 'Status',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['active', 'pending', 'revoked', 'suspended'],
            size: 110,
            Cell: ({ row }) => {
                const status = getStatus(row.original);
                const sc = statusConfig[status] ?? statusConfig.active;
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sc.dot }} />
                        <span className="text-xs font-medium" style={{ color: sc.labelColor }}>{sc.label}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'beehives_count',
            header: 'Hives',
            enableSorting: true,
            enableColumnFilter: false,
            size: 70,
            Cell: ({ cell }) => {
                const count = cell.getValue<number>() ?? 0;
                return (
                    <span
                        className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded text-xs font-bold"
                        style={{ backgroundColor: '#fef3c7', color: '#92400e' }}
                    >
                        {count}
                    </span>
                );
            },
        },
    ], []);

    const renderDetailPanel = ({ row }: { row: any }) => {
        const bk = row.original as Beekeeper;
        return (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Email</p>
                        <p className="text-sm text-gray-700">{bk.email ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Phone</p>
                        <p className="text-sm text-gray-700">{bk.phone ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Address</p>
                        <p className="text-sm text-gray-700">{bk.address ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Sign Up Date</p>
                        <p className="text-sm text-gray-700">
                            {bk.created_at ? new Date(bk.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Last Login</p>
                        <p className="text-sm text-gray-400 italic">Never</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Role</p>
                        <p className="text-sm text-gray-700">{getRole(bk)}</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="Beekeeper Management" />
            <div className="p-6 flex flex-col gap-6" style={{ backgroundColor: '#f8f9fa' }}>
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
                            <p className="text-4xl font-bold" style={{ color: '#0d1b2a' }}>{cleanedBeekeepers.length}</p>
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
                                {cleanedBeekeepers.filter((bk) => getStatus(bk) === 'active').length}
                            </p>
                        </div>
                        <div className="mt-3 h-1 w-16 rounded-full bg-emerald-100" />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Inactive / Revoked</p>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-4xl font-bold text-gray-400">
                                {cleanedBeekeepers.filter((bk) => getStatus(bk) !== 'active').length}
                            </p>
                        </div>
                        <div className="mt-3 h-1 w-16 rounded-full bg-gray-200" />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                            <Download className="w-3.5 h-3.5" /> Export CSV
                        </button>
                    </div>
                    <DataTable
                        columns={columns}
                        data={cleanedBeekeepers}
                        getRowId={(row) => row.user_id}
                        enableRowActions={true}
                        renderDetailPanel={renderDetailPanel}
                        renderRowActionMenuItems={({ closeMenu, row }) => [
                            <MenuItem
                                key="view"
                                onClick={() => {
                                    closeMenu();
                                    router.visit(`/beekeepers/${row.original.user_id}`);
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
                                <Edit2 className="mr-2" />
                                Edit
                            </MenuItem>,
                            getStatus(row.original) === 'revoked' ? (
                                <MenuItem
                                    key="restore"
                                    onClick={() => {
                                        setRestoreTarget(row.original);
                                        closeMenu();
                                    }}
                                >
                                    Restore
                                </MenuItem>
                            ) : (
                                <MenuItem
                                    key="revoke"
                                    onClick={() => {
                                        setRevokeTarget(row.original);
                                        closeMenu();
                                    }}
                                    sx={{ color: '#f97316' }}
                                >
                                    Revoke
                                </MenuItem>
                            ),
                        ]}
                    />
                </div>
            </div>

            {/* Modals */}
            {showAddModal && <AddBeekeeperModal onClose={() => setShowAddModal(false)} />}
            {editTarget   && <EditBeekeeperModal beekeeper={editTarget}  onClose={() => setEditTarget(null)}   />}

            {/* Revoke confirmation modal */}
            {revokeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 flex flex-col gap-4">
                        <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Revoke Access</h2>
                        <p className="text-sm text-gray-500">
                            Revoke access for{' '}
                            <span className="font-semibold text-gray-700">{revokeTarget.full_name}</span>?
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
                                {revoking ? 'Revoking…' : 'Revoke Access'}
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
                            <span className="font-semibold text-gray-700">{restoreTarget.full_name}</span>?
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
                                {restoring ? 'Restoring…' : 'Restore Access'}
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
