import { useState, useEffect, useRef } from "react";
import Dashboard from "./components/Dashboard";
import FoerdermittelPipeline from "./components/FoerdermittelPipeline";
import Automatisierung from "./components/Automatisierung";
import BeschaffungsOptimierung from "./components/BeschaffungsOptimierung";
import SanierungsRechner from "./components/SanierungsRechner";

const SECTIONS = ["hero", "profil", "projekte", "skills", "mehrwert", "dashboard", "foerdermittel", "automatisierung", "beschaffung", "sanierung", "kontakt"];

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
  {
    title: "Beschaffungsoptimierung Rohstoffe",
    status: "Live",
    tags: ["Rohstoffpreise", "Monte Carlo", "Risikomanagement", "Lageroptimierung"],
    description:
      "Rohstoff-Einkaufsoptimierung mit LME-Preismodellierung, geopolitischer Risikoanalyse und adjustierbarem Risikoprofil. Berechnet optimale Kaufzeitpunkte und Mengen unter Berücksichtigung von Lagerkapazität und Saisonalität.",
    icon: "🏭",
    link: "beschaffung",
  },
  {
    title: "Energetische Sanierung — Projektkalkulator",
    status: "Live",
    tags: ["KfW-Förderung", "BEG", "Energieeffizienz", "Projektkalkulation"],
    description:
      "Interaktiver Kalkulator für energetische Gebäudesanierung. Berechnet Kosten, KfW-Förderung (Programm 261), Energieeinsparung und CO₂-Reduktion mit Gantt-Projektplanung.",
    icon: "🏗️",
    link: "sanierung",
  },
];

