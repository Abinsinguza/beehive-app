import { Head, useForm, usePage } from '@inertiajs/react';
import { AlertOctagon, CheckCircle, CheckCircle2, Eye, EyeOff, Key, MessageSquare, Server, Smartphone, X } from 'lucide-react';
import { useRef, useState } from 'react';

type Settings = {
    sms_server_url: string;
    sms_username: string;
    sms_api_key: string;
    sms_sender_id: string;
    sms_template: string;
};

const WILDCARDS = [
    { tag: '#beeHive', desc: 'Hive ID' },
    { tag: '#beekeeper', desc: 'Beekeeper name' },
    { tag: '#alertMessage', desc: 'Advisory message' },
    { tag: '#hiveLocation', desc: 'Hive location' },
    { tag: '#alertType', desc: 'Alert severity' },
    { tag: '#prediction', desc: 'ML prediction' },
    { tag: '#timestamp', desc: 'Date & time' },
    { tag: '#confidence', desc: 'Confidence score' },
];

const PREVIEW_MAP: Record<string, string> = {
    '#beeHive': 'BH0042',
    '#beekeeper': 'John Ssekandi',
    '#alertMessage': 'Inspect hive immediately — colony collapse risk detected.',
    '#hiveLocation': 'North Field, Sector B',
    '#alertType': 'Critical',
    '#prediction': 'Swarm',
    '#timestamp': '2026-04-23 14:32',
    '#confidence': '96.2%',
};

const alertRoutes = [
    { label: 'Critical Swarm Events', enabled: true, muted: false },
    { label: 'Temperature Anomalies', enabled: true, muted: false },
    { label: 'Low Battery Warning', enabled: false, muted: true },
    { label: 'Maintenance Reminders', enabled: false, muted: false },
    { label: 'Daily Digest Reports', enabled: true, muted: false },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className="relative inline-flex w-10 h-5 rounded-full transition-colors shrink-0"
            style={{ backgroundColor: on ? '#f5a623' : '#d1d5db' }}
        >
            <span
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }}
            />
        </button>
    );
}

