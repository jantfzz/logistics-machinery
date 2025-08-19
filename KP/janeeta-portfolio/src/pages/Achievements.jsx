import AchievementCard from '../components/sections/AchievementCard.jsx'

const items = [
  { title: '3rd Runner-up Young Scientist Competition 2021', level: 'Provincial', details: 'Environmental Science at Pudak Scientific', research: 'Bioethanol production from banana peels' },
  { title: 'Silver Medalist Research Essay Competition 2023', level: 'National', details: 'Soedirman Event of Animal Husbandry 7.0', research: 'Biodiesel from chicken fat with eggshell catalyst' },
  { title: '3rd Winner Agricultural Competition 2024', level: 'National', details: 'The Landformation at Universitas Padjadjaran', research: 'Biodegradation of petroleum contaminated soil' },
  { title: 'Best Staff at Committee Kabinet KM ITB Jatinangor 2024', level: 'Campus', details: 'Recognition for outstanding contribution' }
]

function Achievements() {
  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h2>Achievements</h2>
      <div className="grid-responsive">
        {items.map((a, i) => <AchievementCard key={i} {...a} />)}
      </div>
    </div>
  )
}

export default Achievements



