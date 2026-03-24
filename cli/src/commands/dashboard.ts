import { Command } from 'commander'
import chalk from 'chalk'
import { api } from '../api-client.js'
import { formatTable, formatCurrency, error } from '../output.js'
import config from '../config.js'

interface DashboardStats {
    totalTasks: number
    completedTasks: number
    activeTasks: number
    monthlyIncome: number
    unpaidTotal: number
    totalIncome: number
    completionRate: number
    monthlyTrend: { name: string; income: number }[]
}

interface PerformanceRow {
    month: string
    revenue: number
    totalTasks: number
    completionRate: number
    status: string
}

export function registerDashboardCommands(program: Command) {
    program
        .command('stats')
        .description('Tổng quan dashboard')
        .option('-f, --format <format>', 'Output format')
        .action(async (opts) => {
            try {
                const format = opts.format || config.get('format')
                const data = await api<DashboardStats>('/api/dashboard/stats')

                if (format === 'json') {
                    console.log(JSON.stringify(data, null, 2))
                    return
                }

                const progressBar = (pct: number) => {
                    const filled = Math.round(pct / 5)
                    return chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(20 - filled)) + ` ${pct}%`
                }

                console.log()
                console.log(chalk.bold('📊 Dashboard — Lvt Space'))
                console.log(chalk.dim('─'.repeat(40)))
                console.log(`  📋 Tổng tasks:      ${chalk.cyan.bold(data.totalTasks)}`)
                console.log(`  ✅ Hoàn thành:      ${chalk.green.bold(data.completedTasks)}`)
                console.log(`  🔄 Đang làm:        ${chalk.yellow.bold(data.activeTasks)}`)
                console.log(`  📈 Tiến độ:         ${progressBar(data.completionRate)}`)
                console.log(chalk.dim('─'.repeat(40)))
                console.log(`  💰 Thu nhập tháng:  ${chalk.green.bold(formatCurrency(data.monthlyIncome))}`)
                console.log(`  💵 Tổng thu nhập:   ${chalk.green(formatCurrency(data.totalIncome))}`)
                console.log(`  ⏳ Chưa thanh toán: ${chalk.yellow(formatCurrency(data.unpaidTotal))}`)

                if (data.monthlyTrend.length > 0) {
                    console.log(chalk.dim('─'.repeat(40)))
                    console.log(chalk.bold('  📈 Xu hướng:'))
                    data.monthlyTrend.forEach(m => {
                        const bar = chalk.green('█'.repeat(Math.max(1, Math.round(m.income / (data.monthlyTrend[0].income || 1) * 10))))
                        console.log(`    ${m.name.padEnd(4)} ${bar} ${formatCurrency(m.income)}`)
                    })
                }
                console.log()
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    program
        .command('performance')
        .description('Hiệu suất 6 tháng gần nhất')
        .option('-f, --format <format>', 'Output format')
        .action(async (opts) => {
            try {
                const format = opts.format || config.get('format')
                const data = await api<PerformanceRow[]>('/api/dashboard/performance')

                if (format === 'json') {
                    console.log(JSON.stringify(data, null, 2))
                    return
                }

                if (!data.length) {
                    console.log(chalk.dim('Chưa có dữ liệu hiệu suất.'))
                    return
                }

                console.log(formatTable(
                    ['Tháng', 'Tasks', 'Tiến độ', 'Doanh thu', 'Status'],
                    data.map(r => [
                        r.month,
                        String(r.totalTasks),
                        `${r.completionRate}%`,
                        formatCurrency(r.revenue),
                        r.status === 'on-target' ? chalk.green('🎯 On target') : chalk.yellow('📉 Below avg'),
                    ]),
                    '📊 Hiệu suất 6 tháng',
                ))
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })
}
