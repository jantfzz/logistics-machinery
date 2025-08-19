import Timeline from '../components/ui/Timeline.jsx'
import ExperienceCard from '../components/sections/ExperienceCard.jsx'

const professional = [
  {
    title: 'Agricultural Microbiology Laboratory Assistant',
    subtitle: 'Institut Teknologi Bandung',
    date: 'Feb 2025 – Jun 2025',
    dateShort: '25',
    points: [
      'Assisted in 12 microbiological laboratory experiments',
      'Supported research contributing to 5+ research papers'
    ]
  },
  {
    title: 'Plants Sciences and Livestocks Laboratory Assistant',
    subtitle: 'Institut Teknologi Bandung',
    date: 'Aug 2024 – Dec 2024',
    dateShort: '24',
    points: [
      'Supported 10 laboratory experiments',
      'Maintained 100% safety record'
    ]
  },
  {
    title: 'Pancasila Assistant Lecturer',
    subtitle: 'Institut Teknologi Bandung',
    date: 'Jun 2024 – Dec 2024',
    dateShort: '24',
    points: [
      'Assisted 100+ TPB students',
      'Led TAPAK LIMAN project impacting 20+ local residents'
    ]
  }
]

const organizational = [
  { org: 'KPA-ITB', role: 'Treasurer & Head of Fundraising', duration: 'Jul 2024 – Aug 2025', points: ['Increased revenue by 60%', 'Managed team of 10+', '15% under-budget outcome'], tag: 'Leadership' },
  { org: 'KPA-ITB', role: 'Human Resources Officer', duration: 'Mar 2023 – Jul 2024', points: ['Increased team performance by 35%', 'Improved staff productivity by 50%'], tag: 'HR' },
  { org: 'Kabinet KM ITB', role: 'Publication Officer', duration: 'Jun 2024 – Dec 2024', points: ['Increased follower engagement by 40%', 'Reached 2,000+ members'] },
  { org: 'HIMAREKTA Agrifasco', role: 'Sponsorship Officer', duration: 'Oct 2023 – May 2024', points: ['Negotiated with 15+ sponsors', 'Secured 10% more sponsorship funds'] },
  { org: 'ParaJuara.id', role: 'Manager of Marketing', duration: 'May 2025 – Present', points: ['Increased engagement by 60%', '40% improvement in team performance'], tag: 'Marketing' }
]

function Experience() {
  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h2>Experience</h2>
      <div className="grid-responsive" style={{ alignItems: 'start' }}>
        <div>
          <h3>Professional</h3>
          <Timeline items={professional} />
        </div>
        <div>
          <h3>Organizational</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {organizational.map((e, i) => (
              <ExperienceCard key={i} {...e} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Experience



