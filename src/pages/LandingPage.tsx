import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    FiLayout, FiCheckSquare, FiDollarSign, FiGrid,
    FiCalendar, FiSettings, FiMoon, FiSun, FiMonitor,
    FiArrowRight, FiShield, FiZap, FiGlobe, FiGithub,
    FiChevronDown, FiStar, FiUsers, FiTrendingUp
} from 'react-icons/fi'
import SpaceLogo from '@/components/ui/SpaceLogo'

/* ─── i18n Content ─── */
const content = {
    en: {
        nav: { features: 'Features', themes: 'Themes', cta: 'Get Started' },
        hero: {
            badge: 'All-in-One Workspace',
            title: 'Where Productivity',
            titleHighlight: 'Meets Aesthetics',
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
        nav: { features: 'Tính năng', themes: 'Giao diện', cta: 'Bắt đầu' },
        hero: {
            badge: 'Không gian làm việc tất cả trong một',
            title: 'Hiệu suất',
            titleHighlight: 'Gặp Thẩm mỹ',
            subtitle: 'Quản lý công việc, theo dõi thu nhập, tổ chức checklist và trực quan hoá quy trình — tất cả trong một nền tảng đẹp mắt.',
            cta: 'Bắt đầu miễn phí',
            ctaSub: 'Không cần thẻ tín dụng',
            secondary: 'Xem tính năng',
        },
        stats: [
            { value: '6', label: 'Bảng màu' },
            { value: '7', label: 'Module tích hợp' },
            { value: '3', label: 'Chế độ hiển thị' },
            { value: '100%', label: 'Miễn phí' },
        ],
        features: {
            title: 'Mọi thứ bạn cần',
            subtitle: 'Bộ công cụ hoàn chỉnh dành cho freelancer, sinh viên và nhóm nhỏ để luôn có tổ chức và năng suất.',
            items: [
                { icon: FiLayout, title: 'Dashboard thông minh', desc: 'Tổng quan với biểu đồ thu nhập, thống kê công việc và tiến độ hàng ngày.' },
                { icon: FiCheckSquare, title: 'Quản lý công việc', desc: 'CRUD đầy đủ với ưu tiên, trạng thái, smart parsing và theo dõi thanh toán.' },
                { icon: FiGrid, title: 'Canvas ghi chú', desc: 'Kéo thả sticky notes trên canvas vô hạn. Thay đổi kích thước, ghim và tô màu.' },
                { icon: FiCalendar, title: 'Checklist hàng ngày', desc: 'Theo dõi thói quen và công việc hàng ngày với phần trăm hoàn thành.' },
                { icon: FiDollarSign, title: 'Theo dõi thu nhập', desc: 'Ghi nhận thu nhập theo nguồn, số tiền và ngày. Biểu đồ xu hướng hàng tháng.' },
                { icon: FiSettings, title: 'Cài đặt chuyên sâu', desc: '6 tab tuỳ chỉnh: giao diện, hồ sơ, bảo mật, cập nhật, credits và nâng cao.' },
            ],
        },
        themes: {
            title: 'Không gian của bạn, Phong cách của bạn',
            subtitle: 'Chọn từ 6 bảng màu thủ công và 3 chế độ hiển thị. Mọi pixel thích ứng theo gu của bạn.',
            modes: [
                { icon: FiSun, label: 'Sáng', desc: 'Bề mặt trắng tinh' },
                { icon: FiMoon, label: 'Tối', desc: 'Tông Catppuccin sâu' },
                { icon: FiMonitor, label: 'Hệ thống', desc: 'Theo hệ điều hành' },
            ],
        },
        security: {
            title: 'Bảo mật từ lõi',
            subtitle: 'Dữ liệu của bạn được bảo vệ ở mọi tầng.',
            items: [
                { icon: FiShield, title: 'Row-Level Security', desc: 'Mỗi người dùng chỉ truy cập được dữ liệu của mình qua Supabase RLS.' },
                { icon: FiZap, title: 'Xác thực JWT', desc: 'Token được xác minh mỗi lần gọi API. Không có đường tắt.' },
                { icon: FiGlobe, title: 'CORS bảo vệ', desc: 'API khóa chỉ cho domain production. Không bị lạm dụng cross-origin.' },
            ],
        },
        cta: {
            title: 'Sẵn sàng để có tổ chức?',
            subtitle: 'Tham gia Lvt Space và trải nghiệm năng suất đẹp mắt.',
            button: 'Tạo tài khoản miễn phí',
        },
        footer: {
            tagline: 'Nơi hiệu suất gặp thẩm mỹ.',
            madeBy: 'Xây dựng bởi',
            author: 'Liêu Vĩnh Toàn',
            rights: 'Bảo lưu mọi quyền.',
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
                            <a href="https://github.com/lvt17/lvt-space" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors">
                                <FiGithub className="text-lg" />
                            </a>
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
