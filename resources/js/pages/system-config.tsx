import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Brain, Key, AlertOctagon } from 'lucide-react';

const alertRoutes = [
    { label: 'Critical Swarm Events',  enabled: true,  orange: true },
    { label: 'Temperature Anomalies',  enabled: true,  orange: true },
    { label: 'Low Battery Warning',    enabled: false, orange: false, muted: true },
    { label: 'Maintenance Reminders',  enabled: false, orange: false },
    { label: 'Daily Digest Reports',   enabled: true,  orange: true },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
    return (
        <button
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

export default function SystemConfig() {
    const [sensitivity, setSensitivity] = useState(75);
    const [inferenceEngine, setInferenceEngine] = useState('NeuralCore-V4 (Stable)');
    const [pollingRate, setPollingRate] = useState('Real-time (50ms)');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [twoFactor, setTwoFactor] = useState(true);
    const [routes, setRoutes] = useState(alertRoutes.map((r) => ({ ...r })));

    const toggleRoute = (i: number) => {
        setRoutes((prev) => prev.map((r, idx) => idx === i ? { ...r, enabled: !r.enabled } : r));
    };

    return (
        <>
            <Head title="System Settings" />
            <div className="min-h-screen p-6" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Page heading */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>System Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure swarm detection algorithms and global integration keys.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Left: main panels */}
                    <div className="lg:col-span-2 flex flex-col gap-5">

                        {/* AI Model Controls */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Brain className="w-5 h-5 text-gray-500" />
                                <h2 className="font-semibold text-base" style={{ color: '#0d1b2a' }}>AI Model Controls</h2>
                            </div>
                            <div className="h-px mb-5" style={{ backgroundColor: '#f5a623' }} />

                            {/* Acoustic Sensitivity */}
                            <div className="mb-5">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-2">
                                    Acoustic Sensitivity
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="range" min={0} max={100} value={sensitivity}
                                            onChange={(e) => setSensitivity(Number(e.target.value))}
                                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, #f5a623 ${sensitivity}%, #e5e7eb ${sensitivity}%)`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold w-10 text-right" style={{ color: '#0d1b2a' }}>{sensitivity}%</span>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1 italic">
                                    Adjusts threshold for 'piping' and 'quacking' sound detection in queen cells.
                                </p>
                            </div>

                            {/* Inference Engine + Polling Rate */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">
                                        Inference Engine
                                    </label>
                                    <select
                                        value={inferenceEngine}
                                        onChange={(e) => setInferenceEngine(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white"
                                    >
                                        <option>NeuralCore-V4 (Stable)</option>
                                        <option>NeuralCore-V5 (Beta)</option>
                                        <option>LightBee-V2 (Fast)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">
                                        Polling Rate
                                    </label>
                                    <select
                                        value={pollingRate}
                                        onChange={(e) => setPollingRate(e.target.value)}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white"
                                    >
                                        <option>Real-time (50ms)</option>
                                        <option>Fast (100ms)</option>
                                        <option>Standard (500ms)</option>
                                        <option>Low Power (1s)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* API & Security */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Key className="w-5 h-5 text-gray-500" />
                                <h2 className="font-semibold text-base" style={{ color: '#0d1b2a' }}>API &amp; Security</h2>
                            </div>
                            <div className="h-px mb-5" style={{ backgroundColor: '#f5a623' }} />

                            {/* Master API Key */}
                            <div className="mb-4">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">
                                    Master API Key
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="password"
                                        readOnly
                                        value="your-master-api-key-here"
                                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 outline-none bg-white"
                                    />
                                    <button className="px-4 py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0d1b2a' }}>
                                        Copy
                                    </button>
                                    <button className="px-4 py-2.5 rounded-lg text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                                        Rotate
                                    </button>
                                </div>
                            </div>

                            {/* Webhook Endpoint */}
                            <div className="mb-4">
                                <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">
                                    Webhook Endpoint
                                </label>
                                <input
                                    type="url"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder="https://your-server.com/api/hive-events"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 outline-none bg-white placeholder-gray-300"
                                />
                            </div>

                            {/* Two-Factor Authentication */}
                            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Two-Factor Authentication</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Protect administrative access to swarm data.</p>
                                </div>
                                <Toggle on={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertOctagon className="w-5 h-5 text-red-500" />
                                <h2 className="font-semibold text-base text-red-500">Danger Zone</h2>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Reset Cluster Configuration</p>
                                    <p className="text-xs text-gray-400 mt-0.5">This will revert all monitoring sensors to factory defaults.</p>
                                </div>
                                <button className="shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors">
                                    Reset All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Alert Routing + System Health + Actions */}
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

                        {/* Save + Export */}
                        <button
                            className="w-full py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            Save Changes
                        </button>
                        <button className="w-full py-3 rounded-xl text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                            Export Configuration
                        </button>
                        <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest">
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
