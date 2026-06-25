import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, Calendar, CheckCircle, CheckCircle2, ChevronLeft, FolderPlus, Hexagon, KeyRound, Mail, MapPin, Phone, Plus, RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { toSentenceCase } from '@/lib/format-text';

type Hive = {
    id: string;
    hive_name: string;
    hive_location: string;
    hive_type: string;
    current_state: string;
};

type Beekeeper = {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    address: string | null;
    status: string;
    beehives_count: number;
    beehives: Hive[];
    created_at: string | null;
    api_key: string | null;
};

const statusConfig: Record<string, { dot: string; label: string; labelColor: string }> = {
    active:    { dot: '#22c55e', label: 'Active',    labelColor: '#16a34a' },
    pending:   { dot: '#f59e0b', label: 'Pending',   labelColor: '#d97706' },
    revoked:   { dot: '#94a3b8', label: 'Revoked',   labelColor: '#94a3b8' },
};

const hiveStateColors: Record<string, string> = {
    active:   '#16a34a',
    inactive: '#94a3b8',
    migrated: '#2563eb',
    lost:     '#dc2626',
    unknown:  '#64748b',
};

function getInitials(name: string) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

// Geocoding function using OpenStreetMap Nominatim
async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
            };
        }
        return null;
    } catch (e) {
        console.error('Geocoding error:', e);
        return null;
    }
}

// Success Modal Component
function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold" style={{ color: '#0d1b2a' }}>Hive Created!</h3>
                    <p className="text-sm text-gray-600 mt-2">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                >
                    Got it!
                </button>
            </div>
        </div>
    );
}

