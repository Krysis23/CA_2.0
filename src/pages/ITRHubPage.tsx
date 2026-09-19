// src/pages/ITRHubPage.tsx
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { Trash2, ArrowLeft } from "lucide-react"

// ── types ─────────────────────────────────────────────────────────────
interface RecentSession {
  id:       string
  date:     string   // ISO string stored in localStorage
  itrForm:  string | null
  fields:   number   // count of collected fields
  stage:    string
}

// ── local storage helpers ─────────────────────────────────────────────
const SESSIONS_KEY = "ca_agent_itr_sessions"

function loadSessions(): RecentSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ── entry point card ──────────────────────────────────────────────────
interface EntryCardProps {
  to:          string
  icon:        React.ReactNode
  title:       string
  description: string
  badge?:      string
  badgeColor?: "purple" | "teal" | "amber"
  cta:         string
  ctaColor:    "purple" | "teal"
}

function EntryCard({ to, icon, title, description, badge, badgeColor = "purple", cta, ctaColor }: EntryCardProps) {
  const badgeStyles = {
    purple: "bg-purple-500/15 text-purple-300",
    teal:   "bg-teal-500/15 text-teal-300",
    amber:  "bg-amber-500/15 text-amber-300",
  }
  const ctaStyles = {
    purple: "bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-600/20",
    teal:   "bg-teal-600 hover:bg-teal-500 text-white shadow-sm shadow-teal-600/20",
  }
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-border/80 hover:shadow-lg hover:shadow-black/10 transition-all">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        {badge && (
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <Link
        to={to}
        className={`mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5
                    rounded-xl text-sm font-medium transition-colors ${ctaStyles[ctaColor]}`}
      >
        {cta}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
        </svg>
      </Link>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────
export default function ITRHubPage() {
  const [sessions, setSessions] = useState<RecentSession[]>([])
  const currentYear             = new Date().getFullYear()
  const assessmentYear          = `AY ${currentYear}-${String(currentYear + 1).slice(2)}`

  useEffect(() => {
    setSessions(loadSessions().slice(0, 3)) // show last 3
  }, [])

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) {
        let allSessions = JSON.parse(raw);
        allSessions = allSessions.filter((s: any) => s.id !== id);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(allSessions));
        setSessions(allSessions.slice(0, 3));
      }
    } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── PAGE HEADER ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <Link to="/chat" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">ITR Hub</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Everything you need to file your Income Tax Return for {assessmentYear}
              </p>
            </div>
          </div>
        </div>

        {/* ── ENTRY POINTS ─────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            How would you like to proceed?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Chat assistant */}
            <EntryCard
              to="/itr-chat"
              badge="Recommended"
              badgeColor="purple"
              cta="Start guided filing"
              ctaColor="purple"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
                </svg>
              }
              title="ITR Filing Assistant"
              description="Chat with your CA assistant. It asks you questions, collects your documents, and builds your pre-fill PDF step by step. Best for first-time filers."
            />

            {/* Quick analyse */}
            <EntryCard
              to="/itr"
              badge="Fast"
              badgeColor="teal"
              cta="Quick analyse"
              ctaColor="teal"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
                </svg>
              }
              title="Quick ITR Analyse"
              description="Upload your bank statements and get an instant ITR checklist. No conversation needed — drop your documents and download the result in under 30 seconds."
            />

          </div>
        </div>

        {/* ── WHAT YOU NEED ─────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            What to keep ready before you start
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: "🪪", label: "PAN card",           note: "Your 10-digit PAN number" },
              { icon: "📄", label: "Form 16",            note: "From your employer (for salaried)" },
              { icon: "🏦", label: "Bank statements",    note: "Apr 2024 – Mar 2025" },
              { icon: "💰", label: "Form 26AS / AIS",    note: "Download from incometax.gov.in" },
              { icon: "🏠", label: "Home loan statement",note: "If you have a home loan (optional)" },
              { icon: "📊", label: "Investment proofs",  note: "80C, 80D, NPS, ELSS etc. (optional)" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                <span className="text-lg shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ITR FORM GUIDE ────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Which ITR form do I need?</h2>
          <div className="space-y-2">
            {[
              {
                form:  "ITR-1",
                label: "Sahaj",
                color: "bg-purple-500/15 text-purple-300",
                who:   "Salaried individual",
                rule:  "Income ≤ ₹50L, one house property max, no capital gains, no business income",
              },
              {
                form:  "ITR-2",
                label: "",
                color: "bg-teal-500/15 text-teal-300",
                who:   "Individual / HUF",
                rule:  "Income > ₹50L, or has capital gains, or foreign income — but no business income",
              },
              {
                form:  "ITR-3",
                label: "",
                color: "bg-amber-500/15 text-amber-300",
                who:   "Business owner / professional",
                rule:  "Has business or profession income, maintains full books of accounts",
              },
              {
                form:  "ITR-4",
                label: "Sugam",
                color: "bg-muted text-muted-foreground",
                who:   "Small business / freelancer",
                rule:  "Opts for presumptive taxation under Sec 44AD, 44ADA, or 44AE",
              },
            ].map((row, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${row.color}`}>
                    {row.form}
                  </span>
                  {row.label && (
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{row.who}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{row.rule}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Not sure? The filing assistant will determine this automatically from your documents.
          </p>
        </div>

        {/* ── RECENT SESSIONS ──────────────────────────────────── */}
        {sessions.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Recent sessions
            </h2>
            <div className="space-y-2">
              {sessions.map((s, i) => (
                <Link
                  key={i}
                  to={`/itr-chat?sessionId=${s.id}`}
                  className="flex items-center justify-between bg-card border border-border
                             rounded-xl px-4 py-3 hover:border-purple-500/40 hover:bg-purple-500/5
                             transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {s.itrForm ?? "Session in progress"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.fields} fields · {new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                      ${s.stage === "ready"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                      }`}>
                      {s.stage === "ready" ? "Complete" : "In progress"}
                    </span>
                    <button 
                      onClick={(e) => deleteSession(e, s.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCLAIMER ───────────────────────────────────────── */}
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-300/90 leading-relaxed">
            <strong>Disclaimer:</strong> CA Agent is a reference tool only. It does not file
            your ITR on any government portal. All generated values are estimates — verify
            with a qualified CA before submission. Tax laws may change; always cross-check
            with the official income tax portal at incometax.gov.in.
          </p>
        </div>

        <div className="pb-4" />
      </div>
    </div>
  )
}
