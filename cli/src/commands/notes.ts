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
    teal: chalk.cyan,
}

// Cache notes list for index-based lookup
let cachedNotes: ChecklistRow[] = []

async function resolveNoteId(idOrIndex: string): Promise<string> {
    // If it looks like a UUID, use directly
    if (idOrIndex.length > 6) return idOrIndex

    // If it's a number, fetch list and resolve by index
    const idx = parseInt(idOrIndex)
    if (!isNaN(idx) && idx > 0) {
        if (!cachedNotes.length) {
            cachedNotes = await api<ChecklistRow[]>('/api/checklists')
        }
        if (idx <= cachedNotes.length) {
            return cachedNotes[idx - 1].id
        }
        throw new Error(`Không tìm thấy ghi chú #${idx}. Có ${cachedNotes.length} ghi chú.`)
    }

    return idOrIndex
}

export function registerNotesCommands(program: Command) {
    const notes = program
        .command('notes')
        .description('Quản lý ghi chú / canvas notes')
        .argument('[id]', 'Xem ghi chú theo số thứ tự hoặc ID')
        .option('-f, --format <format>', 'Output format')
        .action(async (id, opts) => {
            try {
                // If ID provided, show that note directly
                if (id) {
                    const noteId = await resolveNoteId(id)
                    await showNote(noteId)
                    return
                }

                const format = opts.format || config.get('format')
                const data = await api<ChecklistRow[]>('/api/checklists')
                cachedNotes = data

                if (format === 'json') {
                    console.log(JSON.stringify(data, null, 2))
                    return
                }

                if (!data.length) {
                    console.log(chalk.dim('Chưa có ghi chú nào.'))
                    return
                }

                console.log(formatTable(
                    ['#', 'Tiêu đề', 'Loại', 'Màu', 'Items', 'Cập nhật'],
                    data.map((n, i) => {
                        const colorFn = colorMap[n.color] || chalk.white
                        const itemCount = n.type === 'checklist' && n.items
                            ? `${n.items.filter(it => it.is_checked).length}/${n.items.length}`
                            : '—'
                        return [
                            chalk.dim(String(i + 1)),
                            colorFn(n.title),
                            n.type === 'checklist' ? '📋' : '📝',
                            colorFn('●') + ' ' + n.color,
                            itemCount,
                            formatDate(n.updated_at),
                        ]
                    }),
                    `📒 Ghi chú (${data.length})`,
                ))
                console.log(chalk.dim('\n  Tip: lvt notes <số> để xem chi tiết'))
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    notes
        .command('view <id>')
        .description('Xem chi tiết ghi chú')
        .action(async (id) => {
            try {
                const noteId = await resolveNoteId(id)
                await showNote(noteId)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })

    notes
        .command('add <title>')
        .description('Tạo ghi chú mới')
        .option('-c, --color <color>', 'Màu (purple/green/amber/red/blue/teal)', 'purple')
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
        .command('check <noteId> <itemIndex>')
        .description('Toggle check/uncheck item trong checklist')
        .action(async (noteId, itemIndex) => {
            try {
                const resolvedId = await resolveNoteId(noteId)
                const note = await api<ChecklistRow>(`/api/checklists/${resolvedId}`)

                if (note.type !== 'checklist' || !note.items?.length) {
                    error('Ghi chú này không phải checklist hoặc chưa có items.')
                    return
                }

                const idx = parseInt(itemIndex) - 1
                if (idx < 0 || idx >= note.items.length) {
                    error(`Item index phải từ 1 đến ${note.items.length}`)
                    return
                }

                // Toggle checked state
                const updatedItems = note.items.map((item, i) => {
                    if (i === idx) return { ...item, is_checked: !item.is_checked }
                    return item
                })

                await api<ChecklistRow>(`/api/checklists/${resolvedId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ items: updatedItems }),
                })

                const item = note.items[idx]
                const newState = !item.is_checked
                const icon = newState ? chalk.green('☑') : chalk.dim('☐')
                success(`${icon} ${item.text} → ${newState ? 'done' : 'undone'}`)
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
                const resolvedId = await resolveNoteId(id)
                const body: Record<string, unknown> = {}
                if (opts.title) body.title = opts.title
                if (opts.color) body.color = opts.color
                if (opts.content) body.content = opts.content

                const note = await api<ChecklistRow>(`/api/checklists/${resolvedId}`, {
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
                const resolvedId = await resolveNoteId(id)
                await api<void>(`/api/checklists/${resolvedId}`, { method: 'DELETE' })
                success('Ghi chú đã xóa!')
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })
}

async function showNote(noteId: string) {
    const note = await api<ChecklistRow>(`/api/checklists/${noteId}`)
    const colorFn = colorMap[note.color] || chalk.white

    console.log()
    console.log(colorFn('━'.repeat(50)))
    console.log(chalk.bold(colorFn(`  ${note.title}`)))
    if (note.description) console.log(chalk.dim(`  ${note.description}`))
    console.log(colorFn('━'.repeat(50)))

    if (note.type === 'checklist' && note.items?.length) {
        console.log()
        note.items.forEach((item, i) => {
            const indent = '  '.repeat(item.indent_level + 1)
            const icon = item.is_checked ? chalk.green('☑') : chalk.dim('☐')
            const text = item.is_checked ? chalk.dim.strikethrough(item.text) : item.text
            const num = chalk.dim(`${i + 1}.`)
            console.log(`${indent}${num} ${icon} ${text}`)
        })
        const done = note.items.filter(it => it.is_checked).length
        console.log()
        console.log(chalk.dim(`  ${done}/${note.items.length} hoàn thành`))
        console.log(chalk.dim(`\n  Tip: lvt notes check <noteId> <itemNumber> để toggle`))
    } else if (note.content) {
        console.log(`  ${note.content}`)
    }
    console.log()
}
