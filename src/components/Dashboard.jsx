import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";

const supabase = createClient(
  "https://fegsprzmlpjkxjxrvhnl.supabase.co",
  "sb_publishable_7NL58kuNpn00ii69txzvGg_P77QnJaq"
);

const SCORE_EMOJI = { gruen: "\u{1F7E2}", gelb: "\u{1F7E1}", rot: "\u{1F534}" };
const SCORE_COLOR = { gruen: "#008c46", gelb: "#cc7700", rot: "#cc3333" };
const SOURCE_LABELS = {
  stepstone: "StepStone",
  indeed: "Indeed",
  interamt: "Interamt",
  "berlin.de": "berlin.de",
  "bund.de": "bund.de",
};

const STATUS_CONFIG = {
  offen: { label: "Offen", color: "#999", bg: "#f5f5f5" },
  beworben: { label: "Beworben", color: "#0066cc", bg: "rgba(0,102,204,0.08)" },
  einladung: { label: "Einladung", color: "#008c46", bg: "rgba(0,140,70,0.08)" },
  absage: { label: "Absage", color: "#cc3333", bg: "rgba(204,51,51,0.08)" },
};

function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

function extractSkills(jobs) {
  const SKILL_PATTERNS = [
    { name: "SAP", pattern: /\bsap\b/i },
    { name: "Excel", pattern: /\bexcel\b/i },
    { name: "Controlling", pattern: /\bcontrolling\b/i },
    { name: "Reporting", pattern: /\breporting\b/i },
    { name: "Budgetierung", pattern: /\bbudgetierung\b/i },
    { name: "Power BI", pattern: /power\s?bi/i },
    { name: "SQL", pattern: /\bsql\b/i },
    { name: "Python", pattern: /\bpython\b/i },
    { name: "Kostenrechnung", pattern: /kostenrechnung/i },
    { name: "Fördermittel", pattern: /fördermittel/i },
    { name: "Projektcontrolling", pattern: /projektcontrolling/i },
    { name: "DATEV", pattern: /\bdatev\b/i },
    { name: "MS Office", pattern: /ms\s?office/i },
    { name: "ERP", pattern: /\berp\b/i },
    { name: "Tableau", pattern: /\btableau\b/i },
    { name: "VBA", pattern: /\bvba\b/i },
    { name: "ETL", pattern: /\betl\b/i },
    { name: "IFRS", pattern: /\bifrs\b/i },
    { name: "HGB", pattern: /\bhgb\b/i },
    { name: "Forecast", pattern: /\bforecast/i },
  ];
  const counts = {};
  for (const job of jobs) {
    const text = `${job.title || ""} ${job.description || ""}`;
    for (const { name, pattern } of SKILL_PATTERNS) {
      if (pattern.test(text)) counts[name] = (counts[name] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function groupByDate(jobs) {
  const groups = {};
  for (const job of jobs) {
    const date = job.scraped_at?.split("T")[0];
    if (date) groups[date] = (groups[date] || 0) + 1;
  }
  return Object.entries(groups)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// --- Shared styles ---
const monoLabel = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#bbb",
};

const cardStyle = {
  border: "1px solid #eee",
  padding: "20px 24px",
  background: "#fff",
};

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("alle");
  const [sourceFilter, setSourceFilter] = useState("alle");
  const [tab, setTab] = useState("jobs"); // "jobs" | "beworben"
  const [updatingId, setUpdatingId] = useState(null);
  const sectionRef = useRef(null);
  useInView(sectionRef);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("score", { ascending: false });
    if (!error && data) setJobs(data);
    setLoading(false);
  }

  async function markBeworben(jobId) {
    setUpdatingId(jobId);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("jobs")
      .update({ beworben: true, beworben_am: now, status: "beworben" })
      .eq("id", jobId);
    if (!error) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, beworben: true, beworben_am: now, status: "beworben" } : j
        )
      );
    }
    setUpdatingId(null);
  }

  async function updateStatus(jobId, newStatus) {
    setUpdatingId(jobId);
    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", jobId);
    if (!error) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
    }
    setUpdatingId(null);
  }

  const filteredJobs = jobs.filter((j) => {
    if (filter !== "alle" && j.score_label !== filter) return false;
    if (sourceFilter !== "alle" && j.source !== sourceFilter) return false;
    return true;
  });

  const beworbenJobs = jobs
    .filter((j) => j.beworben)
    .sort((a, b) => (b.beworben_am || "").localeCompare(a.beworben_am || ""));

  const skillData = extractSkills(jobs);
  const timeData = groupByDate(jobs);

  const stats = {
    total: jobs.length,
    gruen: jobs.filter((j) => j.score_label === "gruen").length,
    gelb: jobs.filter((j) => j.score_label === "gelb").length,
    rot: jobs.filter((j) => j.score_label === "rot").length,
    sources: [...new Set(jobs.map((j) => j.source))].length,
    beworben: beworbenJobs.length,
    einladungen: jobs.filter((j) => j.status === "einladung").length,
  };

  return (
    <section
      id="dashboard"
      ref={sectionRef}
      style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}
    >
      <div style={{ ...monoLabel, letterSpacing: "0.3em", color: "#008c46", marginBottom: 12 }}>
        04 — Arbeitsmarkt-Dashboard
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
        Berliner <span style={{ fontWeight: 700 }}>Controller-Markt</span>
      </h2>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 600 }}>
        Live-Daten aus StepStone, Indeed, Interamt, berlin.de & bund.de.
        Automatisches Scoring basierend auf meinem Profil.
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>...</div>
          Lade Daten aus Supabase...
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 48 }}>
            {[
              { label: "Gesamt", value: stats.total, color: "#111" },
              { label: "Top-Match", value: stats.gruen, color: "#008c46", emoji: "\u{1F7E2}" },
              { label: "Interessant", value: stats.gelb, color: "#cc7700", emoji: "\u{1F7E1}" },
              { label: "Beworben", value: stats.beworben, color: "#0066cc", emoji: "\u{1F4E8}" },
              { label: "Einladungen", value: stats.einladungen, color: "#008c46", emoji: "\u{1F389}" },
            ].map((s) => (
              <div key={s.label} style={cardStyle}>
                <div style={{ ...monoLabel, marginBottom: 8 }}>
                  {s.emoji && <span style={{ marginRight: 4 }}>{s.emoji}</span>}
                  {s.label}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 48 }}>
            <div style={{ border: "1px solid #eee", padding: 24 }}>
              <div style={{ ...monoLabel, marginBottom: 16 }}>Top 10 gefragte Skills</div>
              {skillData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={skillData} layout="vertical" margin={{ left: 80, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#aaa" }} />
                    <YAxis dataKey="skill" type="category" tick={{ fontSize: 11, fill: "#666" }} width={75} />
                    <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #eee", borderRadius: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                    <Bar dataKey="count" fill="#008c46" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: "#ccc", textAlign: "center", padding: 40 }}>Keine Skill-Daten</div>
              )}
            </div>
            <div style={{ border: "1px solid #eee", padding: 24 }}>
              <div style={{ ...monoLabel, marginBottom: 16 }}>Jobvolumen über Zeit</div>
              {timeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timeData} margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#aaa" }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: "#aaa" }} />
                    <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #eee", borderRadius: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                    <Line type="monotone" dataKey="count" stroke="#008c46" strokeWidth={2} dot={{ r: 3, fill: "#008c46" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: "#ccc", textAlign: "center", padding: 40 }}>Noch keine Zeitreihen-Daten</div>
              )}
            </div>
          </div>

          {/* Tabs: Jobs | Beworben */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #eee" }}>
            {[
              { key: "jobs", label: "Alle Jobs", count: jobs.length },
              { key: "beworben", label: "Beworben", count: beworbenJobs.length },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: tab === t.key ? "2px solid #008c46" : "2px solid transparent",
                  padding: "12px 24px",
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: tab === t.key ? 600 : 400,
                  color: tab === t.key ? "#111" : "#999",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {t.label}
                <span style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontFamily: "'Space Mono', monospace",
                  color: tab === t.key ? "#008c46" : "#ccc",
                }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab: Jobs */}
          {tab === "jobs" && (
            <>
              {/* Filter */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ ...monoLabel, marginRight: 8 }}>Filter:</span>
                {[
                  { key: "alle", label: "Alle" },
                  { key: "gruen", label: "\u{1F7E2} Top-Match" },
                  { key: "gelb", label: "\u{1F7E1} Interessant" },
                  { key: "rot", label: "\u{1F534} Wenig relevant" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    style={{
                      background: filter === f.key ? "#111" : "#fff",
                      color: filter === f.key ? "#fff" : "#666",
                      border: "1px solid #ddd",
                      padding: "6px 14px",
                      fontSize: 12,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
                <span style={{ width: 16 }} />
                {["alle", "stepstone", "indeed", "interamt", "berlin.de", "bund.de"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSourceFilter(s)}
                    style={{
                      background: sourceFilter === s ? "#008c46" : "#fff",
                      color: sourceFilter === s ? "#fff" : "#999",
                      border: "1px solid #eee",
                      padding: "4px 10px",
                      fontSize: 11,
                      fontFamily: "'Space Mono', monospace",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {s === "alle" ? "Alle Quellen" : SOURCE_LABELS[s] || s}
                  </button>
                ))}
              </div>

              <div style={{ ...monoLabel, fontSize: 10, marginBottom: 12 }}>
                {filteredJobs.length} Ergebnisse
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                {filteredJobs.slice(0, 50).map((job) => (
                  <div
                    key={job.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "36px 1fr 120px 80px 90px",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      border: `1px solid ${job.beworben ? "rgba(0,102,204,0.2)" : "#eee"}`,
                      background: job.beworben ? "rgba(0,102,204,0.02)" : "#fff",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = SCORE_COLOR[job.score_label] || "#ddd";
                      e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = job.beworben ? "rgba(0,102,204,0.2)" : "#eee";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Score */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16 }}>{SCORE_EMOJI[job.score_label] || "\u26AA"}</div>
                      <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: SCORE_COLOR[job.score_label] || "#999", fontWeight: 700 }}>
                        {job.score}
                      </div>
                    </div>

                    {/* Titel + Firma */}
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ minWidth: 0, textDecoration: "none", color: "inherit" }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {job.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                        {job.company} · {job.location}
                      </div>
                    </a>

                    {/* Quelle */}
                    <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#bbb", textAlign: "center", border: "1px solid #f0f0f0", padding: "2px 6px" }}>
                      {SOURCE_LABELS[job.source] || job.source}
                    </div>

                    {/* Status Badge */}
                    {job.beworben && (
                      <div style={{
                        fontSize: 10,
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 600,
                        color: STATUS_CONFIG[job.status]?.color || "#999",
                        background: STATUS_CONFIG[job.status]?.bg || "#f5f5f5",
                        padding: "3px 8px",
                        textAlign: "center",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        {STATUS_CONFIG[job.status]?.label || job.status}
                      </div>
                    )}

                    {/* Bewerben Button */}
                    {!job.beworben ? (
                      <button
                        onClick={() => markBeworben(job.id)}
                        disabled={updatingId === job.id}
                        style={{
                          background: "#0066cc",
                          color: "#fff",
                          border: "none",
                          padding: "6px 12px",
                          fontSize: 11,
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          cursor: updatingId === job.id ? "wait" : "pointer",
                          opacity: updatingId === job.id ? 0.6 : 1,
                          transition: "opacity 0.2s, transform 0.1s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => { if (updatingId !== job.id) e.target.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; }}
                      >
                        {updatingId === job.id ? "..." : "Bewerben"}
                      </button>
                    ) : (
                      <div style={{ width: 1 }} />
                    )}
                  </div>
                ))}
              </div>

              {filteredJobs.length > 50 && (
                <div style={{ textAlign: "center", padding: 20, fontSize: 12, color: "#aaa", fontFamily: "'Space Mono', monospace" }}>
                  + {filteredJobs.length - 50} weitere Jobs
                </div>
              )}
            </>
          )}

          {/* Tab: Beworben */}
          {tab === "beworben" && (
            <>
              {beworbenJobs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{"\u{1F4E8}"}</div>
                  <div style={{ fontSize: 14 }}>Noch keine Bewerbungen.</div>
                  <div style={{ fontSize: 12, color: "#ccc", marginTop: 8 }}>
                    Klicke bei einem Job auf "Bewerben" um ihn hier zu tracken.
                  </div>
                </div>
              ) : (
                <>
                  {/* Bewerbungs-Statistik */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
                    {[
                      { label: "Beworben", value: beworbenJobs.filter((j) => j.status === "beworben").length, color: "#0066cc" },
                      { label: "Einladung", value: beworbenJobs.filter((j) => j.status === "einladung").length, color: "#008c46" },
                      { label: "Absage", value: beworbenJobs.filter((j) => j.status === "absage").length, color: "#cc3333" },
                      { label: "Quote", value: beworbenJobs.length > 0 ? Math.round((beworbenJobs.filter((j) => j.status === "einladung").length / beworbenJobs.length) * 100) + "%" : "–", color: "#111" },
                    ].map((s) => (
                      <div key={s.label} style={{ ...cardStyle, padding: "16px 20px" }}>
                        <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>{s.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Beworbene Jobs Liste */}
                  <div style={{ display: "grid", gap: 10 }}>
                    {beworbenJobs.map((job) => (
                      <div
                        key={job.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "36px 1fr 140px 130px",
                          alignItems: "center",
                          gap: 16,
                          padding: "16px 20px",
                          border: `1px solid ${STATUS_CONFIG[job.status]?.color || "#eee"}22`,
                          background: STATUS_CONFIG[job.status]?.bg || "#fff",
                          transition: "box-shadow 0.2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                      >
                        {/* Score */}
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 16 }}>{SCORE_EMOJI[job.score_label] || "\u26AA"}</div>
                          <div style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: SCORE_COLOR[job.score_label], fontWeight: 700 }}>
                            {job.score}
                          </div>
                        </div>

                        {/* Info */}
                        <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ minWidth: 0, textDecoration: "none", color: "inherit" }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {job.title}
                          </div>
                          <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                            {job.company} · {SOURCE_LABELS[job.source] || job.source}
                          </div>
                          <div style={{ fontSize: 11, color: "#bbb", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>
                            Beworben am {job.beworben_am ? new Date(job.beworben_am).toLocaleDateString("de-DE") : "–"}
                          </div>
                        </a>

                        {/* Datum */}
                        <div style={{ fontSize: 12, color: "#aaa", textAlign: "center" }}>
                          {job.beworben_am ? (
                            <>
                              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
                                {Math.floor((Date.now() - new Date(job.beworben_am).getTime()) / 86400000)}
                              </span>
                              <span style={{ fontSize: 10, color: "#ccc" }}> Tage her</span>
                            </>
                          ) : "–"}
                        </div>

                        {/* Status Dropdown */}
                        <select
                          value={job.status}
                          onChange={(e) => updateStatus(job.id, e.target.value)}
                          disabled={updatingId === job.id}
                          style={{
                            appearance: "none",
                            WebkitAppearance: "none",
                            background: STATUS_CONFIG[job.status]?.bg || "#f5f5f5",
                            color: STATUS_CONFIG[job.status]?.color || "#666",
                            border: `1px solid ${STATUS_CONFIG[job.status]?.color || "#ddd"}33`,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 600,
                            cursor: "pointer",
                            textAlign: "center",
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 8px center",
                            paddingRight: 28,
                          }}
                        >
                          <option value="beworben">Beworben</option>
                          <option value="einladung">Einladung</option>
                          <option value="absage">Absage</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
