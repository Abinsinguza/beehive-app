import { Link } from '@inertiajs/react';
import { BarChart2, Bell, Database, HelpCircle, Hexagon, LayoutGrid, MessageSquareWarning, Mic, ScrollText, Settings, Users } from 'lucide-react';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'Dashboard',  href: dashboard(),      icon: LayoutGrid },
    { title: 'Beekeepers', href: '/beekeepers',    icon: Users },
    { title: 'Hives',            href: '/beehives',          icon: Hexagon },
    { title: 'Audio Recordings', href: '/audio-recordings',  icon: Mic },
    { title: 'Alerts & Logs', href: '/alerts', icon: Bell },
    { title: 'Advisories',   href: '/advisories', icon: MessageSquareWarning },
    { title: 'Analytics & Reports', href: '/analytics', icon: BarChart2 },
    { title: 'System Logs',         href: '/system-logs', icon: ScrollText },
];

const bottomNavItems: NavItem[] = [
    { title: 'Database Schema', href: '/database-schema', icon: Database },
    { title: 'Settings',        href: '/system-config',   icon: Settings },
    { title: 'Notifications',   href: '/notifications',   icon: Bell },
    // { title: 'Help',            href: '/help',            icon: HelpCircle },
];

function SidebarNavItem({ item }: { item: NavItem }) {
    const { isCurrentUrl } = useCurrentUrl();
    const active = isCurrentUrl(item.href);

    return (
        <Link
            href={item.href}
            prefetch
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors border-l-2 ${
                active
                    ? 'border-[#f5a623] text-[#f5a623]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
        >
            {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
            <span>{item.title}</span>
        </Link>
    );
}

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            {/* Logo */}
            <SidebarHeader className="px-4 py-5" style={{ backgroundColor: '#0d1b2a' }}>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href={dashboard()} prefetch className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                                style={{ backgroundColor: '#f5a623' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-5 h-5" fill="#0d1b2a">
                                    <ellipse cx="32" cy="36" rx="14" ry="18" />
                                    <ellipse cx="32" cy="18" rx="8" ry="9" />
                                    <line x1="32" y1="27" x2="32" y2="18" stroke="#f5a623" strokeWidth="2" />
                                    <ellipse cx="20" cy="30" rx="10" ry="5" fill="#0d1b2a" fillOpacity="0.5" transform="rotate(-30 20 30)" />
                                    <ellipse cx="44" cy="30" rx="10" ry="5" fill="#0d1b2a" fillOpacity="0.5" transform="rotate(30 44 30)" />
                                    <line x1="24" y1="36" x2="40" y2="36" stroke="#f5a623" strokeWidth="2" />
                                    <line x1="22" y1="42" x2="42" y2="42" stroke="#f5a623" strokeWidth="2" />
                                </svg>
                            </div>
                            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="text-base font-bold" style={{ color: '#f5a623' }}>BSADS</span>
                                <span className="text-[10px] uppercase tracking-widest" style={{ color: '#64748b' }}>Bee Swarming &amp; Abscondence Detection System</span>
                            </div>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Main nav */}
            <SidebarContent className="py-4" style={{ backgroundColor: '#0d1b2a' }}>
                <nav className="flex flex-col gap-0.5">
                    {mainNavItems.map((item) => (
                        <SidebarNavItem key={item.title} item={item} />
                    ))}
                </nav>

                <div className="mt-auto pt-4 border-t mx-4" style={{ borderColor: '#1e3a5f' }}>
                    {bottomNavItems.map((item) => (
                        <SidebarNavItem key={item.title} item={item} />
                    ))}
                </div>
            </SidebarContent>

            {/* User */}
            <SidebarFooter className="border-t" style={{ backgroundColor: '#0d1b2a', borderColor: '#1e3a5f' }}>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
