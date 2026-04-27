import { Head, useForm, router, usePage } from '@inertiajs/react';
import { AlertCircle, Bell, BellRing, CheckCircle, Plus, X } from 'lucide-react';
import { useState } from 'react';

type Inference = { id: number; prediction: string; beehive?: { hive_location: string } };
type Advisory  = { id: number; condition_label: string; advisory_text: string };

type Alert = {
    id: number;
    alert_id: string;
    inference_id: number;
    advisory_id: number;
    alert_type: string;
    alert_timestamp: string;
    status: 'pending' | 'sent';
    inference?: Inference & { beehive?: { hive_location: string; owner?: { name: string } } };
    advisory?: Advisory;
};

const typeConfig: Record<string, { label: string; classes: string }> = {
    Info:     { label: 'Info',     classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    Warning:  { label: 'Warning',  classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    Critical: { label: 'Critical', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    Threat:   { label: 'Threat',   classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function AlertsPage({
    alerts = [],
    inferences = [],
    advisories = [],
}: {
    alerts?: Alert[];
    inferences?: Inference[];
    advisories?: Advisory[];
}) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [showModal, setShowModal] = useState(false);
    const [notifying, setNotifying] = useState<number | null>(null);

    const { data, setData, post, reset, processing, errors } = useForm({
        inference_id: '',
        advisory_id: '',
        alert_type: '',
        alert_timestamp: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/alerts', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    const handleNotify = (alert: Alert) => {
        setNotifying(alert.id);
        router.patch(`/alerts/${alert.id}/notify`, {}, {
            onFinish: () => setNotifying(null),
        });
    };

    const pending = alerts.filter((a) => a.status === 'pending').length;

    return (
        <>
            <Head title="Alerts" />

            <div className="flex flex-col gap-6 p-6">
                {/* Flash messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Alerts</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                            {pending > 0 && (
                                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    {pending} pending
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Alert
                    </button>
                </div>

                {/* Content */}
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
                        <div className="rounded-full bg-amber-50 dark:bg-amber-900/20 p-4 mb-3">
                            <Bell className="h-8 w-8 text-amber-400" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No alerts yet</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Alerts generated from ML inferences will appear here</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            <Plus className="h-4 w-4" /> Add Alert
                        </button>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alert ID</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hive / Beekeeper</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timestamp</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {alerts.map((alert) => {
                                    const type = typeConfig[alert.alert_type] ?? typeConfig.Info;
                                    const isSent = alert.status === 'sent';
                                    const isNotifying = notifying === alert.id;

                                    return (
                                        <tr key={alert.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-4 font-mono text-xs font-medium text-foreground">
                                                {alert.alert_id}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${type.classes}`}>
                                                    {type.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-foreground">
                                                    {alert.inference?.beehive?.hive_location ?? '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {alert.inference?.beehive?.owner?.name ?? 'Unknown beekeeper'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">
                                                {alert.advisory?.advisory_text ?? '—'}
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                                                {new Date(alert.alert_timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4">
                                                {isSent ? (
                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        Sent
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {!isSent && (
                                                    <button
                                                        onClick={() => handleNotify(alert)}
                                                        disabled={isNotifying}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                                                    >
                                                        <BellRing className="h-3.5 w-3.5" />
                                                        {isNotifying ? 'Sending…' : 'Notify Beekeeper'}
                                                    </button>
                                                )}
                                            </td>
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
                            <h2 className="text-base font-semibold text-foreground">Add New Alert</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Inference</label>
                                <select
                                    value={data.inference_id}
                                    onChange={(e) => setData('inference_id', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="" disabled>Select an inference</option>
                                    {inferences.map((inf) => (
                                        <option key={inf.id} value={inf.id}>
                                            #{inf.id} — {inf.prediction} @ {inf.beehive?.hive_location ?? inf.id}
                                        </option>
                                    ))}
                                </select>
                                {errors.inference_id && <p className="text-xs text-red-500">{errors.inference_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Advisory (Message)</label>
                                <select
                                    value={data.advisory_id}
                                    onChange={(e) => setData('advisory_id', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="" disabled>Select an advisory</option>
                                    {advisories.map((adv) => (
                                        <option key={adv.id} value={adv.id}>
                                            {adv.condition_label} — {adv.advisory_text.substring(0, 50)}…
                                        </option>
                                    ))}
                                </select>
                                {errors.advisory_id && <p className="text-xs text-red-500">{errors.advisory_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Alert Type</label>
                                <select
                                    value={data.alert_type}
                                    onChange={(e) => setData('alert_type', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="" disabled>Select alert type</option>
                                    <option value="Info">Info</option>
                                    <option value="Warning">Warning</option>
                                    <option value="Critical">Critical</option>
                                    <option value="Threat">Threat</option>
                                </select>
                                {errors.alert_type && <p className="text-xs text-red-500">{errors.alert_type}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Timestamp</label>
                                <input
                                    type="datetime-local"
                                    value={data.alert_timestamp}
                                    onChange={(e) => setData('alert_timestamp', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                                {errors.alert_timestamp && <p className="text-xs text-red-500">{errors.alert_timestamp}</p>}
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
                                    {processing ? 'Saving…' : 'Save Alert'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

AlertsPage.layout = {
    breadcrumbs: [{ title: 'Alerts', href: '/alerts' }],
};
