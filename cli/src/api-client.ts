import config from './config.js'

class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
        this.name = 'ApiError'
    }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const token = config.get('token')
    if (!token) {
        throw new Error('Chưa đăng nhập. Chạy: lvt login')
    }

    const baseUrl = config.get('apiUrl')
    const url = `${baseUrl}${path}`

    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options?.headers || {}),
        },
    })

    if (res.status === 204) return undefined as T

    if (res.status === 401) {
        throw new ApiError(401, 'Token không hợp lệ hoặc đã hết hạn. Chạy: lvt login')
    }

    if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new ApiError(res.status, (data as { error?: string }).error || `API error: ${res.status}`)
    }

    return res.json()
}

/**
 * API call without auth (for CLI auth flow)
 */
export async function apiPublic<T>(path: string, options?: RequestInit): Promise<T> {
    const baseUrl = config.get('apiUrl')
    const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
    })
    if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new ApiError(res.status, (data as { error?: string }).error || `API error: ${res.status}`)
    }
    return res.json()
}
