import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// System keys to exclude from cleaning
const EXCLUDE_KEYS = new Set([
    'id', 'url', 'href', 'path', 'date', 'created_at', 'updated_at',
    'deleted_at', 'timestamp', 'email', 'password', 'token'
]);
const EXCLUDE_KEY_PATTERNS = ['status', 'state', 'type'];

// Check if key should be excluded
const shouldExclude = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    return EXCLUDE_KEYS.has(lowerKey) ||
           EXCLUDE_KEY_PATTERNS.some(pattern => lowerKey.includes(pattern));
};

// String cleaning helpers
const stripUnderscores = (str: string): string => str.replace(/_/g, ' ');
const trimAndCollapse = (str: string): string => str.trim().replace(/\s+/g, ' ');
const toTitleCase = (str: string): string =>
    str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
const toSentenceCase = (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// Determine field type based on key
const getFieldType = (key: string): 'short' | 'long' | 'other' => {
    const lowerKey = key.toLowerCase();
    if (['name', 'location', 'title', 'label', 'subject'].some(k => lowerKey.includes(k))) {
        return 'short';
    }
    if (['description', 'notes', 'summary', 'comment', 'message'].some(k => lowerKey.includes(k))) {
        return 'long';
    }
    return 'other';
};

// Recursive sanitizer function
const sanitizeData = (data: any, parentKey: string = ''): any => {
    if (data === null || data === undefined) return data;
    if (typeof data === 'boolean' || typeof data === 'number') return data;

    if (typeof data === 'string') {
        if (shouldExclude(parentKey)) return data;
        
        let cleaned = stripUnderscores(data);
        cleaned = trimAndCollapse(cleaned);
        
        const fieldType = getFieldType(parentKey);
        if (fieldType === 'short') {
            cleaned = toTitleCase(cleaned);
        } else if (fieldType === 'long') {
            // For long fields: convert entire string to lowercase first, then sentence case
            cleaned = toSentenceCase(cleaned.toLowerCase());
        } else {
            // For other fields: still clean underscores and trim, but keep original case unless it's all caps
            if (cleaned === cleaned.toUpperCase()) {
                cleaned = toTitleCase(cleaned);
            }
        }
        
        return cleaned;
    }

    if (Array.isArray(data)) {
        return data.map((item, index) => sanitizeData(item, parentKey));
    }

    if (typeof data === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeData(value, key);
        }
        return sanitized;
    }

    return data;
};

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
        return pages[`./pages/${name}.tsx`];
    },
    transformProps: (props) => {
        return sanitizeData(props);
    },
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: false,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
