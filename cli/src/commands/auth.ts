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
        .action(async () => {
            try {
                const { api } = await import('../api-client.js')
                const data = await api<{ userId: string; authMethod: string }>('/api/me')
                console.log(chalk.bold('👤 User Info'))
                console.log(`   ID: ${chalk.cyan(data.userId)}`)
                console.log(`   Auth: ${chalk.dim(data.authMethod)}`)
                console.log(`   API: ${chalk.dim(config.get('apiUrl'))}`)
            } catch (err) {
                error(err instanceof Error ? err.message : 'Lỗi')
            }
        })
}
