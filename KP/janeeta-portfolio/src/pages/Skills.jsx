import Card from '../components/ui/Card.jsx'
import SkillBar from '../components/sections/SkillBar.jsx'

function Skills() {
  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h2>Skills</h2>
      <div className="grid-responsive">
        <Card>
          <h3>Technical Skills</h3>
          <SkillBar label="Python" percent={80} />
          <SkillBar label="C++" percent={60} />
          <SkillBar label="SQL" percent={65} />
          <SkillBar label="Power BI" percent={70} />
        </Card>
        <Card>
          <h3>Tools & Software</h3>
          <SkillBar label="Microsoft Office" percent={85} />
          <SkillBar label="Google Workspace" percent={85} />
          <SkillBar label="Project Management" percent={75} />
          <SkillBar label="Graphic Design & Videography" percent={65} />
        </Card>
        <Card>
          <h3>Languages</h3>
          <SkillBar label="Indonesian" percent={100} />
          <SkillBar label="English (IELTS 6.5)" percent={80} />
        </Card>
      </div>
    </div>
  )
}

export default Skills



