import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useJournal } from "../hooks/useJournal";
import { getChatResponse, getSessionSummary, checkRateLimit } from "../lib/ai";
import { retrieveRelevantEntries, isCrisisEntry } from "../lib/retrieval";
import MoodSelector from "../components/MoodSelector";
import CrisisSupport from "../components/CrisisSupport";
import type { ChatMessage } from "../types";
import { getWelcomeMessage } from "../lib/welcome";
import Sidebar from "../components/Sidebar";
import ConfirmModal from "../components/ConfirmModal";
import GuidedPrompts from "../components/GuidedPrompts";
import { useLanguage } from "../hooks/useLanguage";
import { OPENING_MESSAGES, UI_STRINGS } from "../lib/languages";

type SessionState = "mood" | "chatting" | "ending" | "ended";

const MOOD_EMOJIS = ["", "😞", "😕", "😐", "🙂", "😊"];

export default function JournalPage() {
  const { user, signOut } = useAuth();
  const { entries, loadingEntries, fetchEntries, saveEntry } = useJournal(
    user?.id ?? "",
  );

  const [sessionState, setSessionState] = useState<SessionState>("mood");
  const [mood, setMood] = useState(3);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCrisis, setIsCrisis] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [welcomeLoading, setWelcomeLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { language, setLanguage } = useLanguage();
  const ui = UI_STRINGS[language];

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) fetchEntries();
  }, [user?.id]);

  useEffect(() => {
    // Don't run until entries have actually been fetched
    // loadingEntries === false means fetch is complete
    if (loadingEntries) return;

    const loadWelcome = async () => {
      setWelcomeLoading(true);
      const msg = await getWelcomeMessage(entries);
      setWelcomeMessage(msg);
      setWelcomeLoading(false);
    };

    loadWelcome();
  }, [loadingEntries]); // ← runs when loading state changes, not entries

  // Update opening message if language changes before user sends first message
  useEffect(() => {
    if (sessionState === "chatting" && messages.length === 1) {
      // Only the AI opening message exists — safe to update it
      setMessages([
        {
          role: "assistant",
          content: OPENING_MESSAGES[language],
          timestamp: new Date(),
        },
      ]);
    }
  }, [language]);

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSignOutClick = () => {
    // If session is actively in progress — warn them
    if (sessionState === "chatting" && messages.length > 1) {
      setShowDiscardModal(true);
    } else {
      // No active session — just confirm sign out
      setShowSignOutModal(true);
    }
  };

  const handleSaveAndSignOut = async () => {
    setShowDiscardModal(false);
    // Save the session first, then sign out
    await endSession();
    signOut();
  };

  const startSession = () => {
    setSessionState("chatting");
    const openingMessage = OPENING_MESSAGES[language];
    setMessages([
      {
        role: "assistant",
        content: openingMessage,
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    if (!checkRateLimit(user!.id)) {
      setError(
        "You've reached today's limit of 20 messages. Come back tomorrow 🌱",
      );
      setLoading(false);
      return;
    }

    const userText = input.trim();
    setInput("");
    setError("");

    // Crisis check first
    if (isCrisisEntry(userText)) {
      setIsCrisis(true);
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const relevantPast = retrieveRelevantEntries(userText, entries);
      const response = await getChatResponse(
        updatedMessages,
        relevantPast,
        language,
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      const msg =
        err.message?.includes("429") || err.message?.includes("rate")
          ? "Taking a short break — please wait a moment and try again 🙏"
          : "Connection issue — please try again.";
      setError(msg);
    }

    setLoading(false);
  };

  const endSession = async () => {
    if (messages.length < 3) return; // need at least one exchange
    setSessionState("ending");

    try {
      // Generate a summary of the whole conversation
      const summary = await getSessionSummary(messages);

      // Format full conversation as readable text for storage
      const fullConversation = messages
        .map((m) => `${m.role === "user" ? "You" : "MindShift"}: ${m.content}`)
        .join("\n\n");

      await saveEntry(fullConversation, summary, mood);
      setSessionState("ended");
    } catch {
      setError("Could not save session. Please try again.");
      setSessionState("chatting");
    }
  };

  const startNewSession = () => {
    setSessionState("mood");
    setMood(3);
    setMessages([]);
    setInput("");
    setIsCrisis(false);
    setError("");
    setShowHistory(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredEntries =
    searchQuery.trim() === ""
      ? entries
      : entries.filter(
          (entry) =>
            entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.ai_response.toLowerCase().includes(searchQuery.toLowerCase()),
        );

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return <>{text}</>;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="search-highlight">
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  return (
    <div className="journal-layout">
      {/* Sidebar */}
      <Sidebar
        entryCount={entries.length}
        onNewSession={startNewSession}
        onPastSessions={() => setShowHistory(true)}
        showHistory={showHistory}
        onSignOut={handleSignOutClick}
        language={language}
        onLanguageChange={setLanguage}
      />

      <main className="journal-main">
        {!showHistory ? (
          <>
            {/* Step 1 — Pick mood before starting */}
            {sessionState === "mood" && (
              <div className="session-start animate-in">
                <div className="welcome-block">
                  {welcomeLoading ? (
                    <div className="welcome-loading">
                      <div className="spinner" />
                    </div>
                  ) : (
                    <p className="welcome-message">{welcomeMessage}</p>
                  )}
                </div>

                <div className="journal-header">
                  <h2 className="journal-title">{ui.howFeeling}</h2>
                  <p className="journal-subtitle">
                    Take a second to check in with yourself before we talk.
                  </p>
                </div>

                <MoodSelector selected={mood} onChange={setMood} />

                <button className="submit-btn" onClick={startSession}>
                  {ui.startSession}
                </button>
              </div>
            )}

            {/* Step 2 — Chat */}
            {(sessionState === "chatting" || sessionState === "ending") && (
              <div className="chat-container">
                <div className="chat-header">
                  <span className="chat-mood-badge">
                    {MOOD_EMOJIS[mood]} Feeling{" "}
                    {
                      [
                        "",
                        "really rough",
                        "not great",
                        "okay",
                        "pretty good",
                        "great",
                      ][mood]
                    }
                  </span>
                  {messages.length >= 3 && sessionState === "chatting" && (
                    <button className="end-session-btn" onClick={endSession}>
                      {ui.endSession}
                    </button>
                  )}
                </div>

                {/* Crisis override */}
                {isCrisis ? (
                  <div className="chat-crisis">
                    <CrisisSupport />
                    <button
                      className="btn-ghost mt"
                      onClick={() => setIsCrisis(false)}
                    >
                      ← Continue session
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Messages */}
                    <div className="chat-messages">
                      {messages.map((msg, i) => (
                        <div
                          key={i}
                          className={`chat-bubble-wrap ${msg.role === "user" ? "user-wrap" : "ai-wrap"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="chat-avatar">
                              <img src="/icons/logo.png" alt="MindShift" />
                            </div>
                          )}
                          <div
                            className={`chat-bubble ${msg.role === "user" ? "bubble-user" : "bubble-ai"}`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}

                      {loading && (
                        <div className="chat-bubble-wrap ai-wrap">
                          <div className="chat-avatar">
                            <img src="/icons/logo.png" alt="MindShift" />
                          </div>

                          <div className="chat-bubble bubble-ai typing-indicator">
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      )}

                      {error && <p className="journal-error">{error}</p>}
                      <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    {sessionState === "chatting" && (
                      <div className="chat-input-area">
                        {messages.length === 1 && <GuidedPrompts />}
                        <textarea
                          className="chat-input"
                          placeholder={ui.typeHere}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          rows={2}
                          disabled={loading}
                        />
                        <button
                          className="chat-send-btn"
                          onClick={sendMessage}
                          disabled={loading || !input.trim()}
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3 — Session saved */}
            {sessionState === "ended" && (
              <div className="session-ended animate-in">
                <div className="ended-icon">💙</div>
                <h2 className="journal-title">{ui.sessionSaved}</h2>
                <p className="journal-subtitle">
                  Taking time to reflect takes courage. See you next time.
                </p>
                <button className="submit-btn" onClick={startNewSession}>
                  {ui.startNew}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Past sessions */

          <div className="history-view">
            <h2 className="journal-title">Past Sessions</h2>
            <p className="journal-subtitle">{entries.length} sessions so far</p>

            {/* 🔍 Search bar */}
            <div className="search-wrap">
              <input
                className="search-input"
                type="text"
                placeholder="Search your sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Results count */}
            {searchQuery && (
              <p className="search-results-count">
                {filteredEntries.length === 0
                  ? "No sessions found"
                  : `${filteredEntries.length} session${
                      filteredEntries.length === 1 ? "" : "s"
                    } found`}
              </p>
            )}

            {/* Empty / Results */}
            {filteredEntries.length === 0 && !searchQuery ? (
              <div className="empty-history">
                No sessions yet. Start your first one! 🌱
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="empty-history">
                Nothing found for "{searchQuery}" 🔍
              </div>
            ) : (
              <div className="entries-list">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="entry-card">
                    <div className="entry-meta">
                      <span className="entry-date">
                        {formatDate(entry.created_at)}
                      </span>
                      <span className="entry-mood">
                        {MOOD_EMOJIS[entry.mood_score]}
                      </span>
                    </div>

                    <div className="entry-ai">
                      <p className="entry-ai-label">SESSION SUMMARY</p>
                      <p className="entry-ai-text">
                        {highlightText(entry.ai_response, searchQuery)}
                      </p>
                    </div>

                    <details className="entry-details">
                      <summary className="entry-details-toggle">
                        Read full conversation
                      </summary>
                      <p className="entry-content">{entry.content}</p>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {/* Simple sign out confirmation — no active session */}
      {showSignOutModal && (
        <ConfirmModal
          title="Sign out?"
          message="You'll need to log back in to access your journal."
          confirmLabel="Yes, sign out"
          cancelLabel="Stay"
          danger={true}
          onConfirm={signOut}
          onCancel={() => setShowSignOutModal(false)}
        />
      )}

      {/* Active session warning */}
      {showDiscardModal && (
        <ConfirmModal
          title="You have an unsaved session"
          message="If you leave now your conversation will be lost. Do you want to save it first?"
          confirmLabel="Save & Sign Out"
          cancelLabel="Stay"
          onConfirm={handleSaveAndSignOut}
          onCancel={() => setShowDiscardModal(false)}
        />
      )}
    </div>
  );
}
