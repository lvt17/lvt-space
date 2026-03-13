/**
 * Parse price input with optional k/m/tr suffixes.
 *
 * Supported formats:
 *   500k        → 500,000
 *   1.5m / 1.5tr → 1,500,000
 *   1m4 / 1tr4  → 1,400,000
 *   500000      → 500,000  (kept as-is)
 *   50.5        → 50.5     (kept as-is)
 *
 * Only k/m/tr suffixes trigger multiplication.
 * Plain integers and floats are returned unchanged.
 */
export function parseCurrency(input: string): number {
    const raw = input.trim().toLowerCase().replace(/,/g, '').replace(/\s/g, '')

    // Pattern: 1m4, 2m5, 1tr4, 2tr5 (millions with decimal shorthand)
    const mPattern = raw.match(/^(\d+)(m|tr)(\d+)?$/)
    if (mPattern) {
        const millions = parseInt(mPattern[1], 10)
        const fraction = mPattern[3] ? parseInt(mPattern[3], 10) : 0
        const fractionStr = mPattern[3] ?? '0'
        const divisor = Math.pow(10, fractionStr.length)
        return (millions + fraction / divisor) * 1_000_000
    }

    // Pattern: 1.5m, 2.5tr (millions with decimal)
    const mDecPattern = raw.match(/^(\d+\.?\d*)(m|tr)$/)
    if (mDecPattern) {
        return parseFloat(mDecPattern[1]) * 1_000_000
    }

    // Pattern: 500k, 1.5k (thousands)
    const kPattern = raw.match(/^(\d+\.?\d*)k$/)
    if (kPattern) {
        return parseFloat(kPattern[1]) * 1_000
    }

    // Plain number — keep as-is (no auto-multiplication)
    const num = parseFloat(raw)
    if (isNaN(num)) return 0
    return num
}

/**
 * Format a raw number into Vietnamese đồng display string.
 * e.g. 1400000 → "1.400.000₫"
 *      900000  → "900.000₫"
 */
export function formatVND(amount: number | string): string {
    const num = Number(amount)
    if (isNaN(num)) return '0₫'
    return num.toLocaleString('vi-VN') + '₫'
}

/**
 * Short format for compact display.
 * e.g. 1400000 → "1,4tr"
 *      900000  → "900k"
 *      25000000 → "25tr"
 */
export function formatVNDShort(amount: number): string {
    if (amount >= 1_000_000) {
        const tr = amount / 1_000_000
        return Number.isInteger(tr) ? `${tr}tr` : `${tr.toFixed(1).replace('.', ',')}tr`
    }
    if (amount >= 1_000) {
        const k = amount / 1_000
        return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1).replace('.', ',')}k`
    }
    return amount.toLocaleString('vi-VN') + '₫'
}
