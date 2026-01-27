/**
 * Timeout constants for test stability
 */
export const TIMEOUTS = {
    SHORT: 150,           // Short delay for retries
    CLICK: 3000,          // Click action timeout
    POLL_SHORT: 5000,     // Short polling timeout
    POLL_MEDIUM: 8000,    // Medium polling timeout
    POLL_LONG: 15000,     // Long polling timeout
    GRID_STABLE: 15000,   // Grid stability wait
    PRODUCT_VISIBLE: 15000, // Product visibility wait
} as const;
