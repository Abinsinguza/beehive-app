import { Head, usePage } from '@inertiajs/react';
import { Activity, Package, TrendingUp, Users } from 'lucide-react';
import { dashboard } from '@/routes';

type DashboardProps = {
    stats?: {
        total_beekeepers: number;
        total_beehives: number;
        active_beehives: number;
        inactive_beehives: number;
    };
    recent_beehives?: Array<{
        id: string;
        hive_location: string;
        hive_type: string;
        current_state: string;
        owner: { name: string };
    }>;
};

const stateColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    inactive: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    migrated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function Dashboard({ stats, recent_beehives = [] }: DashboardProps) {
    const { auth } = usePage().props;

    const statCards = [
        {
            label: 'Total Beekeepers',
            value: stats?.total_beekeepers ?? 0,
            icon: Users,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
        },
        {
            label: 'Total Beehives',
            value: stats?.total_beehives ?? 0,
            icon: Package,
            color: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
        },
        {
            label: 'Active Hives',
            value: stats?.active_beehives ?? 0,
            icon: Activity,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        },
        {
            label: 'Inactive Hives',
            value: stats?.inactive_beehives ?? 0,
            icon: TrendingUp,
            color: 'text-zinc-500 dark:text-zinc-400',
            bg: 'bg-zinc-50 dark:bg-zinc-800/50',
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">
                {/* Welcome */}
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Welcome back{auth?.user?.name ? `, ${auth.user.name.split(' ')[0]}` : ''} 👋
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Here's what's happening with your hives today.
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((card) => (
                        <div
                            key={card.label}
                            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                                <div className={`rounded-lg p-2 ${card.bg}`}>
                                    <card.icon className={`h-4 w-4 ${card.color}`} />
                                </div>
                            </div>
                            <p className="mt-3 text-3xl font-bold text-foreground">{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Recent Beehives */}
                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-6 py-4">
                        <h2 className="font-semibold text-foreground">Recent Beehives</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Latest hive activity across all beekeepers</p>
                    </div>
                    {recent_beehives.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="rounded-full bg-amber-50 dark:bg-amber-900/20 p-4 mb-3">
                                <Package className="h-8 w-8 text-amber-400" />
                            </div>
                            <p className="text-sm font-medium text-foreground">No beehives yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Add your first beehive to get started</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {recent_beehives.map((hive) => (
                                <div key={hive.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                            <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{hive.hive_location}</p>
                                            <p className="text-xs text-muted-foreground">{hive.hive_type} · {hive.owner?.name}</p>
                                        </div>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${stateColors[hive.current_state] ?? stateColors.inactive}`}>
                                        {hive.current_state}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
