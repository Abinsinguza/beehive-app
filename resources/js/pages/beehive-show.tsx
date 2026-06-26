import { Head, router } from '@inertiajs/react';
import { Activity, AlertTriangle, Calendar, ChevronLeft, ClipboardList, Droplets, Leaf, LayoutGrid, Link2, MapPin, Mic, Play, Plug, Thermometer } from 'lucide-react';
import type {MRT_ColumnDef} from 'material-react-table';
import React, { useState, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import AppLayout from '@/layouts/app-layout';
import { toSentenceCase, formatDate } from '@/lib/format-text';

type Beehive = {
    id: string;
    hive_id: string;
    hive_name: string;
    hive_location: string;
    hive_type: string;
    installation_date: string;
    current_state: string;
    latitude: number | null;
    longitude: number | null;
    owner: { name: string } | null;
};

type EnvData = {
    temperature: number | null;
    humidity: number | null;
    recorded_at: string | null;
} | null;

type InferenceItem = { state: string; percentage: number };

type Advisory = {
    advisory_id: string;
    condition_label: string | null;
    advisory_text: string | null;
    severity: string;
    created_at: string;
};

type AudioSource = {
    audio_id: string;
    source_url: string;
    file_format: string;
    duration_seconds: number | null;
    captured_at: string | null;
    created_at: string | null;
    status: string;
    detected_state: string | null;
    confidence_score: number | null;
    analyzed_at: string | null;
    inference_latency_ms: number | null;
};

type AudioPaginator = {
    data: AudioSource[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type LatestInference = {
    hive_state: string;
    confidence_score: number;
    inference_latency_ms: number | null;
    analyzed_at: string;
} | null;

type DataSource = {
    source_id: string;
    source_type: string;
    source_path: string | null;
    connection_config: { api_key?: string; api_base_url?: string } | null;
    last_scanned_at: string | null;
    is_active: boolean;
} | null;

const stateColors: Record<string, string> = {
    swarm:            '#ef4444',
    pre_swarm:        '#f59e0b',
    normal:           '#22c55e',
    abscondment:      '#7c3aed',
    missing_queen:    '#ea580c',
    queenbee_present: '#16a34a',
    pest_infested:    '#ea580c',
    external_noise:   '#2563eb',
    uncertain:        '#64748b',
    unknown:          '#94a3b8',
};

const severityDotColors: Record<string, string> = {
    critical: '#ef4444',
    warning:  '#f59e0b',
    info:     '#22c55e',
};
function severityDot(s: string | null | undefined) {
    return severityDotColors[s?.toLowerCase() ?? ''] ?? '#94a3b8';
}

function fmtTime(dateStr: string | null | undefined): string {
    if (!dateStr) {
return '—';
}

    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
return `Today ${time}`;
}

    if (isYesterday) {
return `Yesterday ${time}`;
}

    return formatDate(dateStr);
}

function filename(url: string): string {
    return url.split('/').pop() ?? url;
}

export default function BeehiveShow({
    beehive,
    latestEnv,
    inferenceDistribution,
    latestInference,
    recentAdvisories,
    audioSources,
    dataSource,
}: {
    beehive: Beehive;
    latestEnv: EnvData;
    inferenceDistribution: InferenceItem[];
    latestInference: LatestInference;
    recentAdvisories: Advisory[];
    audioSources: AudioPaginator;
    dataSource: DataSource;
}) {
    const isRisk = ['swarm', 'pre_swarm', 'abscondment', 'missing_queen', 'pest_infested'].includes(beehive.current_state);
    const [tab, setTab] = useState<'overview' | 'data-source'>('overview');

    const audioColumns = useMemo<MRT_ColumnDef<AudioSource>[]>(() => [
        {
            id: 'play',
            header: '',
            Cell: () => (
                <button className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-gray-200 hover:bg-gray-100">
                    <Play className="w-3 h-3 text-gray-400" />
                </button>
            ),
        },
        {
            id: 'file',
            header: 'File',
            Cell: ({ row }) => {
                const audio = row.original;

                return (
                    <div>
                        <p className="font-medium truncate max-w-40" style={{ color: '#0d1b2a' }}>{filename(audio.source_url)}</p>
                        <p className="text-gray-400">
                            {audio.file_format.toUpperCase()}
                            {audio.duration_seconds ? ` · ${audio.duration_seconds}s` : ''}
                        </p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Recorded',
            Cell: ({ row }) => <span className="whitespace-nowrap" style={{ color: '#0d1b2a' }}>{fmtTime(row.original.created_at)}</span>,
        },
        {
            accessorKey: 'detected_state',
            header: 'ML Detected',
            Cell: ({ row }) => {
                const stateColor = row.original.detected_state ? (stateColors[row.original.detected_state] ?? '#94a3b8') : null;

                return row.original.detected_state ? (
                    <span className="font-semibold" style={{ color: stateColor ?? undefined }}>
                        {row.original.detected_state}
                    </span>
                ) : (
                    <span className="text-gray-400 italic">Not analysed</span>
                );
            },
        },
        {
            accessorKey: 'confidence_score',
            header: 'Confidence',
            Cell: ({ row }) => (
                <span style={{ color: '#0d1b2a' }}>
                    {row.original.confidence_score != null ? `${(row.original.confidence_score * 100).toFixed(1)}%` : '—'}
                </span>
            ),
        },
        {
            accessorKey: 'analyzed_at',
            header: 'Analysed At',
            Cell: ({ row }) => <span className="whitespace-nowrap" style={{ color: '#0d1b2a' }}>{row.original.analyzed_at ? fmtTime(row.original.analyzed_at) : '—'}</span>,
        },
        {
            accessorKey: 'inference_latency_ms',
            header: 'Latency',
            Cell: ({ row }) => <span style={{ color: '#0d1b2a' }}>{row.original.inference_latency_ms != null ? `${row.original.inference_latency_ms}ms` : '—'}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            Cell: ({ row }) => (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-widest whitespace-nowrap"
                    style={{
                        backgroundColor: row.original.status === 'processed' ? '#fef3c7' : '#f1f5f9',
                        color: row.original.status === 'processed' ? '#92400e' : '#64748b',
                    }}>
                    {toSentenceCase(row.original.status)}
                </span>
            ),
        },
    ], []);

    function fmtTimeFull(dateStr: string | null | undefined): string {
        if (!dateStr) {
return 'Never synced';
}

        return `Last synced ${fmtTime(dateStr)}`;
    }

    return (
        <>
            <Head title={`${beehive.hive_name ?? 'Hive'} — Profile`} />
            <div className="p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Back */}
                <button
                    onClick={() => router.visit('/beehives')}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-800 w-fit"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Hive Inventory
                </button>

                {/* ── Header card ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
                            style={{ backgroundColor: '#fef3c7' }}>
                            🐝
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold" style={{ color: '#0d1b2a' }}>
                                    {beehive.hive_name ?? '—'} — {beehive.hive_type}
                                </h1>
                                {isRisk && (
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                                        {beehive.current_state} risk
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" /> {beehive.hive_location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> Installed {formatDate(beehive.installation_date)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => router.visit(`/beehives/${beehive.id}/edit`)}
                        className="shrink-0 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-400 hover:bg-gray-50"
                    >
                        Edit
                    </button>
                </div>

                {/* ── Tabs ─────────────────────────────────────────── */}
                <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 shadow-sm p-1 w-fit">
                    <button
                        onClick={() => setTab('overview')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={tab === 'overview' ? { backgroundColor: '#0d1b2a', color: '#ffffff' } : { color: '#64748b' }}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Overview
                    </button>
                    <button
                        onClick={() => setTab('data-source')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={tab === 'data-source' ? { backgroundColor: '#0d1b2a', color: '#ffffff' } : { color: '#64748b' }}
                    >
                        <Plug className="w-4 h-4" />
                        Data Source
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={
                                dataSource?.is_active
                                    ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
                                    : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                            }>
                            {dataSource ? (dataSource.is_active ? 'Active' : 'Inactive') : 'None'}
                        </span>
                    </button>
                </div>

                {tab === 'overview' && (
                <>

                {/* ── Stat cards ──────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            icon: <Thermometer className="w-4 h-4" style={{ color: '#f5a623' }} />,
                            label: 'Temperature',
                            value: latestEnv?.temperature != null ? `${latestEnv.temperature}°C` : '—',
                            sub: latestEnv?.recorded_at ? `Recorded ${fmtTime(latestEnv.recorded_at)}` : 'No sensor data yet',
                        },
                        {
                            icon: <Droplets className="w-4 h-4 text-blue-400" />,
                            label: 'Humidity',
                            value: latestEnv?.humidity != null ? `${latestEnv.humidity}%` : '—',
                            sub: latestEnv?.recorded_at ? `Recorded ${fmtTime(latestEnv.recorded_at)}` : 'No sensor data yet',
                        },
                        {
                            icon: <Activity className="w-4 h-4 text-amber-500" />,
                            label: 'Confidence',
                            value: latestInference?.confidence_score != null ? `${(latestInference.confidence_score * 100).toFixed(1)}%` : '—',
                            sub: latestInference?.analyzed_at ? `Analysed ${fmtTime(latestInference.analyzed_at)}` : 'No inference data yet',
                        },
                        {
                            icon: <Leaf className="w-4 h-4 text-green-500" />,
                            label: 'Inference Latency',
                            value: latestInference?.inference_latency_ms != null ? `${latestInference.inference_latency_ms} ms` : '—',
                            sub: latestInference?.hive_state ?? 'No prediction yet',
                        },
                    ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-2">
                                {s.icon}
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{s.label}</p>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>{s.value}</p>
                            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Advisories + Inference ──────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Relevant advisories */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Relevant Advisories</h2>
                            </div>
                            <button className="text-xs font-semibold" style={{ color: '#f5a623' }}>View all</button>
                        </div>
                        {recentAdvisories.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No advisories for this hive yet.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {recentAdvisories.map((adv) => (
                                    <div key={adv.advisory_id} className="flex items-start gap-2.5">
                                        <span className="w-2 h-2 rounded-full mt-1 shrink-0"
                                            style={{ backgroundColor: severityDot(adv.severity) }} />
                                        <div>
                                            <p className="text-sm" style={{ color: '#0d1b2a' }}>{adv.condition_label ?? adv.advisory_text ?? '—'}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {fmtTime(adv.created_at)} · {adv.severity} severity
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Latest inference */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Latest Inference</h2>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    {latestInference
                                        ? `Analysed ${fmtTime(latestInference.analyzed_at)}${latestInference.inference_latency_ms ? ` · ${latestInference.inference_latency_ms} ms latency` : ''}`
                                        : 'No inference data yet'}
                                </p>
                            </div>
                        </div>
                        {inferenceDistribution.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No inference results for this hive yet.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {inferenceDistribution.map((item) => (
                                    <div key={item.state} className="flex items-center gap-3">
                                        <span className="text-xs w-28 shrink-0" style={{ color: '#0d1b2a' }}>{item.state}</span>
                                        <div className="flex-1 h-2 rounded-full bg-gray-100">
                                            <div
                                                className="h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${item.percentage}%`,
                                                    backgroundColor: stateColors[item.state] ?? '#94a3b8',
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold w-8 text-right" style={{ color: '#0d1b2a' }}>{item.percentage}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Audio recordings ────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                        <Mic className="w-4 h-4 text-purple-500" />
                        <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Audio Recordings</h2>
                        <span className="text-xs text-gray-400 ml-1">{audioSources.total} total</span>
                    </div>

                    {audioSources.data.length === 0 ? (
                        <p className="text-xs text-gray-400 italic px-5 py-6">No audio recordings for this hive yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <DataTable
                                columns={audioColumns}
                                data={audioSources.data}
                                getRowId={(row) => row.audio_id}
                            />
                        </div>
                    )}


                </div>

                {/* ── Hive details card ───────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-gray-400" />
                            <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Hive Details</h2>
                        </div>
                        <button
                            onClick={() => router.visit(`/beehives/${beehive.id}/edit`)}
                            className="text-xs font-semibold text-gray-400 hover:text-gray-800 flex items-center gap-1"
                        >
                            ✎ Edit
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {[
                            { label: 'Hive type',         value: beehive.hive_type },
                            { label: 'Location',          value: beehive.hive_location },
                            {
                                label: 'GPS',
                                value: beehive.latitude != null && beehive.longitude != null
                                    ? `${beehive.latitude},  ${beehive.longitude}`
                                    : '—',
                            },
                            { label: 'Owner',             value: beehive.owner?.name ?? '—' },
                            { label: 'Installation date', value: formatDate(beehive.installation_date) },
                            { label: 'Current state',     value: beehive.current_state },
                        ].map((row) => (
                            <div key={row.label} className="flex items-start py-3 gap-4">
                                <span className="text-xs text-gray-400 w-36 shrink-0 pt-0.5">{row.label}</span>
                                {row.label === 'Current state' ? (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded"
                                        style={{
                                            backgroundColor: isRisk ? '#fef3c7' : '#f0fdf4',
                                            color: isRisk ? '#92400e' : '#166534',
                                        }}>
                                        {row.value}
                                    </span>
                                ) : (
                                    <span className="text-sm" style={{ color: '#0d1b2a' }}>{row.value}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                </>
                )}

                {tab === 'data-source' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Plug className="w-4 h-4 text-gray-400" />
                            <h2 className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Sensor Data Source</h2>
                        </div>
                        {dataSource && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest"
                                style={
                                    dataSource.is_active
                                        ? { backgroundColor: '#f0fdf4', color: '#16a34a' }
                                        : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                                }>
                                {dataSource.is_active ? 'Active' : 'Inactive'}
                            </span>
                        )}
                    </div>

                    {!dataSource ? (
                        <p className="text-xs text-gray-400 italic">No data source configured for this hive.</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            <div className="flex items-start py-3 gap-4">
                                <span className="text-xs text-gray-400 w-40 shrink-0 pt-0.5 flex items-center gap-1.5">
                                    <Link2 className="w-3.5 h-3.5" /> Source Path
                                </span>
                                <span className="text-sm font-mono break-all" style={{ color: '#0d1b2a' }}>{dataSource.source_path ?? '—'}</span>
                            </div>
                            <div className="flex items-start py-3 gap-4">
                                <span className="text-xs text-gray-400 w-40 shrink-0 pt-0.5">Source Type</span>
                                <span className="text-sm uppercase" style={{ color: '#0d1b2a' }}>{dataSource.source_type}</span>
                            </div>
                            <div className="flex items-start py-3 gap-4">
                                <span className="text-xs text-gray-400 w-40 shrink-0 pt-0.5">API Base URL</span>
                                <span className="text-sm font-mono break-all" style={{ color: '#0d1b2a' }}>{dataSource.connection_config?.api_base_url ?? '—'}</span>
                            </div>
                            <div className="flex items-start py-3 gap-4">
                                <span className="text-xs text-gray-400 w-40 shrink-0 pt-0.5">API Key</span>
                                <span className="text-sm font-mono" style={{ color: '#0d1b2a' }}>{dataSource.connection_config?.api_key ?? '—'}</span>
                            </div>
                            <div className="flex items-start py-3 gap-4">
                                <span className="text-xs text-gray-400 w-40 shrink-0 pt-0.5">Last Sync</span>
                                <span className="text-sm" style={{ color: '#0d1b2a' }}>{fmtTimeFull(dataSource.last_scanned_at)}</span>
                            </div>
                            <div className="flex items-start py-3 gap-4">
                                <span className="text-xs text-gray-400 w-40 shrink-0 pt-0.5">Status</span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded"
                                    style={
                                        dataSource.is_active
                                            ? { backgroundColor: '#f0fdf4', color: '#166534' }
                                            : { backgroundColor: '#f1f5f9', color: '#64748b' }
                                    }>
                                    {dataSource.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                )}

            </div>
        </>
    );
}

BeehiveShow.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Hive Inventory',  href: '/beehives' },
        { title: 'Hive Profile',    href: '#' },
    ]}>
        {page}
    </AppLayout>
);
