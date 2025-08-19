function Timeline({ items = [] }) {
  return (
    <ol style={{ position: 'relative', margin: 0, padding: 0, listStyle: 'none' }}>
      <div aria-hidden style={{ position: 'absolute', left: '16px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(var(--color-bellwether-blue), var(--color-dragon-fire))', boxShadow: 'var(--glow-subtle)' }} />
      {items.map((item, idx) => (
        <li key={idx} className="animate-fadeInUp" style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(180deg, var(--color-bellwether-blue), var(--color-indigo))', boxShadow: 'var(--glow-strong)', display: 'grid', placeItems: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{item.dateShort || '—'}</div>
          </div>
          <div className="neon-border" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{item.title}</h3>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-light-slate-gray)' }}>{item.date}</span>
            </div>
            {item.subtitle && <div style={{ color: 'var(--color-light-slate-gray)', marginTop: '4px' }}>{item.subtitle}</div>}
            {Array.isArray(item.points) && (
              <ul style={{ marginTop: '8px', paddingLeft: '18px' }}>
                {item.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

export default Timeline



