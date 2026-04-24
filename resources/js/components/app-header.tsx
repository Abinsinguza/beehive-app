import { Link, usePage } from '@inertiajs/react';
import { Bell, Search, Settings, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

export function AppHeader({ breadcrumbs = [] }: Props) {
    const { auth } = usePage().props;

    // Build breadcrumb display: first item is plain text, last item is orange
    const crumbs = breadcrumbs.length > 0 ? breadcrumbs : [{ title: 'Admin Dashboard', href: dashboard() }];

    return (
        <div className="flex items-center h-14 px-6 bg-white border-b border-gray-200 gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm font-semibold">
                {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                        <span key={i} className="flex items-center gap-2">
                            {i > 0 && <span className="text-gray-300">/</span>}
                            {isLast && crumbs.length > 1 ? (
                                <span style={{ color: '#f5a623' }}>{crumb.title}</span>
                            ) : (
                                <Link
                                    href={crumb.href}
                                    className="hover:opacity-80 transition-opacity"
                                    style={{ color: '#0d1b2a' }}
                                >
                                    {crumb.title}
                                </Link>
                            )}
                        </span>
                    );
                })}
            </div>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 w-48">
                    <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search Hives..."
                        className="flex-1 text-xs bg-transparent outline-none text-gray-500 placeholder-gray-400"
                    />
                </div>

                {/* Bell */}
                <Link href="/notifications" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <Bell className="w-5 h-5" />
                </Link>

                {/* User */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                            <User className="w-5 h-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        {auth.user && <UserMenuContent user={auth.user} />}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Settings */}
                <Link href="/system-config" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                    <Settings className="w-5 h-5" />
                </Link>
            </div>
        </div>
    );
}
