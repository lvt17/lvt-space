import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import ProgressBar from '@/components/ui/ProgressBar'
import { dailyTaskApi, type DailyTaskRow } from '@/services/api'
import { parseCurrency, formatVND } from '@/utils/currency'

function TaskCard({ task, onToggle, onDelete, index }: { task: DailyTaskRow; onToggle: () => void; onDelete: () => void; index: number }) {
    return (
        <div
            className={`group relative p-4 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4 transition-all duration-300 hover:-translate-y-0.5 border backdrop-blur-sm ${task.is_completed
                ? 'bg-green-50/80 border-green-200/60'
                : 'bg-white/80 border-border hover:border-primary-lighter hover:shadow-md hover:shadow-primary/5'
            }`}
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Completion checkbox */}
            <button
                onClick={onToggle}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 shrink-0 ${task.is_completed
                    ? 'border-green-500 bg-green-500 scale-110'
                    : 'border-border group-hover:border-primary group-hover:bg-primary-lightest/50'
                }`}
            >
                {task.is_completed && <span className="material-icons-round text-xs text-white">check</span>}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm sm:text-[0.9375rem] transition-all ${task.is_completed
                    ? 'line-through text-text-muted/70'
                    : 'text-text-primary'
                }`}>
                    {task.title}
                </h4>
                <div className="flex gap-3 items-center flex-wrap mt-1">
                    {task.time && (
                        <span className="text-[0.6875rem] text-text-muted flex items-center gap-0.5 bg-surface-secondary px-2 py-0.5 rounded-md">
                            <span className="material-icons-round text-xs">schedule</span>
                            {task.time}
                        </span>
                    )}
                    {task.cost > 0 && (
                        <span className="text-[0.6875rem] text-primary font-bold bg-primary-lightest/60 px-2 py-0.5 rounded-md">
                            {formatVND(task.cost)}
                        </span>
                    )}
                    {task.source === 'task' && (
                        <span className="text-[0.6875rem] text-text-muted flex items-center gap-0.5 bg-surface-secondary px-2 py-0.5 rounded-md">
                            <span className="material-icons-round text-xs">link</span>
                            Từ dự án
                        </span>
                    )}
                </div>
            </div>

            {/* Delete */}
            <button
                onClick={onDelete}
                className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 text-text-muted hover:text-red-500 transition-all p-1 rounded-lg hover:bg-red-50"
            >
                <span className="material-icons-round text-lg">delete_outline</span>
            </button>
        </div>
    )
}

function EmptyState({ message, icon }: { message: string; icon: string }) {
    return (
        <div className="text-center py-8 sm:py-10">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary-lightest/50 flex items-center justify-center">
                <span className="material-icons-round text-2xl text-primary-soft">{icon}</span>
            </div>
            <p className="text-sm text-text-muted">{message}</p>
        </div>
    )
}

