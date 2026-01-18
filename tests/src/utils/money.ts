//parsing money, common assertions, helpers

/**
 * "$  9.00" -> 9
 * "$ 0.00"  -> 0
 * "$9.00"   -> 9
 */
export function parseMoney(text: string): number {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const value = Number(cleaned);
    if (Number.isNaN(value)) {
        throw new Error(`Could not parse money from: "${text}" (cleaned: "${cleaned}")`);
    }
    return value;
}

/**
 * Avoiding floating point issues (e.g. 0.1 + 0.2).
 */
export function toCents(amount: number): number {
    return Math.round(amount * 100);
}

export function centsToDollars(cents: number): number {
    return cents / 100;
}
