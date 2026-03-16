import { useState } from "react";

// ---------------------------------------------------------------------------
// Data: 15 manuelle Prozesse in 5 Phasen
// ---------------------------------------------------------------------------
const AUTOMATION_PHASES = [
  {
    phase: "Antragstellung",
    icon: "01",
    prozesse: [
      {
        manuell: "Finanzierungsplan in Excel bauen, GK-Sätze händisch rechnen (110% Fraunhofer, 20% Uni-Pauschale, individuell KMU)",
        automatisiert: "Kalkulator: Personalkosten eingeben → Gemeinkosten, Förderquote und Eigenanteil automatisch berechnet",
        zeitManuell: 8,
        zeitAuto: 0.5,
        risiko: "Rechenfehler bei GK-Sätzen → Rückforderung",
      },
      {
        manuell: "Gleiche Daten aus Excel nochmal in profi-Online eintippen (Vordruck 0027a/0045/0047)",
        automatisiert: "Excel-Upload → Vordrucke automatisch befüllt, Positionsnummern (0812–0850) korrekt zugeordnet",
        zeitManuell: 4,
        zeitAuto: 0.25,
        risiko: "Tippfehler, falsche Positionszuordnung",
      },
      {
        manuell: "Verbundpartner senden Kalkulationen in jeweils eigenem Excel-Format per E-Mail",
        automatisiert: "Upload-Portal: Jedes Format → einheitliches Schema. Automatische Plausibilitätsprüfung",
        zeitManuell: 6,
        zeitAuto: 1,
        risiko: "Inkonsistente Daten zwischen Partnern",
      },
    ],
  },
  {
    phase: "Laufendes Controlling",
    icon: "02",
    prozesse: [
      {
        manuell: "Belege aus SAP/DATEV exportieren, in Excel chronologisch sortieren, jede Zeile einer FiPlan-Position zuordnen",
        automatisiert: "SAP-Export einlesen → Auto-Mapping Kostenstelle → Position (0837, 0846 etc.) → Belegliste 0623a",
        zeitManuell: 16,
        zeitAuto: 0.5,
        risiko: "Falsche Positionszuordnung, fehlende Belege",
      },
      {
        manuell: "Stundennachweise per E-Mail einsammeln, Stundensatz × Stunden manuell rechnen, gegen TV-L/E-Stufe prüfen",
        automatisiert: "Stundenerfassung digital: Mitarbeiter tragen ein → automatisch Stundensatz (E13: 80 €/h) × Stunden = Betrag",
        zeitManuell: 8,
        zeitAuto: 0.5,
        risiko: "Falsche Stundensätze, fehlende Nachweise",
      },
      {
        manuell: "Quartalsweise Excel-Tabelle öffnen, Soll vs. Ist je Position vergleichen, Prozent ausrechnen, prüfen ob < 20%",
        automatisiert: "Live-Ampel: Bei jedem neuen Beleg sofort Schwellenwert-Update. Alert bei >15%, Eskalation bei >20%",
        zeitManuell: 4,
        zeitAuto: 0,
        risiko: "Überschreitung zu spät erkannt → Rückforderung",
      },
      {
        manuell: "Vergabedokumentation: 3 Angebote einsammeln, in Ordner ablegen, Vergabevermerk schreiben",
        automatisiert: "Vergabe-Tracker: Upload Angebote → automatische Prüfung Mindestanzahl, Vergabevermerk-Template",
        zeitManuell: 3,
        zeitAuto: 0.5,
        risiko: "Häufigster Rückforderungsgrund (Bundesrechnungshof)",
      },
    ],
  },
  {
    phase: "Mittelabruf (quartalsweise)",
    icon: "03",
    prozesse: [
      {
        manuell: "Belege des Quartals je Position aggregieren, in profi-Online Vordruck 3220 eintippen: 'bereits erhalten' + 'lfd. HJ'",
        automatisiert: "Ein Klick: Belegliste Q1 → Zahlungsanforderung. Vorherige Abrufe automatisch berücksichtigt",
        zeitManuell: 6,
        zeitAuto: 0.25,
        risiko: "Zahlendreher, falsche Spalte befüllt",
      },
      {
        manuell: "Bedarfsprinzip prüfen: Reicht das abgerufene Geld für 6 Wochen? Händisch Kassenstand vs. geplante Ausgaben",
        automatisiert: "Liquiditätsprognose: Burn Rate × 6 Wochen = optimaler Abrufbetrag. Warnung bei Überabruf",
        zeitManuell: 2,
        zeitAuto: 0,
        risiko: "Zinsrückforderung bei Überabruf (5% über Basiszins)",
      },
      {
        manuell: "Alle Verbundpartner per E-Mail koordinieren: 'Bitte Abruf bis Freitag einreichen'",
        automatisiert: "Verbund-Dashboard: Jeder Partner sieht Status. Automatische Erinnerung 7 Tage vor Frist",
        zeitManuell: 3,
        zeitAuto: 0,
        risiko: "Partner vergisst Abruf → Projekt verzögert",
      },
    ],
  },
  {
    phase: "Zwischen-/Verwendungsnachweis",
    icon: "04",
    prozesse: [
      {
        manuell: "Zahlenmäßiger Nachweis: Alle Belege des Jahres zusammenrechnen, Vordruck 0504/0600 händisch befüllen",
        automatisiert: "Auto-Nachweis: Belegliste des Jahres → Vordruck automatisch generiert. Konsistenz-Check gegen Abrufe",
        zeitManuell: 16,
        zeitAuto: 1,
        risiko: "Summe Belege ≠ Summe Abrufe → Prüfungsbeanstandung",
      },
      {
        manuell: "Belegliste (0623a) als Excel erstellen + ausdrucken. Chronologisch sortiert, je Kostenart getrennt",
        automatisiert: "Ein Klick: 0623a als Excel + PDF. Automatisch chronologisch + nach Position sortiert",
        zeitManuell: 8,
        zeitAuto: 0.25,
        risiko: "Formale Fehler: falsches Datumsformat, 'Diverse' statt Name",
      },
      {
        manuell: "Inventarliste für alle Investitionen > 800 € (Position 0850) händisch pflegen",
        automatisiert: "Auto-Inventar: Belege auf Position 0850 → Inventarliste automatisch, inkl. AfA-Berechnung",
        zeitManuell: 3,
        zeitAuto: 0,
        risiko: "Fehlende Inventarisierung → Rückforderung der Investition",
      },
    ],
  },
  {
    phase: "Kommunikation & Fristen",
    icon: "05",
    prozesse: [
      {
        manuell: "E-Mails an Partner formulieren: 'Bitte Beleg X korrigieren, Position Y stimmt nicht, Vergabedoku fehlt'",
        automatisiert: "Auto-Mail: Fehler erkannt → E-Mail-Entwurf mit Beleg-Nr., Regelwerk-Referenz, konkreter Korrektur",
        zeitManuell: 5,
        zeitAuto: 0.5,
        risiko: "Vergessene Nachforderungen, unklare Kommunikation",
      },
      {
        manuell: "Fristen in Outlook-Kalender pflegen: Zwischennachweis, Verwendungsnachweis, Schlussbericht, Mittelabruf",
        automatisiert: "Fristenwarner: 90/30/7 Tage vorher automatisch Erinnerung. Eskalation bei Überschreitung",
        zeitManuell: 2,
        zeitAuto: 0,
        risiko: "Frist verpasst → Mittelsperre durch Projektträger",
      },
      {
        manuell: "Änderungsantrag formulieren wenn Schwellenwert >20% überschritten",
        automatisiert: "Generator: Schwellenwert überschritten → Änderungsantrag vorformuliert mit Begründung und neuer Kalkulation",
        zeitManuell: 6,
        zeitAuto: 1,
        risiko: "Antrag zu spät oder unvollständig → Ablehnung",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Styles (matching site design system)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Automatisierung() {
  const [expandedPhase, setExpandedPhase] = useState(null);

  const allProzesse = AUTOMATION_PHASES.flatMap((p) => p.prozesse);
  const totalManuell = allProzesse.reduce((s, p) => s + p.zeitManuell, 0);
  const totalAuto = allProzesse.reduce((s, p) => s + p.zeitAuto, 0);
  const jahrManuell = totalManuell * 4;
  const jahrAuto = totalAuto * 4;
  const jahrErsparnis = jahrManuell - jahrAuto;

  return (
    <section
      id="automatisierung"
      style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}
    >
      <div style={{ ...monoLabel, letterSpacing: "0.3em", color: "#008c46", marginBottom: 12 }}>
        07 — Prozessautomatisierung
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
        Manuell vs. <span style={{ fontWeight: 700 }}>Automatisiert</span>
      </h2>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 650 }}>
        Analyse von 15 manuellen Prozessen im Fördermittel-Controlling.
        Jeder Prozess mit konkretem Automatisierungsvorschlag, Zeitersparnis und eliminiertem Risiko.
        Basierend auf einem BMBF-Verbundprojekt (3–5 Partner, 2–3 Mio. € Volumen).
      </p>

      {/* KPI-Übersicht */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Manuell / Zyklus</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#cc3333" }}>{totalManuell}h</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Automatisiert</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#008c46" }}>{totalAuto}h</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Einsparung / Jahr</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#008c46" }}>{jahrErsparnis}h</div>
          <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{"\u2248"} {Math.round(jahrErsparnis / 8)} Arbeitstage</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Effizienzgewinn</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#008c46" }}>{Math.round((1 - jahrAuto / jahrManuell) * 100)}%</div>
        </div>
      </div>

      {/* Zeitvergleich Balken */}
      <div style={{ marginBottom: 32, border: "1px solid #eee", padding: "20px 24px" }}>
        <div style={{ ...monoLabel, marginBottom: 16 }}>Zeitaufwand pro Zyklus: Manuell vs. Automatisiert</div>
        {AUTOMATION_PHASES.map((phase) => {
          const phManuell = phase.prozesse.reduce((s, p) => s + p.zeitManuell, 0);
          const phAuto = phase.prozesse.reduce((s, p) => s + p.zeitAuto, 0);
          return (
            <div key={phase.phase} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#333", fontWeight: 500 }}>{phase.phase}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#999" }}>
                  {phManuell}h {"\u2192"} {phAuto}h
                </span>
              </div>
              <div style={{ display: "flex", gap: 4, height: 16 }}>
                <div style={{
                  width: `${(phManuell / totalManuell) * 100}%`, background: "rgba(204,51,51,0.15)",
                  borderLeft: "3px solid #cc3333", display: "flex", alignItems: "center", paddingLeft: 6,
                }}>
                  <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "#cc3333" }}>{phManuell}h manuell</span>
                </div>
                {phAuto > 0 && (
                  <div style={{
                    width: `${Math.max(3, (phAuto / totalManuell) * 100)}%`, background: "rgba(0,140,70,0.15)",
                    borderLeft: "3px solid #008c46", display: "flex", alignItems: "center", paddingLeft: 6,
                  }}>
                    <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "#008c46" }}>{phAuto}h</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phasen-Details */}
      <div style={{ display: "grid", gap: 0, border: "1px solid #eee" }}>
        {AUTOMATION_PHASES.map((phase, pi) => {
          const isOpen = expandedPhase === pi;
          const phManuell = phase.prozesse.reduce((s, p) => s + p.zeitManuell, 0);
          const phAuto = phase.prozesse.reduce((s, p) => s + p.zeitAuto, 0);

          return (
            <div key={phase.phase}>
              {pi > 0 && <div style={{ height: 1, background: "#eee" }} />}
              <button
                onClick={() => setExpandedPhase(isOpen ? null : pi)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, width: "100%",
                  background: isOpen ? "rgba(0,140,70,0.02)" : "none",
                  border: "none", padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#008c46",
                  fontWeight: 700, width: 24, flexShrink: 0,
                }}>
                  {phase.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#222", flex: 1, textAlign: "left" }}>
                  {phase.phase}
                </span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#cc3333" }}>{phManuell}h</span>
                <span style={{ color: "#008c46", fontWeight: 700, fontSize: 12 }}>{"\u2192"}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#008c46" }}>{phAuto}h</span>
                <span style={{
                  ...monoLabel, fontSize: 9, padding: "2px 6px",
                  color: "#008c46", background: "rgba(0,140,70,0.06)",
                }}>
                  {"\u2013"}{Math.round((1 - phAuto / phManuell) * 100)}%
                </span>
                <span style={{
                  fontSize: 14, color: isOpen ? "#008c46" : "#ccc",
                  transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}>
                  {"\u25BE"}
                </span>
              </button>

              <div style={{
                maxHeight: isOpen ? 2000 : 0,
                overflow: "hidden",
                transition: "max-height 0.4s ease",
              }}>
                <div style={{ padding: "0 16px 16px 54px" }}>
                  {phase.prozesse.map((proc, j) => (
                    <div key={j} style={{
                      border: "1px solid #eee", padding: "16px 20px", marginBottom: 8,
                      background: "#fff",
                    }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ ...monoLabel, fontSize: 8, color: "#cc3333", marginBottom: 6 }}>MANUELL {"\u00B7"} {proc.zeitManuell}h</div>
                          <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>{proc.manuell}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#008c46", fontWeight: 700, fontSize: 16 }}>{"\u2192"}</span>
                        </div>
                        <div>
                          <div style={{ ...monoLabel, fontSize: 8, color: "#008c46", marginBottom: 6 }}>AUTOMATISIERT {"\u00B7"} {proc.zeitAuto}h</div>
                          <div style={{ fontSize: 11, color: "#333", lineHeight: 1.6, fontWeight: 500 }}>{proc.automatisiert}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f5f5f5", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ ...monoLabel, fontSize: 8, color: "#cc7700" }}>RISIKO</span>
                          <span style={{ fontSize: 10, color: "#888" }}>{proc.risiko}</span>
                        </div>
                        <div style={{
                          fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700,
                          color: "#008c46", background: "rgba(0,140,70,0.06)", padding: "2px 8px",
                        }}>
                          {"\u2013"}{proc.zeitManuell - proc.zeitAuto}h ({Math.round((1 - proc.zeitAuto / proc.zeitManuell) * 100)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top 5 Quick Wins */}
      <div style={{ marginTop: 32 }}>
        <div style={{ ...monoLabel, color: "#008c46", marginBottom: 12 }}>Top 5 Quick Wins nach Einsparung</div>
        <div style={{ display: "grid", gap: 6 }}>
          {allProzesse
            .map((p) => ({ ...p, ersparnis: p.zeitManuell - p.zeitAuto }))
            .sort((a, b) => b.ersparnis - a.ersparnis)
            .slice(0, 5)
            .map((p, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "28px 1fr 60px 60px 70px",
                gap: 8, padding: "10px 14px", alignItems: "center",
                border: "1px solid #eee", background: i === 0 ? "rgba(0,140,70,0.02)" : "#fff",
              }}>
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700,
                  color: i === 0 ? "#008c46" : "#bbb",
                }}>
                  #{i + 1}
                </span>
                <span style={{ fontSize: 11, color: "#333", lineHeight: 1.4 }}>{p.automatisiert.split(":")[0].split("\u2192")[0].trim()}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#cc3333", textAlign: "right" }}>{p.zeitManuell}h</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#008c46", textAlign: "right" }}>{p.zeitAuto}h</span>
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, textAlign: "right",
                  color: "#008c46",
                }}>
                  {"\u2013"}{p.ersparnis}h
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Fazit */}
      <div style={{
        marginTop: 24, padding: "16px 20px",
        background: "#1a1a2e", border: "1px solid #2a2a4a",
        fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#a8b2d1", lineHeight: 1.8,
      }}>
        <span style={{ color: "#008c46" }}>// Fazit</span><br />
        <span style={{ color: "#e6e6e6" }}>Einsparung pro Projekt/Jahr:</span>{" "}
        <span style={{ color: "#008c46", fontWeight: 700 }}>{jahrErsparnis} Stunden {"\u2248"} {Math.round(jahrErsparnis / 8)} Arbeitstage</span><br />
        <span style={{ color: "#e6e6e6" }}>Bei 5 Projekten parallel:</span>{" "}
        <span style={{ color: "#008c46", fontWeight: 700 }}>{jahrErsparnis * 5} Stunden {"\u2248"} {Math.round((jahrErsparnis * 5) / 8)} Arbeitstage/Jahr</span><br />
        <span style={{ color: "#e6e6e6" }}>Zusätzlich:</span>{" "}
        <span style={{ color: "#cc7700" }}>Rückforderungsrisiko minimiert</span> durch Echtzeit-Prüfung
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, padding: "16px 0", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb" }}>
        <span style={{ fontFamily: "'Space Mono', monospace" }}>Prozessanalyse {"\u00B7"} BMBF/BMWK-Verbundprojekt {"\u00B7"} NKBF 2017 / ANBest-P</span>
        <span style={{ fontFamily: "'Space Mono', monospace" }}>Demo {"\u00B7"} Fiktive Zeitwerte</span>
      </div>
    </section>
  );
}
