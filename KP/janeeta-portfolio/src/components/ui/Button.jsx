function Button({ children, variant = 'primary', ...props }) {
  const base = {
    padding: '10px 16px',
    borderRadius: '12px',
    border: '1px solid transparent',
    cursor: 'pointer',
    fontWeight: 700,
    letterSpacing: '0.4px',
    transition: 'transform 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  }
  const variants = {
    primary: {
      background: 'linear-gradient(180deg, rgba(74,108,247,0.95), rgba(75,0,130,0.95))',
      color: 'white',
      boxShadow: '0 10px 24px rgba(74,108,247,0.45)',
    },
    ghost: {
      background: 'transparent',
      color: 'white',
      border: '1px solid rgba(255,255,255,0.25)'
    }
  }
  const style = { ...base, ...variants[variant] }
  return (
    <button
      {...props}
      style={style}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--glow-strong)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = variants[variant].boxShadow || 'none'; }}
    >
      {children}
    </button>
  )
}

export default Button



