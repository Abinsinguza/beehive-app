import { Head, useForm } from '@inertiajs/react';
import { BrainCircuit, Plus, X } from 'lucide-react';
import { useState } from 'react';

type Beehive = { id: string; hive_location: string };

type Inference = {
    id: number;
    hive_id: string;
    prediction: string;
    confidence_score: number;
    inference_latency: number;
    analyzed_at: string;
    beehive: { id: string; hive_location: string };
};

const predictionConfig: Record<string, { label: string; classes: string }> = {
    Normal:      { label: 'Normal',      classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'Pre-swarm': { label: 'Pre-swarm',   classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    Swarm:       { label: 'Swarm',       classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    Abscondment: { label: 'Abscondment', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    Uncertain:   { label: 'Uncertain',   classes: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
};

export default function Inferences({
    inferences = [],
    beehives = [],
}: {
    inferences?: Inference[];
    beehives?: Beehive[];
}) {
    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, reset, processing, errors } = useForm({
        hive_id: '',
        prediction: '',
        confidence_score: '',
        inference_latency: '',
        analyzed_at: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inferences', { onSuccess: () => { reset(); setShowModal(false); } });
    };

    return (
        <>
            <Head title="ML Inferences" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">ML Inferences</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {inferences.length} inference{inferences.length !== 1 ? 's' : ''} recorded
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Inference
                    </button>
                </div>

                {/* Content */}
                {inferences.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-20 text-center">
                        <div className="rounded-full bg-amber-50 dark:bg-amber-900/20 p-4 mb-3">
                            <BrainCircuit className="h-8 w-8 text-amber-400" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No inferences yet</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">
                            Inference results from the ML model will appear here
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            <Plus className="h-4 w-4" /> Add Inference
                        </button>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hive</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prediction</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confidence</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latency (ms)</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analyzed At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {inferences.map((inf) => {
                                    const pred = predictionConfig[inf.prediction] ?? predictionConfig.Uncertain;
                                    return (
                                        <tr key={inf.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-4 font-medium text-foreground">
                                                {inf.beehive?.hive_location ?? inf.hive_id}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pred.classes}`}>
                                                    {pred.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">
                                                {inf.confidence_score.toFixed(1)}%
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">
                                                {inf.inference_latency.toFixed(2)} ms
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">
                                                {new Date(inf.analyzed_at).toLocaleString()}
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
                            <h2 className="text-base font-semibold text-foreground">Add Inference Result</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Beehive</label>
                                <select
                                    value={data.hive_id}
                                    onChange={(e) => setData('hive_id', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="" disabled>Select a hive</option>
                                    {beehives.map((h) => (
                                        <option key={h.id} value={h.id}>{h.hive_location} ({h.id})</option>
                                    ))}
                                </select>
                                {errors.hive_id && <p className="text-xs text-red-500">{errors.hive_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Prediction</label>
                                <select
                                    value={data.prediction}
                                    onChange={(e) => setData('prediction', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                >
                                    <option value="" disabled>Select prediction</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Pre-swarm">Pre-swarm</option>
                                    <option value="Swarm">Swarm</option>
                                    <option value="Abscondment">Abscondment</option>
                                    <option value="Uncertain">Uncertain</option>
                                </select>
                                {errors.prediction && <p className="text-xs text-red-500">{errors.prediction}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Confidence Score (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={data.confidence_score}
                                        onChange={(e) => setData('confidence_score', e.target.value)}
                                        placeholder="e.g. 94.7"
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        required
                                    />
                                    {errors.confidence_score && <p className="text-xs text-red-500">{errors.confidence_score}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Latency (ms)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.inference_latency}
                                        onChange={(e) => setData('inference_latency', e.target.value)}
                                        placeholder="e.g. 123.45"
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        required
                                    />
                                    {errors.inference_latency && <p className="text-xs text-red-500">{errors.inference_latency}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Analyzed At</label>
                                <input
                                    type="datetime-local"
                                    value={data.analyzed_at}
                                    onChange={(e) => setData('analyzed_at', e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                                {errors.analyzed_at && <p className="text-xs text-red-500">{errors.analyzed_at}</p>}
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
                                    {processing ? 'Saving…' : 'Save Inference'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Inferences.layout = {
    breadcrumbs: [{ title: 'ML Inferences', href: '/inferences' }],
};
