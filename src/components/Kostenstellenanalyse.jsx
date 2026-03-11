import { useState } from "react";

// ---------------------------------------------------------------------------
// Realistic cost center analysis based on IKR/SKR04 structure
// Modeled after a German Maschinenbau company (~€120M revenue, 650 MA)
// Using Industriekontenrahmen (IKR) cost center numbering
// ---------------------------------------------------------------------------

const BUCHUNGEN = [
  // KSt | Bereich | Kostenart (SKR04) | Bezeichnung | Ist | Plan | Monat | Bemerkung
  { kst: "1100", bereich: "Fertigung Mechanik", ka: "5000", bezeichnung: "Fertigungsmaterial Stahl/Alu", ist: 284600, plan: 245000, monat: "Jan", bem: "Stahlpreisanstieg +16% ggü. Vorjahr" },
  { kst: "1100", bereich: "Fertigung Mechanik", ka: "6020", bezeichnung: "Fertigungslöhne (Akkord)", ist: 189400, plan: 192000, monat: "Jan", bem: "" },
  { kst: "1200", bereich: "Fertigung Elektrik", ka: "5100", bezeichnung: "Elektronische Baugruppen / PCBs", ist: 167800, plan: 158000, monat: "Feb", bem: "Lieferengpass → Spotmarkt-Einkauf" },
  { kst: "1200", bereich: "Fertigung Elektrik", ka: "6280", bezeichnung: "Leiharbeitnehmer Produktion", ist: 42300, plan: 28000, monat: "Feb", bem: "Krankheitsvertretung ohne Genehmigung" },
  { kst: "1300", bereich: "Montage / Endprüfung", ka: "6210", bezeichnung: "Sozialabgaben AG-Anteil", ist: 38900, plan: 39200, monat: "Jan", bem: "" },
  { kst: "2100", bereich: "Materialwirtschaft", ka: "5200", bezeichnung: "Hilfs- und Betriebsstoffe", ist: 31400, plan: 29000, monat: "Mär", bem: "" },
  { kst: "2100", bereich: "Materialwirtschaft", ka: "6800", bezeichnung: "Fracht / Transportversicherung", ist: 18700, plan: 14500, monat: "Mär", bem: "Sonderfracht Luftfracht 3x" },
  { kst: "3100", bereich: "Vertrieb Inland", ka: "6600", bezeichnung: "Reisekosten Außendienst", ist: 24800, plan: 22000, monat: "Feb", bem: "" },
  { kst: "3100", bereich: "Vertrieb Inland", ka: "6640", bezeichnung: "Bewirtung / Repräsentation", ist: 8900, plan: 5500, monat: "Mär", bem: "Hausmesse März ohne separaten KTR" },
  { kst: "3200", bereich: "Vertrieb Export", ka: "6610", bezeichnung: "Reisekosten Ausland", ist: 31200, plan: 26000, monat: "Mär", bem: "China-Reise: 3 statt 1 Mitarbeiter" },
  { kst: "4100", bereich: "Verwaltung / GF", ka: "6300", bezeichnung: "Miete / Nebenkosten Verwaltung", ist: 48000, plan: 48000, monat: "Jan", bem: "" },
  { kst: "4100", bereich: "Verwaltung / GF", ka: "6325", bezeichnung: "Abschluss- und Prüfungskosten", ist: 85000, plan: 52000, monat: "Mär", bem: "IFRS-Erstanwendung → Mehraufwand WP" },
  { kst: "4200", bereich: "Rechnungswesen", ka: "6315", bezeichnung: "Rechts- und Beratungskosten", ist: 34200, plan: 18000, monat: "Feb", bem: "M&A Due Diligence ohne Budgetfreigabe" },
  { kst: "5100", bereich: "F&E Mechanik", ka: "6000", bezeichnung: "Gehälter F&E (aktivierungsfähig)", ist: 124000, plan: 118000, monat: "Jan", bem: "" },
  { kst: "5100", bereich: "F&E Mechanik", ka: "6810", bezeichnung: "Patentkosten / Anmeldungen", ist: 28400, plan: 15000, monat: "Mär", bem: "3 ungeplante Patentanmeldungen CN/US" },
  { kst: "9100", bereich: "Energie / Facility", ka: "6400", bezeichnung: "Energiekosten (Strom/Gas)", ist: 67800, plan: 58000, monat: "Feb", bem: "Gaspreisanpassung zum 01.01." },
  { kst: "9100", bereich: "Energie / Facility", ka: "6330", bezeichnung: "Instandhaltung Gebäude / Anlagen", ist: 42100, plan: 35000, monat: "Mär", bem: "Außerplanm. Dachreparatur Halle 3" },
];

