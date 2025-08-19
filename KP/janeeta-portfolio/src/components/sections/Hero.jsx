import Button from '../ui/Button.jsx'

function MatrixBackground() {
  const rows = Array.from({ length: 24 })
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.25 }}>
      {rows.map((_, i) => (
        <div key={i} style={{ position: 'absolute', left: `${(i * 4) % 100}%`, top: '-100%', height: '200%', width: '1px', background: 'linear-gradient(180deg, transparent, rgba(74,108,247,0.75))', animation: 'matrixFall 6s linear infinite', animationDelay: `${i * 0.25}s` }} />
      ))}
    </div>
  )
}

function Hero() {
  return (
    <section aria-label="Hero" style={{ position: 'relative', padding: '80px 0 40px' }}>
      <MatrixBackground />
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 className="glitch" style={{ fontSize: '56px', margin: 0, letterSpacing: '2px' }}>JANEETA FAIZA</h1>
        <p className="typewriter" style={{ maxWidth: 800, margin: '12px auto 24px', fontFamily: 'var(--font-mono)' }}>Bio-Agricultural Engineering Student & Research Enthusiast</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <a href="#about"><Button>About Me</Button></a>
          <a href="#contact"><Button variant="ghost">Get in Touch</Button></a>
        </div>
      </div>
    </section>
  )
}

export default Hero



