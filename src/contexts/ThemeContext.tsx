import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

/* ─── Palette Definitions ─── */
export type ThemeMode = 'light' | 'dark' | 'system'
export type PaletteId = 'purple' | 'ocean' | 'emerald' | 'rose' | 'amber' | 'mono'

export interface PaletteDef {
    id: PaletteId
    label: string
    primary: string
    mid: string
    soft: string
    light: string
    lighter: string
    lightest: string
    preview: string  // color for the palette picker dot
}

export const PALETTES: PaletteDef[] = [
    { id: 'purple',  label: 'Tím',      primary: '#C264FF', mid: '#CC7DFF', soft: '#D697FF', light: '#E0B0FF', lighter: '#EACAFF', lightest: '#F4E3FF', preview: '#C264FF' },
    { id: 'ocean',   label: 'Biển',     primary: '#3B82F6', mid: '#60A5FA', soft: '#93C5FD', light: '#BFDBFE', lighter: '#DBEAFE', lightest: '#EFF6FF', preview: '#3B82F6' },
    { id: 'emerald', label: 'Ngọc',     primary: '#10B981', mid: '#34D399', soft: '#6EE7B7', light: '#A7F3D0', lighter: '#D1FAE5', lightest: '#ECFDF5', preview: '#10B981' },
    { id: 'rose',    label: 'Hồng',     primary: '#F43F5E', mid: '#FB7185', soft: '#FDA4AF', light: '#FECDD3', lighter: '#FFE4E6', lightest: '#FFF1F2', preview: '#F43F5E' },
    { id: 'amber',   label: 'Vàng',     primary: '#F59E0B', mid: '#FBBF24', soft: '#FCD34D', light: '#FDE68A', lighter: '#FEF3C7', lightest: '#FFFBEB', preview: '#F59E0B' },
    { id: 'mono',    label: 'Đơn sắc',  primary: '#4B5563', mid: '#6B7280', soft: '#9CA3AF', light: '#D1D5DB', lighter: '#E5E7EB', lightest: '#F3F4F6', preview: '#9CA3AF' },
]

/* ─── Dynamic dark surfaces based on palette ─── */
function generateDarkSurfaces(palette: PaletteDef) {
    const rgb = hexToRgb(palette.primary)
    if (palette.id === 'mono') {
        // Pure neutral grays for mono — premium monochrome dark
        return {
            surface: '#1a1a1a',
            surfaceSecondary: '#141414',
            surfaceHover: '#262626',
            sidebarBg: '#111111',
            border: '#333333',
            borderLight: '#2a2a2a',
            textPrimary: '#f5f5f5',
            textSecondary: '#b3b3b3',
            textMuted: '#737373',
            bodyGradient: 'linear-gradient(145deg, #0a0a0a 0%, #141414 40%, #1a1a1a 70%, #0a0a0a 100%)',
        }
    }
    // Other palettes: Catppuccin-style with subtle palette tint
    return {
        surface: '#1e1e2e',
        surfaceSecondary: '#181825',
        surfaceHover: '#2a2a3e',
        sidebarBg: '#181825',
        border: `rgba(${rgb}, 0.15)`,
        borderLight: `rgba(${rgb}, 0.08)`,
        textPrimary: '#cdd6f4',
        textSecondary: '#a6adc8',
        textMuted: '#6c7086',
        bodyGradient: 'linear-gradient(145deg, #11111b 0%, #181825 40%, #1e1e2e 70%, #11111b 100%)',
    }
}

/* ─── Dynamic light surfaces based on palette ─── */
function generateLightSurfaces(palette: PaletteDef) {
    const rgb = hexToRgb(palette.primary)
    return {
        surface: '#ffffff',
        surfaceSecondary: `rgba(${rgb}, 0.04)`,
        surfaceHover: `rgba(${rgb}, 0.06)`,
        sidebarBg: '#ffffff',
        border: `rgba(${rgb}, 0.12)`,
        borderLight: `rgba(${rgb}, 0.07)`,
        textPrimary: '#1a1a2e',
        textSecondary: '#5a5a7a',
        textMuted: '#8a8aae',
        bodyGradient: `linear-gradient(135deg, ${palette.lightest} 0%, #ffffff 50%, ${palette.lightest} 100%)`,
    }
}

/* ─── Storage ─── */
const STORAGE_KEY = 'lvt-theme'

