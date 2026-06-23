import { Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, Bell, Hexagon, LayoutGrid, Menu, Search, Settings, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Beehive   = { id: string; hive_location: string; hive_type: string; current_state: string };
type AlertItem = { id: number; alert_id: string; alert_type: string; advisory?: { condition_label: string } };

type DashboardFeature = {
    id: string;
    title: string;
    desc: string;
    action: 'scroll' | 'navigate' | 'modal';
    target: string; // element id, url, or modal name
};

type Props = { breadcrumbs?: BreadcrumbItem[] };

// Server-side search pages
const serverSearchConfig: Record<string, { placeholder: string; route: string }> = {
    beekeepers: { placeholder: 'Search beekeepers…', route: '/beekeepers' },
    advisories: { placeholder: 'Search advisories…', route: '/advisories' },
    alerts:     { placeholder: 'Search alerts…',     route: '/alerts'     },
};

const statusColors: Record<string, string> = {
    active:   '#22c55e',
    inactive: '#94a3b8',
    migrated: '#f5a623',
    lost:     '#ef4444',
};

// All searchable dashboard features
const dashboardFeatures: DashboardFeature[] = [
    { id: 'df-1', title: 'Seasonal Forecast Active',            desc: 'AI-generated 48-hour swarming risk prediction',       action: 'scroll',    target: 'section-forecast'   },
    { id: 'df-2', title: 'Acoustic Swarm Frequency Analysis',   desc: 'Real-time acoustic frequency chart',                  action: 'scroll',    target: 'section-chart'      },
    { id: 'df-3', title: 'Swarm Risk Factor',                   desc: 'Regional aggregate swarm risk percentage',            action: 'scroll',    target: 'section-risk'       },
    { id: 'df-4', title: 'Critical Alerts',                     desc: 'Active hive alerts requiring attention',              action: 'scroll',    target: 'section-alerts'     },
    { id: 'df-5', title: 'Export Report',                       desc: 'Download hive activity report as PDF or CSV',         action: 'modal',     target: 'export'             },
    { id: 'df-6', title: 'Hive Locator',                        desc: 'View all hives on the map',                          action: 'modal',     target: 'locator'            },
    { id: 'df-7', title: 'View All Incidents',                  desc: 'Full list of all hive alerts and logs',               action: 'navigate',  target: '/alerts'            },
    { id: 'df-8', title: 'Beekeeper Management',                desc: 'Manage registered beekeepers',                       action: 'navigate',  target: '/beekeepers'        },
    { id: 'df-9', title: 'Hive Inventory',                      desc: 'Manage and monitor all hives',                       action: 'navigate',  target: '/beehives'          },
    { id: 'df-10', title: 'Analytics & Reports',                desc: 'View inference analytics and trends',                action: 'navigate',  target: '/analytics'         },
    { id: 'df-11', title: 'Alerts & Logs',                      desc: 'System activity logs and alert history',             action: 'navigate',  target: '/alerts'            },
    { id: 'df-12', title: 'System Settings',                    desc: 'Configure AI models, API keys and alert routing',    action: 'navigate',  target: '/system-config'     },
];

// Custom event to trigger dashboard modal/scroll from header
function dispatchDashboardAction(action: string, target: string) {
    window.dispatchEvent(new CustomEvent('dashboard-search-action', { detail: { action, target } }));
}

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth, ziggy, searchData } = page.props as any;

    const beehives: Beehive[]   = searchData?.beehives ?? [];
    const alerts: AlertItem[]   = searchData?.alerts   ?? [];

    const currentPath: string = (ziggy?.location ?? window.location.pathname).replace(/^https?:\/\/[^/]+/, '');
    const segment = currentPath.split('/').filter(Boolean)[0] ?? '';
    const isDashboard = segment === '' || segment === 'dashboard';

    const [query, setQuery] = useState('');
    const [open, setOpen]   = useState(false);
    const wrapperRef        = useRef<HTMLDivElement>(null);

    useEffect(() => { setQuery(''); setOpen(false); }, [segment]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setOpen(val.trim().length > 0);
        if (serverSearchConfig[segment]) {
            router.get(serverSearchConfig[segment].route, { search: val }, { preserveState: true, replace: true });
        }
    };

    const q = query.trim().toLowerCase();

    // Dashboard features — only shown when on dashboard or searching globally
    const matchedFeatures: DashboardFeature[] = q
        ? dashboardFeatures.filter((f) =>
            f.title.toLowerCase().includes(q) ||
            f.desc.toLowerCase().includes(q)
          ).slice(0, 5)
        : [];

    const matchedHives = q
        ? beehives.filter((h) =>
            h.id.toLowerCase().includes(q) ||
            h.hive_location.toLowerCase().includes(q) ||
            h.current_state.toLowerCase().includes(q) ||
            h.hive_type.toLowerCase().includes(q)
          ).slice(0, 5)
        : [];

    const matchedAlerts = q
        ? alerts.filter((a) =>
            a.alert_id?.toLowerCase().includes(q) ||
            a.alert_type?.toLowerCase().includes(q) ||
            (a.advisory?.condition_label ?? '').toLowerCase().includes(q)
          ).slice(0, 5)
        : [];

    const hasResults = matchedFeatures.length > 0 || matchedHives.length > 0 || matchedAlerts.length > 0;

    const placeholder = serverSearchConfig[segment]?.placeholder ?? 'Search hives, alerts, features…';

    const handleFeatureClick = (feature: DashboardFeature) => {
        setOpen(false);
        setQuery('');

        if (feature.action === 'navigate') {
            router.visit(feature.target);
            return;
        }

        if (feature.action === 'scroll') {
            if (isDashboard) {
                // Already on dashboard — scroll directly
                const el = document.getElementById(feature.target);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // Navigate to dashboard with hash
                router.visit(`/dashboard#${feature.target}`);
            }
            return;
        }

        if (feature.action === 'modal') {
            if (isDashboard) {
                dispatchDashboardAction('modal', feature.target);
            } else {
                router.visit(`/dashboard?open=${feature.target}`);
            }
        }
    };

    const crumbs = breadcrumbs.length > 0 ? breadcrumbs : [{ title: 'Admin Dashboard', href: dashboard() }];

    return (
        <div className="flex items-center h-14 px-4 lg:px-6 bg-white border-b border-gray-200 gap-2 lg:gap-4">
            {/* Hamburger menu - mobile only */}
            <SidebarTrigger className="lg:hidden" />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm font-semibold truncate">
                {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                        <span key={i} className="flex items-center gap-2">
                            {i > 0 && <span className="text-gray-400">/</span>}
                            {isLast && crumbs.length > 1 ? (
                                <span style={{ color: '#f5a623' }}>{crumb.title}</span>
                            ) : (
                                <Link href={crumb.href} className="hover:opacity-80 transition-opacity" style={{ color: '#0d1b2a' }}>
                                    {crumb.title}
                                </Link>
                            )}
                        </span>
                    );
                })}
            </div>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">

                {/* Search - full width on mobile, fixed on desktop */}
                <div className="relative hidden sm:block" ref={wrapperRef}>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 w-48 lg:w-64">
                        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={handleChange}
                            onFocus={() => { if (query.trim()) setOpen(true); }}
                            placeholder={placeholder}
                            className="flex-1 text-xs bg-transparent outline-none text-gray-400 placeholder-gray-400"
                        />
                        {query && (
                            <button onClick={() => { setQuery(''); setOpen(false); }} className="text-gray-400 hover:text-gray-800 text-xs">✕</button>
                        )}
                    </div>

                    {/* Dropdown */}
                    {open && (
                        <div className="absolute right-0 top-full mt-1.5 w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                            {!hasResults ? (
                                <div className="px-4 py-6 text-center text-xs text-gray-400">
                                    No results found for <span className="font-semibold" style={{ color: '#0d1b2a' }}>"{query}"</span>
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto">

                                    {/* Pages & Features section */}
                                    {matchedFeatures.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pages & Features</span>
                                            </div>
                                            {matchedFeatures.map((feature) => (
                                                <button
                                                    key={feature.id}
                                                    onClick={() => handleFeatureClick(feature)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                                        style={{ backgroundColor: '#fff7ed' }}>
                                                        {feature.action === 'navigate' ? (
                                                            <LayoutGrid className="w-3.5 h-3.5" style={{ color: '#f5a623' }} />
                                                        ) : feature.action === 'modal' ? (
                                                            <Settings className="w-3.5 h-3.5" style={{ color: '#f5a623' }} />
                                                        ) : (
                                                            <Search className="w-3.5 h-3.5" style={{ color: '#f5a623' }} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold truncate" style={{ color: '#0d1b2a' }}>{feature.title}</p>
                                                        <p className="text-[10px] text-gray-400 truncate">{feature.desc}</p>
                                                    </div>
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-gray-100 text-gray-400 shrink-0">
                                                        {feature.action === 'navigate' ? 'page' : feature.action === 'modal' ? 'action' : 'scroll'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Hives section */}
                                    {matchedHives.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hives</span>
                                            </div>
                                            {matchedHives.map((hive) => (
                                                <Link
                                                    key={hive.id}
                                                    href="/beehives"
                                                    onClick={() => { setOpen(false); setQuery(''); }}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                                        style={{ backgroundColor: '#f1f5f9' }}>
                                                        <Hexagon className="w-3.5 h-3.5 text-gray-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold truncate" style={{ color: '#0d1b2a' }}>{hive.id}</p>
                                                        <p className="text-[10px] text-gray-400 truncate">{hive.hive_location}</p>
                                                    </div>
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
                                                        style={{
                                                            backgroundColor: statusColors[hive.current_state] ? `${statusColors[hive.current_state]}20` : '#f1f5f9',
                                                            color: statusColors[hive.current_state] ?? '#64748b',
                                                        }}>
                                                        {hive.current_state}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Alerts section */}
                                    {matchedAlerts.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Alerts</span>
                                            </div>
                                            {matchedAlerts.map((alert) => {
                                                const isCritical = alert.alert_type === 'Critical' || alert.alert_type === 'Threat';
                                                return (
                                                    <Link
                                                        key={alert.id}
                                                        href="/alerts"
                                                        onClick={() => { setOpen(false); setQuery(''); }}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                                            style={{ backgroundColor: isCritical ? '#fff7ed' : '#f1f5f9' }}>
                                                            <AlertTriangle className="w-3.5 h-3.5" style={{ color: isCritical ? '#f5a623' : '#94a3b8' }} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold truncate" style={{ color: '#0d1b2a' }}>
                                                                {alert.advisory?.condition_label ?? alert.alert_type}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 truncate">{alert.alert_id}</p>
                                                        </div>
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
                                                            style={{
                                                                backgroundColor: isCritical ? '#0d1b2a' : '#f1f5f9',
                                                                color: isCritical ? '#ffffff' : '#64748b',
                                                            }}>
                                                            {alert.alert_type}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">
                                    {matchedFeatures.length + matchedHives.length + matchedAlerts.length} result{matchedFeatures.length + matchedHives.length + matchedAlerts.length !== 1 ? 's' : ''}
                                </span>
                                <div className="flex gap-3">
                                    <Link href="/beehives" onClick={() => { setOpen(false); setQuery(''); }} className="text-[10px] font-semibold hover:underline" style={{ color: '#f5a623' }}>
                                        All Hives →
                                    </Link>
                                    <Link href="/alerts" onClick={() => { setOpen(false); setQuery(''); }} className="text-[10px] font-semibold hover:underline" style={{ color: '#0d1b2a' }}>
                                        All Alerts →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bell */}
                <Link href="/notifications" className="hidden sm:block p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <Bell className="w-5 h-5" />
                </Link>

                {/* User */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                            <User className="w-5 h-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        {auth.user && <UserMenuContent user={auth.user} />}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Settings */}
                <Link href="/system-config" className="hidden sm:block p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <Settings className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}
