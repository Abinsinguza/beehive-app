import { Head, usePage } from '@inertiajs/react';
import { CheckCircle, X } from 'lucide-react';
import { useState } from 'react';
import { MlServerConfigForm } from '@/components/system-config/ml-server-config-form';
import type { MlServerSettings } from '@/components/system-config/ml-server-config-form';
import { SmsNotificationsForm } from '@/components/system-config/sms-notifications-form';
import type { SmsSettings } from '@/components/system-config/sms-notifications-form';
import { Toggle } from '@/components/system-config/toggle';

type Settings = SmsSettings & MlServerSettings;

const alertRoutes = [
    { label: 'Critical Swarm Events', enabled: true, muted: false },
    { label: 'Temperature Anomalies', enabled: true, muted: false },
    { label: 'Low Battery Warning', enabled: false, muted: true },
    { label: 'Maintenance Reminders', enabled: false, muted: false },
    { label: 'Daily Digest Reports', enabled: true, muted: false },
];

export default function SystemConfig({ settings }: { settings: Settings }) {
    const { props } = usePage<{
        flash?: { success?: string; error?: string };
    }>();
    const flash = props.flash;

    const [flashDismissed, setFlashDismissed] = useState(false);

    // ── Local-only UI state ──────────────────────────────────────────────────
    const [routes, setRoutes] = useState(alertRoutes.map((r) => ({ ...r })));

    const toggleRoute = (i: number) =>
        setRoutes((prev) =>
            prev.map((r, idx) =>
                idx === i ? { ...r, enabled: !r.enabled } : r,
            ),
        );

    const showFlash = !flashDismissed && (flash?.success || flash?.error);

    return (
        <>
            <Head title="System Settings" />

            <div
                className="flex flex-col gap-5 p-6"
                style={{ backgroundColor: '#f8f9fa' }}
            >
                {/* Flash banner */}
                {showFlash && (
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium"
                        style={{
                            backgroundColor: flash?.success
                                ? '#ecfdf5'
                                : '#fef2f2',
                            color: flash?.success ? '#065f46' : '#991b1b',
                            border: flash?.success
                                ? '1px solid #a7f3d0'
                                : '1px solid #fecaca',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span>{flash?.success ?? flash?.error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFlashDismissed(true)}
                            className="rounded p-0.5 hover:opacity-70"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Page heading */}
                <div>
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: '#0d1b2a' }}
                    >
                        System Settings
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Configure swarm detection algorithms and global
                        integration keys.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* ── Left column ─────────────────────────────────────────────────── */}
                    <div className="flex flex-col gap-5 lg:col-span-2">
                        <MlServerConfigForm settings={settings} />
                        <SmsNotificationsForm settings={settings} />
                    </div>

                    {/* ── Right column ────────────────────────────────────────────────── */}
                    <div className="flex flex-col gap-4">
                        {/* Alert Routing */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="mb-1 flex items-center gap-2">
                                <span className="text-lg">🔔</span>
                                <h2
                                    className="text-base font-semibold"
                                    style={{ color: '#0d1b2a' }}
                                >
                                    Alert Routing
                                </h2>
                            </div>
                            <div
                                className="mb-4 h-px"
                                style={{ backgroundColor: '#f5a623' }}
                            />
                            <div className="flex flex-col gap-3">
                                {routes.map((r, i) => (
                                    <div
                                        key={r.label}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <span
                                            className={`text-sm ${r.muted ? 'text-gray-400' : ''}`}
                                            style={{
                                                color: r.muted
                                                    ? undefined
                                                    : '#0d1b2a',
                                            }}
                                        >
                                            {r.label}
                                        </span>
                                        <Toggle
                                            on={r.enabled}
                                            onChange={() => toggleRoute(i)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Health */}
                        <div
                            className="flex flex-col gap-4 rounded-xl p-5"
                            style={{ backgroundColor: '#0d1b2a' }}
                        >
                            <p
                                className="text-[10px] font-bold tracking-widest uppercase"
                                style={{ color: '#f5a623' }}
                            >
                                System Health
                            </p>
                            <div className="flex flex-col gap-3">
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-xs">
                                        <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                            Database Latency
                                        </span>
                                        <span className="font-bold text-white">
                                            12ms
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-700">
                                        <div
                                            className="h-1.5 rounded-full"
                                            style={{
                                                width: '15%',
                                                backgroundColor: '#f5a623',
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-xs">
                                        <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                                            Buffer Capacity
                                        </span>
                                        <span className="font-bold text-white">
                                            84%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-700">
                                        <div
                                            className="h-1.5 rounded-full"
                                            style={{
                                                width: '84%',
                                                backgroundColor: '#f5a623',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <span
                                className="self-start rounded px-2 py-1 text-[10px] font-bold tracking-widest uppercase"
                                style={{
                                    backgroundColor: '#f5a623',
                                    color: '#0d1b2a',
                                }}
                            >
                                Operational
                            </span>
                        </div>

                        <button
                            type="button"
                            className="w-full rounded-xl border border-gray-300 py-3 text-sm font-bold text-gray-400 transition-colors hover:bg-gray-50"
                        >
                            Export Configuration
                        </button>

                        <p className="text-center text-[10px] tracking-widest text-gray-400 uppercase">
                            System Version: 2.4.0-Stable
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

SystemConfig.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'System Settings', href: '/system-config' },
    ],
};
