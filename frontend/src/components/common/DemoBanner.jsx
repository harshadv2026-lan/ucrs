import { AlertTriangle } from 'lucide-react'

export default function DemoBanner() {
  return (
    <div className="demo-banner">
      <AlertTriangle size={15} />
      <span>
        <strong>DEMO MODE:</strong> Sample data displayed. Connect Oracle database for live data.
        Demo login — Student: <strong>STU001 / student123</strong> | Faculty: <strong>1 / faculty123</strong> | Admin: <strong>admin / admin123</strong>
      </span>
    </div>
  )
}
