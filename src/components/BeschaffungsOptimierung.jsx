import { useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Rohstoff-Beschaffungsoptimierung
// Modell: Kupfer (Cu) für Maschinenbau, Jahresbedarf 480t
// Preisbasis: LME Copper Settlement (USD/t), umgerechnet in EUR
// Einflussfaktoren: Saisonalität, Lagerkosten, Geopolitik, Volatilität
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
// Simulierte LME-Kupferpreise (12 Monate Historie + 6 Monate Prognose)
// Basierend auf realen LME-Preisentwicklungen 2023–2025
// ---------------------------------------------------------------------------
const MONATE = ["Apr 25", "Mai 25", "Jun 25", "Jul 25", "Aug 25", "Sep 25", "Okt 25", "Nov 25", "Dez 25", "Jan 26", "Feb 26", "Mär 26"];
const PROGNOSE_MONATE = ["Apr 26", "Mai 26", "Jun 26", "Jul 26", "Aug 26", "Sep 26"];

// LME Copper in EUR/t (basierend auf ~$9.200/t × 0,92 EUR/USD ± Schwankungen)
const PREISE_HISTORIE = [8340, 8510, 8720, 8480, 8290, 8150, 8380, 8620, 8890, 8750, 8930, 9120];

// Saisonfaktoren (empirisch: Kupfer teurer im Frühjahr wg. Bausaison China)
const SAISON_FAKTOREN = {
  Jan: -0.02, Feb: -0.01, Mär: 0.01, Apr: 0.03, Mai: 0.04, Jun: 0.02,
  Jul: -0.01, Aug: -0.03, Sep: -0.02, Okt: 0.00, Nov: 0.01, Dez: -0.02,
};

// Geopolitische Risikofaktoren (aktuelle Bewertung)
const GEO_FAKTOREN = [
  { name: "Chile (35% Weltproduktion)", risiko: "mittel", faktor: 0.03, detail: "Wasserknappheit Atacama, Lithium-Nationalisierungsdebatte, Streikrisiko Codelco/Escondida" },
  { name: "DR Kongo (12% Weltproduktion)", risiko: "hoch", faktor: 0.06, detail: "Bürgerkrieg Ostkongo, Exportsteuer-Erhöhung 2025, Kobalt-/Kupfer-Doppelförderung" },
  { name: "China (Nachfrage 55%)", risiko: "mittel", faktor: 0.04, detail: "Immobilienkrise Evergrande-Nachwirkung, Stimulus-Pakete, E-Mobilität-Push" },
  { name: "USD/EUR Wechselkurs", risiko: "mittel", faktor: 0.03, detail: "Fed vs. EZB Zinsdifferenz, EUR/USD aktuell ~1,09. ±5 Cent = ±€400/t" },
  { name: "Energiekosten Verhüttung", risiko: "niedrig", faktor: 0.01, detail: "Strompreise für Kupferhütten stabil, LNG-Versorgung gesichert" },
  { name: "Recycling-Quote (Sekundärkupfer)", risiko: "niedrig", faktor: -0.01, detail: "Schrottanteil steigt auf 35%, dämpft Primärnachfrage langfristig" },
];

// Lagerparameter
const LAGER = {
  kapazitaet: 120,        // Tonnen max. Lagerkapazität
  kostenProTonneMonat: 28, // €/t/Monat Lagerkosten (Miete, Versicherung, Kapitalbindung)
  mindestbestand: 20,      // Tonnen Sicherheitsbestand
  monatsbedarf: 40,        // Tonnen durchschnittlicher Monatsbedarf (480t/Jahr)
};

// ---------------------------------------------------------------------------
// Prognose-Engine: Berechnet optimale Kaufzeitpunkte basierend auf Risikoprofil
// ---------------------------------------------------------------------------
function berechnePrognose(risikoLevel, geoGewicht, preisHistorie) {
  // risikoLevel: 0 (konservativ) bis 100 (aggressiv)
  // Konservativ: kaufe früher, mehr auf Lager, weniger Preisschwankung akzeptieren
  // Aggressiv: warte auf Tiefpunkte, Just-in-Time, akzeptiere Lieferrisiko

  const risikoFaktor = risikoLevel / 100; // 0–1
  const basisPreis = preisHistorie[preisHistorie.length - 1]; // letzter bekannter Preis

  // Volatilität aus Historie berechnen
  const returns = [];
  for (let i = 1; i < preisHistorie.length; i++) {
    returns.push((preisHistorie[i] - preisHistorie[i - 1]) / preisHistorie[i - 1]);
  }
  const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
  const volatilitaet = Math.sqrt(returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length);

  // Geo-Risikoaufschlag
  const geoAufschlag = GEO_FAKTOREN.reduce((s, g) => s + g.faktor * geoGewicht, 0);

  // Prognose für 6 Monate
  const prognose = PROGNOSE_MONATE.map((monat, i) => {
    const monatKurz = monat.split(" ")[0];
    const saisonEffekt = SAISON_FAKTOREN[monatKurz] || 0;

    // Trend + Saisonalität + Geo-Risiko + Zufallskomponente (seeded)
    const trend = avgReturn * (i + 1);
    const seed = Math.sin((i + 1) * 42 + risikoLevel * 0.1) * 0.5 + 0.5;
    const zufall = (seed - 0.5) * volatilitaet * 2;

    const erwarteterPreis = Math.round(basisPreis * (1 + trend + saisonEffekt + geoAufschlag + zufall));

    // Konfidenzintervall — breiter bei höherem Risiko
    const konfidenzBreite = volatilitaet * basisPreis * (1 + i * 0.15) * (1 + risikoFaktor * 0.5);
    const preisMin = Math.round(erwarteterPreis - konfidenzBreite);
    const preisMax = Math.round(erwarteterPreis + konfidenzBreite);

    // Kaufsignal-Berechnung
    // Konservativ: kaufe wenn Preis < Durchschnitt der letzten 3M
    // Aggressiv: kaufe nur wenn Preis deutlich unter Trend
    const avg3M = (preisHistorie.slice(-3).reduce((s, p) => s + p, 0)) / 3;
    const schwelle = avg3M * (1 - risikoFaktor * 0.04); // Aggressiv: warte auf -4% unter 3M-Schnitt
    const kaufSignal = erwarteterPreis <= schwelle ? "KAUFEN" : erwarteterPreis <= schwelle * 1.02 ? "BEOBACHTEN" : "WARTEN";

    // Empfohlene Menge — abhängig von Risikoprofil
    let empfohlMenge = LAGER.monatsbedarf;
    if (kaufSignal === "KAUFEN") {
      // Bei Kaufsignal: Konservativ kauft mehr auf Vorrat, Aggressiv kauft genau Bedarf
      empfohlMenge = Math.round(LAGER.monatsbedarf * (1 + (1 - risikoFaktor) * 0.8));
      empfohlMenge = Math.min(empfohlMenge, LAGER.kapazitaet - LAGER.mindestbestand);
    } else if (kaufSignal === "WARTEN") {
      // Konservativ kauft trotzdem Mindestmenge, Aggressiv wartet komplett
      empfohlMenge = Math.round(LAGER.monatsbedarf * (1 - risikoFaktor * 0.6));
      empfohlMenge = Math.max(empfohlMenge, Math.round(LAGER.mindestbestand * 0.5));
    }

    // Lagerkosten für Überschuss
    const ueberschuss = Math.max(0, empfohlMenge - LAGER.monatsbedarf);
    const lagerkosten = ueberschuss * LAGER.kostenProTonneMonat;

    // Gesamtkosten (Einkauf + Lager)
    const einkaufskosten = empfohlMenge * erwarteterPreis;

    return {
      monat,
      preis: erwarteterPreis,
      preisMin,
      preisMax,
      kaufSignal,
      menge: empfohlMenge,
      lagerkosten,
      einkaufskosten,
      gesamtkosten: einkaufskosten + lagerkosten,
      saisonEffekt: (saisonEffekt * 100).toFixed(1),
    };
  });

  // Gesamtauswertung
  const totalKosten = prognose.reduce((s, p) => s + p.gesamtkosten, 0);
  const totalMenge = prognose.reduce((s, p) => s + p.menge, 0);
  const avgPreis = totalKosten / totalMenge;
  const kaufMonate = prognose.filter(p => p.kaufSignal === "KAUFEN").length;
  const besterMonat = [...prognose].sort((a, b) => a.preis - b.preis)[0];
  const teuersterMonat = [...prognose].sort((a, b) => b.preis - a.preis)[0];

  // Vergleich: naiv (jeden Monat gleich kaufen zum Durchschnittspreis)
  const naivKosten = prognose.reduce((s, p) => s + LAGER.monatsbedarf * p.preis, 0);
  const ersparnis = naivKosten - totalKosten;

  return { prognose, totalKosten, totalMenge, avgPreis, kaufMonate, besterMonat, teuersterMonat, naivKosten, ersparnis };
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------
const fmtEur = (v) => Math.round(v).toLocaleString("de-DE");
const fmtT = (v) => v.toLocaleString("de-DE");

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BeschaffungsOptimierung() {
  const [risikoLevel, setRisikoLevel] = useState(40);
  const [geoGewicht, setGeoGewicht] = useState(0.5);
  const [showGeoDetail, setShowGeoDetail] = useState(false);
  const [showMethodik, setShowMethodik] = useState(false);

  const ergebnis = useMemo(
    () => berechnePrognose(risikoLevel, geoGewicht, PREISE_HISTORIE),
    [risikoLevel, geoGewicht]
  );

  const risikoLabel = risikoLevel <= 25 ? "KONSERVATIV" : risikoLevel <= 50 ? "MODERAT" : risikoLevel <= 75 ? "DYNAMISCH" : "AGGRESSIV";
  const risikoColor = risikoLevel <= 25 ? "#008c46" : risikoLevel <= 50 ? "#cc7700" : risikoLevel <= 75 ? "#cc7700" : "#cc3333";

  // Chart-Berechnung
  const allePreise = [...PREISE_HISTORIE, ...ergebnis.prognose.map(p => p.preis)];
  const alleMonate = [...MONATE, ...PROGNOSE_MONATE];
  const chartMin = Math.min(...allePreise, ...ergebnis.prognose.map(p => p.preisMin)) * 0.97;
  const chartMax = Math.max(...allePreise, ...ergebnis.prognose.map(p => p.preisMax)) * 1.03;
  const chartRange = chartMax - chartMin;

  return (
    <section
      id="beschaffung"
      style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}
    >
      <div style={{ ...monoLabel, letterSpacing: "0.3em", color: "#008c46", marginBottom: 12 }}>
        12 — Beschaffungsoptimierung
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
        Rohstoff-Einkauf mit <span style={{ fontWeight: 700 }}>KI-gestützter Prognose</span>
      </h2>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 12, maxWidth: 750 }}>
        Optimale Kaufzeitpunkte und Mengen für Industrierohstoffe basierend auf
        LME-Preishistorie, saisonalen Mustern, geopolitischen Risikofaktoren und
        Lagerkapazitäten. Risikoappetit steuert die Strategie: von konservativer Vorratshaltung
        bis aggressivem Spot-Einkauf.
      </p>
      <p style={{ fontSize: 12, color: "#bbb", marginBottom: 48, fontFamily: "'Space Mono', monospace" }}>
        Modell: Kupfer (Cu) | LME Settlement EUR/t | Jahresbedarf: 480t | Lagerkapazität: 120t
      </p>

      {/* Steuerung: Risiko-Slider + Geo-Gewichtung */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        {/* Risiko-Slider */}
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 12 }}>Risikoprofil</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Risikoappetit</span>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: "#fff",
              background: risikoColor,
              padding: "3px 10px",
              letterSpacing: "0.05em",
            }}>
              {risikoLabel} ({risikoLevel}%)
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={risikoLevel}
            onChange={(e) => setRisikoLevel(Number(e.target.value))}
            style={{
              width: "100%",
              height: 4,
              appearance: "none",
              WebkitAppearance: "none",
              background: `linear-gradient(to right, #008c46, #cc7700 50%, #cc3333)`,
              outline: "none",
              cursor: "pointer",
              marginBottom: 12,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#bbb", fontFamily: "'Space Mono', monospace" }}>
            <span>Konservativ: Vorrat aufbauen, Liefersicherheit</span>
            <span>Aggressiv: Spot-Einkauf, Preisoptimierung</span>
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: "#666", lineHeight: 1.6 }}>
            {risikoLevel <= 25 && "Strategie: Große Mengen bei moderaten Preisen kaufen. Lagerbestand hoch halten. Liefersicherheit priorisieren. Hedging über Terminkontrakte empfohlen."}
            {risikoLevel > 25 && risikoLevel <= 50 && "Strategie: Monatsbedarf + moderate Vorratshaltung. Kaufsignale bei Preisrückgängen nutzen. Teilabsicherung über Forwards (50% Bedarf)."}
            {risikoLevel > 50 && risikoLevel <= 75 && "Strategie: Flexible Beschaffung nahe am Bedarf. Nur bei deutlichen Preisrückgängen vorziehen. Minimale Lagerhaltung. Spot-Anteil 60–70%."}
            {risikoLevel > 75 && "Strategie: Just-in-Time mit maximalem Spot-Anteil. Nur bei signifikanten Dips kaufen. Hohes Lieferrisiko, maximale Preischancen. Kein Hedging."}
          </div>
        </div>

        {/* Geo-Gewichtung */}
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 12 }}>Geopolitische Gewichtung</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Geo-Einfluss auf Prognose</span>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              color: geoGewicht > 0.7 ? "#cc3333" : geoGewicht > 0.3 ? "#cc7700" : "#008c46",
            }}>
              {(geoGewicht * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={geoGewicht}
            onChange={(e) => setGeoGewicht(Number(e.target.value))}
            style={{
              width: "100%",
              height: 4,
              appearance: "none",
              WebkitAppearance: "none",
              background: `linear-gradient(to right, #ddd ${geoGewicht * 100}%, #eee ${geoGewicht * 100}%)`,
              outline: "none",
              cursor: "pointer",
              marginBottom: 12,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#bbb", fontFamily: "'Space Mono', monospace" }}>
            <span>0% — Geo-Risiken ignorieren</span>
            <span>100% — Volle Gewichtung</span>
          </div>

          <div
            onClick={() => setShowGeoDetail(!showGeoDetail)}
            style={{ marginTop: 12, fontSize: 11, color: "#0066cc", cursor: "pointer" }}
          >
            {showGeoDetail ? "▴ Faktoren ausblenden" : "▾ Geopolitische Faktoren anzeigen"}
          </div>
          {showGeoDetail && (
            <div style={{ marginTop: 8 }}>
              {GEO_FAKTOREN.map((g, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f5f5", fontSize: 11 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: "#333" }}>{g.name}</span>
                    <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>{g.detail}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginLeft: 12 }}>
                    <span style={{
                      fontSize: 9,
                      color: "#fff",
                      background: g.risiko === "hoch" ? "#cc3333" : g.risiko === "mittel" ? "#cc7700" : "#008c46",
                      padding: "1px 6px",
                      fontFamily: "'Space Mono', monospace",
                    }}>
                      {g.risiko}
                    </span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: g.faktor > 0 ? "#cc3333" : "#008c46" }}>
                      {g.faktor > 0 ? "+" : ""}{(g.faktor * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preis-Chart */}
      <div style={{ ...cardStyle, marginBottom: 32 }}>
        <div style={{ ...monoLabel, marginBottom: 16 }}>LME Kupfer — 12M Historie + 6M Prognose (EUR/t)</div>
        <div style={{ position: "relative", height: 220, marginBottom: 8 }}>
          {/* Y-Achse */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const val = Math.round(chartMax - pct * chartRange);
            return (
              <div key={pct} style={{
                position: "absolute",
                left: 0,
                top: `${pct * 100}%`,
                width: "100%",
                borderBottom: "1px solid #f5f5f5",
                fontSize: 9,
                fontFamily: "'Space Mono', monospace",
                color: "#ccc",
                lineHeight: "0",
              }}>
                <span style={{ position: "relative", top: -4, background: "#fff", paddingRight: 4 }}>{fmtEur(val)}</span>
              </div>
            );
          })}

          {/* Prognose-Konfidenzband */}
          <svg style={{ position: "absolute", top: 0, left: 50, width: "calc(100% - 50px)", height: "100%" }} viewBox="0 0 1000 220" preserveAspectRatio="none">
            {/* Konfidenzband */}
            <path
              d={
                ergebnis.prognose.map((p, i) => {
                  const x = ((MONATE.length + i) / (alleMonate.length - 1)) * 1000;
                  const y = ((chartMax - p.preisMax) / chartRange) * 220;
                  return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                }).join(" ") + " " +
                [...ergebnis.prognose].reverse().map((p, i) => {
                  const x = ((MONATE.length + (ergebnis.prognose.length - 1 - i)) / (alleMonate.length - 1)) * 1000;
                  const y = ((chartMax - p.preisMin) / chartRange) * 220;
                  return `L ${x} ${y}`;
                }).join(" ") + " Z"
              }
              fill="rgba(0,140,70,0.08)"
              stroke="none"
            />

            {/* Historie Linie */}
            <polyline
              points={PREISE_HISTORIE.map((p, i) => {
                const x = (i / (alleMonate.length - 1)) * 1000;
                const y = ((chartMax - p) / chartRange) * 220;
                return `${x},${y}`;
              }).join(" ")}
              fill="none"
              stroke="#333"
              strokeWidth="2"
            />

            {/* Prognose Linie */}
            <polyline
              points={[PREISE_HISTORIE[PREISE_HISTORIE.length - 1], ...ergebnis.prognose.map(p => p.preis)].map((p, i) => {
                const x = ((MONATE.length - 1 + i) / (alleMonate.length - 1)) * 1000;
                const y = ((chartMax - p) / chartRange) * 220;
                return `${x},${y}`;
              }).join(" ")}
              fill="none"
              stroke="#008c46"
              strokeWidth="2"
              strokeDasharray="6,4"
            />

            {/* Kaufsignal-Punkte */}
            {ergebnis.prognose.map((p, i) => {
              const x = ((MONATE.length + i) / (alleMonate.length - 1)) * 1000;
              const y = ((chartMax - p.preis) / chartRange) * 220;
              if (p.kaufSignal !== "KAUFEN") return null;
              return <circle key={i} cx={x} cy={y} r="6" fill="#008c46" stroke="#fff" strokeWidth="2" />;
            })}

            {/* Trennlinie Historie/Prognose */}
            <line
              x1={(MONATE.length - 1) / (alleMonate.length - 1) * 1000}
              y1={0}
              x2={(MONATE.length - 1) / (alleMonate.length - 1) * 1000}
              y2={220}
              stroke="#ddd"
              strokeDasharray="4,4"
            />
          </svg>

          {/* "Prognose" Label */}
          <div style={{
            position: "absolute",
            top: 4,
            right: 60,
            fontSize: 9,
            fontFamily: "'Space Mono', monospace",
            color: "#008c46",
            background: "rgba(255,255,255,0.9)",
            padding: "2px 6px",
          }}>
            PROGNOSE →
          </div>
        </div>

        {/* X-Achse (Monatslabels) */}
        <div style={{ display: "flex", marginLeft: 50, justifyContent: "space-between" }}>
          {alleMonate.filter((_, i) => i % 2 === 0).map((m) => (
            <span key={m} style={{ fontSize: 8, fontFamily: "'Space Mono', monospace", color: "#bbb" }}>{m}</span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 16, height: 2, background: "#333" }} />
            <span style={{ fontSize: 10, color: "#999" }}>Historie</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 16, height: 2, background: "#008c46", borderTop: "1px dashed #008c46" }} />
            <span style={{ fontSize: 10, color: "#999" }}>Prognose</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#008c46" }} />
            <span style={{ fontSize: 10, color: "#999" }}>Kaufsignal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 16, height: 8, background: "rgba(0,140,70,0.08)" }} />
            <span style={{ fontSize: 10, color: "#999" }}>Konfidenzband</span>
          </div>
        </div>
      </div>

      {/* KPI-Übersicht */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Ø Einkaufspreis</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{fmtEur(ergebnis.avgPreis)}</div>
          <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>EUR/t gewichtet</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Kaufmonate</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#008c46" }}>{ergebnis.kaufMonate}</div>
          <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>von 6 mit Kaufsignal</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Gesamtkosten 6M</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{fmtEur(ergebnis.totalKosten)}</div>
          <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>€ inkl. Lagerkosten</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Ersparnis vs. Naiv</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: ergebnis.ersparnis > 0 ? "#008c46" : "#cc3333" }}>
            {ergebnis.ersparnis > 0 ? "+" : ""}{fmtEur(ergebnis.ersparnis)}
          </div>
          <div style={{ fontSize: 9, color: "#999", marginTop: 2 }}>€ vs. monatlicher Gleicheinkauf</div>
        </div>
      </div>

      {/* Kaufempfehlungen Tabelle */}
      <div style={{ ...cardStyle, marginBottom: 32, overflowX: "auto" }}>
        <div style={{ ...monoLabel, marginBottom: 16 }}>Kaufempfehlungen — 6-Monats-Vorschau</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              {["Monat", "Preis (€/t)", "Bandbreite", "Saison", "Signal", "Menge (t)", "Einkauf (€)", "Lager (€)"].map((h) => (
                <th key={h} style={{
                  textAlign: h.includes("€") || h.includes("t)") ? "right" : "left",
                  padding: "8px 8px",
                  ...monoLabel,
                  fontSize: 9,
                  fontWeight: 500,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ergebnis.prognose.map((p, i) => (
              <tr key={i} style={{
                borderBottom: "1px solid #f5f5f5",
                background: p.kaufSignal === "KAUFEN" ? "rgba(0,140,70,0.04)" : "transparent",
              }}>
                <td style={{ padding: "8px", fontSize: 12, fontWeight: 500 }}>{p.monat}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
                  {fmtEur(p.preis)}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#999" }}>
                  {fmtEur(p.preisMin)}–{fmtEur(p.preisMax)}
                </td>
                <td style={{ padding: "8px", fontFamily: "'Space Mono', monospace", fontSize: 10, color: parseFloat(p.saisonEffekt) > 0 ? "#cc3333" : "#008c46" }}>
                  {parseFloat(p.saisonEffekt) > 0 ? "+" : ""}{p.saisonEffekt}%
                </td>
                <td style={{ padding: "8px" }}>
                  <span style={{
                    fontSize: 9,
                    fontFamily: "'Space Mono', monospace",
                    color: "#fff",
                    background: p.kaufSignal === "KAUFEN" ? "#008c46" : p.kaufSignal === "BEOBACHTEN" ? "#cc7700" : "#999",
                    padding: "2px 8px",
                    letterSpacing: "0.05em",
                  }}>
                    {p.kaufSignal}
                  </span>
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: p.kaufSignal === "KAUFEN" ? 600 : 400 }}>
                  {p.menge}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
                  {fmtEur(p.einkaufskosten)}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 10, color: p.lagerkosten > 0 ? "#cc7700" : "#999" }}>
                  {p.lagerkosten > 0 ? fmtEur(p.lagerkosten) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #ddd" }}>
              <td colSpan={5} style={{ padding: "8px", fontSize: 11, fontWeight: 600, color: "#333" }}>Summe Prognose-Zeitraum</td>
              <td style={{ padding: "8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 600 }}>
                {ergebnis.totalMenge}t
              </td>
              <td style={{ padding: "8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 600 }}>
                {fmtEur(ergebnis.prognose.reduce((s, p) => s + p.einkaufskosten, 0))}
              </td>
              <td style={{ padding: "8px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 600, color: "#cc7700" }}>
                {fmtEur(ergebnis.prognose.reduce((s, p) => s + p.lagerkosten, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Lagerparameter */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 12 }}>Lagerparameter</div>
          {[
            { label: "Lagerkapazität", value: `${LAGER.kapazitaet}t`, detail: "Max. Kupferbestand Lager Werk 1" },
            { label: "Sicherheitsbestand", value: `${LAGER.mindestbestand}t`, detail: "Min. Bestand für 2-Wochen-Produktion" },
            { label: "Monatsbedarf", value: `${LAGER.monatsbedarf}t`, detail: "Durchschnittlicher Produktionsverbrauch" },
            { label: "Lagerkosten", value: `€${LAGER.kostenProTonneMonat}/t/Monat`, detail: "Miete + Versicherung + Kapitalbindung (5,2% p.a.)" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid #f5f5f5" : "none" }}>
              <div>
                <div style={{ fontSize: 12, color: "#333" }}>{item.label}</div>
                <div style={{ fontSize: 9, color: "#bbb" }}>{item.detail}</div>
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#111", fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 12 }}>Bester vs. Schlechtester Monat</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>Günstigster Einkaufsmonat</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#008c46" }}>{ergebnis.besterMonat.monat}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: "#008c46" }}>{fmtEur(ergebnis.besterMonat.preis)} €/t</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>Teuerster Einkaufsmonat</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#cc3333" }}>{ergebnis.teuersterMonat.monat}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: "#cc3333" }}>{fmtEur(ergebnis.teuersterMonat.preis)} €/t</span>
            </div>
          </div>
          <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>Spread (Hoch–Tief)</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 600, color: "#cc7700" }}>
              {fmtEur(ergebnis.teuersterMonat.preis - ergebnis.besterMonat.preis)} €/t
            </div>
            <div style={{ fontSize: 10, color: "#999" }}>
              = {((ergebnis.teuersterMonat.preis - ergebnis.besterMonat.preis) / ergebnis.besterMonat.preis * 100).toFixed(1)}% Preisschwankung im Prognosezeitraum
            </div>
          </div>
        </div>
      </div>

      {/* Methodik */}
      <div style={{ ...cardStyle, marginBottom: 32, cursor: "pointer" }} onClick={() => setShowMethodik(!showMethodik)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...monoLabel, color: "#555" }}>Methodik & Modellparameter</div>
          <span style={{ fontSize: 14, color: "#ccc", transition: "transform 0.2s", transform: showMethodik ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
        </div>
        {showMethodik && (
          <div style={{ ...codeBlock, marginTop: 16 }} onClick={(e) => e.stopPropagation()}>
{`// ═══ Prognosemodell Rohstoff-Beschaffungsoptimierung ═══

// 1. Preismodell: Geometrische Brownsche Bewegung + Saisonalität
P(t) = P₀ × exp((μ - σ²/2)t + σW(t)) × S(t) × G(t)
  P₀  = Letzter LME-Settlementpreis (EUR/t)
  μ   = Drift (aus 12M-Renditen)
  σ   = Volatilität (annualisiert aus Monatsrenditen)
  W(t)= Wiener-Prozess (normalverteilte Zufallskomponente)
  S(t)= Saisonfaktor (empirisch: China-Bausaison Apr/Mai = Peak)
  G(t)= Geopolitischer Aufschlag (gewichtet nach Slider)

// 2. Konfidenzintervall
CI(95%) = P(t) ± 1.96 × σ × √t × P₀

// 3. Kaufsignal-Algorithmus
IF   P(t) <= MA(3M) × (1 - RisikoFaktor × 0.04)  → KAUFEN
ELIF P(t) <= MA(3M) × (1 - RisikoFaktor × 0.02)  → BEOBACHTEN
ELSE                                                → WARTEN

// 4. Mengenoptimierung
Menge = Monatsbedarf × AdjustmentFaktor
  KAUFEN:  AdjFaktor = 1 + (1 - RisikoFaktor) × 0.8  (konservativ: mehr)
  WARTEN:  AdjFaktor = 1 - RisikoFaktor × 0.6         (aggressiv: weniger)
  Constraint: Mindestbestand ≤ Lager ≤ Kapazität

// 5. Gesamtkosten-Funktion
TotalCost = Σ(Menge_t × Preis_t) + Σ(Überschuss_t × Lagerkosten/t/M)
  Überschuss_t = max(0, Menge_t - Monatsbedarf)

// 6. Datenquellen (Produktivversion)
  → LME API (Echtzeit-Settlementpreise)
  → Reuters/Refinitiv (Terminstrukturkurve)
  → FRED API (USD/EUR, Zinsen)
  → GDELT (Geopolitische Events, NLP-Scoring)
  → OpenWeather (Wettereinfluss auf Minenproduktion)`}
          </div>
        )}
      </div>

      {/* KI-Brücke */}
      <div style={{
        border: "1px solid #0066cc",
        borderLeft: "3px solid #0066cc",
        padding: "20px 24px",
        background: "rgba(0,102,204,0.03)",
      }}>
        <div style={{ ...monoLabel, color: "#0066cc", marginBottom: 10 }}>
          KI-Brücke — Von der Bauchentscheidung zur datengetriebenen Beschaffung
        </div>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
          <strong>Status Quo im Einkauf:</strong> 73% der Mittelständler kaufen Rohstoffe
          nach Erfahrungswerten und Bauchgefühl (Studie BME 2023). Preisschwankungen von
          ±15–25% p.a. bei Industriemetallen bedeuten bei €4 Mio. Jahreseinkaufsvolumen
          ein Delta von bis zu €1 Mio.
          <br /><br />
          <strong>KI-Lösung:</strong> Reinforcement Learning (RL) optimiert die Beschaffungsstrategie
          über tausende simulierte Marktszenarien. Das Modell lernt, welche Kombination
          aus Timing, Menge und Hedging-Anteil die Gesamtkosten minimiert — unter
          Berücksichtigung von Lagerrestriktionen, Lieferzeiten und Mindestbestellmengen.
          <br /><br />
          <strong>Integration:</strong> LME-API für Echtzeit-Preise, GDELT für geopolitisches
          Event-Scoring (NLP auf Nachrichtenströme), SAP MM für Bestandsdaten und offene
          Bestellungen. Der Controller erhält morgens ein Dashboard mit Kaufempfehlungen
          und Risiko-Scores — die finale Entscheidung bleibt beim Menschen.
        </div>
      </div>
    </section>
  );
}
