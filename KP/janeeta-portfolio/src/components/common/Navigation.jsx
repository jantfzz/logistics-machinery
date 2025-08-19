import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

function Navigation() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass = ({ isActive }) => (
    'nav-link' + (isActive ? ' active' : '')
  )

  return (
    <nav aria-label="Primary" className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 'var(--navbar-height)' }}>
        <NavLink to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="glitch" aria-hidden="true">JANEETA</span>
          <span className="sr-only">Home</span>
        </NavLink>

        <button aria-expanded={open} aria-controls="menu" aria-label="Toggle navigation" className={`hamburger ${open ? 'is-open' : ''}`} onClick={() => setOpen(!open)}>
          <span />
          <span />
          <span />
        </button>

        <ul id="menu" className={`menu ${open ? 'open' : ''}`}>
          <li><NavLink to="/about" className={linkClass} onClick={() => setOpen(false)}>About</NavLink></li>
          <li><NavLink to="/experience" className={linkClass} onClick={() => setOpen(false)}>Experience</NavLink></li>
          <li><NavLink to="/achievements" className={linkClass} onClick={() => setOpen(false)}>Achievements</NavLink></li>
          <li><NavLink to="/projects" className={linkClass} onClick={() => setOpen(false)}>Projects</NavLink></li>
          <li><NavLink to="/skills" className={linkClass} onClick={() => setOpen(false)}>Skills</NavLink></li>
          <li><NavLink to="/contact" className={linkClass} onClick={() => setOpen(false)}>Contact</NavLink></li>
        </ul>
      </div>

      <style>{`
        .nav { position: sticky; top: 0; z-index: 40; transition: background 300ms ease, box-shadow 300ms ease; background: rgba(5,10,34,0.55); }
        .nav.nav-scrolled { background: rgba(5,10,34,0.75); box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
        .brand { font-family: var(--font-mono); color: var(--color-white); font-size: 20px; font-weight: 700; text-decoration: none; text-shadow: 0 0 8px rgba(74,108,247,0.55); }
        .menu { display: flex; gap: 16px; align-items: center; }
        .nav-link { color: var(--color-white); text-decoration: none; padding: 8px 12px; border-radius: 8px; position: relative; transition: transform 200ms ease, background 200ms ease, box-shadow 200ms ease; }
        .nav-link:hover { transform: translateY(-1px); background: rgba(74,108,247,0.12); box-shadow: var(--glow-subtle); }
        .nav-link.active { box-shadow: 0 0 0 1px rgba(74,108,247,0.5), 0 0 16px rgba(74,108,247,0.5); background: rgba(74,108,247,0.18); }
        .hamburger { display: none; background: transparent; border: none; width: 40px; height: 40px; border-radius: 8px; position: relative; box-shadow: var(--glow-subtle); }
        .hamburger span { position: absolute; left: 9px; right: 9px; height: 2px; background: var(--color-white); transition: transform 250ms ease, top 250ms ease, opacity 250ms ease; box-shadow: 0 0 6px rgba(255,255,255,0.55); }
        .hamburger span:nth-child(1) { top: 12px; }
        .hamburger span:nth-child(2) { top: 19px; }
        .hamburger span:nth-child(3) { top: 26px; }
        .hamburger.is-open span:nth-child(1) { top: 19px; transform: rotate(45deg); }
        .hamburger.is-open span:nth-child(2) { opacity: 0; }
        .hamburger.is-open span:nth-child(3) { top: 19px; transform: rotate(-45deg); }

        @media (max-width: 768px) {
          .hamburger { display: block; }
          .menu { position: fixed; top: var(--navbar-height); left: 0; right: 0; background: rgba(5,10,34,0.92); display: grid; gap: 8px; padding: 16px; transform: translateY(-8px); opacity: 0; pointer-events: none; transition: opacity 200ms ease, transform 200ms ease; }
          .menu.open { transform: translateY(0); opacity: 1; pointer-events: auto; }
        }
      `}</style>
    </nav>
  )
}

export default Navigation


