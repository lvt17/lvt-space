import { Command } from 'commander'
import chalk from 'chalk'
import { api } from '../api-client.js'
import { formatTable, formatCurrency, formatDate, error, success } from '../output.js'
import config from '../config.js'

interface DailyTask {
    id: string
    title: string
    scheduled_date: string
    time: string | null
    cost: number
    is_completed: boolean
    source: string
}

export function registerDailyCommands(program: Command) {
    const daily = program
        .command('daily')
        .description('Checklist hàng ngày')
        .option('-d, --date <date>', 'Ngày cụ thể (YYYY-MM-DD)')
        .option('-f, --format <format>', 'Output format')
        .action(async (opts) => {
            try {
                const format = opts.format || config.get('format')
                const dateParam = opts.date ? `?date=${opts.date}` : ''
                const data = await api<DailyTask[]>(`/api/daily-tasks${dateParam}`)

                if (format === 'json') {
                    console.log(JSON.stringify(data, null, 2))
                    return
                }

                if (!data.length) {
                    console.log(chalk.dim('Không có task nào hôm nay.'))
                    return
                }

                const completed = data.filter(t => t.is_completed).length

                if (format === 'minimal') {
                    data.forEach(t => {
                        const icon = t.is_completed ? chalk.green('☑') : chalk.dim('☐')
                        const time = t.time ? chalk.dim(` ${t.time}`) : ''
                        console.log(`${icon} ${t.title}${time}`)
                    })
                    console.log(chalk.dim(`\n${completed}/${data.length} hoàn thành`))
                    return
                }

                console.log(formatTable(
                    ['', 'Tiêu đề', 'Giờ', 'Chi phí', 'Nguồn'],
                    data.map(t => [
                        t.is_completed ? chalk.green('☑') : chalk.dim('☐'),
                        t.title,
                        t.time || '—',
                        formatCurrency(t.cost),
                        chalk.dim(t.source),
                    ]),
                    `📅 Hôm nay (${completed}/${data.length} xong)`,
                ))
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    daily
        .command('tomorrow')
        .description('Tasks ngày mai')
        .option('-f, --format <format>', 'Output format')
        .action(async (opts) => {
            try {
                const format = opts.format || config.get('format')
                const data = await api<DailyTask[]>('/api/daily-tasks/tomorrow')

                if (format === 'json') {
                    console.log(JSON.stringify(data, null, 2))
                    return
                }

                if (!data.length) {
                    console.log(chalk.dim('Ngày mai rảnh!'))
                    return
                }

                console.log(formatTable(
                    ['', 'Tiêu đề', 'Giờ', 'Chi phí'],
                    data.map(t => [
                        t.is_completed ? chalk.green('☑') : chalk.dim('☐'),
                        t.title,
                        t.time || '—',
                        formatCurrency(t.cost),
                    ]),
                    `📅 Ngày mai (${data.length} tasks)`,
                ))
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    daily
        .command('add <title>')
        .description('Thêm daily task')
        .option('-t, --time <time>', 'Giờ (HH:MM)')
        .option('-c, --cost <cost>', 'Chi phí', '0')
        .option('-d, --date <date>', 'Ngày (YYYY-MM-DD)')
        .action(async (title, opts) => {
            try {
                const task = await api<DailyTask>('/api/daily-tasks', {
                    method: 'POST',
                    body: JSON.stringify({
                        title,
                        time: opts.time,
                        cost: parseInt(opts.cost),
                        scheduled_date: opts.date,
                    }),
                })
                success(`"${task.title}" đã thêm vào checklist!`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    daily
        .command('toggle <id>')
        .description('Toggle hoàn thành')
        .action(async (id) => {
            try {
                const task = await api<DailyTask>(`/api/daily-tasks/${id}/toggle`, { method: 'PATCH' })
                success(`"${task.title}" — ${task.is_completed ? '☑ Xong!' : '☐ Chưa xong'}`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    daily
        .command('delete <id>')
        .description('Xóa daily task')
        .action(async (id) => {
            try {
                await api<void>(`/api/daily-tasks/${id}`, { method: 'DELETE' })
                success('Daily task đã xóa!')
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })
}
