import { useState, useMemo } from "react";

// === DATA ===
const BUILDING_TYPES = [
  { id: "mfh_50s", label: "MFH 1950er–1960er", kwh: 220, desc: "Typischer Nachkriegsbau" },
  { id: "mfh_70s", label: "MFH 1970er–1980er", kwh: 180, desc: "Großsiedlung / Plattenbau" },
  { id: "mfh_90s", label: "MFH 1990er–2000er", kwh: 120, desc: "Teilsanierter Bestand" },
  { id: "efh", label: "Ein-/Zweifamilienhaus", kwh: 200, desc: "Vor 1979" },
  { id: "denkmal", label: "Denkmalgeschütztes Gebäude", kwh: 250, desc: "Besondere Auflagen" },
];

const MEASURES = [
  { id: "fassade_wdvs", cat: "huelle", label: "Fassadendämmung (WDVS)", costPerM2: 180, savings: 25, unit: "m² Fassade" },
  { id: "fassade_vhf", cat: "huelle", label: "Vorgehängte Fassade (VHF)", costPerM2: 280, savings: 28, unit: "m² Fassade" },
  { id: "fassade_seriell", cat: "huelle", label: "Serielle Fassadenmodule", costPerM2: 350, savings: 30, unit: "m² Fassade", highlight: true },
  { id: "dach", cat: "huelle", label: "Dachdämmung", costPerM2: 200, savings: 15, unit: "m² Dach" },
  { id: "kellerdecke", cat: "huelle", label: "Kellerdeckendämmung", costPerM2: 60, savings: 8, unit: "m² Keller" },
  { id: "fenster", cat: "huelle", label: "Fenstertausch (3-fach)", costPerM2: 650, savings: 12, unit: "m² Fenster" },
  { id: "wp_luft", cat: "heizung", label: "Luft-Wasser-Wärmepumpe", costPerWE: 18000, savings: 0, unit: "pauschal/WE" },
  { id: "wp_erd", cat: "heizung", label: "Sole-Wasser-Wärmepumpe", costPerWE: 28000, savings: 0, unit: "pauschal/WE" },
  { id: "fernwaerme", cat: "heizung", label: "Fernwärmeanschluss", costPerWE: 12000, savings: 0, unit: "pauschal/WE" },
  { id: "lueftung", cat: "technik", label: "Lüftungsanlage mit WRG", costPerWE: 5000, savings: 5, unit: "pauschal/WE" },
  { id: "pv", cat: "technik", label: "PV-Anlage (Dach)", costPerKWp: 1400, savings: 0, unit: "kWp" },
  { id: "smart", cat: "technik", label: "Smart-Home / Gebäudeautomation", costPerWE: 3000, savings: 3, unit: "pauschal/WE" },
];

const EH_LEVELS = [
  { id: "eh85", label: "Effizienzhaus 85", tilgung: 5, maxKredit: 120000 },
  { id: "eh70", label: "Effizienzhaus 70", tilgung: 10, maxKredit: 120000 },
  { id: "eh70ee", label: "Effizienzhaus 70 EE", tilgung: 15, maxKredit: 150000 },
  { id: "eh55", label: "Effizienzhaus 55", tilgung: 20, maxKredit: 120000 },
  { id: "eh55ee", label: "Effizienzhaus 55 EE", tilgung: 25, maxKredit: 150000 },
  { id: "eh40", label: "Effizienzhaus 40", tilgung: 20, maxKredit: 120000 },
  { id: "eh40ee", label: "Effizienzhaus 40 EE", tilgung: 25, maxKredit: 150000 },
  { id: "denkmal", label: "Effizienzhaus Denkmal", tilgung: 5, maxKredit: 120000 },
  { id: "denkmalee", label: "Effizienzhaus Denkmal EE", tilgung: 10, maxKredit: 150000 },
];

const BONI = [
  { id: "wpb", label: "Worst-Performing-Building", pct: 10, desc: "Gebäude im unteren Energieeffizienz-Viertel" },
  { id: "seriell", label: "Serielles Sanieren", pct: 15, desc: "Bei EH 40/55 – vorgefertigte Module" },
];

