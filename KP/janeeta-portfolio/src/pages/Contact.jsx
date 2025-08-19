import { useState } from 'react'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'

function Contact() {
  const [status, setStatus] = useState('idle')

  function handleSubmit(e) {
    e.preventDefault()
    setStatus('success')
  }

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h2>Contact</h2>
      <div className="grid-responsive">
        <Card>
          <h3>Get in touch</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px' }}>
            <label>
              <div>Name</div>
              <input required name="name" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.25)', color: 'white' }} />
            </label>
            <label>
              <div>Email</div>
              <input required type="email" name="email" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.25)', color: 'white' }} />
            </label>
            <label>
              <div>Message</div>
              <textarea required name="message" rows={4} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.25)', color: 'white' }} />
            </label>
            <div>
              <Button type="submit">Send</Button>
            </div>
            {status === 'success' && (
              <div role="status" style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(74,108,247,0.15)', border: '1px solid rgba(74,108,247,0.45)' }}>
                Message sent! We'll get back to you soon.
              </div>
            )}
          </form>
        </Card>
        <Card>
          <h3>Info</h3>
          <div>Location: Bandung, Jawa Barat, Indonesia</div>
          <div>Email: <a href="mailto:janeetafz@gmail.com">janeetafz@gmail.com</a></div>
          <div>Phone: <a href="tel:+6285353532003">+62 853-5353-2003</a></div>
          <div>LinkedIn: <a href="https://linkedin.com/in/janeeta-faiza" target="_blank" rel="noreferrer">linkedin.com/in/janeeta-faiza/</a></div>
          <div className="neon-border" style={{ height: '200px', marginTop: '12px', display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.25)' }}>Map Placeholder: Bandung</div>
        </Card>
      </div>
    </div>
  )
}

export default Contact



