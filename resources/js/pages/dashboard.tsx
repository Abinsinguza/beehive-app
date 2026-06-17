import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    CheckSquare,
    Clock,
    ExternalLink,
    Hexagon,
    Mic,
    Terminal,
    Users,
} from 'lucide-react';
import { dashboard } from '@/routes';

type Stats = {
    total_hives: number;
    hives_this_month: number;
    total_beekeepers: number;
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
};

type HiveCategories = Record<string, number>;
type InferenceRow   = { state: string; percentage: number };

type AlertItem = {
    id: string;
    hive_name: string;
    hive_location: string;
    severity_level: string;
    recommended_action: string;
    action_status: string;
    alert_timestamp: string | null;
};

type ActionItem     = { description: string; hive_name: string | null };
type ActionCounts   = Record<string, number>;
type LogItem        = { level: string; message: string; created_at: string | null };

type DashboardProps = {
    stats: Stats;
    greeting_name: string;
    hives_list: HiveItem[];
    hive_categories: HiveCategories;
    inference_distribution: InferenceRow[];
    recent_alerts: AlertItem[];
    action_counts: ActionCounts;
    high_priority_actions: ActionItem[];
    system_logs: LogItem[];
};

// ── Helpers ──────────────────────────────────────────────────────
function getDayLabel() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
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
        label: state.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
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

const LOG_STYLE: Record<string, { bg: string; text: string }> = {
    ERROR: { bg: '#fee2e2', text: '#b91c1c' },
    WARN:  { bg: '#fef3c7', text: '#92400e' },
    INFO:  { bg: '#eff6ff', text: '#1e40af' },
};
function logStyle(level: string) { return LOG_STYLE[level] ?? { bg: '#f1f5f9', text: '#475569' }; }

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

function infColor(s: string) { return donutColor(s); }

