function About() {
  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h2>About Me</h2>
      <div className="neon-border" style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '12px', fontFamily: 'var(--font-mono)' }}>
        <div>$ whoami</div>
        <div>Janeeta Faiza — Bio-Agricultural Engineering Student & Research Enthusiast</div>
        <div>$ location</div>
        <div>Bandung, Jawa Barat, Indonesia</div>
        <div>$ education</div>
        <div>Institut Teknologi Bandung, Bachelor of Agricultural Engineering (GPA 3.63/4.00), Aug 2022 — Present</div>
      </div>
      <blockquote style={{ marginTop: '16px', borderLeft: '3px solid rgba(255,255,255,0.35)', paddingLeft: '12px', fontStyle: 'italic' }}>
        "A successful life is the accumulation of good enough cards that are met with smart moves."
      </blockquote>
    </div>
  )
}

export default About



