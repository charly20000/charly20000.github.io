import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine,
} from "recharts";

// ---------------------------------------------------------------------------
// Demo-Daten: Realistische BMBF/BMWi Förderprojekte
// ---------------------------------------------------------------------------
const DEMO_PROJECTS = [
  {
    id: 1,
    name: "KI-basierte Qualitätssicherung in der Fertigung",
    kuerzel: "KI-QS",
    foerderkennzeichen: "01IS24042",
    foerdergeber: "BMBF",
    projekttraeger: "VDI/VDE-IT",
    basis: "Kostenbasis (AZK)",
    nebenbestimmungen: "NKBF 2017",
    laufzeit: { start: "2024-01-01", end: "2026-12-31" },
    bewilligt: 1200000,
    foerderquote: 80,
    finanzierungsplan: [
      { kategorie: "Personaleinzelkosten", soll: 480000, ist: 295000 },
      { kategorie: "Gemeinkosten (120%)", soll: 576000, ist: 354000 },
      { kategorie: "Sachkosten", soll: 60000, ist: 42000 },
      { kategorie: "Reisekosten", soll: 24000, ist: 11500 },
      { kategorie: "Unteraufträge", soll: 60000, ist: 68000 },
    ],
    abrufe: [
      { datum: "2024-03-28", betrag: 125000, quartal: "Q1/2024", status: "ausgezahlt" },
      { datum: "2024-07-02", betrag: 148000, quartal: "Q2/2024", status: "ausgezahlt" },
      { datum: "2024-10-08", betrag: 139000, quartal: "Q3/2024", status: "ausgezahlt" },
      { datum: "2025-01-10", betrag: 152000, quartal: "Q4/2024", status: "ausgezahlt" },
      { datum: "2025-04-03", betrag: 138500, quartal: "Q1/2025", status: "geprüft" },
      { datum: "2025-07-05", betrag: 0, quartal: "Q2/2025", status: "offen" },
    ],
    fristen: [
      { typ: "Zwischennachweis 2024", datum: "2025-04-30", status: "eingereicht" },
      { typ: "Mittelabruf Q2/2025", datum: "2025-07-15", status: "offen" },
      { typ: "Zwischennachweis 2025", datum: "2026-04-30", status: "offen" },
      { typ: "Verwendungsnachweis", datum: "2027-06-30", status: "offen" },
    ],
    vergaben: [
      { beschreibung: "ML-Beratung Fraunhofer", betrag: 45000, angebote: 3, status: "dokumentiert" },
      { beschreibung: "Cloud-Infrastruktur AWS", betrag: 23000, angebote: 3, status: "dokumentiert" },
    ],
  },
  {
    id: 2,
    name: "Digitale Transformation Berliner KMU",
    kuerzel: "DigiKMU",
    foerderkennzeichen: "01MK24003",
    foerdergeber: "BMWK",
    projekttraeger: "DLR-PT",
    basis: "Ausgabenbasis (AZA)",
    nebenbestimmungen: "ANBest-P / NABF",
    laufzeit: { start: "2024-06-01", end: "2026-05-31" },
    bewilligt: 450000,
    foerderquote: 100,
    finanzierungsplan: [
      { kategorie: "Personalausgaben", soll: 280000, ist: 198000 },
      { kategorie: "Sachausgaben", soll: 85000, ist: 95200 },
      { kategorie: "Reiseausgaben", soll: 25000, ist: 12800 },
      { kategorie: "Investitionen", soll: 40000, ist: 38000 },
      { kategorie: "Gegenstände", soll: 20000, ist: 5500 },
    ],
    abrufe: [
      { datum: "2024-08-15", betrag: 68000, quartal: "Q3/2024", status: "ausgezahlt" },
      { datum: "2024-11-20", betrag: 82000, quartal: "Q4/2024", status: "ausgezahlt" },
      { datum: "2025-02-18", betrag: 91500, quartal: "Q1/2025", status: "ausgezahlt" },
      { datum: "2025-05-10", betrag: 0, quartal: "Q2/2025", status: "offen" },
    ],
    fristen: [
      { typ: "Zwischennachweis 2024", datum: "2025-04-30", status: "eingereicht" },
      { typ: "Mittelabruf Q2/2025", datum: "2025-06-15", status: "offen" },
      { typ: "Statusbericht", datum: "2025-05-31", status: "offen" },
      { typ: "Verwendungsnachweis", datum: "2026-11-30", status: "offen" },
    ],
    vergaben: [
      { beschreibung: "Workshop-Moderation extern", betrag: 18000, angebote: 3, status: "dokumentiert" },
      { beschreibung: "Druckkosten Leitfaden", betrag: 4500, angebote: 1, status: "prüfen" },
    ],
  },
  {
    id: 3,
    name: "Nachhaltige urbane Mobilität Berlin-Brandenburg",
    kuerzel: "NuMoBB",
    foerderkennzeichen: "03SF0648",
    foerdergeber: "BMBF",
    projekttraeger: "VDI/VDE-IT",
    basis: "Kostenbasis (AZK)",
    nebenbestimmungen: "NKBF 2017",
    laufzeit: { start: "2023-04-01", end: "2026-03-31" },
    bewilligt: 2800000,
    foerderquote: 75,
    finanzierungsplan: [
      { kategorie: "Personaleinzelkosten", soll: 1100000, ist: 920000 },
      { kategorie: "Gemeinkosten (120%)", soll: 1320000, ist: 1104000 },
      { kategorie: "Sachkosten", soll: 120000, ist: 88000 },
      { kategorie: "Reisekosten", soll: 60000, ist: 52000 },
      { kategorie: "Unteraufträge", soll: 200000, ist: 245000 },
    ],
    abrufe: [
      { datum: "2023-07-01", betrag: 210000, quartal: "Q2/2023", status: "ausgezahlt" },
      { datum: "2023-10-05", betrag: 245000, quartal: "Q3/2023", status: "ausgezahlt" },
      { datum: "2024-01-08", betrag: 268000, quartal: "Q4/2023", status: "ausgezahlt" },
      { datum: "2024-04-02", betrag: 255000, quartal: "Q1/2024", status: "ausgezahlt" },
      { datum: "2024-07-03", betrag: 272000, quartal: "Q2/2024", status: "ausgezahlt" },
      { datum: "2024-10-07", betrag: 261000, quartal: "Q3/2024", status: "ausgezahlt" },
      { datum: "2025-01-09", betrag: 285000, quartal: "Q4/2024", status: "ausgezahlt" },
      { datum: "2025-04-04", betrag: 248000, quartal: "Q1/2025", status: "geprüft" },
    ],
    fristen: [
      { typ: "Zwischennachweis 2023", datum: "2024-04-30", status: "geprüft" },
      { typ: "Zwischennachweis 2024", datum: "2025-04-30", status: "eingereicht" },
      { typ: "Verwendungsnachweis", datum: "2026-09-30", status: "offen" },
      { typ: "Schlussbericht", datum: "2026-06-30", status: "offen" },
    ],
    vergaben: [
      { beschreibung: "Verkehrsfluss-Simulation TU Berlin", betrag: 120000, angebote: 2, status: "prüfen" },
      { beschreibung: "Sensortechnik Lieferant", betrag: 85000, angebote: 3, status: "dokumentiert" },
      { beschreibung: "Datenbank-Entwicklung", betrag: 40000, angebote: 3, status: "dokumentiert" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtPct = (n) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
const daysBetween = (a, b) => Math.ceil((new Date(b) - new Date(a)) / 86400000);
const today = new Date().toISOString().split("T")[0];

function projectProgress(p) {
  const totalDays = daysBetween(p.laufzeit.start, p.laufzeit.end);
  const elapsed = daysBetween(p.laufzeit.start, today);
  return Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
}

function budgetBurnRate(p) {
  const totalIst = p.finanzierungsplan.reduce((s, k) => s + k.ist, 0);
  return (totalIst / p.bewilligt) * 100;
}

function schwellenwertStatus(soll, ist) {
  if (soll === 0) return "ok";
  const abw = ((ist - soll) / soll) * 100;
  if (abw > 20) return "rot";
  if (abw > 15) return "gelb";
  return "gruen";
}

function daysUntil(dateStr) {
  return daysBetween(today, dateStr);
}

function fristAmpel(frist) {
  if (frist.status === "geprüft" || frist.status === "erledigt" || frist.status === "eingereicht") return "done";
  const days = daysUntil(frist.datum);
  if (days < 0) return "ueberfaellig";
  if (days <= 30) return "dringend";
  if (days <= 90) return "bald";
  return "ok";
}

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

const ampelColors = {
  gruen: "#008c46",
  gelb: "#cc7700",
  rot: "#cc3333",
  ok: "#008c46",
  bald: "#cc7700",
  dringend: "#cc3333",
  ueberfaellig: "#990000",
  done: "#999",
};

const ampelBg = {
  gruen: "rgba(0,140,70,0.06)",
  gelb: "rgba(204,119,0,0.06)",
  rot: "rgba(204,51,51,0.06)",
};

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------
function ProjectCard({ project, selected, onClick }) {
  const progress = projectProgress(project);
  const burn = budgetBurnRate(project);
  const totalIst = project.finanzierungsplan.reduce((s, k) => s + k.ist, 0);
  const hasWarning = project.finanzierungsplan.some(
    (k) => k.soll > 0 && ((k.ist - k.soll) / k.soll) * 100 > 15
  );
  const nextFrist = project.fristen
    .filter((f) => f.status === "offen")
    .sort((a, b) => a.datum.localeCompare(b.datum))[0];

  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle,
        cursor: "pointer",
        borderColor: selected ? "#008c46" : "#eee",
        borderWidth: selected ? 2 : 1,
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 2 }}>{project.kuerzel}</div>
          <div style={{ fontSize: 11, color: "#999" }}>{project.foerdergeber} · {project.projekttraeger}</div>
        </div>
        <div style={{
          ...monoLabel,
          fontSize: 9,
          color: hasWarning ? "#cc3333" : "#008c46",
          background: hasWarning ? "rgba(204,51,51,0.06)" : "rgba(0,140,70,0.06)",
          padding: "3px 8px",
        }}>
          {hasWarning ? "WARNUNG" : "IM PLAN"}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>{project.name}</div>

      {/* Budget */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginBottom: 4 }}>
        <span>{fmt(totalIst)} von {fmt(project.bewilligt)}</span>
        <span style={{ fontFamily: "'Space Mono', monospace", color: burn > 90 ? "#cc3333" : "#666" }}>{burn.toFixed(0)}%</span>
      </div>
      <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, marginBottom: 12 }}>
        <div style={{
          height: "100%",
          width: `${Math.min(100, burn)}%`,
          background: burn > 90 ? "#cc3333" : burn > 70 ? "#cc7700" : "#008c46",
          borderRadius: 2,
          transition: "width 0.6s ease",
        }} />
      </div>

      {/* Laufzeit */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb", marginBottom: 4 }}>
        <span>Laufzeit</span>
        <span style={{ fontFamily: "'Space Mono', monospace" }}>{progress.toFixed(0)}%</span>
      </div>
      <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, marginBottom: 10 }}>
        <div style={{
          height: "100%",
          width: `${progress}%`,
          background: "#ddd",
          borderRadius: 2,
        }} />
      </div>

      {/* Nächste Frist */}
      {nextFrist && (
        <div style={{ fontSize: 10, color: ampelColors[fristAmpel(nextFrist)], fontFamily: "'Space Mono', monospace" }}>
          {daysUntil(nextFrist.datum) > 0
            ? `${nextFrist.typ} in ${daysUntil(nextFrist.datum)} Tagen`
            : `${nextFrist.typ} ÜBERFÄLLIG`}
        </div>
      )}
    </div>
  );
}

