import { createInertiaApp } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Wrap a layout component so it reads breadcrumbs from the page component's
// static `.layout` property (e.g. `Dashboard.layout = { breadcrumbs: [...] }`)
// while still being a persistent layout (same component instance across navigations).
function withBreadcrumbs(
    Layout: React.ComponentType<{ children: ReactNode; breadcrumbs?: BreadcrumbItem[] }>,
) {
    return function PersistentLayout({ children }: { children: ReactNode }) {
        // `children` is the rendered page element; grab breadcrumbs from the
        // page component's static `.layout` property if it exists.
        const pageComponent = (children as any)?.type;
        const breadcrumbs: BreadcrumbItem[] =
            pageComponent?.layout?.breadcrumbs ?? [];
        return <Layout breadcrumbs={breadcrumbs}>{children}</Layout>;
    };
}

const PersistentAppLayout = withBreadcrumbs(AppLayout);

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');
        const page = await pages[`./pages/${name}.tsx`]();
        const component = (page as any).default;

        // If the page has a plain-object `.layout` (our breadcrumb convention),
        // replace it with the persistent layout function so Inertia never
        // remounts the shell between navigations.
        if (component && typeof component.layout !== 'function') {
            if (name === 'welcome') {
                component.layout = null;
            } else if (name.startsWith('auth/')) {
                component.layout = (page: ReactNode) => <AuthLayout>{page}</AuthLayout>;
            } else if (name.startsWith('settings/')) {
                component.layout = (page: ReactNode) => (
                    <PersistentAppLayout>
                        <SettingsLayout>{page}</SettingsLayout>
                    </PersistentAppLayout>
                );
            } else {
                component.layout = (page: ReactNode) => (
                    <PersistentAppLayout>{page}</PersistentAppLayout>
                );
            }
        }

        return page;
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
