import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import DepartmentDashboard from './pages/DepartmentDashboard'
import BotDetails from './pages/BotDetails'
import OrgTreeView from './pages/OrgTreeView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/department/:id" element={<DepartmentDashboard />} />
      <Route path="/dashboard/:name" element={<DepartmentDashboard />} />
      <Route path="/bot/:id" element={<BotDetails />} />
      <Route path="/tree" element={<OrgTreeView />} />
    </Routes>
  )
}

export default App
