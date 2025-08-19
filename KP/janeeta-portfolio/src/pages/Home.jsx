import Hero from '../components/sections/Hero.jsx'

function Home() {
  return (
    <div>
      <Hero />
      <section id="about" className="container" style={{ padding: '40px 0' }}>
        <h2 style={{ marginTop: 0 }}>About</h2>
        <p>
          As a highly motivated candidate pursuing a bachelor's degree in Agricultural Engineering, Janet has enhanced her research and problem-solving skills through science competitions. Her experience in Fundraising and Marketing within campus organizations has strengthened her teamwork and communication abilities. She excels as a team leader with passion for project management.
        </p>
      </section>
    </div>
  )
}

export default Home