const TIMELINE_PHASES = [
  { phase: "Analyse & Bestandsaufnahme", months: 2, color: "#4A90A4" },
  { phase: "Energieberatung & iSFP", months: 1, color: "#5BA08F" },
  { phase: "Förderantrag & Planung", months: 3, color: "#7AB648" },
  { phase: "Ausschreibung & Vergabe", months: 2, color: "#C4A035" },
  { phase: "Bauphase Gebäudehülle", months: 4, color: "#D4763A" },
  { phase: "Heizung & Haustechnik", months: 2, color: "#C45B5B" },
  { phase: "Abnahme & Monitoring", months: 2, color: "#8B6BAE" },
];

// === HELPERS ===
const fmt = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtPct = (n) => `${n.toFixed(1)} %`;

// === COMPONENTS ===
function StepIndicator({ step, total, labels }) {
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 32 }}>
      {labels.map((l, i) => (
        <div key={i} style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 0,
          }}>
            {i > 0 && <div style={{ flex: 1, height: 2, background: i <= step ? "#4A90A4" : "#ddd" }} />}
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: i <= step ? "#4A90A4" : "#e8e8e8",
              color: i <= step ? "#fff" : "#999",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14, flexShrink: 0,
              transition: "all .3s ease",
            }}>{i + 1}</div>
            {i < labels.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? "#4A90A4" : "#ddd" }} />}
          </div>
          <div style={{
            fontSize: 11, marginTop: 6, color: i <= step ? "#2c3e50" : "#aaa",
            fontWeight: i === step ? 700 : 400,
          }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function Card({ children, style, onClick, selected }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? "#f0f7fa" : "#fff",
      border: selected ? "2px solid #4A90A4" : "1px solid #e0e0e0",
      borderRadius: 10, padding: 16, cursor: onClick ? "pointer" : "default",
      transition: "all .2s ease",
      ...(onClick && { ":hover": { borderColor: "#4A90A4" } }),
      ...style,
    }}>{children}</div>
  );
}

