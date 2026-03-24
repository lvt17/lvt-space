import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import { checklistApi, aiApi, dailyTaskApi, taskApi, type ChecklistRow, type ChecklistItem, type DailyTaskRow, type TaskRow } from '@/services/api'
import { useDataCache } from '@/contexts/DataCacheContext'
import { FiPlus, FiMinus } from 'react-icons/fi'

import { MdMyLocation, MdToday, MdAssignment, MdDateRange, MdDescription } from 'react-icons/md'
import { useTheme } from '@/contexts/ThemeContext'

const CANVAS_SIZE = 50000
const CENTER_OFFSET = CANVAS_SIZE / 2

interface ColorScheme {
    name: string; bg: string; border: string; header: string; accent: string; text: string; ring: string
}
const COLORS_LIGHT: ColorScheme[] = [
    { name: 'purple', bg: 'bg-violet-50', border: 'border-violet-200', header: 'bg-violet-100', accent: 'bg-violet-500', text: 'text-violet-600', ring: 'ring-violet-300' },
    { name: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100', accent: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-300' },
    { name: 'green', bg: 'bg-emerald-50', border: 'border-emerald-200', header: 'bg-emerald-100', accent: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-300' },
    { name: 'orange', bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100', accent: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-300' },
    { name: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', header: 'bg-pink-100', accent: 'bg-pink-500', text: 'text-pink-600', ring: 'ring-pink-300' },
    { name: 'teal', bg: 'bg-teal-50', border: 'border-teal-200', header: 'bg-teal-100', accent: 'bg-teal-500', text: 'text-teal-600', ring: 'ring-teal-300' },
]
const COLORS_DARK: ColorScheme[] = [
    { name: 'purple', bg: 'bg-violet-950/60', border: 'border-violet-800', header: 'bg-violet-900/70', accent: 'bg-violet-500', text: 'text-violet-300', ring: 'ring-violet-700' },
    { name: 'blue', bg: 'bg-blue-950/60', border: 'border-blue-800', header: 'bg-blue-900/70', accent: 'bg-blue-500', text: 'text-blue-300', ring: 'ring-blue-700' },
    { name: 'green', bg: 'bg-emerald-950/60', border: 'border-emerald-800', header: 'bg-emerald-900/70', accent: 'bg-emerald-500', text: 'text-emerald-300', ring: 'ring-emerald-700' },
    { name: 'orange', bg: 'bg-amber-950/60', border: 'border-amber-800', header: 'bg-amber-900/70', accent: 'bg-amber-500', text: 'text-amber-300', ring: 'ring-amber-700' },
    { name: 'pink', bg: 'bg-pink-950/60', border: 'border-pink-800', header: 'bg-pink-900/70', accent: 'bg-pink-500', text: 'text-pink-300', ring: 'ring-pink-700' },
    { name: 'teal', bg: 'bg-teal-950/60', border: 'border-teal-800', header: 'bg-teal-900/70', accent: 'bg-teal-500', text: 'text-teal-300', ring: 'ring-teal-700' },
]

// Convenience alias — color names are the same in both lists
const COLORS = COLORS_LIGHT

function getColor(name: string, dark: boolean) {
    const colors = dark ? COLORS_DARK : COLORS_LIGHT
    return colors.find(c => c.name === name) || colors[0]
}

/* ─── Sticky Note Component ─── */
const StickyNote = memo(function StickyNote({ checklist, onUpdate, onDelete, dark }: {
    checklist: ChecklistRow
    onUpdate: (id: string, data: Partial<ChecklistRow>) => void
    onDelete: (id: string) => void
    dark: boolean
}) {
    const color = getColor(checklist.color, dark)
    const [localItems, setLocalItems] = useState<ChecklistItem[]>(checklist.items || [])
    const [newText, setNewText] = useState('')
    const [editingTitle, setEditingTitle] = useState(false)
    const [title, setTitle] = useState(checklist.title)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
    const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number; origX: number; origY: number; corner: string } | null>(null)
    const noteRef = useRef<HTMLDivElement>(null)
    const [localSize, setLocalSize] = useState<{ w: number; h: number } | null>(null)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Per-item description note state — persisted in localStorage
    const descStorageKey = `open_item_descs_${checklist.id}`
    const [openDescItems, setOpenDescItems] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(descStorageKey)
            if (saved) return new Set(JSON.parse(saved) as string[])
        } catch { /* ignore */ }
        return new Set()
    })
    const [descPositions, setDescPositions] = useState<Record<string, { x: number; y: number }>>({})
    const [localPos, setLocalPos] = useState({ x: checklist.pos_x + CENTER_OFFSET, y: checklist.pos_y + CENTER_OFFSET })

    // Sync localPos when server data changes
    useEffect(() => { setLocalPos({ x: checklist.pos_x + CENTER_OFFSET, y: checklist.pos_y + CENTER_OFFSET }) }, [checklist.pos_x, checklist.pos_y])

    const toggleItemDesc = useCallback((itemId: string) => {
        setOpenDescItems(prev => {
            const next = new Set(prev)
            if (next.has(itemId)) next.delete(itemId); else next.add(itemId)
            localStorage.setItem(descStorageKey, JSON.stringify([...next]))
            return next
        })
    }, [descStorageKey])

    const handleDescPosChange = useCallback((itemId: string, p: { x: number; y: number }) => {
        setDescPositions(prev => ({ ...prev, [itemId]: p }))
    }, [])

    const handleItemDescSave = useCallback((itemId: string, html: string) => {
        const newItems = localItems.map(i => i.id === itemId ? { ...i, description: html } : i)
        setLocalItems(newItems)
        onUpdate(checklist.id, { items: newItems })
    }, [localItems, checklist.id, onUpdate])

    // Sync from server when checklist.items changes externally
    useEffect(() => { setLocalItems(checklist.items || []) }, [checklist.items])
    useEffect(() => { setTitle(checklist.title) }, [checklist.title])

    const noteW = localSize?.w ?? checklist.width ?? 272
    const noteH = localSize?.h ?? checklist.height ?? undefined
    const BASE_W = 272
    const MIN_W = 200
    const MAX_W = 600
    const MIN_H = 120
    const fontScale = noteW / BASE_W

    const checked = localItems.filter(i => i.is_checked).length
    const total = localItems.length

    // Debounced save — local state updates instantly, API call after 500ms idle
    const debouncedSaveItems = useCallback((newItems: ChecklistItem[]) => {
        setLocalItems(newItems)
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
            onUpdate(checklist.id, { items: newItems })
        }, 500)
    }, [checklist.id, onUpdate])

    const toggleItem = (itemId: string) => {
        debouncedSaveItems(localItems.map(i => i.id === itemId ? { ...i, is_checked: !i.is_checked } : i))
    }

    const addItem = () => {
        if (!newText.trim()) return
        const newItem: ChecklistItem = {
            id: 'item-' + Date.now(),
            text: newText.trim(),
            is_checked: false,
            indent_level: 0,
        }
        debouncedSaveItems([...localItems, newItem])
        setNewText('')
    }

    const removeItem = (itemId: string) => {
        debouncedSaveItems(localItems.filter(i => i.id !== itemId))
    }

    const saveTitle = () => {
        setEditingTitle(false)
        if (title.trim() !== checklist.title) {
            onUpdate(checklist.id, { title: title.trim() || 'Untitled' })
        }
    }

    /* ─── Drag logic ─── */
    const EDGE_ZONE = 12 // px from border that counts as draggable

    const onDragStart = (e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: checklist.pos_x + CENTER_OFFSET,
            origY: checklist.pos_y + CENTER_OFFSET,
        }
        if (noteRef.current) noteRef.current.style.zIndex = '999'
        document.addEventListener('pointermove', onDragMove)
        document.addEventListener('pointerup', onDragEnd)
    }

    const onEdgeDrag = (e: React.PointerEvent) => {
        if (!noteRef.current) return
        const rect = noteRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const nearEdge = x < EDGE_ZONE || x > rect.width - EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE
        if (nearEdge) onDragStart(e)
    }

    const onDragMove = useCallback((e: PointerEvent) => {
        if (!dragRef.current || !noteRef.current) return
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        const newX = dragRef.current.origX + dx
        const newY = dragRef.current.origY + dy
        noteRef.current.style.left = `${newX}px`
        noteRef.current.style.top = `${newY}px`
        setLocalPos({ x: newX, y: newY })
    }, [])

    const onDragEnd = useCallback((e: PointerEvent) => {
        if (!dragRef.current) return
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        const newX = dragRef.current.origX + dx
        const newY = dragRef.current.origY + dy
        dragRef.current = null
        if (noteRef.current) noteRef.current.style.zIndex = ''
        document.removeEventListener('pointermove', onDragMove)
        document.removeEventListener('pointerup', onDragEnd)
        onUpdate(checklist.id, { pos_x: newX - CENTER_OFFSET, pos_y: newY - CENTER_OFFSET } as Partial<ChecklistRow>)
    }, [checklist.id, onUpdate, onDragMove])

    /* ─── Resize logic ─── */
    const onResizeStart = (corner: string) => (e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const el = noteRef.current
        if (!el) return
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origW: el.offsetWidth,
            origH: el.offsetHeight,
            origX: checklist.pos_x + CENTER_OFFSET,
            origY: checklist.pos_y + CENTER_OFFSET,
            corner,
        }
        if (noteRef.current) noteRef.current.style.zIndex = '999'
        document.addEventListener('pointermove', onResizeMove)
        document.addEventListener('pointerup', onResizeEnd)
    }

    const onResizeMove = useCallback((e: PointerEvent) => {
        if (!resizeRef.current || !noteRef.current) return
        const { startX, startY, origW, origH, corner } = resizeRef.current
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        let newW = origW
        let newH = origH
        if (corner.includes('r')) newW = Math.max(MIN_W, Math.min(MAX_W, origW + dx))
        if (corner.includes('l')) newW = Math.max(MIN_W, Math.min(MAX_W, origW - dx))
        if (corner.includes('b')) newH = Math.max(MIN_H, origH + dy)
        if (corner.includes('t')) newH = Math.max(MIN_H, origH - dy)
        setLocalSize({ w: newW, h: newH })
        // For top/left corners, adjust position
        if (corner.includes('l')) noteRef.current.style.left = `${resizeRef.current.origX + (origW - newW)}px`
        if (corner.includes('t')) noteRef.current.style.top = `${resizeRef.current.origY + (origH - newH)}px`
    }, [])

    const onResizeEnd = useCallback(() => {
        if (!resizeRef.current || !noteRef.current) return
        const el = noteRef.current
        const newX = parseFloat(el.style.left) || checklist.pos_x
        const newY = parseFloat(el.style.top) || checklist.pos_y
        const finalW = localSize?.w ?? el.offsetWidth
        const finalH = localSize?.h ?? el.offsetHeight
        resizeRef.current = null
        el.style.zIndex = ''
        document.removeEventListener('pointermove', onResizeMove)
        document.removeEventListener('pointerup', onResizeEnd)
        onUpdate(checklist.id, { width: finalW, height: finalH, pos_x: newX - CENTER_OFFSET, pos_y: newY - CENTER_OFFSET } as Partial<ChecklistRow>)
    }, [checklist.id, checklist.pos_x, checklist.pos_y, onUpdate, onResizeMove, localSize])

    const resizeHandleClass = 'absolute w-3 h-3 rounded-full opacity-0 z-10 cursor-pointer'

    const noteX = localPos.x
    const noteY = localPos.y

    return (
        <>
        <div
            ref={noteRef}
            data-sticky-note
            onPointerDown={onEdgeDrag}
            className={`absolute ${color.bg} ${color.border} border-2 rounded-xl shadow-lg select-none transition-shadow hover:shadow-xl group flex flex-col`}
            style={{ left: noteX, top: noteY, width: noteW, ...(noteH ? { height: noteH } : {}) }}
        >
            {/* Resize handles — 4 corners */}
            <div onPointerDown={onResizeStart('tl')} className={`${resizeHandleClass} ${color.border} -top-1.5 -left-1.5 cursor-nwse-resize`} />
            <div onPointerDown={onResizeStart('tr')} className={`${resizeHandleClass} ${color.border} -top-1.5 -right-1.5 cursor-nesw-resize`} />
            <div onPointerDown={onResizeStart('bl')} className={`${resizeHandleClass} ${color.border} -bottom-1.5 -left-1.5 cursor-nesw-resize`} />
            <div onPointerDown={onResizeStart('br')} className={`${resizeHandleClass} ${color.border} -bottom-1.5 -right-1.5 cursor-nwse-resize`} />

            {/* Zoomed inner content */}
            <div className="flex flex-col flex-1 min-h-0 origin-top-left" style={{ zoom: fontScale }}>
                {/* Header = drag handle */}
                <div onPointerDown={onDragStart} className={`${color.header} rounded-t-[0.625rem] px-3 py-2 flex items-center gap-2 cursor-grab active:cursor-grabbing`}>
                    {/* Color dot */}
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`w-3.5 h-3.5 rounded-full ${color.accent} shrink-0 hover:ring-2 ${color.ring} transition-all`}
                    />

                    {/* Title */}
                    {editingTitle ? (
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={e => e.key === 'Enter' && saveTitle()}
                            autoFocus
                            className="flex-1 text-sm font-bold bg-transparent outline-none text-text-primary min-w-0"
                        />
                    ) : (
                        <h3
                            className="flex-1 text-sm font-bold text-text-primary truncate cursor-text"
                            onDoubleClick={() => setEditingTitle(true)}
                        >
                            {checklist.title}
                        </h3>
                    )}

                    {/* Progress badge */}
                    {total > 0 && (
                        <span className={`text-[0.6rem] font-bold ${color.text} shrink-0`}>
                            {checked}/{total}
                        </span>
                    )}

                    {/* Pin = drag handle + double-click to delete */}
                    <button
                        onPointerDown={onDragStart}
                        onDoubleClick={(e) => { e.stopPropagation(); onDelete(checklist.id) }}
                        className="group/pin w-10 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 transition-all"
                        title="Kéo để di chuyển • Nhấn 2 lần để xóa"
                    >
                        <img src="/pin-normal.png" alt="pin" className="w-full h-full object-contain block group-active/pin:hidden transition-transform duration-200 scale-90 group-hover/pin:scale-100 group-hover/pin:translate-x-[4px] group-hover/pin:translate-y-[-4px]" />
                        <img src="/pin-active.png" alt="pin" className="w-full h-full object-contain hidden group-active/pin:block group-active/pin:translate-x-[25px] group-active/pin:translate-y-[-18px] transition-transform duration-150" style={{ filter: 'drop-shadow(3px 6px 4px rgba(0,0,0,0.4))' }} />
                    </button>
                </div>

                {/* Color picker dropdown */}
                {showColorPicker && (
                    <div className="px-3 py-2 flex gap-1.5 border-b border-border/30">
                        {(dark ? COLORS_DARK : COLORS_LIGHT).map(c => (
                            <button
                                key={c.name}
                                onClick={() => { onUpdate(checklist.id, { color: c.name }); setShowColorPicker(false) }}
                                className={`w-5 h-5 rounded-full ${c.accent} transition-all ${checklist.color === c.name ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                            />
                        ))}
                    </div>
                )}

                {/* Checklist items */}
                <div className="px-3 py-2 space-y-0.5 overflow-y-auto flex-1" style={{ maxHeight: noteH ? undefined : '20rem' }}>
                    {localItems.map((item, idx) => (
                        <div
                            key={item.id}
                            className="flex items-start gap-1.5 group py-0.5"
                            style={{ paddingLeft: `${item.indent_level * 0.75}rem` }}
                        >
                            <button
                                onClick={() => toggleItem(item.id)}
                                className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${item.is_checked ? color.accent + ' border-transparent' : 'border-gray-300 hover:border-gray-400'}`}
                            >
                                {item.is_checked && <span className="material-icons-round text-[0.5rem] text-white">check</span>}
                            </button>
                            <span className={`text-xs leading-snug flex-1 ${item.is_checked ? 'line-through text-text-muted/60' : 'text-text-primary'}`}>
                                {item.text}
                            </span>
                            <button
                                onClick={() => toggleItemDesc(item.id)}
                                className={`opacity-0 group-hover:opacity-100 shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all ${openDescItems.has(item.id) ? 'opacity-100 ' + color.text : 'text-text-muted/40 hover:text-text-primary'}`}
                                title="Mô tả"
                            >
                                <MdDescription className="text-[0.6rem]" />
                            </button>
                            <button
                                onClick={() => removeItem(item.id)}
                                className="opacity-0 group-hover:opacity-100 text-text-muted/40 hover:text-red-500 transition-all shrink-0"
                            >
                                <span className="material-icons-round text-xs">close</span>
                            </button>
                        </div>
                    ))}

                    {/* Add new item inline */}
                    <div className="flex items-center gap-1.5 pt-1">
                        <span className="material-icons-round text-text-muted/40 text-sm">add</span>
                        <input
                            value={newText}
                            onChange={e => setNewText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addItem()}
                            placeholder="Thêm mục..."
                            className="flex-1 text-xs outline-none bg-transparent placeholder:text-text-muted/40 text-text-primary py-0.5"
                        />
                    </div>
                </div>

                {/* Progress bar at bottom */}
                {total > 0 && (
                    <div className="px-3 pb-2">
                        <div className="w-full bg-white/60 h-1 rounded-full overflow-hidden">
                            <div className={`${color.accent} h-full rounded-full transition-all duration-300`} style={{ width: `${Math.round((checked / total) * 100)}%` }} />
                        </div>
                    </div>
                )}
            </div>{/* end zoomed inner content */}
        </div>

        {/* SVG connecting lines to per-item description notes */}
        {localItems.filter(i => openDescItems.has(i.id)).map((item, idx) => {
            const dp = descPositions[item.id]
            if (!dp) return null
            return (
                <svg key={`line-${item.id}`} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, width: '100%', height: '100%' }}>
                    <line
                        x1={noteX + noteW}
                        y1={noteY + 50 + idx * 22}
                        x2={dp.x + 200}
                        y2={dp.y + 18}
                        stroke={dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}
                        strokeWidth={1.5}
                        strokeDasharray="6 4"
                    />
                </svg>
            )
        })}

        {/* Per-item Description Notes */}
        {localItems.filter(i => openDescItems.has(i.id)).map((item, idx) => (
            <DescNote
                key={`desc-item-${item.id}`}
                id={item.id}
                name={item.text}
                description={item.description ?? null}
                onSave={handleItemDescSave}
                onClose={() => toggleItemDesc(item.id)}
                sourcePos={{ x: noteX + noteW + 20, y: noteY + idx * 60 }}
                colorIndex={(item.id.charCodeAt(item.id.length - 1) + idx) % COLORS_LIGHT.length}
                onPosChange={handleDescPosChange}
            />
        ))}
        </>
    )
})

/* ─── Text Note Component (Rich Text) ─── */
const FONTS_LIST = [
    { label: 'Mặc định', value: 'inherit' },
    { label: 'Inter', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Serif', value: 'Georgia, serif' },
    { label: 'Mono', value: 'monospace' },
]

const TextNote = memo(function TextNote({ checklist, onUpdate, onDelete, dark }: {
    checklist: ChecklistRow
    onUpdate: (id: string, data: Partial<ChecklistRow>) => void
    onDelete: (id: string) => void
    dark: boolean
}) {
    const color = getColor(checklist.color, dark)
    const [editingTitle, setEditingTitle] = useState(false)
    const [title, setTitle] = useState(checklist.title)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [focused, setFocused] = useState(false)
    const editorRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
    const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number; origX: number; origY: number; corner: string } | null>(null)
    const noteRef = useRef<HTMLDivElement>(null)
    const [localSize, setLocalSize] = useState<{ w: number; h: number } | null>(null)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => { setTitle(checklist.title) }, [checklist.title])

    // Init editor content from checklist
    const initializedRef = useRef(false)
    useEffect(() => {
        if (editorRef.current && !initializedRef.current) {
            editorRef.current.innerHTML = checklist.content || ''
            initializedRef.current = true
        }
    }, [checklist.content])

    const noteW = localSize?.w ?? checklist.width ?? 272
    const noteH = localSize?.h ?? checklist.height ?? undefined
    const MIN_W = 200
    const MAX_W = 600
    const MIN_H = 120

    const debouncedSaveContent = useCallback(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
            if (editorRef.current) {
                onUpdate(checklist.id, { content: editorRef.current.innerHTML })
            }
        }, 500)
    }, [checklist.id, onUpdate])

    const saveTitle = () => {
        setEditingTitle(false)
        if (title.trim() !== checklist.title) {
            onUpdate(checklist.id, { title: title.trim() || 'Untitled' })
        }
    }

    const exec = useCallback((cmd: string, value?: string) => {
        document.execCommand(cmd, false, value)
        editorRef.current?.focus()
        debouncedSaveContent()
    }, [debouncedSaveContent])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec('bold') }
        if (e.key === 'i' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec('italic') }
        if (e.key === 'u' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec('underline') }
    }

    const handleImageUpload = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => {
                exec('insertImage', reader.result as string)
            }
            reader.readAsDataURL(file)
        }
        input.click()
    }

    /* ─── Drag logic ─── */
    const EDGE_ZONE = 12
    const onDragStart = (e: React.PointerEvent) => {
        e.preventDefault(); e.stopPropagation()
        dragRef.current = { startX: e.clientX, startY: e.clientY, origX: parseInt(noteRef.current!.style.left), origY: parseInt(noteRef.current!.style.top) }
        if (noteRef.current) noteRef.current.style.zIndex = '999'
        const onMove = (ev: PointerEvent) => {
            if (!dragRef.current || !noteRef.current) return
            noteRef.current.style.left = `${dragRef.current.origX + (ev.clientX - dragRef.current.startX)}px`
            noteRef.current.style.top = `${dragRef.current.origY + (ev.clientY - dragRef.current.startY)}px`
        }
        const onUp = (ev: PointerEvent) => {
            if (!dragRef.current) return
            const newX = dragRef.current.origX + (ev.clientX - dragRef.current.startX)
            const newY = dragRef.current.origY + (ev.clientY - dragRef.current.startY)
            dragRef.current = null
            if (noteRef.current) noteRef.current.style.zIndex = ''
            document.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerup', onUp)
            onUpdate(checklist.id, { pos_x: newX - CENTER_OFFSET, pos_y: newY - CENTER_OFFSET })
        }
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
    }

    const onEdgeDrag = (e: React.PointerEvent) => {
        if (!noteRef.current) return
        const rect = noteRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const nearEdge = x < EDGE_ZONE || x > rect.width - EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE
        if (nearEdge) onDragStart(e)
    }

    /* ─── Resize ─── */
    const resizeHandleClass = 'absolute w-4 h-4 border-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10'
    const onResizeStart = (corner: string) => (e: React.PointerEvent) => {
        e.stopPropagation(); e.preventDefault()
        const rect = noteRef.current!.getBoundingClientRect()
        resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: noteW, origH: rect.height, origX: parseInt(noteRef.current!.style.left), origY: parseInt(noteRef.current!.style.top), corner }
        const onMove = (ev: PointerEvent) => {
            if (!resizeRef.current) return
            const dx = ev.clientX - resizeRef.current.startX
            const dy = ev.clientY - resizeRef.current.startY
            let newW = resizeRef.current.origW
            let newH = resizeRef.current.origH
            if (corner.includes('r')) newW = Math.min(MAX_W, Math.max(MIN_W, resizeRef.current.origW + dx))
            if (corner.includes('l')) newW = Math.min(MAX_W, Math.max(MIN_W, resizeRef.current.origW - dx))
            if (corner.includes('b')) newH = Math.max(MIN_H, resizeRef.current.origH + dy)
            if (corner.includes('t')) newH = Math.max(MIN_H, resizeRef.current.origH - dy)
            setLocalSize({ w: newW, h: newH })
        }
        const onUp = () => {
            if (!resizeRef.current) return
            const sz = localSize ?? { w: noteW, h: noteRef.current?.getBoundingClientRect().height ?? 200 }
            resizeRef.current = null
            document.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerup', onUp)
            onUpdate(checklist.id, { width: sz.w, height: sz.h })
        }
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
    }

    const handleFocus = () => setFocused(true)
    const handleBlur = (e: React.FocusEvent) => {
        // Don't blur if clicking toolbar
        const related = e.relatedTarget as HTMLElement | null
        if (related && (related.closest('.text-note-toolbar') || related.closest('[data-text-note-toolbar]'))) return
        setFocused(false)
        debouncedSaveContent()
    }

    return (
        <div
            ref={noteRef}
            data-sticky-note
            onPointerDown={onEdgeDrag}
            className={`absolute ${color.bg} ${color.border} border-2 rounded-xl shadow-lg select-none transition-shadow hover:shadow-xl group flex flex-col`}
            style={{ left: checklist.pos_x + CENTER_OFFSET, top: checklist.pos_y + CENTER_OFFSET, width: noteW, ...(noteH ? { height: noteH } : {}) }}
        >
            {/* Resize handles */}
            <div onPointerDown={onResizeStart('tl')} className={`${resizeHandleClass} ${color.border} -top-1.5 -left-1.5 cursor-nwse-resize`} />
            <div onPointerDown={onResizeStart('tr')} className={`${resizeHandleClass} ${color.border} -top-1.5 -right-1.5 cursor-nesw-resize`} />
            <div onPointerDown={onResizeStart('bl')} className={`${resizeHandleClass} ${color.border} -bottom-1.5 -left-1.5 cursor-nesw-resize`} />
            <div onPointerDown={onResizeStart('br')} className={`${resizeHandleClass} ${color.border} -bottom-1.5 -right-1.5 cursor-nwse-resize`} />

            {/* Header = drag handle */}
            <div onPointerDown={onDragStart} className={`${color.header} rounded-t-[0.625rem] px-3 py-2 flex items-center gap-2 cursor-grab active:cursor-grabbing`}>
                {/* Color dot */}
                <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={`w-3.5 h-3.5 rounded-full ${color.accent} shrink-0 hover:ring-2 ${color.ring} transition-all`}
                />
                {/* Title */}
                {editingTitle ? (
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={saveTitle}
                        onKeyDown={e => e.key === 'Enter' && saveTitle()}
                        autoFocus
                        className="flex-1 text-sm font-bold bg-transparent outline-none text-text-primary min-w-0"
                    />
                ) : (
                    <h3
                        className="flex-1 text-sm font-bold text-text-primary truncate cursor-text"
                        onDoubleClick={() => setEditingTitle(true)}
                    >
                        {checklist.title}
                    </h3>
                )}
                <span className={`text-[0.55rem] font-semibold ${color.text} bg-white/30 px-1.5 py-0.5 rounded`}>TEXT</span>
                {/* Pin */}
                <button
                    onPointerDown={onDragStart}
                    onDoubleClick={(e) => { e.stopPropagation(); onDelete(checklist.id) }}
                    className="group/pin w-10 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 transition-all"
                    title="Kéo để di chuyển • Nhấn 2 lần để xóa"
                >
                    <img src="/pin-normal.png" alt="pin" className="w-full h-full object-contain block group-active/pin:hidden transition-transform duration-200 scale-90 group-hover/pin:scale-100 group-hover/pin:translate-x-[4px] group-hover/pin:translate-y-[-4px]" />
                    <img src="/pin-active.png" alt="pin" className="w-full h-full object-contain hidden group-active/pin:block group-active/pin:translate-x-[25px] group-active/pin:translate-y-[-18px] transition-transform duration-150" style={{ filter: 'drop-shadow(3px 6px 4px rgba(0,0,0,0.4))' }} />
                </button>
            </div>

            {/* Color picker dropdown */}
            {showColorPicker && (
                <div className="px-3 py-2 flex gap-1.5 border-b border-border/30">
                    {(dark ? COLORS_DARK : COLORS_LIGHT).map(c => (
                        <button
                            key={c.name}
                            onClick={() => { onUpdate(checklist.id, { color: c.name }); setShowColorPicker(false) }}
                            className={`w-5 h-5 rounded-full ${c.accent} transition-all ${checklist.color === c.name ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                        />
                    ))}
                </div>
            )}

            {/* ContentEditable area */}
            <div className="flex-1 min-h-0 relative">
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={debouncedSaveContent}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="px-3 py-2 text-xs text-text-primary outline-none overflow-y-auto prose prose-sm max-w-none"
                    style={{ minHeight: '4rem', maxHeight: noteH ? undefined : '18rem', lineHeight: '1.5' }}
                    data-placeholder="Nhập nội dung..."
                />
            </div>

            {/* Floating Toolbar — appears on focus, positioned below note */}
            {focused && (
                <div
                    data-text-note-toolbar
                    className="text-note-toolbar absolute -bottom-12 left-0 z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg shadow-xl border border-border bg-surface/95 backdrop-blur-sm"
                    onMouseDown={e => e.preventDefault()}
                >
                    <button onClick={() => exec('bold')} className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/10 text-text-primary" title="Bold (Ctrl+B)">
                        <span className="text-xs font-bold">B</span>
                    </button>
                    <button onClick={() => exec('italic')} className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/10 text-text-primary" title="Italic (Ctrl+I)">
                        <span className="text-xs italic">I</span>
                    </button>
                    <button onClick={() => exec('underline')} className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/10 text-text-primary" title="Underline (Ctrl+U)">
                        <span className="text-xs underline">U</span>
                    </button>
                    <div className="w-px h-5 bg-border mx-0.5" />
                    <select
                        onChange={e => { if (editorRef.current) editorRef.current.style.fontFamily = e.target.value }}
                        className="text-[0.6rem] bg-transparent border border-border rounded px-1 py-0.5 text-text-primary outline-none"
                        onMouseDown={e => e.stopPropagation()}
                    >
                        {FONTS_LIST.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <div className="w-px h-5 bg-border mx-0.5" />
                    <button onClick={handleImageUpload} className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/10 text-text-primary" title="Thêm hình ảnh">
                        <span className="material-icons-round text-xs">image</span>
                    </button>
                </div>
            )}
        </div>
    )
})


/* ─── Daily Tasks Fixed Container (Red Pastel, Premium) ─── */
const DailyTasksNote = memo(function DailyTasksNote({ tasks, todayStr, onToggle }: { tasks: DailyTaskRow[]; todayStr: string; onToggle: (id: string) => void }) {
    const checked = tasks.filter(t => t.is_completed).length
    const total = tasks.length
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0
    const dayLabel = new Date(todayStr + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

    /* Drag logic (same as StickyNote, but no delete) */
    const noteRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
    const [pos, setPos] = useState(() => {
        try {
            const saved = localStorage.getItem('daily_note_pos')
            if (saved) {
                const p = JSON.parse(saved)
                return { x: p.x + CENTER_OFFSET, y: p.y + CENTER_OFFSET }
            }
        } catch { /* fallback */ }
        return { x: 100 + CENTER_OFFSET, y: 100 + CENTER_OFFSET }
    })

    const savePosToStorage = useCallback((x: number, y: number) => {
        localStorage.setItem('daily_note_pos', JSON.stringify({ x: x - CENTER_OFFSET, y: y - CENTER_OFFSET }))
    }, [])

    const onDragStart = (e: React.PointerEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
        if (noteRef.current) noteRef.current.style.zIndex = '999'
        document.addEventListener('pointermove', onDragMove)
        document.addEventListener('pointerup', onDragEnd)
    }

    const onDragMove = useCallback((e: PointerEvent) => {
        if (!dragRef.current || !noteRef.current) return
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        noteRef.current.style.left = `${dragRef.current.origX + dx}px`
        noteRef.current.style.top = `${dragRef.current.origY + dy}px`
    }, [])

    const onDragEnd = useCallback((e: PointerEvent) => {
        if (!dragRef.current) return
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        const newX = dragRef.current.origX + dx
        const newY = dragRef.current.origY + dy
        dragRef.current = null
        if (noteRef.current) noteRef.current.style.zIndex = ''
        document.removeEventListener('pointermove', onDragMove)
        document.removeEventListener('pointerup', onDragEnd)
        setPos({ x: newX, y: newY })
        savePosToStorage(newX, newY)
    }, [onDragMove, savePosToStorage])

    const EDGE_ZONE = 12
    const onEdgeDrag = (e: React.PointerEvent) => {
        if (!noteRef.current) return
        const rect = noteRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const nearEdge = x < EDGE_ZONE || x > rect.width - EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE
        if (nearEdge) onDragStart(e)
    }

    return (
        <div
            ref={noteRef}
            data-sticky-note
            onPointerDown={onEdgeDrag}
            className="absolute rounded-2xl shadow-lg select-none transition-shadow hover:shadow-xl group"
            style={{
                left: pos.x,
                top: pos.y,
                width: 280,
                background: 'linear-gradient(135deg, #FFF5F5 0%, #FEF2F2 40%, #FFF1F2 100%)',
                border: '2px solid #FECDD3',
                boxShadow: '0 4px 24px rgba(244, 63, 94, 0.08), 0 0 0 1px rgba(251, 113, 133, 0.1)',
            }}
        >
            {/* Premium header = drag handle */}
            <div
                onPointerDown={onDragStart}
                className="rounded-t-[0.875rem] px-3.5 py-2.5 flex items-center gap-2 cursor-grab active:cursor-grabbing"
                style={{ background: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)' }}
            >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FB7185, #F43F5E)' }}>
                    <MdToday className="text-white text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-rose-900 truncate">Deadline hôm nay</h3>
                    <p className="text-[0.6rem] text-rose-500 capitalize font-medium">{dayLabel}</p>
                </div>
                {total > 0 && (
                    <div className="text-center shrink-0">
                        <span className="text-base font-black text-rose-600">{pct}%</span>
                    </div>
                )}
                {/* Pin for drag (no double-click delete) */}
                <button
                    onPointerDown={onDragStart}
                    className="group/pin w-10 h-10 flex items-center justify-center transition-all ml-0.5 cursor-grab active:cursor-grabbing"
                    title="Kéo để di chuyển"
                >
                    <img src="/pin-normal.png" alt="pin" className="w-full h-full object-contain block group-active/pin:hidden transition-transform duration-200 scale-90 group-hover/pin:scale-100 group-hover/pin:translate-x-[4px] group-hover/pin:translate-y-[-4px]" />
                    <img src="/pin-active.png" alt="pin" className="w-full h-full object-contain hidden group-active/pin:block group-active/pin:translate-x-[25px] group-active/pin:translate-y-[-18px] transition-transform duration-150" style={{ filter: 'drop-shadow(3px 6px 4px rgba(0,0,0,0.4))' }} />
                </button>
            </div>

            {/* Task items */}
            <div className="px-3.5 py-2 space-y-1 max-h-[22rem] overflow-y-auto">
                {tasks.length === 0 ? (
                    <div className="text-center py-4">
                        <span className="text-2xl block mb-1">🎉</span>
                        <p className="text-xs text-rose-400 font-medium">Không có deadline hôm nay</p>
                        <p className="text-[0.6rem] text-rose-300 mt-0.5">Hãy tận hưởng ngày nghỉ!</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div
                            key={task.id}
                            className={`flex items-start gap-2 py-1.5 px-2 rounded-lg transition-all ${task.is_completed ? 'bg-white/40' : 'bg-white/70 hover:bg-white/90'}`}
                        >
                            <button
                                onClick={() => onToggle(task.id)}
                                className={`w-[1.1rem] h-[1.1rem] mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${task.is_completed ? 'bg-gradient-to-br from-rose-400 to-rose-500 border-transparent shadow-sm' : 'border-rose-300 hover:border-rose-400 hover:bg-rose-50'}`}
                            >
                                {task.is_completed && <span className="material-icons-round text-[0.55rem] text-white">check</span>}
                            </button>
                            <div className="flex-1 min-w-0">
                                <span className={`text-xs leading-snug font-medium ${task.is_completed ? 'line-through text-rose-300' : 'text-rose-900'}`}>
                                    {task.title}
                                </span>
                                {task.time && (
                                    <span className="text-[0.55rem] text-rose-400 ml-1.5 bg-rose-50 px-1 py-0.5 rounded">⏰ {task.time}</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Gradient progress bar */}
            {total > 0 && (
                <div className="px-3.5 pb-2.5 pt-1">
                    <div className="w-full bg-rose-100 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${pct}%`,
                                background: 'linear-gradient(90deg, #FB7185, #F43F5E, #E11D48)',
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
})

/* ─── Shared draggable note hook ─── */
function useDraggableNote(storageKey: string, defaultX: number, defaultY: number, onMove?: (p: { x: number; y: number }) => void) {
    const noteRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
    const [pos, setPos] = useState(() => {
        // Initialize from localStorage synchronously to prevent position jump
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) {
                const p = JSON.parse(saved)
                return { x: p.x + CENTER_OFFSET, y: p.y + CENTER_OFFSET }
            }
        } catch { /* fallback */ }
        return { x: defaultX + CENTER_OFFSET, y: defaultY + CENTER_OFFSET }
    })
    const EDGE_ZONE = 12
    const onMoveRef = useRef(onMove)
    onMoveRef.current = onMove

    const savePosToStorage = useCallback((x: number, y: number) => {
        localStorage.setItem(storageKey, JSON.stringify({ x: x - CENTER_OFFSET, y: y - CENTER_OFFSET }))
    }, [storageKey])

    const onDragMove = useCallback((e: PointerEvent) => {
        if (!dragRef.current || !noteRef.current) return
        const newX = dragRef.current.origX + (e.clientX - dragRef.current.startX)
        const newY = dragRef.current.origY + (e.clientY - dragRef.current.startY)
        noteRef.current.style.left = `${newX}px`
        noteRef.current.style.top = `${newY}px`
        // Update React state in real-time for SVG line tracking
        setPos({ x: newX, y: newY })
        onMoveRef.current?.({ x: newX, y: newY })
    }, [])

    const onDragEnd = useCallback((e: PointerEvent) => {
        if (!dragRef.current) return
        const newX = dragRef.current.origX + (e.clientX - dragRef.current.startX)
        const newY = dragRef.current.origY + (e.clientY - dragRef.current.startY)
        dragRef.current = null
        if (noteRef.current) noteRef.current.style.zIndex = ''
        document.removeEventListener('pointermove', onDragMove)
        document.removeEventListener('pointerup', onDragEnd)
        setPos({ x: newX, y: newY })
        savePosToStorage(newX, newY)
    }, [onDragMove, savePosToStorage])

    const onDragStart = useCallback((e: React.PointerEvent) => {
        e.preventDefault(); e.stopPropagation()
        dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
        if (noteRef.current) noteRef.current.style.zIndex = '999'
        document.addEventListener('pointermove', onDragMove)
        document.addEventListener('pointerup', onDragEnd)
    }, [pos, onDragMove, onDragEnd])

    const onEdgeDrag = useCallback((e: React.PointerEvent) => {
        if (!noteRef.current) return
        const rect = noteRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const nearEdge = x < EDGE_ZONE || x > rect.width - EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE
        if (nearEdge) onDragStart(e)
    }, [onDragStart])

    return { noteRef, pos, onDragStart, onEdgeDrag }
}
/* ─── Generic Description Note (reusable for Task & Checklist) ─── */
const DescNote = memo(function DescNote({ id, name, description, onSave, onClose, sourcePos, colorIndex, onPosChange }: {
    id: string
    name: string
    description: string | null
    onSave: (id: string, html: string) => void
    onClose: () => void
    sourcePos: { x: number; y: number }
    colorIndex: number
    onPosChange: (id: string, p: { x: number; y: number }) => void
}) {
    const { resolvedDark: dark } = useTheme()
    const colors = dark ? COLORS_DARK : COLORS_LIGHT
    const color = colors[colorIndex % colors.length]

    const noteRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<HTMLDivElement>(null)
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
    const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number; corner: string } | null>(null)
    const initializedRef = useRef(false)
    const [focused, setFocused] = useState(false)
    const [localSize, setLocalSize] = useState<{ w: number; h: number } | null>(() => {
        try {
            const saved = localStorage.getItem(`desc_note_size_${id}`)
            if (saved) return JSON.parse(saved)
        } catch { /* ignore */ }
        return null
    })
    const storageKey = `desc_note_pos_${id}`
    const [pos, setPos] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) return JSON.parse(saved) as { x: number; y: number }
        } catch { /* ignore */ }
        // Also check legacy key for task desc notes
        try {
            const legacy = localStorage.getItem(`task_desc_pos_${id}`)
            if (legacy) return JSON.parse(legacy) as { x: number; y: number }
        } catch { /* ignore */ }
        return { x: sourcePos.x + 320, y: sourcePos.y }
    })

    // Report initial position on mount
    useEffect(() => { onPosChange(id, pos) }, []) // eslint-disable-line

    const noteW = localSize?.w ?? 400
    const noteH = localSize?.h ?? undefined
    const MIN_W = 200; const MAX_W = 600; const MIN_H = 120

    useEffect(() => {
        if (editorRef.current && !initializedRef.current) {
            editorRef.current.innerHTML = description || ''
            initializedRef.current = true
        }
    }, [description])

    const debouncedSave = useCallback(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => {
            if (editorRef.current) {
                onSave(id, editorRef.current.innerHTML)
            }
        }, 500)
    }, [id, onSave])

    const exec = useCallback((cmd: string, value?: string) => {
        document.execCommand(cmd, false, value)
        editorRef.current?.focus()
        debouncedSave()
    }, [debouncedSave])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec('bold') }
        if (e.key === 'i' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec('italic') }
        if (e.key === 'u' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exec('underline') }
    }

    const handleImageUpload = () => {
        const input = document.createElement('input')
        input.type = 'file'; input.accept = 'image/*'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => exec('insertImage', reader.result as string)
            reader.readAsDataURL(file)
        }
        input.click()
    }

    /* Drag — reports position in real-time */
    const EDGE_ZONE = 12
    const onDragStart = (e: React.PointerEvent) => {
        e.preventDefault(); e.stopPropagation()
        const el = noteRef.current!
        dragRef.current = { startX: e.clientX, startY: e.clientY, origX: parseInt(el.style.left), origY: parseInt(el.style.top) }
        el.style.zIndex = '999'
        const onMove = (ev: PointerEvent) => {
            if (!dragRef.current || !noteRef.current) return
            const newX = dragRef.current.origX + (ev.clientX - dragRef.current.startX)
            const newY = dragRef.current.origY + (ev.clientY - dragRef.current.startY)
            noteRef.current.style.left = `${newX}px`
            noteRef.current.style.top = `${newY}px`
            onPosChange(id, { x: newX, y: newY })
        }
        const onUp = (ev: PointerEvent) => {
            if (!dragRef.current) return
            const newX = dragRef.current.origX + (ev.clientX - dragRef.current.startX)
            const newY = dragRef.current.origY + (ev.clientY - dragRef.current.startY)
            dragRef.current = null
            if (noteRef.current) noteRef.current.style.zIndex = ''
            document.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerup', onUp)
            setPos({ x: newX, y: newY })
            localStorage.setItem(storageKey, JSON.stringify({ x: newX, y: newY }))
            onPosChange(id, { x: newX, y: newY })
        }
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
    }

    const onEdgeDrag = (e: React.PointerEvent) => {
        if (!noteRef.current) return
        const rect = noteRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left; const y = e.clientY - rect.top
        if (x < EDGE_ZONE || x > rect.width - EDGE_ZONE || y < EDGE_ZONE || y > rect.height - EDGE_ZONE) onDragStart(e)
    }

    /* Resize — invisible handles, cursor changes on hover */
    const onResizeStart = (corner: string) => (e: React.PointerEvent) => {
        e.stopPropagation(); e.preventDefault()
        const rect = noteRef.current!.getBoundingClientRect()
        resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: noteW, origH: rect.height, corner }
        const onMove = (ev: PointerEvent) => {
            if (!resizeRef.current) return
            const dx = ev.clientX - resizeRef.current.startX
            const dy = ev.clientY - resizeRef.current.startY
            let newW = resizeRef.current.origW; let newH = resizeRef.current.origH
            if (corner.includes('r')) newW = Math.min(MAX_W, Math.max(MIN_W, resizeRef.current.origW + dx))
            if (corner.includes('l')) newW = Math.min(MAX_W, Math.max(MIN_W, resizeRef.current.origW - dx))
            if (corner.includes('b')) newH = Math.max(MIN_H, resizeRef.current.origH + dy)
            if (corner.includes('t')) newH = Math.max(MIN_H, resizeRef.current.origH - dy)
            setLocalSize({ w: newW, h: newH })
        }
        const onUp = () => {
            const sz = localSize ?? { w: noteW, h: noteRef.current?.getBoundingClientRect().height ?? 200 }
            resizeRef.current = null
            document.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerup', onUp)
            localStorage.setItem(`desc_note_size_${id}`, JSON.stringify(sz))
        }
        document.addEventListener('pointermove', onMove)
        document.addEventListener('pointerup', onUp)
    }

    const handleFocus = () => setFocused(true)
    const handleBlur = (e: React.FocusEvent) => {
        const related = e.relatedTarget as HTMLElement | null
        if (related && (related.closest('.text-note-toolbar') || related.closest('[data-text-note-toolbar]'))) return
        setFocused(false)
        debouncedSave()
    }

    return (
        <div
            ref={noteRef}
            data-sticky-note
            onPointerDown={onEdgeDrag}
            className={`absolute ${color.bg} ${color.border} border-2 rounded-xl shadow-lg select-none transition-shadow hover:shadow-xl group flex flex-col overflow-hidden`}
            style={{
                left: pos.x, top: pos.y, width: noteW, ...(noteH ? { height: noteH } : {}),
                zIndex: 2,
            }}
        >
            {/* Invisible resize handles — no dots, just cursor zones */}
            <div onPointerDown={onResizeStart('tl')} className="absolute -top-1 -left-1 w-4 h-4 z-10 cursor-nwse-resize" />
            <div onPointerDown={onResizeStart('tr')} className="absolute -top-1 -right-1 w-4 h-4 z-10 cursor-nesw-resize" />
            <div onPointerDown={onResizeStart('bl')} className="absolute -bottom-1 -left-1 w-4 h-4 z-10 cursor-nesw-resize" />
            <div onPointerDown={onResizeStart('br')} className="absolute -bottom-1 -right-1 w-4 h-4 z-10 cursor-nwse-resize" />
            {/* Header */}
            <div onPointerDown={onDragStart} className={`${color.header} rounded-t-[0.625rem] px-3 py-2 flex items-center gap-2 cursor-grab active:cursor-grabbing`}>
                <MdDescription className={`${color.text} text-sm shrink-0`} />
                <h3 className="flex-1 text-xs font-bold text-text-primary truncate">{name}</h3>
                <span className={`text-[0.5rem] font-semibold ${color.text} bg-white/30 px-1.5 py-0.5 rounded`}>MÔ TẢ</span>
                <button
                    onPointerDown={onDragStart}
                    onDoubleClick={(e) => { e.stopPropagation(); onClose() }}
                    className="group/pin w-10 h-10 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
                    title="Kéo để di chuyển • Nhấn 2 lần để đóng"
                >
                    <img src="/pin-normal.png" alt="pin" className="w-full h-full object-contain block group-active/pin:hidden transition-transform duration-200 scale-90 group-hover/pin:scale-100 group-hover/pin:translate-x-[4px] group-hover/pin:translate-y-[-4px]" />
                    <img src="/pin-active.png" alt="pin" className="w-full h-full object-contain hidden group-active/pin:block group-active/pin:translate-x-[25px] group-active/pin:translate-y-[-18px] transition-transform duration-150" style={{ filter: 'drop-shadow(3px 6px 4px rgba(0,0,0,0.4))' }} />
                </button>
            </div>

            {/* ContentEditable area — images constrained */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={debouncedSave}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="px-3 py-2 text-xs text-text-primary outline-none overflow-y-auto prose prose-sm max-w-none desc-note-content"
                    style={{ minHeight: '4rem', maxHeight: noteH ? undefined : '18rem', lineHeight: '1.5' }}
                    data-placeholder="Nhập mô tả..."
                />
            </div>

            {/* Floating Toolbar */}
            {focused && (
                <div
                    data-text-note-toolbar
                    className="text-note-toolbar absolute -bottom-12 left-0 z-50 flex items-center gap-1 px-2 py-1.5 rounded-lg shadow-xl border border-border bg-surface/95 backdrop-blur-sm"
                    onMouseDown={e => e.preventDefault()}
                >
                    <button onClick={() => exec('bold')} className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/10 text-text-primary" title="Bold"><span className="text-xs font-bold">B</span></button>
                    <button onClick={() => exec('italic')} className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/10 text-text-primary" title="Italic"><span className="text-xs italic">I</span></button>
                    <button onClick={() => exec('underline')} className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/10 text-text-primary" title="Underline"><span className="text-xs underline">U</span></button>
                    <div className="w-px h-5 bg-border mx-0.5" />
                    <select
                        onChange={(e) => { exec('fontSize', '7'); const sel = window.getSelection(); if (sel && sel.rangeCount > 0) { const els = editorRef.current?.querySelectorAll('font[size="7"]'); els?.forEach(el => { (el as HTMLElement).removeAttribute('size'); (el as HTMLElement).style.fontSize = e.target.value }) }; debouncedSave() }}
                        defaultValue=""
                        className="h-7 px-1 rounded text-[10px] bg-transparent hover:bg-primary/10 text-text-primary outline-none cursor-pointer border border-border/30"
                        title="Cỡ chữ"
                    >
                        <option value="" disabled>Aa</option>
                        <option value="10px">10</option>
                        <option value="12px">12</option>
                        <option value="14px">14</option>
                        <option value="16px">16</option>
                        <option value="20px">20</option>
                        <option value="24px">24</option>
                        <option value="28px">28</option>
                    </select>
                    <div className="w-px h-5 bg-border mx-0.5" />
                    <button onClick={handleImageUpload} className="w-7 h-7 rounded flex items-center justify-center hover:bg-primary/10 text-text-primary" title="Hình ảnh"><span className="material-icons-round text-xs">image</span></button>
                </div>
            )}
        </div>
    )
})

