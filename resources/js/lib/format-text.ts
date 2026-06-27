export function toSentenceCase(text: string | null | undefined): string {
    if (!text) {
return '';
}

    // Replace underscores with spaces, lowercase everything first
    const cleaned = text.replace(/_/g, ' ').toLowerCase().trim();

    // Capitalize only the first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function toTitleCase(text: string | null | undefined): string {
    if (!text) {
return '';
}

    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function formatDate(value: string | null | undefined): string {
    if (!value) {
return '—';
}

    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(value: string | null | undefined, withSeconds = false): string {
    if (!value) {
return '—';
}

    return new Date(value).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        ...(withSeconds ? { second: '2-digit' } : {}),
    });
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
return '—';
}

    return new Date(value).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}
