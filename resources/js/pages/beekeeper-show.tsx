import { Head, router } from '@inertiajs/react';
import { Calendar, ChevronLeft, Hexagon, Mail, MapPin, Phone } from 'lucide-react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';

type Hive = {
    id: string;
    hive_name: string;
    hive_location: string;
    hive_type: string;
    current_state: string;
};

type Beekeeper = {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    address: string | null;
    status: string;
    beehives_count: number;
    beehives: Hive[];
    created_at: string | null;
};

const statusConfig: Record<string, { dot: string; label: string; labelColor: string }> = {
    active:    { dot: '#22c55e', label: 'Active',    labelColor: '#16a34a' },
    pending:   { dot: '#f59e0b', label: 'Pending',   labelColor: '#d97706' },
    revoked:   { dot: '#94a3b8', label: 'Revoked',   labelColor: '#94a3b8' },
};

const hiveStateColors: Record<string, string> = {
    active:   '#16a34a',
    inactive: '#94a3b8',
    migrated: '#2563eb',
    lost:     '#dc2626',
    unknown:  '#64748b',
};

function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function BeekeeperShow({ beekeeper }: { beekeeper: Beekeeper }) {
    const sc = statusConfig[beekeeper.status] ?? statusConfig.active;

    return (
        <>
            <Head title={`${beekeeper.name} — Beekeeper Profile`} />
            <div className="min-h-screen p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Back */}
                <button
                    onClick={() => router.visit('/beekeepers')}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 w-fit"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Beekeepers
                </button>

                {/* ── Header card ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                            style={{ backgroundColor: '#0d1b2a' }}
                        >
                            {getInitials(beekeeper.name)}
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold" style={{ color: '#0d1b2a' }}>{beekeeper.name}</h1>
                                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#f1f5f9' }}>
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sc.dot }} />
                                    <span style={{ color: sc.labelColor }}>{sc.label}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 mt-0.5">
                                {beekeeper.email && (
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5" /> {beekeeper.email}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" /> {beekeeper.phone}
                                </span>
                                {beekeeper.address && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" /> {beekeeper.address}
                                    </span>
                                )}
                                {beekeeper.created_at && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Joined {new Date(beekeeper.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => router.visit(`/beekeepers/${beekeeper.id}/edit`)}
                        className="shrink-0 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Edit
                    </button>
                </div>

                {/* ── Stat cards ──────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Hives Owned</p>
                        <p className="text-3xl font-bold mt-2" style={{ color: '#0d1b2a' }}>{beekeeper.beehives_count}</p>
                    </div>
                </div>

                {/* ── Hives list ──────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                        <Hexagon className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Hives</span>
                    </div>
                    {beekeeper.beehives.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-sm text-gray-400">No hives registered yet</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {beekeeper.beehives.map((hive) => (
                                <div key={hive.id}
                                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => router.visit(`/beehives/${hive.id}`)}>
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#fff7ed' }}>
                                        <Hexagon className="w-5 h-5" style={{ color: '#c2410c' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate leading-tight" style={{ color: '#0d1b2a' }}>
                                            {hive.hive_name}{hive.hive_type ? ` — ${hive.hive_type}` : ''}
                                        </p>
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{hive.hive_location}</p>
                                    </div>
                                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                                        style={{ backgroundColor: '#f1f5f9', color: hiveStateColors[hive.current_state] ?? '#64748b' }}>
                                        {hive.current_state}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </>
    );
}

BeekeeperShow.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard',  href: '/dashboard' },
        { title: 'Beekeepers',       href: '/beekeepers' },
        { title: 'Beekeeper Profile', href: '#' },
    ]}>
        {page}
    </AppLayout>
);
