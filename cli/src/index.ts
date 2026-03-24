#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import { registerAuthCommands } from './commands/auth.js'
import { registerTaskCommands } from './commands/tasks.js'
import { registerDailyCommands } from './commands/daily.js'
import { registerIncomeCommands } from './commands/income.js'
import { registerDashboardCommands } from './commands/dashboard.js'
import { registerNotesCommands } from './commands/notes.js'
import { registerAiCommands } from './commands/ai.js'
import config from './config.js'

const program = new Command()

program
    .name('lvt')
    .description(chalk.bold('Lvt Space CLI') + chalk.dim(' — Manage your workspace from terminal'))
    .version('1.0.0')
    .addHelpText('after', () => {
        const dim = chalk.dim
        const cyan = chalk.cyan
        const bold = chalk.bold
        const green = chalk.green
        const yellow = chalk.yellow

        return `
${bold('━━━ COMMAND GROUPS ━━━')}

  ${bold.cyan('🔐 Authentication')}
    ${green('lvt login')}              Đăng nhập qua browser (Device Auth)
    ${green('lvt login --token')} ${dim('<t>')}   Đăng nhập bằng PAT trực tiếp
    ${green('lvt logout')}             Đăng xuất
    ${green('lvt whoami')}             Xem thông tin tài khoản + thống kê

  ${bold.cyan('📋 Tasks & Daily')}
    ${green('lvt tasks')}              Danh sách tất cả tasks
    ${green('lvt tasks add')} ${dim('"Tên"')}    Tạo task mới
    ${green('lvt tasks done')} ${dim('<id>')}    Đánh dấu hoàn thành
    ${green('lvt daily')}              Checklist hôm nay
    ${green('lvt daily tomorrow')}     Checklist ngày mai

  ${bold.cyan('💰 Finance')}
    ${green('lvt income')}             Thu nhập tháng này
    ${green('lvt income total')}       Tổng thu nhập
    ${green('lvt stats')}              Dashboard tổng quan
    ${green('lvt performance')}        Biểu đồ hiệu suất 6 tháng

  ${bold.cyan('🛠  Tools')}
    ${green('lvt notes')}              Ghi chú / Canvas notes
    ${green('lvt notes add')} ${dim('"Tên"')}   Tạo ghi chú mới
    ${green('lvt ai')} ${dim('"prompt"')}        Sinh checklist bằng AI
    ${green('lvt config')}             Xem / sửa config

${bold('━━━ EXAMPLES ━━━')}

  ${dim('$')} ${cyan('lvt tasks add "Design homepage" --price 500000')}
  ${dim('$')} ${cyan('lvt income --format json')}
  ${dim('$')} ${cyan('lvt ai "Lên kế hoạch học React trong 1 tuần"')}
  ${dim('$')} ${cyan('lvt config set apiUrl https://lvtspace.me')}

${bold('━━━ MORE INFO ━━━')}

  ${dim('Docs:')}    ${yellow('https://lvtspace.me/settings')} → tab Developer
  ${dim('Version:')} ${dim(program.version() || '1.0.0')}
  ${dim('Config:')}  ${dim(config.path)}
`
    })

// Config command
program
    .command('config')
    .description('Quản lý config')
    .argument('[action]', 'get / set / reset / path')
    .argument('[key]', 'Config key')
    .argument('[value]', 'Config value')
    .action((action, key, value) => {
        if (!action || action === 'path') {
            console.log(chalk.dim('Config path:'), config.path)
            return
        }
        if (action === 'get') {
            if (key) {
                console.log(config.get(key as keyof typeof config.store))
            } else {
                const store = { ...config.store }
                // Mask token for security
                if (store.token) store.token = store.token.slice(0, 8) + '...'
                console.log(JSON.stringify(store, null, 2))
            }
            return
        }
        if (action === 'set' && key && value) {
            config.set(key as keyof typeof config.store, value)
            console.log(chalk.green('✅'), `${key} = ${value}`)
            return
        }
        if (action === 'reset') {
            config.clear()
            console.log(chalk.green('✅'), 'Config đã reset!')
            return
        }
        console.log(chalk.dim('Usage: lvt config [get|set|reset|path] [key] [value]'))
    })

// Register all command groups
registerAuthCommands(program)
registerTaskCommands(program)
registerDailyCommands(program)
registerIncomeCommands(program)
registerDashboardCommands(program)
registerNotesCommands(program)
registerAiCommands(program)

program.parse()