/* ─── All Tasks Note (Blue Pastel) ─── */
const AllTasksNote = memo(function AllTasksNote({ tasks }: { tasks: TaskRow[] }) {
    const { noteRef, pos, onDragStart, onEdgeDrag } = useDraggableNote('all_tasks_note_pos', 400, 100)
    const total = tasks.length
    const done = tasks.filter(t => t.status === 'done' || t.status === 'completed').length
    const [openDescs, setOpenDescs] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('open_desc_notes')
            if (saved) return new Set(JSON.parse(saved) as string[])
        } catch { /* ignore */ }
        return new Set()
    })
    const taskRowRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const [descPositions, setDescPositions] = useState<Record<string, { x: number; y: number }>>({})

    const handleDescPosChange = useCallback((taskId: string, p: { x: number; y: number }) => {
        setDescPositions(prev => ({ ...prev, [taskId]: p }))
    }, [])

    const toggleDesc = useCallback((taskId: string) => {
        setOpenDescs(prev => {
            const next = new Set(prev)
            if (next.has(taskId)) next.delete(taskId)
            else next.add(taskId)
            localStorage.setItem('open_desc_notes', JSON.stringify([...next]))
            return next
        })
    }, [])

    const statusBadge = (status: string, isPaid?: boolean) => {
        const map: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Chờ' },
            'in-progress': { bg: 'bg-amber-100', text: 'text-amber-600', label: 'Đang làm' },
            completed: { bg: 'bg-purple-100', text: 'text-purple-600', label: 'Completed' },
            done: { bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Done' },
        }
        if (isPaid) {
            const d = map.done
            return <span className={`text-[0.5rem] font-semibold px-1.5 py-0.5 rounded-md ${d.bg} ${d.text}`}>{d.label}</span>
        }
        const s = map[status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: status }
        return <span className={`text-[0.5rem] font-semibold px-1.5 py-0.5 rounded-md ${s.bg} ${s.text}`}>{s.label}</span>
    }

    const NOTE_W = 280
    const openDescTasks = tasks.filter(t => openDescs.has(t.id) && t.description)

    return (
        <>
            {/* SVG connecting lines — uses live descPositions */}
            {openDescTasks.map((task) => {
                const rowEl = taskRowRefs.current[task.id]
                if (!rowEl) return null
                const rowY = rowEl.offsetTop + rowEl.offsetHeight / 2

                const descPos = descPositions[task.id] || { x: pos.x + 320, y: pos.y }
                const descNoteW = 280

                const x1 = pos.x + NOTE_W - 30
                const y1 = pos.y + rowY
                const x2 = descPos.x + descNoteW / 2
                const y2 = descPos.y + 80

                return (
                    <svg
                        key={`line-${task.id}`}
                        className="absolute pointer-events-none"
                        style={{ left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', zIndex: 0 }}
                    >
                        <line
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="rgba(147, 197, 253, 0.3)"
                            strokeWidth={1.5}
                            strokeDasharray="6 4"
                        />
                    </svg>
                )
            })}

            {/* Main AllTasksNote */}
            <div
                ref={noteRef}
                data-sticky-note
                onPointerDown={onEdgeDrag}
                className="absolute rounded-2xl shadow-lg select-none transition-shadow hover:shadow-xl group"
                style={{
                    left: pos.x, top: pos.y, width: NOTE_W,
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 40%, #E0F2FE 100%)',
                    border: '2px solid #93C5FD',
                    boxShadow: '0 4px 24px rgba(59, 130, 246, 0.08), 0 0 0 1px rgba(96, 165, 250, 0.1)',
                    zIndex: 1,
                }}
            >
                <div onPointerDown={onDragStart} className="rounded-t-[0.875rem] px-3.5 py-2.5 flex items-center gap-2 cursor-grab active:cursor-grabbing" style={{ background: 'linear-gradient(135deg, #BFDBFE 0%, #93C5FD 100%)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #60A5FA, #3B82F6)' }}>
                        <MdAssignment className="text-white text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-extrabold text-blue-900 truncate">Tất cả task</h3>
                        <p className="text-[0.6rem] text-blue-500 font-medium">{done}/{total} hoàn thành</p>
                    </div>
                    <button onPointerDown={onDragStart} className="group/pin w-10 h-10 flex items-center justify-center transition-all ml-0.5 cursor-grab active:cursor-grabbing" title="Kéo để di chuyển">
                        <img src="/pin-normal.png" alt="pin" className="w-full h-full object-contain block group-active/pin:hidden transition-transform duration-200 scale-90 group-hover/pin:scale-100 group-hover/pin:translate-x-[4px] group-hover/pin:translate-y-[-4px]" />
                        <img src="/pin-active.png" alt="pin" className="w-full h-full object-contain hidden group-active/pin:block group-active/pin:translate-x-[25px] group-active/pin:translate-y-[-18px] transition-transform duration-150" style={{ filter: 'drop-shadow(3px 6px 4px rgba(0,0,0,0.4))' }} />
                    </button>
                </div>
                <div className="px-3.5 py-2 space-y-1 max-h-[22rem] overflow-y-auto">
                    {tasks.length === 0 ? (
                        <div className="text-center py-4">
                            <span className="text-2xl block mb-1">📋</span>
                            <p className="text-xs text-blue-400 font-medium">Chưa có task nào</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div
                                key={task.id}
                                ref={el => { taskRowRefs.current[task.id] = el }}
                                className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/60 hover:bg-white/80 transition-all"
                            >
                                <span className={`text-xs leading-snug font-medium flex-1 min-w-0 truncate ${task.status === 'done' ? 'line-through text-blue-300' : 'text-blue-900'}`}>{task.name}</span>
                                {task.description && (
                                    <button
                                        onClick={() => toggleDesc(task.id)}
                                        className={`shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${openDescs.has(task.id) ? 'bg-blue-300/50' : 'hover:bg-blue-200/60'}`}
                                        title="Xem mô tả"
                                    >
                                        <MdDescription className={`text-xs ${openDescs.has(task.id) ? 'text-blue-600' : 'text-blue-400'}`} />
                                    </button>
                                )}
                                {statusBadge(task.status, (task as any).is_paid)}
                            </div>
                        ))
                    )}
                </div>
                {total > 0 && (
                    <div className="px-3.5 pb-2.5 pt-1">
                        <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((done / total) * 100)}%`, background: 'linear-gradient(90deg, #60A5FA, #3B82F6, #2563EB)' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Task Description Notes — using generic DescNote */}
            {openDescTasks.map((task) => (
                <DescNote
                    key={`desc-${task.id}`}
                    id={task.id}
                    name={task.name}
                    description={task.description}
                    onSave={(id, html) => taskApi.update(id, { description: html } as any)}
                    onClose={() => toggleDesc(task.id)}
                    sourcePos={pos}
                    colorIndex={task.id.charCodeAt(0) % COLORS_LIGHT.length}
                    onPosChange={handleDescPosChange}
                />
            ))}
        </>
    )
})

/* ─── Weekly Deadline Note (Emerald Pastel) ─── */
const WeeklyDeadlineNote = memo(function WeeklyDeadlineNote({ tasks }: { tasks: TaskRow[] }) {
    const { noteRef, pos, onDragStart, onEdgeDrag } = useDraggableNote('weekly_deadline_note_pos', 700, 100)

    // Filter tasks with deadline this week
    const weekTasks = useMemo(() => {
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
        startOfWeek.setHours(0, 0, 0, 0)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
        endOfWeek.setHours(23, 59, 59, 999)

        return tasks.filter(t => {
            if (!t.deadline) return false
            const d = new Date(t.deadline)
            return d >= startOfWeek && d <= endOfWeek
        }).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    }, [tasks])

    const formatDeadline = (dl: string) => {
        const d = new Date(dl)
        const today = new Date()
        const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000)
        if (diff === 0) return 'Hôm nay'
        if (diff === 1) return 'Ngày mai'
        if (diff < 0) return `Trễ ${-diff} ngày`
        return d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })
    }

    return (
        <div
            ref={noteRef}
            data-sticky-note
            onPointerDown={onEdgeDrag}
            className="absolute rounded-2xl shadow-lg select-none transition-shadow hover:shadow-xl group"
            style={{
                left: pos.x, top: pos.y, width: 280,
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 40%, #E0FFF4 100%)',
                border: '2px solid #6EE7B7',
                boxShadow: '0 4px 24px rgba(16, 185, 129, 0.08), 0 0 0 1px rgba(52, 211, 153, 0.1)',
            }}
        >
            <div onPointerDown={onDragStart} className="rounded-t-[0.875rem] px-3.5 py-2.5 flex items-center gap-2 cursor-grab active:cursor-grabbing" style={{ background: 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}>
                    <MdDateRange className="text-white text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-extrabold text-emerald-900 truncate">Deadline tuần này</h3>
                    <p className="text-[0.6rem] text-emerald-500 font-medium">{weekTasks.length} task</p>
                </div>
                <button onPointerDown={onDragStart} className="group/pin w-10 h-10 flex items-center justify-center transition-all ml-0.5 cursor-grab active:cursor-grabbing" title="Kéo để di chuyển">
                    <img src="/pin-normal.png" alt="pin" className="w-full h-full object-contain block group-active/pin:hidden transition-transform duration-200 scale-90 group-hover/pin:scale-100 group-hover/pin:translate-x-[4px] group-hover/pin:translate-y-[-4px]" />
                    <img src="/pin-active.png" alt="pin" className="w-full h-full object-contain hidden group-active/pin:block group-active/pin:translate-x-[25px] group-active/pin:translate-y-[-18px] transition-transform duration-150" style={{ filter: 'drop-shadow(3px 6px 4px rgba(0,0,0,0.4))' }} />
                </button>
            </div>
            <div className="px-3.5 py-2 space-y-1 max-h-[22rem] overflow-y-auto">
                {weekTasks.length === 0 ? (
                    <div className="text-center py-4">
                        <span className="text-2xl block mb-1">✅</span>
                        <p className="text-xs text-emerald-400 font-medium">Không có deadline tuần này</p>
                        <p className="text-[0.6rem] text-emerald-300 mt-0.5">Tuần nhẹ nhàng!</p>
                    </div>
                ) : (
                    weekTasks.map(task => {
                        const isCompleted = task.status === 'done' || task.status === 'completed' || (task as any).is_paid
                        const deadlineLabel = isCompleted ? 'Hoàn thành' : formatDeadline(task.deadline!)
                        const isOverdue = !isCompleted && deadlineLabel.includes('Trễ')
                        return (
                            <div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white/60 hover:bg-white/80 transition-all">
                                <span className={`text-xs leading-snug font-medium flex-1 min-w-0 truncate ${isCompleted ? 'line-through text-emerald-300' : 'text-emerald-900'}`}>{task.name}</span>
                                <span className={`text-[0.5rem] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap ${isOverdue ? 'bg-red-100 text-red-600' : isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-100 text-emerald-600'}`}>{deadlineLabel}</span>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
})

/* ─── Main Canvas Page ─── */
export default function ChecklistPage() {
    const { resolvedDark } = useTheme()
    const {
        checklists, setChecklists, checklistsLoading: loading,
        dailyTasks, setDailyTasks,
        tasks: allTasks,
        refreshChecklists,
    } = useDataCache()
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiLoading, setAiLoading] = useState(false)
    const [showAiModal, setShowAiModal] = useState(false)
    const [showNoteTypeMenu, setShowNoteTypeMenu] = useState(false)

    /* Canvas pan + zoom state */
    const canvasRef = useRef<HTMLDivElement>(null)
    const panRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null)
    const isPanningRef = useRef(false)
    const [zoom, setZoom] = useState(1)
    const zoomRef = useRef(1)
    const ZOOM_MIN = 0.3
    const ZOOM_MAX = 2
    const ZOOM_STEP = 0.02

    /* Viewport tracking for culling */
    const [viewport, setViewport] = useState({ left: 0, top: 0, right: 2000, bottom: 2000 })
    const BUFFER = 600 // px buffer around viewport

    const updateViewport = useCallback(() => {
        const el = canvasRef.current
        if (!el) return
        const z = zoomRef.current
        setViewport({
            left: el.scrollLeft / z - BUFFER,
            top: el.scrollTop / z - BUFFER,
            right: (el.scrollLeft + el.clientWidth) / z + BUFFER,
            bottom: (el.scrollTop + el.clientHeight) / z + BUFFER,
        })
    }, [])

    const isNoteVisible = useCallback((cl: ChecklistRow) => {
        const x = cl.pos_x + CENTER_OFFSET
        const y = cl.pos_y + CENTER_OFFSET
        const w = cl.width ?? 272
        const h = cl.height ?? 300
        return x + w > viewport.left && x < viewport.right && y + h > viewport.top && y < viewport.bottom
    }, [viewport])

    const todayStr = useMemo(() => {
        const d = new Date()
        const y = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }) // en-CA gives yyyy-mm-dd
        return y
    }, [])

    /* Initial data comes from DataCacheContext — background refresh on mount */
    useEffect(() => { refreshChecklists() }, [refreshChecklists])

    /* Block browser zoom — only canvas zoom should work */
    useEffect(() => {
        const blockZoom = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) e.preventDefault()
        }
        const blockKeyZoom = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '+')) e.preventDefault()
        }
        document.addEventListener('wheel', blockZoom, { passive: false })
        document.addEventListener('keydown', blockKeyZoom)
        return () => {
            document.removeEventListener('wheel', blockZoom)
            document.removeEventListener('keydown', blockKeyZoom)
        }
    }, [])

    /* Persist viewport position (scroll + zoom) */
    const viewportSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const saveViewport = useCallback(() => {
        const el = canvasRef.current
        if (!el) return
        clearTimeout(viewportSaveTimer.current)
        viewportSaveTimer.current = setTimeout(() => {
            localStorage.setItem('canvas_viewport', JSON.stringify({
                scrollLeft: el.scrollLeft,
                scrollTop: el.scrollTop,
                zoom: zoomRef.current,
            }))
        }, 300)
    }, [])

    /* Restore saved viewport or center on notes on mount */
    const hasCenteredRef = useRef(false)
    useEffect(() => {
        if (!loading && canvasRef.current && !hasCenteredRef.current) {
            hasCenteredRef.current = true
            const el = canvasRef.current
            const saved = localStorage.getItem('canvas_viewport')
            if (saved) {
                try {
                    const v = JSON.parse(saved)
                    if (v.zoom) { zoomRef.current = v.zoom; setZoom(v.zoom) }
                    requestAnimationFrame(() => {
                        el.scrollLeft = v.scrollLeft ?? 0
                        el.scrollTop = v.scrollTop ?? 0
                        updateViewport()
                    })
                    return
                } catch { /* fall through */ }
            }
            // Default: center on notes or canvas center
            el.scrollLeft = CENTER_OFFSET * zoom - el.clientWidth / 2
            el.scrollTop = CENTER_OFFSET * zoom - el.clientHeight / 2
            if (checklists.length > 0) {
                const xs = checklists.map(c => c.pos_x + CENTER_OFFSET)
                const ys = checklists.map(c => c.pos_y + CENTER_OFFSET)
                const cx = (Math.min(...xs) + Math.max(...xs)) / 2
                const cy = (Math.min(...ys) + Math.max(...ys)) / 2
                el.scrollLeft = cx * zoom - el.clientWidth / 2
                el.scrollTop = cy * zoom - el.clientHeight / 2
            }
            updateViewport()
        }
    }, [loading, checklists, zoom, updateViewport])


    const toggleDailyTask = useCallback(async (id: string) => {
        // Optimistic: update UI immediately
        setDailyTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t))
        try {
            const updated = await dailyTaskApi.toggle(id)
            setDailyTasks(prev => prev.map(t => t.id === id ? updated : t))
        } catch {
            // Revert on error
            setDailyTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t))
        }
    }, [])

    const updateTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    const updateChecklist = useCallback((id: string, data: Partial<ChecklistRow>) => {
        // Optimistic: update UI immediately
        setChecklists(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
        // Debounce API call per checklist (300ms)
        const timers = updateTimersRef.current
        if (timers.has(id)) clearTimeout(timers.get(id)!)
        timers.set(id, setTimeout(async () => {
            timers.delete(id)
            try {
                await checklistApi.update(id, data)
            } catch {
                checklistApi.list().then(setChecklists).catch(() => {})
            }
        }, 300))
    }, [])

    const deleteChecklist = async (id: string) => {
        await checklistApi.remove(id)
        setChecklists(prev => prev.filter(c => c.id !== id))
    }

    const createChecklist = async (pos?: { x: number, y: number }, type: 'checklist' | 'text' = 'checklist') => {
        const scrollEl = canvasRef.current
        const x = pos?.x ? pos.x - CENTER_OFFSET : ((scrollEl?.scrollLeft ?? 0) / zoom + 200 - CENTER_OFFSET)
        const y = pos?.y ? pos.y - CENTER_OFFSET : ((scrollEl?.scrollTop ?? 0) / zoom + 200 - CENTER_OFFSET)
        const cl = await checklistApi.create({
            title: type === 'text' ? 'Ghi chú' : 'Note mới',
            color: COLORS[Math.floor(Math.random() * COLORS.length)].name,
            pos_x: x,
            pos_y: y,
            type,
        } as any)
        setChecklists(prev => [cl, ...prev])
    }

    const generateWithAI = async () => {
        if (!aiPrompt.trim()) return
        setAiLoading(true)
        try {
            const { items } = await aiApi.generateChecklist(aiPrompt.trim())
            const scrollEl = canvasRef.current
            const x = (scrollEl?.scrollLeft ?? 0) / zoom + 200 - CENTER_OFFSET
            const y = (scrollEl?.scrollTop ?? 0) / zoom + 150 - CENTER_OFFSET
            const cl = await checklistApi.create({
                title: aiPrompt.trim().slice(0, 50),
                items,
                color: COLORS[Math.floor(Math.random() * COLORS.length)].name,
                pos_x: x,
                pos_y: y,
            } as any)
            setChecklists(prev => [cl, ...prev])
            setAiPrompt('')
            setShowAiModal(false)
        } catch {
            alert('Không thể tạo checklist. Thử lại.')
        } finally {
            setAiLoading(false)
        }
    }

    /* ─── Canvas pan handlers (ref-based, zero re-renders) ─── */
    const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {
        // Only pan when clicking on canvas bg, not on notes
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
        // Check if target is part of a sticky note
        if ((e.target as HTMLElement).closest('[data-sticky-note]')) return
        const scrollEl = canvasRef.current
        if (!scrollEl) return
        isPanningRef.current = true
        scrollEl.style.cursor = 'grabbing'
        panRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: scrollEl.scrollLeft,
            scrollTop: scrollEl.scrollTop,
        }
    }, [])

    const onCanvasPointerMove = useCallback((e: React.PointerEvent) => {
        if (!panRef.current || !canvasRef.current) return
        // Free 8-direction movement: both dx and dy applied simultaneously
        const dx = e.clientX - panRef.current.startX
        const dy = e.clientY - panRef.current.startY
        canvasRef.current.scrollLeft = panRef.current.scrollLeft - dx
        canvasRef.current.scrollTop = panRef.current.scrollTop - dy
    }, [])

    const onCanvasPointerUp = useCallback(() => {
        panRef.current = null
        isPanningRef.current = false
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
    }, [])

    /* Double-click to create note at that position */
    const onCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
        if ((e.target as HTMLElement).closest('[data-sticky-note]')) return
        const scrollEl = canvasRef.current
        if (!scrollEl) return
        const rect = scrollEl.getBoundingClientRect()
        const x = (e.clientX - rect.left + scrollEl.scrollLeft) / zoom
        const y = (e.clientY - rect.top + scrollEl.scrollTop) / zoom
        createChecklist({ x, y })
    }, [zoom, createChecklist])

    /* Scroll → update viewport for culling */
    const scrollRafRef = useRef(0)
    const onCanvasScroll = useCallback(() => {
        cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = requestAnimationFrame(updateViewport)
        saveViewport()
    }, [updateViewport, saveViewport])

    /* Zoom with scroll wheel / trackpad pinch — zoom towards cursor.
       Bypass React state during active zoom to avoid browser scroll auto-adjustment.
       All DOM changes (wrapper size, transform, scroll) happen synchronously in one frame. */
    const zoomSyncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    // Keep ref in sync when zoom changes from other sources (buttons, touch pinch)
    useEffect(() => { zoomRef.current = zoom }, [zoom])

    const onCanvasWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            const el = canvasRef.current
            if (!el) return

            const oldZoom = zoomRef.current
            const delta = -e.deltaY * 0.005
            const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldZoom + delta))
            if (newZoom === oldZoom) return

            // Cursor position relative to scroll container
            const rect = el.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top

            // World point under cursor (at old zoom)
            const worldX = (el.scrollLeft + mouseX) / oldZoom
            const worldY = (el.scrollTop + mouseY) / oldZoom

            // Update ref immediately
            zoomRef.current = newZoom

            // Mutate DOM directly — wrapper size + inner transform
            const wrapper = el.firstElementChild as HTMLElement
            const content = wrapper?.firstElementChild as HTMLElement
            if (wrapper) {
                wrapper.style.width = `${CANVAS_SIZE * newZoom}px`
                wrapper.style.height = `${CANVAS_SIZE * newZoom}px`
            }
            if (content) {
                content.style.transform = `scale(${newZoom})`
            }

            // Adjust scroll in the same frame — no drift!
            el.scrollLeft = worldX * newZoom - mouseX
            el.scrollTop = worldY * newZoom - mouseY

            // Debounce sync to React state (for UI display like % indicator)
            clearTimeout(zoomSyncTimer.current)
            zoomSyncTimer.current = setTimeout(() => {
                setZoom(zoomRef.current)
            }, 100)

            // Update viewport for culling
            updateViewport()
            saveViewport()
        }
    }, [])

    /* Pinch-to-zoom via touch — same origin-preserving technique as wheel handler */
    const pinchRef = useRef<{ dist: number; zoom: number; midX: number; midY: number } | null>(null)

    const getTouchDist = (touches: React.TouchList) => {
        const [a, b] = [touches[0], touches[1]]
        return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }

    const getTouchMid = (touches: React.TouchList) => {
        const [a, b] = [touches[0], touches[1]]
        return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
    }

    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault()
            const mid = getTouchMid(e.touches)
            pinchRef.current = { dist: getTouchDist(e.touches), zoom: zoomRef.current, midX: mid.x, midY: mid.y }
        }
    }

    const onTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && pinchRef.current) {
            e.preventDefault()
            const el = canvasRef.current
            if (!el) return

            const oldZoom = zoomRef.current
            const newDist = getTouchDist(e.touches)
            const rawScale = newDist / pinchRef.current.dist
            const dampenedScale = 1 + (rawScale - 1) * 0.15
            const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchRef.current.zoom * dampenedScale))
            if (newZoom === oldZoom) return

            // Get current pinch midpoint relative to container
            const mid = getTouchMid(e.touches)
            const rect = el.getBoundingClientRect()
            const midX = mid.x - rect.left
            const midY = mid.y - rect.top

            // World point under pinch midpoint
            const worldX = (el.scrollLeft + midX) / oldZoom
            const worldY = (el.scrollTop + midY) / oldZoom

            // Update ref immediately
            zoomRef.current = newZoom

            // Mutate DOM directly — wrapper size + inner transform
            const wrapper = el.firstElementChild as HTMLElement
            const content = wrapper?.firstElementChild as HTMLElement
            if (wrapper) {
                wrapper.style.width = `${CANVAS_SIZE * newZoom}px`
                wrapper.style.height = `${CANVAS_SIZE * newZoom}px`
            }
            if (content) {
                content.style.transform = `scale(${newZoom})`
            }

            // Adjust scroll — keep pinch midpoint on same world point
            el.scrollLeft = worldX * newZoom - midX
            el.scrollTop = worldY * newZoom - midY

            // Debounce sync to React state
            clearTimeout(zoomSyncTimer.current)
            zoomSyncTimer.current = setTimeout(() => {
                setZoom(zoomRef.current)
            }, 100)

            updateViewport()
            saveViewport()
        }
    }

    const onTouchEnd = () => { pinchRef.current = null }

    const applyZoomAtCenter = useCallback((newZoom: number) => {
        const el = canvasRef.current
        if (!el) return
        const oldZoom = zoomRef.current
        if (newZoom === oldZoom) return
        const centerX = el.clientWidth / 2
        const centerY = el.clientHeight / 2
        const worldX = (el.scrollLeft + centerX) / oldZoom
        const worldY = (el.scrollTop + centerY) / oldZoom
        zoomRef.current = newZoom
        const wrapper = el.firstElementChild as HTMLElement
        const content = wrapper?.firstElementChild as HTMLElement
        if (wrapper) { wrapper.style.width = `${CANVAS_SIZE * newZoom}px`; wrapper.style.height = `${CANVAS_SIZE * newZoom}px` }
        if (content) { content.style.transform = `scale(${newZoom})` }
        el.scrollLeft = worldX * newZoom - centerX
        el.scrollTop = worldY * newZoom - centerY
        setZoom(newZoom)
        updateViewport()
        saveViewport()
    }, [updateViewport, saveViewport])
    const zoomIn = useCallback(() => applyZoomAtCenter(Math.min(ZOOM_MAX, zoomRef.current + ZOOM_STEP)), [applyZoomAtCenter])
    const zoomOut = useCallback(() => applyZoomAtCenter(Math.max(ZOOM_MIN, zoomRef.current - ZOOM_STEP)), [applyZoomAtCenter])
    const zoomReset = useCallback(() => applyZoomAtCenter(1), [applyZoomAtCenter])

    return (
        <div className="-m-4 sm:-m-6 md:-m-8 -mt-[4.5rem] xl:-mt-8 flex flex-col" style={{ height: '100vh' }}>
            {/* Top toolbar */}
            <div className="relative z-20 bg-surface/80 backdrop-blur-md border-b border-border/50 px-4 py-2.5 flex items-center gap-3 shrink-0 pt-[4.5rem] xl:pt-2.5">
                <div className="flex items-center gap-2 mr-auto">
                    <span className="material-icons-round text-primary text-xl">dashboard</span>
                    <h1 className="font-bold text-base text-text-primary">Notes</h1>
                    <span className="text-xs text-text-muted bg-surface-secondary px-2 py-0.5 rounded-md">{checklists.length} notes</span>
                </div>


                <button
                    onClick={() => setShowAiModal(true)}
                    className="bg-gradient-to-r from-primary to-primary-mid text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all"
                >
                    <span className="material-icons-round text-sm">auto_awesome</span>
                    AI
                </button>
                <div className="relative">
                    <button
                        onClick={() => setShowNoteTypeMenu(p => !p)}
                        className="bg-surface border border-border text-text-primary text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:border-primary-lighter transition-all"
                    >
                        <span className="material-icons-round text-sm">add</span>
                        Thêm note
                        <span className="material-icons-round text-[0.7rem] ml-0.5">expand_more</span>
                    </button>
                    {showNoteTypeMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNoteTypeMenu(false)} />
                            <div className="absolute top-full mt-1 right-0 z-50 bg-surface border border-border rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                                <button
                                    onClick={() => { createChecklist(undefined, 'checklist'); setShowNoteTypeMenu(false) }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <span className="material-icons-round text-sm text-primary">checklist</span>
                                    Checklist
                                </button>
                                <button
                                    onClick={() => { createChecklist(undefined, 'text'); setShowNoteTypeMenu(false) }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <span className="material-icons-round text-sm text-primary">sticky_note_2</span>
                                    Text
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Infinite canvas */}
            <div
                ref={canvasRef}
                className="flex-1 overflow-auto relative cursor-grab"
                onPointerDown={onCanvasPointerDown}
                onPointerMove={onCanvasPointerMove}
                onPointerUp={onCanvasPointerUp}
                onPointerLeave={onCanvasPointerUp}
                onDoubleClick={onCanvasDoubleClick}
                onWheel={onCanvasWheel}
                onScroll={onCanvasScroll}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{ touchAction: 'none' }}
            >
                {/* Large virtual canvas with zoom */}
                <div className="relative" style={{ width: CANVAS_SIZE * zoom, height: CANVAS_SIZE * zoom, transformOrigin: '0 0' }}>
                    <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: CANVAS_SIZE, height: CANVAS_SIZE, position: 'relative' }}>
                        {/* Grid dots pattern */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-[0.15]"
                            style={{
                                backgroundImage: 'radial-gradient(circle, #6b7280 1px, transparent 1px)',
                                backgroundSize: '30px 30px',
                            }}
                        />

                        {loading ? (
                            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-text-muted">Đang tải...</div>
                        ) : (
                            <>
                                {checklists.filter(isNoteVisible).map(cl => (
                                    cl.type === 'text' ? (
                                        <TextNote
                                            key={cl.id}
                                            checklist={cl}
                                            onUpdate={updateChecklist}
                                            onDelete={deleteChecklist}
                                            dark={resolvedDark}
                                        />
                                    ) : (
                                        <StickyNote
                                            key={cl.id}
                                            checklist={cl}
                                            onUpdate={updateChecklist}
                                            onDelete={deleteChecklist}
                                            dark={resolvedDark}
                                        />
                                    )
                                ))}

                                {/* Daily Tasks — fixed container */}
                                <DailyTasksNote
                                    tasks={dailyTasks}
                                    todayStr={todayStr}
                                    onToggle={toggleDailyTask}
                                />

                                {/* All Tasks — blue pastel */}
                                <AllTasksNote tasks={allTasks} />

                                {/* Weekly Deadline — emerald pastel */}
                                <WeeklyDeadlineNote tasks={allTasks} />

                                {checklists.length === 0 && dailyTasks.length === 0 && (
                                    <div className="absolute top-60 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                                        <span className="material-icons-round text-5xl text-primary-lightest mb-3 block">sticky_note_2</span>
                                        <p className="text-sm text-text-muted font-medium">Double-click để tạo note mới</p>
                                        <p className="text-xs text-text-muted/60 mt-1">Hoặc dùng nút ở toolbar</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom-right controls — vertical stack */}
            <div className="absolute bottom-5 right-5 z-20 flex flex-col items-center gap-2">
                {/* Zoom controls */}
                <div className="flex flex-col items-center bg-white/90 backdrop-blur-md border border-border/60 rounded-xl shadow-lg overflow-hidden">
                    <button onClick={zoomIn} className="w-10 h-9 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/5 transition-all active:scale-90" title="Phóng to">
                        <FiPlus className="text-lg" />
                    </button>
                    <button onClick={zoomReset} className="w-10 h-7 flex items-center justify-center text-[0.6rem] font-bold text-text-muted hover:text-primary border-y border-border/40 transition-all" title="Reset zoom">
                        {Math.round(zoom * 100)}%
                    </button>
                    <button onClick={zoomOut} className="w-10 h-9 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/5 transition-all active:scale-90" title="Thu nhỏ">
                        <FiMinus className="text-lg" />
                    </button>
                </div>
                {/* Re-center button */}
                <button
                    onClick={() => {
                        const el = canvasRef.current
                        if (!el) return
                        let cx = CENTER_OFFSET, cy = CENTER_OFFSET
                        if (checklists.length > 0) {
                            const xs = checklists.map(c => c.pos_x + CENTER_OFFSET)
                            const ys = checklists.map(c => c.pos_y + CENTER_OFFSET)
                            cx = (Math.min(...xs) + Math.max(...xs)) / 2
                            cy = (Math.min(...ys) + Math.max(...ys)) / 2
                        }
                        el.scrollTo({
                            left: cx * zoom - el.clientWidth / 2,
                            top: cy * zoom - el.clientHeight / 2,
                            behavior: 'smooth',
                        })
                        setTimeout(updateViewport, 400)
                    }}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border border-border/60 shadow-lg flex items-center justify-center text-text-muted hover:text-primary hover:border-primary-lighter hover:shadow-xl transition-all active:scale-90"
                    title="Về vị trí các notes"
                >
                    <MdMyLocation className="text-lg" />
                </button>
            </div>
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !aiLoading && setShowAiModal(false)} />
                    <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary-mid flex items-center justify-center">
                                <span className="material-icons-round text-white">auto_awesome</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-text-primary">Tạo Checklist bằng AI</h3>
                                <p className="text-xs text-text-muted">AI sẽ tạo danh sách chi tiết cho bạn</p>
                            </div>
                        </div>
                        <textarea
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            placeholder="VD: Lên kế hoạch launch sản phẩm mới..."
                            rows={3}
                            disabled={aiLoading}
                            className="w-full bg-surface-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none text-text-primary placeholder:text-text-muted disabled:opacity-50"
                        />
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => setShowAiModal(false)} disabled={aiLoading} className="flex-1 py-2.5 text-sm text-text-muted rounded-xl hover:bg-surface-secondary disabled:opacity-50">Hủy</button>
                            <button onClick={generateWithAI} disabled={aiLoading || !aiPrompt.trim()} className="flex-1 bg-gradient-to-r from-primary to-primary-mid text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50">
                                {aiLoading ? (
                                    <><span className="material-icons-round animate-spin text-sm">refresh</span> Đang tạo...</>
                                ) : (
                                    <><span className="material-icons-round text-sm">auto_awesome</span> Tạo</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