// ---------------------------------------------------------------------------
// KI-Analysis: Professional anomaly analysis with controller depth
// ---------------------------------------------------------------------------
const ANOMALIEN = [
  {
    titel: "KSt 5000 Fertigung — Fertigungsmaterial +16,2%",
    schwere: "hoch",
    kategorie: "Preisabweichung",
    text: `Analyse: Materialeinzelkosten KSt 1100 weichen +€39.600 vom Plan ab.
Zerlegung der Abweichung (Methode: Flexible Plankostenrechnung nach Kilger):

  Preisabweichung:   +€38.200 (Stahlpreis LME +16,4% ggü. Planansatz Q4/23)
  Mengenabweichung:  +€1.400  (Mehrverbrauch 0,6% — innerhalb Toleranz)
  Mixabweichung:     —        (keine Sortimentsverschiebung)

Bewertung: Reine Beschaffungspreisabweichung. Planpreise basieren auf
Rahmenvertrag mit ArcelorMittal (Laufzeit 12M, Preisgleitklausel §2.4
greift erst ab +20%). Empfehlung: Hedging-Strategie für Q2 prüfen,
alternativ Preisgleitklausel in Kundenverträgen aktivieren (§7 AGB).
Delta-Weitergabe an Kalkulation: Zuschlagssatz MEK von 3,2% auf 3,7% anpassen.`,
  },
  {
    titel: "KSt 1200 Fertigung Elektrik — Leiharbeit +51,1%",
    schwere: "hoch",
    kategorie: "Budgetüberschreitung",
    text: `Analyse: Leiharbeitnehmerkosten +€14.300 über Plan (51,1%).
Ursache: 3 Leiharbeitnehmer seit KW 6 ohne Budgetfreigabe durch Bereichsleitung.
Rückverfolgung: Personalanforderung #PA-2024-0847 vom 02.02. — genehmigt durch
Schichtleiter (Kompetenzgrenze €5.000), tatsächliche Kosten €42.300/Monat.

Compliance-Verstoß: Überschreitung der Einzelzeichnungsbefugnis gem.
Unterschriftenregelung Anlage 3 (Grenze BL: €25.000/Monat).

Empfehlung:
1. Nachgenehmigung durch GF einholen (Formular F-HR-012)
2. Krankheitsvertretungsbedarf prüfen — Fehlzeitenquote KSt 1200: 8,4%
   (Benchmark Branche: 5,2%)
3. Personalplanung Q2 anpassen, ggf. befristete Einstellung statt Leiharbeit
   (Kostenvorteil €8.200/Monat nach Probezeit)`,
  },
  {
    titel: "KSt 4200 Rechnungswesen — Beratungskosten +90%",
    schwere: "hoch",
    kategorie: "Fehlkontierung",
    text: `Analyse: Rechts- und Beratungskosten KSt 4200 weichen +€16.200 ab (+90%).
Ursache: M&A Due Diligence für Zielunternehmen auf KSt Rechnungswesen kontiert.

Problem: Kosten hätten auf Sonder-Kostenträger KTR 800100 "Projekt Akquisition"
gebucht werden müssen. Aktuell keine Aktivierungsfähigkeit der Kosten prüfbar
(IAS 38.24: Identifizierbare immaterielle Vermögenswerte bei Unternehmenserwerb).

Auswirkung auf Reporting:
  → KSt 4200 Overhead-Quote: 4,8% statt 2,5% (verfälscht Gemeinkostenumlage)
  → Verrechnungssatz Verwaltungsgemeinkosten: +0,3 Pp auf alle Kostenträger
  → P&L Impact: €16.200 in falscher Funktionsbereichszeile (§275 HGB)

Empfehlung: Umbuchung auf KTR 800100, Aktivierungsprüfung durch WP veranlassen.`,
  },
  {
    titel: "KSt 4100 Verwaltung — WP-Kosten +63,5%",
    schwere: "mittel",
    kategorie: "Periodenabgrenzung",
    text: `Analyse: Abschluss- und Prüfungskosten +€33.000 über Plan.
Ursache: IFRS-Erstanwendung (IFRS 1) verursacht Mehraufwand bei Jahresabschluss-
prüfung. Honorarvereinbarung mit Deloitte wurde im Dezember angepasst, aber
Planwerte nicht aktualisiert (Planungsrunde August — 4 Monate vor Beschluss).

Periodenabgrenzung: €85.000 in März gebucht, aber Leistungszeitraum Dez–März.
Nach HGB §250 Abs. 1 wäre anteilige Abgrenzung auf 4 Monate korrekt:
  → Dez: €21.250 (Vorjahr), Jan–Mär: je €21.250

Empfehlung: RAP-Buchung veranlassen. Planwerte für 2025 auf €90.000 anpassen
(inkl. IFRS-Folgeaufwand). Prüfungsausschuss über Kostenentwicklung informieren.`,
  },
  {
    titel: "KSt 9100 Energie — Gaspreisanpassung +16,9%",
    schwere: "mittel",
    kategorie: "Tarifänderung",
    text: `Analyse: Energiekosten +€9.800 über Plan. Gaspreisanpassung zum 01.01. durch
Versorger (GASAG) wurde in Planungsrunde nicht berücksichtigt.

Zerlegung:
  Strom:  €38.400 (Plan: €36.000, +6,7% — Börsenpreis EEX Base)
  Gas:    €29.400 (Plan: €22.000, +33,6% — Vertrag läuft 03/2025 aus)

Benchmark: Energieintensität 0,56 kWh/€ Umsatz (Branche: 0,48 kWh/€)
Maßnahmen Energiemonitoring:
  → Druckluft Halle 2: Leckage-Rate 18% (Branchenstandard <10%)
  → Beleuchtung Lager: Noch keine LED-Umrüstung (ROI: 14 Monate)
  → Kompressor Halle 3: Wirkungsgrad 62% (Neugerät: 88%)`,
  },
  {
    titel: "KSt 5100 F&E — Patentkosten +89,3%",
    schwere: "mittel",
    kategorie: "Projektsteuerung",
    text: `Analyse: Patentkosten +€13.400 über Plan durch 3 ungeplante Anmeldungen.
Patente: CN-2024-08847 (Antriebstechnik), US-2024-12993 (Sensorik),
         EP-2024-55021 (Verfahrenspatent Beschichtung)

Prüfung Aktivierungsfähigkeit (IAS 38.57):
  → CN/US: Produktbezogen, aktivierungsfähig als Entwicklungskosten
  → EP: Grundlagenforschung, nicht aktivierungsfähig (IAS 38.54)

Kosten-Nutzen: Patentportfolio-Bewertung durch IP-Abteilung ausstehend.
Letzter Review: 18 Monate her. 12 Patente im Portfolio ohne Verwertungsnachweis
(jährliche Aufrechterhaltungskosten: €34.000).

Empfehlung: IP-Audit veranlassen, Verwertungsstrategie für Schlafpatente definieren.`,
  },
];