function FinanzierungsplanView({ project }) {
  const chartData = project.finanzierungsplan.map((k) => {
    const abw = k.soll > 0 ? ((k.ist - k.soll) / k.soll) * 100 : 0;
    return {
      name: k.kategorie.replace("Personaleinzelkosten", "Personal").replace("Gemeinkosten (120%)", "Gemeinkosten").replace("Personalausgaben", "Personal").replace("Sachausgaben", "Sachkosten").replace("Reiseausgaben", "Reisekosten").replace("Gegenstände", "Gegenstände"),
      Soll: k.soll,
      Ist: k.ist,
      abweichung: abw,
      status: schwellenwertStatus(k.soll, k.ist),
    };
  });

  const totalSoll = project.finanzierungsplan.reduce((s, k) => s + k.soll, 0);
  const totalIst = project.finanzierungsplan.reduce((s, k) => s + k.ist, 0);

  return (
    <div>
      <div style={{ ...monoLabel, marginBottom: 16, color: "#008c46" }}>
        Finanzierungsplan Soll/Ist · {project.nebenbestimmungen}
      </div>

      {/* 20%-Schwellenwert Warnung */}
      {project.finanzierungsplan.some((k) => schwellenwertStatus(k.soll, k.ist) === "rot") && (
        <div style={{
          padding: "12px 16px",
          marginBottom: 20,
          background: "rgba(204,51,51,0.06)",
          border: "1px solid rgba(204,51,51,0.15)",
          fontSize: 12,
          color: "#cc3333",
          fontWeight: 500,
        }}>
          20%-Schwellenwert überschritten — Änderungsantrag beim Projektträger erforderlich (ANBest-P Nr. 1.2)
        </div>
      )}

      {/* Tabelle */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 100px 100px 80px 60px",
          gap: 8,
          padding: "8px 12px",
          borderBottom: "1px solid #eee",
          ...monoLabel,
          fontSize: 9,
        }}>
          <span>Kostenart</span>
          <span style={{ textAlign: "right" }}>Soll</span>
          <span style={{ textAlign: "right" }}>Ist</span>
          <span style={{ textAlign: "right" }}>Abw.</span>
          <span style={{ textAlign: "center" }}>Status</span>
        </div>
        {project.finanzierungsplan.map((k, i) => {
          const abw = k.soll > 0 ? ((k.ist - k.soll) / k.soll) * 100 : 0;
          const status = schwellenwertStatus(k.soll, k.ist);
          return (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 100px 80px 60px",
              gap: 8,
              padding: "10px 12px",
              borderBottom: "1px solid #f5f5f5",
              fontSize: 13,
              background: status === "rot" ? "rgba(204,51,51,0.03)" : "transparent",
            }}>
              <span style={{ color: "#333" }}>{k.kategorie}</span>
              <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#999" }}>{fmt(k.soll)}</span>
              <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#222" }}>{fmt(k.ist)}</span>
              <span style={{
                textAlign: "right",
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                color: ampelColors[status],
                fontWeight: status !== "gruen" ? 600 : 400,
              }}>
                {fmtPct(abw)}
              </span>
              <span style={{ textAlign: "center", fontSize: 14 }}>
                {status === "gruen" ? "\u{1F7E2}" : status === "gelb" ? "\u{1F7E1}" : "\u{1F534}"}
              </span>
            </div>
          );
        })}
        {/* Summe */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 100px 100px 80px 60px",
          gap: 8,
          padding: "10px 12px",
          borderTop: "2px solid #eee",
          fontSize: 13,
          fontWeight: 600,
        }}>
          <span style={{ color: "#111" }}>Gesamt</span>
          <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#999" }}>{fmt(totalSoll)}</span>
          <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#111" }}>{fmt(totalIst)}</span>
          <span style={{
            textAlign: "right",
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            color: ampelColors[schwellenwertStatus(totalSoll, totalIst)],
          }}>
            {totalSoll > 0 ? fmtPct(((totalIst - totalSoll) / totalSoll) * 100) : "–"}
          </span>
          <span />
        </div>
      </div>

      {/* Chart */}
      <div style={{ border: "1px solid #eee", padding: 24 }}>
        <div style={{ ...monoLabel, marginBottom: 16 }}>Soll vs. Ist nach Kostenart</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ left: 60, right: 16 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#999" }} />
            <YAxis tick={{ fontSize: 10, fill: "#aaa" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v) => fmt(v)}
              contentStyle={{ fontSize: 12, border: "1px solid #eee", borderRadius: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            />
            <Bar dataKey="Soll" fill="#ddd" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Ist" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={ampelColors[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legende */}
      <div style={{ display: "flex", gap: 24, marginTop: 16, fontSize: 11, color: "#999" }}>
        <span>{"\u{1F7E2}"} Abweichung {"<"} 15%</span>
        <span>{"\u{1F7E1}"} Abweichung 15–20% (Achtung)</span>
        <span>{"\u{1F534}"} Abweichung {">"} 20% (Änderungsantrag!)</span>
      </div>
    </div>
  );
}

