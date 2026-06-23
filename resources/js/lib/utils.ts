import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toSentenceCase } from './format-text';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export const formatDisplayText = (value: string | number | null | undefined): string => {
    return toSentenceCase(String(value ?? ''));
};

/**
 * Helper to safely get nested property value using dot notation
 * @param obj Object to get value from
 * @param path Dot notation path (e.g., "owner.name")
 * @returns Value at path or undefined if not found
 */
function getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
        if (current == null) return undefined;
        return current[key];
    }, obj);
}

/**
 * Helper to safely set nested property value using dot notation
 * @param obj Object to modify
 * @param path Dot notation path (e.g., "owner.name")
 * @param value Value to set
 */
function setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
        if (current[key] == null) {
            current[key] = {};
        }
        return current[key];
    }, obj);
    target[lastKey] = value;
}

/**
 * Cleans an array of data objects using formatDisplayText on specified fields
 * Supports nested properties via dot notation (e.g., "owner.name")
 * @param data Array of data objects to clean
 * @param fieldsToClean Array of field names/paths to apply the cleaning to
 * @returns Cleaned array of objects
 */
export const cleanDataArray = <T extends Record<string, any>>(
    data: T[],
    fieldsToClean: string[]
): T[] => {
    return data.map(item => {
        const cleanedItem = JSON.parse(JSON.stringify(item)); // Deep copy to avoid mutating original
        fieldsToClean.forEach(field => {
            const value = getNestedValue(cleanedItem, field);
            if (value != null) {
                const cleanedValue = formatDisplayText(value);
                setNestedValue(cleanedItem, field, cleanedValue);
            }
        });
        return cleanedItem as T;
    });
};