interface StoredTheme {
    mode: ThemeMode
    palette: PaletteId
}

function loadStored(): StoredTheme {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return JSON.parse(raw)
    } catch { /* noop */ }
    return { mode: 'system', palette: 'purple' }
}

function saveStored(s: StoredTheme) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

/* ─── Context ─── */
interface ThemeContextValue {
    mode: ThemeMode
    palette: PaletteId
    resolvedDark: boolean // actual dark or light after resolving 'system'
    setMode: (m: ThemeMode) => void
    setPalette: (p: PaletteId) => void
    paletteDef: PaletteDef
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
    return ctx
}

/* ─── Apply CSS Variables to :root ─── */
function applyTheme(dark: boolean, palette: PaletteDef) {
    const root = document.documentElement
    const surfaces = dark ? generateDarkSurfaces(palette) : generateLightSurfaces(palette)

    // Primary palette
    root.style.setProperty('--color-primary', palette.primary)
    root.style.setProperty('--color-primary-mid', palette.mid)
    root.style.setProperty('--color-primary-soft', dark ? palette.mid : palette.soft)

    if (dark) {
        // In dark mode: light tints become dark tints of the primary color
        const rgb = hexToRgb(palette.primary)
        root.style.setProperty('--color-primary-light', `rgba(${rgb}, 0.2)`)
        root.style.setProperty('--color-primary-lighter', `rgba(${rgb}, 0.12)`)
        root.style.setProperty('--color-primary-lightest', `rgba(${rgb}, 0.08)`)
    } else {
        root.style.setProperty('--color-primary-light', palette.light)
        root.style.setProperty('--color-primary-lighter', palette.lighter)
        root.style.setProperty('--color-primary-lightest', palette.lightest)
    }

    // Surfaces
    root.style.setProperty('--color-surface', surfaces.surface)
    root.style.setProperty('--color-surface-secondary', surfaces.surfaceSecondary)
    root.style.setProperty('--color-surface-hover', surfaces.surfaceHover)
    root.style.setProperty('--color-sidebar-bg', surfaces.sidebarBg)
    root.style.setProperty('--color-sidebar-active', `${palette.primary}1f`)
    root.style.setProperty('--color-border', surfaces.border)
    root.style.setProperty('--color-border-light', surfaces.borderLight)
    root.style.setProperty('--color-text-primary', surfaces.textPrimary)
    root.style.setProperty('--color-text-secondary', surfaces.textSecondary)
    root.style.setProperty('--color-text-muted', surfaces.textMuted)

    // Body background — use CSS variable to avoid specificity issues
    root.style.setProperty('--body-bg', surfaces.bodyGradient)

    // Dark class for components that need it
    if (dark) {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }

    // Scrollbar + glass-card shadows use primary color — update via CSS custom property
    root.style.setProperty('--theme-primary-rgb', hexToRgb(palette.primary))
}

function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
}

/* ─── Provider ─── */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>(() => loadStored().mode)
    const [palette, setPaletteState] = useState<PaletteId>(() => loadStored().palette)
    const [systemDark, setSystemDark] = useState(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
    )

    // Listen for system theme changes
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    const resolvedDark = mode === 'dark' || (mode === 'system' && systemDark)
    const paletteDef = PALETTES.find(p => p.id === palette) || PALETTES[0]

    // Apply theme whenever it changes
    useEffect(() => {
        console.log('[Theme] useEffect → resolvedDark:', resolvedDark, 'mode:', mode, 'systemDark:', systemDark)
        applyTheme(resolvedDark, paletteDef)
    }, [resolvedDark, paletteDef])

    const setMode = (m: ThemeMode) => {
        setModeState(m)
        saveStored({ mode: m, palette })
        // Force immediate apply (don't wait for useEffect)
        const newResolvedDark = m === 'dark' || (m === 'system' && systemDark)
        console.log('[Theme] setMode →', m, 'newResolvedDark:', newResolvedDark)
        applyTheme(newResolvedDark, paletteDef)
    }

    const setPalette = (p: PaletteId) => {
        setPaletteState(p)
        saveStored({ mode, palette: p })
    }

    return (
        <ThemeContext.Provider value={{ mode, palette, resolvedDark, setMode, setPalette, paletteDef }}>
            {children}
        </ThemeContext.Provider>
    )
}
