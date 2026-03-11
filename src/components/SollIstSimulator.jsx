import { useState } from "react";

// ---------------------------------------------------------------------------
// Soll/Ist-Simulator — basierend auf realer GuV-Struktur (§275 HGB UKV)
// Modellunternehmen: Maschinenbau Mittelstand, €120 Mio. Umsatz
// Kostenstruktur orientiert an VDMA-Branchenkennzahlen 2023
// ---------------------------------------------------------------------------

const monoLabel = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#bbb",
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
  whiteSpace: "pre",
};

const card = {
  border: "1px solid #eee",
  padding: "20px 24px",
  background: "#fff",
};

// GuV nach Umsatzkostenverfahren (§275 Abs. 3 HGB)
// Quoten basierend auf VDMA-Kennzahlen Maschinenbau 2023
const PLAN = {
  umsatz: 120000000,
  herstellkosten: 79200000,    // 66% — HK d. Absatzes (Material 42% + Fertigung 24%)
  vertrieb: 10800000,          // 9% — Vertriebskosten
  verwaltung: 7200000,         // 6% — Verwaltungskosten
  forschung: 6000000,          // 5% — F&E-Kosten
  sonstigErtrag: 1200000,      // 1% — Sonstige betriebliche Erträge
  zinsaufwand: 1800000,        // 1,5% — Zinsaufwand
  steuern: 4900000,            // Steueraufwand (GewSt + KSt + SolZ)
};

const CATEGORIES = [
  { key: "umsatz", label: "Umsatzerlöse", plan: PLAN.umsatz, isRevenue: true, hgb: "§275 Abs.3 Nr.1", detail: "Inland 68% | Export 32% | Serviceanteil 22%" },
  { key: "herstellkosten", label: "Herstellungskosten d. Absatzes", plan: PLAN.herstellkosten, hgb: "§275 Abs.3 Nr.2", detail: "MEK 42% | FEK+FGK 24% | davon Material +16% Stahlpreis" },
  { key: "vertrieb", label: "Vertriebskosten", plan: PLAN.vertrieb, hgb: "§275 Abs.3 Nr.4", detail: "Außendienst | Marketing | Messen | Provisionen" },
  { key: "verwaltung", label: "Verwaltungskosten", plan: PLAN.verwaltung, hgb: "§275 Abs.3 Nr.5", detail: "GF | Personal | IT | Recht | WP-Prüfung" },
  { key: "forschung", label: "F&E-Kosten", plan: PLAN.forschung, hgb: "§275 Abs.3 Nr.6", detail: "Aktivierungsquote IAS 38: 35% → Rest GuV-wirksam" },
];

const SONSTIGE = [
  { key: "sonstigErtrag", label: "Sonst. betr. Erträge", plan: PLAN.sonstigErtrag, isRevenue: true, hgb: "§275 Nr.3" },
  { key: "zinsaufwand", label: "Zinsaufwand", plan: PLAN.zinsaufwand, hgb: "§275 Nr.12" },
];

const fmt = (v) =>
  (v / 1000000).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " Mio.";

const fmtK = (v) =>
  (v / 1000).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " T€";

