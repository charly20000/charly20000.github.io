import { useState } from "react";

// ---------------------------------------------------------------------------
// ESG-Dashboard — CSRD-konform nach ESRS (EU 2023/2772)
// Daten orientiert an veröffentlichten Nachhaltigkeitsberichten:
// Siemens AG (2023), BASF SE (2023), Krones AG (2023), GEA Group (2023)
// CO₂-Emissionsfaktoren: UBA (2024), GHG Protocol (2023)
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
// Scope 1/2/3 — nach GHG Protocol Corporate Standard
// Emissionsfaktoren: UBA Emissionsbilanz erneuerbarer Energieträger 2024
// ---------------------------------------------------------------------------
const SCOPES = [
  {
    label: "Scope 1",
    sub: "Direkte Emissionen (GHG Protocol Kap. 4)",
    value: 2840,
    sources: [
      { name: "Erdgas (Heizung/Prozess)", value: 1620, factor: "UBA: 0,201 kg CO₂e/kWh" },
      { name: "Fuhrpark (Diesel/Benzin)", value: 780, factor: "UBA: 2,65 kg CO₂e/l Diesel" },
      { name: "Kältemittel (R-410A Leckage)", value: 340, factor: "GWP: 2.088 (IPCC AR6)" },
      { name: "Notstromaggregate", value: 100, factor: "UBA: 0,266 kg CO₂e/kWh" },
    ],
    color: "#008c46",
  },
  {
    label: "Scope 2",
    sub: "Indirekte Energie (market-based, GHG Protocol Kap. 5)",
    value: 1890,
    sources: [
      { name: "Strom (Netz-Mix DE)", value: 1420, factor: "UBA 2024: 0,380 kg CO₂e/kWh" },
      { name: "Fernwärme", value: 470, factor: "UBA: 0,185 kg CO₂e/kWh" },
    ],
    note: "Location-based: 2.140 t CO₂e | Differenz durch Grünstrom-Zertifikate (HKN): -250 t",
    color: "#cc7700",
  },
  {
    label: "Scope 3",
    sub: "Wertschöpfungskette (15 Kategorien, GHG Protocol Kap. 6)",
    value: 18420,
    sources: [
      { name: "Kat. 1: Eingekaufte Güter/DL", value: 9800, factor: "Spend-based: Ecoinvent 3.9" },
      { name: "Kat. 4: Vorgelagerter Transport", value: 2100, factor: "GLEC Framework v3.0" },
      { name: "Kat. 6: Geschäftsreisen", value: 680, factor: "UBA: 0,214 kg CO₂e/pkm Flug" },
      { name: "Kat. 7: Pendeln Mitarbeitende", value: 1240, factor: "UBA: 0,147 kg CO₂e/pkm PKW" },
      { name: "Kat. 11: Nutzung verk. Produkte", value: 3200, factor: "LCA gem. ISO 14040/14044" },
      { name: "Kat. 12: End-of-Life", value: 1400, factor: "UBA Abfallbilanz 2023" },
    ],
    note: "Screening aller 15 Kategorien durchgeführt. 6 als wesentlich identifiziert (>1% der Gesamtemissionen).",
    color: "#cc3333",
  },
];

const TOTAL_CO2 = SCOPES.reduce((s, scope) => s + scope.value, 0);

// ---------------------------------------------------------------------------
// CSRD-Kennzahlen — orientiert an ESRS-Datenpunkten
// ---------------------------------------------------------------------------
const KPIS = [
  { label: "CO₂-Intensität", value: "192,9", unit: "t CO₂e / Mio. € Umsatz", esrs: "ESRS E1-6", benchmark: "Branche: 160–280 t/Mio.€", trend: "down", trendVal: "-8,3% ggü. Vj." },
  { label: "Energieverbrauch", value: "28,4 GWh", unit: "davon 34% erneuerbar", esrs: "ESRS E1-5", benchmark: "Ziel 2027: 55% erneuerbar", trend: "up", trendVal: "+6 Pp ggü. Vj." },
  { label: "Wasserentnahme", value: "185.000 m³", unit: "davon 12% Prozesswasser (Kreislauf)", esrs: "ESRS E3-4", benchmark: "Intensität: 1,54 m³/T€", trend: "down", trendVal: "-3,2% ggü. Vj." },
  { label: "Abfallaufkommen", value: "4.200 t", unit: "Verwertungsquote: 78%", esrs: "ESRS E5-5", benchmark: "Ziel 2028: 90% Verwertung", trend: "up", trendVal: "+4 Pp ggü. Vj." },
  { label: "LTIR", value: "2,8", unit: "Lost Time Injury Rate (pro 1 Mio. Arbeitsstunden)", esrs: "ESRS S1-14", benchmark: "Branche: 3,5–8,0", trend: "down", trendVal: "-0,4 ggü. Vj." },
  { label: "Gender Diversity", value: "18,4%", unit: "Frauenanteil Führungsebene 1+2", esrs: "ESRS S1-9", benchmark: "DAX-Schnitt: 22,3%", trend: "up", trendVal: "+2,1 Pp ggü. Vj." },
  { label: "Weiterbildung", value: "Ø 32h", unit: "pro MA (davon 8h ESG-Schulungen)", esrs: "ESRS S1-13", benchmark: "Branche: 24–40h", trend: "up", trendVal: "+4h ggü. Vj." },
  { label: "Gender Pay Gap", value: "4,8%", unit: "bereinigt (Vollzeitäquivalent, gleiche Stufe)", esrs: "ESRS S1-16", benchmark: "Branche: 5–9%", trend: "down", trendVal: "-1,2 Pp ggü. Vj." },
];

