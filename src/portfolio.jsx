import { useState, useEffect } from "react";
import FoerdermittelPipeline from "./components/FoerdermittelPipeline";
import Automatisierung from "./components/Automatisierung";

const SECTIONS = ["hero", "profil", "kompetenz", "projekte", "kontakt"];

const timeline = [
  { year: "seit 2025", role: "KI-gestütztes Arbeiten — Selbststudium", company: "Berlin", desc: "Praxisorientierte Weiterbildung mit KI-Werkzeugen: Datenanalyse, Automatisierung, Webentwicklung. Diese Website ist das Ergebnis.", highlight: true },
  { year: "2023–2025", role: "Projektcontroller Fördermittelmanagement", company: "VDI/VDE Innovation + Technik GmbH, Berlin", desc: "BMDV-Förderprojekte (mFUND) nach Zuwendungs- und Haushaltsrecht begleitet. Antragstellerberatung, Verwendungsnachweise, Steuerung der Mittelbereitstellung und -verwendung.", highlight: true },
  { year: "2021–2023", role: "Selbstständige Immobilienprojekte", company: "Berlin", desc: "Eigenständige Suche, Planung und Umsetzung von zwei Immobilienprojekten." },
  { year: "2021", role: "Data Science Weiterbildung", company: "Alfa Training, Berlin", desc: "Python, Statistik, Big Data Analytics, Data Engineering, Machine Learning." },
  { year: "2019–2020", role: "Unternehmensentwicklung & Kundendienst", company: "SwitchUp GmbH, Berlin", desc: "Konzeption und Implementierung automatisierter Stromanbieter-Wechsel — vollständig automatisierter Wechselablauf ohne manuelle Eingriffe." },
  { year: "2017–2019", role: "Gründer – Digitale Künstlerplattform (YAA)", company: "Berlin & Regensburg", desc: "Online-Plattform zur Förderung junger Künstler. Business Plan, Finanzierungskonzept, Website-Entwicklung, Netzwerkarbeit mit Kulturschaffenden und Investoren." },
  { year: "2017", role: "Controlling in der Geschäftsführung", company: "Weihe GmbH, Berlin", desc: "Pricing-Tool zur wöchentlichen Preissteuerung im Lebensmittelhandel, automatisierte Reporting-Tools, Deckungsbeitrags- und Prozesskostenrechnungen, Neugestaltung des Berichtswesens." },
  { year: "2010–2016", role: "Projekt- & Produktcontroller (Service)", company: "Krones AG, Neutraubling", desc: "Internationales Service-Controlling für Ersatzteile und Service-Pakete über mehrere LCS-Center weltweit. Hands-on für komplexe Analysen, Reports, Datenmodelle und Entscheidungsvorlagen.", highlight: true },
  { year: "2008–2009", role: "Praktikum & Diplomarbeit Controlling", company: "Continental Automotive GmbH, Regensburg", desc: "R&D-Controlling, Entwicklung und Automatisierung eines weltweiten Reporting-Systems über 23 Standorte (SAP ERP, ETL, BW, OLAP)." },
];

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("hero");
  const [scrollY, setScrollY] = useState(0);
  const [openDemo, setOpenDemo] = useState(null);

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

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const navLabels = { hero: "Start", profil: "Profil", kompetenz: "Kompetenzen", projekte: "Projekte", kontakt: "Kontakt" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#ffffff", color: "#222", minHeight: "100vh", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: scrollY > 50 ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(0,0,0,0.06)" : "none",
        transition: "all 0.4s ease",
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", color: "#111", cursor: "pointer" }} onClick={() => scrollTo("hero")}>
          C<span style={{ color: "#008c46" }}>.</span>Z
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {SECTIONS.map((id) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", color: activeSection === id ? "#008c46" : "#999",
              fontSize: 12, fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em",
              textTransform: "uppercase", cursor: "pointer", padding: "4px 0",
              borderBottom: activeSection === id ? "1px solid #008c46" : "1px solid transparent",
              transition: "all 0.3s ease",
            }}>{navLabels[id]}</button>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "#fafafa" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", transform: `translateY(${scrollY * 0.1}px)` }} />
        <div style={{ textAlign: "center", zIndex: 1, padding: "0 24px", maxWidth: 800 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#008c46", marginBottom: 24, opacity: 0, animation: "fadeInUp 0.8s 0.2s forwards" }}>
            Betriebswirt · Controller · Fördermittelmanager · Gründer
          </div>
          <h1 style={{ fontSize: "clamp(36px, 7vw, 72px)", fontWeight: 300, lineHeight: 1.1, margin: "0 0 20px", color: "#111", opacity: 0, animation: "fadeInUp 0.8s 0.4s forwards" }}>
            Christoph<br /><span style={{ fontWeight: 700 }}>Zapp</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", fontWeight: 300, color: "#777", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7, opacity: 0, animation: "fadeInUp 0.8s 0.6s forwards" }}>
            Seit 2008 im Controlling — von Industrie und Maschinenbau bis zum öffentlichen Fördermittelmanagement. Mit dem Anspruch, Prozesse mit Daten und aktuellen Werkzeugen weiterzuentwickeln.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", opacity: 0, animation: "fadeInUp 0.8s 0.8s forwards" }}>
            <button onClick={() => scrollTo("kontakt")} style={{ background: "#111", color: "#fff", border: "none", padding: "12px 28px", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)"; }}
              onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}>
              Kontakt aufnehmen
            </button>
            <button onClick={() => scrollTo("profil")} style={{ background: "transparent", color: "#333", border: "1px solid rgba(0,0,0,0.15)", padding: "12px 28px", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em", cursor: "pointer", transition: "border-color 0.3s" }}
              onMouseEnter={(e) => { e.target.style.borderColor = "#008c46"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.15)"; }}>
              Mehr erfahren
            </button>
          </div>
        </div>
      </section>

      {/* PROFIL */}
      <section id="profil" style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#008c46", marginBottom: 12 }}>01 — Profil</div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 48, lineHeight: 1.3 }}>Generalist. <span style={{ fontWeight: 700 }}>Hands-on.</span></h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 64 }}>
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#666", marginBottom: 20 }}>
              Bei <strong style={{ color: "#222" }}>VDI/VDE-IT</strong> habe ich Förderprojekte im mFUND-Programm und weiteren BMBF/BMWK-Linien beraten, begleitet und geprüft — Mittelbereitstellung, Mittelverwendung und Verwendungsnachweise in Abstimmung mit Ministerien, Fachbereichen und externen Prüfern.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#666" }}>
              Sechs Jahre bei <strong style={{ color: "#222" }}>Krones AG</strong> haben das Fundament gelegt — Projekt- und Produktcontrolling im Life Cycle Service eines Maschinenbauers, mit Schwerpunkt auf komplexen Reports, Datenmodellen und Analysen für Geschäftsführung und Bereichsleitung.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#666", marginBottom: 20 }}>
              Seit Ende 2025 setze ich <strong style={{ color: "#222" }}>KI-Werkzeuge</strong> gezielt im Arbeitsalltag ein — als praktische Methode, nicht als Etikett. Diese Website und die interaktiven Demos darunter sind so entstanden: Controlling-Fachwissen, kombiniert mit aktuellen Werkzeugen zur Automatisierung und Datenanalyse.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#666" }}>
              Eine eigene Gründung und selbstständige Immobilienprojekte ergänzen das Profil um eine unternehmerische Perspektive — eigenverantwortliche Steuerung, kaufmännischer Blick auf Investitionen und das Denken aus Sicht des Unternehmers, nicht nur des Angestellten.
            </p>
          </div>
        </div>

        {/* Kennzahlen */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20, marginBottom: 64 }}>
          {[
            { value: "seit 2008", label: "im Controlling", sub: "Industrie, Mittelstand, öffentlicher Sektor" },
            { value: "BMBF/BMWK", label: "Förderprojekte", sub: "mFUND-Programm, BMDV" },
            { value: "6", label: "Jahre Maschinenbau", sub: "Krones AG, Life Cycle Service" },
            { value: "KI", label: "im Arbeitsalltag", sub: "Python, Automatisierung seit 2025" },
          ].map((kpi) => (
            <div key={kpi.label} style={{ borderLeft: "2px solid #008c46", paddingLeft: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#111", fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginTop: 6 }}>{kpi.label}</div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 4, lineHeight: 1.4 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#bbb", marginBottom: 20 }}>Werdegang</div>
        <div style={{ display: "grid", gap: 0 }}>
          {timeline.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 24, padding: "16px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: item.highlight ? "#008c46" : "#bbb", fontWeight: item.highlight ? 700 : 400, paddingTop: 2 }}>{item.year}</div>
              <div>
                <div style={{ fontSize: 15, color: "#222", fontWeight: 500, marginBottom: 2 }}>{item.role}</div>
                <div style={{ fontSize: 13, color: "#999", marginBottom: 4 }}>{item.company}</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: "16px 0", borderBottom: "1px solid #f0f0f0", display: "grid", gridTemplateColumns: "120px 1fr", gap: 24 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#bbb", paddingTop: 2 }}>2004–2010</div>
          <div>
            <div style={{ fontSize: 15, color: "#222", fontWeight: 500 }}>Diplom-Betriebswirtschaft (FH Erfurt)</div>
            <div style={{ fontSize: 13, color: "#999" }}>Schwerpunkte: Controlling, Unternehmensrechnung. Diplomarbeit: 1,7</div>
          </div>
        </div>
        <div style={{ padding: "16px 0", display: "grid", gridTemplateColumns: "120px 1fr", gap: 24 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#bbb", paddingTop: 2 }}>2002–2004</div>
          <div>
            <div style={{ fontSize: 15, color: "#222", fontWeight: 500 }}>Bankkaufmann (IHK)</div>
            <div style={{ fontSize: 13, color: "#999" }}>Volksbank Neckar Bergstraße, Schriesheim</div>
          </div>
        </div>
      </section>

      {/* KOMPETENZEN */}
      <section id="kompetenz" style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#008c46", marginBottom: 12 }}>02 — Kompetenzen</div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 48, lineHeight: 1.3 }}>Was ich <span style={{ fontWeight: 700 }}>mitbringe</span></h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
          {[
            { title: "Finanzen & Steuerung", accent: "#008c46", items: ["Projektcontrolling (Industrie & öffentlicher Sektor)", "Fördermittelmanagement (NKBF 2017, ANBest-P, BHO)", "Budgetierung, Reporting, Mittelverwendung", "Verwendungsnachweise & Mittelabrufe (profi)", "Deckungsbeitrags- und Ergebnisrechnung"] },
            { title: "Daten & Technologie", accent: "#0066cc", items: ["Python (Pandas, Automatisierung, Web Scraping)", "SAP ERP, DATEV, MS Excel/VBA", "KI-gestütztes Arbeiten (Claude)", "Reporting-Automatisierung (ETL, BW, OLAP)", "Data Science Grundlagen (ML, Statistik)"] },
            { title: "Organisation & Denken", accent: "#cc7700", items: ["Komplexitätsbewältigung in heterogenen Systemen", "Schnittstellenkommunikation (Ministerien, Partner)", "Unternehmerisches Handeln (Gründung & Selbstständigkeit)", "Komplexes einfach erklären und visualisieren", "Pragmatische Hands-on-Mentalität"] },
          ].map((cat) => (
            <div key={cat.title} style={{ borderTop: `3px solid ${cat.accent}`, padding: "24px 0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 16 }}>{cat.title}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cat.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#666", lineHeight: 1.6, paddingLeft: 16, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, color: cat.accent, fontSize: 10, top: 4 }}>▸</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, padding: "20px 24px", background: "#fafafa", border: "1px solid #f0f0f0" }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999" }}>Sprachen: </span>
          <span style={{ fontSize: 14, color: "#555" }}>Deutsch (Muttersprache) · Englisch (fließend) · Französisch (konversationsfähig)</span>
        </div>
      </section>

      {/* PROJEKTE */}
      <section id="projekte" style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#008c46", marginBottom: 12 }}>03 — Projekte</div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>KI-gestützt <span style={{ fontWeight: 700 }}>entwickelt</span></h2>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 600 }}>
          Diese interaktiven Demos habe ich mit aktuellen KI-Werkzeugen umgesetzt — um zu zeigen, wie ich solche Tools auf echte Fachprobleme aus Controlling und Fördermittelmanagement anwende. Die Website selbst ist Teil dieses Arbeitsbeweises.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          {/* Verwendungsnachweis-Assistent */}
          <div style={{
            border: "1px solid #eee", padding: "24px 28px",
            transition: "border-color 0.3s", background: "#fff",
          }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ddd"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#eee"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: "#111" }}>Verwendungsnachweis-Assistent</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999", marginTop: 4, letterSpacing: "0.05em" }}>KI-gestützter Beleg-Abgleich für Förderprojekte</div>
              </div>
              <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#008c46", background: "rgba(0,140,70,0.06)", padding: "4px 10px", whiteSpace: "nowrap" }}>Live</span>
            </div>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginTop: 12, marginBottom: 14 }}>
              Web-Anwendung, die einen mFUND-Bewilligungsbescheid via Claude API ausliest und eine Belegliste gegen sieben Compliance-Regeln nach ANBest-P prüft (Bewilligungszeitraum, Vergaberecht, BRKG-Tagessätze, Doubletten, Kostenart-Abgleich). Output: ein vorausgefüllter Verwendungsnachweis als Excel-Datei mit Soll-Ist-Vergleich und Prüfprotokoll. Streamlit + Python, deployed auf Streamlit Community Cloud.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {["Streamlit", "Claude API", "ANBest-P", "BRKG", "Excel-Export"].map((tag) => (
                <span key={tag} style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#999", border: "1px solid #e8e8e8", padding: "2px 8px", letterSpacing: "0.02em" }}>{tag}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="https://verwendungsnachweis-assistent.streamlit.app" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-block", background: "#008c46", color: "#fff", border: "none", padding: "10px 22px",
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em",
                textDecoration: "none", cursor: "pointer", transition: "background 0.3s",
              }} onMouseEnter={(e) => e.target.style.background = "#006d36"} onMouseLeave={(e) => e.target.style.background = "#008c46"}>
                Live-Demo öffnen
              </a>
              <a href="https://github.com/charly20000/Verwendungsnachweis-Assistent" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-block", background: "transparent", color: "#333", border: "1px solid rgba(0,0,0,0.15)",
                padding: "10px 22px", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.04em", textDecoration: "none", cursor: "pointer", transition: "border-color 0.3s",
              }} onMouseEnter={(e) => e.target.style.borderColor = "#008c46"} onMouseLeave={(e) => e.target.style.borderColor = "rgba(0,0,0,0.15)"}>
                Code auf GitHub
              </a>
            </div>
          </div>


          {/* Plausibilitätsprüfer für Forecasts */}
          <div style={{
            border: "1px solid #eee", padding: "24px 28px",
            transition: "border-color 0.3s", background: "#fff",
          }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ddd"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#eee"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: "#111" }}>Plausibilitätsprüfer für Forecasts</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999", marginTop: 4, letterSpacing: "0.05em" }}>5-Modell-Vergleich für Ersatzteilumsatz im Maschinenbau</div>
              </div>
              <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: "#008c46", background: "rgba(0,140,70,0.06)", padding: "4px 10px", whiteSpace: "nowrap" }}>Live</span>
            </div>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginTop: 12, marginBottom: 14 }}>
              Web-Anwendung zur Plausibilitätsprüfung von Vertriebs-Forecasts gegen fünf unabhängige Modell-Benchmarks (Heuristik, SARIMA, XGBoost, LightGBM, Prophet). Ampel-Logik, Pick-Best-Modellauswahl analog SAP IBP, Validation auf Vorjahr (MAPE/Bias). Visualisierung im IBCS/Hichert-Standard wie bei Horváth & Partners. Use Case angelehnt an meine Krones-Zeit (Life Cycle Service Controlling). Streamlit + Python, deployed auf Streamlit Community Cloud.
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {["Streamlit", "SARIMA", "XGBoost", "LightGBM", "Prophet", "IBCS"].map((tag) => (
                <span key={tag} style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#999", border: "1px solid #e8e8e8", padding: "2px 8px", letterSpacing: "0.02em" }}>{tag}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="https://plausibilitaetspruefer-forecast.streamlit.app" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-block", background: "#008c46", color: "#fff", border: "none", padding: "10px 22px",
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em",
                textDecoration: "none", cursor: "pointer", transition: "background 0.3s",
              }} onMouseEnter={(e) => e.target.style.background = "#006d36"} onMouseLeave={(e) => e.target.style.background = "#008c46"}>
                Live-Demo öffnen
              </a>
              <a href="https://github.com/charly20000/plausibilitaetspruefer-forecast" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-block", background: "transparent", color: "#333", border: "1px solid rgba(0,0,0,0.15)",
                padding: "10px 22px", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.04em", textDecoration: "none", cursor: "pointer", transition: "border-color 0.3s",
              }} onMouseEnter={(e) => e.target.style.borderColor = "#008c46"} onMouseLeave={(e) => e.target.style.borderColor = "rgba(0,0,0,0.15)"}>
                Code auf GitHub
              </a>
            </div>
          </div>

          {/* Fördermittel-Daten-Pipeline & Prozessautomatisierung */}
          {[
            { id: "foerdermittel", icon: "⚙️", title: "Fördermittel-Daten-Pipeline", desc: "ETL-Prozess für BMBF/BMWK-Förderprojekte. Vom Rohdaten-Import (Excel, SAP, profi-Online) über Validierung gegen den Finanzierungsplan bis zur automatisierten Fehlererkennung.", tags: ["ETL", "Zuwendungsrecht", "NKBF 2017", "profi-Online"], why: "Zeigt mein Fördermittel-Fachwissen in einer technischen Anwendung." },
            { id: "automatisierung", icon: "🔄", title: "Prozessautomatisierung Fördermittel", desc: "Analyse von 15 manuellen Prozessen im Fördermittel-Controlling. Ergebnis: 93% Effizienzgewinn, ~47 Arbeitstage Einsparung pro Projekt/Jahr.", tags: ["Prozessanalyse", "Automatisierung", "ROI"], why: "Zeigt, wie ich Prozesse systematisch hinterfrage und verbessere." },
          ].map((project) => (
            <div key={project.id}>
              <div onClick={() => setOpenDemo(openDemo === project.id ? null : project.id)} style={{
                border: "1px solid #eee", padding: "24px 28px", cursor: "pointer",
                transition: "border-color 0.3s", background: openDemo === project.id ? "#fafafa" : "#fff",
                borderBottom: openDemo === project.id ? "none" : "1px solid #eee",
              }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ddd"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#eee"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{project.icon}</span>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600, color: "#111" }}>{project.title}</div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{project.why}</div>
                    </div>
                  </div>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, color: "#ccc", transform: openDemo === project.id ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>+</span>
                </div>
                {openDemo !== project.id && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                    {project.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#999", border: "1px solid #e8e8e8", padding: "2px 8px", letterSpacing: "0.02em" }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              {openDemo === project.id && (
                <div style={{ border: "1px solid #eee", borderTop: "none", background: "#fafafa" }}>
                  {project.id === "foerdermittel" && <FoerdermittelPipeline />}
                  {project.id === "automatisierung" && <Automatisierung />}
                </div>
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#bbb", marginTop: 24, fontStyle: "italic" }}>Weitere Projekte (Beschaffungsoptimierung, Sanierungsrechner) auf Anfrage verfügbar.</p>
      </section>

      {/* KONTAKT */}
      <section id="kontakt" style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#008c46", marginBottom: 12 }}>04 — Kontakt</div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>Sprechen Sie mich <span style={{ fontWeight: 700 }}>an</span></h2>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 650 }}>Interesse an einer Zusammenarbeit oder Fragen zu meinem Profil? Ich bin ab sofort verfügbar und freue mich auf Ihre Nachricht.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const f = e.target;
            const subject = encodeURIComponent(`Kontaktanfrage von ${f.elements.name.value}`);
            const body = encodeURIComponent(`Name: ${f.elements.name.value}\nE-Mail: ${f.elements.email.value}\n\n${f.elements.message.value}`);
            window.location.href = `mailto:chs.zapp@posteo.de?subject=${subject}&body=${body}`;
          }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Name</label>
              <input name="name" required style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>E-Mail</label>
              <input name="email" type="email" required style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Nachricht</label>
              <textarea name="message" required rows={4} style={{ ...inputStyle, resize: "vertical" }} onFocus={focusIn} onBlur={focusOut} />
            </div>
            <button type="submit" style={{ background: "#111", color: "#fff", border: "none", padding: "14px 32px", fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.3s" }}
              onMouseEnter={(e) => e.target.style.background = "#008c46"} onMouseLeave={(e) => e.target.style.background = "#111"}>
              Nachricht senden
            </button>
            <p style={{ fontSize: 11, color: "#bbb", marginTop: 12 }}>Öffnet Ihr E-Mail-Programm.</p>
          </form>
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={contactLabel}>E-Mail</div>
              <a href="mailto:chs.zapp@posteo.de" style={{ fontSize: 15, color: "#008c46", textDecoration: "none" }}>chs.zapp@posteo.de</a>
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={contactLabel}>Standort</div>
              <div style={{ fontSize: 15, color: "#555" }}>Berlin</div>
            </div>
            <div>
              <div style={contactLabel}>Verfügbarkeit</div>
              <div style={{ fontSize: 15, color: "#555" }}>Ab sofort</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "48px 32px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }}>
          <a href="#impressum" style={footerLink}>Impressum</a>
          <a href="#datenschutz" style={footerLink}>Datenschutz</a>
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#ccc", letterSpacing: "0.05em" }}>© 2026 Christoph Zapp — Berlin</div>
      </footer>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(0,140,70,0.15); }
        @media (max-width: 768px) {
          section { padding: 80px 20px !important; }
          div[style*="grid-template-columns: 1fr 1fr 1fr 1fr"] { grid-template-columns: 1fr 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const labelStyle = { display: "block", fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "12px 16px", border: "1px solid #e8e8e8", fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#222", background: "#fafafa", outline: "none", transition: "border-color 0.3s" };
const contactLabel = { fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", marginBottom: 6 };
const footerLink = { fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999", textDecoration: "none", letterSpacing: "0.05em" };
const focusIn = (e) => e.target.style.borderColor = "#008c46";
const focusOut = (e) => e.target.style.borderColor = "#e8e8e8";
