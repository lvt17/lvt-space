import chalk from 'chalk'
import Table from 'cli-table3'

type Format = 'table' | 'json' | 'minimal'

export function formatTable(headers: string[], rows: string[][], title?: string): string {
    const table = new Table({
        head: headers.map(h => chalk.cyan.bold(h)),
        style: { head: [], border: ['gray'] },
        wordWrap: true,
    })
    rows.forEach(row => table.push(row))

    let output = ''
    if (title) output += chalk.bold(`\n${title}\n`)
    output += table.toString()
    return output
}

export function formatJson(data: unknown): string {
    return JSON.stringify(data, null, 2)
}

export function formatMinimal(rows: string[]): string {
    return rows.join('\n')
}

export function output(data: unknown, format: Format, tableRenderer?: () => string): void {
    if (format === 'json') {
        console.log(formatJson(data))
    } else if (format === 'minimal' && Array.isArray(data)) {
        console.log(formatMinimal(data.map(String)))
    } else if (tableRenderer) {
        console.log(tableRenderer())
    } else {
        console.log(formatJson(data))
    }
}

export function success(msg: string): void {
    console.log(chalk.green('✅'), msg)
}

export function error(msg: string): void {
    console.error(chalk.red('❌'), msg)
}

export function info(msg: string): void {
    console.log(chalk.blue('ℹ'), msg)
}

export function warn(msg: string): void {
    console.log(chalk.yellow('⚠'), msg)
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + '₫'
}

export function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('vi-VN')
}

export function statusIcon(status: string): string {
    switch (status) {
        case 'completed': return chalk.green('✅')
        case 'pending': return chalk.yellow('⏳')
        case 'processing': case 'in-progress': return chalk.blue('🔄')
        default: return '—'
    }
}