const MUSTER = [
  { typ: "Preisabweichung", muster: "Materialeinzelkosten systematisch über Plan — Stahlpreisindex (LME) korreliert mit Abweichung r² = 0.94. Hedging-Vertrag deckt nur 60% des Volumens ab.", farbe: "#cc3333" },
  { typ: "Saisonalität", muster: "Vertriebsgemeinkosten Q1 strukturell +18–25% über Jahresschnitt (Hausmesse, Jahresauftakt-Events). Saisonale Budgetverteilung 30/22/22/26 statt linear empfohlen.", farbe: "#cc7700" },
  { typ: "Trend", muster: "Energieintensität steigt seit 4 Quartalen (+2,1% p.a.), während Umsatz stagniert. Indikator für sinkende Anlageneffizienz oder veränderten Produktmix (energieintensivere Produkte).", farbe: "#cc7700" },
  { typ: "Kontierungsfehler", muster: "3 von 17 Buchungen >€15.000 auf falscher Kostenstelle kontiert (Fehlerquote 17,6%). Schwerpunkt: Projektbezogene Kosten auf Linienkostenstellen. Empfehlung: Kontierungsregel SAP CO mit Plausibilitätsprüfung.", farbe: "#cc3333" },
  { typ: "Compliance", muster: "2 Fälle von Budgetüberschreitung ohne Genehmigung gem. Unterschriftenregelung. Automatische Warnung bei >80% Budgetausschöpfung in SAP CO nicht aktiviert.", farbe: "#cc3333" },
];

