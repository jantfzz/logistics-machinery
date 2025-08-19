function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer role="contentinfo" style={{ padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '48px' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-light-slate-gray)' }}>© {year} Janeeta Faiza</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="https://linkedin.com/in/janeeta-faiza" target="_blank" rel="noreferrer" style={{ color: 'var(--color-white)', textDecoration: 'none' }}>LinkedIn</a>
          <a href="mailto:janeetafz@gmail.com" style={{ color: 'var(--color-white)', textDecoration: 'none' }}>Email</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer



