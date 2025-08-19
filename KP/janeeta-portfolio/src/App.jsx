import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/common/Header.jsx'
import Footer from './components/common/Footer.jsx'
import Navigation from './components/common/Navigation.jsx'
import Loading from './components/common/Loading.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Experience = lazy(() => import('./pages/Experience.jsx'))
const Achievements = lazy(() => import('./pages/Achievements.jsx'))
const Skills = lazy(() => import('./pages/Skills.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Projects = lazy(() => import('./pages/Projects.jsx'))

function App() {
  return (
    <div className="app-root">
      <Header />
      <Navigation />
      <main id="main-content" role="main">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default App
