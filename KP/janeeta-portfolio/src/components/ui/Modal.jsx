import { useEffect } from 'react'

function Modal({ open, onClose, children, title }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div className="container" style={{ position: 'relative', marginTop: '10vh' }}>
        <div className="neon-border" style={{ background: 'rgba(10,26,74,0.85)', borderRadius: '16px', padding: '20px' }}>
          {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal



