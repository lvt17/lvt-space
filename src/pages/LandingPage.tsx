import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FiLayout, FiCheckSquare, FiDollarSign, FiGrid,
    FiCalendar, FiSettings, FiMoon, FiSun, FiMonitor,
    FiArrowRight, FiShield, FiZap, FiGlobe, FiGithub, FiLinkedin, FiInstagram,
    FiChevronDown, FiStar, FiUsers, FiTrendingUp
} from 'react-icons/fi'
import SpaceLogo from '@/components/ui/SpaceLogo'

/* ─── i18n Content ─── */
const content = {
    en: {
        nav: { features: 'Features', themes: 'Themes', cta: 'Get Started' },
        hero: {
            badge: 'All-in-One Workspace',
            title: 'One place',
            titleHighlight: 'For everything you do',
            subtitle: 'Manage tasks, track income, organize checklists, and visualize your workflow — all in one beautiful, theme-aware platform.',
            cta: 'Start Free',
            ctaSub: 'No credit card required',
            secondary: 'See Features',
        },
        stats: [
            { value: '6', label: 'Color Palettes' },
            { value: '7', label: 'Built-in Modules' },
            { value: '3', label: 'Display Modes' },
            { value: '100%', label: 'Free to Use' },
        ],
        features: {
            title: 'Everything You Need',
            subtitle: 'A complete toolkit designed for freelancers, students, and small teams to stay organized and productive.',
            items: [
                { icon: FiLayout, title: 'Smart Dashboard', desc: 'Real-time overview with income charts, task statistics, and daily progress tracking.' },
                { icon: FiCheckSquare, title: 'Task Management', desc: 'Full CRUD with priorities, status workflow, smart parsing, and payment tracking.' },
                { icon: FiGrid, title: 'Canvas Notes', desc: 'Drag-and-drop sticky notes on an infinite canvas. Resize, pin, and color-code freely.' },
                { icon: FiCalendar, title: 'Daily Checklist', desc: 'Track daily habits and recurring tasks with visual completion percentages.' },
                { icon: FiDollarSign, title: 'Income Tracking', desc: 'Log income with source, amount, and date. Monthly aggregation and trend charts.' },
                { icon: FiSettings, title: 'Deep Settings', desc: '6 customization tabs: themes, profile, security, updates, credits, and advanced.' },
            ],
        },
        themes: {
            title: 'Your Space, Your Style',
            subtitle: 'Choose from 6 handcrafted color palettes and 3 display modes. Every pixel adapts to your taste.',
            modes: [
                { icon: FiSun, label: 'Light', desc: 'Clean white surfaces' },
                { icon: FiMoon, label: 'Dark', desc: 'Deep Catppuccin tones' },
                { icon: FiMonitor, label: 'System', desc: 'Follows your OS' },
            ],
        },
        security: {
            title: 'Built with Security First',
            subtitle: 'Your data is protected at every layer.',
            items: [
                { icon: FiShield, title: 'Row-Level Security', desc: 'Each user can only access their own data via Supabase RLS.' },
                { icon: FiZap, title: 'JWT Authentication', desc: 'Verified tokens on every API call. No shortcuts, no fallbacks.' },
                { icon: FiGlobe, title: 'CORS Protected', desc: 'API locked to production domain. No cross-origin abuse.' },
            ],
        },
        cta: {
            title: 'Ready to Get Organized?',
            subtitle: 'Join Lvt Space and experience productivity that looks as good as it feels.',
            button: 'Create Free Account',
        },
        footer: {
            tagline: 'Where productivity meets aesthetics.',
            madeBy: 'Built with care by',
            author: 'Lieu Vinh Toan',
            rights: 'All rights reserved.',
        },
    },
    vi: {
        nav: { features: 'Tính năng', themes: 'Giao diện', cta: 'Dùng thử' },
        hero: {
            badge: 'Workspace all-in-one cho dân chuyên',
            title: 'One place',
            titleHighlight: 'For everything you do',
            subtitle: 'Quản lý task, ghi nhận thu nhập, tổ chức checklist và theo dõi tiến độ — gom hết vào một nền tảng duy nhất.',
            cta: 'Dùng thử miễn phí',
            ctaSub: 'Không cần thẻ tín dụng',
            secondary: 'Khám phá ngay',
        },
        stats: [
            { value: '6', label: 'Bộ màu tuỳ chọn' },
            { value: '7', label: 'Module sẵn có' },
            { value: '3', label: 'Chế độ sáng/tối' },
            { value: '100%', label: 'Hoàn toàn miễn phí' },
        ],
        features: {
            title: 'Đầy đủ mọi thứ',
            subtitle: 'Từ quản lý task đến ghi thu nhập — dành cho freelancer, sinh viên và team nhỏ muốn làm việc gọn gàng hơn.',
            items: [
                { icon: FiLayout, title: 'Dashboard tổng quan', desc: 'Nhìn nhanh biểu đồ thu nhập, số liệu task và tiến độ trong ngày.' },
                { icon: FiCheckSquare, title: 'Quản lý task', desc: 'Thêm, sửa, xoá task dễ dàng. Hỗ trợ nhập nhanh, lọc theo trạng thái và đánh dấu thanh toán.' },
                { icon: FiGrid, title: 'Ghi chú Canvas', desc: 'Kéo thả note trên canvas vô hạn. Đổi màu, đổi size, ghim lại tuỳ ý.' },
                { icon: FiCalendar, title: 'Checklist hàng ngày', desc: 'Lên danh sách việc cần làm mỗi ngày, xem được phần trăm hoàn thành.' },
                { icon: FiDollarSign, title: 'Ghi nhận thu nhập', desc: 'Ghi lại nguồn tiền, số tiền, ngày nhận. Xem biểu đồ xu hướng theo tháng.' },
                { icon: FiSettings, title: 'Tuỳ chỉnh sâu', desc: 'Đổi theme, cập nhật profile, bảo mật tài khoản — 6 tab cài đặt chi tiết.' },
            ],
        },
        themes: {
            title: 'Giao diện theo gu của bạn',
            subtitle: '6 bộ màu thiết kế tay + 3 chế độ hiển thị. Đổi một cái là cả app thay đổi theo.',
            modes: [
                { icon: FiSun, label: 'Sáng', desc: 'Giao diện trắng sạch sẽ' },
                { icon: FiMoon, label: 'Tối', desc: 'Tông tối dễ chịu cho mắt' },
                { icon: FiMonitor, label: 'Tự động', desc: 'Theo cài đặt máy bạn' },
            ],
        },
        security: {
            title: 'An toàn tuyệt đối',
            subtitle: 'Dữ liệu của bạn được bảo vệ nghiêm ngặt ở mọi tầng hệ thống.',
            items: [
                { icon: FiShield, title: 'Phân quyền dữ liệu', desc: 'Mỗi user chỉ thấy data của mình. Không ai truy cập chéo được.' },
                { icon: FiZap, title: 'Xác thực JWT', desc: 'Mỗi request đều phải qua xác minh token. Không có ngoại lệ.' },
                { icon: FiGlobe, title: 'Khoá CORS', desc: 'Chỉ domain chính thức mới gọi được API. Chặn mọi truy cập trái phép.' },
            ],
        },
        cta: {
            title: 'Bắt đầu ngay hôm nay?',
            subtitle: 'Tạo tài khoản trong 10 giây và khám phá workspace của riêng bạn.',
            button: 'Đăng ký miễn phí',
        },
        footer: {
            tagline: 'Làm việc đẹp hơn mỗi ngày.',
            madeBy: 'Phát triển bởi',
            author: 'Liêu Vĩnh Toàn',
            rights: 'Đã đăng ký bản quyền.',
        },
    },
}