const skillCategories = [
  {
    category: "Controlling & Finance",
    skills: [
      { name: "Projektcontrolling", level: 95, context: "15 Jahre, Krones AG + VDI/VDE-IT" },
      { name: "Fördermittelmanagement", level: 90, context: "BMBF/BMWK, NKBF 2017, profi-Online" },
      { name: "Budgetierung & Reporting", level: 90, context: "SAP CO/FI, 6 Jahre Krones AG" },
      { name: "Deckungsbeitragsrechnung", level: 85, context: "Life Cycle Service, Maschinenbau" },
      { name: "Investitionsanalyse", level: 80, context: "Immobilien + Industrie" },
    ],
  },
  {
    category: "Data & Technologie",
    skills: [
      { name: "Power BI / DAX", level: 40, context: "Aufbau, erste eigene Dashboards" },
      { name: "Python", level: 60, context: "Data-Science-Zertifikat, Pandas, Scikit-learn" },
      { name: "SQL", level: 65, context: "Abfragen, Joins, Aggregationen, Views" },
      { name: "Machine Learning", level: 45, context: "Grundlagen, Regression, Klassifikation" },
      { name: "ETL / Data Engineering", level: 55, context: "Excel-zu-DB Pipelines, Web Scraping" },
    ],
  },
  {
    category: "Business & Soft Skills",
    skills: [
      { name: "Prozessoptimierung", level: 85, context: "15 Prozesse dokumentiert & automatisiert" },
      { name: "Beratung & Stakeholder Mgmt", level: 85, context: "Ministerien, Projektträger, Partner" },
      { name: "Unternehmerisches Denken", level: 90, context: "2 Gründungen, Immobilien" },
      { name: "Analytisches Arbeiten", level: 95, context: "Kern jeder bisherigen Position" },
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

function SkillBar({ name, level, context, visible }) {
  const levelLabel = level >= 90 ? "Experte" : level >= 70 ? "Fortgeschritten" : level >= 50 ? "Solide Basis" : "Aufbau";
  const levelColor = level >= 90 ? "#008c46" : level >= 70 ? "#111" : level >= 50 ? "#666" : "#999";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#333", letterSpacing: "0.02em" }}>
          {name}
        </span>
        <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: levelColor, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>{levelLabel}</span>
      </div>
      {context && (
        <div style={{ fontSize: 10, color: "#aaa", marginBottom: 4, lineHeight: 1.4 }}>{context}</div>
      )}
      <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: visible ? `${level}%` : "0%",
            background: `linear-gradient(90deg, #111 ${Math.max(0, level - 30)}%, #999)`,
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

  const navLabels = { hero: "Start", profil: "Profil", projekte: "Projekte", skills: "Skills", mehrwert: "Mehrwert", dashboard: "Dashboard", foerdermittel: "Fördermittel", automatisierung: "Automatisierung", beschaffung: "Beschaffung", sanierung: "Sanierung", kontakt: "Kontakt" };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "#ffffff",
      color: "#222",
      minHeight: "100vh",
      overflowX: "hidden",
    }}>
      {/* Fonts loaded via /fonts/fonts.css in index.html */}

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
                  context={skill.context}
                  visible={skillsVisible}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Methodik-Transparenz */}
        <div style={{
          marginTop: 48,
          padding: "20px 24px",
          border: "1px solid #eee",
          background: "#fafafa",
          fontSize: 12,
          color: "#888",
          lineHeight: 1.7,
        }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", marginRight: 8 }}>Methodik</span>
          Ehrliche Selbsteinschätzung: "Experte" = jahrelange Praxiserfahrung mit nachweisbaren Ergebnissen.
          "Aufbau" = aktiv am Lernen mit ersten eigenen Projekten. Die Balken zeigen, wo ich stehe — nicht wo ich hinmöchte.
          Transparenz ist mir wichtiger als Selbstvermarktung.
        </div>

        {/* Aktuelle Lernziele */}
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { label: "Q2 2026", goal: "Power BI & DAX", detail: "Eigene Dashboards für Portfolio-Projekte. DAX-Measures für Fördermittel-Reporting." },
            { label: "Q3 2026", goal: "Python Auffrischung", detail: "Finance-Automatisierung, Pandas-Pipelines, API-Anbindungen für Echtzeit-Daten." },
            { label: "Q4 2026", goal: "KI im Controlling", detail: "Claude/GPT-Integration in Controlling-Workflows. Anomalie-Erkennung, NLP für Berichte." },
          ].map((item) => (
            <div key={item.label} style={{ border: "1px solid #eee", padding: "16px 20px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#008c46", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 6 }}>{item.goal}</div>
              <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6 }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MEHRWERT */}
      <section id="mehrwert" style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#008c46",
          marginBottom: 12,
        }}>
          04 — Mehrwert
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
          Was ich Ihrem <span style={{ fontWeight: 700 }}>Unternehmen bringe</span>
        </h2>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 650 }}>
          Die Brücke zwischen Controlling-Expertise und moderner Technologie — konkret, messbar und sofort einsetzbar.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
          {[
            {
              title: "KI-Readiness Assessment",
              desc: "Analyse Ihrer Controlling-Prozesse auf Automatisierungspotenzial. Welche Routineaufgaben kann KI übernehmen? Wo bringt Datenanalyse den größten ROI? Ergebnis: konkreter Fahrplan mit Quick Wins und langfristiger Strategie.",
              tags: ["Prozessanalyse", "ROI-Bewertung", "Fahrplan"],
              accent: "#008c46",
            },
            {
              title: "Controlling 4.0 Transformation",
              desc: "Von Excel-Listen zu datengetriebenen Dashboards. Ich kenne beide Welten — die Sprache der Controller und die Möglichkeiten moderner Tools. Keine Disruption, sondern schrittweise Evolution mit messbaren Zwischenergebnissen.",
              tags: ["Power BI", "Automatisierung", "Change Management"],
              accent: "#0066cc",
            },
            {
              title: "Fördermittel-Compliance",
              desc: "BMBF, BMWK, KfW — ich kenne die Regelwerke (NKBF 2017, ANBest-P, BEG). Aufbau digitaler Prüfprozesse, die Rückforderungsrisiken minimieren und den Verwaltungsaufwand um bis zu 90% senken.",
              tags: ["NKBF 2017", "ANBest-P", "profi-Online"],
              accent: "#cc7700",
            },
            {
              title: "KI-Einführung im Controlling",
              desc: "Pragmatischer Einstieg: Claude/GPT für Berichtsanalyse, Anomalie-Erkennung in Buchungsdaten, automatische Abweichungskommentare. Kein Hype, sondern getestete Use Cases mit konkretem Zeitgewinn.",
              tags: ["Claude API", "NLP", "Anomalie-Erkennung"],
              accent: "#6B46C1",
            },
          ].map((item) => (
            <div key={item.title} style={{
              border: "1px solid #eee",
              borderTop: `3px solid ${item.accent}`,
              padding: "24px 28px",
              background: "#fff",
            }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#111", marginBottom: 10 }}>{item.title}</div>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 14 }}>{item.desc}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {item.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: 10,
                    fontFamily: "'Space Mono', monospace",
                    color: "#999",
                    border: "1px solid #e8e8e8",
                    padding: "2px 8px",
                    letterSpacing: "0.02em",
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Was Entscheider interessiert */}
        <div style={{
          border: "1px solid #eee",
          padding: "24px 28px",
          background: "#fafafa",
        }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#008c46", marginBottom: 16 }}>
            Auf den Punkt
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
            {[
              { metric: "93%", label: "Effizienzgewinn", detail: "bei Fördermittel-Prozessen durch Automatisierung" },
              { metric: "47 Tage", label: "Zeitersparnis / Jahr", detail: "pro Förderprojekt durch digitale Workflows" },
              { metric: "15+ Jahre", label: "Controlling-Erfahrung", detail: "Krones AG, VDI/VDE-IT, Immobilien, Startups" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#111", fontFamily: "'Space Mono', monospace" }}>{kpi.metric}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginTop: 4 }}>{kpi.label}</div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>{kpi.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <Dashboard />

      {/* FÖRDERMITTEL-PIPELINE */}
      <FoerdermittelPipeline />

      {/* PROZESSAUTOMATISIERUNG */}
      <Automatisierung />

      {/* BESCHAFFUNGSOPTIMIERUNG */}
      <BeschaffungsOptimierung />

      {/* SANIERUNGSRECHNER */}
      <section id="sanierung" style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#008c46",
          marginBottom: 12,
        }}>
          09 — Energetische Sanierung
        </div>
        <SanierungsRechner />
      </section>

      {/* KONTAKT */}
      <section id="kontakt" style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#008c46",
          marginBottom: 12,
        }}>
          10 — Kontakt
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
          Sprechen Sie mich <span style={{ fontWeight: 700 }}>an</span>
        </h2>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 650 }}>
          Interesse an einer Zusammenarbeit oder Fragen zu meinem Profil? Schreiben Sie mir — ich melde mich zeitnah zurück.
        </p>

        <form onSubmit={(e) => {
          e.preventDefault();
          const form = e.target;
          const name = form.elements.name.value;
          const email = form.elements.email.value;
          const message = form.elements.message.value;
          const subject = encodeURIComponent(`Kontaktanfrage von ${name}`);
          const body = encodeURIComponent(`Name: ${name}\nE-Mail: ${email}\n\n${message}`);
          window.location.href = `mailto:chs.zapp@posteo.de?subject=${subject}&body=${body}`;
        }} style={{ maxWidth: 600 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", marginBottom: 6 }}>Name</label>
              <input name="name" required style={{
                width: "100%", padding: "12px 16px", border: "1px solid #e8e8e8", fontSize: 14,
                fontFamily: "'DM Sans', sans-serif", color: "#222", background: "#fafafa",
                outline: "none", transition: "border-color 0.3s",
              }} onFocus={(e) => e.target.style.borderColor = "#008c46"}
                 onBlur={(e) => e.target.style.borderColor = "#e8e8e8"} />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", marginBottom: 6 }}>E-Mail</label>
              <input name="email" type="email" required style={{
                width: "100%", padding: "12px 16px", border: "1px solid #e8e8e8", fontSize: 14,
                fontFamily: "'DM Sans', sans-serif", color: "#222", background: "#fafafa",
                outline: "none", transition: "border-color 0.3s",
              }} onFocus={(e) => e.target.style.borderColor = "#008c46"}
                 onBlur={(e) => e.target.style.borderColor = "#e8e8e8"} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", marginBottom: 6 }}>Nachricht</label>
            <textarea name="message" required rows={5} style={{
              width: "100%", padding: "12px 16px", border: "1px solid #e8e8e8", fontSize: 14,
              fontFamily: "'DM Sans', sans-serif", color: "#222", background: "#fafafa",
              outline: "none", resize: "vertical", transition: "border-color 0.3s",
            }} onFocus={(e) => e.target.style.borderColor = "#008c46"}
               onBlur={(e) => e.target.style.borderColor = "#e8e8e8"} />
          </div>
          <button type="submit" style={{
            background: "#111", color: "#fff", border: "none", padding: "14px 32px",
            fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.08em",
            textTransform: "uppercase", cursor: "pointer", transition: "background 0.3s",
          }} onMouseEnter={(e) => e.target.style.background = "#008c46"}
             onMouseLeave={(e) => e.target.style.background = "#111"}>
            Nachricht senden
          </button>
          <p style={{ fontSize: 11, color: "#bbb", marginTop: 12 }}>
            Öffnet Ihr E-Mail-Programm. Alternativ: <a href="mailto:chs.zapp@posteo.de" style={{ color: "#008c46", textDecoration: "none" }}>chs.zapp@posteo.de</a>
          </p>
        </form>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: "48px 32px",
        borderTop: "1px solid #f0f0f0",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }}>
          <a href="#impressum" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999", textDecoration: "none", letterSpacing: "0.05em" }}>
            Impressum
          </a>
          <a href="#datenschutz" style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999", textDecoration: "none", letterSpacing: "0.05em" }}>
            Datenschutz
          </a>
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12,
          color: "#ccc",
          letterSpacing: "0.05em",
        }}>
          © 2026 Christoph Zapp — Berlin
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
