import { useState } from 'react'
import Card from '../ui/Card.jsx'

function TrophyIcon() {
  return (
    <span aria-hidden style={{ display: 'inline-block', width: 18, height: 18, borderRadius: '3px', background: 'linear-gradient(180deg, #ffd700, #b8860b)', boxShadow: '0 0 6px rgba(255,215,0,0.6)' }} />
  )
}

function AchievementCard({ title, level, details, research }) {
  const [open, setOpen] = useState(false)
  return (
    <Card onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrophyIcon />
          <div>
            <h4 style={{ margin: '0 0 4px' }}>{title}</h4>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-light-slate-gray)' }}>{level}</div>
          </div>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>{open ? 'Hide' : 'Details'}</div>
      </div>
      {open && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ color: 'var(--color-light-slate-gray)' }}>{details}</div>
          {research && <div style={{ fontStyle: 'italic', marginTop: '6px' }}>{research}</div>}
        </div>
      )}
    </Card>
  )
}

export default AchievementCard



