import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, Package, Shield, Users } from 'lucide-react';
import { dashboard, login, register } from '@/routes';
import BeeLogoIcon from '@/components/bee-logo-icon';

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage().props;

    const features = [
        { icon: Users, title: 'Beekeeper Profiles', desc: 'Manage all your beekeepers with contact info and hive assignments in one place.' },
        { icon: Package, title: 'Hive Tracking', desc: 'Track every hive by location, type, installation date, and current state.' },
        { icon: Activity, title: 'Live Status', desc: 'Monitor active, inactive, migrated, and lost hives at a glance.' },
        { icon: Shield, title: 'Secure Access', desc: 'Role-based access keeps your data safe and organized.' },
    ];

    return (
        <>
            <Head title="Welcome to BSADS">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-foreground">
                {/* Nav */}
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                            <BeeLogoIcon className="h-5 w-5 fill-current text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-foreground">BSADS</span>
                    </div>
                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <>
                                <Link href={dashboard()} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/beekeepers" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
                                    Beekeepers
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href={login()} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link href={register()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
                                        Get started
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                {/* Hero */}
                <section className="mx-auto max-w-6xl px-6 py-20 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-200 dark:shadow-amber-900/30">
                        <BeeLogoIcon className="h-11 w-11 fill-current text-white" />
                    </div>
                    <h1 className="mx-auto max-w-2xl text-5xl font-bold tracking-tight text-foreground leading-tight">
                        Beekeeping Management,{' '}
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                            simplified
                        </span>
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
                        BSADS helps you manage beekeepers, track hives, and monitor colony health — all from one clean dashboard.
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        {auth.user ? (
                            <Link href={dashboard()} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30 hover:opacity-90 transition-opacity">
                                Go to Dashboard →
                            </Link>
                        ) : (
                            <>
                                {canRegister && (
                                    <Link href={register()} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30 hover:opacity-90 transition-opacity">
                                        Get started free
                                    </Link>
                                )}
                                <Link href={login()} className="rounded-xl border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                                    Log in
                                </Link>
                            </>
                        )}
                    </div>
                </section>

                {/* Features */}
                <section className="mx-auto max-w-6xl px-6 pb-24">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((f) => (
                            <div key={f.title} className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                    <f.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} BSADS · Beekeeping System Administration
                </footer>
            </div>
        </>
    );
}
