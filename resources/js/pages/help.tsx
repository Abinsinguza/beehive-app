import { Head } from '@inertiajs/react';
import { Cpu, MessageSquare, Rocket, Search, Settings2, Ticket } from 'lucide-react';

const topics = [
    {
        badge: 'GUIDE',
        icon: Rocket,
        title: 'Getting Started',
        desc: 'New to SwarmIntel? Learn the basics of bee behavior monitoring and dashboard navigation.',
        links: ['Account Configuration', 'First API Connection', 'Dashboard Personalization'],
    },
    {
        badge: 'TECHNICAL',
        icon: Settings2,
        title: 'Hardware Setup',
        desc: 'Step-by-step assembly and installation for hive monitoring equipment.',
        links: ['Node Installation', 'Gateway Configuration', 'Battery Maintenance'],
    },
    {
        badge: 'ALGORITHMS',
        icon: Cpu,
        title: 'AI FAQ',
        desc: 'Understanding our swarm prediction models and acoustic frequency analysis.',
        links: ['Interpreting Sound Peaks', 'Prediction Confidence Ratings', 'Custom Alert Thresholds'],
    },
];

export default function Help() {
    return (
        <>
            <Head title="Help" />
            <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="p-6 flex flex-col gap-6">

                    {/* Hero */}
                    <div className="rounded-xl px-8 py-10" style={{ backgroundColor: '#0d1b2a' }}>
                        <h1 className="text-2xl font-bold text-white">How can we help you today?</h1>
                        <p className="text-sm mt-2 max-w-xl leading-relaxed" style={{ color: '#94a3b8' }}>
                            Access technical documentation, hive setup guides, and swarm prediction troubleshooting from our comprehensive knowledge base.
                        </p>
                        <div className="flex mt-6 max-w-xl">
                            <input
                                type="text"
                                placeholder="Search for 'Swarm Detection' or 'Hive Maintenance..."
                                className="flex-1 px-4 py-3 text-sm rounded-l-lg outline-none bg-white text-gray-700 placeholder-gray-400"
                            />
                            <button
                                className="flex items-center gap-2 px-5 py-3 rounded-r-lg text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shrink-0"
                                style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                            >
                                <Search className="w-4 h-4" />
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Topic cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {topics.map((t) => (
                            <div key={t.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <t.icon className="w-6 h-6 text-gray-400" />
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-widest" style={{ backgroundColor: '#0d1b2a' }}>
                                        {t.badge}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-bold text-base" style={{ color: '#0d1b2a' }}>{t.title}</p>
                                    <div className="h-0.5 w-10 mt-1 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{t.desc}</p>
                                </div>
                                <ul className="flex flex-col gap-2 flex-1">
                                    {t.links.map((l) => (
                                        <li key={l} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                                            <span className="text-gray-400 font-bold">›</span> {l}
                                        </li>
                                    ))}
                                </ul>
                                <button className="mt-2 w-full py-2.5 rounded-lg border border-gray-300 text-xs font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-colors">
                                    Explore Topic
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Critical Support Resources */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-base" style={{ color: '#0d1b2a' }}>Critical Support Resources</h2>
                            <button className="text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-600">
                                View All Articles
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Featured article — dark image card */}
                            <div className="md:col-span-2 relative rounded-xl overflow-hidden" style={{ minHeight: '240px', backgroundColor: '#0a1628' }}>
                                {/* Simulated screen/laptop background */}
                                <div className="absolute inset-0">
                                    <div className="absolute inset-0 opacity-30"
                                        style={{
                                            background: 'linear-gradient(135deg, #0d2a4a 0%, #0a1628 40%, #061020 100%)',
                                        }}
                                    />
                                    {/* Decorative grid lines to simulate screen */}
                                    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4a9eff" strokeWidth="0.5"/>
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#grid)" />
                                    </svg>
                                    {/* Simulated monitor shape */}
                                    <div className="absolute top-4 right-8 w-48 h-32 rounded-lg opacity-20 border border-blue-400"
                                        style={{ backgroundColor: '#1a3a5c' }}>
                                        <div className="m-2 h-2 w-16 rounded bg-blue-300 opacity-50" />
                                        <div className="m-2 h-1 w-24 rounded bg-blue-300 opacity-30" />
                                        <div className="m-2 h-1 w-20 rounded bg-blue-300 opacity-30" />
                                        <div className="m-2 h-1 w-28 rounded bg-blue-300 opacity-30" />
                                    </div>
                                </div>
                                <div className="relative p-6 flex flex-col justify-end h-full" style={{ minHeight: '240px' }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-widest" style={{ backgroundColor: '#f5a623' }}>
                                            New Update
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-500 text-slate-300 uppercase tracking-widest">
                                            Firmware V4.2.0
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white leading-snug">
                                        Optimising Hive Monitoring for Accurate Swarm Detection
                                    </h3>
                                    <p className="text-xs mt-2 leading-relaxed" style={{ color: '#94a3b8' }}>
                                        A comprehensive guide on environmental noise filtering and frequency isolation for accurate colony acoustics.
                                    </p>
                                </div>
                            </div>

                            {/* Quick access cards */}
                            <div className="flex flex-col gap-4">
                                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-1 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-r border-t border-b" style={{ borderLeftColor: '#f5a623', borderRightColor: '#e5e7eb', borderTopColor: '#e5e7eb', borderBottomColor: '#e5e7eb' }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quick Access</p>
                                    <p className="text-sm font-semibold leading-snug" style={{ color: '#0d1b2a' }}>Emergency Alert Response Protocols</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">What to do within the first 60 minutes of a high-risk swarm alert.</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-1 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-r border-t border-b" style={{ borderLeftColor: '#f5a623', borderRightColor: '#e5e7eb', borderTopColor: '#e5e7eb', borderBottomColor: '#e5e7eb' }}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tutorial</p>
                                    <p className="text-sm font-semibold leading-snug" style={{ color: '#0d1b2a' }}>Exporting Hive Logs for Reporting</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">Generating PDF and CSV reports for agricultural tax compliance.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Still need assistance */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 flex items-center justify-between gap-6 flex-wrap">
                        <div>
                            <p className="font-bold text-base" style={{ color: '#0d1b2a' }}>Still need assistance?</p>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm leading-relaxed">
                                Our expert technical support team is available 24/7 for commercial enterprise clients. We'll help you get your apiary back online.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: '#0d1b2a', color: 'white' }}
                            >
                                <Ticket className="w-4 h-4" />
                                Open Ticket
                            </button>
                            <button className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                Live Chat
                            </button>
                        </div>
                    </div>

                </div>

                {/* FAB */}
                <button
                    className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity text-lg font-bold"
                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                >
                    ?
                </button>
            </div>
        </>
    );
}

Help.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
    ],
};