export default function SystemConfig({ settings }: { settings: Settings }) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    // ── SMS form (persisted to DB) ───────────────────────────────────────────
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { data, setData, post, processing, errors } = useForm({
        sms_server_url: settings?.sms_server_url ?? '',
        sms_username: settings?.sms_username ?? '',
        sms_api_key: settings?.sms_api_key ?? '',
        sms_sender_id: settings?.sms_sender_id ?? '',
        sms_template: settings?.sms_template ?? '',
    });

    const [showApiKey, setShowApiKey] = useState(false);
    const [flashDismissed, setFlashDismissed] = useState(false);

    const insertWildcard = (tag: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart ?? data.sms_template.length;
        const end = el.selectionEnd ?? data.sms_template.length;
        const next = data.sms_template.slice(0, start) + tag + data.sms_template.slice(end);
        setData('sms_template', next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + tag.length, start + tag.length);
        });
    };

    const previewText = Object.entries(PREVIEW_MAP).reduce(
        (txt, [key, val]) => txt.replaceAll(key, val),
        data.sms_template,
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setFlashDismissed(false);
        post('/system-config', {
            onSuccess: () => {
                fireToast('Settings saved successfully');
            }
        });
    };

    // ── Local-only UI state ──────────────────────────────────────────────────
    const [routes, setRoutes] = useState(alertRoutes.map((r) => ({ ...r })));
    const [toast, setToast] = useState<string | null>(null);
    const [showResetModal, setShowResetModal] = useState(false);

    const toggleRoute = (i: number) =>
        setRoutes((prev) => prev.map((r, idx) => idx === i ? { ...r, enabled: !r.enabled } : r));

    const fireToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const handleExportConfig = () => {
        const config = {
            "System version": "2.4.0-Stable",
            "Alert routing settings": routes.map((r) => ({ route: r.label, enabled: r.enabled })),
            "Database latency": "12ms",
            "Buffer capacity": "84%"
        };
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'BSADS_Config.json';
        a.click();
        URL.revokeObjectURL(url);
        fireToast('Configuration exported successfully');
    };

    const handleConfirmReset = () => {
        setShowResetModal(false);
        setRoutes(alertRoutes.map((r) => ({ ...r })));
        fireToast('System configuration reset successfully');
    };

    const showFlash = !flashDismissed && (flash?.success || flash?.error);

    return (
        <>
            <Head title="System Settings" />

            {/* ── Toast ── */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-semibold" style={{ backgroundColor: '#0d1b2a' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {toast}
                </div>
            )}

            {/* ── Reset Confirmation Modal ── */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Reset System Configuration?</h2>
                            <button type="button" onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <p className="text-sm text-gray-600">This will revert all settings to default values. This cannot be undone.</p>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={handleConfirmReset}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors">
                                    Confirm Reset
                                </button>
                                <button type="button" onClick={() => setShowResetModal(false)}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="min-h-screen p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Flash banner */}
                {showFlash && (
                    <div
                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                        style={{
                            backgroundColor: flash?.success ? '#ecfdf5' : '#fef2f2',
                            color: flash?.success ? '#065f46' : '#991b1b',
                            border: flash?.success ? '1px solid #a7f3d0' : '1px solid #fecaca',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>{flash?.success ?? flash?.error}</span>
                        </div>
                        <button type="button" onClick={() => setFlashDismissed(true)} className="p-0.5 rounded hover:opacity-70">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Page heading */}
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>System Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure alert routing and system preferences.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Left column ─────────────────────────────────────────────────── */}
                    <div className="lg:col-span-2 flex flex-col gap-5">

                        {/* Danger Zone */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertOctagon className="w-5 h-5 text-red-500" />
                                <h2 className="font-semibold text-base text-red-500">Danger Zone</h2>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Reset System Configuration</p>
                                    <p className="text-xs text-gray-400 mt-0.5">This will revert all system settings to default values. This action cannot be undone.</p>
                                </div>
                                <button type="button" onClick={() => setShowResetModal(true)} className="shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors">
                                    Reset System Configuration
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Right column ────────────────────────────────────────────────── */}
                    <div className="flex flex-col gap-4">

                        {/* Alert Routing */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">🔔</span>
                                <h2 className="font-semibold text-base" style={{ color: '#0d1b2a' }}>Alert Routing</h2>
                            </div>
                            <div className="h-px mb-4" style={{ backgroundColor: '#f5a623' }} />
                            <div className="flex flex-col gap-3">
                                {routes.map((r, i) => (
                                    <div key={r.label} className="flex items-center justify-between gap-2">
                                        <span className={`text-sm ${r.muted ? 'text-gray-400' : 'text-gray-700'}`}>{r.label}</span>
                                        <Toggle on={r.enabled} onChange={() => toggleRoute(i)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Health */}
                        <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: '#0d1b2a' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f5a623' }}>System Health</p>
                            <div className="flex flex-col gap-3">
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-slate-400 uppercase tracking-widest text-[10px] font-semibold">Database Latency</span>
                                        <span className="text-white font-bold">12ms</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-700">
                                        <div className="h-1.5 rounded-full" style={{ width: '15%', backgroundColor: '#f5a623' }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-slate-400 uppercase tracking-widest text-[10px] font-semibold">Buffer Capacity</span>
                                        <span className="text-white font-bold">84%</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-700">
                                        <div className="h-1.5 rounded-full" style={{ width: '84%', backgroundColor: '#f5a623' }} />
                                    </div>
                                </div>
                            </div>
                            <span className="self-start text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest" style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                Operational
                            </span>
                        </div>

                        {/* Save Changes — submits SMS settings */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>

                        <button
                            type="button"
                            onClick={handleExportConfig}
                            className="w-full py-3 rounded-xl text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Export Configuration
                        </button>

                        <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest">
                            System Version: 2.4.0-Stable
                        </p>
                    </div>
                </div>
            </form>
        </>
    );
}

SystemConfig.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'System Settings', href: '/system-config' },
    ],
};