const PALETTES = [
    { id: 'purple', label: 'Purple', color: '#C264FF' },
    { id: 'ocean', label: 'Ocean', color: '#3B82F6' },
    { id: 'emerald', label: 'Emerald', color: '#10B981' },
    { id: 'rose', label: 'Rose', color: '#F43F5E' },
    { id: 'amber', label: 'Amber', color: '#F59E0B' },
    { id: 'mono', label: 'Mono', color: '#6B7280' },
]

type Lang = 'en' | 'vi'

export default function LandingPage() {
    const navigate = useNavigate()
    const [lang, setLang] = useState<Lang>('vi')
    const [scrolled, setScrolled] = useState(false)
    const t = content[lang]

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const goSignUp = () => navigate('/login')

    return (
        <div className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">
            {/* ─── Ambient Background ─── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[80px]" />
            </div>

            {/* ─── Navbar ─── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a14]/80 backdrop-blur-xl border-b border-white/5' : ''}`}>
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <SpaceLogo className="w-7 h-7" />
                        <span className="font-bold text-lg tracking-tight">Lvt Space</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
                        <a href="#features" className="hover:text-white transition-colors">{t.nav.features}</a>
                        <a href="#themes" className="hover:text-white transition-colors">{t.nav.themes}</a>
                        {/* Lang Toggle */}
                        <button
                            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/25 text-white/70 hover:text-white transition-all text-xs font-medium cursor-pointer"
                            aria-label="Toggle language"
                        >
                            <FiGlobe className="text-sm" />
                            {lang === 'en' ? 'VI' : 'EN'}
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Mobile lang toggle */}
                        <button
                            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
                            className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-white/10 text-white/70 text-xs cursor-pointer"
                        >
                            <FiGlobe className="text-sm" />
                            {lang === 'en' ? 'VI' : 'EN'}
                        </button>
                        <button
                            onClick={goSignUp}
                            className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer hover:scale-[1.02]"
                        >
                            {t.nav.cta}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ─── */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 mb-8">
                        <FiZap className="text-purple-400" />
                        <span>{t.hero.badge}</span>
                    </div>
                    {/* Title */}
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                        {t.hero.title}
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            {t.hero.titleHighlight}
                        </span>
                    </h1>
                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
                        {t.hero.subtitle}
                    </p>
                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                        <button
                            onClick={goSignUp}
                            className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all cursor-pointer hover:scale-[1.02]"
                        >
                            {t.hero.cta}
                            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a
                            href="#features"
                            className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-white/70 font-semibold hover:bg-white/5 hover:text-white transition-all text-lg"
                        >
                            {t.hero.secondary}
                            <FiChevronDown />
                        </a>
                    </div>
                    <p className="text-sm text-white/30">{t.hero.ctaSub}</p>
                </div>

                {/* Stats */}
                <div className="max-w-4xl mx-auto px-6 mt-20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {t.stats.map((stat, i) => (
                            <div key={i} className="text-center p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <div className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-white/40 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Features ─── */}
            <section id="features" className="relative py-24">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                            {t.features.title}
                        </h2>
                        <p className="text-lg text-white/40 max-w-xl mx-auto">
                            {t.features.subtitle}
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {t.features.items.map((feature, i) => {
                            const Icon = feature.icon
                            const gradients = [
                                'from-purple-500/20 to-purple-500/5',
                                'from-blue-500/20 to-blue-500/5',
                                'from-emerald-500/20 to-emerald-500/5',
                                'from-amber-500/20 to-amber-500/5',
                                'from-rose-500/20 to-rose-500/5',
                                'from-cyan-500/20 to-cyan-500/5',
                            ]
                            const iconColors = ['text-purple-400', 'text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400', 'text-cyan-400']
                            return (
                                <div
                                    key={i}
                                    className="group relative p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300"
                                >
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradients[i]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-5 ${iconColors[i]}`}>
                                            <Icon className="text-xl" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2 text-white/90">{feature.title}</h3>
                                        <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ─── Themes ─── */}
            <section id="themes" className="relative py-24">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                            {t.themes.title}
                        </h2>
                        <p className="text-lg text-white/40 max-w-xl mx-auto">
                            {t.themes.subtitle}
                        </p>
                    </div>

                    {/* Palette dots */}
                    <div className="flex justify-center gap-4 mb-12">
                        {PALETTES.map(p => (
                            <div key={p.id} className="group flex flex-col items-center gap-2">
                                <div
                                    className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-all group-hover:scale-110 shadow-lg"
                                    style={{ backgroundColor: p.color, boxShadow: `0 4px 24px ${p.color}33` }}
                                />
                                <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">{p.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Display modes */}
                    <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
                        {t.themes.modes.map((mode, i) => {
                            const Icon = mode.icon
                            return (
                                <div
                                    key={i}
                                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] text-center transition-all duration-300 hover:bg-white/[0.05]"
                                >
                                    <Icon className="text-2xl mx-auto mb-3 text-purple-400" />
                                    <h4 className="font-bold text-white/90 mb-1">{mode.label}</h4>
                                    <p className="text-xs text-white/40">{mode.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ─── Security ─── */}
            <section className="relative py-24">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                            {t.security.title}
                        </h2>
                        <p className="text-lg text-white/40 max-w-xl mx-auto">
                            {t.security.subtitle}
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                        {t.security.items.map((item, i) => {
                            const Icon = item.icon
                            return (
                                <div key={i} className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/20 transition-all duration-300 group">
                                    <Icon className="text-2xl text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                                    <h4 className="font-bold text-white/90 mb-2">{item.title}</h4>
                                    <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ─── CLI / Terminal ─── */}
            <section className="relative py-24">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                            {lang === 'vi' ? 'Quản lý từ Terminal' : 'Manage from Terminal'}
                        </h2>
                        <p className="text-lg text-white/40 max-w-xl mx-auto">
                            {lang === 'vi'
                                ? 'Cài CLI qua GitHub, đăng nhập và quản lý mọi thứ ngay trên terminal.'
                                : 'Install via GitHub, login and manage everything right from your terminal.'}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Terminal mockup */}
                        <div className="rounded-2xl bg-[#1a1a2e] border border-white/[0.08] overflow-hidden shadow-2xl shadow-purple-500/5">
                            <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                                <span className="ml-2 text-xs text-white/30 font-mono">Terminal</span>
                            </div>
                            <div className="p-5 font-mono text-sm space-y-2">
                                <p className="text-white/40"># Cài đặt CLI</p>
                                <p><span className="text-emerald-400">$</span> <span className="text-white/80">git clone https://github.com/lvt17/lvt-space.git</span></p>
                                <p><span className="text-emerald-400">$</span> <span className="text-white/80">cd lvt-space/cli && npm install && npm link</span></p>
                                <p className="text-white/20 pt-1"># Đăng nhập & sử dụng</p>
                                <p><span className="text-emerald-400">$</span> <span className="text-white/80">lvt login</span></p>
                                <p className="text-emerald-400/70">  ✓ Đã đăng nhập thành công!</p>
                                <p><span className="text-emerald-400">$</span> <span className="text-white/80">lvt whoami</span></p>
                                <p className="text-cyan-400/70">  👤 Liêu Vĩnh Toàn · 📋 5/23 tasks · 💰 21.500.000₫</p>
                                <p><span className="text-emerald-400">$</span> <span className="text-white/80">lvt stats</span></p>
                                <p className="text-purple-400/70">  📊 Dashboard — xem ngay trên terminal!</p>
                            </div>
                        </div>

                        {/* Features list */}
                        <div className="flex flex-col justify-center space-y-5">
                            {[
                                { icon: '📋', title: lang === 'vi' ? 'Quản lý tasks' : 'Task Management', desc: lang === 'vi' ? 'Thêm, sửa, xoá, đánh dấu hoàn thành từ terminal' : 'Add, edit, delete, mark complete from terminal' },
                                { icon: '💰', title: lang === 'vi' ? 'Theo dõi thu nhập' : 'Income Tracking', desc: lang === 'vi' ? 'Xem thu nhập, thống kê, biểu đồ hiệu suất' : 'View income, stats, performance charts' },
                                { icon: '📒', title: lang === 'vi' ? 'Ghi chú & Checklist' : 'Notes & Checklists', desc: lang === 'vi' ? 'Xem, toggle check, tạo note mới ngay từ CLI' : 'View, toggle, create notes from CLI' },
                                { icon: '🤖', title: lang === 'vi' ? 'MCP / AI Agent' : 'MCP / AI Agent', desc: lang === 'vi' ? 'Kết nối AI Agent để điều khiển bằng ngôn ngữ tự nhiên' : 'Connect AI agents to control with natural language' },
                            ].map((f, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all">
                                    <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
                                    <div>
                                        <h4 className="font-bold text-white/90 mb-1">{f.title}</h4>
                                        <p className="text-sm text-white/40">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Social Proof ─── */}
            <section className="relative py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex flex-wrap justify-center gap-8 items-center text-white/20">
                        <div className="flex items-center gap-2">
                            <FiUsers className="text-xl" />
                            <span className="text-sm font-medium">Open Source Friendly</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiStar className="text-xl" />
                            <span className="text-sm font-medium">Modern Stack 2026</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiTrendingUp className="text-xl" />
                            <span className="text-sm font-medium">TypeScript 97%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FiShield className="text-xl" />
                            <span className="text-sm font-medium">Security Audited</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="relative py-24">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <div className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-emerald-900/20 border border-white/[0.08] overflow-hidden">
                        {/* Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-purple-500/20 rounded-full blur-[100px]" />
                        <div className="relative">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
                                {t.cta.title}
                            </h2>
                            <p className="text-lg text-white/50 mb-8 max-w-md mx-auto">
                                {t.cta.subtitle}
                            </p>
                            <button
                                onClick={goSignUp}
                                className="group inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-[#0a0a14] font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all cursor-pointer hover:scale-[1.02]"
                            >
                                {t.cta.button}
                                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="relative border-t border-white/[0.06] py-10">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                            <SpaceLogo className="w-5 h-5" />
                            <span className="font-bold text-sm">Lvt Space</span>
                            <span className="text-xs text-white/30">{t.footer.tagline}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-white/30">
                            <span>{t.footer.madeBy} <a href="https://github.com/lvt17" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">{t.footer.author}</a></span>
                            <div className="flex items-center gap-3">
                                <a href="https://github.com/lvt17/lvt-space" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                                    <FiGithub className="text-lg" />
                                </a>
                                <a href="https://linkedin.com/in/lvt17" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                                    <FiLinkedin className="text-lg" />
                                </a>
                                <a href="https://www.instagram.com/l.vt17_/" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                                    <FiInstagram className="text-lg" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-6 text-xs text-white/15">
                        &copy; {new Date().getFullYear()} Lvt Space. {t.footer.rights}
                    </div>
                </div>
            </footer>
        </div>
    )
}
