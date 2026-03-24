import { Command } from 'commander'
import chalk from 'chalk'
import { api } from '../api-client.js'
import { formatTable, formatDate, error, success } from '../output.js'
import config from '../config.js'

interface ChecklistItem {
    id: string
    text: string
    is_checked: boolean
    indent_level: number
}

interface ChecklistRow {
    id: string
    title: string
    description: string | null
    items: ChecklistItem[]
    color: string
    type: 'checklist' | 'text'
    content: string
    created_at: string
    updated_at: string
}

const colorMap: Record<string, (s: string) => string> = {
    purple: chalk.magenta,
    green: chalk.green,
    amber: chalk.yellow,
    red: chalk.red,
    blue: chalk.blue,
}

export function registerNotesCommands(program: Command) {
    const notes = program
        .command('notes')
        .description('Quản lý ghi chú / canvas notes')
        .option('-f, --format <format>', 'Output format')
        .action(async (opts) => {
            try {
                const format = opts.format || config.get('format')
                const data = await api<ChecklistRow[]>('/api/checklists')

                if (format === 'json') {
                    console.log(JSON.stringify(data, null, 2))
                    return
                }

                if (!data.length) {
                    console.log(chalk.dim('Chưa có ghi chú nào.'))
                    return
                }

                console.log(formatTable(
                    ['#', 'Tiêu đề', 'Loại', 'Màu', 'Cập nhật'],
                    data.map((n, i) => {
                        const colorFn = colorMap[n.color] || chalk.white
                        return [
                            String(i + 1),
                            colorFn(n.title),
                            n.type === 'checklist' ? '📋' : '📝',
                            colorFn('●') + ' ' + n.color,
                            formatDate(n.updated_at),
                        ]
                    }),
                    `📒 Ghi chú (${data.length})`,
                ))
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    notes
        .command('view <id>')
        .description('Xem chi tiết ghi chú')
        .action(async (id) => {
            try {
                const note = await api<ChecklistRow>(`/api/checklists/${id}`)
                const colorFn = colorMap[note.color] || chalk.white

                console.log()
                console.log(colorFn('━'.repeat(40)))
                console.log(chalk.bold(colorFn(`  ${note.title}`)))
                if (note.description) console.log(chalk.dim(`  ${note.description}`))
                console.log(colorFn('━'.repeat(40)))

                if (note.type === 'checklist' && note.items?.length) {
                    note.items.forEach(item => {
                        const indent = '  '.repeat(item.indent_level + 1)
                        const icon = item.is_checked ? chalk.green('☑') : chalk.dim('☐')
                        const text = item.is_checked ? chalk.dim.strikethrough(item.text) : item.text
                        console.log(`${indent}${icon} ${text}`)
                    })
                } else if (note.content) {
                    console.log(`  ${note.content}`)
                }
                console.log()
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    notes
        .command('add <title>')
        .description('Tạo ghi chú mới')
        .option('-c, --color <color>', 'Màu (purple/green/amber/red/blue)', 'purple')
        .option('-t, --type <type>', 'Loại (checklist/text)', 'text')
        .option('--content <content>', 'Nội dung (cho type=text)')
        .action(async (title, opts) => {
            try {
                const note = await api<ChecklistRow>('/api/checklists', {
                    method: 'POST',
                    body: JSON.stringify({
                        title,
                        color: opts.color,
                        type: opts.type,
                        content: opts.content || '',
                    }),
                })
                success(`Ghi chú "${note.title}" đã tạo!`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    notes
        .command('update <id>')
        .description('Cập nhật ghi chú')
        .option('-t, --title <title>', 'Tiêu đề mới')
        .option('-c, --color <color>', 'Màu mới')
        .option('--content <content>', 'Nội dung mới')
        .action(async (id, opts) => {
            try {
                const body: Record<string, unknown> = {}
                if (opts.title) body.title = opts.title
                if (opts.color) body.color = opts.color
                if (opts.content) body.content = opts.content

                const note = await api<ChecklistRow>(`/api/checklists/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(body),
                })
                success(`Ghi chú "${note.title}" đã cập nhật!`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    notes
        .command('delete <id>')
        .description('Xóa ghi chú')
        .action(async (id) => {
            try {
                await api<void>(`/api/checklists/${id}`, { method: 'DELETE' })
                success('Ghi chú đã xóa!')
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })
}