export default function DailyChecklistPage() {
    const [todayTasks, setTodayTasks] = useState<DailyTaskRow[]>([])
    const [tomorrowTasks, setTomorrowTasks] = useState<DailyTaskRow[]>([])
    const [loading, setLoading] = useState(true)

    const [newTitle, setNewTitle] = useState('')
    const [newTime, setNewTime] = useState('')
    const [newCost, setNewCost] = useState('')
    const [addingFor, setAddingFor] = useState<'today' | 'tomorrow' | null>(null)

    const loadData = () => {
        setLoading(true)
        Promise.all([dailyTaskApi.today(), dailyTaskApi.tomorrow()])
            .then(([today, tomorrow]) => { setTodayTasks(today); setTomorrowTasks(tomorrow) })
            .finally(() => setLoading(false))
    }

    useEffect(() => { loadData() }, [])

    const completedCount = todayTasks.filter((t) => t.is_completed).length

    const toggleTask = async (id: string, isTodayList: boolean) => {
        const updated = await dailyTaskApi.toggle(id)
        if (isTodayList) setTodayTasks(prev => prev.map((t) => (t.id === id ? updated : t)))
        else setTomorrowTasks(prev => prev.map((t) => (t.id === id ? updated : t)))
    }

    const deleteTask = async (id: string, isTodayList: boolean) => {
        await dailyTaskApi.remove(id)
        if (isTodayList) setTodayTasks(prev => prev.filter(t => t.id !== id))
        else setTomorrowTasks(prev => prev.filter(t => t.id !== id))
    }

    const handleAddTask = async (forTomorrow: boolean) => {
        if (!newTitle.trim()) return
        const tmr = new Date()
        tmr.setDate(tmr.getDate() + 1)
        const scheduled_date = forTomorrow ? tmr.toISOString().slice(0, 10) : undefined
        const task = await dailyTaskApi.create({
            title: newTitle.trim(),
            scheduled_date,
            time: newTime || undefined,
            cost: newCost ? parseCurrency(newCost) : 0,
        })
        if (forTomorrow) setTomorrowTasks(prev => [...prev, task])
        else setTodayTasks(prev => [...prev, task])
        setNewTitle('')
        setNewTime('')
        setNewCost('')
        setAddingFor(null)
    }

    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)
    const formatDate = (d: Date) => d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

    const AddForm = ({ forTomorrow }: { forTomorrow: boolean }) => (
        <div className="p-4 bg-white/60 backdrop-blur-sm border border-primary-lighter/50 rounded-2xl space-y-3 shadow-sm">
            <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask(forTomorrow)}
                placeholder="Tên công việc..."
                autoFocus
                className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text-primary placeholder:text-text-muted"
            />
            <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                    type="text"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    placeholder="Giờ (VD: 9:00 AM)"
                    className="flex-1 bg-white border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-text-primary placeholder:text-text-muted"
                />
                <input
                    type="text"
                    value={newCost}
                    onChange={e => setNewCost(e.target.value)}
                    placeholder="Chi phí (VD: 500k)"
                    className="flex-1 bg-white border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-text-primary placeholder:text-text-muted"
                />
            </div>
            <div className="flex gap-2 justify-end">
                <button onClick={() => setAddingFor(null)} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors">
                    Hủy
                </button>
                <button
                    onClick={() => handleAddTask(forTomorrow)}
                    className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-mid transition-all shadow-sm shadow-primary/20 flex items-center gap-1.5"
                >
                    <span className="material-icons-round text-base">add</span>
                    Thêm
                </button>
            </div>
        </div>
    )

    const TaskSection = ({ title, icon, iconColor, date, tasks, isToday, addKey }: {
        title: string; icon: string; iconColor: string; date: Date; tasks: DailyTaskRow[]; isToday: boolean; addKey: 'today' | 'tomorrow'
    }) => (
        <section className="glass-card rounded-2xl md:rounded-3xl overflow-hidden">
            {/* Section header */}
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border/60 bg-surface-secondary/30">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
                            <span className="material-icons-round text-lg sm:text-xl text-white">{icon}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm sm:text-base text-text-primary">{title}</h3>
                            <p className="text-[0.6875rem] text-text-muted capitalize">{formatDate(date)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-muted bg-surface-secondary px-2.5 py-1 rounded-lg">
                            {tasks.filter(t => t.is_completed).length}/{tasks.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Task list */}
            <div className="p-4 sm:p-5 space-y-2.5 sm:space-y-3">
                {tasks.length === 0 && addingFor !== addKey && (
                    <EmptyState
                        message={isToday ? 'Chưa có công việc nào hôm nay' : 'Chưa lên kế hoạch cho ngày mai'}
                        icon={isToday ? 'wb_sunny' : 'event_upcoming'}
                    />
                )}
                {tasks.map((task, i) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        index={i}
                        onToggle={() => toggleTask(task.id, isToday)}
                        onDelete={() => deleteTask(task.id, isToday)}
                    />
                ))}

                {addingFor === addKey ? (
                    <AddForm forTomorrow={!isToday} />
                ) : (
                    <button
                        onClick={() => setAddingFor(addKey)}
                        className="w-full py-3 rounded-xl border border-dashed border-border text-text-muted hover:text-primary hover:border-primary/40 hover:bg-primary-lightest/20 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <span className="material-icons-round text-lg">add</span>
                        {isToday ? 'Thêm công việc' : 'Lên kế hoạch'}
                    </button>
                )}
            </div>
        </section>
    )

    return (
        <>
            <Header title="Công việc hôm nay" subtitle="Theo dõi và hoàn thành nhiệm vụ hàng ngày" />

            {loading ? (
                <div className="text-center text-text-muted py-20">Đang tải...</div>
            ) : (
                <>
                    <ProgressBar completed={completedCount} total={todayTasks.length} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                        <TaskSection
                            title="Hôm nay"
                            icon="today"
                            iconColor="bg-primary"
                            date={today}
                            tasks={todayTasks}
                            isToday={true}
                            addKey="today"
                        />
                        <TaskSection
                            title="Ngày mai"
                            icon="event"
                            iconColor="bg-primary-soft"
                            date={tomorrow}
                            tasks={tomorrowTasks}
                            isToday={false}
                            addKey="tomorrow"
                        />
                    </div>
                </>
            )}
        </>
    )
}
