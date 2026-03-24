import { Command } from 'commander'
import chalk from 'chalk'
import { api } from '../api-client.js'
import { formatTable, formatCurrency, formatDate, statusIcon, error, success } from '../output.js'
import config from '../config.js'

interface Task {
    id: string
    name: string
    deadline: string | null
    price: number
    status: string
    is_paid: boolean
    description: string | null
    created_at: string
}

export function registerTaskCommands(program: Command) {
    const tasks = program
        .command('tasks')
        .description('Quản lý tasks')
        .option('-s, --status <status>', 'Filter theo status (pending/processing/completed)')
        .option('-f, --format <format>', 'Output format (table/json/minimal)')
        .action(async (opts) => {
            try {
                const format = opts.format || config.get('format')
                let data = await api<Task[]>('/api/tasks')

                if (opts.status) {
                    data = data.filter(t => t.status === opts.status)
                }

                if (format === 'json') {
                    console.log(JSON.stringify(data, null, 2))
                    return
                }

                if (!data.length) {
                    console.log(chalk.dim('Chưa có task nào.'))
                    return
                }

                if (format === 'minimal') {
                    data.forEach(t => {
                        const paid = t.is_paid ? chalk.green('$') : chalk.dim('○')
                        console.log(`${statusIcon(t.status)} ${paid} ${t.name} ${chalk.dim(formatDate(t.deadline))} ${chalk.yellow(formatCurrency(t.price))}`)
                    })
                    return
                }

                console.log(formatTable(
                    ['Tên', 'Deadline', 'Status', 'Giá', 'Paid'],
                    data.map(t => [
                        t.name,
                        formatDate(t.deadline),
                        `${statusIcon(t.status)} ${t.status}`,
                        formatCurrency(t.price),
                        t.is_paid ? chalk.green('✅') : chalk.dim('❌'),
                    ]),
                    `📋 Tasks (${data.length})`,
                ))
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    tasks
        .command('add <name>')
        .description('Tạo task mới')
        .option('-d, --deadline <date>', 'Deadline (YYYY-MM-DD)')
        .option('-p, --price <price>', 'Giá (VND)', '0')
        .option('--desc <description>', 'Mô tả')
        .action(async (name, opts) => {
            try {
                const task = await api<Task>('/api/tasks', {
                    method: 'POST',
                    body: JSON.stringify({
                        name,
                        deadline: opts.deadline,
                        price: parseInt(opts.price),
                        description: opts.desc,
                    }),
                })
                success(`Task "${task.name}" đã tạo!`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    tasks
        .command('update <id>')
        .description('Cập nhật task')
        .option('-n, --name <name>', 'Tên mới')
        .option('-d, --deadline <date>', 'Deadline mới')
        .option('-p, --price <price>', 'Giá mới')
        .option('-s, --status <status>', 'Status mới')
        .option('--desc <description>', 'Mô tả mới')
        .action(async (id, opts) => {
            try {
                const body: Record<string, unknown> = {}
                if (opts.name) body.name = opts.name
                if (opts.deadline) body.deadline = opts.deadline
                if (opts.price) body.price = parseInt(opts.price)
                if (opts.status) body.status = opts.status
                if (opts.desc) body.description = opts.desc

                const task = await api<Task>(`/api/tasks/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                })
                success(`Task "${task.name}" đã cập nhật!`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    tasks
        .command('done <id>')
        .description('Đánh dấu task hoàn thành')
        .action(async (id) => {
            try {
                const task = await api<Task>(`/api/tasks/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: 'completed' }),
                })
                success(`Task "${task.name}" ✅ hoàn thành!`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    tasks
        .command('pay <id>')
        .description('Toggle trạng thái thanh toán')
        .action(async (id) => {
            try {
                const task = await api<Task>(`/api/tasks/${id}/toggle-paid`, { method: 'PATCH' })
                success(`Task "${task.name}" — ${task.is_paid ? '💰 Đã thanh toán' : 'Chưa thanh toán'}`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    tasks
        .command('delete <id>')
        .description('Xóa task')
        .action(async (id) => {
            try {
                await api<void>(`/api/tasks/${id}`, { method: 'DELETE' })
                success('Task đã xóa!')
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })
}
