import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    Clock,
    ExternalLink,
    Hexagon,
    Info,
    Mic,
    Users,
    Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { dashboard } from '@/routes';
import { formatDisplayText, cleanDataArray } from '@/lib/utils';
import { toSentenceCase } from '@/lib/format-text';

type Stats = {
    total_hives: number;
    hives_this_month: number;
    total_beekeepers: number;
    beekeepers_this_month: number;
    active_alerts: number;
    alerts_yesterday: number;
    recordings_today: number;
    recordings_yesterday: number;
    need_attention: number;
};

type HiveItem = {
    id: string;
    name: string;
    type: string;
    location: string;
    hive_state: string;
    confidence: number | null;
    updated_at: string | null;
};

type HiveCategories = Record<string, number>;

type AlertItem = {
    id: string;
    hive_name: string;
    hive_location: string;
    severity_level: string;
    recommended_action: string;
    action_status: string;
    alert_timestamp: string | null;
};

type RecordingVolume = { label: string; [state: string]: string | number };

type DashboardProps = {
    stats: Stats;
    greeting_name: string;
    hives_list: HiveItem[];
    hive_categories: HiveCategories;
    recent_alerts: AlertItem[];
    recordings_weekly: RecordingVolume[];
    recordings_monthly: RecordingVolume[];
    recording_states: string[];
};

// ── Helpers ──────────────────────────────────────────────────────
function getDayLabel() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

const STATE_META: Record<string, { label: string; bg: string; text: string }> = {
    normal:           { label: 'Normal',           bg: '#dcfce7', text: '#15803d' },
    pre_swarm:        { label: 'Pre-Swarm',         bg: '#fef3c7', text: '#b45309' },
    swarm:            { label: 'Swarm',             bg: '#fee2e2', text: '#b91c1c' },
    abscondment:      { label: 'Abscondment',       bg: '#ede9fe', text: '#6d28d9' },
    missing_queen:    { label: 'Missing Queen',     bg: '#ffedd5', text: '#c2410c' },
    queenbee_present: { label: 'Queenbee Present',  bg: '#dcfce7', text: '#15803d' },
    pest_infested:    { label: 'Pest Infested',     bg: '#ffedd5', text: '#c2410c' },
    external_noise:   { label: 'External Noise',    bg: '#eff6ff', text: '#1d4ed8' },
    uncertain:        { label: 'Uncertain',         bg: '#f1f5f9', text: '#64748b' },
    unknown:          { label: 'Unknown',           bg: '#f1f5f9', text: '#64748b' },
};

function stateMeta(state: string) {
    return STATE_META[state] ?? {
        label: toSentenceCase(state),
        bg: '#f1f5f9', text: '#64748b',
    };
}

const SEVERITY_DOT: Record<string, string> = {
    critical: '#dc2626', high: '#dc2626',
    medium: '#f59e0b', low: '#3b82f6',
};
function severityDot(s: string) { return SEVERITY_DOT[s?.toLowerCase()] ?? '#94a3b8'; }

const SEVERITY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    critical: { bg: '#fee2e2', text: '#b91c1c', label: 'Critical' },
    high:     { bg: '#fee2e2', text: '#b91c1c', label: 'High'     },
    medium:   { bg: '#fef3c7', text: '#b45309', label: 'Medium'   },
    low:      { bg: '#eff6ff', text: '#1d4ed8', label: 'Low'      },
};
function severityBadge(s: string) {
    return SEVERITY_BADGE[s?.toLowerCase()] ?? { bg: '#f1f5f9', text: '#64748b', label: s };
}

