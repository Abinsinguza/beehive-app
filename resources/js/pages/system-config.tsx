import { Head } from '@inertiajs/react';
import { Eye, EyeOff, Link2, Mail, RefreshCw, Server, Smartphone, Wifi } from 'lucide-react';
import { useRef, useState } from 'react';

const WILDCARDS = [
    { tag: '#beeHive',      desc: 'Hive ID' },
    { tag: '#beekeeper',    desc: 'Beekeeper name' },
    { tag: '#alertMessage', desc: 'Advisory message' },
    { tag: '#hiveLocation', desc: 'Hive location' },
    { tag: '#alertType',    desc: 'Alert severity' },
    { tag: '#prediction',   desc: 'ML prediction' },
    { tag: '#timestamp',    desc: 'Date & time' },
    { tag: '#confidence',   desc: 'Confidence score' },
];

const PREVIEW_MAP: Record<string, string> = {
    '#beeHive':      'BH0042',
    '#beekeeper':    'John Ssekandi',
    '#alertMessage': 'Inspect hive immediately — colony collapse risk detected.',
    '#hiveLocation': 'North Field, Sector B',
    '#alertType':    'Critical',
    '#prediction':   'Swarm',
    '#timestamp':    '2026-04-23 14:32',
    '#confidence':   '96.2%',
};

export default function SystemConfig() {
    const [showApiKey, setShowApiKey]   = useState(false);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [smsAlerts, setSmsAlerts]     = useState(true);
    const [pushAlerts, setPushAlerts]   = useState(false);
    const [smsTemplate, setSmsTemplate] = useState(
        '🐝 BEEHIVE ALERT [#alertType]\nHive: #beeHive @ #hiveLocation\nBeekeeper: #beekeeper\nPrediction: #prediction (#confidence)\nMessage: #alertMessage\nTime: #timestamp'
    );
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertWildcard = (tag: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart ?? smsTemplate.length;
        const end   = el.selectionEnd   ?? smsTemplate.length;
        const next  = smsTemplate.slice(0, start) + tag + smsTemplate.slice(end);
        setSmsTemplate(next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + tag.length, start + tag.length);
        });
    };

    const previewText = Object.entries(PREVIEW_MAP).reduce(
        (txt, [key, val]) => txt.replaceAll(key, val),
        smsTemplate
    );

    return (
        <>
            <Head title="System Preferences" />

            <div className="flex flex-col min-h-full">
                <div className="flex flex-col gap-6 p-6 flex-1">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Preferences</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Configure acoustic detection thresholds, notification channels, and global API parameters.
                        </p>
                    </div>

                    {/* 2-column grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* ── AI Model Controls ── */}
                        <div className="rounded-xl border border-border bg-card shadow-sm p-6 flex flex-col gap-5">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <span className="text-lg">🎯</span> AI Model Controls
                            </h2>

                            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Current Engine</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Last updated: Oct 24, 2023</p>
                                </div>
                                <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white tracking-wide">
                                    PROD-V4.2
                                </span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-foreground">Model Accuracy</span>
                                    <span className="text-sm font-semibold text-foreground">98.4%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-emerald-700" style={{ width: '98.4%' }} />
                                </div>
                            </div>

                            <button className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                                <RefreshCw className="h-4 w-4" />
                                Retrain Model
                            </button>
                        </div>

                        {/* ── SMS Template Configuration ── */}
                        <div className="rounded-xl border border-border bg-card shadow-sm p-6 flex flex-col gap-5">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                                    <span className="text-lg">💬</span> SMS Template Configuration
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Click a wildcard to insert it at the cursor, then craft your message.
                                </p>
                            </div>

                            {/* Wildcard chips */}
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Wildcards</p>
                                <div className="flex flex-wrap gap-2">
                                    {WILDCARDS.map(({ tag, desc }) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            title={desc}
                                            onClick={() => insertWildcard(tag)}
                                            className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-mono font-medium text-emerald-800 hover:bg-emerald-100 transition-colors dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Template textarea */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Message Template
                                </label>
                                <textarea
                                    ref={textareaRef}
                                    value={smsTemplate}
                                    onChange={(e) => setSmsTemplate(e.target.value)}
                                    rows={6}
                                    placeholder="Type your SMS template here and click wildcards above to insert them…"
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                />
                                <p className="text-right text-xs text-muted-foreground">{smsTemplate.length} chars</p>
                            </div>

                            {/* Live preview */}
                            <div className="flex flex-col gap-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview (sample data)</p>
                                <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                                    {previewText || <span className="text-muted-foreground italic">Your preview will appear here…</span>}
                                </div>
                            </div>
                        </div>

                        {/* ── Alert Channels ── */}
                        <div className="rounded-xl border border-border bg-card shadow-sm p-6 flex flex-col gap-5">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <span className="text-lg">🔔</span> Alert Channels
                            </h2>

                            {[
                                {
                                    icon: <Mail className="h-5 w-5 text-muted-foreground" />,
                                    label: 'Email Reports',
                                    sub: 'Daily digest & critical alerts',
                                    value: emailAlerts,
                                    set: setEmailAlerts,
                                },
                                {
                                    icon: <Smartphone className="h-5 w-5 text-muted-foreground" />,
                                    label: 'SMS Alerts',
                                    sub: 'Immediate swarm warnings',
                                    value: smsAlerts,
                                    set: setSmsAlerts,
                                },
                                {
                                    icon: <Server className="h-5 w-5 text-muted-foreground" />,
                                    label: 'Push Notifications',
                                    sub: 'App-level notifications',
                                    value: pushAlerts,
                                    set: setPushAlerts,
                                },
                            ].map(({ icon, label, sub, value, set }) => (
                                <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                            {icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{label}</p>
                                            <p className="text-xs text-muted-foreground">{sub}</p>
                                        </div>
                                    </div>
                                    {/* Toggle */}
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={value}
                                        onClick={() => set(!value)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${value ? 'bg-emerald-700' : 'bg-muted-foreground/30'}`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* ── API & Network ── */}
                        <div className="rounded-xl border border-border bg-card shadow-sm p-6 flex flex-col gap-5">
                            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <span className="text-lg">🔗</span> API & Network
                            </h2>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Server URL
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        defaultValue="https://api.colonyguard-v4.io/v1"
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        readOnly
                                    />
                                    <Link2 className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    defaultValue="colonyguard-admin"
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        defaultValue="sk-colonyguard-prod-a8f2e1c9b3d7"
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10 px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                        Live Connection Stable
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">LATENCY: 42ms</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer bar */}
                <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card/80 backdrop-blur-sm px-6 py-3">
                    <span className="text-xs text-muted-foreground">⏱ Last saved 4 minutes ago</span>
                    <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm">
                        Save Changes
                    </button>
                </div>
            </div>
        </>
    );
}

SystemConfig.layout = {
    breadcrumbs: [{ title: 'System Preferences', href: '/system-config' }],
};