// ── Main component ───────────────────────────────────────────────
export default function Dashboard({
    stats, greeting_name,
    hives_list, hive_categories, inference_distribution,
    recent_alerts, action_counts, high_priority_actions, system_logs,
}: DashboardProps) {
    const alertDiff  = stats.active_alerts - stats.alerts_yesterday;
    const recDiff    = stats.recordings_today - stats.recordings_yesterday;
    const donutTotal = Object.values(hive_categories).reduce((sum, n) => sum + n, 0);

    const pendingCount    = action_counts['pending']     ?? 0;
    const inProgressCount = action_counts['in_progress'] ?? 0;
    const resolvedCount   = action_counts['resolved']    ?? 0;
    const actionTotal     = pendingCount + inProgressCount + resolvedCount || 1;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="flex-1 p-6 flex flex-col gap-6">

                    {/* ── Greeting ── */}
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>
                            Good morning, {greeting_name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {getDayLabel()}
                            {stats.need_attention > 0 && (
                                <> · <span className="text-red-500 font-medium">
                                    {stats.need_attention} hive{stats.need_attention !== 1 ? 's' : ''} need attention today
                                </span></>
                            )}
                        </p>
                    </div>

                    {/* ── Summary stat cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">Total hives</p>
                                <Clock className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold mt-1" style={{ color: '#0d1b2a' }}>{stats.total_hives}</p>
                            <p className={`text-xs font-medium mt-1 ${stats.hives_this_month > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                {stats.hives_this_month > 0 ? `↑ +${stats.hives_this_month} this month` : '— no change'}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">Beekeepers</p>
                                <Users className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold mt-1" style={{ color: '#0d1b2a' }}>{stats.total_beekeepers}</p>
                            <p className="text-xs text-gray-400 mt-1">— no change</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">Active alerts</p>
                                <AlertTriangle className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold mt-1" style={{ color: stats.active_alerts > 0 ? '#ef4444' : '#0d1b2a' }}>
                                {stats.active_alerts}
                            </p>
                            <p className={`text-xs font-medium mt-1 ${alertDiff > 0 ? 'text-red-500' : alertDiff < 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                                {alertDiff === 0 ? '— no change' : alertDiff > 0 ? `↑ +${alertDiff} since yesterday` : `↓ ${alertDiff} since yesterday`}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">Recordings today</p>
                                <Mic className="w-4 h-4 text-gray-400" />
                            </div>
                            <p className="text-3xl font-bold mt-1" style={{ color: '#0d1b2a' }}>{stats.recordings_today}</p>
                            <p className={`text-xs font-medium mt-1 ${recDiff > 0 ? 'text-emerald-500' : recDiff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {recDiff === 0 ? '— no change' : recDiff > 0 ? `↑ +${recDiff} vs yesterday` : `↓ ${recDiff} vs yesterday`}
                            </p>
                        </div>
                    </div>

                    {/* ── Hive status + charts ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                        {/* Hive list */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Hexagon className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Hive status</span>
                                </div>
                                <button onClick={() => router.visit('/beehives')}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                    View all <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                            {hives_list.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-12 text-sm text-gray-400">No hives registered yet</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {hives_list.map((hive) => {
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
                                                        {hive.name}{hive.type ? ` — ${hive.type}` : ''}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{hive.location}</p>
                                                </div>
                                                <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ backgroundColor: meta.bg, color: meta.text }}>
                                                    {meta.label}
                                                </span>
                                                {hive.confidence !== null && (
                                                    <span className="shrink-0 text-xs font-medium text-gray-500 w-8 text-right">
                                                        {hive.confidence}%
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Donut + bar */}
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Hexagon className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Hive states</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-40 h-40 shrink-0"><DonutChart categories={hive_categories} /></div>
                                    <div className="flex flex-col gap-3">
                                        {Object.entries(hive_categories)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([key, count]) => (
                                                <div key={key} className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: donutColor(key) }} />
                                                    <span className="text-sm text-gray-600">{stateMeta(key).label}</span>
                                                    <span className="text-sm font-semibold ml-auto pl-4" style={{ color: '#0d1b2a' }}>
                                                        {count}
                                                    </span>
                                                </div>
                                            ))}
                                        {donutTotal === 0 && <p className="text-xs text-gray-400">No inference data yet</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Hexagon className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Inference states</span>
                                </div>
                                {inference_distribution.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-4 text-center">No inference results yet</p>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {inference_distribution.map((row) => (
                                            <div key={row.state} className="flex items-center gap-3">
                                                <span className="text-sm text-gray-600 w-24 shrink-0">{stateMeta(row.state).label}</span>
                                                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${row.percentage}%`, backgroundColor: infColor(row.state) }} />
                                                </div>
                                                <span className="text-sm font-medium text-gray-500 w-9 text-right shrink-0">{row.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                    View all <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                            {recent_alerts.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center py-10 text-sm text-gray-400">No alerts yet</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {recent_alerts.map((a) => {
                                        const badge = severityBadge(a.severity_level);
                                        const dot   = severityDot(a.severity_level);
                                        const status = a.action_status?.replace(/_/g, ' ') ?? '';
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

                        {/* Advisory actions */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Advisory actions</span>
                                </div>
                                <button onClick={() => router.visit('/advisories')}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                    View all <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="px-5 py-4 flex flex-col gap-3 border-b border-gray-100">
                                {[
                                    { label: 'Pending',     count: pendingCount,    color: '#dc2626' },
                                    { label: 'In progress', count: inProgressCount, color: '#b45309' },
                                    { label: 'Resolved',    count: resolvedCount,   color: '#15803d' },
                                ].map(({ label, count, color }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600 w-24 shrink-0">{label}</span>
                                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{
                                                width: `${Math.round((count / actionTotal) * 100)}%`,
                                                backgroundColor: color,
                                            }} />
                                        </div>
                                        <span className="text-sm font-semibold w-6 text-right shrink-0" style={{ color: '#0d1b2a' }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                            {high_priority_actions.length > 0 && (
                                <div className="px-5 py-4 flex flex-col gap-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                                        High priority pending
                                    </p>
                                    {high_priority_actions.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                            <p className="text-xs text-gray-700 flex-1">
                                                {a.description}{a.hive_name ? ` — ${a.hive_name}` : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── System logs ── */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>System logs</span>
                            </div>
                            <button className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                                View all <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                        {system_logs.length === 0 ? (
                            <div className="flex items-center justify-center py-10 text-sm text-gray-400">No system logs yet</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {system_logs.map((log, i) => {
                                    const style = logStyle(log.level);
                                    return (
                                        <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded w-14 text-center"
                                                style={{ backgroundColor: style.bg, color: style.text }}>
                                                {log.level}
                                            </span>
                                            <p className="flex-1 text-xs text-gray-700 truncate">{log.message}</p>
                                            <span className="shrink-0 text-[11px] text-gray-400 tabular-nums">{log.created_at ?? ''}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Admin Dashboard', href: dashboard() }],
};
