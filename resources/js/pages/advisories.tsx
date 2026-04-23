import { Head, useForm } from '@inertiajs/react';
import { MessageSquareWarning, Plus, X } from 'lucide-react';
import { useState } from 'react';

type Advisory = {
    id: number;
    prediction_code: number;
    condition_label: string;
    advisory_text: string;
    severity: string;
};

const severityConfig: Record<string, { label: string; classes: string }> = {
    low:      { label: 'Low',      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    medium:   { label: 'Medium',   classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    high:     { label: 'High',     classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    critical: { label: 'Critical', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function Advisories({ advisories = [] }: { advisories?: Advisory[] }) {
    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, reset, processing, errors } = useForm({
        prediction_code: '',
        condition_label: '',
        advisory_text: '',
        severity: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/advisories', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    return (
        <>
            <Head title="Advisories" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Advisories</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {advisories.length} advisor{advisories.length !== 1 ? 'ies' : 'y'} registered
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Advisory
                    </button>
                </div>

                {/* Content */}
                {advisories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
                        <div className="rounded-full bg-amber-50 dark:bg-amber-900/20 p-4 mb-3">
                            <MessageSquareWarning className="h-8 w-8 text-amber-400" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No advisories yet</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Get started by adding your first advisory</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            <Plus className="h-4 w-4" /> Add Advisory
                        </button>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Advisory Text</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {advisories.map((advisory) => {
                                    const sev = severityConfig[advisory.severity] ?? severityConfig.low;
                                    return (
                                        <tr key={advisory.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-4 font-medium text-foreground">{advisory.prediction_code}</td>
                                            <td className="px-5 py-4 text-foreground">{advisory.condition_label}</td>
                                            <td className="px-5 py-4 text-muted-foreground max-w-sm truncate">{advisory.advisory_text}</td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${sev.classes}`}>
                                                    {sev.label}
                                                </span>
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
                            <h2 className="text-base font-semibold text-foreground">Add New Advisory</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Prediction Code</label>
                                <input
                                    type="number"
                                    value={data.prediction_code}
                                    onChange={(e) => setData('prediction_code', e.target.value)}
                                    placeholder="e.g. 1042"
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                                {errors.prediction_code && <p className="text-xs text-red-500">{errors.prediction_code}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Condition Label</label>
                                <input
                                    type="text"
                                    value={data.condition_label}
                                    onChange={(e) => setData('condition_label', e.target.value)}
                                    placeholder="e.g. Colony Collapse"
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                                {errors.condition_label && <p className="text-xs text-red-500">{errors.condition_label}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Advisory Text</label>
                                <textarea
                                    value={data.advisory_text}
                                    onChange={(e) => setData('advisory_text', e.target.value)}
                                    placeholder="Describe the advisory recommendation…"
                                    rows={3}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                    required
                                />
                                {errors.advisory_text && <p className="text-xs text-red-500">{errors.advisory_text}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Severity</label>
                                <select
                                    value={data.severity}
                                    onChange={(e) => setData('severity', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="" disabled>Select severity level</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                                {errors.severity && <p className="text-xs text-red-500">{errors.severity}</p>}
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
                                    {processing ? 'Saving…' : 'Save Advisory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Advisories.layout = {
    breadcrumbs: [{ title: 'Advisories', href: '/advisories' }],
};
