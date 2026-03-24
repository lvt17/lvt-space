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
