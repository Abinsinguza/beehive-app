import { Head } from '@inertiajs/react';
import { AlertTriangle, Battery, Bell, MessageSquare, Plus, Settings2, Shield, Users } from 'lucide-react';

type NotificationItem = {
    id: number;
    type: 'alert' | 'team' | 'system' | 'battery';
    title: string;
    body: string;
    time: string;
    actions?: { label: string; style: 'primary' | 'link' }[];
    tag?: string;
    user?: string;
    userRole?: string;
    borderColor: string;
};

const todayNotifications: NotificationItem[] = [
    {
        id: 1,
        type: 'alert',
        title: 'Critical Swarm Warning: BH0004',
        body: 'Acoustic frequency analysis indicates imminent swarming behavior (452Hz detected). Temperature has risen by 2.4°C in the last 15 minutes.',
        time: '2 mins ago',
        actions: [
            { label: 'Dispatch Team', style: 'primary' },
        ],
        borderColor: '#ef4444',
    },
];

const yesterdayNotifications: NotificationItem[] = [
    {
        id: 3,
        type: 'system',
        title: 'System Update: v4.2',
        body: 'BSADS system successfully updated to v4.2.0. ML classification model performance improved by 12%.',
        time: '22 hours ago',
        tag: 'SYSTEM LOG',
        borderColor: '#94a3b8',
    },
    {
        id: 4,
        type: 'battery',
        title: 'Battery Alert: BH0005',
        body: 'Microphone battery at 15%. Audio recording at risk. Replace battery soon to maintain hive monitoring.',
        time: 'Yesterday at 4:30 PM',
        actions: [{ label: 'Schedule Replacement', style: 'link' }],
        borderColor: '#f5a623',
    },
];

const categories = [
    { label: 'All Activities', count: 12, icon: Bell, active: true },
    { label: 'Alerts', count: 3, icon: AlertTriangle, active: false },
    { label: 'System', count: 9, icon: Settings2, active: false },
];

function NotifIcon({ type }: { type: NotificationItem['type'] }) {
    const base = 'w-10 h-10 rounded-lg flex items-center justify-center shrink-0';
    if (type === 'alert') return <div className={base} style={{ backgroundColor: '#fef2f2' }}><AlertTriangle className="w-5 h-5 text-red-500" /></div>;
    if (type === 'team') return <div className={base} style={{ backgroundColor: '#f1f5f9' }}><MessageSquare className="w-5 h-5 text-slate-500" /></div>;
    if (type === 'system') return <div className={base} style={{ backgroundColor: '#f1f5f9' }}><Shield className="w-5 h-5 text-slate-400" /></div>;
    return <div className={base} style={{ backgroundColor: '#fff7ed' }}><Battery className="w-5 h-5" style={{ color: '#f5a623' }} /></div>;
}

function NotifCard({ n }: { n: NotificationItem }) {
    return (
        <div className="flex gap-4 py-5 px-6 bg-white border-b border-gray-100 last:border-0">
            <div className="w-1 rounded-full shrink-0 self-stretch" style={{ backgroundColor: n.borderColor }} />
            <NotifIcon type={n.type} />
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>{n.title}</p>
                    <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed"
                    dangerouslySetInnerHTML={{
                        __html: n.body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                    }}
                />
                {n.user && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
                            <Users className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-400">{n.user} • {n.userRole}</span>
                    </div>
                )}
                {n.tag && (
                    <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-gray-200 text-gray-400">
                        {n.tag}
                    </span>
                )}
                {n.actions && n.actions.length > 0 && (
                    <div className="flex items-center gap-3 mt-3">
                        {n.actions.map((a) =>
                            a.style === 'primary' ? (
                                <button key={a.label} className="px-4 py-1.5 rounded-lg text-xs font-semibold border-2 hover:opacity-90 transition-opacity" style={{ borderColor: '#f5a623', color: '#f5a623' }}>
                                    {a.label}
                                </button>
                            ) : (
                                <button key={a.label} className="text-xs font-semibold underline" style={{ color: '#0d1b2a' }}>
                                    {a.label}
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Notifications() {
    return (
        <>
            <Head title="Notifications" />
            <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="p-6 flex flex-col gap-5">

                    {/* Page heading */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-lg font-semibold" style={{ color: '#0d1b2a' }}>Notifications</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Manage and track all hive alerts and system messages.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                                ✓ Mark all read
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                ⚙ Filter Settings
                            </button>
                        </div>
                    </div>

                    {/* Main two-column layout */}
                    <div className="flex gap-5 items-start">

                        {/* Left: Categories + Urgent Tasks */}
                        <div className="w-56 shrink-0 flex flex-col gap-4">

                            {/* Categories */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <p className="text-sm font-semibold mb-3" style={{ color: '#0d1b2a' }}>
                                    Categories
                                    <span className="block w-8 h-0.5 mt-1 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                                </p>
                                <div className="flex flex-col gap-1">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.label}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${cat.active ? 'text-gray-700' : 'text-gray-500 hover:bg-gray-50'}`}
                                            style={cat.active ? { backgroundColor: '#f8f9fa', border: '1px solid #e5e7eb' } : {}}
                                        >
                                            <div className="flex items-center gap-2">
                                                <cat.icon className="w-4 h-4" />
                                                <span>{cat.label}</span>
                                            </div>
                                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${cat.active ? 'text-white' : 'text-gray-400 bg-gray-100'}`}
                                                style={cat.active ? { backgroundColor: '#f5a623' } : {}}>
                                                {cat.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Urgent Tasks */}
                            <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: '#0d1b2a' }}>
                                <p className="text-sm font-bold" style={{ color: '#f5a623' }}>Urgent Tasks</p>
                                <div>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-slate-300">High Priority Response</span>
                                        <span className="font-bold text-white">3 of 3 urgent alerts acknowledged</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-700">
                                        <div className="h-1.5 rounded-full" style={{ width: '85%', backgroundColor: '#f5a623' }} />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    3 critical swarm alerts require immediate beekeeper inspection.
                                </p>
                                <button className="w-full py-2 rounded-lg border border-white text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-gray-900 transition-colors">
                                    View Priority
                                </button>
                            </div>
                        </div>

                        {/* Right: Notification feed */}
                        <div className="flex-1 min-w-0 flex flex-col gap-4">

                            {/* Today */}
                            <div>
                                <p className="text-sm font-semibold text-gray-500 mb-3">Today, June 6, 2026</p>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    {todayNotifications.map((n) => <NotifCard key={n.id} n={n} />)}
                                </div>
                            </div>

                            {/* Yesterday */}
                            <div>
                                <p className="text-sm font-semibold text-gray-500 mb-3">Yesterday, June 5, 2026</p>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    {yesterdayNotifications.map((n) => <NotifCard key={n.id} n={n} />)}
                                </div>
                            </div>

                            {/* Load more */}
                            <div className="flex justify-center pb-4">
                                <button className="px-8 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: '#0d1b2a' }}>
                                    Load Older Activities
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAB */}
                <button
                    className="fixed bottom-6 right-6 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#f5a623' }}
                >
                    <Plus className="w-5 h-5" style={{ color: '#0d1b2a' }} />
                </button>
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
