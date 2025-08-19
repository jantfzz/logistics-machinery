import Card from '../ui/Card.jsx'

function ExperienceCard({ org, role, duration, points = [], tag }) {
  return (
    <Card style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
        <h3 className="glitch" style={{ margin: 0 }}>{role}</h3>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-light-slate-gray)' }}>{duration}</span>
      </div>
      <div style={{ color: 'var(--color-light-slate-gray)', marginBottom: '8px' }}>{org}</div>
      {Array.isArray(points) && (
        <ul style={{ paddingLeft: '18px', margin: 0 }}>
          {points.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      )}
      {tag && (
        <span style={{ position: 'absolute', top: 12, right: 12, fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '4px 8px', borderRadius: '999px', background: 'rgba(240,90,40,0.15)', border: '1px solid rgba(240,90,40,0.45)' }}>{tag}</span>
      )}
    </Card>
  )
}

export default ExperienceCard