function MittelabrufView({ project }) {
  const totalAbgerufen = project.abrufe.reduce((s, a) => s + a.betrag, 0);

  return (
    <div>
      <div style={{ ...monoLabel, marginBottom: 16, color: "#008c46" }}>
        Mittelabruf-Übersicht · Zahlungsanforderungen via profi-Online
      </div>

      {/* Warnung Bedarfsprinzip */}
      <div style={{
        padding: "12px 16px",
        marginBottom: 20,
        background: "rgba(0,140,70,0.03)",
        border: "1px solid rgba(0,140,70,0.1)",
        fontSize: 12,
        color: "#666",
        lineHeight: 1.6,
      }}>
        Bedarfsprinzip (BHO): Mittel nur bedarfsgerecht abrufen. Überschüssige Mittel lösen Zinsforderung aus (5% über Basiszins).
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Abgerufen</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{fmt(totalAbgerufen)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Verbleibend</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#008c46" }}>{fmt(project.bewilligt - totalAbgerufen)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Abrufquote</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{((totalAbgerufen / project.bewilligt) * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Abruf-Timeline */}
      <div style={{ ...monoLabel, marginBottom: 12 }}>Zahlungsanforderungen</div>
      <div style={{ display: "grid", gap: 6 }}>
        {project.abrufe.map((a, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "100px 100px 1fr 100px",
            gap: 12,
            padding: "10px 16px",
            border: "1px solid #f0f0f0",
            alignItems: "center",
            background: a.status === "offen" ? "rgba(204,119,0,0.03)" : "#fff",
          }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999" }}>
              {a.quartal}
            </span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#222", fontWeight: 600 }}>
              {a.betrag > 0 ? fmt(a.betrag) : "–"}
            </span>
            <span style={{ fontSize: 11, color: "#bbb" }}>
              {a.datum}
            </span>
            <span style={{
              fontSize: 9,
              fontFamily: "'Space Mono', monospace",
              textTransform: "uppercase",
              textAlign: "right",
              color: a.status === "ausgezahlt" ? "#008c46" : a.status === "geprüft" ? "#0066cc" : "#cc7700",
              fontWeight: 600,
            }}>
              {a.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FristenView({ project }) {
  const allFristen = [...project.fristen].sort((a, b) => a.datum.localeCompare(b.datum));

  return (
    <div>
      <div style={{ ...monoLabel, marginBottom: 16, color: "#008c46" }}>
        Fristen & Deadlines
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {allFristen.map((f, i) => {
          const ampel = fristAmpel(f);
          const days = daysUntil(f.datum);
          return (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 120px 100px",
              gap: 12,
              padding: "12px 16px",
              border: `1px solid ${ampel === "ueberfaellig" ? "rgba(153,0,0,0.2)" : "#f0f0f0"}`,
              alignItems: "center",
              background: ampel === "ueberfaellig" ? "rgba(153,0,0,0.03)" : ampel === "dringend" ? "rgba(204,51,51,0.02)" : "#fff",
            }}>
              <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{f.typ}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999" }}>
                {new Date(f.datum).toLocaleDateString("de-DE")}
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: ampelColors[ampel],
                fontWeight: 600,
              }}>
                {f.status === "geprüft" || f.status === "erledigt" || f.status === "eingereicht"
                  ? f.status.toUpperCase()
                  : days < 0
                    ? `${Math.abs(days)} TAGE ÜBERFÄLLIG`
                    : `in ${days} Tagen`}
              </span>
              <span style={{
                fontSize: 9,
                fontFamily: "'Space Mono', monospace",
                textTransform: "uppercase",
                textAlign: "center",
                padding: "3px 8px",
                color: ampelColors[ampel],
                background: ampel === "done" ? "#f5f5f5" : ampel === "ok" ? ampelBg.gruen : ampel === "bald" ? ampelBg.gelb : ampelBg.rot,
                fontWeight: 600,
              }}>
                {ampel === "done" ? "ERLEDIGT" : ampel === "ok" ? "OK" : ampel === "bald" ? "BALD" : ampel === "dringend" ? "DRINGEND" : "ÜBERFÄLLIG"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Vergabe-Tracker */}
      {project.vergaben && project.vergaben.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ ...monoLabel, marginBottom: 12, color: "#008c46" }}>
            Vergabedokumentation · Unteraufträge
          </div>
          <div style={{
            padding: "12px 16px",
            marginBottom: 16,
            background: "rgba(204,119,0,0.04)",
            border: "1px solid rgba(204,119,0,0.1)",
            fontSize: 11,
            color: "#888",
            lineHeight: 1.6,
          }}>
            Vergaberechtsfehler sind der häufigste Grund für Rückforderungen (BRH). Ab 1.000 € sind Vergleichsangebote erforderlich.
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {project.vergaben.map((v, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 80px 100px",
                gap: 12,
                padding: "10px 16px",
                border: "1px solid #f0f0f0",
                alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "#333" }}>{v.beschreibung}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#222", fontWeight: 600 }}>
                  {fmt(v.betrag)}
                </span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#999" }}>
                  {v.angebote} Angebot{v.angebote !== 1 ? "e" : ""}
                </span>
                <span style={{
                  fontSize: 9,
                  fontFamily: "'Space Mono', monospace",
                  textTransform: "uppercase",
                  textAlign: "center",
                  padding: "3px 8px",
                  fontWeight: 600,
                  color: v.status === "dokumentiert" ? "#008c46" : "#cc7700",
                  background: v.status === "dokumentiert" ? ampelBg.gruen : ampelBg.gelb,
                }}>
                  {v.status === "dokumentiert" ? "OK" : "PRÜFEN"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function FoerdermittelPipeline() {
  const [selectedProject, setSelectedProject] = useState(0);
  const [activeTab, setActiveTab] = useState("finanzplan");
  const sectionRef = useRef(null);

  const project = DEMO_PROJECTS[selectedProject];

  // Portfolio-Kennzahlen
  const totalBewilligt = DEMO_PROJECTS.reduce((s, p) => s + p.bewilligt, 0);
  const totalIst = DEMO_PROJECTS.reduce((s, p) => s + p.finanzierungsplan.reduce((ss, k) => ss + k.ist, 0), 0);
  const projectsWithWarning = DEMO_PROJECTS.filter((p) =>
    p.finanzierungsplan.some((k) => schwellenwertStatus(k.soll, k.ist) !== "gruen")
  ).length;
  const upcomingFristen = DEMO_PROJECTS.flatMap((p) => p.fristen)
    .filter((f) => f.status === "offen" && daysUntil(f.datum) <= 90 && daysUntil(f.datum) >= 0).length;

  return (
    <section
      id="foerdermittel"
      ref={sectionRef}
      style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}
    >
      <div style={{ ...monoLabel, letterSpacing: "0.3em", color: "#008c46", marginBottom: 12 }}>
        05 — Fördermittel-Controlling
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
        Fördermittel-<span style={{ fontWeight: 700 }}>Pipeline</span>
      </h2>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 600 }}>
        Projektcontrolling für BMBF/BMWK-Förderprojekte. Finanzierungsplan-Überwachung
        mit 20%-Schwellenwert-Ampel, Mittelabruf-Tracking und Fristenmanagement.
        Demo mit realistischen Beispieldaten.
      </p>

      {/* Portfolio Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Projekte</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>{DEMO_PROJECTS.length}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Fördervolumen</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>{(totalBewilligt / 1000000).toFixed(1)}M</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Warnungen</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: projectsWithWarning > 0 ? "#cc7700" : "#008c46" }}>{projectsWithWarning}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Fristen {"<"} 90 Tage</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: upcomingFristen > 0 ? "#cc7700" : "#008c46" }}>{upcomingFristen}</div>
        </div>
      </div>

      {/* Projekt-Auswahl */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {DEMO_PROJECTS.map((p, i) => (
          <ProjectCard
            key={p.id}
            project={p}
            selected={selectedProject === i}
            onClick={() => setSelectedProject(i)}
          />
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #eee" }}>
        {[
          { key: "finanzplan", label: "Finanzierungsplan" },
          { key: "abruf", label: "Mittelabruf" },
          { key: "fristen", label: "Fristen & Vergabe" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === t.key ? "2px solid #008c46" : "2px solid transparent",
              padding: "12px 24px",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: activeTab === t.key ? 600 : 400,
              color: activeTab === t.key ? "#111" : "#999",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "finanzplan" && <FinanzierungsplanView project={project} />}
      {activeTab === "abruf" && <MittelabrufView project={project} />}
      {activeTab === "fristen" && <FristenView project={project} />}
    </section>
  );
}
