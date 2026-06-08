import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Battery,
    Bell,
    BellOff,
    CheckCircle2,
    Eye,
    Settings2,
    Shield,
    TriangleAlert,
    X,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
type NotifCategory = 'alert' | 'prediction' | 'system' | 'battery';
type NotifType =
    | 'Swarm Detection'
    | 'Abscondment Detection'
    | 'Battery Alert'
    | 'Connectivity Alert'
    | 'System Update'
    | 'AI Prediction';
type Severity = 'critical' | 'high' | 'medium' | 'low';
type Status = 'new' | 'acknowledged' | 'resolved';
type BadgeKind = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
type DateGroup = 'today' | 'last7' | 'last30';

type Notification = {
    id: number;
    category: NotifCategory;
    type: NotifType;
    hiveId?: string;
    title: string;
    body: string;
    severity: Severity;
    status: Status;
    badge: BadgeKind;
    time: string;
    date: DateGroup;
    borderColor: string;
};

// ── Mock Data ────────────────────────────────────────────────────────────────
const mockNotifications: Notification[] = [
    {
        id: 1,
        category: 'alert',
        type: 'Swarm Detection',
        hiveId: 'BH0004',
        title: 'Critical Swarm Warning: BH0004',
        body: 'Acoustic frequency analysis indicates imminent swarming behavior (452Hz detected). Temperature has risen by 2.4°C in the last 15 minutes.',
        severity: 'critical',
        status: 'new',
        badge: 'CRITICAL',
        time: '2 mins ago',
        date: 'today',
        borderColor: '#ef4444',
    },
    {
        id: 2,
        category: 'alert',
        type: 'Abscondment Detection',
        hiveId: 'BH0007',
        title: 'Abscondment Risk: BH0007',
        body: 'Colony population decline detected. Acoustic signature suggests potential abscondment within 24-48 hours. Immediate inspection recommended.',
        severity: 'critical',
        status: 'new',
        badge: 'CRITICAL',
        time: '18 mins ago',
        date: 'today',
        borderColor: '#ef4444',
    },
    {
        id: 3,
        category: 'prediction',
        type: 'AI Prediction',
        hiveId: 'BH0002',
        title: 'Pre-Swarm Prediction: BH0002',
        body: 'ML model confidence 87%. Acoustic signature approaching 420Hz threshold. Recommend proactive inspection within 6 hours.',
        severity: 'high',
        status: 'new',
        badge: 'WARNING',
        time: '1 hour ago',
        date: 'today',
        borderColor: '#f5a623',
    },
    {
        id: 4,
        category: 'battery',
        type: 'Battery Alert',
        hiveId: 'BH0005',
        title: 'Battery Alert: BH0005',
        body: 'Microphone battery at 15%. Audio recording at risk. Replace battery soon to maintain hive monitoring.',
        severity: 'high',
        status: 'new',
        badge: 'WARNING',
        time: '3 hours ago',
        date: 'today',
        borderColor: '#f5a623',
    },
    {
        id: 5,
        category: 'system',
        type: 'Connectivity Alert',
        hiveId: 'BH0011',
        title: 'Connectivity Lost: BH0011',
        body: 'Node BH0011 has been offline for 47 minutes. Last known status: Normal. Check power supply and network connection.',
        severity: 'medium',
        status: 'acknowledged',
        badge: 'WARNING',
        time: '47 mins ago',
        date: 'today',
        borderColor: '#f97316',
    },
    {
        id: 6,
        category: 'system',
        type: 'System Update',
        title: 'System Update: v4.2',
        body: 'BSADS system successfully updated to v4.2.0. ML classification model performance improved by 12%.',
        severity: 'low',
        status: 'resolved',
        badge: 'SUCCESS',
        time: '22 hours ago',
        date: 'today',
        borderColor: '#94a3b8',
    },
    {
        id: 7,
        category: 'alert',
        type: 'Swarm Detection',
        hiveId: 'BH0003',
        title: 'Swarm Detected: BH0003',
        body: 'Active swarming behavior confirmed. Peak frequency 461Hz. Colony exit observed. Deploy response team immediately.',
        severity: 'critical',
        status: 'acknowledged',
        badge: 'CRITICAL',
        time: 'Yesterday at 9:22 AM',
        date: 'last7',
        borderColor: '#ef4444',
    },
    {
        id: 8,
        category: 'prediction',
        type: 'AI Prediction',
        hiveId: 'BH0008',
        title: 'Humidity Risk Prediction: BH0008',
        body: 'Relative humidity reached 89%. ML model flags moisture accumulation risk in brood chamber. Confidence: 79%.',
        severity: 'medium',
        status: 'new',
        badge: 'INFO',
        time: 'Yesterday at 2:15 PM',
        date: 'last7',
        borderColor: '#3b82f6',
    },
    {
        id: 9,
        category: 'battery',
        type: 'Battery Alert',
        hiveId: 'BH0012',
        title: 'Battery Critical: BH0012',
        body: 'Battery at 8%. Sensor shutdown imminent. All acoustic monitoring for BH0012 will cease within 2 hours.',
        severity: 'critical',
        status: 'new',
        badge: 'CRITICAL',
        time: 'Yesterday at 4:30 PM',
        date: 'last7',
        borderColor: '#ef4444',
    },
    {
        id: 10,
        category: 'system',
        type: 'Connectivity Alert',
        hiveId: 'BH0006',
        title: 'Node Reconnected: BH0006',
        body: 'BH0006 successfully reconnected after 2-hour outage. All sensors recalibrated and audio classification resumed.',
        severity: 'low',
        status: 'resolved',
        badge: 'SUCCESS',
        time: '2 days ago',
        date: 'last7',
        borderColor: '#22c55e',
    },
    {
        id: 11,
        category: 'alert',
        type: 'Abscondment Detection',
        hiveId: 'BH0009',
        title: 'Abscondment Alert: BH0009',
        body: 'Rapid colony population loss detected. Queen activity absent in last 3 acoustic recordings. Colony may have absconded.',
        severity: 'critical',
        status: 'new',
        badge: 'CRITICAL',
        time: '3 days ago',
        date: 'last7',
        borderColor: '#ef4444',
    },
    {
        id: 12,
        category: 'prediction',
        type: 'AI Prediction',
        hiveId: 'BH0001',
        title: 'Seasonal Swarm Risk: BH0001',
        body: 'Environmental conditions indicate elevated swarm probability this week. Temperature rising, humidity optimal for swarming.',
        severity: 'medium',
        status: 'acknowledged',
        badge: 'INFO',
        time: '4 days ago',
        date: 'last7',
        borderColor: '#3b82f6',
    },
    {
        id: 13,
        category: 'system',
        type: 'System Update',
        title: 'ML Model Retrained',
        body: 'Classification accuracy improved to 91.3% after retraining with 2,400 new acoustic samples from verified swarm events.',
        severity: 'low',
        status: 'resolved',
        badge: 'SUCCESS',
        time: '5 days ago',
        date: 'last7',
        borderColor: '#22c55e',
    },
    {
        id: 14,
        category: 'alert',
        type: 'Swarm Detection',
        hiveId: 'BH0010',
        title: 'Pre-Swarm Confirmed: BH0010',
        body: 'Sustained piping above 420Hz for 22 minutes. Classification confidence 94%. Physical inspection confirmed queen cells present.',
        severity: 'high',
        status: 'resolved',
        badge: 'WARNING',
        time: '1 week ago',
        date: 'last30',
        borderColor: '#f5a623',
    },
    {
        id: 15,
        category: 'battery',
        type: 'Battery Alert',
        hiveId: 'BH0014',
        title: 'Battery Replaced: BH0014',
        body: 'Battery replacement confirmed for BH0014. Microphone operational. Audio classification resumed successfully.',
        severity: 'low',
        status: 'resolved',
        badge: 'SUCCESS',
        time: '2 weeks ago',
        date: 'last30',
        borderColor: '#22c55e',
    },
    {
        id: 16,
        category: 'prediction',
        type: 'AI Prediction',
        hiveId: 'BH0013',
        title: 'Acoustic Drift Detected: BH0013',
        body: 'Gradual frequency shift from 280Hz to 380Hz over 72 hours. Model predicts 68% chance of pre-swarm within 5 days.',
        severity: 'medium',
        status: 'acknowledged',
        badge: 'INFO',
        time: '3 weeks ago',
        date: 'last30',
        borderColor: '#3b82f6',
    },
];

