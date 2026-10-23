import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import DemoBanner from '../common/DemoBanner.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function StudentLayout() {
  const { isDemo } = useAuth()
  return (
    <>
      {isDemo && <DemoBanner />}
      <Sidebar isDemo={isDemo} />
      <main className={`main-content ${isDemo ? 'demo-offset' : ''}`}>
        <Outlet />
      </main>
    </>
  )
}