// ---------------------------------------------------------------------------
// ESRS-Standards — alle 12 themenspezifischen Standards
// ---------------------------------------------------------------------------
const ESRS_STANDARDS = [
  { code: "E1", name: "Klimawandel", status: "teilweise erfüllt", detail: "Scope 1+2 vollständig, Scope 3 Kat. 1–7 + 11–12 berichtet. SBTi-Validierung ausstehend.", color: "#cc7700" },
  { code: "E2", name: "Umweltverschmutzung", status: "in Bearbeitung", detail: "Luft-/Wasseremissionen erfasst. REACH-Compliance dokumentiert. PFAS-Screening Q2/2025.", color: "#cc7700" },
  { code: "E3", name: "Wasser- und Meeresressourcen", status: "teilweise erfüllt", detail: "Wasserentnahme nach Quelle erfasst. Wasserstress-Analyse (WRI Aqueduct) für alle Standorte.", color: "#cc7700" },
  { code: "E4", name: "Biodiversität und Ökosysteme", status: "nicht wesentlich", detail: "Doppelte Wesentlichkeitsanalyse: keine wesentlichen Auswirkungen identifiziert (kein Standort in Schutzgebiet).", color: "#999" },
  { code: "E5", name: "Kreislaufwirtschaft", status: "in Bearbeitung", detail: "Abfallbilanz nach EAK-Schlüssel erstellt. Zirkularitätsrate Produkte: 12% (Ziel 2030: 30%).", color: "#cc7700" },
  { code: "S1", name: "Eigene Belegschaft", status: "erfüllt", detail: "Vollständig gem. ESRS S1. Betriebsrat-Konsultation dokumentiert. Due-Diligence nach UNGP.", color: "#008c46" },
  { code: "S2", name: "Arbeitskräfte Wertschöpfungskette", status: "in Bearbeitung", detail: "Lieferanten-Code of Conduct: 89% Abdeckung Tier 1. Audits: 34 von 128 Lieferanten.", color: "#cc7700" },
  { code: "S3", name: "Betroffene Gemeinschaften", status: "nicht wesentlich", detail: "Keine wesentlichen negativen Auswirkungen auf lokale Gemeinschaften identifiziert.", color: "#999" },
  { code: "S4", name: "Verbraucher und Endnutzer", status: "erfüllt", detail: "Produktsicherheit gem. Maschinenrichtlinie 2006/42/EG. CE-Konformität 100%.", color: "#008c46" },
  { code: "G1", name: "Unternehmensführung", status: "erfüllt", detail: "DCGK-Entsprechenserklärung abgegeben. Whistleblower-System (HinSchG) implementiert seit 07/2023.", color: "#008c46" },
];

// ---------------------------------------------------------------------------
// Reduktionspfad — SBTi-aligned (Well-below 2°C)
// ---------------------------------------------------------------------------
const MILESTONES = [
  { year: "2023", value: "23.150t", label: "Baseline", pct: 100, detail: "Basisjahr nach GHG Protocol" },
  { year: "2025", value: "20.850t", label: "-10%", pct: 90, detail: "Quick Wins: LED, Fuhrpark-Elektrifizierung" },
  { year: "2027", value: "17.360t", label: "-25%", pct: 75, detail: "PPA Windpark, Wärmepumpe Halle 1+2" },
  { year: "2030", value: "11.575t", label: "-50%", pct: 50, detail: "SBTi Near-Term Target (1,5°C-Pfad Scope 1+2)" },
  { year: "2035", value: "6.945t", label: "-70%", pct: 30, detail: "Scope 3 Supplier Engagement Target" },
  { year: "2045", value: "0t", label: "Net Zero", pct: 0, detail: "Residualemissionen: Kompensation gem. SBTi Net-Zero Standard" },
];

