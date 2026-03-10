import { useState, useEffect, useRef } from "react";
import Dashboard from "./components/Dashboard";
import FoerdermittelPipeline from "./components/FoerdermittelPipeline";
import Automatisierung from "./components/Automatisierung";
import Lernpfad from "./components/Lernpfad";

const SECTIONS = ["hero", "profil", "projekte", "skills", "dashboard", "foerdermittel", "automatisierung", "lernpfad"];

const projects = [
  {
    title: "Berliner Arbeitsmarkt-Dashboard",
    status: "Live",
    tags: ["Power BI", "DAX", "Python", "Data Visualization"],
    description:
      "Interaktives Dashboard zur Analyse von Controller-Stellenanzeigen in Berlin. Visualisierung von Gehaltsstrukturen, gefragten Skills und Branchentrends.",
    icon: "📊",
    link: "dashboard",
  },
  {
    title: "Fördermittel-Daten-Pipeline",
    status: "Live",
    tags: ["ETL", "Zuwendungsrecht", "NKBF 2017", "profi-Online"],
    description:
      "ETL-Prozess für BMBF/BMWK-Förderprojekte. Vom Rohdaten-Import (Excel, SAP, profi-Online) über Validierung gegen den Finanzierungsplan bis zur automatisierten Fehlererkennung und Dokumentenausgabe.",
    icon: "⚙️",
    link: "foerdermittel",
  },
  {
    title: "Prozessautomatisierung Fördermittel",
    status: "Live",
    tags: ["Prozessanalyse", "Automatisierung", "ROI", "Zuwendungsrecht"],
    description:
      "Analyse von 15 manuellen Prozessen im Fördermittel-Controlling mit konkreten Automatisierungsvorschlägen. 93% Effizienzgewinn, ~47 Arbeitstage Einsparung pro Projekt/Jahr.",
    icon: "🔄",
    link: "automatisierung",
  },
];

const skillCategories = [
  {
    category: "Controlling & Finance",
    skills: [
      { name: "Projektcontrolling", level: 95 },
      { name: "Fördermittelmanagement", level: 90 },
      { name: "Budgetierung & Reporting", level: 90 },
      { name: "Deckungsbeitragsrechnung", level: 85 },
      { name: "Investitionsanalyse", level: 80 },
    ],
  },
  {
    category: "Data & Technologie",
    skills: [
      { name: "Power BI / DAX", level: 40, learning: true },
      { name: "Python", level: 60 },
      { name: "SQL", level: 65 },
      { name: "Machine Learning", level: 45 },
      { name: "ETL / Data Engineering", level: 55 },
    ],
  },
  {
    category: "Business & Soft Skills",
    skills: [
      { name: "Prozessoptimierung", level: 85 },
      { name: "Beratung & Stakeholder Mgmt", level: 85 },
      { name: "Unternehmerisches Denken", level: 90 },
      { name: "Analytisches Arbeiten", level: 95 },
    ],
  },
];

const timeline = [
  { year: "2023–2025", role: "Projektcontroller Fördermittelmanagement", company: "VDI/VDE Innovation + Technik GmbH", highlight: true },
  { year: "2021–2023", role: "Selbstständigkeit – Immobilienentwicklung", company: "Berlin" },
  { year: "2021", role: "Weiterbildung Data Science", company: "Alfa Training, Berlin" },
  { year: "2019–2020", role: "Unternehmensentwicklung & Kundendienst", company: "SwitchUp GmbH" },
  { year: "2017–2019", role: "Gründer – Digitale Künstlerplattform", company: "YAA, Berlin" },
  { year: "2010–2016", role: "Projekt- & Produktcontroller", company: "Krones AG", highlight: true },
  { year: "2008–2009", role: "Praktikum & Diplomarbeit Controlling", company: "Continental Automotive" },
];