function timeAgo(iso: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return 'Yesterday ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function relativeAgo(iso: string | null) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}hrs ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Donut chart ──────────────────────────────────────────────────
function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function donutArc(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) {
    const gap = 2; const s = startDeg + gap / 2; const e = endDeg - gap / 2;
    if (e <= s) return '';
    const o1 = polar(cx, cy, outerR, s), o2 = polar(cx, cy, outerR, e);
    const i1 = polar(cx, cy, innerR, e), i2 = polar(cx, cy, innerR, s);
    const large = e - s > 180 ? 1 : 0;
    return [
        `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
        `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
        `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
        `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`, 'Z',
    ].join(' ');
}
const DONUT_COLORS: Record<string, string> = {
    normal:           '#3d7a3d',
    pre_swarm:        '#d97706',
    swarm:            '#dc2626',
    abscondment:      '#7c3aed',
    missing_queen:    '#ea580c',
    queenbee_present: '#16a34a',
    pest_infested:    '#ea580c',
    external_noise:   '#2563eb',
    uncertain:        '#64748b',
    unknown:          '#94a3b8',
};
function donutColor(state: string) { return DONUT_COLORS[state] ?? '#94a3b8'; }

function DonutChart({ categories }: { categories: HiveCategories }) {
    const entries = Object.entries(categories);
    const total   = entries.reduce((sum, [, count]) => sum + count, 0);
    const cx = 80, cy = 80, outerR = 68, innerR = 42;
    let cursor = 0;
    const arcs = entries.map(([key, count]) => {
        const sweep = total > 0 ? (count / total) * 360 : 0;
        const path  = donutArc(cx, cy, outerR, innerR, cursor, cursor + sweep);
        cursor += sweep;
        return { key, path };
    });
    return (
        <svg viewBox="0 0 160 160" className="w-full h-full">
            {total === 0
                ? <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#e5e7eb" strokeWidth={outerR - innerR} />
                : arcs.map((arc) => arc.path ? <path key={arc.key} d={arc.path} fill={donutColor(arc.key)} /> : null)
            }
        </svg>
    );
}

// ── Stat card with info tooltip + click-through ──────────────────
function StatCard({
    href, label, description, icon, value, valueColor, footer, footerColor,
}: {
    href: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    value: React.ReactNode;
    valueColor?: string;
    footer: React.ReactNode;
    footerColor?: string;
}) {
    return (
        <div
            onClick={() => router.visit(href)}
            className="relative bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
        >
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{label}</p>
                {icon}
            </div>
            <p className="text-3xl font-bold mt-1" style={{ color: valueColor ?? '#0d1b2a' }}>{value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: footerColor }}>{footer}</p>

            <div className="group absolute bottom-3 right-3 inline-flex" onClick={(e) => e.stopPropagation()}>
                <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-800 transition-colors" />
                <div className="invisible group-hover:visible absolute right-0 bottom-full mb-2 z-20 w-52 rounded-lg bg-gray-900 text-white text-[11px] leading-snug p-2.5 shadow-lg">
                    {description}
                </div>
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────
export default function Dashboard({
    stats, greeting_name,
    hives_list, hive_categories,
    recent_alerts, recordings_weekly, recordings_monthly, recording_states,
}: DashboardProps) {
    const alertDiff  = stats.active_alerts - stats.alerts_yesterday;
    const recDiff    = stats.recordings_today - stats.recordings_yesterday;
    const donutTotal = Object.values(hive_categories).reduce((sum, n) => sum + n, 0);
    const [recordingsRange, setRecordingsRange] = useState<'weekly' | 'monthly'>('weekly');
    const recordingsData = recordingsRange === 'weekly' ? recordings_weekly : recordings_monthly;
    const recordingsMax  = Math.max(
        ...recordingsData.map((d) => recording_states.reduce((sum, s) => sum + (Number(d[s]) || 0), 0)),
        1
    );

    // Clean the incoming data!
    const cleanedHives = useMemo(() => {
        return cleanDataArray(hives_list, ['name', 'type', 'location']);
    }, [hives_list]);

    const cleanedAlerts = useMemo(() => {
        return cleanDataArray(recent_alerts, ['hive_name', 'hive_location', 'recommended_action', 'action_status']);
    }, [recent_alerts]);

    const cleanedGreetingName = useMemo(() => {
        return formatDisplayText(greeting_name);
    }, [greeting_name]);

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="flex-1 p-6 flex flex-col gap-6">

                    {/* ── Greeting ── */}
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>
                            {getTimeGreeting()}, {cleanedGreetingName}
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {getDayLabel()}
                        </p>
                    </div>

                    {/* ── Summary stat cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            href="/beehives"
                            label="Total hives"
                            description="Total number of hives registered in the system. Click to view the full hive inventory."
                            icon={<Clock className="w-4 h-4 text-gray-400" />}
                            value={stats.total_hives}
                            footer={stats.hives_this_month > 0 ? `↑ +${stats.hives_this_month} this month` : '— no change'}
                            footerColor={stats.hives_this_month > 0 ? '#10b981' : '#9ca3af'}
                        />
                        <StatCard
                            href="/beekeepers"
                            label="Beekeepers"
                            description="Total number of registered beekeepers managing hives. Click to view all beekeepers."
                            icon={<Users className="w-4 h-4 text-gray-400" />}
                            value={stats.total_beekeepers}
                            footer={stats.beekeepers_this_month > 0 ? `↑ +${stats.beekeepers_this_month} this month` : '— no change'}
                            footerColor={stats.beekeepers_this_month > 0 ? '#10b981' : '#9ca3af'}
                        />
                        <StatCard
                            href="/alerts"
                            label="Active alerts"
                            description="Alerts that are not yet resolved or dismissed. Click to view and manage all alerts."
                            icon={<AlertTriangle className="w-4 h-4 text-gray-400" />}
                            value={stats.active_alerts}
                            valueColor={stats.active_alerts > 0 ? '#ef4444' : '#0d1b2a'}
                            footer={alertDiff === 0 ? '— no change' : alertDiff > 0 ? `↑ +${alertDiff} since yesterday` : `↓ ${alertDiff} since yesterday`}
                            footerColor={alertDiff > 0 ? '#ef4444' : alertDiff < 0 ? '#10b981' : '#9ca3af'}
                        />
                        <StatCard
                            href="/audio-recordings"
                            label="Recordings today"
                            description="Number of audio recordings received from hives today. Click to view all recordings."
                            icon={<Mic className="w-4 h-4 text-gray-400" />}
                            value={stats.recordings_today}
                            footer={recDiff === 0 ? '— no change' : recDiff > 0 ? `↑ +${recDiff} vs yesterday` : `↓ ${recDiff} vs yesterday`}
                            footerColor={recDiff > 0 ? '#10b981' : recDiff < 0 ? '#ef4444' : '#9ca3af'}
                        />
                    </div>

                    {/* ── Hive status + charts ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                        {/* Hive list */}
                        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Hexagon className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Latest Hive Status Updated</span>
                                </div>
                                <button onClick={() => router.visit('/beehives')}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                    View all <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                            {cleanedHives.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-12 text-sm text-gray-400">No hives registered yet</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {cleanedHives.map((hive) => {
                                        const meta = stateMeta(hive.hive_state);
                                        return (
                                            <div key={hive.id}
                                                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => router.visit(`/beehives/${hive.id}`)}>
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#fff7ed' }}>
                                                    <Hexagon className="w-5 h-5" style={{ color: '#c2410c' }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold truncate leading-tight" style={{ color: '#0d1b2a' }}>
                                                        {hive.name}{hive.type ? <> — {hive.type}</> : ''}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{hive.location}</p>
                                                </div>
                                                <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ backgroundColor: meta.bg, color: meta.text }}>
                                                    {meta.label}
                                                </span>
                                                {hive.confidence !== null && (
                                                    <span className="shrink-0 text-xs font-medium w-8 text-right" style={{ color: '#0d1b2a' }}>
                                                        {hive.confidence}%
                                                    </span>
                                                )}
                                                <span className="shrink-0 text-[11px] text-gray-400 w-16 text-right">
                                                    {relativeAgo(hive.updated_at)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Donut */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <Hexagon className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Current Hive Status Distribution</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-8">
                                <div className="w-56 h-56 shrink-0"><DonutChart categories={hive_categories} /></div>
                                <div className="flex flex-col gap-3">
                                    {Object.entries(hive_categories)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([key, count]) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: donutColor(key) }} />
                                                <span className="text-sm text-gray-400">{stateMeta(key).label}</span>
                                                <span className="text-sm font-semibold ml-auto pl-4" style={{ color: '#0d1b2a' }}>
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                    {donutTotal === 0 && <p className="text-xs text-gray-400">No inference data yet</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Recent alerts + Advisory actions ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Recent alerts */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Recent alerts</span>
                                </div>
                                <button onClick={() => router.visit('/alerts')}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                    View all <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                            {cleanedAlerts.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-10 text-sm text-gray-400">No alerts yet</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {cleanedAlerts.map((a) => {
                                        const badge = severityBadge(a.severity_level);
                                        const dot   = severityDot(a.severity_level);
                                        const status = a.action_status;
                                        return (
                                            <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                                                <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: dot }} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold leading-tight" style={{ color: '#0d1b2a' }}>
                                                        {a.recommended_action} — {a.hive_name}, {a.hive_location}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        {timeAgo(a.alert_timestamp)} · {badge.label} · {status}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ backgroundColor: badge.bg, color: badge.text }}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recordings Volume */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#eff6ff' }}>
                                        <Video className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base" style={{ color: '#0d1b2a' }}>Audio Beehive Recordings </p>
                                        <p className="text-xs text-gray-400 mt-0.5">Track the number of recordings received from data sources.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
                                    <button
                                        onClick={() => setRecordingsRange('weekly')}
                                        className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                                        style={recordingsRange === 'weekly' ? { backgroundColor: '#ffffff', color: '#0d1b2a', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } : { color: '#6b7280' }}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => setRecordingsRange('monthly')}
                                        className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                                        style={recordingsRange === 'monthly' ? { backgroundColor: '#ffffff', color: '#0d1b2a', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } : { color: '#6b7280' }}
                                    >
                                        Monthly
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 flex items-end gap-4" style={{ height: '180px' }}>
                                <div className="flex flex-col justify-between h-full text-[10px] text-gray-400 pb-5">
                                    {[4, 3, 2, 1, 0].map((i) => (
                                        <span key={i}>{Math.round((recordingsMax * i) / 4)}</span>
                                    ))}
                                </div>
                                <div className="flex-1 h-full flex items-end gap-3 relative">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                                            style={{ bottom: `${20 + i * 25}%` }} />
                                    ))}
                                    {recordingsData.map((d) => (
                                        <div key={d.label} className="flex-1 flex items-end justify-center gap-1 h-full relative z-10">
                                            {recording_states.map((s) => {
                                                const count = Number(d[s]) || 0;
                                                return (
                                                    <div
                                                        key={s}
                                                        className="flex-1 rounded-t-sm transition-all"
                                                        style={{
                                                            height: `${Math.max((count / recordingsMax) * 100, count > 0 ? 2 : 0)}%`,
                                                            backgroundColor: donutColor(s),
                                                        }}
                                                        title={`${s}: ${count}`}
                                                    />
                                                );
                                            })}
                                            <span className="text-[10px] text-gray-400 absolute -bottom-5 left-1/2 -translate-x-1/2">{d.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-8 pt-4 border-t border-gray-100 flex-wrap">
                                {recording_states.map((s) => (
                                    <div key={s} className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: donutColor(s) }} />
                                        <span className="text-xs text-gray-400">{stateMeta(s).label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Admin Dashboard', href: dashboard() }],
};
