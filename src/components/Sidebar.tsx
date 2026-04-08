import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LanguageSelector from "./LanguageSelector";
import type { AppLanguage } from "../types";

interface Props {
  entryCount?: number;
  language?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  onSignOutClick?: () => void;
}

export default function Sidebar({
  entryCount = 0,
  language = "en",
  onLanguageChange,
  onSignOutClick,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isJournal = location.pathname === "/journal";
  const isPastSessions = location.pathname === "/past-sessions";
  const isInsights = location.pathname === "/insights";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/icons/logo.png" alt="MindShift" className="sidebar-logo" />
        <span className="sidebar-title">MindShift</span>
      </div>

      <div className="sidebar-user">
        Hey{" "}
        {user?.user_metadata?.full_name
          ? user.user_metadata.full_name.split(" ")[0]
          : user?.email?.split("@")[0]}
        !
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-btn ${isJournal && !isPastSessions ? "nav-active" : ""}`}
          onClick={() => navigate("/journal")}
        >
          ✏️ New Session
        </button>

        <button
          className={`nav-btn ${isPastSessions ? "nav-active" : ""}`}
          onClick={() => navigate("/past-sessions")}
        >
          📖 Past Sessions
          {entryCount > 0 && <span className="entry-count">{entryCount}</span>}
        </button>

        <button
          className={`nav-btn ${isInsights ? "nav-active" : ""}`}
          onClick={() => navigate("/insights")}
        >
          📈 Insights
        </button>

        {onLanguageChange && (
          <div className="sidebar-lang">
            <p className="sidebar-lang-label">Language</p>
            <LanguageSelector selected={language} onChange={onLanguageChange} />
          </div>
        )}
      </nav>

      <button className="signout-btn" onClick={onSignOutClick || signOut}>
        Sign Out
      </button>
    </aside>
  );
}
