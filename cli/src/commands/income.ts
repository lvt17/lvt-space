import { Command } from 'commander'
import chalk from 'chalk'
import { api } from '../api-client.js'
import { formatTable, formatCurrency, formatDate, error, success } from '../output.js'
import config from '../config.js'

interface IncomeRow {
    id: string
    task_name: string
    category: string | null
    received_date: string
    amount: number
    status: string
    source: string
}

interface IncomePage {
    records: IncomeRow[]
    total: number
    page: number
    limit: number
}

export function registerIncomeCommands(program: Command) {
    const income = program
        .command('income')
        .description('Quản lý thu nhập')
        .option('-m, --month <month>', 'Tháng (YYYY-MM)')
        .option('-p, --page <page>', 'Trang', '1')
        .option('-l, --limit <limit>', 'Số dòng/trang', '20')
        .option('-f, --format <format>', 'Output format')
        .action(async (opts) => {
            try {
                const format = opts.format || config.get('format')
                const params = new URLSearchParams()
                params.set('page', opts.page)
                params.set('limit', opts.limit)
                if (opts.month) params.set('month', opts.month)

                const data = await api<IncomePage>(`/api/income?${params}`)

                if (format === 'json') {
                    console.log(JSON.stringify(data, null, 2))
                    return
                }

                if (!data.records.length) {
                    console.log(chalk.dim('Chưa có thu nhập tháng này.'))
                    return
                }

                console.log(formatTable(
                    ['Tên', 'Danh mục', 'Ngày', 'Số tiền', 'Nguồn'],
                    data.records.map(r => [
                        r.task_name,
                        r.category || '—',
                        formatDate(r.received_date),
                        chalk.green(formatCurrency(r.amount)),
                        chalk.dim(r.source),
                    ]),
                    `💰 Thu nhập (${data.total} bản ghi, trang ${data.page})`,
                ))
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    income
        .command('add <name>')
        .description('Thêm thu nhập')
        .option('-a, --amount <amount>', 'Số tiền (VND)', '0')
        .option('-c, --category <category>', 'Danh mục')
        .option('-d, --date <date>', 'Ngày nhận (YYYY-MM-DD)')
        .action(async (name, opts) => {
            try {
                const record = await api<IncomeRow>('/api/income', {
                    method: 'POST',
                    body: JSON.stringify({
                        task_name: name,
                        amount: parseInt(opts.amount),
                        category: opts.category,
                        received_date: opts.date,
                    }),
                })
                success(`Thu nhập "${record.task_name}" — ${formatCurrency(record.amount)} đã ghi nhận!`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    income
        .command('total')
        .description('Tổng thu nhập tháng')
        .option('-m, --month <month>', 'Tháng (YYYY-MM)')
        .action(async (opts) => {
            try {
                const param = opts.month ? `?month=${opts.month}` : ''
                const data = await api<{ total: number; count: string }>(`/api/income/monthly-total${param}`)
                console.log()
                console.log(chalk.bold('💰 Tổng thu nhập'))
                console.log(`   Số tiền: ${chalk.green.bold(formatCurrency(data.total))}`)
                console.log(`   Số bản ghi: ${chalk.cyan(data.count)}`)
                console.log()
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    income
        .command('delete <id>')
        .description('Xóa bản ghi')
        .action(async (id) => {
            try {
                await api<void>(`/api/income/${id}`, { method: 'DELETE' })
                success('Thu nhập đã xóa!')
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })
}
