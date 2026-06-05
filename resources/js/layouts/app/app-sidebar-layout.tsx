import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    const { url } = usePage();
    const isDashboard = url === '/dashboard' || url.startsWith('/dashboard?') || url.startsWith('/dashboard#');

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                {isDashboard && <AppHeader breadcrumbs={breadcrumbs} />}
                {children}
            </AppContent>
        </AppShell>
    );
}
