export function toSentenceCase(text: string | null | undefined): string {
    if (!text) return '';
    // Replace underscores with spaces, lowercase everything first
    const cleaned = text.replace(/_/g, ' ').toLowerCase().trim();
    // Capitalize only the first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function toTitleCase(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
