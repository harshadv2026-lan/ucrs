export default function LoadingSpinner({ message = 'Loading...', size = 'default' }) {
  return (
    <div className="loading-container">
      <div className={`loading-spinner ${size === 'sm' ? 'sm' : ''}`} />
      {message && <p className="loading-text">{message}</p>}
    </div>
  )
}
