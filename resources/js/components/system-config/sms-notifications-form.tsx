import { useForm } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    Key,
    MessageSquare,
    Server,
    Smartphone,
} from 'lucide-react';
import { useRef, useState } from 'react';
import SystemConfigController from '@/actions/App/Http/Controllers/SystemConfigController';

export type SmsSettings = {
    sms_server_url: string;
    sms_username: string;
    sms_api_key: string;
    sms_sender_id: string;
    sms_template: string;
};

const WILDCARDS = [
    { tag: '#beeHive', desc: 'Hive ID' },
    { tag: '#beekeeper', desc: 'Beekeeper name' },
    { tag: '#alertMessage', desc: 'Advisory message' },
    { tag: '#hiveLocation', desc: 'Hive location' },
    { tag: '#alertType', desc: 'Alert severity' },
    { tag: '#prediction', desc: 'ML prediction' },
    { tag: '#timestamp', desc: 'Date & time' },
    { tag: '#confidence', desc: 'Confidence score' },
];

const PREVIEW_MAP: Record<string, string> = {
    '#beeHive': 'BH0042',
    '#beekeeper': 'John Ssekandi',
    '#alertMessage':
        'Inspect hive immediately — colony collapse risk detected.',
    '#hiveLocation': 'North Field, Sector B',
    '#alertType': 'Critical',
    '#prediction': 'Swarm',
    '#timestamp': '2026-04-23 14:32',
    '#confidence': '96.2%',
};

export function SmsNotificationsForm({ settings }: { settings: SmsSettings }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { data, setData, post, processing, errors } = useForm({
        sms_server_url: settings?.sms_server_url ?? '',
        sms_username: settings?.sms_username ?? '',
        sms_api_key: settings?.sms_api_key ?? '',
        sms_sender_id: settings?.sms_sender_id ?? '',
        sms_template: settings?.sms_template ?? '',
    });

    const [showApiKey, setShowApiKey] = useState(false);

    const insertWildcard = (tag: string) => {
        const el = textareaRef.current;

        if (!el) {
            return;
        }

        const start = el.selectionStart ?? data.sms_template.length;
        const end = el.selectionEnd ?? data.sms_template.length;
        const next =
            data.sms_template.slice(0, start) +
            tag +
            data.sms_template.slice(end);
        setData('sms_template', next);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + tag.length, start + tag.length);
        });
    };

    const previewText = Object.entries(PREVIEW_MAP).reduce(
        (txt, [key, val]) => txt.replaceAll(key, val),
        data.sms_template,
    );

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(SystemConfigController.updateSms.url());
    };

    return (
        <form
            onSubmit={submit}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
            <div className="mb-1 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-gray-400" />
                <h2
                    className="text-base font-semibold"
                    style={{ color: '#0d1b2a' }}
                >
                    SMS Notifications
                </h2>
            </div>
            <div className="mb-5 h-px" style={{ backgroundColor: '#f5a623' }} />

            {/* Server URL */}
            <div className="mb-4">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                    <Server className="mr-1 inline h-3 w-3" />
                    SMS Server URL
                </label>
                <input
                    type="url"
                    value={data.sms_server_url}
                    onChange={(e) => setData('sms_server_url', e.target.value)}
                    placeholder="https://comms-test.pahappa.net/api/v1/json/"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-300 outline-none"
                    style={{ color: '#0d1b2a' }}
                />
                {errors.sms_server_url && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.sms_server_url}
                    </p>
                )}
            </div>

            {/* Username + Sender ID */}
            <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                        Username
                    </label>
                    <input
                        type="text"
                        value={data.sms_username}
                        onChange={(e) =>
                            setData('sms_username', e.target.value)
                        }
                        placeholder="your-sms-username"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-300 outline-none"
                        style={{ color: '#0d1b2a' }}
                    />
                    {errors.sms_username && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.sms_username}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                        Sender ID
                    </label>
                    <input
                        type="text"
                        value={data.sms_sender_id}
                        onChange={(e) =>
                            setData('sms_sender_id', e.target.value)
                        }
                        placeholder="BeeHive"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-300 outline-none"
                        style={{ color: '#0d1b2a' }}
                    />
                    {errors.sms_sender_id && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.sms_sender_id}
                        </p>
                    )}
                </div>
            </div>

            {/* API Key */}
            <div className="mb-5">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                    <Key className="mr-1 inline h-3 w-3" />
                    API Key
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type={showApiKey ? 'text' : 'password'}
                        value={data.sms_api_key}
                        onChange={(e) => setData('sms_api_key', e.target.value)}
                        placeholder="••••••••••••••••"
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-300 outline-none"
                        style={{ color: '#0d1b2a' }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowApiKey((v) => !v)}
                        className="rounded-lg border border-gray-200 p-2.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-800"
                    >
                        {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {errors.sms_api_key && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.sms_api_key}
                    </p>
                )}
            </div>

            {/* SMS Template */}
            <div className="mb-5">
                <label className="mb-1.5 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                    <MessageSquare className="mr-1 inline h-3 w-3" />
                    SMS Template
                </label>
                <textarea
                    ref={textareaRef}
                    value={data.sms_template}
                    onChange={(e) => setData('sms_template', e.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 font-mono text-sm outline-none"
                    style={{ color: '#0d1b2a' }}
                />
                {errors.sms_template && (
                    <p className="mt-1 text-xs text-red-500">
                        {errors.sms_template}
                    </p>
                )}

                {/* Wildcard chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {WILDCARDS.map(({ tag, desc }) => (
                        <button
                            key={tag}
                            type="button"
                            title={desc}
                            onClick={() => insertWildcard(tag)}
                            className="rounded border border-gray-200 px-2 py-1 font-mono text-[10px] text-gray-400 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {/* Preview */}
                {data.sms_template && (
                    <div
                        className="mt-3 rounded-lg border border-dashed border-gray-200 p-3"
                        style={{ backgroundColor: '#f8f9fa' }}
                    >
                        <p className="mb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                            Preview
                        </p>
                        <p
                            className="text-xs whitespace-pre-line"
                            style={{ color: '#0d1b2a' }}
                        >
                            {previewText}
                        </p>
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={processing}
                className="w-full rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#f5a623', color: '#0d1b2a' }}
            >
                {processing ? 'Saving…' : 'Save SMS Notification Settings'}
            </button>
        </form>
    );
}
