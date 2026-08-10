import { Navbar } from '../components/landing/Navbar'
import { Hero } from '../components/landing/Hero'
import { InteractiveDemo } from '../components/landing/InteractiveDemo'
import { ProblemSolution } from '../components/landing/ProblemSolution'
import { Features } from '../components/landing/Features'
import { QdrantSection } from '../components/landing/QdrantSection'
import { RimeSection } from '../components/landing/RimeSection'
import { HowItWorks } from '../components/landing/HowItWorks'
import { TrustSection } from '../components/landing/TrustSection'
import { TechArchitecture } from '../components/landing/TechArchitecture'
import { LandingCTA, Footer } from '../components/landing/LandingCTA'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-nuvia-bg">
      <Navbar />
      <Hero />
      <InteractiveDemo />
      <ProblemSolution />
      <Features />
      <QdrantSection />
      <RimeSection />
      <HowItWorks />
      <TrustSection />
      <TechArchitecture />
      <LandingCTA />
      <Footer />
    </div>
  )
}
