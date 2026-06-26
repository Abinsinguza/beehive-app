import { Head, usePage } from '@inertiajs/react';
import { CheckCircle, X } from 'lucide-react';
import { useState } from 'react';
import { MlServerConfigForm } from '@/components/system-config/ml-server-config-form';
import type { MlServerSettings } from '@/components/system-config/ml-server-config-form';

type Settings = MlServerSettings;

export default function SystemConfig({ settings }: { settings: Settings }) {
    const { props } = usePage<{
        flash?: { success?: string; error?: string };
    }>();
    const flash = props.flash;

    const [flashDismissed, setFlashDismissed] = useState(false);

    const showFlash = !flashDismissed && (flash?.success || flash?.error);

    return (
        <>
            <Head title="System Settings" />

            <div
                className="flex flex-col gap-5 p-6"
                style={{ backgroundColor: '#f8f9fa' }}
            >
                {/* Flash banner */}
                {showFlash && (
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium"
                        style={{
                            backgroundColor: flash?.success
                                ? '#ecfdf5'
                                : '#fef2f2',
                            color: flash?.success ? '#065f46' : '#991b1b',
                            border: flash?.success
                                ? '1px solid #a7f3d0'
                                : '1px solid #fecaca',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span>{flash?.success ?? flash?.error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFlashDismissed(true)}
                            className="rounded p-0.5 hover:opacity-70"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Page heading */}
                <div>
                    <h1
                        className="text-2xl font-bold"
                        style={{ color: '#0d1b2a' }}
                    >
                        System Settings
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">
                        Configure swarm detection algorithms and global
                        integration keys.
                    </p>
                </div>

                <MlServerConfigForm settings={settings} />
            </div>
        </>
    );
}

SystemConfig.layout = {
    breadcrumbs: [
        { title: 'Admin Dashboard', href: '/dashboard' },
        { title: 'System Settings', href: '/system-config' },
    ],
};
