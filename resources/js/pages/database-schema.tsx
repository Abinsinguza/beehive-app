import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import React from 'react';
import { Database, Key, Link2, Lock, Table2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────
type ColFlag = 'PK' | 'FK' | 'UK' | 'IDX';
type Column = {
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
    flags?: ColFlag[];
    ref?: string;
    notes?: string;
};
type Table = {
    name: string;
    columns: Column[];
};
type Group = {
    label: string;
    color: string;
    tables: Table[];
};

// ── Schema definition — synced from live Railway PostgreSQL database ──
const SCHEMA: Group[] = [
    {
        label: 'Core',
        color: '#0d1b2a',
        tables: [
            {
                name: 'users',
                columns: [
                    { name: 'user_id',                   type: 'uuid',         nullable: false, flags: ['PK'], default: 'gen_random_uuid()' },
                    { name: 'full_name',                 type: 'varchar(100)', nullable: false },
                    { name: 'email',                     type: 'varchar(100)', nullable: false, flags: ['UK'] },
                    { name: 'email_verified_at',         type: 'timestamp',    nullable: true },
                    { name: 'phone',                     type: 'varchar(20)',  nullable: true,  flags: ['UK'] },
                    { name: 'address',                   type: 'text',         nullable: true },
                    { name: 'password_hash',             type: 'varchar(255)', nullable: false },
                    { name: 'role',                      type: 'varchar(30)',  nullable: false, notes: 'farmer | farmer_pending | farmer_revoked | admin' },
                    { name: 'two_factor_secret',         type: 'text',         nullable: true },
                    { name: 'two_factor_recovery_codes', type: 'text',         nullable: true },
                    { name: 'remember_token',            type: 'varchar(100)', nullable: true },
                    { name: 'device_token',              type: 'varchar(500)', nullable: true },
                    { name: 'device_token_updated_at',   type: 'timestamp',    nullable: true },
                    { name: 'server_url',                type: 'varchar(255)', nullable: true },
                    { name: 'api_key',                   type: 'varchar(255)', nullable: true },
                    { name: 'created_at',                type: 'timestamp',    nullable: true },
                    { name: 'updated_at',                type: 'timestamp',    nullable: true },
                ],
            },
            {
                name: 'hives',
                columns: [
                    { name: 'hive_id',          type: 'uuid',         nullable: false, flags: ['PK'], default: 'gen_random_uuid()' },
                    { name: 'owner_id',         type: 'uuid',         nullable: false, flags: ['FK'], ref: 'users.user_id' },
                    { name: 'hive_name',        type: 'varchar(100)', nullable: true },
                    { name: 'hive_location',    type: 'varchar(150)', nullable: false },
                    { name: 'hive_type',        type: 'varchar(50)',  nullable: true },
                    { name: 'installation_date',type: 'date',         nullable: true },
                    { name: 'current_state',    type: 'varchar(50)',  nullable: false },
                    { name: 'latitude',         type: 'numeric',      nullable: true },
                    { name: 'longitude',        type: 'numeric',      nullable: true },
                    { name: 'created_at',       type: 'timestamp',    nullable: true },
                    { name: 'updated_at',       type: 'timestamp',    nullable: true },
                    { name: 'is_deleted',       type: 'boolean',      nullable: false, default: 'false' },
                    { name: 'deleted_at',       type: 'timestamp',    nullable: true },
                ],
            },
            {
                name: 'farmer_data_sources',
                columns: [
                    { name: 'source_id',         type: 'uuid',        nullable: false, flags: ['PK'], default: 'gen_random_uuid()' },
                    { name: 'user_id',           type: 'uuid',        nullable: false, flags: ['FK'], ref: 'users.user_id' },
                    { name: 'hive_id',           type: 'uuid',        nullable: false, flags: ['FK'], ref: 'hives.hive_id' },
                    { name: 'source_type',       type: 'varchar(50)', nullable: false },
                    { name: 'source_path',       type: 'text',        nullable: true },
                    { name: 'connection_config', type: 'jsonb',       nullable: true },
                    { name: 'last_scanned_at',   type: 'timestamp',   nullable: true },
                    { name: 'is_active',         type: 'boolean',     nullable: false },
                    { name: 'created_at',        type: 'timestamp',   nullable: true },
                ],
            },
        ],
    },
    {
        label: 'Audio & Inference',
        color: '#1d4ed8',
        tables: [
            {
                name: 'audio_sources',
                columns: [
                    { name: 'audio_id',            type: 'uuid',        nullable: false, flags: ['PK'] },
                    { name: 'hive_id',             type: 'uuid',        nullable: false, flags: ['FK'], ref: 'hives.hive_id' },
                    { name: 'source_url',          type: 'varchar(255)',nullable: false },
                    { name: 'file_format',         type: 'varchar(20)', nullable: false },
                    { name: 'duration_seconds',    type: 'numeric',     nullable: true },
                    { name: 'captured_at',         type: 'timestamp',   nullable: true },
                    { name: 'ingestion_timestamp', type: 'timestamp',   nullable: true },
                    { name: 'status',              type: 'varchar(20)', nullable: false },
                    { name: 'created_at',          type: 'timestamp',   nullable: true, default: 'now()' },
                    { name: 'updated_at',          type: 'timestamp',   nullable: true, default: 'now()' },
                ],
            },
            {
                name: 'inference_results',
                columns: [
                    { name: 'inference_id',         type: 'uuid',        nullable: false, flags: ['PK'] },
                    { name: 'hive_id',              type: 'uuid',        nullable: false, flags: ['FK'], ref: 'hives.hive_id' },
                    { name: 'audio_id',             type: 'uuid',        nullable: true,  flags: ['FK'], ref: 'audio_sources.audio_id' },
                    { name: 'hive_state',           type: 'varchar(50)', nullable: false, notes: 'swarm | external_noise | normal | pre_swarm' },
                    { name: 'confidence_score',     type: 'numeric(5,4)',nullable: false },
                    { name: 'inference_latency_ms', type: 'numeric',     nullable: true },
                    { name: 'analyzed_at',          type: 'timestamp',   nullable: true },
                    { name: 'created_at',           type: 'timestamp',   nullable: true },
                ],
            },
            {
                name: 'environmental_data',
                columns: [
                    { name: 'env_record_id', type: 'uuid',      nullable: false, flags: ['PK'] },
                    { name: 'hive_id',       type: 'uuid',      nullable: false, flags: ['FK'], ref: 'hives.hive_id' },
                    { name: 'temperature',   type: 'numeric',   nullable: true },
                    { name: 'humidity',      type: 'numeric',   nullable: true },
                    { name: 'recorded_at',   type: 'timestamp', nullable: true },
                ],
            },
        ],
    },
    {
        label: 'Advisory System',
        color: '#b45309',
        tables: [
            {
                name: 'advisory_templates',
                columns: [
                    { name: 'template_id',             type: 'bigint',      nullable: false, flags: ['PK'], default: 'auto-increment' },
                    { name: 'prediction_code',         type: 'numeric',     nullable: false, flags: ['UK'] },
                    { name: 'hive_state',              type: 'varchar(50)', nullable: false, flags: ['UK'] },
                    { name: 'advisory_type',           type: 'varchar(30)', nullable: false },
                    { name: 'severity',                type: 'varchar(20)', nullable: false },
                    { name: 'min_confidence_threshold',type: 'numeric(5,4)',nullable: true,  default: '0.70' },
                    { name: 'description',             type: 'text',        nullable: true },
                    { name: 'created_at',              type: 'timestamp',   nullable: true },
                    { name: 'updated_at',              type: 'timestamp',   nullable: true },
                ],
            },
            {
                name: 'advisories',
                columns: [
                    { name: 'advisory_id',            type: 'uuid',        nullable: false, flags: ['PK'], default: 'gen_random_uuid()' },
                    { name: 'template_id',            type: 'bigint',      nullable: false, flags: ['FK'], ref: 'advisory_templates.template_id' },
                    { name: 'action_title',           type: 'varchar(200)',nullable: false },
                    { name: 'action_description',     type: 'text',        nullable: false },
                    { name: 'priority_level',         type: 'varchar(20)', nullable: false, default: "'medium'" },
                    { name: 'confidence_threshold_min',type: 'numeric(5,4)',nullable: false, default: '0.70' },
                    { name: 'confidence_threshold_max',type: 'numeric(5,4)',nullable: false, default: '1.00' },
                    { name: 'action_order',           type: 'integer',     nullable: false, default: '1' },
                    { name: 'is_active',              type: 'boolean',     nullable: false, default: 'true' },
                    { name: 'created_at',             type: 'timestamp',   nullable: true,  default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at',             type: 'timestamp',   nullable: true,  default: 'CURRENT_TIMESTAMP' },
                ],
            },
            {
                name: 'advisory_actions',
                columns: [
                    { name: 'action_id',         type: 'uuid',        nullable: false, flags: ['PK'], default: 'gen_random_uuid()' },
                    { name: 'inference_id',      type: 'uuid',        nullable: false, flags: ['FK'], ref: 'inference_results.inference_id' },
                    { name: 'hive_id',           type: 'uuid',        nullable: false, flags: ['FK'], ref: 'hives.hive_id' },
                    { name: 'advisory_id',       type: 'uuid',        nullable: false, flags: ['FK'], ref: 'advisories.advisory_id' },
                    { name: 'template_id',       type: 'bigint',      nullable: false, flags: ['FK'], ref: 'advisory_templates.template_id' },
                    { name: 'confidence_score',  type: 'numeric',     nullable: false },
                    { name: 'action_title',      type: 'varchar(200)',nullable: false },
                    { name: 'action_description',type: 'text',        nullable: false },
                    { name: 'priority_level',    type: 'varchar(20)', nullable: false, default: "'medium'" },
                    { name: 'status',            type: 'varchar(20)', nullable: false, default: "'pending'" },
                    { name: 'completed_at',      type: 'timestamp',   nullable: true },
                    { name: 'notes',             type: 'text',        nullable: true },
                    { name: 'created_at',        type: 'timestamp',   nullable: true,  default: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at',        type: 'timestamp',   nullable: true,  default: 'CURRENT_TIMESTAMP' },
                ],
            },
        ],
    },
    {
        label: 'Alerts & Logs',
        color: '#dc2626',
        tables: [
            {
                name: 'alerts',
                columns: [
                    { name: 'alert_id',          type: 'uuid',        nullable: false, flags: ['PK'] },
                    { name: 'hive_id',           type: 'uuid',        nullable: false, flags: ['FK'], ref: 'hives.hive_id' },
                    { name: 'inference_id',      type: 'uuid',        nullable: false, flags: ['FK'], ref: 'inference_results.inference_id' },
                    { name: 'severity_level',    type: 'varchar(20)', nullable: false, notes: 'high | medium | low' },
                    { name: 'recommended_action',type: 'text',        nullable: true },
                    { name: 'action_status',     type: 'varchar(20)', nullable: false, notes: 'pending | acknowledged | resolved' },
                    { name: 'alert_timestamp',   type: 'timestamp',   nullable: true },
                    { name: 'created_at',        type: 'timestamp',   nullable: true },
                    { name: 'updated_at',        type: 'timestamp',   nullable: true },
                    { name: 'advisory_id',       type: 'uuid',        nullable: true,  flags: ['FK'], ref: 'advisories.advisory_id' },
                ],
            },
            {
                name: 'system_logs',
                columns: [
                    { name: 'log_id',     type: 'uuid',        nullable: false, flags: ['PK'] },
                    { name: 'level',      type: 'varchar(20)', nullable: false, notes: 'info | warning | error' },
                    { name: 'event_type', type: 'varchar(50)', nullable: false },
                    { name: 'message',    type: 'text',        nullable: false },
                    { name: 'details',    type: 'jsonb',       nullable: true },
                    { name: 'hive_id',    type: 'uuid',        nullable: true,  flags: ['FK'], ref: 'hives.hive_id' },
                    { name: 'user_id',    type: 'uuid',        nullable: true,  flags: ['FK'], ref: 'users.user_id' },
                    { name: 'audio_id',   type: 'uuid',        nullable: true,  flags: ['FK'], ref: 'audio_sources.audio_id' },
                    { name: 'created_at', type: 'timestamp',   nullable: true,  flags: ['IDX'] },
                ],
            },
            {
                name: 'system_settings',
                columns: [
                    { name: 'id',         type: 'bigint',    nullable: false, flags: ['PK'], default: 'auto-increment' },
                    { name: 'key',        type: 'varchar',   nullable: false, flags: ['UK'] },
                    { name: 'value',      type: 'text',      nullable: true },
                    { name: 'created_at', type: 'timestamp', nullable: true },
                    { name: 'updated_at', type: 'timestamp', nullable: true },
                ],
            },
        ],
    },
];

// ── Flag badge ────────────────────────────────────────────────────
const FLAG_CFG: Record<ColFlag, { label: string; bg: string; text: string; icon?: React.ReactNode }> = {
    PK:  { label: 'PK',  bg: '#fef3c7', text: '#92400e', icon: <Key className="w-2.5 h-2.5" /> },
    FK:  { label: 'FK',  bg: '#eff6ff', text: '#1d4ed8', icon: <Link2 className="w-2.5 h-2.5" /> },
    UK:  { label: 'UK',  bg: '#f5f3ff', text: '#6d28d9', icon: <Lock className="w-2.5 h-2.5" /> },
    IDX: { label: 'IDX', bg: '#f0fdf4', text: '#15803d', icon: null },
};

function FlagBadge({ flag }: { flag: ColFlag }) {
    const cfg = FLAG_CFG[flag];
    return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: cfg.bg, color: cfg.text }}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
}

// ── Table card ────────────────────────────────────────────────────
function TableCard({ table, groupColor }: { table: Table; groupColor: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100"
                style={{ borderLeftWidth: 3, borderLeftColor: groupColor, borderLeftStyle: 'solid' }}>
                <Table2 className="w-4 h-4 shrink-0" style={{ color: groupColor }} />
                <span className="font-mono font-bold text-sm" style={{ color: '#0d1b2a' }}>{table.name}</span>
                <span className="ml-auto text-[11px] text-gray-400">{table.columns.length} columns</span>
            </div>

            {/* Columns */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 w-6">#</th>
                            <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Column</th>
                            <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Type</th>
                            <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Null</th>
                            <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Default</th>
                            <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Keys / Ref</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {table.columns.map((col, i) => {
                            const isPK = col.flags?.includes('PK');
                            return (
                                <tr key={col.name}
                                    className="hover:bg-gray-50 transition-colors"
                                    style={isPK ? { backgroundColor: '#fffbeb' } : {}}>
                                    <td className="px-4 py-2 tabular-nums" style={{ color: '#0d1b2a' }}>{i + 1}</td>
                                    <td className="px-4 py-2">
                                        <span className={`font-mono font-semibold ${isPK ? 'text-amber-700' : ''}`} style={{ color: isPK ? undefined : '#0d1b2a' }}>
                                            {col.name}
                                        </span>
                                        {col.notes && (
                                            <div className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded mt-0.5 font-mono">
                                                {col.notes}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                                            {col.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        {col.nullable
                                            ? <span className="text-gray-400">YES</span>
                                            : <span className="font-semibold" style={{ color: '#0d1b2a' }}>NO</span>}
                                    </td>
                                    <td className="px-4 py-2">
                                        {col.default
                                            ? <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">{col.default}</span>
                                            : <span style={{ color: '#0d1b2a' }}>—</span>}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {col.flags?.map((f) => <FlagBadge key={f} flag={f} />)}
                                            {col.ref && (
                                                <span className="font-mono text-[11px] text-blue-500">
                                                    → {col.ref}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────
export default function DatabaseSchema() {
    const totalTables  = SCHEMA.reduce((s, g) => s + g.tables.length, 0);
    const totalColumns = SCHEMA.reduce((s, g) => s + g.tables.reduce((t, tbl) => t + tbl.columns.length, 0), 0);

    return (
        <>
            <Head title="Database Schema" />
            <div className="flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="flex-1 p-6 flex flex-col gap-6">

                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-gray-400" />
                                <h1 className="text-xl font-bold" style={{ color: '#0d1b2a' }}>Database Schema</h1>
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5">PostgreSQL · beehive database</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center shadow-sm">
                                <p className="text-[11px] text-gray-400">Tables</p>
                                <p className="text-lg font-bold" style={{ color: '#0d1b2a' }}>{totalTables}</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center shadow-sm">
                                <p className="text-[11px] text-gray-400">Columns</p>
                                <p className="text-lg font-bold" style={{ color: '#0d1b2a' }}>{totalColumns}</p>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
                        {(Object.entries(FLAG_CFG) as [ColFlag, typeof FLAG_CFG[ColFlag]][]).map(([key, cfg]) => (
                            <div key={key} className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                                    {cfg.icon}{cfg.label}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {key === 'PK' ? 'Primary key' : key === 'FK' ? 'Foreign key' : key === 'UK' ? 'Unique' : 'Indexed'}
                                </span>
                            </div>
                        ))}
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">type</span>
                            <span className="text-xs text-gray-500">PostgreSQL type</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">default</span>
                            <span className="text-xs text-gray-500">Default value</span>
                        </div>
                    </div>

                    {/* Groups */}
                    {SCHEMA.map((group) => (
                        <div key={group.label} className="flex flex-col gap-4">
                            {/* Group header */}
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0d1b2a' }}>{group.label}</h2>
                                <span className="text-xs text-gray-400">{group.tables.length} table{group.tables.length !== 1 ? 's' : ''}</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            {/* Tables grid */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {group.tables.map((table) => (
                                    <TableCard key={table.name} table={table} groupColor={group.color} />
                                ))}
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </>
    );
}

DatabaseSchema.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'Database Schema', href: '/database-schema' },
    ]}>
        {page}
    </AppLayout>
);
