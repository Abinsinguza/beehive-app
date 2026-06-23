import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import React, { useState, useMemo } from 'react';
import { FileBarChart2, FlaskConical, Hexagon, X } from 'lucide-react';
import { type MRT_ColumnDef } from 'material-react-table';
import { DataTable } from '@/components/data-table';
import { toSentenceCase } from '@/lib/format-text';

type Beehive = {
    hive_id: string;
    hive_name: string;
    hive_location: string;
};

type Inference = {
    inference_id: string;
    hive_id: string;
    audio_id: string | null;
    hive_state: string;
    confidence_score: number;
    inference_latency_ms: number | null;
    analyzed_at: string | null;
    created_at: string | null;
    beehive: Beehive | null;
};

type Stats = {
    total: number;
    avg_confidence: number | null;
    avg_latency: number | null;
    swarm_count: number;
};

type GrowthPoint = { label: string; beekeepers: number; hives: number };
type HiveCategories = Record<string, number>;

type ConfidencePoint = { t: string | null; confidence: number; latency: number | null };
type ConfidenceStats = {
    min_confidence: number | null;
    max_confidence: number | null;
    min_latency: number | null;
    max_latency: number | null;
};
type ConfidenceRange = '1h' | '24h' | '7d';

type Props = {
    inferences: Inference[];
    beehives: Beehive[];
    stats: Stats;
    filters: { state: string; search: string };
    growth_weekly: GrowthPoint[];
    growth_yearly: GrowthPoint[];
    hive_categories: HiveCategories;
    confidence_series: ConfidencePoint[];
    confidence_stats: ConfidenceStats;
    confidence_range: ConfidenceRange;
};

// ── Hive status donut (mirrors dashboard.tsx) ──────────────────────
const DONUT_STATE_META: Record<string, { label: string; color: string }> = {
    normal:           { label: 'Normal',           color: '#3d7a3d' },
    pre_swarm:        { label: 'Pre-Swarm',         color: '#d97706' },
    swarm:            { label: 'Swarm',             color: '#dc2626' },
    abscondment:      { label: 'Abscondment',       color: '#7c3aed' },
    missing_queen:    { label: 'Missing Queen',     color: '#ea580c' },
    queenbee_present: { label: 'Queenbee Present',  color: '#16a34a' },
    pest_infested:    { label: 'Pest Infested',     color: '#ea580c' },
    external_noise:   { label: 'External Noise',    color: '#2563eb' },
    uncertain:        { label: 'Uncertain',         color: '#64748b' },
    unknown:          { label: 'Unknown',           color: '#94a3b8' },
};
function donutMeta(state: string) {
    return DONUT_STATE_META[state] ?? {
        label: toSentenceCase(state),
        color: '#94a3b8',
    };
}

