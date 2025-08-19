function Loading() {
  return (
    <div role="status" aria-live="polite" style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.25)', borderTopColor: 'var(--color-bellwether-blue)',
        animation: 'spin 1s linear infinite', boxShadow: '0 0 16px rgba(74,108,247,0.55)'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default Loading



