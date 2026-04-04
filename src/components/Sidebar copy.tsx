import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LanguageSelector from './LanguageSelector'
import type { AppLanguage } from '../types'


interface Props {
  entryCount?: number
  onNewSession?: () => void
  onPastSessions?: () => void
  showHistory?: boolean
  onSignOut?: () => void
  language?: AppLanguage
  onLanguageChange?: (lang: AppLanguage) => void
}

export default function Sidebar({
  entryCount = 0,
  onNewSession,
  onPastSessions,
  showHistory = false,
  onSignOut,
   language = 'en',
  onLanguageChange
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()

  const isJournal = location.pathname === '/journal'
  const isInsights = location.pathname === '/insights'

  const handleSignOut = onSignOut ?? signOut

  

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
  <img src="/icons/logo.png" alt="MindShift" className="sidebar-logo" />
  <span className="sidebar-title">MindShift</span>
</div>

      {/* Show user's name if available, fallback to email */}
      <div className="sidebar-user"> Hey {user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : user?.email}!
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${isJournal && !showHistory ? 'nav-active' : ''}`}
          onClick={() => {
            if (isJournal) onNewSession?.()
            else navigate('/journal')
          }}
        >
          ✏️ New Session
        </button>

        <button
          className={`nav-btn ${isJournal && showHistory ? 'nav-active' : ''}`}
          onClick={() => {
            if (isJournal) onPastSessions?.()
            else { navigate('/journal') }
          }}
        >
          📖 Past Sessions
          {entryCount > 0 && (
            <span className="entry-count">{entryCount}</span>
          )}
        </button>

        <button
          className={`nav-btn ${isInsights ? 'nav-active' : ''}`}
          onClick={() => navigate('/insights')}
        >
          📈 Insights
        </button>

    {/* Language selector */}
{onLanguageChange && (
  <div className="sidebar-lang">
    <p className="sidebar-lang-label">Language</p>
    <LanguageSelector
      selected={language}
      onChange={onLanguageChange}
    />
  </div>
)}

      </nav>

  


      <button className="signout-btn" onClick={handleSignOut}>
        Sign Out
      </button>
    </aside>
  )
}