function SkillBar({ label, percent }) {
  const safe = Math.max(0, Math.min(100, Number(percent) || 0))
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', textShadow: '0 0 8px rgba(255,255,255,0.25)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{safe}%</span>
      </div>
      <div aria-hidden style={{ height: '10px', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <div style={{ width: `${safe}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-bellwether-blue), var(--color-dragon-fire))', boxShadow: 'var(--glow-subtle)' }} />
      </div>
    </div>
  )
}

export default SkillBar