// ── Filter state type ────────────────────────────────────────────────────────
type FilterSettings = {
    types: NotifType[];
    severities: Severity[];
    statuses: Status[];
    dateRange: DateGroup | 'all';
};

const defaultFilters: FilterSettings = {
    types: [
        'Swarm Detection',
        'Abscondment Detection',
        'Battery Alert',
        'Connectivity Alert',
        'System Update',
        'AI Prediction',
    ],
    severities: ['critical', 'high', 'medium', 'low'],
    statuses: ['new', 'acknowledged', 'resolved'],
    dateRange: 'all',
};

// ── Badge component ──────────────────────────────────────────────────────────
function SeverityBadge({ badge }: { badge: BadgeKind }) {
    const styles: Record<BadgeKind, { bg: string; color: string }> = {
        CRITICAL: { bg: '#ef4444', color: '#fff' },
        WARNING: { bg: '#f5a623', color: '#0d1b2a' },
        INFO: { bg: '#3b82f6', color: '#fff' },
        SUCCESS: { bg: '#22c55e', color: '#fff' },
    };
    const s = styles[badge];
    return (
        <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ backgroundColor: s.bg, color: s.color }}
        >
            {badge}
        </span>
    );
}

function StatusBadge({ status }: { status: Status }) {
    if (status === 'new')
        return (
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                NEW
            </span>
        );
    if (status === 'acknowledged')
        return (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                ACKNOWLEDGED
            </span>
        );
    return (
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#22c55e' }}>
            RESOLVED
        </span>
    );
}