// ── Add Hive modal ──────────────────────────────────────────────
function AddHiveModal({ beekeeperId, onClose }: { beekeeperId: string; onClose: () => void }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        hive_name: '', hive_location: '', hive_type: '', installation_date: '', latitude: '', longitude: '',
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // Geocode location when it changes
    useEffect(() => {
        if (data.hive_location && data.hive_location.length > 3) {
            const timeoutId = setTimeout(async () => {
                const coords = await geocodeLocation(data.hive_location);
                if (coords) {
                    setData('latitude', coords.lat.toString());
                    setData('longitude', coords.lon.toString());
                }
            }, 1000); // Debounce 1 second
            return () => clearTimeout(timeoutId);
        }
    }, [data.hive_location, setData]);

    const handleUseCurrentLocation = () => {
        setIsGettingLocation(true);
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            setIsGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setData('latitude', position.coords.latitude.toString());
                setData('longitude', position.coords.longitude.toString());
                setIsGettingLocation(false);
            },
            (error) => {
                alert(`Error getting location: ${error.message}`);
                setIsGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/beekeepers/${beekeeperId}/hives`, { 
            onSuccess: (page: any) => { 
                reset(); 
                onClose();
                setSuccessMessage(page.props?.flash?.success || 'Hive created successfully');
                setShowSuccessModal(true);
            } 
        });
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-hidden">
                <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[85vh]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                        <h2 className="text-base font-semibold" style={{ color: '#0d1b2a' }}>Add New Hive</h2>
                        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={submit} className="px-6 pb-6 pt-4 flex flex-col gap-4 overflow-y-auto">
                        {/* Hive Name */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                Hive Name
                                <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.hive_name}
                                onChange={(e) => setData('hive_name', e.target.value)}
                                placeholder="e.g. Hive 21 — Lang"
                                required
                                className={[
                                    'w-full rounded-lg px-3.5 py-2.5 text-sm placeholder-gray-400',
                                    'border outline-none transition-colors',
                                    errors.hive_name
                                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                                        : 'border-gray-300 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
                                ].join(' ')}
                                style={{ color: '#0d1b2a' }}
                            />
                            {errors.hive_name && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span>⚠</span> {errors.hive_name}
                                </p>
                            )}
                        </div>

                        {/* Hive Location */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                Hive Location
                                <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.hive_location}
                                onChange={(e) => setData('hive_location', e.target.value)}
                                placeholder="e.g. Mukono"
                                required
                                className={[
                                    'w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400',
                                    'border outline-none transition-colors',
                                    errors.hive_location
                                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                                        : 'border-gray-300 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
                                ].join(' ')}
                            />
                            {errors.hive_location && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span>⚠</span> {errors.hive_location}
                                </p>
                            )}
                        </div>

                        {/* Hive Type */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                Hive Type
                                <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.hive_type}
                                onChange={(e) => setData('hive_type', e.target.value)}
                                placeholder="e.g. Langstroth"
                                required
                                className={[
                                    'w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400',
                                    'border outline-none transition-colors',
                                    errors.hive_type
                                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                                        : 'border-gray-300 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
                                ].join(' ')}
                            />
                            {errors.hive_type && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span>⚠</span> {errors.hive_type}
                                </p>
                            )}
                        </div>

                        {/* Installation Date */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                Installation Date
                                <span className="text-red-500 font-bold">*</span>
                            </label>
                            <input
                                type="date"
                                value={data.installation_date}
                                onChange={(e) => setData('installation_date', e.target.value)}
                                required
                                className={[
                                    'w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400',
                                    'border outline-none transition-colors',
                                    errors.installation_date
                                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                                        : 'border-gray-300 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
                                ].join(' ')}
                            />
                            {errors.installation_date && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <span>⚠</span> {errors.installation_date}
                                </p>
                            )}
                        </div>

                        {/* GPS Coordinates */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                    GPS Coordinates
                                    <span className="text-xs font-normal text-gray-400">(optional)</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={handleUseCurrentLocation}
                                    disabled={isGettingLocation}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                    {isGettingLocation ? 'Getting location…' : 'Use Current Location'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-gray-500 font-medium">Latitude</span>
                                    <input
                                        type="number"
                                        min="-90" max="90"
                                        value={data.latitude}
                                        onChange={(e) => setData('latitude', e.target.value)}
                                        placeholder="e.g. 0.347596"
                                        className={[
                                            'w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400',
                                            'border outline-none transition-colors',
                                            errors.latitude
                                                ? 'border-red-400 bg-red-50 focus:border-red-500'
                                                : 'border-gray-300 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
                                        ].join(' ')}
                                    />
                                    {errors.latitude && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <span>⚠</span> {errors.latitude}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-gray-500 font-medium">Longitude</span>
                                    <input
                                        type="number"
                                        min="-180" max="180"
                                        value={data.longitude}
                                        onChange={(e) => setData('longitude', e.target.value)}
                                        placeholder="e.g. 32.582520"
                                        className={[
                                            'w-full rounded-lg px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400',
                                            'border outline-none transition-colors',
                                            errors.longitude
                                                ? 'border-red-400 bg-red-50 focus:border-red-500'
                                                : 'border-gray-300 bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
                                        ].join(' ')}
                                    />
                                    {errors.longitude && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <span>⚠</span> {errors.longitude}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-1">
                            <button type="button" onClick={onClose}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={processing}
                                className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                                style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}>
                                {processing ? 'Adding…' : 'Add Hive'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <SuccessModal 
                    message={successMessage} 
                    onClose={() => setShowSuccessModal(false)} 
                />
            )}
        </>
    );
}

export default function BeekeeperShow({ beekeeper }: { beekeeper: Beekeeper }) {
    const sc = statusConfig[beekeeper.status] ?? statusConfig.active;
    const [showAddHive, setShowAddHive] = useState(false);

    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [flashDismissed, setFlashDismissed] = useState(false);
    useEffect(() => { setFlashDismissed(false); }, [flash?.success, flash?.error]);

    function createFolder(hiveId: string) {
        router.post(`/beehives/${hiveId}/recordings-folder`, {}, { preserveScroll: true });
    }

    const [regenerating, setRegenerating] = useState(false);
    function regenerateApiKey() {
        setRegenerating(true);
        router.post(`/beekeepers/${beekeeper.id}/regenerate-api-key`, {}, {
            preserveScroll: true,
            onFinish: () => setRegenerating(false),
        });
    }

    const [assigning, setAssigning] = useState(false);
    function assignToken() {
        setAssigning(true);
        router.post(`/beekeepers/${beekeeper.id}/assign-token`, {}, {
            preserveScroll: true,
            onFinish: () => setAssigning(false),
        });
    }

    return (
        <>
            <Head title={`${beekeeper.name} — Beekeeper Profile`} />
            <div className="p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Flash messages */}
                {!flashDismissed && flash?.success && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                        <button onClick={() => setFlashDismissed(true)} className="p-0.5 rounded hover:opacity-70">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {!flashDismissed && flash?.error && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                        <button onClick={() => setFlashDismissed(true)} className="p-0.5 rounded hover:opacity-70">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Back */}
                <button
                    onClick={() => router.visit('/beekeepers')}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-800 w-fit"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Beekeepers
                </button>

                {/* ── Header card ─────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                            style={{ backgroundColor: '#0d1b2a' }}
                        >
                            {getInitials(beekeeper.name)}
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold" style={{ color: '#0d1b2a' }}>{beekeeper.name}</h1>
                                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#f1f5f9' }}>
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sc.dot }} />
                                    <span style={{ color: sc.labelColor }}>{sc.label}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400 mt-0.5">
                                {beekeeper.email && (
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5" /> {beekeeper.email}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" /> {beekeeper.phone}
                                </span>
                                {beekeeper.address && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" /> {beekeeper.address}
                                    </span>
                                )}
                                {beekeeper.created_at && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Joined {new Date(beekeeper.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => router.visit(`/beekeepers/${beekeeper.id}/edit`)}
                        className="shrink-0 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                        Edit
                    </button>
                </div>

                {/* ── Stat cards ──────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Hives Owned</p>
                        <p className="text-3xl font-bold mt-2" style={{ color: '#0d1b2a' }}>{beekeeper.beehives_count}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 col-span-2 lg:col-span-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <KeyRound className="w-4 h-4 text-gray-400 shrink-0" />
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 shrink-0"> API Key</p>
                                <span className="text-sm font-mono text-gray-600 truncate">{beekeeper.api_key ?? 'Not set'}</span>
                            </div>
                            <button
                                onClick={assignToken}
                                disabled={assigning}
                                title="Assign an API token from the ML server"
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${assigning ? 'animate-spin' : ''}`} />
                                {assigning ? 'Assigning…' : 'Assign Token'}
                            </button>
                            <button
                                onClick={regenerateApiKey}
                                disabled={regenerating}
                                title="Generate a new API key for this beekeeper"
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                                {regenerating ? 'Generating…' : 'Regenerate'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Hives list ──────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Hexagon className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-sm" style={{ color: '#0d1b2a' }}>Hives</span>
                        </div>
                        <button
                            onClick={() => setShowAddHive(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Hive
                        </button>
                    </div>
                    {beekeeper.beehives.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-sm text-gray-400">No hives registered yet</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {beekeeper.beehives.map((hive) => (
                                <div key={hive.id}
                                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => router.visit(`/beehives/${hive.id}`)}>
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#fff7ed' }}>
                                        <Hexagon className="w-5 h-5" style={{ color: '#c2410c' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate leading-tight" style={{ color: '#0d1b2a' }}>
                                            {hive.hive_name}{hive.hive_type ? ` — ${hive.hive_type}` : ''}
                                        </p>
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{hive.hive_location}</p>
                                    </div>
                                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: '#f1f5f9', color: hiveStateColors[hive.current_state] ?? '#64748b' }}>
                                        {toSentenceCase(hive.current_state)}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); createFolder(hive.id); }}
                                        title="Create / retry recordings folder"
                                        className="shrink-0 p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors"
                                    >
                                        <FolderPlus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {showAddHive && <AddHiveModal beekeeperId={beekeeper.id} onClose={() => setShowAddHive(false)} />}
        </>
    );
}

BeekeeperShow.layout = (page: React.ReactElement) => (
    <AppLayout breadcrumbs={[
        { title: 'Admin Dashboard',  href: '/dashboard' },
        { title: 'Beekeepers',       href: '/beekeepers' },
        { title: 'Beekeeper Profile', href: '#' },
    ]}>
        {page}
    </AppLayout>
);
