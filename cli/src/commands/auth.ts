import { Command } from 'commander'
import chalk from 'chalk'
import config from '../config.js'
import { apiPublic } from '../api-client.js'
import { success, error, info } from '../output.js'

export function registerAuthCommands(program: Command) {
    program
        .command('login')
        .description('Đăng nhập qua trình duyệt (Device Auth Flow)')
        .option('--token <token>', 'Đăng nhập bằng Personal Access Token trực tiếp')
        .option('--api-url <url>', 'API URL (mặc định: https://lvtspace.me)')
        .action(async (opts) => {
            if (opts.apiUrl) {
                config.set('apiUrl', opts.apiUrl)
                info(`API URL: ${opts.apiUrl}`)
            }

            // Direct token login
            if (opts.token) {
                config.set('token', opts.token)
                success('Đã đăng nhập bằng token!')
                return
            }

            // Browser-based Device Auth Flow
            try {
                info('Đang tạo phiên đăng nhập...')
                const { code, loginUrl } = await apiPublic<{
                    code: string
                    loginUrl: string
                    expiresIn: number
                }>('/api/cli-auth/request', { method: 'POST' })

                console.log()
                console.log(chalk.bold('🌐 Mở trình duyệt để đăng nhập:'))
                console.log(chalk.cyan.underline(loginUrl))
                console.log()
                console.log(chalk.dim('Nếu trình duyệt không tự mở, copy link trên và paste vào browser.'))
                console.log()

                // Open browser
                const open = (await import('open')).default
                await open(loginUrl).catch(() => {})

                // Poll for token
                info('Đang chờ xác nhận trên trình duyệt...')
                const maxAttempts = 120 // 10 minutes at 5s intervals
                for (let i = 0; i < maxAttempts; i++) {
                    await new Promise(r => setTimeout(r, 5000))

                    try {
                        const result = await apiPublic<{
                            status: string
                            token?: string
                        }>(`/api/cli-auth/poll?code=${code}`)

                        if (result.status === 'authorized' && result.token) {
                            config.set('token', result.token)
                            console.log()
                            success('Đăng nhập thành công! 🎉')
                            info('Token đã được lưu. Bắt đầu dùng: lvt tasks')
                            return
                        }

                        if (result.status === 'expired') {
                            error('Phiên đăng nhập đã hết hạn. Chạy lại: lvt login')
                            return
                        }

                        // Still pending, continue polling
                        process.stdout.write('.')
                    } catch {
                        // Network error, retry
                    }
                }

                error('Hết thời gian chờ. Chạy lại: lvt login')
            } catch (err) {
                error(err instanceof Error ? err.message : 'Đăng nhập thất bại')
            }
        })

    program
        .command('logout')
        .description('Đăng xuất và xóa token')
        .action(() => {
            config.set('token', null)
            success('Đã đăng xuất!')
        })

    program
        .command('whoami')
        .description('Hiển thị thông tin user hiện tại')
        .option('-f, --format <format>', 'Output format (json)')
        .action(async (opts) => {
            try {
                const { api } = await import('../api-client.js')
                const data = await api<{
                    userId: string
                    authMethod: string
                    email?: string | null
                    displayName?: string | null
                    provider?: string
                    createdAt?: string | null
                    stats?: {
                        totalTasks: number
                        completedTasks: number
                        totalIncome: number
                        incomeRecords: number
                        activeTokens: number
                    }
                }>('/api/me')

                if (opts.format === 'json') {
                    console.log(JSON.stringify(data, null, 2))
                    return
                }

                const name = data.displayName || 'User'
                const email = data.email || '—'
                const provider = data.provider || 'email'
                const providerIcon = provider === 'google' ? '🔵' : provider === 'github' ? '⚫' : '📧'
                const since = data.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '—'
                const apiUrl = config.get('apiUrl') as string

                console.log()
                console.log(chalk.bold('╭─────────────────────────────────────╮'))
                console.log(chalk.bold('│') + '  👤 ' + chalk.bold.cyan(name) + ' '.repeat(Math.max(0, 30 - name.length)) + chalk.bold('│'))
                console.log(chalk.bold('├─────────────────────────────────────┤'))
                console.log(chalk.bold('│') + `  📧 ${chalk.dim(email)}` + ' '.repeat(Math.max(0, 31 - email.length)) + chalk.bold('│'))
                console.log(chalk.bold('│') + `  ${providerIcon} ${chalk.dim('Provider:')} ${provider}` + ' '.repeat(Math.max(0, 21 - provider.length)) + chalk.bold('│'))
                console.log(chalk.bold('│') + `  📅 ${chalk.dim('Từ:')} ${since}` + ' '.repeat(Math.max(0, 25 - since.length)) + chalk.bold('│'))
                console.log(chalk.bold('│') + `  🔑 ${chalk.dim('Auth:')} ${data.authMethod}` + ' '.repeat(Math.max(0, 24 - data.authMethod.length)) + chalk.bold('│'))

                if (data.stats) {
                    const s = data.stats
                    const rate = s.totalTasks > 0 ? Math.round(s.completedTasks / s.totalTasks * 100) : 0
                    const income = new Intl.NumberFormat('vi-VN').format(s.totalIncome) + '₫'

                    console.log(chalk.bold('├─────────────────────────────────────┤'))
                    console.log(chalk.bold('│') + `  📋 Tasks: ${chalk.green(s.completedTasks)}/${chalk.cyan(s.totalTasks)} (${rate}%)` + ' '.repeat(Math.max(0, 16 - String(s.totalTasks).length * 2)) + chalk.bold('│'))
                    console.log(chalk.bold('│') + `  💰 Thu nhập: ${chalk.yellow(income)}` + ' '.repeat(Math.max(0, 21 - income.length)) + chalk.bold('│'))
                    console.log(chalk.bold('│') + `  🔐 Tokens: ${chalk.dim(String(s.activeTokens))} active` + ' '.repeat(Math.max(0, 18 - String(s.activeTokens).length)) + chalk.bold('│'))
                }

                console.log(chalk.bold('├─────────────────────────────────────┤'))
                console.log(chalk.bold('│') + `  🌐 ${chalk.dim(apiUrl)}` + ' '.repeat(Math.max(0, 31 - apiUrl.length)) + chalk.bold('│'))
                console.log(chalk.bold('╰─────────────────────────────────────╯'))
                console.log()
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })
}
