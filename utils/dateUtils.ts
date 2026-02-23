/**
 * Date Utilities
 * 
 * Ensures consistent date parsing across the application by handling 
 * timezone offsets correctly (especially parsing naive backend timestamps as UTC).
 */

/**
 * Parses a date string or timestamp, assuming it's UTC if no timezone is provided,
 * and formats it consistently for display.
 */
export const formatDisplayDate = (dateInput: string | number | Date | null | undefined): string => {
    if (!dateInput) return 'N/A';
    
    try {
        let dateObj = new Date(dateInput);
        
        // If it's a string missing a 'Z', force it to UTC before parsing to avoid local browser offsets 
        // improperly shifting the day back for naive timestamps
        if (typeof dateInput === 'string' && !dateInput.endsWith('Z') && dateInput.includes('T')) {
            dateObj = new Date(dateInput + 'Z');
        }

        if (isNaN(dateObj.getTime())) return 'Invalid Date';

        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(dateObj);
    } catch {
        return 'Invalid Date';
    }
};

/**
 * Parses a date string or timestamp and formats it with time for detailed views.
 */
export const formatDisplayDateTime = (dateInput: string | number | Date | null | undefined): string => {
    if (!dateInput) return 'N/A';
    
    try {
        let dateObj = new Date(dateInput);
        
        if (typeof dateInput === 'string' && !dateInput.endsWith('Z') && dateInput.includes('T')) {
            dateObj = new Date(dateInput + 'Z');
        }

        if (isNaN(dateObj.getTime())) return 'Invalid Date';

        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(dateObj);
    } catch {
        return 'Invalid Date';
    }
};
