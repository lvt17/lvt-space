import type {
    Task,
    DailyTask,
    IncomeRecord,
    MonthlyPerformance,
    MonthlyIncome,
    StatCardData,
    NavItem,
} from '@/types'

export const NAV_ITEMS: NavItem[] = [
    { label: 'dashboard', path: '/dashboard', icon: 'grid_view' },
    { label: 'tasks', path: '/tasks', icon: 'task_alt' },
    { label: 'income', path: '/income', icon: 'account_balance_wallet' },
    { label: 'checklist', path: '/checklists', icon: 'checklist' },
]

export const DASHBOARD_STATS: StatCardData[] = [
    {
        title: 'Thu nhập hàng tháng',
        value: '12.450.000₫',
        icon: 'account_balance_wallet',
        trend: { value: '+12% so với tháng trước', isPositive: true },
    },
    {
        title: 'Thu nhập hàng năm',
        value: '148.200.000₫',
        icon: 'event_repeat',
        trend: { value: '-5% dự kiến', isPositive: false },
    },
    {
        title: 'Thanh toán chờ',
        value: '14',
        icon: 'hourglass_top',
        subtitle: 'Đến hạn trong 7 ngày tới',
    },
    {
        title: 'Công việc hoàn thành',
        value: '85%',
        icon: 'check_circle',
        trend: { value: '+8% tăng', isPositive: true },
    },
]

export const MONTHLY_INCOME_DATA: MonthlyIncome[] = [
    { name: 'Jan', income: 8_500_000 },
    { name: 'Feb', income: 9_200_000 },
    { name: 'Mar', income: 7_800_000 },
    { name: 'Apr', income: 11_000_000 },
    { name: 'May', income: 10_500_000 },
    { name: 'Jun', income: 9_800_000 },
    { name: 'Jul', income: 11_200_000 },
    { name: 'Aug', income: 12_850_000 },
    { name: 'Sep', income: 14_200_000 },
    { name: 'Oct', income: 12_450_000 },
    { name: 'Nov', income: 13_100_000 },
    { name: 'Dec', income: 15_000_000 },
]

export const MONTHLY_PERFORMANCE: MonthlyPerformance[] = [
    { month: 'Tháng 9 2023', revenue: 14_200_000, completionRate: 92, status: 'on-target' },
    { month: 'Tháng 8 2023', revenue: 12_850_000, completionRate: 88, status: 'on-target' },
    { month: 'Tháng 7 2023', revenue: 11_200_000, completionRate: 74, status: 'below-average' },
]

export const TASKS: Task[] = [
    { id: '1', name: 'Brand Identity Guidelines', deadline: 'Oct 12, 2023', price: 2_450_000, status: 'pending', isPaid: false },
    { id: '2', name: 'Mobile App UI Kit', deadline: 'Oct 28, 2023', price: 1_800_000, status: 'in-progress', isPaid: false },
    { id: '3', name: 'SEO Audit & Implementation', deadline: 'Sep 30, 2023', price: 950_000, status: 'completed', isPaid: true },
    { id: '4', name: 'Landing Page Development', deadline: 'Nov 05, 2023', price: 3_200_000, status: 'processing', isPaid: false },
]

export const TODAY_TASKS: DailyTask[] = [
    { id: '1', title: 'Xem xét tài liệu hệ thống thiết kế', time: '02:00 PM', cost: 500_000, isCompleted: true },
    { id: '2', title: 'Hoàn thiện bản mô phỏng trang dịch', time: '10:30 AM', cost: 1_200_000, isCompleted: true },
    { id: '3', title: 'Cập nhật lộ trình dự án', time: '06:00 PM', cost: 750_000, isCompleted: false },
]

export const TOMORROW_TASKS: DailyTask[] = [
    { id: '4', title: 'Cuộc họp đồng bộ khách hàng', time: '04:30 PM', cost: 1_000_000, isCompleted: false },
    { id: '5', title: 'Tối ưu hóa cơ sở dữ liệu', time: '11:00 AM', cost: 2_000_000, isCompleted: false },
]

export const INCOME_RECORDS: IncomeRecord[] = [
    { id: '1', taskName: 'UI Design System - Q4 Updates', category: 'Dịch vụ sáng tạo', receivedDate: 'Oct 24, 2023', amount: 4_200_000, status: 'Đã xong' },
    { id: '2', taskName: 'Mobile App API Integration', category: 'Phát triển', receivedDate: 'Oct 20, 2023', amount: 3_500_000, status: 'Đã xong' },
    { id: '3', taskName: 'SEO Audit & Strategy', category: 'Tiếp thị', receivedDate: 'Oct 15, 2023', amount: 1_850_000, status: 'Đã xong' },
    { id: '4', taskName: 'Cloud Infrastructure Setup', category: 'DevOps', receivedDate: 'Oct 11, 2023', amount: 2_900_000, status: 'Đã xong' },
]