// === MAIN APP ===
export default function SanierungsRechner() {
  const [step, setStep] = useState(0);
  const [building, setBuilding] = useState(null);
  const [units, setUnits] = useState(12);
  const [wohnflaeche, setWohnflaeche] = useState(800);
  const [fassadeM2, setFassadeM2] = useState(1200);
  const [dachM2, setDachM2] = useState(400);
  const [kellerM2, setKellerM2] = useState(350);
  const [fensterM2, setFensterM2] = useState(200);
  const [pvKwp, setPvKwp] = useState(30);
  const [selectedMeasures, setSelectedMeasures] = useState([]);
  const [ehLevel, setEhLevel] = useState(null);
  const [selectedBoni, setSelectedBoni] = useState([]);

  const toggleMeasure = (id) => {
    setSelectedMeasures(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleBonus = (id) => {
    setSelectedBoni(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // === CALCULATIONS ===
  const costs = useMemo(() => {
    let total = 0;
    const breakdown = [];
    selectedMeasures.forEach(id => {
      const m = MEASURES.find(x => x.id === id);
      if (!m) return;
      let cost = 0;
      if (m.costPerM2) {
        const area = id.startsWith("fassade") ? fassadeM2 : id === "dach" ? dachM2 : id === "kellerdecke" ? kellerM2 : id === "fenster" ? fensterM2 : 0;
        cost = m.costPerM2 * area;
      } else if (m.costPerWE) {
        cost = m.costPerWE * units;
      } else if (m.costPerKWp) {
        cost = m.costPerKWp * pvKwp;
      }
      total += cost;
      breakdown.push({ ...m, cost });
    });
    return { total, breakdown };
  }, [selectedMeasures, units, fassadeM2, dachM2, kellerM2, fensterM2, pvKwp]);

  const funding = useMemo(() => {
    if (!ehLevel) return { tilgung: 0, bonus: 0, total: 0, maxKredit: 0, perUnit: 0 };
    const eh = EH_LEVELS.find(x => x.id === ehLevel);
    const bonusPct = selectedBoni.reduce((sum, id) => {
      const b = BONI.find(x => x.id === id);
      if (id === "seriell" && !["eh40", "eh40ee", "eh55", "eh55ee"].includes(ehLevel)) return sum;
      return sum + (b ? b.pct : 0);
    }, 0);
    const totalPct = Math.min(eh.tilgung + bonusPct, 45);
    const maxKreditGesamt = eh.maxKredit * units;
    const effKredit = Math.min(costs.total, maxKreditGesamt);
    const tilgungBetrag = effKredit * (totalPct / 100);
    return {
      tilgungPct: eh.tilgung,
      bonusPct,
      totalPct,
      maxKredit: maxKreditGesamt,
      effKredit,
      tilgung: tilgungBetrag,
      eigenanteil: costs.total - tilgungBetrag,
      perUnit: tilgungBetrag / units,
    };
  }, [ehLevel, selectedBoni, costs, units]);

  const energySavings = useMemo(() => {
    const bt = BUILDING_TYPES.find(x => x.id === building);
    if (!bt) return { before: 0, after: 0, savingPct: 0, co2: 0 };
    const totalSaving = selectedMeasures.reduce((sum, id) => {
      const m = MEASURES.find(x => x.id === id);
      return sum + (m?.savings || 0);
    }, 0);
    const cappedSaving = Math.min(totalSaving, 85);
    const before = bt.kwh;
    const after = Math.round(before * (1 - cappedSaving / 100));
    const co2Saving = (before - after) * wohnflaeche * 0.0002;
    return { before, after, savingPct: cappedSaving, co2: co2Saving };
  }, [building, selectedMeasures, wohnflaeche]);

  const stepLabels = ["Gebäude", "Maßnahmen", "Förderung", "Ergebnis"];

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      maxWidth: 960, margin: "0 auto", padding: "24px 16px",
      color: "#2c3e50", minHeight: "100vh",
    }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "linear-gradient(135deg, #4A90A4 0%, #2c6b7f 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 16,
          }}>ES</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Energetische Sanierung — Projektkalkulator
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#7f8c8d" }}>
              Kosten · Förderung · Wirtschaftlichkeit · Projektplanung
            </p>
          </div>
        </div>
      </div>

      <StepIndicator step={step} total={4} labels={stepLabels} />

      {/* STEP 0: Gebäudedaten */}
      {step === 0 && (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: "#34495e" }}>Gebäudetyp wählen</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 24 }}>
            {BUILDING_TYPES.map(bt => (
              <Card key={bt.id} selected={building === bt.id} onClick={() => setBuilding(bt.id)}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{bt.label}</div>
                <div style={{ fontSize: 12, color: "#7f8c8d", marginBottom: 6 }}>{bt.desc}</div>
                <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#c0392b" }}>
                  ∅ {bt.kwh} kWh/m²a
                </div>
              </Card>
            ))}
          </div>

          {building && (
            <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>Gebäudekennwerte</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Wohneinheiten", val: units, set: setUnits, min: 1, max: 500 },
                  { label: "Wohnfläche (m²)", val: wohnflaeche, set: setWohnflaeche, min: 50, max: 50000 },
                  { label: "Fassadenfläche (m²)", val: fassadeM2, set: setFassadeM2, min: 50, max: 20000 },
                  { label: "Dachfläche (m²)", val: dachM2, set: setDachM2, min: 50, max: 10000 },
                  { label: "Kellerfläche (m²)", val: kellerM2, set: setKellerM2, min: 0, max: 10000 },
                  { label: "Fensterfläche (m²)", val: fensterM2, set: setFensterM2, min: 10, max: 5000 },
                  { label: "PV-Leistung (kWp)", val: pvKwp, set: setPvKwp, min: 0, max: 500 },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: "#555", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input type="number" value={f.val} min={f.min} max={f.max}
                      onChange={e => f.set(Math.max(f.min, parseInt(e.target.value) || f.min))}
                      style={{
                        width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6,
                        fontSize: 14, fontFamily: "'DM Mono', monospace", boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button disabled={!building} onClick={() => setStep(1)} style={{
            background: building ? "#4A90A4" : "#ccc", color: "#fff", border: "none",
            padding: "12px 32px", borderRadius: 8, fontSize: 14, fontWeight: 700,
            cursor: building ? "pointer" : "default", transition: "all .2s",
          }}>Weiter → Maßnahmen</button>
        </div>
      )}

      {/* STEP 1: Maßnahmen */}
      {step === 1 && (
        <div>
          {["huelle", "heizung", "technik"].map(cat => (
            <div key={cat} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#34495e", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                {cat === "huelle" ? "🏗 Gebäudehülle" : cat === "heizung" ? "🔥 Heizungssystem" : "⚡ Anlagentechnik"}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
                {MEASURES.filter(m => m.cat === cat).map(m => {
                  const sel = selectedMeasures.includes(m.id);
                  let cost = 0;
                  if (m.costPerM2) {
                    const area = m.id.startsWith("fassade") ? fassadeM2 : m.id === "dach" ? dachM2 : m.id === "kellerdecke" ? kellerM2 : fensterM2;
                    cost = m.costPerM2 * area;
                  } else if (m.costPerWE) cost = m.costPerWE * units;
                  else if (m.costPerKWp) cost = m.costPerKWp * pvKwp;
                  return (
                    <Card key={m.id} selected={sel} onClick={() => toggleMeasure(m.id)} style={{
                      position: "relative",
                      ...(m.highlight && { borderColor: sel ? "#4A90A4" : "#7AB648" }),
                    }}>
                      {m.highlight && <span style={{ position: "absolute", top: -8, right: 12, background: "#7AB648", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>ENSA-Fokus</span>}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</div>
                          <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{m.unit}</div>
                        </div>
                        <div style={{
                          width: 22, height: 22, borderRadius: 4,
                          border: sel ? "none" : "2px solid #ccc",
                          background: sel ? "#4A90A4" : "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0,
                        }}>{sel && "✓"}</div>
                      </div>
                      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", color: "#2c3e50", fontWeight: 500 }}>{fmt(cost)}</span>
                        {m.savings > 0 && <span style={{ color: "#27ae60" }}>−{m.savings}% Energie</span>}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => setStep(0)} style={{ background: "#e0e0e0", border: "none", padding: "12px 24px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>← Zurück</button>
            <button disabled={!selectedMeasures.length} onClick={() => setStep(2)} style={{
              background: selectedMeasures.length ? "#4A90A4" : "#ccc", color: "#fff", border: "none",
              padding: "12px 32px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: selectedMeasures.length ? "pointer" : "default",
            }}>Weiter → Förderung</button>
          </div>
          {selectedMeasures.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: "#f0f7fa", borderRadius: 8, fontSize: 13 }}>
              <strong>Zwischensumme:</strong> {fmt(costs.total)} für {selectedMeasures.length} Maßnahme(n) · <span style={{ color: "#27ae60" }}>ca. −{energySavings.savingPct}% Energieverbrauch</span>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Förderung */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Ziel-Effizienzhausstufe</h2>
          <p style={{ fontSize: 12, color: "#7f8c8d", marginBottom: 16 }}>KfW-Programm 261 — Kredit mit Tilgungszuschuss</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 24 }}>
            {EH_LEVELS.map(eh => (
              <Card key={eh.id} selected={ehLevel === eh.id} onClick={() => setEhLevel(eh.id)}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{eh.label}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12 }}>
                  <span>Tilgungszuschuss: <strong>{eh.tilgung}%</strong></span>
                  <span style={{ color: "#7f8c8d" }}>max. {fmt(eh.maxKredit)}/WE</span>
                </div>
              </Card>
            ))}
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Zusätzliche Förderboni</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
            {BONI.map(b => {
              const disabled = b.id === "seriell" && ehLevel && !["eh40", "eh40ee", "eh55", "eh55ee"].includes(ehLevel);
              return (
                <Card key={b.id} selected={selectedBoni.includes(b.id)} onClick={disabled ? undefined : () => toggleBonus(b.id)}
                  style={{ opacity: disabled ? 0.4 : 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>+{b.pct}% — {b.label}</div>
                  <div style={{ fontSize: 11, color: "#7f8c8d", marginTop: 4 }}>{b.desc}</div>
                  {disabled && <div style={{ fontSize: 10, color: "#c0392b", marginTop: 4 }}>Nur bei EH 40/55 verfügbar</div>}
                </Card>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ background: "#e0e0e0", border: "none", padding: "12px 24px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>← Zurück</button>
            <button disabled={!ehLevel} onClick={() => setStep(3)} style={{
              background: ehLevel ? "#4A90A4" : "#ccc", color: "#fff", border: "none",
              padding: "12px 32px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: ehLevel ? "pointer" : "default",
            }}>Weiter → Ergebnis</button>
          </div>
        </div>
      )}

      {/* STEP 3: Ergebnis */}
      {step === 3 && (
        <div>
          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Gesamtkosten", value: fmt(costs.total), color: "#2c3e50" },
              { label: "Förderung (Tilgungszuschuss)", value: fmt(funding.tilgung), sub: fmtPct(funding.totalPct), color: "#27ae60" },
              { label: "Eigenanteil", value: fmt(funding.eigenanteil), color: "#c0392b" },
              { label: "CO₂-Einsparung", value: `${energySavings.co2.toFixed(1)} t/a`, color: "#4A90A4" },
            ].map((kpi, i) => (
              <div key={i} style={{
                background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: 16,
                borderTop: `3px solid ${kpi.color}`,
              }}>
                <div style={{ fontSize: 11, color: "#7f8c8d", marginBottom: 6, fontWeight: 500 }}>{kpi.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: kpi.color }}>{kpi.value}</div>
                {kpi.sub && <div style={{ fontSize: 11, color: "#27ae60", marginTop: 2 }}>{kpi.sub} Tilgungszuschuss</div>}
              </div>
            ))}
          </div>

          {/* Kostenaufstellung */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>Kostenaufstellung nach Maßnahmen</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e8e8e8" }}>
                  <th style={{ textAlign: "left", padding: "6px 0", fontWeight: 600 }}>Maßnahme</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontWeight: 600 }}>Kosten</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontWeight: 600 }}>Anteil</th>
                </tr>
              </thead>
              <tbody>
                {costs.breakdown.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "8px 0" }}>{item.label}</td>
                    <td style={{ textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{fmt(item.cost)}</td>
                    <td style={{ textAlign: "right", color: "#7f8c8d" }}>{fmtPct(item.cost / costs.total * 100)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid #2c3e50", fontWeight: 700 }}>
                  <td style={{ padding: "8px 0" }}>Gesamt</td>
                  <td style={{ textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{fmt(costs.total)}</td>
                  <td style={{ textAlign: "right" }}>100 %</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Förderdetails */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>Förderberechnung KfW 261</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
              <div>
                <div style={{ color: "#7f8c8d", marginBottom: 4 }}>Max. Kreditbetrag ({units} WE)</div>
                <div style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{fmt(funding.maxKredit)}</div>
              </div>
              <div>
                <div style={{ color: "#7f8c8d", marginBottom: 4 }}>Effektiver Kreditbetrag</div>
                <div style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{fmt(funding.effKredit)}</div>
              </div>
              <div>
                <div style={{ color: "#7f8c8d", marginBottom: 4 }}>Basis-Tilgungszuschuss</div>
                <div style={{ fontWeight: 700 }}>{funding.tilgungPct}%</div>
              </div>
              <div>
                <div style={{ color: "#7f8c8d", marginBottom: 4 }}>Boni</div>
                <div style={{ fontWeight: 700, color: funding.bonusPct > 0 ? "#27ae60" : "#999" }}>+{funding.bonusPct}%</div>
              </div>
              <div>
                <div style={{ color: "#7f8c8d", marginBottom: 4 }}>Gesamt-Fördersatz (max. 45%)</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#27ae60" }}>{funding.totalPct}%</div>
              </div>
              <div>
                <div style={{ color: "#7f8c8d", marginBottom: 4 }}>Tilgungszuschuss pro WE</div>
                <div style={{ fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{fmt(funding.perUnit)}</div>
              </div>
            </div>
          </div>

          {/* Energiebilanz */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Energiebilanz — Vorher / Nachher</h3>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-end", marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#7f8c8d", marginBottom: 4 }}>Vorher</div>
                <div style={{
                  height: Math.max(20, energySavings.before * 0.6), background: "#e74c3c",
                  borderRadius: "6px 6px 0 0", display: "flex", alignItems: "flex-end", justifyContent: "center",
                  paddingBottom: 8, color: "#fff", fontWeight: 700, fontSize: 14,
                  fontFamily: "'DM Mono', monospace",
                }}>{energySavings.before} kWh/m²a</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "#7f8c8d", marginBottom: 4 }}>Nachher (geschätzt)</div>
                <div style={{
                  height: Math.max(20, energySavings.after * 0.6), background: "#27ae60",
                  borderRadius: "6px 6px 0 0", display: "flex", alignItems: "flex-end", justifyContent: "center",
                  paddingBottom: 8, color: "#fff", fontWeight: 700, fontSize: 14,
                  fontFamily: "'DM Mono', monospace",
                }}>{energySavings.after} kWh/m²a</div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 13, color: "#27ae60", fontWeight: 700 }}>
              ↓ {energySavings.savingPct}% Energieeinsparung · {energySavings.co2.toFixed(1)} t CO₂/Jahr weniger
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700 }}>Projektablauf (Gantt-Übersicht)</h3>
            <div style={{ position: "relative" }}>
              {TIMELINE_PHASES.map((p, i) => {
                const startMonth = TIMELINE_PHASES.slice(0, i).reduce((s, x) => s + x.months, 0);
                const totalMonths = TIMELINE_PHASES.reduce((s, x) => s + x.months, 0);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 6, fontSize: 12 }}>
                    <div style={{ width: 180, flexShrink: 0, fontWeight: 500, fontSize: 11 }}>{p.phase}</div>
                    <div style={{ flex: 1, position: "relative", height: 24 }}>
                      <div style={{
                        position: "absolute",
                        left: `${(startMonth / totalMonths) * 100}%`,
                        width: `${(p.months / totalMonths) * 100}%`,
                        height: 24, background: p.color, borderRadius: 4,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 10, fontWeight: 700,
                      }}>{p.months} Mon.</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ display: "flex", alignItems: "center", marginTop: 8, fontSize: 11, color: "#7f8c8d" }}>
                <div style={{ width: 180, flexShrink: 0 }}></div>
                <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                  {Array.from({ length: TIMELINE_PHASES.reduce((s, x) => s + x.months, 0) + 1 }, (_, i) => i % 3 === 0 ? (
                    <span key={i}>M{i}</span>
                  ) : <span key={i}></span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={() => setStep(2)} style={{ background: "#e0e0e0", border: "none", padding: "12px 24px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>← Zurück</button>
            <button onClick={() => { setStep(0); setSelectedMeasures([]); setEhLevel(null); setSelectedBoni([]); setBuilding(null); }}
              style={{ background: "#34495e", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
              Neue Berechnung
            </button>
          </div>

          <div style={{ marginTop: 20, padding: 12, background: "#fef9e7", borderRadius: 8, fontSize: 11, color: "#7f6608" }}>
            <strong>Hinweis:</strong> Alle Angaben sind Schätzwerte auf Basis aktueller Durchschnittswerte (Stand 2026). Verbindliche Kostenermittlung und Förderzusagen erfordern eine qualifizierte Energieberatung. Fördersätze gemäß BEG/KfW 261.
          </div>

          <div style={{ marginTop: 12, textAlign: "center", fontSize: 11, color: "#bbb" }}>
            Christoph Zapp · christoph-zapp.de · Controlling × Data Science × KI
          </div>
        </div>
      )}
    </div>
  );
}