function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function donutArc(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) {
    const gap = 2; const s = startDeg + gap / 2; const e = endDeg - gap / 2;
    if (e <= s) return '';
    const o1 = polar(cx, cy, outerR, s), o2 = polar(cx, cy, outerR, e);
    const i1 = polar(cx, cy, innerR, e), i2 = polar(cx, cy, innerR, s);
    const large = e - s > 180 ? 1 : 0;
    return [
        `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
        `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
        `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
        `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`, 'Z',
    ].join(' ');
}

function HiveStatusDonut({ categories }: { categories: HiveCategories }) {
    const entries = Object.entries(categories);
    const total   = entries.reduce((sum, [, count]) => sum + count, 0);
    const cx = 80, cy = 80, outerR = 68, innerR = 42;
    let cursor = 0;
    const arcs = entries.map(([key, count]) => {
        const sweep = total > 0 ? (count / total) * 360 : 0;
        const path  = donutArc(cx, cy, outerR, innerR, cursor, cursor + sweep);
        cursor += sweep;
        return { key, path };
    });
    return (
        <svg viewBox="0 0 160 160" className="w-full h-full">
            {total === 0
                ? <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#e5e7eb" strokeWidth={outerR - innerR} />
                : arcs.map((arc) => arc.path ? <path key={arc.key} d={arc.path} fill={donutMeta(arc.key).color} /> : null)
            }
        </svg>
    );
}

// ── Growth trends line chart ────────────────────────────────────────
function GrowthLineChart({ data }: { data: GrowthPoint[] }) {
    const width = 640, height = 220, padX = 30, padY = 24;
    const maxVal = Math.max(...data.map((d) => Math.max(d.beekeepers, d.hives)), 1);
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;
    const stepX  = data.length > 1 ? innerW / (data.length - 1) : 0;

    const pointsFor = (key: 'beekeepers' | 'hives') =>
        data.map((d, i) => ({
            x: padX + i * stepX,
            y: padY + innerH - (d[key] / maxVal) * innerH,
            value: d[key],
        }));

    const toPath = (pts: { x: number; y: number }[]) =>
        pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    const beekeeperPts = pointsFor('beekeepers');
    const hivePts      = pointsFor('hives');
    const gridLines    = [0, 0.25, 0.5, 0.75, 1];

    return (
        <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full h-auto">
            {/* Grid lines + Y labels */}
            {gridLines.map((g) => {
                const y = padY + innerH - g * innerH;
                return (
                    <g key={g}>
                        <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                        <text x={2} y={y + 3} fontSize={9} fill="#9ca3af">{Math.round(maxVal * g)}</text>
                    </g>
                );
            })}

            {/* Hives area + line (amber) */}
            <path d={toPath(hivePts)} fill="none" stroke="#f5a623" strokeWidth={2} />
            {hivePts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#f5a623" />)}

            {/* Beekeepers line (navy) */}
            <path d={toPath(beekeeperPts)} fill="none" stroke="#0d1b2a" strokeWidth={2} />
            {beekeeperPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#0d1b2a" />)}

            {/* X labels */}
            {data.map((d, i) => (
                <text key={d.label} x={padX + i * stepX} y={height + 18} fontSize={9} fill="#9ca3af" textAnchor="middle">
                    {d.label}
                </text>
            ))}
        </svg>
    );
}

// ── Confidence / latency over time chart ───────────────────────────
function ConfidenceLatencyChart({ data }: { data: ConfidencePoint[] }) {
    const width = 640, height = 220, padX = 30, padY = 24;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;
    const [hovered, setHovered] = useState<number | null>(null);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
                No inference data in this range.
            </div>
        );
    }

    const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
    const maxLatency = Math.max(...data.map((d) => d.latency ?? 0), 1);

    // Confidence is 0–1, plotted directly as a percentage of chart height.
    const confidencePts = data.map((d, i) => ({
        x: padX + i * stepX,
        y: padY + innerH - d.confidence * innerH,
    }));
    // Latency is in ms with its own scale — normalized against this range's own max so both fit the same chart.
    const latencyPts = data
        .map((d, i) => (d.latency == null ? null : { x: padX + i * stepX, y: padY + innerH - (d.latency / maxLatency) * innerH }))
        .filter((p): p is { x: number; y: number } => p !== null);

    const toPath = (pts: { x: number; y: number }[]) =>
        pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    const areaPath = `${toPath(confidencePts)} L ${confidencePts[confidencePts.length - 1].x.toFixed(1)} ${padY + innerH} L ${confidencePts[0].x.toFixed(1)} ${padY + innerH} Z`;
    const gridLines = [0, 0.25, 0.5, 0.75, 1];
    const labelStep = Math.max(1, Math.ceil(data.length / 6));

    return (
        <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full h-auto">
            {/* Grid lines + confidence % labels */}
            {gridLines.map((g) => {
                const y = padY + innerH - g * innerH;
                return (
                    <g key={g}>
                        <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#f1f5f9" strokeWidth={1} />
                        <text x={2} y={y + 3} fontSize={9} fill="#9ca3af">{Math.round(g * 100)}%</text>
                    </g>
                );
            })}

            {/* Confidence area + line (navy, solid) */}
            <path d={areaPath} fill="#fdebd0" opacity={0.6} />
            <path d={toPath(confidencePts)} fill="none" stroke="#0d1b2a" strokeWidth={2} />

            {/* Latency line (amber, dotted) */}
            <path d={toPath(latencyPts)} fill="none" stroke="#f5a623" strokeWidth={2} strokeDasharray="4 3" />

            {/* X labels */}
            {data.map((d, i) => (
                i % labelStep === 0 ? (
                    <text key={i} x={padX + i * stepX} y={height + 18} fontSize={9} fill="#9ca3af" textAnchor="middle">
                        {d.t ? new Date(d.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </text>
                ) : null
            ))}

            {/* Hover guideline + markers */}
            {hovered !== null && (
                <>
                    <line x1={confidencePts[hovered].x} y1={padY} x2={confidencePts[hovered].x} y2={padY + innerH}
                        stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
                    <circle cx={confidencePts[hovered].x} cy={confidencePts[hovered].y} r={4} fill="#0d1b2a" stroke="#fff" strokeWidth={1.5} />
                    {data[hovered].latency != null && (
                        <circle
                            cx={padX + hovered * stepX}
                            cy={padY + innerH - ((data[hovered].latency as number) / maxLatency) * innerH}
                            r={4} fill="#f5a623" stroke="#fff" strokeWidth={1.5}
                        />
                    )}
                </>
            )}

            {/* Invisible hit areas — one per data point, full chart height */}
            {data.map((_, i) => (
                <rect
                    key={i}
                    x={padX + i * stepX - stepX / 2}
                    y={0}
                    width={stepX || innerW}
                    height={height}
                    fill="transparent"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                />
            ))}

            {/* Tooltip */}
            {hovered !== null && (() => {
                const boxW = 124, boxH = 54;
                const px = confidencePts[hovered].x;
                const boxX = Math.min(Math.max(px - boxW / 2, 2), width - boxW - 2);
                const boxY = 2;
                const d = data[hovered];
                return (
                    <foreignObject x={boxX} y={boxY} width={boxW} height={boxH} style={{ pointerEvents: 'none' }}>
                        <div className="bg-gray-900 text-white text-[10px] leading-snug rounded-lg p-2 shadow-lg">
                            <p className="text-gray-300">
                                {d.t ? new Date(d.t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                            <p>Confidence: <span className="font-semibold">{(d.confidence * 100).toFixed(1)}%</span></p>
                            <p>Latency: <span className="font-semibold">{d.latency != null ? `${d.latency.toFixed(1)}ms` : '—'}</span></p>
                        </div>
                    </foreignObject>
                );
            })()}
        </svg>
    );
}

const STATE_COLORS: Record<string, { bg: string; text: string }> = {
    // DB values (lowercase / snake_case)
    normal:             { bg: '#dcfce7', text: '#16a34a' },
    pre_swarm:          { bg: '#fef3c7', text: '#d97706' },
    swarm:              { bg: '#fee2e2', text: '#dc2626' },
    abscondence:        { bg: '#fce7f3', text: '#9d174d' },
    external_noise:     { bg: '#ffedd5', text: '#ea580c' },
    pest_disturbance:   { bg: '#ffedd5', text: '#ea580c' },
    uncertain:          { bg: '#f1f5f9', text: '#64748b' },
};

function stateStyle(state: string) {
    return STATE_COLORS[state] ?? { bg: '#f1f5f9', text: '#64748b' };
}

function fmtDate(val: string | null) {
    if (!val) return '—';
    return new Date(val).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function fmtScore(val: number) {
    return `${(val * 100).toFixed(1)}%`;
}

function scoreColor(val: number) {
    if (val >= 0.8) return '#16a34a';
    if (val >= 0.6) return '#d97706';
    return '#dc2626';
}

function shortId(id: string | null) {
    if (!id) return '—';
    return id.slice(0, 8) + '…';
}

export default function Inferences({
    inferences, beehives = [], stats, filters, growth_weekly, growth_yearly, hive_categories,
    confidence_series, confidence_stats, confidence_range,
}: Props) {
    const [search, setSearch]       = useState(filters?.search ?? '');
    const [stateFilter, setStateFilter] = useState(filters?.state ?? '');
    const [showModal, setShowModal] = useState(false);
    const [tab, setTab] = useState<'reports' | 'ml-results'>('reports');
    const [growthRange, setGrowthRange] = useState<'weekly' | 'yearly'>('yearly');
    const growthData = growthRange === 'weekly' ? growth_weekly : growth_yearly;
    const donutTotal = Object.values(hive_categories).reduce((sum, n) => sum + n, 0);

    function setConfidenceRange(range: ConfidenceRange) {
        router.get('/analytics', { search, state: stateFilter, confidence_range: range }, { preserveState: true, preserveScroll: true });
    }

    const columns = useMemo<MRT_ColumnDef<Inference>[]>(() => [
        {
            id: 'index',
            header: '#',
            enableSorting: false,
            enableColumnFilter: false,
            size: 40,
            minSize: 40,
            maxSize: 50,
            muiTableHeadCellProps: { sx: { paddingLeft: '8px', paddingRight: '4px' } },
            muiTableBodyCellProps: { sx: { paddingLeft: '8px', paddingRight: '4px' } },
            Cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: 'analyzed_at',
            header: 'Analyzed At',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ row }) => fmtDate(row.original.analyzed_at),
        },
        {
            id: 'hive',
            header: 'Hive',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ row }) => {
                const r = row.original;
                return r.beehive ? (
                    <div>
                        <p className="font-semibold whitespace-nowrap" style={{ color: '#0d1b2a' }}>
                            {r.beehive.hive_name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-normal">
                            {r.beehive.hive_location}
                        </p>
                    </div>
                ) : (
                    <span className="font-mono text-gray-400" title={r.hive_id}>
                        {shortId(r.hive_id)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'audio_id',
            header: 'Audio ID',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ row }) => (
                <span className="font-mono text-gray-400" title={row.original.audio_id ?? ''}>
                    {row.original.audio_id ? shortId(row.original.audio_id) : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'hive_state',
            header: 'Hive State',
            enableSorting: true,
            enableColumnFilter: true,
            filterVariant: 'select',
            filterSelectOptions: ['', 'normal', 'pre_swarm', 'swarm', 'abscondence', 'external_noise', 'pest_disturbance', 'uncertain'],
            Cell: ({ row }) => {
                const style = stateStyle(row.original.hive_state);
                return (
                    <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded tracking-widest whitespace-nowrap"
                        style={{ backgroundColor: style.bg, color: style.text }}
                    >
                        {toSentenceCase(row.original.hive_state)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'confidence_score',
            header: 'Confidence Score',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ row }) => (
                <span className="font-bold tabular-nums" style={{ color: scoreColor(row.original.confidence_score) }}>
                    {fmtScore(row.original.confidence_score)}
                </span>
            ),
        },
        {
            accessorKey: 'inference_latency_ms',
            header: 'Latency (ms)',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ row }) => (
                <span className="tabular-nums text-gray-600">
                    {row.original.inference_latency_ms != null ? `${row.original.inference_latency_ms.toFixed(2)}` : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'inference_id',
            header: 'Inference ID',
            enableSorting: true,
            enableColumnFilter: true,
            Cell: ({ row }) => (
                <span className="font-mono text-gray-500" title={row.original.inference_id}>
                    {shortId(row.original.inference_id)}
                </span>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Created At',
            enableSorting: true,
            enableColumnFilter: false,
            Cell: ({ row }) => fmtDate(row.original.created_at),
        },
    ], []);

    const { data, setData, post, processing, errors, reset } = useForm({
        hive_id: '',
        audio_id: '',
        hive_state: 'swarm',
        confidence_score: '',
        inference_latency_ms: '',
        analyzed_at: '',
    });

    function applyFilters(overrides: { search?: string; state?: string } = {}) {
        router.get('/analytics', {
            search: overrides.search ?? search,
            state:  overrides.state  ?? stateFilter,
        }, { preserveScroll: true, preserveState: true });
    }

    const rows = inferences ?? [];

    const handleExportCSV = () => {
        const header = [
            'Inference ID', 'Hive', 'Audio ID', 'Hive State',
            'Confidence Score', 'Latency (ms)', 'Analyzed At', 'Created At',
        ].join(',');
        const csvRows = rows.map((r) =>
            [
                r.inference_id,
                r.beehive?.hive_name ?? r.hive_id,
                r.audio_id ?? '',
                r.hive_state,
                fmtScore(r.confidence_score),
                r.inference_latency_ms ?? '',
                fmtDate(r.analyzed_at),
                fmtDate(r.created_at),
            ].join(',')
        );
        const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'inference_results.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/analytics', {
            onSuccess: () => { reset(); setShowModal(false); },
        });
    };

    return (
        <>
            <Head title="ML Inferences" />

            {/* ── Log Inference Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold" style={{ color: '#0d1b2a' }}>Log New Inference</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                            {/* Hive */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive *</label>
                                <select
                                    value={data.hive_id}
                                    onChange={(e) => setData('hive_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                    required
                                >
                                    <option value="">Select hive…</option>
                                    {beehives.map((b) => (
                                        <option key={b.hive_id} value={b.hive_id}>
                                            {b.hive_name} — {b.hive_location}
                                        </option>
                                    ))}
                                </select>
                                {errors.hive_id && <p className="text-xs text-red-500 mt-1">{errors.hive_id}</p>}
                            </div>

                            {/* Audio ID */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Audio ID (optional)</label>
                                <input
                                    type="text"
                                    value={data.audio_id}
                                    onChange={(e) => setData('audio_id', e.target.value)}
                                    placeholder="UUID of audio source…"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                />
                            </div>

                            {/* Hive State */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Hive State *</label>
                                <select
                                    value={data.hive_state}
                                    onChange={(e) => setData('hive_state', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                    required
                                >
                                    {[
                                        { value: 'normal',           label: 'Normal' },
                                        { value: 'pre_swarm',        label: 'Pre-Swarm' },
                                        { value: 'swarm',            label: 'Swarm' },
                                        { value: 'abscondence',      label: 'Abscondence' },
                                        { value: 'external_noise',   label: 'External Noise' },
                                        { value: 'pest_disturbance', label: 'Pest / Disturbance' },
                                        { value: 'uncertain',        label: 'Uncertain' },
                                    ].map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                {errors.hive_state && <p className="text-xs text-red-500 mt-1">{errors.hive_state}</p>}
                            </div>

                            {/* Confidence Score */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Confidence Score (0–1) *</label>
                                <input
                                    type="number"
                                    min="0" max="1" step="0.0001"
                                    value={data.confidence_score}
                                    onChange={(e) => setData('confidence_score', e.target.value)}
                                    placeholder="e.g. 0.8750"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                    required
                                />
                                {errors.confidence_score && <p className="text-xs text-red-500 mt-1">{errors.confidence_score}</p>}
                            </div>

                            {/* Latency */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Inference Latency (ms)</label>
                                <input
                                    type="number"
                                    min="0" step="0.01"
                                    value={data.inference_latency_ms}
                                    onChange={(e) => setData('inference_latency_ms', e.target.value)}
                                    placeholder="e.g. 142.50"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                />
                            </div>

                            {/* Analyzed At */}
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-1.5">Analyzed At *</label>
                                <input
                                    type="datetime-local"
                                    value={data.analyzed_at}
                                    onChange={(e) => setData('analyzed_at', e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400"
                                    style={{ color: '#0d1b2a' }}
                                    required
                                />
                                {errors.analyzed_at && <p className="text-xs text-red-500 mt-1">{errors.analyzed_at}</p>}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                                >
                                    {processing ? 'Saving…' : 'Log Inference'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="p-6 flex flex-col gap-6" style={{ backgroundColor: '#f8f9fa' }}>

                {/* ── Page heading ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        {tab === 'reports' ? (
                            <>
                                <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>Reports</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Summary and trend reports across hive monitoring activity.
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>ML Inference Results</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Audio classification results from the hive monitoring ML engine.
                                </p>
                            </>
                        )}
                    </div>
                    {tab === 'ml-results' && (
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: '#0d1b2a', color: 'white' }}
                            >
                                + Log Inference
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Export CSV
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 shadow-sm p-1 w-fit">
                    <button
                        onClick={() => setTab('reports')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={tab === 'reports' ? { backgroundColor: '#0d1b2a', color: '#ffffff' } : { color: '#64748b' }}
                    >
                        <FileBarChart2 className="w-4 h-4" />
                        Reports
                    </button>
                    <button
                        onClick={() => setTab('ml-results')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={tab === 'ml-results' ? { backgroundColor: '#0d1b2a', color: '#ffffff' } : { color: '#64748b' }}
                    >
                        <FlaskConical className="w-4 h-4" />
                        ML Results
                    </button>
                </div>

                {tab === 'reports' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                        {/* Growth trends */}
                        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wide" style={{ color: '#0d1b2a' }}>
                                        Beehive Management System: Growth Trends
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">Cumulative beekeepers and hives over time.</p>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
                                    <button
                                        onClick={() => setGrowthRange('weekly')}
                                        className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                                        style={growthRange === 'weekly' ? { backgroundColor: '#ffffff', color: '#0d1b2a', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } : { color: '#6b7280' }}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => setGrowthRange('yearly')}
                                        className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                                        style={growthRange === 'yearly' ? { backgroundColor: '#ffffff', color: '#0d1b2a', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } : { color: '#6b7280' }}
                                    >
                                        Yearly
                                    </button>
                                </div>
                            </div>

                            <GrowthLineChart data={growthData} />

                            <div className="flex items-center gap-4 mt-2 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0d1b2a' }} />
                                    <span className="text-xs text-gray-500">Beekeepers Joining</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f5a623' }} />
                                    <span className="text-xs text-gray-500">New Bee Hives Registered</span>
                                </div>
                            </div>
                        </div>

                        {/* Hive status donut — matches dashboard's "Current Hive Status Distribution" card */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <Hexagon className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Current Hive Status Distribution</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-8">
                                <div className="w-56 h-56 shrink-0"><HiveStatusDonut categories={hive_categories} /></div>
                                <div className="flex flex-col gap-3">
                                    {Object.entries(hive_categories)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([key, count]) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: donutMeta(key).color }} />
                                                <span className="text-sm text-gray-600">{donutMeta(key).label}</span>
                                                <span className="text-sm font-semibold ml-auto pl-4" style={{ color: '#0d1b2a' }}>{count}</span>
                                            </div>
                                        ))}
                                    {donutTotal === 0 && <p className="text-xs text-gray-400">No hives yet</p>}
                                </div>
                            </div>
                        </div>

                        {/* Confidence / Latency over time */}
                        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wide" style={{ color: '#0d1b2a' }}>
                                        Confidence &amp; Latency Over Time
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">Prediction confidence and processing latency across recent inferences.</p>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
                                    {(['1h', '24h', '7d'] as ConfidenceRange[]).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setConfidenceRange(r)}
                                            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors uppercase"
                                            style={confidence_range === r ? { backgroundColor: '#0d1b2a', color: '#ffffff' } : { color: '#6b7280' }}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ConfidenceLatencyChart data={confidence_series} />

                            <div className="flex items-center gap-4 mt-2 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0d1b2a' }} />
                                    <span className="text-xs text-gray-500">Confidence</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed" style={{ borderColor: '#f5a623' }} />
                                    <span className="text-xs text-gray-500">Latency (ms)</span>
                                </div>
                            </div>
                        </div>

                        {/* Min/Max stats panel */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                            <p className="font-bold text-sm uppercase tracking-wide" style={{ color: '#0d1b2a' }}>
                                Range Summary
                            </p>
                            {[
                                { label: 'Min Confidence', value: confidence_stats.min_confidence != null ? `${(confidence_stats.min_confidence * 100).toFixed(1)}%` : '—' },
                                { label: 'Max Confidence', value: confidence_stats.max_confidence != null ? `${(confidence_stats.max_confidence * 100).toFixed(1)}%` : '—' },
                                { label: 'Min Latency',    value: confidence_stats.min_latency    != null ? `${confidence_stats.min_latency.toFixed(1)}ms` : '—' },
                                { label: 'Max Latency',    value: confidence_stats.max_latency    != null ? `${confidence_stats.max_latency.toFixed(1)}ms` : '—' },
                            ].map((s, i) => (
                                <div key={s.label} className={`flex items-center justify-between ${i > 0 ? 'pt-3 border-t border-gray-100' : ''}`}>
                                    <span className="text-sm text-gray-500">{s.label}</span>
                                    <span className="text-sm font-mono font-semibold" style={{ color: '#0d1b2a' }}>{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'ml-results' && (
                <>

                {/* ── Summary cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Inferences', value: (stats?.total ?? 0).toLocaleString(),                                                      color: '#0d1b2a' },
                        { label: 'Avg Confidence',   value: stats?.avg_confidence != null ? fmtScore(stats.avg_confidence) : '—',                      color: '#16a34a' },
                        { label: 'Avg Latency',      value: stats?.avg_latency    != null ? `${Number(stats.avg_latency).toFixed(1)} ms` : '—',        color: '#d97706' },
                        { label: 'Flagged (Swarm)',  value: (stats?.swarm_count ?? 0).toLocaleString(),                                                color: '#dc2626' },
                    ].map((c) => (
                        <div key={c.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-1">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{c.label}</p>
                            <p className="text-3xl font-bold mt-1" style={{ color: c.color }}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Filters ── */}
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        placeholder="Search by hive, state, or ID…"
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-amber-400 w-72"
                        style={{ color: '#0d1b2a' }}
                    />
                    <select
                        value={stateFilter}
                        onChange={(e) => { setStateFilter(e.target.value); applyFilters({ state: e.target.value }); }}
                        className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white outline-none focus:border-amber-400"
                        style={{ color: '#0d1b2a' }}
                    >
                        <option value="">All States</option>
                        {['swarm','pre_swarm','external_noise','normal','abscondence','pest_disturbance','uncertain'].map((s) => (
                            <option key={s} value={s}>{toSentenceCase(s)}</option>
                        ))}
                    </select>
                    {(search || stateFilter) && (
                        <button
                            onClick={() => { setSearch(''); setStateFilter(''); applyFilters({ search: '', state: '' }); }}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                        >
                            Clear filters
                        </button>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                        {rows.length} record{rows.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={rows}
                        getRowId={(row) => row.inference_id}
                        initialColumnVisibility={{ inference_id: false }}
                    />
                </div>

                </>
                )}

            </div>
        </>
    );
}

Inferences.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard',    href: '/dashboard' },
        { title: 'ML Inference Results', href: '/analytics' },
    ]}>
        {page}
    </AppLayout>
);
