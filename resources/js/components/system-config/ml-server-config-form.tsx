import { useForm } from '@inertiajs/react';
import { AlertOctagon, Eye, EyeOff, Key, Server } from 'lucide-react';
import { useState } from 'react';
import SystemConfigController from '@/actions/App/Http/Controllers/SystemConfigController';
import { Toggle } from '@/components/system-config/toggle';

export type MlServerSettings = {
    ml_server_name: string | null;
    ml_server_url: string | null;
    ml_admin_key: string | null;
    ml_description: string | null;
    ml_is_active: boolean;
    ml_admin_key_id: string | null;
};

export function MlServerConfigForm({
    settings,
}: {
    settings: MlServerSettings;
}) {
    const { data, setData, post, processing, errors } = useForm({
        ml_server_name: settings?.ml_server_name ?? '',
        ml_server_url: settings?.ml_server_url ?? '',
        ml_admin_key: settings?.ml_admin_key ?? '',
        ml_description: settings?.ml_description ?? '',
        ml_is_active: settings?.ml_is_active ?? true,
        ml_admin_key_id: settings?.ml_admin_key_id ?? '',
    });

    const [showMlAdminKey, setShowMlAdminKey] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(SystemConfigController.updateMl.url());
    };

    return (
        <form
            onSubmit={submit}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
            <div className="mb-1 flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-gray-500" />
                <h2
                    className="text-base font-semibold"
                    style={{ color: '#0d1b2a' }}
                >
                    ML Server Configuration
                </h2>
            </div>
            <div className="mb-5 h-px" style={{ backgroundColor: '#f5a623' }} />

            {/* ML Server Name */}
            <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                    ML Server Name
                </label>
                <input
                    type="text"
                    value={data.ml_server_name}
                    onChange={(e) => setData('ml_server_name', e.target.value)}
                    placeholder="My ML Server"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none"
                />
                {errors.ml_server_name && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.ml_server_name}
                    </p>
                )}
            </div>

            {/* ML Server URL */}
            <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                    <Server className="mr-1 inline h-3 w-3" />
                    ML Server URL
                </label>
                <input
                    type="url"
                    value={data.ml_server_url}
                    onChange={(e) => setData('ml_server_url', e.target.value)}
                    placeholder="https://ml-server.example.com"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none"
                />
                {errors.ml_server_url && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.ml_server_url}
                    </p>
                )}
            </div>

            {/* ML Admin Key */}
            <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                    <Key className="mr-1 inline h-3 w-3" />
                    ML Admin Key
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type={showMlAdminKey ? 'text' : 'password'}
                        value={data.ml_admin_key}
                        onChange={(e) =>
                            setData('ml_admin_key', e.target.value)
                        }
                        placeholder="••••••••••••••••"
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowMlAdminKey((v) => !v)}
                        className="rounded-lg border border-gray-200 p-2.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                    >
                        {showMlAdminKey ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {errors.ml_admin_key && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.ml_admin_key}
                    </p>
                )}
            </div>

            {/* ML Description */}
            <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                    Description
                </label>
                <textarea
                    value={data.ml_description}
                    onChange={(e) => setData('ml_description', e.target.value)}
                    placeholder="Description of this ML server"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none"
                    rows={3}
                />
                {errors.ml_description && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.ml_description}
                    </p>
                )}
            </div>

            {/* ML Is Active */}
            <div className="mb-5">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                    Is Active
                </label>
                <Toggle
                    on={data.ml_is_active}
                    onChange={() => setData('ml_is_active', !data.ml_is_active)}
                />
            </div>

            {/* Hidden field for ML Admin Key ID */}
            <input type="hidden" value={data.ml_admin_key_id} />

            <button
                type="submit"
                disabled={processing}
                className="w-full rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
            >
                {processing ? 'Saving…' : 'Save ML Server Settings'}
            </button>
        </form>
    );
}
