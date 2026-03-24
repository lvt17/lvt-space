import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { taskApi, dailyTaskApi, checklistApi, dashboardApi, type TaskRow, type DailyTaskRow, type ChecklistRow, type DashboardStats, type PerformanceRow } from '@/services/api'

interface DataCacheContextValue {
    // Data
    tasks: TaskRow[]
    dailyTasks: DailyTaskRow[]
    checklists: ChecklistRow[]
    dashboardStats: DashboardStats | null
    dashboardPerformance: PerformanceRow[]

    // Loading states (only true on very first load, false once cached)
    tasksLoading: boolean
    dailyTasksLoading: boolean
    checklistsLoading: boolean
    dashboardLoading: boolean

    // Setters for optimistic updates from pages
    setTasks: React.Dispatch<React.SetStateAction<TaskRow[]>>
    setDailyTasks: React.Dispatch<React.SetStateAction<DailyTaskRow[]>>
    setChecklists: React.Dispatch<React.SetStateAction<ChecklistRow[]>>

    // Background refresh (fetches fresh data without blocking UI)
    refreshTasks: () => Promise<void>
    refreshDailyTasks: () => Promise<void>
    refreshChecklists: () => Promise<void>
    refreshDashboard: () => Promise<void>
}

const DataCacheContext = createContext<DataCacheContextValue | null>(null)

export function DataCacheProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<TaskRow[]>([])
    const [dailyTasks, setDailyTasks] = useState<DailyTaskRow[]>([])
    const [checklists, setChecklists] = useState<ChecklistRow[]>([])
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
    const [dashboardPerformance, setDashboardPerformance] = useState<PerformanceRow[]>([])

    const [tasksLoading, setTasksLoading] = useState(true)
    const [dailyTasksLoading, setDailyTasksLoading] = useState(true)
    const [checklistsLoading, setChecklistsLoading] = useState(true)
    const [dashboardLoading, setDashboardLoading] = useState(true)

    const initializedRef = useRef(false)

    const refreshTasks = useCallback(async () => {
        try { setTasks(await taskApi.list()) }
        catch { /* ignore */ }
        finally { setTasksLoading(false) }
    }, [])

    const refreshDailyTasks = useCallback(async () => {
        try { setDailyTasks(await dailyTaskApi.today()) }
        catch { /* ignore */ }
        finally { setDailyTasksLoading(false) }
    }, [])

    const refreshChecklists = useCallback(async () => {
        try { setChecklists(await checklistApi.list()) }
        catch { /* ignore */ }
        finally { setChecklistsLoading(false) }
    }, [])

    const refreshDashboard = useCallback(async () => {
        try {
            const [s, p] = await Promise.all([dashboardApi.stats(), dashboardApi.performance()])
            setDashboardStats(s)
            setDashboardPerformance(p)
        } catch { /* ignore */ }
        finally { setDashboardLoading(false) }
    }, [])

    // Fetch ALL data in parallel once on app load
    useEffect(() => {
        if (initializedRef.current) return
        initializedRef.current = true
        Promise.all([refreshTasks(), refreshDailyTasks(), refreshChecklists(), refreshDashboard()])
    }, [refreshTasks, refreshDailyTasks, refreshChecklists, refreshDashboard])

    return (
        <DataCacheContext.Provider value={{
            tasks, dailyTasks, checklists, dashboardStats, dashboardPerformance,
            tasksLoading, dailyTasksLoading, checklistsLoading, dashboardLoading,
            setTasks, setDailyTasks, setChecklists,
            refreshTasks, refreshDailyTasks, refreshChecklists, refreshDashboard,
        }}>
            {children}
        </DataCacheContext.Provider>
    )
}

export function useDataCache() {
    const ctx = useContext(DataCacheContext)
    if (!ctx) throw new Error('useDataCache must be used inside DataCacheProvider')
    return ctx
}
