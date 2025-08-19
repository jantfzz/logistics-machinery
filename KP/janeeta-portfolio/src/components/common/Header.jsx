import { useEffect, useState } from 'react'

function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header aria-label="Top Header" style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '32px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)', zIndex: 50,
      background: scrolled ? 'rgba(10,26,74,0.5)' : 'transparent',
      transition: 'background 300ms ease, opacity 300ms ease'
    }}>
      <span className="glitch" aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '2px', color: 'var(--color-light-slate-gray)' }}>Y2K MODE • PLAYFUL • MODERN</span>
    </header>
  )
}

export default Header



