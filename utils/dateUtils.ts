/**
 * Date Utilities
 * 
 * Ensures consistent date parsing across the application by handling 
 * timezone offsets correctly (especially parsing naive backend timestamps as UTC).
 */

/**
 * Normalizes a backend timestamp string to an ISO-8601 format.
 * Handles naive "YYYY-MM-DD HH:MM:SS" (space separator) and
 * "YYYY-MM-DDTHH:MM:SS" (T separator) strings, both treated as UTC.
 */
const normalizeToUTC = (dateInput: string | number | Date | null | undefined): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
    if (typeof dateInput === 'number') return new Date(dateInput);

    let str = dateInput.trim();
    if (!str) return null;

    // 1. Try parsing as-is first (handles ISO8601 with tz offset e.g. "2024-02-24T09:00:00.123456+00:00")
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;

    // 2. Convert space-separated "YYYY-MM-DD HH:MM:SS[.ffffff]" → "YYYY-MM-DDTHH:MM:SS[.ffffff]"
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) {
        str = str.replace(' ', 'T');
    }

    // 3. If still no tz info, treat as UTC
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str) && !/[Zz]$/.test(str) && !/[+-]\d{2}:\d{2}$/.test(str) && !/[+-]\d{4}$/.test(str)) {
        str = str + 'Z';
    }

    d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Parses a date string or timestamp, assuming it's UTC if no timezone is provided,
 * and formats it as a short date for display: "Feb 24, 2026"
 */
export const formatDisplayDate = (dateInput: string | number | Date | null | undefined): string => {
    const d = normalizeToUTC(dateInput);
    if (!d) return '--';

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(d);
};

/**
 * Parses a date string or timestamp and formats it with time: "Feb 24, 2026, 2:30 PM"
 */
export const formatDisplayDateTime = (dateInput: string | number | Date | null | undefined): string => {
    const d = normalizeToUTC(dateInput);
    if (!d) return '--';

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(d);
};
