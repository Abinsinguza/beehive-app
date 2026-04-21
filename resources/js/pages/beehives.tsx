import { Head, useForm } from '@inertiajs/react';
import { MapPin, Package, Plus, X } from 'lucide-react';
import { useState } from 'react';

type Owner = { id: string; name: string };

type Beehive = {
    id: string;
    hive_location: string;
    hive_type: string;
    installation_date: string;
    current_state: string;
    owner: { id: string; name: string };
    created_at: string;
    updated_at: string;
};

const stateConfig: Record<string, { label: string; classes: string }> = {
    active:   { label: 'Active',   classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    inactive: { label: 'Inactive', classes: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
    migrated: { label: 'Migrated', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    lost:     { label: 'Lost',     classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function Beehives({ beehives = [], owners = [] }: { beehives?: Beehive[]; owners?: Owner[] }) {
    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, reset, processing } = useForm({
        owner_id: '',
        hive_location: '',
        hive_type: '',
        installation_date: '',
        current_state: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/beehives', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    return (
        <>
            <Head title="Beehives" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Beehives</h1>
                        <p className="mt-1 text-sm text-muted-foreground">{beehives.length} hive{beehives.length !== 1 ? 's' : ''} registered</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Beehive
                    </button>
                </div>

                {/* Content */}
                {beehives.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
                        <div className="rounded-full bg-amber-50 dark:bg-amber-900/20 p-4 mb-3">
                            <Package className="h-8 w-8 text-amber-400" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No beehives yet</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Get started by adding your first beehive</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            <Plus className="h-4 w-4" /> Add Beehive
                        </button>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Installed</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">State</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owner</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {beehives.map((hive) => {
                                    const state = stateConfig[hive.current_state] ?? stateConfig.inactive;
                                    return (
                                        <tr key={hive.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    <span className="font-medium text-foreground">{hive.hive_location}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">{hive.hive_type}</td>
                                            <td className="px-5 py-4 text-muted-foreground">{hive.installation_date}</td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${state.classes}`}>
                                                    {state.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">{hive.owner?.name}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="text-base font-semibold text-foreground">Add New Beehive</h2>
                            <button onClick={() => setShowModal(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Owner</label>
                                <select
                                    value={data.owner_id}
                                    onChange={(e) => setData('owner_id', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="" disabled>Select a beekeeper</option>
                                    {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Location</label>
                                <input
                                    type="text"
                                    value={data.hive_location}
                                    onChange={(e) => setData('hive_location', e.target.value)}
                                    placeholder="e.g. North Field, Sector B"
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Hive Type</label>
                                <input
                                    type="text"
                                    value={data.hive_type}
                                    onChange={(e) => setData('hive_type', e.target.value)}
                                    placeholder="e.g. Langstroth, Top-bar"
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Installation Date</label>
                                <input
                                    type="date"
                                    value={data.installation_date}
                                    onChange={(e) => setData('installation_date', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Current State</label>
                                <select
                                    value={data.current_state}
                                    onChange={(e) => setData('current_state', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="">Select state</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="migrated">Migrated</option>
                                    <option value="lost">Lost</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                                >
                                    {processing ? 'Saving…' : 'Save Beehive'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Beehives.layout = {
    breadcrumbs: [{ title: 'Beehives', href: '/beehives' }],
};
