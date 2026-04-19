/**
 * Exchange Rate service to handle conversion between USD and VND.
 * Uses a free public API: https://api.exchangerate-api.com/v4/latest/USD
 */

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

interface CachedRate {
    rate: number;
    timestamp: number;
}

// Simple in-memory cache to avoid repeated calls in the same session
let cachedRate: CachedRate | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getUSDToVNDRate(): Promise<number> {
    const now = Date.now();
    
    if (cachedRate && (now - cachedRate.timestamp < CACHE_DURATION)) {
        return cachedRate.rate;
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rate');
        }
        const data = await response.json();
        const rate = data.rates.VND;
        
        if (rate) {
            cachedRate = { rate, timestamp: now };
            return rate;
        }
        throw new Error('VND rate not found in response');
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to a reasonable default if API fails
        return 25000;
    }
}

/**
 * Converts a USD amount to VND.
 * @param amountUSD The amount in USD.
 * @returns The converted amount in VND (rounded to integer).
 */
export async function convertUSDToVND(amountUSD: number): Promise<{ vnd: number, rate: number }> {
    const rate = await getUSDToVNDRate();
    return {
        vnd: Math.round(amountUSD * rate),
        rate
    };
}