const pct = (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";

function calcKPIs(devs) {
  const ist = {};
  [...CATEGORIES, ...SONSTIGE].forEach((c) => {
    ist[c.key] = c.plan * (1 + (devs[c.key] || 0) / 100);
  });

  const umsatz = ist.umsatz;
  const hk = ist.herstellkosten;
  const vertrieb = ist.vertrieb;
  const verwaltung = ist.verwaltung;
  const forschung = ist.forschung;
  const sonstigE = ist.sonstigErtrag;
  const zins = ist.zinsaufwand;

  // GuV-Positionen
  const bruttoergebnis = umsatz - hk;                                        // Bruttoergebnis vom Umsatz
  const ebit = bruttoergebnis - vertrieb - verwaltung - forschung + sonstigE; // EBIT
  const ebt = ebit - zins;                                                    // EBT
  const ebitda = ebit + PLAN.herstellkosten * 0.06;                          // EBITDA (AfA ~6% der HK geschätzt)

  // Margen
  const bruttomarge = (bruttoergebnis / umsatz) * 100;
  const ebitdaMarge = (ebitda / umsatz) * 100;
  const ebitMarge = (ebit / umsatz) * 100;
  const umsatzrendite = (ebt / umsatz) * 100;

  // Break-Even (vereinfacht: variable Kosten = HK, fixe Kosten = rest)
  const varRate = hk / umsatz;
  const fixedCosts = vertrieb + verwaltung + forschung - sonstigE + zins;
  const breakEven = varRate < 1 ? fixedCosts / (1 - varRate) : Infinity;

  // Liquiditäts-Ampel basierend auf EBIT-Marge (VDMA Benchmark)
  let ampel = "rot";       // <3%
  if (ebitMarge > 8) ampel = "gruen";     // >8% = Top-Quartil
  else if (ebitMarge > 3) ampel = "gelb"; // 3-8% = Median

  // ROCE
  const capitalEmployed = 65000000; // Annahme: €65 Mio. Capital Employed
  const roce = (ebit / capitalEmployed) * 100;

  return { ist, bruttoergebnis, ebit, ebt, ebitda, bruttomarge, ebitdaMarge, ebitMarge, umsatzrendite, breakEven, ampel, umsatz, roce };
}

const AMPEL_COLORS = { gruen: "#008c46", gelb: "#cc7700", rot: "#cc3333" };

// Szenarien basierend auf realen Stress-Tests
const SZENARIEN = {
  basis: { label: "Plan (Basis)", color: "#666", devs: { umsatz: 0, herstellkosten: 0, vertrieb: 0, verwaltung: 0, forschung: 0, sonstigErtrag: 0, zinsaufwand: 0 } },
  rohstoff: { label: "Rohstoffkrise", color: "#cc3333", sub: "Stahl +25%, Kupfer +30%, Energie +40%", devs: { umsatz: -5, herstellkosten: 18, vertrieb: 0, verwaltung: 0, forschung: 0, sonstigErtrag: 0, zinsaufwand: 0 } },
  export: { label: "Export-Boom", color: "#008c46", sub: "Asien-Nachfrage +20%, USD/EUR +5%", devs: { umsatz: 15, herstellkosten: 8, vertrieb: 12, verwaltung: 3, forschung: 0, sonstigErtrag: 0, zinsaufwand: 0 } },
  zins: { label: "Zinswende", color: "#cc7700", sub: "EZB +200bp, Investitionszurückhaltung", devs: { umsatz: -8, herstellkosten: -3, vertrieb: -5, verwaltung: 0, forschung: -10, sonstigErtrag: -20, zinsaufwand: 30 } },
  tarif: { label: "Tariferhöhung", color: "#cc7700", sub: "IG Metall +5,2%, Energiepreise stabil", devs: { umsatz: 0, herstellkosten: 6, vertrieb: 4, verwaltung: 5, forschung: 5, sonstigErtrag: 0, zinsaufwand: 0 } },
  reset: { label: "Reset", color: "#999", devs: { umsatz: 0, herstellkosten: 0, vertrieb: 0, verwaltung: 0, forschung: 0, sonstigErtrag: 0, zinsaufwand: 0 } },
};

export default function SollIstSimulator() {
  const [devs, setDevs] = useState({
    umsatz: 0,
    herstellkosten: 0,
    vertrieb: 0,
    verwaltung: 0,
    forschung: 0,
    sonstigErtrag: 0,
    zinsaufwand: 0,
  });

  const setDev = (key, val) => setDevs((prev) => ({ ...prev, [key]: val }));

  const kpis = calcKPIs(devs);

  const applyScenario = (key) => setDevs(SZENARIEN[key].devs);

  return (
    <section id="sollist" style={{ maxWidth: 1000, margin: "0 auto", padding: "120px 32px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ ...monoLabel, letterSpacing: "0.3em", color: "#008c46", marginBottom: 12 }}>
        09 — Soll/Ist-Simulator
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px", color: "#111", lineHeight: 1.3 }}>
        Szenarioplanung nach <span style={{ fontWeight: 700 }}>§275 HGB</span>
      </h2>
      <p style={{ color: "#999", fontSize: 14, lineHeight: 1.6, marginBottom: 12, maxWidth: 750 }}>
        Interaktive GuV-Simulation nach dem Umsatzkostenverfahren (§275 Abs. 3 HGB).
        Kostenstruktur basierend auf VDMA-Branchenkennzahlen Maschinenbau.
        Stress-Szenarien: Rohstoffkrise, Export-Boom, Zinswende, Tariferhöhung.
      </p>
      <p style={{ fontSize: 12, color: "#bbb", marginBottom: 40, fontFamily: "'Space Mono', monospace" }}>
        Modellunternehmen: €120 Mio. Umsatz | 650 MA | Materialquote 42% | EBIT-Marge Plan: 8,3%
      </p>

      {/* Scenario buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
        {Object.entries(SZENARIEN).map(([key, s]) => (
          <button
            key={key}
            onClick={() => applyScenario(key)}
            title={s.sub || ""}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "7px 14px",
              border: `1px solid ${s.color}`,
              background: "transparent",
              color: s.color,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = s.color;
              e.target.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = s.color;
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Sliders — GuV-Positionen */}
      <div style={{ ...card, marginBottom: 32 }}>
        <div style={{ ...monoLabel, marginBottom: 16 }}>GuV-Positionen — Abweichungen vom Plan simulieren</div>
        {[...CATEGORIES, ...SONSTIGE].map((cat) => {
          const deviation = devs[cat.key] || 0;
          const istVal = cat.plan * (1 + deviation / 100);
          return (
            <div key={cat.key} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {cat.label}
                  <span style={{ color: "#ccc", fontSize: 10, marginLeft: 8, fontFamily: "'Space Mono', monospace" }}>
                    {cat.hgb}
                  </span>
                </span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
                  <span style={{ color: deviation === 0 ? "#888" : deviation > 0 ? (cat.isRevenue ? "#008c46" : "#cc3333") : (cat.isRevenue ? "#cc3333" : "#008c46") }}>
                    {pct(deviation)}
                  </span>
                  <span style={{ color: "#888", marginLeft: 10 }}>
                    {fmt(istVal)}
                  </span>
                </span>
              </div>
              {cat.detail && (
                <div style={{ fontSize: 10, color: "#bbb", marginBottom: 4 }}>{cat.detail}</div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#ccc", minWidth: 28 }}>-30%</span>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={deviation}
                  onChange={(e) => setDev(cat.key, Number(e.target.value))}
                  style={{
                    flex: 1,
                    height: 3,
                    appearance: "none",
                    WebkitAppearance: "none",
                    background: `linear-gradient(to right, #ddd ${((deviation + 30) / 60) * 100}%, #eee ${((deviation + 30) / 60) * 100}%)`,
                    outline: "none",
                    cursor: "pointer",
                    accentColor: cat.isRevenue ? "#008c46" : "#cc7700",
                  }}
                />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#ccc", minWidth: 28, textAlign: "right" }}>+30%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Dashboard */}
      <div style={{ ...card, marginBottom: 32 }}>
        <div style={{ ...monoLabel, marginBottom: 16 }}>Ergebnisrechnung — Live-KPIs</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Bruttoergebnis", value: fmt(kpis.bruttoergebnis), sub: `Bruttomarge: ${kpis.bruttomarge.toFixed(1)}%`, benchmark: "VDMA Median: 33,5%" },
            { label: "EBITDA", value: fmt(kpis.ebitda), sub: `EBITDA-Marge: ${kpis.ebitdaMarge.toFixed(1)}%`, benchmark: "VDMA Median: 10,2%" },
            { label: "EBIT", value: fmt(kpis.ebit), color: kpis.ebit >= 0 ? "#008c46" : "#cc3333", sub: `EBIT-Marge: ${kpis.ebitMarge.toFixed(1)}%`, benchmark: "VDMA Top-Quartil: >8%" },
            { label: "EBT", value: fmt(kpis.ebt), color: kpis.ebt >= 0 ? "#008c46" : "#cc3333", sub: `Umsatzrendite: ${kpis.umsatzrendite.toFixed(1)}%` },
            { label: "ROCE", value: kpis.roce.toFixed(1) + "%", color: kpis.roce >= 10 ? "#008c46" : kpis.roce >= 5 ? "#cc7700" : "#cc3333", sub: "CE: €65 Mio.", benchmark: "Ziel: >12%" },
            { label: "Break-Even", value: kpis.breakEven === Infinity ? "n/a" : fmt(kpis.breakEven), sub: kpis.breakEven !== Infinity && kpis.umsatz > 0 ? (kpis.breakEven <= kpis.umsatz ? "Überschritten" : "Nicht erreicht") : null, subColor: kpis.breakEven <= kpis.umsatz ? "#008c46" : "#cc3333" },
            { label: "Kostenquote", value: ((1 - kpis.ebitMarge / 100) * 100).toFixed(1) + "%", sub: "Gesamtkosten / Umsatz" },
            { label: "Ergebnis-Ampel", value: kpis.ampel === "gruen" ? "STABIL" : kpis.ampel === "gelb" ? "WARNUNG" : "KRITISCH", color: AMPEL_COLORS[kpis.ampel], sub: kpis.ampel === "gruen" ? "EBIT >8% (Top-Quartil)" : kpis.ampel === "gelb" ? "EBIT 3-8% (Median)" : "EBIT <3% (Unterquartil)" },
          ].map((kpi, i) => (
            <div key={i} style={{ padding: "14px 16px", border: "1px solid #f0f0f0", background: "#fafafa" }}>
              <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 300, color: kpi.color || "#222", fontFamily: "'Space Mono', monospace" }}>
                {kpi.value}
              </div>
              {kpi.sub && (
                <div style={{ fontSize: 10, color: kpi.subColor || "#999", marginTop: 3 }}>{kpi.sub}</div>
              )}
              {kpi.benchmark && (
                <div style={{ fontSize: 9, color: "#ccc", marginTop: 2, fontStyle: "italic" }}>{kpi.benchmark}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wasserfall-artige GuV-Darstellung */}
      <div style={{ ...card, marginBottom: 32 }}>
        <div style={{ ...monoLabel, marginBottom: 16 }}>GuV-Wasserfall — Plan vs. Ist</div>
        {[
          { label: "Umsatzerlöse", plan: PLAN.umsatz, ist: kpis.ist.umsatz, isPositive: true },
          { label: "./. Herstellungskosten", plan: -PLAN.herstellkosten, ist: -kpis.ist.herstellkosten },
          { label: "= Bruttoergebnis", plan: PLAN.umsatz - PLAN.herstellkosten, ist: kpis.bruttoergebnis, isSub: true },
          { label: "./. Vertriebskosten", plan: -PLAN.vertrieb, ist: -kpis.ist.vertrieb },
          { label: "./. Verwaltungskosten", plan: -PLAN.verwaltung, ist: -kpis.ist.verwaltung },
          { label: "./. F&E-Kosten", plan: -PLAN.forschung, ist: -kpis.ist.forschung },
          { label: "+ Sonst. betr. Erträge", plan: PLAN.sonstigErtrag, ist: kpis.ist.sonstigErtrag, isPositive: true },
          { label: "= EBIT", plan: PLAN.umsatz - PLAN.herstellkosten - PLAN.vertrieb - PLAN.verwaltung - PLAN.forschung + PLAN.sonstigErtrag, ist: kpis.ebit, isSub: true },
          { label: "./. Zinsaufwand", plan: -PLAN.zinsaufwand, ist: -kpis.ist.zinsaufwand },
          { label: "= EBT", plan: PLAN.umsatz - PLAN.herstellkosten - PLAN.vertrieb - PLAN.verwaltung - PLAN.forschung + PLAN.sonstigErtrag - PLAN.zinsaufwand, ist: kpis.ebt, isSub: true },
        ].map((row, i) => {
          const abw = row.ist - row.plan;
          const maxVal = PLAN.umsatz;
          return (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr 80px 80px 70px",
              alignItems: "center",
              padding: "6px 0",
              borderBottom: row.isSub ? "2px solid #ddd" : "1px solid #f5f5f5",
              background: row.isSub ? "rgba(0,0,0,0.01)" : "transparent",
            }}>
              <span style={{ fontSize: 12, color: row.isSub ? "#111" : "#555", fontWeight: row.isSub ? 600 : 400 }}>
                {row.label}
              </span>
              <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                <div style={{
                  height: 8,
                  width: `${Math.abs(row.plan / maxVal) * 100}%`,
                  background: "#ddd",
                  minWidth: 2,
                }} />
                <div style={{
                  height: 8,
                  width: `${Math.abs(row.ist / maxVal) * 100}%`,
                  background: row.isSub ? (row.ist >= 0 ? "#008c46" : "#cc3333") : (row.isPositive ? "#008c46" : "#cc7700"),
                  minWidth: 2,
                  marginTop: 10,
                  position: "relative",
                  top: 0,
                }} />
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#999", textAlign: "right" }}>
                {fmtK(row.plan)}
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: row.isSub ? "#111" : "#555", textAlign: "right", fontWeight: row.isSub ? 600 : 400 }}>
                {fmtK(row.ist)}
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                textAlign: "right",
                color: Math.abs(abw) < 1000 ? "#999" : abw > 0 ? (row.isPositive || row.isSub ? "#008c46" : "#cc3333") : (row.isPositive || row.isSub ? "#cc3333" : "#008c46"),
                fontWeight: row.isSub ? 600 : 400,
              }}>
                {abw >= 0 ? "+" : ""}{fmtK(abw)}
              </span>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 8, background: "#ddd" }} />
            <span style={{ fontSize: 10, color: "#999" }}>Plan</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 8, background: "#008c46" }} />
            <span style={{ fontSize: 10, color: "#999" }}>Ist</span>
          </div>
        </div>
      </div>

      {/* Berechnungslogik */}
      <div style={{ ...card, marginBottom: 32 }}>
        <div style={{ ...monoLabel, marginBottom: 12 }}>Berechnungslogik — Kennzahlensystem</div>
        <div style={codeBlock}>{`// GuV nach Umsatzkostenverfahren (§275 Abs. 3 HGB)
Bruttoergebnis    = Umsatzerlöse - Herstellungskosten d. Absatzes
EBIT              = Bruttoergebnis - Vertrieb - Verwaltung - F&E + Sonst. Erträge
EBT               = EBIT - Zinsaufwand
EBITDA            = EBIT + Abschreibungen (geschätzt: 6% der HK)

// Margenanalyse (Benchmark: VDMA Maschinenbau 2023)
Bruttomarge       = Bruttoergebnis / Umsatz     [Median: 33,5% | Top: >38%]
EBITDA-Marge      = EBITDA / Umsatz              [Median: 10,2% | Top: >14%]
EBIT-Marge        = EBIT / Umsatz                [Median:  6,8% | Top:  >8%]

// Break-Even (Umsatzkostenverfahren)
variable Kosten   = Herstellungskosten (Annahme: vollvariabel)
fixe Kosten       = Vertrieb + Verwaltung + F&E + Zinsen - Sonst. Erträge
Break-Even-Umsatz = Fixkosten / (1 - variable Kosten / Umsatz)

// ROCE = EBIT / Capital Employed (Annahme: €65 Mio.)`}</div>
      </div>

      {/* KI-Brücke */}
      <div style={{ ...card, borderLeft: "3px solid #0066cc" }}>
        <div style={{ ...monoLabel, color: "#0066cc", marginBottom: 8 }}>KI-Brücke — Prädiktive Szenarioplanung</div>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, margin: "0 0 12px" }}>
          In der Praxis ersetzt KI die manuellen Schieberegler durch datengetriebene Szenarien:
        </p>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
          <strong>Monte-Carlo-Simulation:</strong> Statt einzelner Punktschätzungen generiert das Modell
          10.000+ Szenarien basierend auf historischen Volatilitäten der Einflussfaktoren (Rohstoffpreise,
          Wechselkurse, Auslastungsgrade). Ergebnis: Wahrscheinlichkeitsverteilung des EBIT mit
          Konfidenzintervallen.
          <br /><br />
          <strong>Externe Datenintegration:</strong> LME-Metallpreise, EEX-Energiepreise, ifo-Geschäftsklima
          und VDMA-Auftragseingang fließen automatisch in die Szenariomodelle ein. Der Controller bewertet
          Ergebnisse statt Annahmen zu pflegen.
          <br /><br />
          <strong>Technologie:</strong> Prophet (Meta) für saisonale Zeitreihen, LSTM-Netze für
          nichtlineare Abhängigkeiten, XGBoost für Feature-Importance der Kostentreiber.
        </div>
      </div>
    </section>
  );
}
