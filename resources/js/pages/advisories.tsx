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

const severityConfig: Record<string, { label: string; bg: string; color: string }> = {
    low:      { label: 'Low',      bg: '#f0fdf4', color: '#16a34a' },
    medium:   { label: 'Medium',   bg: '#fffbeb', color: '#d97706' },
    high:     { label: 'High',     bg: '#fff7ed', color: '#f5a623' },
    critical: { label: 'Critical', bg: '#0d1b2a', color: '#ffffff' },
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
            <div className="min-h-screen p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Page heading */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>Advisories</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {advisories.length} advisor{advisories.length !== 1 ? 'ies' : 'y'} configured
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                    >
                        <Plus className="w-4 h-4" /> Add Advisory
                    </button>
                </div>

                {/* Content */}
                {advisories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 py-20 text-center shadow-sm">
                        <div className="rounded-full p-4 mb-3" style={{ backgroundColor: '#fff7ed' }}>
                            <MessageSquareWarning className="h-8 w-8" style={{ color: '#f5a623' }} />
                        </div>
                        <p className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>No advisories yet</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">Add your first advisory to get started</p>
                        <button onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                            <Plus className="w-4 h-4" /> Add Advisory
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {['Code', 'Condition', 'Advisory Text', 'Severity'].map((h) => (
                                        <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {advisories.map((adv) => {
                                    const sc = severityConfig[adv.severity] ?? severityConfig.medium;
                                    return (
                                        <tr key={adv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4 font-mono text-xs font-semibold" style={{ color: '#0d1b2a' }}>
                                                #{adv.prediction_code}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-medium" style={{ color: '#0d1b2a' }}>
                                                {adv.condition_label}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-500 max-w-sm">
                                                {adv.advisory_text}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest"
                                                    style={{ backgroundColor: sc.bg, color: sc.color }}>
                                                    {sc.label}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Add Advisory</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Prediction Code</label>
                                <input type="number" value={data.prediction_code} onChange={(e) => setData('prediction_code', e.target.value)}
                                    placeholder="e.g. 1042"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300" required />
                                {errors.prediction_code && <p className="text-xs text-red-500 mt-1">{errors.prediction_code}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Condition Label</label>
                                <input type="text" value={data.condition_label} onChange={(e) => setData('condition_label', e.target.value)}
                                    placeholder="e.g. Pre-Swarm Detected"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300" required />
                                {errors.condition_label && <p className="text-xs text-red-500 mt-1">{errors.condition_label}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Advisory Text</label>
                                <textarea value={data.advisory_text} onChange={(e) => setData('advisory_text', e.target.value)}
                                    placeholder="Describe the advisory action..."
                                    rows={3}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-700 placeholder-gray-300 resize-none" required />
                                {errors.advisory_text && <p className="text-xs text-red-500 mt-1">{errors.advisory_text}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Severity</label>
                                <select value={data.severity} onChange={(e) => setData('severity', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none bg-white" required>
                                    <option value="">Select severity</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                                {errors.severity && <p className="text-xs text-red-500 mt-1">{errors.severity}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={processing}
                                    className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                    {processing ? 'Saving…' : 'Save'}
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
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Advisories', href: '/advisories' },
    ],
};
