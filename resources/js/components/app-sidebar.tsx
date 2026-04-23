import { Link } from '@inertiajs/react';
import { Bell, BrainCircuit, LayoutGrid, MessageSquareWarningIcon, Package, SlidersHorizontal, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Beekeepers',
        href: '/beekeepers',
        icon: Users,
    },
    {
        title: 'Beehives',
        href: '/beehives',
        icon: Package,
    },
    {
        title: 'Advisory',
        href: '/advisories',
        icon: MessageSquareWarningIcon,
    },
    {
        title: 'ML Inferences',
        href: '/inferences',
        icon: BrainCircuit,
    },
    {
        title: 'Alerts',
        href: '/alerts',
        icon: Bell,
    },
    {
        title: 'System Config',
        href: '/system-config',
        icon: SlidersHorizontal,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