// ── Category icon ────────────────────────────────────────────────────────────
function NotifIcon({ category }: { category: NotifCategory }) {
    const base = 'w-10 h-10 rounded-lg flex items-center justify-center shrink-0';
    if (category === 'alert')
        return (
            <div className={base} style={{ backgroundColor: '#fef2f2' }}>
                <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
        );
    if (category === 'prediction')
        return (
            <div className={base} style={{ backgroundColor: '#eff6ff' }}>
                <Zap className="w-5 h-5 text-blue-500" />
            </div>
        );
    if (category === 'battery')
        return (
            <div className={base} style={{ backgroundColor: '#fff7ed' }}>
                <Battery className="w-5 h-5" style={{ color: '#f5a623' }} />
            </div>
        );
    return (
        <div className={base} style={{ backgroundColor: '#f1f5f9' }}>
            <Shield className="w-5 h-5 text-slate-400" />
        </div>
    );
}

// ── Details Modal ────────────────────────────────────────────────────────────
function DetailsModal({ n, onClose }: { n: Notification; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div
                    className="flex items-center justify-between px-6 py-4 border-b border-gray-100 rounded-t-2xl"
                    style={{ borderLeft: `4px solid ${n.borderColor}` }}
                >
                    <div>
                        <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>
                            {n.title}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 flex flex-col gap-3">
                    <p className="text-sm text-gray-600 leading-relaxed">{n.body}</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {[
                            ['Type', n.type],
                            ['Category', n.category],
                            ['Severity', n.severity],
                            ['Status', n.status],
                            ['Date Group', n.date],
                            ...(n.hiveId ? [['Hive ID', n.hiveId] as [string, string]] : []),
                        ].map(([label, val]) => (
                            <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                                <p className="text-xs font-semibold mt-0.5 capitalize" style={{ color: '#0d1b2a' }}>{val}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                        <SeverityBadge badge={n.badge} />
                        <StatusBadge status={n.status} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Notification Card ────────────────────────────────────────────────────────
function NotifCard({
    n,
    muted,
    onAcknowledge,
    onResolve,
    onViewDetails,
    onDispatch,
    onSchedule,
}: {
    n: Notification;
    muted: boolean;
    onAcknowledge: (id: number) => void;
    onResolve: (id: number) => void;
    onViewDetails: (n: Notification) => void;
    onDispatch: () => void;
    onSchedule: () => void;
}) {
    return (
        <div
            className={`flex gap-4 py-5 px-6 border-b border-gray-100 last:border-0 transition-colors ${muted ? 'bg-gray-50 opacity-60' : 'bg-white hover:bg-slate-50/60'}`}
        >
            {/* Left color bar */}
            <div
                className="w-1 rounded-full shrink-0 self-stretch"
                style={{ backgroundColor: muted ? '#d1d5db' : n.borderColor }}
            />

            <NotifIcon category={n.category} />

            <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: muted ? '#9ca3af' : '#0d1b2a' }}>
                            {n.title}
                        </p>
                        <StatusBadge status={n.status} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <SeverityBadge badge={n.badge} />
                        <span className="text-xs text-gray-400 whitespace-nowrap">{n.time}</span>
                    </div>
                </div>

                {/* Hive ID tag */}
                {n.hiveId && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-gray-200 text-gray-400">
                        {n.hiveId}
                    </span>
                )}

                {/* Body */}
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{n.body}</p>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <button
                        onClick={() => onViewDetails(n)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                    </button>

                    {/* Dispatch button for BH0004 swarm alert */}
                    {n.id === 1 && n.status !== 'resolved' && (
                        <button
                            onClick={onDispatch}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 hover:opacity-90 transition-opacity"
                            style={{ borderColor: '#f5a623', color: '#f5a623' }}
                        >
                            Dispatch Team
                        </button>
                    )}

                    {/* Schedule button for BH0005 battery */}
                    {n.id === 4 && n.status !== 'resolved' && (
                        <button
                            onClick={onSchedule}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold underline"
                            style={{ color: '#0d1b2a' }}
                        >
                            Schedule Replacement
                        </button>
                    )}

                    {n.status === 'new' && (
                        <button
                            onClick={() => onAcknowledge(n.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Acknowledge
                        </button>
                    )}

                    {n.status !== 'resolved' && (
                        <button
                            onClick={() => onResolve(n.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ color: '#22c55e' }}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Resolved
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Filter Modal ─────────────────────────────────────────────────────────────
function FilterModal({
    filters,
    onApply,
    onClose,
}: {
    filters: FilterSettings;
    onApply: (f: FilterSettings) => void;
    onClose: () => void;
}) {
    const [local, setLocal] = useState<FilterSettings>({ ...filters, types: [...filters.types], severities: [...filters.severities], statuses: [...filters.statuses] });

    const toggleArr = <T extends string>(arr: T[], val: T): T[] =>
        arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

    const allTypes: NotifType[] = [
        'Swarm Detection',
        'Abscondment Detection',
        'Battery Alert',
        'Connectivity Alert',
        'System Update',
        'AI Prediction',
    ];
    const allSeverities: Severity[] = ['critical', 'high', 'medium', 'low'];
    const allStatuses: Status[] = ['new', 'acknowledged', 'resolved'];
    const dateOptions: { label: string; value: FilterSettings['dateRange'] }[] = [
        { label: 'All Time', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'Last 7 Days', value: 'last7' },
        { label: 'Last 30 Days', value: 'last30' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>
                        Filter Settings
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {/* Notification Type */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Notification Type</p>
                        <div className="flex flex-col gap-2">
                            {allTypes.map((t) => (
                                <label key={t} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={local.types.includes(t)}
                                        onChange={() => setLocal((p) => ({ ...p, types: toggleArr(p.types, t) }))}
                                        className="w-4 h-4 rounded accent-amber-400"
                                    />
                                    <span className="text-sm text-gray-700">{t}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Severity */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Severity</p>
                        <div className="flex flex-wrap gap-2">
                            {allSeverities.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setLocal((p) => ({ ...p, severities: toggleArr(p.severities, s) }))}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize"
                                    style={
                                        local.severities.includes(s)
                                            ? { backgroundColor: '#0d1b2a', color: '#fff', borderColor: '#0d1b2a' }
                                            : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#e5e7eb' }
                                    }
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Status</p>
                        <div className="flex flex-col gap-2">
                            {allStatuses.map((s) => (
                                <label key={s} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={local.statuses.includes(s)}
                                        onChange={() => setLocal((p) => ({ ...p, statuses: toggleArr(p.statuses, s) }))}
                                        className="w-4 h-4 rounded accent-amber-400"
                                    />
                                    <span className="text-sm text-gray-700 capitalize">{s}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Date Range</p>
                        <div className="flex flex-col gap-2">
                            {dateOptions.map((opt) => (
                                <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="dateRange"
                                        checked={local.dateRange === opt.value}
                                        onChange={() => setLocal((p) => ({ ...p, dateRange: opt.value }))}
                                        className="w-4 h-4 accent-amber-400"
                                    />
                                    <span className="text-sm text-gray-700">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={() => onApply(local)}
                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={() => {
                                const reset = { ...defaultFilters, types: [...defaultFilters.types], severities: [...defaultFilters.severities], statuses: [...defaultFilters.statuses] };
                                setLocal(reset);
                            }}
                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [activeCategory, setActiveCategory] = useState<'all' | NotifCategory | 'system_battery'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSettings, setFilterSettings] = useState<FilterSettings>({ ...defaultFilters, types: [...defaultFilters.types], severities: [...defaultFilters.severities], statuses: [...defaultFilters.statuses] });
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showDispatch, setShowDispatch] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [allRead, setAllRead] = useState(false);
    const [showOlder, setShowOlder] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [viewTarget, setViewTarget] = useState<Notification | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [dispatchDone, setDispatchDone] = useState(false);
    const [scheduleDone, setScheduleDone] = useState(false);

    const fireToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const handleAcknowledge = (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, status: 'acknowledged' as Status } : n)),
        );
        fireToast('Notification acknowledged');
    };

    const handleResolve = (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, status: 'resolved' as Status } : n)),
        );
        fireToast('Notification marked as resolved');
    };

    const confirmDispatch = () => {
        setDispatchDone(true);
        setTimeout(() => {
            setDispatchDone(false);
            setShowDispatch(false);
            fireToast('Team dispatched to BH0004 successfully');
        }, 800);
    };

    const confirmSchedule = () => {
        setScheduleDone(true);
        setTimeout(() => {
            setScheduleDone(false);
            setShowSchedule(false);
            setScheduleDate('');
            fireToast('Battery replacement scheduled for BH0005');
        }, 800);
    };

    // ── Counts for categories ────────────────────────────────────────────────
    const counts = useMemo(
        () => ({
            all: notifications.length,
            alert: notifications.filter((n) => n.category === 'alert').length,
            prediction: notifications.filter((n) => n.category === 'prediction').length,
            system_battery: notifications.filter((n) => n.category === 'system' || n.category === 'battery').length,
        }),
        [notifications],
    );

    // ── Urgent counts ────────────────────────────────────────────────────────
    const urgentCounts = useMemo(
        () => ({
            critical: notifications.filter((n) => n.severity === 'critical' && n.status !== 'resolved').length,
            high: notifications.filter((n) => n.severity === 'high' && n.status !== 'resolved').length,
            unresolved: notifications.filter((n) => n.status !== 'resolved').length,
        }),
        [notifications],
    );

    // ── Filtered notifications ───────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return notifications.filter((n) => {
            // Category filter
            if (activeCategory !== 'all') {
                if (activeCategory === 'system_battery') {
                    if (n.category !== 'system' && n.category !== 'battery') return false;
                } else {
                    if (n.category !== activeCategory) return false;
                }
            }
            // Search
            if (q && !n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q) && !(n.hiveId?.toLowerCase().includes(q))) return false;
            // Filter settings
            if (!filterSettings.types.includes(n.type)) return false;
            if (!filterSettings.severities.includes(n.severity)) return false;
            if (!filterSettings.statuses.includes(n.status)) return false;
            if (filterSettings.dateRange !== 'all' && n.date !== filterSettings.dateRange) return false;
            return true;
        });
    }, [notifications, activeCategory, searchQuery, filterSettings]);

    // ── Group by date ────────────────────────────────────────────────────────
    const todayItems = filtered.filter((n) => n.date === 'today');
    const last7Items = filtered.filter((n) => n.date === 'last7');
    const last30Items = filtered.filter((n) => n.date === 'last30');

    const categoryDefs: { key: 'all' | NotifCategory | 'system_battery'; label: string; icon: React.ElementType; count: number }[] = [
        { key: 'all', label: 'All Activities', icon: Bell, count: counts.all },
        { key: 'alert', label: 'Alerts', icon: AlertTriangle, count: counts.alert },
        { key: 'prediction', label: 'Predictions', icon: Zap, count: counts.prediction },
        { key: 'system_battery', label: 'System', icon: Settings2, count: counts.system_battery },
    ];

    return (
        <>
            <Head title="Notifications" />

            {/* ── Toast ── */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-xs font-semibold" style={{ backgroundColor: '#0d1b2a' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {toast}
                </div>
            )}

            {/* ── Details Modal ── */}
            {viewTarget && <DetailsModal n={viewTarget} onClose={() => setViewTarget(null)} />}

            {/* ── Filter Modal ── */}
            {showFilterModal && (
                <FilterModal
                    filters={filterSettings}
                    onApply={(f) => {
                        setFilterSettings(f);
                        setShowFilterModal(false);
                        fireToast('Filters applied');
                    }}
                    onClose={() => setShowFilterModal(false)}
                />
            )}

            {/* ── Dispatch Modal ── */}
            {showDispatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Dispatch Team to BH0004</h2>
                            <button onClick={() => { setShowDispatch(false); setDispatchDone(false); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {dispatchDone ? (
                                <div className="flex flex-col items-center py-6 gap-3">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Team Dispatched ✓</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600">Confirm deployment to inspect BH0004 for imminent swarming activity.</p>
                                    <div className="flex gap-3 pt-1">
                                        <button
                                            onClick={confirmDispatch}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                        >
                                            Confirm Dispatch
                                        </button>
                                        <button
                                            onClick={() => setShowDispatch(false)}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Schedule Modal ── */}
            {showSchedule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Schedule Battery Replacement</h2>
                            <button onClick={() => { setShowSchedule(false); setScheduleDone(false); setScheduleDate(''); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            {scheduleDone ? (
                                <div className="flex flex-col items-center py-6 gap-3">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Replacement Scheduled ✓</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600">Schedule microphone battery replacement for BH0005 to maintain audio recording.</p>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Select replacement date</label>
                                        <input
                                            type="date"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                            style={{ color: scheduleDate ? '#0d1b2a' : '#9ca3af' }}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button
                                            onClick={confirmSchedule}
                                            disabled={!scheduleDate}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                        >
                                            Confirm Schedule
                                        </button>
                                        <button
                                            onClick={() => { setShowSchedule(false); setScheduleDate(''); }}
                                            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page ── */}
            <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="p-6 flex flex-col gap-5">

                    {/* Heading */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-lg font-semibold" style={{ color: '#0d1b2a' }}>Notifications</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Manage and track all hive alerts and system messages.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setAllRead(true); fireToast('All notifications marked as read'); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <BellOff className="w-4 h-4" />
                                Mark all read
                            </button>
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                            >
                                <Settings2 className="w-4 h-4" />
                                Filter Settings
                            </button>
                        </div>
                    </div>

                    {/* Two-column layout */}
                    <div className="flex gap-5 items-start">

                        {/* Left sidebar */}
                        <div className="w-60 shrink-0 flex flex-col gap-4">

                            {/* Categories */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <p className="text-sm font-semibold mb-1" style={{ color: '#0d1b2a' }}>Categories</p>
                                <span className="block w-8 h-0.5 mb-3 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                                <div className="flex flex-col gap-1">
                                    {categoryDefs.map((cat) => {
                                        const isActive = activeCategory === cat.key;
                                        return (
                                            <button
                                                key={cat.key}
                                                onClick={() => setActiveCategory(cat.key)}
                                                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                                                style={
                                                    isActive
                                                        ? { backgroundColor: '#fff7ed', color: '#92400e', border: '1px solid #fde68a' }
                                                        : { color: '#6b7280' }
                                                }
                                            >
                                                <div className="flex items-center gap-2">
                                                    <cat.icon className="w-4 h-4" />
                                                    <span>{cat.label}</span>
                                                </div>
                                                <span
                                                    className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                                                    style={
                                                        isActive
                                                            ? { backgroundColor: '#f5a623', color: '#fff' }
                                                            : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                                                    }
                                                >
                                                    {cat.count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Urgent Tasks widget */}
                            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: '#0d1b2a' }}>
                                <div className="flex items-center gap-2">
                                    <TriangleAlert className="w-4 h-4" style={{ color: '#f5a623' }} />
                                    <p className="text-sm font-bold" style={{ color: '#f5a623' }}>Urgent Tasks</p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-300">Critical Alerts</span>
                                        <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded">{urgentCounts.critical}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-300">Warning Alerts</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>{urgentCounts.high}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-300">Unresolved</span>
                                        <span className="text-xs font-bold text-white bg-slate-600 px-2 py-0.5 rounded">{urgentCounts.unresolved}</span>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-slate-700 my-0.5" />

                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {urgentCounts.critical} critical alerts require immediate inspection.
                                </p>

                                <button
                                    onClick={() => router.visit('/alerts')}
                                    className="w-full py-2 rounded-lg border border-white text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-gray-900 transition-colors"
                                >
                                    Review Alerts
                                </button>
                            </div>
                        </div>

                        {/* Right feed */}
                        <div className="flex-1 min-w-0 flex flex-col gap-4">

                            {/* Search bar */}
                            <div className="relative">
                                <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search notifications..."
                                    className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-400 shadow-sm"
                                    style={{ color: '#0d1b2a' }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Today */}
                            {todayItems.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 mb-3">Today</p>
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        {todayItems.map((n) => (
                                            <NotifCard
                                                key={n.id}
                                                n={n}
                                                muted={allRead}
                                                onAcknowledge={handleAcknowledge}
                                                onResolve={handleResolve}
                                                onViewDetails={setViewTarget}
                                                onDispatch={() => setShowDispatch(true)}
                                                onSchedule={() => setShowSchedule(true)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Last 7 days */}
                            {last7Items.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 mb-3">Yesterday / Last 7 Days</p>
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        {last7Items.map((n) => (
                                            <NotifCard
                                                key={n.id}
                                                n={n}
                                                muted={allRead}
                                                onAcknowledge={handleAcknowledge}
                                                onResolve={handleResolve}
                                                onViewDetails={setViewTarget}
                                                onDispatch={() => setShowDispatch(true)}
                                                onSchedule={() => setShowSchedule(true)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Older (last 30) — toggled */}
                            {showOlder && last30Items.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 mb-3">Older</p>
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        {last30Items.map((n) => (
                                            <NotifCard
                                                key={n.id}
                                                n={n}
                                                muted={allRead}
                                                onAcknowledge={handleAcknowledge}
                                                onResolve={handleResolve}
                                                onViewDetails={setViewTarget}
                                                onDispatch={() => setShowDispatch(true)}
                                                onSchedule={() => setShowSchedule(true)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {filtered.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <Bell className="w-10 h-10 text-gray-300 mb-3" />
                                    <p className="text-sm font-semibold text-gray-400">No notifications found</p>
                                    <p className="text-xs text-gray-300 mt-1">Try adjusting your search or filters</p>
                                </div>
                            )}

                            {/* Load older / Show less */}
                            {last30Items.length > 0 && (
                                <div className="flex justify-center pb-4">
                                    <button
                                        onClick={() => {
                                            if (showOlder) {
                                                setShowOlder(false);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            } else {
                                                setShowOlder(true);
                                            }
                                        }}
                                        className="px-8 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: '#0d1b2a' }}
                                    >
                                        {showOlder ? 'Show Less ↑' : 'Load Older Activities ↓'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Notifications.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Notifications Center', href: '/notifications' },
    ],
};
