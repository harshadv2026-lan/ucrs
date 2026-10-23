import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
}

export default function AlertMessage({ type = 'info', message, onClose }) {
  const Icon = icons[type] || Info
  if (!message) return null
  return (
    <div className={`alert alert-${type}`}>
      <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>
      )}
    </div>
  )
}
