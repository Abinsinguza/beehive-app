import { Link, usePage } from '@inertiajs/react';
import { Settings, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Props = { breadcrumbs?: BreadcrumbItem[] };

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props as any;

    const crumbs = breadcrumbs.length > 0 ? breadcrumbs : [{ title: 'Admin Dashboard', href: dashboard() }];
    const pageTitle = crumbs[crumbs.length - 1].title;

    return (
        <div className="flex items-center h-14 px-4 lg:px-6 bg-white border-b border-gray-200 gap-2 lg:gap-4">
            {/* Hamburger menu - mobile only */}
            <SidebarTrigger className="lg:hidden" />

            {/* Page title */}
            <span className="text-sm font-semibold truncate" style={{ color: '#0d1b2a' }}>{pageTitle}</span>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">

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
