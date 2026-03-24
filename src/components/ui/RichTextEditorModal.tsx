import { useState, useRef, useCallback, useEffect } from 'react'
import { FiBold, FiItalic, FiUnderline, FiImage, FiX, FiCheck } from 'react-icons/fi'

interface Props {
    open: boolean
    initialValue: string
    onSave: (html: string) => void
    onClose: () => void
}

const FONTS = [
    { label: 'Mặc định', value: 'inherit' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Serif', value: 'Georgia, serif' },
    { label: 'Mono', value: 'monospace' },
]

const FONT_SIZES = [
    { label: '12', value: '12px' },
    { label: '14', value: '14px' },
    { label: '16', value: '16px' },
    { label: '18', value: '18px' },
    { label: '20', value: '20px' },
    { label: '24', value: '24px' },
    { label: '28', value: '28px' },
]

const LINE_HEIGHTS = [
    { label: '1.0', value: '1' },
    { label: '1.25', value: '1.25' },
    { label: '1.5', value: '1.5' },
    { label: '1.75', value: '1.75' },
    { label: '2.0', value: '2' },
]

export default function RichTextEditorModal({ open, initialValue, onSave, onClose }: Props) {
    const editorRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [font, setFont] = useState('inherit')
    const [fontSize, setFontSize] = useState('14px')
    const [lineHeight, setLineHeight] = useState('1.5')

    useEffect(() => {
        if (open && editorRef.current) {
            editorRef.current.innerHTML = initialValue || ''
            editorRef.current.focus()
        }
    }, [open, initialValue])

    const exec = useCallback((cmd: string, value?: string) => {
        document.execCommand(cmd, false, value)
        editorRef.current?.focus()
    }, [])

    const handleFontChange = (f: string) => {
        setFont(f)
        if (editorRef.current) editorRef.current.style.fontFamily = f
    }

    const handleFontSizeChange = (size: string) => {
        setFontSize(size)
        if (editorRef.current) editorRef.current.style.fontSize = size
    }

    const handleLineHeightChange = (lh: string) => {
        setLineHeight(lh)
        if (editorRef.current) editorRef.current.style.lineHeight = lh
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            if (reader.result && editorRef.current) {
                exec('insertImage', reader.result as string)
                // Make newly inserted images resizable
                setTimeout(() => {
                    editorRef.current?.querySelectorAll('img').forEach(img => {
                        img.style.cursor = 'pointer'
                        if (!img.style.maxWidth) img.style.maxWidth = '100%'
                    })
                }, 50)
            }
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    /* ─── Image resize logic ─── */
    const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null)
    const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

    const handleEditorClick = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'IMG') {
            setSelectedImg(target as HTMLImageElement)
        } else {
            setSelectedImg(null)
        }
    }, [])

    const onResizeStart = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!selectedImg) return
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startW: selectedImg.offsetWidth,
            startH: selectedImg.offsetHeight,
        }
        const onMove = (ev: PointerEvent) => {
            if (!resizeRef.current || !selectedImg) return
            const dx = ev.clientX - resizeRef.current.startX
            const newW = Math.max(50, resizeRef.current.startW + dx)
            const ratio = resizeRef.current.startH / resizeRef.current.startW
            selectedImg.style.width = `${newW}px`
            selectedImg.style.height = `${Math.round(newW * ratio)}px`
        }
        const onUp = () => {
            resizeRef.current = null
            document.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerup', onUp)
        }
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
    }, [selectedImg])

    const handleSave = () => {
        setSelectedImg(null)
        const html = editorRef.current?.innerHTML || ''
        onSave(html)
    }

    const backdropRef = useRef<HTMLDivElement>(null)
    const mouseDownOnBackdrop = useRef(false)

    if (!open) return null

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onMouseDown={e => { mouseDownOnBackdrop.current = e.target === backdropRef.current }}
            onMouseUp={e => { if (mouseDownOnBackdrop.current && e.target === backdropRef.current) onClose() }}
        >
            <div
                className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-6xl mx-4 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-secondary">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <span className="material-icons-round text-primary text-lg">description</span>
                        Mô tả công việc
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                        <FiX className="text-lg" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 px-4 py-2.5 border-b border-border/60 bg-surface">
                    {/* Text style buttons */}
                    <button
                        onMouseDown={e => { e.preventDefault(); exec('bold') }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/10 text-text-secondary hover:text-primary transition-all"
                        title="Bold"
                    >
                        <FiBold className="text-sm" />
                    </button>
                    <button
                        onMouseDown={e => { e.preventDefault(); exec('italic') }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/10 text-text-secondary hover:text-primary transition-all"
                        title="Italic"
                    >
                        <FiItalic className="text-sm" />
                    </button>
                    <button
                        onMouseDown={e => { e.preventDefault(); exec('underline') }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/10 text-text-secondary hover:text-primary transition-all"
                        title="Underline"
                    >
                        <FiUnderline className="text-sm" />
                    </button>

                    <div className="w-px h-6 bg-border/60 mx-1" />

                    {/* Font selector */}
                    <select
                        value={font}
                        onChange={e => handleFontChange(e.target.value)}
                        className="h-8 px-2 rounded-lg bg-surface border border-border text-xs text-text-primary outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
                    >
                        {FONTS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>

                    {/* Font size */}
                    <select
                        value={fontSize}
                        onChange={e => handleFontSizeChange(e.target.value)}
                        className="h-8 px-2 rounded-lg bg-surface border border-border text-xs text-text-primary outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
                        title="Cỡ chữ"
                    >
                        {FONT_SIZES.map(fs => (
                            <option key={fs.value} value={fs.value}>{fs.label}px</option>
                        ))}
                    </select>

                    <div className="w-px h-6 bg-border/60 mx-1" />

                    {/* Line height */}
                    <div className="flex items-center gap-1">
                        <span className="material-icons-round text-text-muted text-sm">format_line_spacing</span>
                        <select
                            value={lineHeight}
                            onChange={e => handleLineHeightChange(e.target.value)}
                            className="h-8 px-2 rounded-lg bg-surface border border-border text-xs text-text-primary outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
                        >
                            {LINE_HEIGHTS.map(lh => (
                                <option key={lh.value} value={lh.value}>{lh.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-px h-6 bg-border/60 mx-1" />

                    {/* Image upload */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary/10 text-text-secondary hover:text-primary transition-all"
                        title="Chèn hình ảnh"
                    >
                        <FiImage className="text-sm" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>

                {/* Editor area with image resize */}
                <div className="relative flex-1 min-h-0">
                    <div
                        ref={editorRef}
                        contentEditable
                        onClick={handleEditorClick}
                        onKeyDown={e => {
                            if (e.metaKey || e.ctrlKey) {
                                if (e.key === 'b') { e.preventDefault(); exec('bold') }
                                if (e.key === 'i') { e.preventDefault(); exec('italic') }
                                if (e.key === 'u') { e.preventDefault(); exec('underline') }
                            }
                        }}
                        className="h-full min-h-[420px] max-h-[70vh] overflow-y-auto px-5 py-4 text-sm text-text-primary outline-none focus:outline-none [&_img]:rounded-lg [&_img]:my-2 [&_img]:cursor-pointer"
                        style={{ fontFamily: font, fontSize, lineHeight }}
                        data-placeholder="Nhập mô tả công việc..."
                    />
                    {/* Resize handle on selected image */}
                    {selectedImg && (() => {
                        const editorEl = editorRef.current
                        if (!editorEl) return null
                        const eRect = editorEl.getBoundingClientRect()
                        const iRect = selectedImg.getBoundingClientRect()
                        const top = iRect.top - eRect.top + editorEl.scrollTop
                        const left = iRect.left - eRect.left + editorEl.scrollLeft
                        const w = iRect.width
                        const h = iRect.height
                        return (
                            <>
                                {/* Selection outline */}
                                <div
                                    className="absolute pointer-events-none border-2 border-primary rounded-lg"
                                    style={{ top, left, width: w, height: h }}
                                />
                                {/* Bottom-right resize handle */}
                                <div
                                    onPointerDown={onResizeStart}
                                    className="absolute w-4 h-4 bg-primary rounded-sm cursor-nwse-resize shadow-md border border-white z-10"
                                    style={{ top: top + h - 8, left: left + w - 8 }}
                                />
                            </>
                        )
                    })()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-border bg-surface-secondary">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-text-muted hover:text-text-primary hover:bg-surface transition-all"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-mid transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                    >
                        <FiCheck className="text-base" />
                        Lưu mô tả
                    </button>
                </div>
            </div>

            {/* Style for placeholder */}
            <style>{`
                [data-placeholder]:empty::before {
                    content: attr(data-placeholder);
                    color: var(--color-text-muted, #6b7280);
                    opacity: 0.5;
                    pointer-events: none;
                }
            `}</style>
        </div>
    )
}
