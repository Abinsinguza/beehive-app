import { Head, router, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

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
    owner_id: string;
    owner?: { name: string } | null;
};

type User = {
    user_id: string;
    full_name: string;
};

export default function BeehiveEdit({ beehive, owners }: { beehive: Beehive; owners: User[] }) {
    const { data, setData, patch, processing, errors } = useForm({
        owner_id: beehive.owner_id,
        hive_name: beehive.hive_name ?? '',
        hive_location: beehive.hive_location,
        hive_type: beehive.hive_type ?? '',
        installation_date: beehive.installation_date,
        current_state: beehive.current_state,
        latitude: beehive.latitude ?? '',
        longitude: beehive.longitude ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/beehives/${beehive.id}`, {
            onSuccess: () => router.visit(`/beehives/${beehive.id}`),
        });
    };

    return (
        <>
            <Head title={`Edit ${beehive.hive_name ?? 'Hive'}`} />
            <div className="min-h-screen p-6 flex flex-col gap-5" style={{ backgroundColor: '#f8f9fa' }}>

                {/* Back */}
                <button
                    onClick={() => router.visit(`/beehives/${beehive.id}`)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 w-fit"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Hive Profile
                </button>

                {/* Header */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
                    <h1 className="text-2xl font-bold" style={{ color: '#0d1b2a' }}>
                        Edit Hive: {beehive.hive_name ?? '—'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Update hive details and configuration</p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <form onSubmit={submit} className="flex flex-col gap-6">
                        
                        {/* Owner */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Owner</label>
                            <select
                                value={data.owner_id}
                                onChange={(e) => setData('owner_id', e.target.value)}
                                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none bg-white focus:border-gray-400"
                                required
                            >
                                <option value="">Select an owner</option>
                                {owners.map((owner) => (
                                    <option key={owner.user_id} value={owner.user_id}>
                                        {owner.full_name}
                                    </option>
                                ))}
                            </select>
                            {errors.owner_id && <p className="text-xs text-red-500">{errors.owner_id}</p>}
                        </div>

                        {/* Hive Name */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Hive Name</label>
                            <input
                                type="text"
                                value={data.hive_name}
                                onChange={(e) => setData('hive_name', e.target.value)}
                                placeholder="e.g., Hive 01 — Box"
                                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none bg-white focus:border-gray-400"
                            />
                            {errors.hive_name && <p className="text-xs text-red-500">{errors.hive_name}</p>}
                        </div>

                        {/* Hive Type */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Hive Type</label>
                            <input
                                type="text"
                                value={data.hive_type}
                                onChange={(e) => setData('hive_type', e.target.value)}
                                placeholder="e.g., Box, Top-bar"
                                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none bg-white focus:border-gray-400"
                            />
                            {errors.hive_type && <p className="text-xs text-red-500">{errors.hive_type}</p>}
                        </div>

                        {/* Location */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Location</label>
                            <input
                                type="text"
                                value={data.hive_location}
                                onChange={(e) => setData('hive_location', e.target.value)}
                                placeholder="e.g., KIKONI"
                                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none bg-white focus:border-gray-400"
                                required
                            />
                            {errors.hive_location && <p className="text-xs text-red-500">{errors.hive_location}</p>}
                        </div>

                        {/* GPS Coordinates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Latitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={data.latitude}
                                    onChange={(e) => setData('latitude', e.target.value ? parseFloat(e.target.value) : '')}
                                    placeholder="e.g., 0.564547"
                                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none bg-white focus:border-gray-400"
                                />
                                {errors.latitude && <p className="text-xs text-red-500">{errors.latitude}</p>}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Longitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={data.longitude}
                                    onChange={(e) => setData('longitude', e.target.value ? parseFloat(e.target.value) : '')}
                                    placeholder="e.g., 0.678822"
                                    className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none bg-white focus:border-gray-400"
                                />
                                {errors.longitude && <p className="text-xs text-red-500">{errors.longitude}</p>}
                            </div>
                        </div>

                        {/* Installation Date */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Installation Date</label>
                            <input
                                type="date"
                                value={data.installation_date}
                                onChange={(e) => setData('installation_date', e.target.value)}
                                onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch(err) {} }}
                                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none bg-white focus:border-gray-400 cursor-pointer hover:border-gray-400 transition-colors"
                                required
                            />
                            {errors.installation_date && <p className="text-xs text-red-500">{errors.installation_date}</p>}
                        </div>

                        {/* Current State */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold" style={{ color: '#0d1b2a' }}>Current State</label>
                            <select
                                value={data.current_state}
                                onChange={(e) => setData('current_state', e.target.value)}
                                className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none bg-white focus:border-gray-400"
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="migrated">Migrated</option>
                                <option value="lost">Lost</option>
                            </select>
                            {errors.current_state && <p className="text-xs text-red-500">{errors.current_state}</p>}
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => router.visit(`/beehives/${beehive.id}`)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                                style={{ backgroundColor: '#0d1b2a' }}
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

BeehiveEdit.layout = (page: any) => <AppLayout children={page} />;
