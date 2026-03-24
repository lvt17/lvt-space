import { Command } from 'commander'
import chalk from 'chalk'
import { api } from '../api-client.js'
import { error, success } from '../output.js'

interface ChecklistItem {
    id: string
    text: string
    is_checked: boolean
    indent_level: number
}

export function registerAiCommands(program: Command) {
    program
        .command('ai <prompt>')
        .description('Sinh checklist bằng AI từ prompt')
        .action(async (prompt) => {
            try {
                console.log(chalk.dim('🤖 Đang sinh checklist...'))
                const result = await api<{ items: ChecklistItem[]; raw_prompt: string }>('/api/ai/generate-checklist', {
                    method: 'POST',
                    body: JSON.stringify({ prompt }),
                })

                if (!result.items?.length) {
                    console.log(chalk.dim('AI không trả về kết quả.'))
                    return
                }

                console.log()
                console.log(chalk.bold.cyan(`🤖 AI Checklist: "${prompt}"`))
                console.log(chalk.dim('─'.repeat(40)))

                result.items.forEach(item => {
                    const indent = '  '.repeat(item.indent_level)
                    console.log(`${indent}${chalk.dim('☐')} ${item.text}`)
                })

                console.log()
                success(`${result.items.length} items đã sinh!`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })
}
