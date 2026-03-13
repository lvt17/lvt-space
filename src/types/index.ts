export interface Task {
    id: string
    name: string
    deadline: string
    price: number
    status: 'pending' | 'processing' | 'completed' | 'in-progress'
    isPaid: boolean
}

export interface DailyTask {
    id: string
    title: string
    time: string
    cost: number
    isCompleted: boolean
}

export interface IncomeRecord {
    id: string
    taskName: string
    category: string
    receivedDate: string
    amount: number
    status: string
}

export interface MonthlyPerformance {
    month: string
    revenue: number
    completionRate: number
    status: 'on-target' | 'below-average'
}

export interface MonthlyIncome {
    name: string
    income: number
}

export interface StatCardData {
    title: string
    value: string
    icon: string
    trend?: { value: string; isPositive: boolean }
    subtitle?: string
}

export type NavItem = {
    label: string
    path: string
    icon: string
}
