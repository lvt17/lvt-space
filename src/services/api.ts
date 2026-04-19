import { supabase } from './supabase'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    // Get current session token
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const res = await fetch(`${BASE}${path}`, {
        headers,
        ...options,
    })
    if (res.status === 204) return undefined as T
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
}

/* ─── Tasks ─── */
export interface TaskRow {
    id: string
    name: string
    deadline: string | null
    price: number
    status: string
    is_paid: boolean
    description: string | null
    currency?: string
    original_amount?: number
    created_at: string
}

export const taskApi = {
    list: () => request<TaskRow[]>('/tasks'),
    create: (data: { name: string; deadline?: string; price: number; description?: string; currency?: string; original_amount?: number }) =>
        request<TaskRow>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<TaskRow>) =>
        request<TaskRow>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    togglePaid: (id: string) =>
        request<TaskRow>(`/tasks/${id}/toggle-paid`, { method: 'PATCH' }),
    remove: (id: string) =>
        request<void>(`/tasks/${id}`, { method: 'DELETE' }),
    removeAll: () =>
        request<void>('/tasks/all', { method: 'DELETE' }),
}

/* ─── Daily Tasks ─── */
export interface DailyTaskRow {
    id: string
    title: string
    scheduled_date: string
    time: string | null
    cost: number
    is_completed: boolean
}

export const dailyTaskApi = {
    today: () => request<DailyTaskRow[]>('/daily-tasks'),
    tomorrow: () => request<DailyTaskRow[]>('/daily-tasks/tomorrow'),
    create: (data: { title: string; scheduled_date?: string; time?: string; cost?: number }) =>
        request<DailyTaskRow>('/daily-tasks', { method: 'POST', body: JSON.stringify(data) }),
    toggle: (id: string) =>
        request<DailyTaskRow>(`/daily-tasks/${id}/toggle`, { method: 'PATCH' }),
    remove: (id: string) =>
        request<void>(`/daily-tasks/${id}`, { method: 'DELETE' }),
}

/* ─── Income ─── */
export interface IncomeRow {
    id: string
    task_name: string
    category: string | null
    received_date: string
    amount: number
    status: string
    currency?: string
    original_amount?: number
}

export interface IncomePage {
    records: IncomeRow[]
    total: number
    page: number
    limit: number
}

export const incomeApi = {
    list: (page = 1, limit = 10, month?: string) =>
        request<IncomePage>(`/income?page=${page}&limit=${limit}${month ? `&month=${month}` : ''}`),
    monthlyTotal: (month?: string) =>
        request<{ total: number; totalUSD?: number; count: string }>(`/income/monthly-total${month ? `?month=${month}` : ''}`),
    create: (data: { task_name: string; category?: string; received_date?: string; amount: number; currency?: string; original_amount?: number }) =>
        request<IncomeRow>('/income', { method: 'POST', body: JSON.stringify(data) }),
    remove: (id: string) =>
        request<void>(`/income/${id}`, { method: 'DELETE' }),
}

/* ─── Dashboard ─── */
export interface DashboardStats {
    totalTasks: number
    completedTasks: number
    activeTasks: number
    monthlyIncome: number
    monthlyIncomeUSD?: number
    monthlyTotalIncome: number
    monthlyTotalIncomeUSD?: number
    unpaidTotal: number
    unpaidTotalUSD?: number
    totalIncome: number
    totalIncomeUSD?: number
    completionRate: number
    monthlyTrend: { name: string; income: number }[]
}

export interface PerformanceRow {
    month: string
    revenue: number
    totalTasks: number
    completionRate: number
    status: 'on-target' | 'below-average'
}

export const dashboardApi = {
    stats: () => request<DashboardStats>('/dashboard/stats'),
    performance: () => request<PerformanceRow[]>('/dashboard/performance'),
}

/* ─── Checklists ─── */
export interface ChecklistItem {
    id: string
    text: string
    is_checked: boolean
    indent_level: number
    description?: string
}

export interface ChecklistRow {
    id: string
    title: string
    description: string | null
    items: ChecklistItem[]
    color: string
    pos_x: number
    pos_y: number
    width: number | null
    height: number | null
    type: 'checklist' | 'text'
    content: string
    created_at: string
    updated_at: string
}

export const checklistApi = {
    list: () => request<ChecklistRow[]>('/checklists'),
    get: (id: string) => request<ChecklistRow>(`/checklists/${id}`),
    create: (data: { title?: string; description?: string; items?: ChecklistItem[]; color?: string; type?: string; content?: string }) =>
        request<ChecklistRow>('/checklists', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ChecklistRow>) =>
        request<ChecklistRow>(`/checklists/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) =>
        request<void>(`/checklists/${id}`, { method: 'DELETE' }),
}

/* ─── AI ─── */
export const aiApi = {
    generateChecklist: (prompt: string) =>
        request<{ items: ChecklistItem[]; raw_prompt: string }>('/ai/generate-checklist', {
            method: 'POST',
            body: JSON.stringify({ prompt }),
        }),
}