function SkillBar({ name, level, learning, visible }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#333", letterSpacing: "0.02em" }}>
          {name}
          {learning && (
            <span style={{
              marginLeft: 8,
              fontSize: 10,
              background: "rgba(0,140,70,0.08)",
              color: "#008c46",
              padding: "2px 8px",
              borderRadius: 3,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              Lernphase
            </span>
          )}
        </span>
        <span style={{ fontSize: 12, color: "#aaa", fontFamily: "monospace" }}>{level}%</span>
      </div>
      <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: visible ? `${level}%` : "0%",
            background: learning
              ? "linear-gradient(90deg, #008c46, #00b35a)"
              : `linear-gradient(90deg, #111 ${Math.max(0, level - 30)}%, #999)`,
            borderRadius: 2,
            transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  );
}

function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.15 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("hero");
  const [scrollY, setScrollY] = useState(0);
  const skillsRef = useRef(null);
  const skillsVisible = useInView(skillsRef);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const sections = SECTIONS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return { id, top: 0 };
        return { id, top: el.getBoundingClientRect().top };
      });
      const current = sections.filter((s) => s.top <= 200).pop();
      if (current) setActiveSection(current.id);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const navLabels = { hero: "Start", profil: "Profil", projekte: "Projekte", skills: "Skills", dashboard: "Dashboard", foerdermittel: "Fördermittel", automatisierung: "Automatisierung", lernpfad: "Lernpfad" };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#ffffff",
      color: "#222",
      minHeight: "100vh",
      overflowX: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: scrollY > 50 ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(0,0,0,0.06)" : "none",
        transition: "all 0.4s ease",
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "#111",
          cursor: "pointer",
        }} onClick={() => scrollTo("hero")}>
          C<span style={{ color: "#008c46" }}>.</span>Z
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {SECTIONS.map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: "none",
                border: "none",
                color: activeSection === id ? "#008c46" : "#999",
                fontSize: 12,
                fontFamily: "'Space Mono', monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: "4px 0",
                borderBottom: activeSection === id ? "1px solid #008c46" : "1px solid transparent",
                transition: "all 0.3s ease",
              }}
            >
              {navLabels[id]}
            </button>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: "#fafafa",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: `translateY(${scrollY * 0.1}px)`,
        }} />
        <div style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,140,70,0.06) 0%, transparent 70%)",
          top: "20%",
          right: "-10%",
          filter: "blur(80px)",
          transform: `translateY(${scrollY * -0.15}px)`,
        }} />

        <div style={{ textAlign: "center", zIndex: 1, padding: "0 24px", maxWidth: 800 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#008c46",
            marginBottom: 24,
            opacity: 0,
            animation: "fadeInUp 0.8s 0.2s forwards",
          }}>
            Controlling × Data Science × KI
          </div>
          <h1 style={{
            fontSize: "clamp(36px, 7vw, 72px)",
            fontWeight: 300,
            lineHeight: 1.1,
            margin: "0 0 20px",
            color: "#111",
            opacity: 0,
            animation: "fadeInUp 0.8s 0.4s forwards",
          }}>
            Christoph<br />
            <span style={{ fontWeight: 700 }}>Zapp</span>
          </h1>
          <p style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            fontWeight: 300,
            color: "#777",
            maxWidth: 520,
            margin: "0 auto 40px",
            lineHeight: 1.7,
            opacity: 0,
            animation: "fadeInUp 0.8s 0.6s forwards",
          }}>
            Controller mit 15+ Jahren Erfahrung, der die Brücke zwischen
            klassischem Finanzcontrolling und modernen Daten-Technologien baut.
          </p>
          <div style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            opacity: 0,
            animation: "fadeInUp 0.8s 0.8s forwards",
          }}>
            <button
              onClick={() => scrollTo("projekte")}
              style={{
                background: "#111",
                color: "#fff",
                border: "none",
                padding: "12px 28px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
            >
              Projekte ansehen
            </button>
            <button
              onClick={() => scrollTo("profil")}
              style={{
                background: "transparent",
                color: "#333",
                border: "1px solid rgba(0,0,0,0.15)",
                padding: "12px 28px",
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.04em",
                cursor: "pointer",
                transition: "border-color 0.3s",
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = "#008c46"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.15)"; }}
            >
              Über mich
            </button>
          </div>
        </div>
      </section>

      {/* PROFIL */}
      <section id="profil" style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#008c46",
          marginBottom: 12,
        }}>
          01 — Profil
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 48, lineHeight: 1.3 }}>
          Wo Controlling auf<br /><span style={{ fontWeight: 700 }}>Technologie</span> trifft
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 64 }}>
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#666", marginBottom: 20 }}>
              Mit über 15 Jahren Erfahrung in Controlling, Fördermittelmanagement und
              Unternehmenssteuerung bringe ich ein tiefes Verständnis für finanzielle
              Zusammenhänge mit. Bei der <strong style={{ color: "#222" }}>Krones AG</strong> habe
              ich sechs Jahre lang komplexe Projekte im Life Cycle Service gesteuert.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#666" }}>
              Zuletzt war ich bei <strong style={{ color: "#222" }}>VDI/VDE Innovation + Technik</strong> im
              Fördermittelmanagement für Ministerien und öffentliche Auftraggeber tätig –
              an der Schnittstelle von Finanzkontrolle und Innovation.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#666", marginBottom: 20 }}>
              Was mich antreibt: Die Brücke zwischen klassischem Controlling und moderner
              Datenanalyse zu schlagen. Mit meiner <strong style={{ color: "#222" }}>Data-Science-Ausbildung</strong> in
              Python, Machine Learning und Big Data ergänze ich betriebswirtschaftliche
              Expertise um technologische Kompetenz.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#666" }}>
              Durch eigene Gründungen in Immobilien und Kulturförderung bringe ich
              unternehmerisches Denken mit, das über reine Zahlenarbeit hinausgeht.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#bbb",
          marginBottom: 24,
        }}>
          Werdegang
        </div>
        <div style={{ borderLeft: "1px solid #e0e0e0", paddingLeft: 32 }}>
          {timeline.map((item, i) => (
            <div key={i} style={{
              marginBottom: 24,
              position: "relative",
              opacity: item.highlight ? 1 : 0.6,
            }}>
              <div style={{
                position: "absolute",
                left: -37,
                top: 6,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: item.highlight ? "#008c46" : "#ccc",
                border: item.highlight ? "2px solid rgba(0,140,70,0.2)" : "none",
              }} />
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: item.highlight ? "#008c46" : "#aaa",
                marginBottom: 4,
              }}>
                {item.year}
              </div>
              <div style={{ fontSize: 15, color: "#222", fontWeight: 500, marginBottom: 2 }}>
                {item.role}
              </div>
              <div style={{ fontSize: 13, color: "#999" }}>{item.company}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROJEKTE */}
      <section id="projekte" style={{
        padding: "120px 32px",
        maxWidth: 1000,
        margin: "0 auto",
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#008c46",
          marginBottom: 12,
        }}>
          02 — Projekte
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
          Showcase<span style={{ fontWeight: 700 }}> Portfolio</span>
        </h2>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 500 }}>
          Praxisprojekte, die Controlling-Denken und moderne Datenanalyse verbinden.
        </p>

        <div style={{ display: "grid", gap: 20 }}>
          {projects.map((project, i) => (
            <div
              key={i}
              onClick={() => project.link && scrollTo(project.link)}
              style={{
                border: "1px solid #eee",
                padding: 32,
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color 0.3s, background 0.3s, box-shadow 0.3s",
                background: "#fff",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ddd"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#eee"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 28, marginRight: 16 }}>{project.icon}</span>
                  <span style={{ fontSize: 20, fontWeight: 500, color: "#111", verticalAlign: "middle" }}>
                    {project.title}
                  </span>
                </div>
                <span style={{
                  fontSize: 10,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: project.status === "Live" ? "#008c46" : "#cc7700",
                  background: project.status === "Live" ? "rgba(0,140,70,0.06)" : "rgba(204,119,0,0.06)",
                  padding: "4px 10px",
                  whiteSpace: "nowrap",
                }}>
                  {project.status}
                </span>
              </div>
              <p style={{ fontSize: 14, color: "#777", lineHeight: 1.7, marginBottom: 16 }}>
                {project.description}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {project.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: 11,
                    fontFamily: "'Space Mono', monospace",
                    color: "#999",
                    border: "1px solid #e8e8e8",
                    padding: "3px 10px",
                    letterSpacing: "0.02em",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SKILLS */}
      <section id="skills" ref={skillsRef} style={{
        padding: "120px 32px",
        maxWidth: 1000,
        margin: "0 auto",
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#008c46",
          marginBottom: 12,
        }}>
          03 — Skills & Technologien
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 48, lineHeight: 1.3 }}>
          Kompetenzen im<span style={{ fontWeight: 700 }}> Überblick</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40 }}>
          {skillCategories.map((cat) => (
            <div key={cat.category}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#bbb",
                marginBottom: 20,
                paddingBottom: 10,
                borderBottom: "1px solid #f0f0f0",
              }}>
                {cat.category}
              </div>
              {cat.skills.map((skill) => (
                <SkillBar
                  key={skill.name}
                  name={skill.name}
                  level={skill.level}
                  learning={skill.learning}
                  visible={skillsVisible}
                />
              ))}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 64,
          padding: 32,
          border: "1px solid #eee",
          background: "rgba(0,140,70,0.02)",
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <span style={{ fontSize: 24 }}>🎯</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 8 }}>
                Aktuelle Lernziele
              </div>
              <p style={{ fontSize: 14, color: "#777", lineHeight: 1.7, margin: 0 }}>
                Power BI & DAX vertiefen • Python für Finance-Automatisierung auffrischen •
                KI-Tools für Controlling-Prozesse evaluieren und integrieren
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <Dashboard />

      {/* FÖRDERMITTEL-PIPELINE */}
      <FoerdermittelPipeline />

      {/* PROZESSAUTOMATISIERUNG */}
      <Automatisierung />

      {/* LERNPFAD */}
      <Lernpfad />

      {/* FOOTER */}
      <footer style={{
        padding: "48px 32px",
        borderTop: "1px solid #f0f0f0",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          color: "#ccc",
          letterSpacing: "0.05em",
        }}>
          © 2025 Christoph Zapp — Berlin
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(0,140,70,0.15); }
        @media (max-width: 768px) {
          section { padding: 80px 20px !important; }
          div[style*="grid-template-columns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
