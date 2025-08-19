function Card({ children, hover = true, style: styleProp = {}, ...props }) {
  const style = {
    borderRadius: '16px',
    padding: '16px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
    transformStyle: 'preserve-3d',
    ...styleProp
  }
  return (
    <div
      {...props}
      className={`neon-border ${props.className || ''}`}
      style={style}
      onMouseEnter={hover ? (e) => { e.currentTarget.style.transform = 'translateY(-2px) rotateX(2deg) rotateY(-2deg)' } : undefined}
      onMouseLeave={hover ? (e) => { e.currentTarget.style.transform = 'translateY(0) rotateX(0) rotateY(0)' } : undefined}
    >
      {children}
    </div>
  )
}

export default Card