// ---------------------------------------------------------------------------
// BAB-Daten (Betriebsabrechnungsbogen) — Zuschlagssätze
// ---------------------------------------------------------------------------
const BAB_DATEN = [
  { bereich: "Materialgemeinkosten", basis: "MEK", planSatz: "12,0%", istSatz: "13,4%", abw: "+1,4 Pp" },
  { bereich: "Fertigungsgemeinkosten", basis: "FEK", planSatz: "185%", istSatz: "198%", abw: "+13 Pp" },
  { bereich: "Verwaltungsgemeinkosten", basis: "HK", planSatz: "8,5%", istSatz: "10,2%", abw: "+1,7 Pp" },
  { bereich: "Vertriebsgemeinkosten", basis: "HK", planSatz: "6,0%", istSatz: "6,8%", abw: "+0,8 Pp" },
];

// ---------------------------------------------------------------------------
// Styles
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

const codeBlock = {
  background: "#1a1a2e",
  color: "#a8b2d1",
  fontFamily: "'Space Mono', monospace",
  fontSize: 11,
  padding: "16px 20px",
  borderRadius: 0,
  overflowX: "auto",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function abweichungPct(ist, plan) {
  if (plan === 0) return 0;
  return ((ist - plan) / plan) * 100;
}

function formatEur(val) {
  return val.toLocaleString("de-DE");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Kostenstellenanalyse() {
  const [analysisActive, setAnalysisActive] = useState(false);
  const [expandedAnomaly, setExpandedAnomaly] = useState(null);
  const [showBAB, setShowBAB] = useState(false);

  const anomalyCount = ANOMALIEN.length;
  const gesamtAbweichung = BUCHUNGEN.reduce((sum, b) => sum + (b.ist - b.plan), 0);
  const handlungsbedarf = ANOMALIEN.filter((a) => a.schwere === "hoch").length;

  return (
    <section
      id="kostenstellenanalyse"
      style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}
    >
      <div style={{ ...monoLabel, letterSpacing: "0.3em", color: "#008c46", marginBottom: 12 }}>
        08 — KI-Kostenstellenanalyse
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
        Anomalie-Erkennung in der <span style={{ fontWeight: 700 }}>Kostenstellenrechnung</span>
      </h2>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 12, maxWidth: 750 }}>
        Vollständige Kostenstellenanalyse nach IKR-Struktur mit SKR04-Kostenarten.
        Abweichungszerlegung nach der flexiblen Plankostenrechnung (Kilger/Pampel/Vikas),
        Compliance-Prüfung gegen Unterschriftenregelung und Kontierungsvalidierung.
      </p>
      <p style={{ fontSize: 12, color: "#bbb", marginBottom: 48, fontFamily: "'Space Mono', monospace" }}>
        Modellunternehmen: Industrieunternehmen Maschinenbau, ~€120 Mio. Umsatz, 650 MA, HGB + IFRS
      </p>

      {/* Buchungsdaten-Tabelle */}
      <div style={{ ...cardStyle, marginBottom: 24, overflowX: "auto" }}>
        <div style={{ ...monoLabel, marginBottom: 16 }}>Buchungsjournal — Kostenstellenrechnung Q1 (Auszug 17 Positionen)</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              {["KSt", "Bereich", "KA (SKR04)", "Bezeichnung", "Ist (€)", "Plan (€)", "Abw. (%)", "Per."].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: h.includes("€") || h.includes("%") ? "right" : "left",
                    padding: "8px 8px",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#aaa",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BUCHUNGEN.map((b, i) => {
              const pct = abweichungPct(b.ist, b.plan);
              const isAnomaly = analysisActive && Math.abs(pct) > 15;
              const isHighAnomaly = analysisActive && Math.abs(pct) > 30;
              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #f5f5f5",
                    background: isHighAnomaly
                      ? "rgba(204,51,51,0.06)"
                      : isAnomaly
                      ? "rgba(204,119,0,0.06)"
                      : "transparent",
                    transition: "background 0.3s",
                  }}
                >
                  <td style={{ padding: "7px 8px", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#555" }}>
                    {b.kst}
                  </td>
                  <td style={{ padding: "7px 8px", fontSize: 11, color: "#666", whiteSpace: "nowrap" }}>
                    {b.bereich}
                  </td>
                  <td style={{ padding: "7px 8px", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#888" }}>
                    {b.ka}
                  </td>
                  <td style={{ padding: "7px 8px", color: "#333", fontSize: 11 }}>
                    {b.bezeichnung}
                    {analysisActive && b.bem && (
                      <span style={{ display: "block", fontSize: 9, color: "#999", marginTop: 2 }}>{b.bem}</span>
                    )}
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#333" }}>
                    {formatEur(b.ist)}
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#999" }}>
                    {formatEur(b.plan)}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "right",
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      fontWeight: isAnomaly ? 700 : 400,
                      color: isHighAnomaly ? "#cc3333" : isAnomaly ? "#cc7700" : pct > 0 ? "#888" : "#008c46",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {pct > 0 ? "+" : ""}
                    {pct.toFixed(1)}%
                    {isHighAnomaly && (
                      <span style={{ marginLeft: 4, fontSize: 8, background: "#cc3333", color: "#fff", padding: "1px 4px", verticalAlign: "middle" }}>
                        ANOMALIE
                      </span>
                    )}
                    {isAnomaly && !isHighAnomaly && (
                      <span style={{ marginLeft: 4, fontSize: 8, background: "#cc7700", color: "#fff", padding: "1px 4px", verticalAlign: "middle" }}>
                        PRÜFEN
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "7px 8px", fontSize: 10, color: "#999" }}>{b.monat}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #ddd" }}>
              <td colSpan={4} style={{ padding: "8px 8px", fontSize: 11, fontWeight: 600, color: "#333" }}>Summe Q1 (Auszug)</td>
              <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "#333" }}>
                {formatEur(BUCHUNGEN.reduce((s, b) => s + b.ist, 0))}
              </td>
              <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999" }}>
                {formatEur(BUCHUNGEN.reduce((s, b) => s + b.plan, 0))}
              </td>
              <td style={{ padding: "8px 8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: "#cc3333" }}>
                +{abweichungPct(
                  BUCHUNGEN.reduce((s, b) => s + b.ist, 0),
                  BUCHUNGEN.reduce((s, b) => s + b.plan, 0)
                ).toFixed(1)}%
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Analyse-Button */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <button
          onClick={() => {
            setAnalysisActive(!analysisActive);
            setExpandedAnomaly(null);
          }}
          style={{
            background: analysisActive ? "#111" : "#008c46",
            color: "#fff",
            border: "none",
            padding: "14px 40px",
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {analysisActive ? "Analyse zurücksetzen" : "KI-Analyse starten"}
        </button>
      </div>

      {/* Analysis Results */}
      {analysisActive && (
        <div>
          {/* Summary KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
            <div style={cardStyle}>
              <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Anomalien</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#cc3333" }}>{anomalyCount}</div>
              <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>{handlungsbedarf} mit Handlungsbedarf</div>
            </div>
            <div style={cardStyle}>
              <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Gesamtabweichung</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#cc7700" }}>+{formatEur(gesamtAbweichung)}</div>
              <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>€ über Plan (Q1 Auszug)</div>
            </div>
            <div style={cardStyle}>
              <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Kontierungsfehler</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#cc3333" }}>2</div>
              <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>Umbuchungen erforderlich</div>
            </div>
            <div style={cardStyle}>
              <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Compliance</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#cc7700" }}>1</div>
              <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>Genehmigungsverstoß</div>
            </div>
          </div>

          {/* BAB — Zuschlagssätze */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div
              onClick={() => setShowBAB(!showBAB)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            >
              <div style={{ ...monoLabel, color: "#008c46" }}>Betriebsabrechnungsbogen (BAB) — Zuschlagssätze</div>
              <span style={{ fontSize: 14, color: "#ccc", transition: "transform 0.2s", transform: showBAB ? "rotate(180deg)" : "rotate(0)" }}>
                {"\u25BE"}
              </span>
            </div>
            {showBAB && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 16 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    {["Gemeinkostenart", "Bezugsbasis", "Plan-Satz", "Ist-Satz", "Abweichung"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 8px", ...monoLabel, fontSize: 9 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BAB_DATEN.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <td style={{ padding: "6px 8px", fontSize: 12, color: "#333" }}>{row.bereich}</td>
                      <td style={{ padding: "6px 8px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#888" }}>{row.basis}</td>
                      <td style={{ padding: "6px 8px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#008c46" }}>{row.planSatz}</td>
                      <td style={{ padding: "6px 8px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#cc3333" }}>{row.istSatz}</td>
                      <td style={{ padding: "6px 8px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#cc7700", fontWeight: 600 }}>{row.abw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Anomaly Detection */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div style={{ ...monoLabel, marginBottom: 16, color: "#cc3333" }}>
              Anomalie-Erkennung — Detailanalyse mit Abweichungszerlegung
            </div>
            {ANOMALIEN.map((a, i) => {
              const isExpanded = expandedAnomaly === i;
              return (
                <div
                  key={i}
                  style={{
                    borderBottom: i < ANOMALIEN.length - 1 ? "1px solid #f0f0f0" : "none",
                    padding: "12px 0",
                  }}
                >
                  <div
                    onClick={() => setExpandedAnomaly(isExpanded ? null : i)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: a.schwere === "hoch" ? "#cc3333" : "#cc7700",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{a.titel}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 9,
                        color: "#666",
                        background: "#f5f5f5",
                        padding: "2px 8px",
                        fontFamily: "'Space Mono', monospace",
                        letterSpacing: "0.03em",
                      }}>
                        {a.kategorie}
                      </span>
                      <span style={{ fontSize: 9, color: "#fff", background: a.schwere === "hoch" ? "#cc3333" : "#cc7700", padding: "2px 8px", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
                        {a.schwere}
                      </span>
                      <span style={{ fontSize: 14, color: "#ccc", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
                        {"\u25BE"}
                      </span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ ...codeBlock, marginTop: 12 }}>
                      {a.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pattern Recognition */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div style={{ ...monoLabel, marginBottom: 16, color: "#cc7700" }}>Strukturelle Muster — Querschnittsanalyse</div>
            {MUSTER.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: i < MUSTER.length - 1 ? "1px solid #f5f5f5" : "none",
                  fontSize: 12,
                  color: "#555",
                  lineHeight: 1.6,
                }}
              >
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  color: "#fff",
                  background: m.farbe,
                  padding: "2px 6px",
                  flexShrink: 0,
                  marginTop: 2,
                  height: "fit-content",
                }}>
                  {m.typ}
                </span>
                <span>{m.muster}</span>
              </div>
            ))}
          </div>

          {/* KI-Gesamtbewertung */}
          <div style={{ ...codeBlock, marginBottom: 32, fontSize: 11 }}>
            <span style={{ color: "#008c46" }}>{"// ═══ KI-Gesamtbewertung Q1 ═══"}</span>
            {"\n\n"}
            <span style={{ color: "#e6db74" }}>Datenqualität:</span>
            {"    17,6% Kontierungsfehlerquote (>€15.000) — Schwellenwert 5%\n"}
            <span style={{ color: "#e6db74" }}>Kostenentwicklung:</span>
            {" Gesamtkosten +8,7% ggü. Plan (bereinigt um Sondereffekte: +4,2%)\n"}
            <span style={{ color: "#e6db74" }}>Haupttreiber:</span>
            {"    1) Materialpreise (+16% Stahl) 2) WP-Mehrkosten IFRS\n"}
            <span style={{ color: "#e6db74" }}>Risikobewertung:</span>
            {" Bei Fortschreibung → Jahresbudget-Überschreitung +€480.000\n\n"}
            <span style={{ color: "#008c46" }}>{"// ═══ Empfohlene Maßnahmen (priorisiert nach Impact) ═══"}</span>
            {"\n\n"}
            {"1. SOFORT    Umbuchung M&A-Kosten auf KTR 800100         Impact: €16.200\n"}
            {"2. SOFORT    Nachgenehmigung Leiharbeit KSt 1200          Compliance\n"}
            {"3. KW 14     RAP-Buchung WP-Kosten (Periodenabgrenzung)   Impact: €63.750\n"}
            {"4. KW 15     Hedging-Strategie Stahl Q2/Q3 prüfen        Impact: ~€95.000\n"}
            {"5. KW 16     IP-Audit Patentportfolio veranlassen         Impact: €34.000 p.a.\n"}
            {"6. Q2        Energieaudit Druckluft/Beleuchtung/Kompr.    Impact: ~€18.000 p.a.\n"}
            {"7. Q2        GK-Zuschlagssätze in SAP CO anpassen         Kalkulation\n"}
            {"8. PLAN 2025 Saisonale Budgetverteilung Vertrieb          Plangenauigkeit"}
          </div>
        </div>
      )}

      {/* KI-Brücke Info Box */}
      <div
        style={{
          border: "1px solid #0066cc",
          borderLeft: "3px solid #0066cc",
          padding: "20px 24px",
          background: "rgba(0,102,204,0.03)",
        }}
      >
        <div style={{ ...monoLabel, color: "#0066cc", marginBottom: 10 }}>KI-Brücke — Von der Plankostenrechnung zur prädiktiven Analyse</div>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, margin: "0 0 12px" }}>
          Die klassische Kostenstellenrechnung nach Kilger/Pampel/Vikas liefert Abweichungsanalysen
          auf Basis fester Schwellenwerte. KI erweitert diesen Ansatz um drei Dimensionen:
        </p>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
          <strong>1. Multivariate Anomalie-Erkennung:</strong> Statt fester %-Schwellen erkennt
          das Modell Ausreißer im Kontext aller Kostenstellen gleichzeitig (Isolation Forest, DBSCAN).
          Eine +20%-Abweichung bei Material ist bei steigendem LME-Index normal — bei gleichbleibendem Index aber eine Anomalie.
          <br /><br />
          <strong>2. Kausale Verknüpfung:</strong> Automatische Zuordnung von Buchungen zu externen
          Einflussfaktoren (Rohstoffindizes, Tarifabschlüsse, Wechselkurse). Die Preisabweichung wird
          nicht nur quantifiziert, sondern erklärt.
          <br /><br />
          <strong>3. Compliance-Monitoring:</strong> Prüfung jeder Buchung gegen Unterschriftenregelung,
          Kontierungsrichtlinie und Budgetfreigaben — in Echtzeit statt bei der Jahresabschlussprüfung.
        </div>
      </div>
    </section>
  );
}
