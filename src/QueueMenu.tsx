import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { t as tr, useLocale } from './i18n'

// Shared "add to play queue" context menu for Gallery and the playback panel.
export function QueueMenu({
  x,
  y,
  count,
  onAdd,
  onClose,
}: {
  x: number
  y: number
  count: number
  onAdd: () => void
  onClose: () => void
}) {
  useLocale()
  const item = useRef<HTMLButtonElement>(null),
    opener = useRef(document.activeElement as HTMLElement | null)
  useEffect(() => {
    item.current?.focus()
    const away = (event: Event) => {
      if (!(event.target as HTMLElement).closest?.('.queue-menu')) onClose()
    }
    document.addEventListener('pointerdown', away, true)
    window.addEventListener('blur', onClose)
    const previous = opener.current
    return () => {
      document.removeEventListener('pointerdown', away, true)
      window.removeEventListener('blur', onClose)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [])
  return createPortal(
    <div
      className="queue-menu"
      role="menu"
      style={{
        left: Math.max(4, Math.min(x, window.innerWidth - 220)),
        top: Math.max(4, Math.min(y, window.innerHeight - 48)),
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <button ref={item} role="menuitem" onClick={onAdd}>
        {count > 1 ? tr('加入播放佇列（{0} 項）', String(count)) : tr('加入播放佇列')}
      </button>
    </div>,
    document.body
  )
}