// ---------------------------------------------------------------------------
// EU-Taxonomie
// ---------------------------------------------------------------------------
const TAXONOMIE = [
  { aktivitaet: "3.6 Herstellung anderer CO₂-armer Technologien", umsatz: "34%", capex: "42%", opex: "28%", aligned: true },
  { aktivitaet: "7.3 Installation energieeffizienter Gebäudetechnik", umsatz: "8%", capex: "15%", opex: "6%", aligned: true },
  { aktivitaet: "Nicht-taxonomiefähige Aktivitäten", umsatz: "58%", capex: "43%", opex: "66%", aligned: false },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ESGDashboard() {
  const [esrsExpanded, setEsrsExpanded] = useState(false);
  const [expandedScope, setExpandedScope] = useState(null);
  const [showTaxonomie, setShowTaxonomie] = useState(false);

  return (
    <section
      id="esg"
      style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}
    >
      <div style={{ ...monoLabel, letterSpacing: "0.3em", color: "#008c46", marginBottom: 12 }}>
        10 — ESG-Reporting
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
        CSRD-konformes <span style={{ fontWeight: 700 }}>Nachhaltigkeits-Reporting</span>
      </h2>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 12, maxWidth: 750 }}>
        Vollständige ESG-Berichterstattung nach ESRS (EU 2023/2772). CO₂-Bilanzierung nach
        GHG Protocol Corporate Standard mit Scope 1/2/3-Zerlegung, ESRS-Compliance-Status
        aller 12 themenspezifischen Standards, EU-Taxonomie-Berichterstattung und SBTi-alignierter Reduktionspfad.
      </p>
      <p style={{ fontSize: 12, color: "#bbb", marginBottom: 48, fontFamily: "'Space Mono', monospace" }}>
        Modellunternehmen: Maschinenbau, €120 Mio. Umsatz, 650 MA | Emissionsfaktoren: UBA 2024, Ecoinvent 3.9
      </p>

      {/* Company profile */}
      <div style={{ ...cardStyle, marginBottom: 32 }}>
        <div style={{ ...monoLabel, marginBottom: 8 }}>Berichtspflicht nach Art. 19a EU-Bilanzrichtlinie (CSRD)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#999" }}>Unternehmen</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>Muster Maschinenbau GmbH</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#999" }}>Erstanwendung CSRD</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>GJ 2025 (Bericht 2026)</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#999" }}>Prüfung</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>Limited Assurance (ISAE 3000)</div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: "#bbb", fontStyle: "italic" }}>
          Doppelte Wesentlichkeitsanalyse (DMA) gem. ESRS 1 durchgeführt: 8 von 10 themenspezifischen Standards als wesentlich identifiziert.
        </div>
      </div>

      {/* CO₂-Bilanz */}
      <div style={{ ...monoLabel, marginBottom: 12, marginTop: 48 }}>
        CO₂-Bilanz nach GHG Protocol Corporate Standard (2023)
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {SCOPES.map((s, si) => (
          <div
            key={s.label}
            style={{ ...cardStyle, cursor: "pointer", borderColor: expandedScope === si ? s.color : "#eee", transition: "border-color 0.2s" }}
            onClick={() => setExpandedScope(expandedScope === si ? null : si)}
          >
            <div style={{ ...monoLabel, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>{s.sub}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>
              {s.value.toLocaleString("de-DE")}
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>t CO₂e ({((s.value / TOTAL_CO2) * 100).toFixed(0)}%)</div>
            {expandedScope === si && (
              <div style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 10 }}>
                {s.sources.map((src, j) => (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f8f8f8" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#444" }}>{src.name}</div>
                      <div style={{ fontSize: 9, color: "#bbb" }}>{src.factor}</div>
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: s.color, fontWeight: 600 }}>
                      {src.value.toLocaleString("de-DE")} t
                    </div>
                  </div>
                ))}
                {s.note && (
                  <div style={{ fontSize: 10, color: "#999", marginTop: 8, fontStyle: "italic" }}>{s.note}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stacked bar */}
      <div style={{ ...cardStyle, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ ...monoLabel }}>Emissionsverteilung</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
            Gesamt: {TOTAL_CO2.toLocaleString("de-DE")} t CO₂e
          </div>
        </div>
        <div style={{ display: "flex", height: 32, overflow: "hidden" }}>
          {SCOPES.map((s) => {
            const pctVal = (s.value / TOTAL_CO2) * 100;
            return (
              <div
                key={s.label}
                style={{
                  width: `${pctVal}%`,
                  background: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 10,
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 600,
                }}
              >
                {pctVal.toFixed(0)}%
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {SCOPES.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, background: s.color }} />
              <span style={{ fontSize: 11, color: "#666" }}>{s.label}: {s.value.toLocaleString("de-DE")} t</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: "#bbb" }}>
          Scope 3 dominiert mit {((SCOPES[2].value / TOTAL_CO2) * 100).toFixed(0)}% — typisch für Maschinenbau (Branchenrange: 65–85%).
          Vgl. Siemens AG 2023: Scope 3 = 99% der Gesamtemissionen.
        </div>
      </div>

      {/* CSRD-Kennzahlen */}
      <div style={{ ...monoLabel, marginBottom: 12, marginTop: 48 }}>ESRS-Datenpunkte — Kennzahlen</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {KPIS.map((kpi) => (
          <div key={kpi.label} style={{ ...cardStyle }}>
            <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>{kpi.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{kpi.unit}</div>
            <div style={{
              marginTop: 6,
              fontSize: 9,
              color: kpi.trend === "down" ? "#008c46" : "#0066cc",
              fontFamily: "'Space Mono', monospace",
            }}>
              {kpi.trend === "down" ? "↓" : "↑"} {kpi.trendVal}
            </div>
            <div style={{ fontSize: 9, color: "#ccc", marginTop: 2 }}>
              {kpi.benchmark}
            </div>
            <div style={{ fontSize: 8, color: "#ddd", marginTop: 2 }}>{kpi.esrs}</div>
          </div>
        ))}
      </div>

      {/* ESRS-Standards */}
      <div style={{ ...monoLabel, marginBottom: 12, marginTop: 48 }}>ESRS-Compliance (alle 10 themenspezifischen Standards)</div>

      <div style={{ ...cardStyle, marginBottom: 32, cursor: "pointer" }}>
        <div
          onClick={() => setEsrsExpanded(!esrsExpanded)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>
            Compliance-Status nach ESRS (EU 2023/2772)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#008c46", fontFamily: "'Space Mono', monospace" }}>
              3 erfüllt
            </span>
            <span style={{ fontSize: 11, color: "#cc7700", fontFamily: "'Space Mono', monospace" }}>
              5 in Arbeit
            </span>
            <span style={{ fontSize: 11, color: "#999", fontFamily: "'Space Mono', monospace" }}>
              2 n.w.
            </span>
            <span style={{
              fontSize: 18,
              color: "#999",
              transform: esrsExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}>
              ▼
            </span>
          </div>
        </div>

        {esrsExpanded && (
          <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
            {ESRS_STANDARDS.map((s) => (
              <div
                key={s.code}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: s.color,
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    color: "#111",
                    width: 28,
                    flexShrink: 0,
                  }}>
                    {s.code}
                  </div>
                  <div style={{ fontSize: 13, color: "#333", flex: 1 }}>{s.name}</div>
                  <div style={{
                    fontSize: 10,
                    color: s.color,
                    fontFamily: "'Space Mono', monospace",
                    textAlign: "right",
                    minWidth: 120,
                  }}>
                    {s.status}
                  </div>
                </div>
                <div style={{ marginLeft: 50, marginTop: 4, fontSize: 11, color: "#999", lineHeight: 1.5 }}>
                  {s.detail}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EU-Taxonomie */}
      <div style={{ ...monoLabel, marginBottom: 12, marginTop: 48 }}>EU-Taxonomie-Berichterstattung (Art. 8 Taxonomie-VO)</div>

      <div style={{ ...cardStyle, marginBottom: 32, cursor: "pointer" }}>
        <div
          onClick={() => setShowTaxonomie(!showTaxonomie)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>
            Taxonomie-Fähigkeit und -Konformität
          </div>
          <span style={{
            fontSize: 18,
            color: "#999",
            transform: showTaxonomie ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}>
            ▼
          </span>
        </div>
        {showTaxonomie && (
          <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  {["Wirtschaftsaktivität", "Umsatz", "CapEx", "OpEx", "Konformität"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", ...monoLabel, fontSize: 9 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TAXONOMIE.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "8px", fontSize: 11, color: "#333" }}>{row.aktivitaet}</td>
                    <td style={{ padding: "8px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#555" }}>{row.umsatz}</td>
                    <td style={{ padding: "8px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#555" }}>{row.capex}</td>
                    <td style={{ padding: "8px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#555" }}>{row.opex}</td>
                    <td style={{ padding: "8px" }}>
                      <span style={{
                        fontSize: 9,
                        fontFamily: "'Space Mono', monospace",
                        color: row.aligned ? "#008c46" : "#999",
                        background: row.aligned ? "rgba(0,140,70,0.08)" : "#f5f5f5",
                        padding: "2px 8px",
                      }}>
                        {row.aligned ? "ALIGNED" : "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10, color: "#bbb", marginTop: 8 }}>
              Taxonomie-fähiger Umsatzanteil: 42% | Taxonomie-konformer Umsatzanteil: 34%
              (Prüfung DNSH-Kriterien und Mindestschutz gem. Art. 18 Taxonomie-VO)
            </div>
          </div>
        )}
      </div>

      {/* Reduktionspfad */}
      <div style={{ ...monoLabel, marginBottom: 12, marginTop: 48 }}>
        Reduktionspfad — SBTi Near-Term + Net-Zero Target
      </div>

      <div style={{ ...cardStyle, marginBottom: 32 }}>
        <div style={{ position: "relative", padding: "32px 0 16px" }}>
          <div style={{
            position: "absolute",
            top: 46,
            left: 0,
            right: 0,
            height: 2,
            background: "#eee",
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            {MILESTONES.map((m, i) => (
              <div key={m.year} style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: i === 0 ? "#cc3333" : i === MILESTONES.length - 1 ? "#008c46" : "#111",
                  marginBottom: 8,
                }}>
                  {m.value}
                </div>

                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: i === MILESTONES.length - 1 ? "#008c46" : i === 0 ? "#cc3333" : "#cc7700",
                  border: "3px solid #fff",
                  margin: "0 auto",
                  position: "relative",
                  zIndex: 1,
                  boxShadow: "0 0 0 2px " + (i === MILESTONES.length - 1 ? "#008c46" : i === 0 ? "#cc3333" : "#cc7700"),
                }} />

                <div style={{ ...monoLabel, marginTop: 10, color: "#666", fontSize: 11 }}>
                  {m.year}
                </div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 8, color: "#ccc", marginTop: 2, maxWidth: 90, margin: "2px auto 0" }}>
                  {m.detail}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#bbb", marginTop: 12, textAlign: "center" }}>
          Methodik: SBTi Absolute Contraction Approach | Sektorleitfaden: Buildings & Industry
        </div>
      </div>

      {/* KI-Brücke */}
      <div style={{
        border: "1px solid #0066cc",
        borderLeft: "3px solid #0066cc",
        padding: "20px 24px",
        background: "rgba(0,102,204,0.03)",
      }}>
        <div style={{ ...monoLabel, color: "#0066cc", marginBottom: 10 }}>
          KI-Brücke — Automatisiertes ESG-Datenmanagement
        </div>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, margin: "0 0 12px" }}>
          Die größte Herausforderung der CSRD ist nicht das Reporting, sondern die Datenerfassung.
          KI löst drei zentrale Probleme:
        </p>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
          <strong>1. Scope-3-Berechnung:</strong> 60–80% des Aufwands entfällt auf Scope 3.
          KI extrahiert Emissionsdaten aus Lieferantenrechnungen (OCR + NLP), ordnet automatisch
          GHG-Kategorien zu und wendet Emissionsfaktoren aus Ecoinvent/DEFRA an. Bei fehlenden
          Primärdaten: Spend-based Estimation mit branchenspezifischen Faktoren.
          <br /><br />
          <strong>2. ESRS-Narrativ:</strong> CSRD erfordert neben Kennzahlen auch qualitative
          Offenlegungen (Strategie, Governance, Maßnahmen). KI generiert ESRS-konforme Textbausteine
          aus strukturierten Daten — inklusive XBRL-Taxonomie-Tagging für die digitale Einreichung.
          <br /><br />
          <strong>3. Doppelte Wesentlichkeit:</strong> Die DMA erfordert die Analyse von Impact-
          und finanzieller Wesentlichkeit über die gesamte Wertschöpfungskette. KI analysiert
          Stakeholder-Befragungen, Medien-Screening und regulatorische Datenbanken, um wesentliche
          Themen systematisch zu identifizieren und zu priorisieren.
        </div>
      </div>
    </section>
  );
}
