import { useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, CartesianGrid, Legend,
  PieChart, Pie,
} from "recharts";

// ---------------------------------------------------------------------------
// Demo-Daten: Realistische BMBF/BMWi Förderprojekte
// ---------------------------------------------------------------------------

// Verbundpartner für NuMoBB (Projekt 3)
const NUMOBB_PARTNERS = [
  {
    id: "p1",
    name: "Fraunhofer IZM",
    typ: "Forschungseinrichtung",
    rolle: "Verbundkoordinator",
    basis: "Kostenbasis (AZK)",
    gemeinkosten: "110%",
    foerderquote: 100,
    bewilligt: 980000,
    finanzierungsplan: [
      { kategorie: "Personaleinzelkosten", soll: 420000, ist: 365000 },
      { kategorie: "Gemeinkosten (110%)", soll: 462000, ist: 401500 },
      { kategorie: "Sachkosten", soll: 38000, ist: 29000 },
      { kategorie: "Reisekosten", soll: 20000, ist: 17500 },
      { kategorie: "Unteraufträge", soll: 40000, ist: 35000 },
    ],
    abrufStatus: "im-plan",
  },
  {
    id: "p2",
    name: "TU Berlin — Fachgebiet Verkehrsplanung",
    typ: "Universität",
    rolle: "Partner",
    basis: "Ausgabenbasis (AZA)",
    gemeinkosten: "Programmpauschale 20%",
    foerderquote: 100,
    bewilligt: 720000,
    finanzierungsplan: [
      { kategorie: "Personalausgaben", soll: 480000, ist: 395000 },
      { kategorie: "Programmpauschale (20%)", soll: 96000, ist: 79000 },
      { kategorie: "Sachausgaben", soll: 54000, ist: 48000 },
      { kategorie: "Reiseausgaben", soll: 30000, ist: 22000 },
      { kategorie: "Investitionen", soll: 60000, ist: 58000 },
    ],
    abrufStatus: "im-plan",
  },
  {
    id: "p3",
    name: "MobilityTech GmbH",
    typ: "KMU / Startup",
    rolle: "Partner",
    basis: "Kostenbasis (AZK)",
    gemeinkosten: "100%",
    foerderquote: 80,
    bewilligt: 640000,
    finanzierungsplan: [
      { kategorie: "Personaleinzelkosten", soll: 280000, ist: 255000 },
      { kategorie: "Gemeinkosten (100%)", soll: 280000, ist: 255000 },
      { kategorie: "Sachkosten", soll: 30000, ist: 42000 },
      { kategorie: "Reisekosten", soll: 10000, ist: 6500 },
      { kategorie: "Unteraufträge", soll: 40000, ist: 52000 },
    ],
    abrufStatus: "warnung",
  },
  {
    id: "p4",
    name: "Siemens Mobility GmbH",
    typ: "Großunternehmen",
    rolle: "Assoziierter Partner",
    basis: "Kostenbasis (AZK)",
    gemeinkosten: "120%",
    foerderquote: 50,
    bewilligt: 460000,
    finanzierungsplan: [
      { kategorie: "Personaleinzelkosten", soll: 180000, ist: 148000 },
      { kategorie: "Gemeinkosten (120%)", soll: 216000, ist: 177600 },
      { kategorie: "Sachkosten", soll: 24000, ist: 18000 },
      { kategorie: "Reisekosten", soll: 10000, ist: 7400 },
      { kategorie: "Unteraufträge", soll: 30000, ist: 25000 },
    ],
    abrufStatus: "im-plan",
  },
];

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
    basis: "Verbundprojekt (AZK/AZA gemischt)",
    nebenbestimmungen: "NKBF 2017 / ANBest-P",
    isVerbund: true,
    partners: NUMOBB_PARTNERS,
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

// profi-Online Positionsnummern (Finanzierungsplan)
const PROFI_POSITIONEN = {
  "0812": "Beschäftigte E12–E15",
  "0817": "Beschäftigte E1–E11",
  "0822": "Wiss./stud. Hilfskräfte",
  "0831": "Gegenstände bis 800 €",
  "0834": "Mieten und Rechnerkosten",
  "0837": "Personalkosten (AZK)",
  "0843": "Sonstige Verwaltungsausgaben",
  "0846": "Dienstreisen",
  "0850": "Investitionen > 800 €",
};

// Demo-Belegliste nach BMBF-Vordruck 0623a
// Spalten: Lfd. Nr., Tag der Zahlung, Empfänger/Einzahler, Grund der Zahlung, Einzelbetrag, Pos. im FiPlan
const DEMO_BELEGLISTE = [
  { nr: 1, zahltag: "15.01.2025", empfaenger: "Dr. Müller (E13, TV-L)", grund: "160h Projektarbeit Jan 2025 — AP 2.1", betrag: 12800, position: "0837" },
  { nr: 2, zahltag: "22.01.2025", empfaenger: "Dell Technologies GmbH", grund: "GPU-Server Nvidia A100 (Anteil Projekt) — AP 1.3", betrag: 4998, position: "0850" },
  { nr: 3, zahltag: "28.01.2025", empfaenger: "Deutsche Bahn / Motel One", grund: "Projekttreffen München — DB Ticket + Hotel 2 Nächte — AP 5.0", betrag: 487.50, position: "0846" },
  { nr: 4, zahltag: "01.02.2025", empfaenger: "M.Sc. Schmidt (E11, TV-L)", grund: "140h Datenanalyse Feb 2025 — AP 2.2", betrag: 8400, position: "0837" },
  { nr: 5, zahltag: "10.02.2025", empfaenger: "Fraunhofer IPT, Aachen", grund: "Unterauftrag Messprotokoll Sensorsysteme — AP 3.1", betrag: 17850, position: "0843" },
  { nr: 6, zahltag: "15.02.2025", empfaenger: "Dr. Müller (E13, TV-L)", grund: "152h Projektarbeit Feb 2025 — AP 2.1", betrag: 12160, position: "0837" },
  { nr: 7, zahltag: "20.02.2025", empfaenger: "MathWorks GmbH", grund: "Softwarelizenz MATLAB R2025a (Jahresanteil) — AP 1.2", betrag: 2201.50, position: "0834" },
  { nr: 8, zahltag: "01.03.2025", empfaenger: "M.Sc. Schmidt (E11, TV-L)", grund: "168h Modelltraining März 2025 — AP 2.3", betrag: 10080, position: "0837" },
  { nr: 9, zahltag: "05.03.2025", empfaenger: "ML4Industry e.V., Berlin", grund: "Konferenz Teilnahmegebühr + Tagungsband — AP 5.0", betrag: 535.50, position: "0846" },
  { nr: 10, zahltag: "12.03.2025", empfaenger: "Keyence Deutschland GmbH", grund: "Sensoren + Messtechnik (10 Stück à 380,80 €) — AP 3.2", betrag: 3808, position: "0831" },
  { nr: 11, zahltag: "15.03.2025", empfaenger: "Dr. Müller (E13, TV-L)", grund: "144h Projektarbeit März 2025 — AP 2.1", betrag: 11520, position: "0837" },
  { nr: 12, zahltag: "20.03.2025", empfaenger: "Amazon Web Services EMEA", grund: "Cloud Computing Q1/2025 — EC2 + S3 Projektnutzung — AP 1.4", betrag: 8092, position: "0834" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtExact = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
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
  if (soll === 0) return "gruen";
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

function partnerIst(partner) {
  return partner.finanzierungsplan.reduce((s, k) => s + k.ist, 0);
}

function partnerSoll(partner) {
  return partner.finanzierungsplan.reduce((s, k) => s + k.soll, 0);
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
  gruen: "#008c46", gelb: "#cc7700", rot: "#cc3333",
  ok: "#008c46", bald: "#cc7700", dringend: "#cc3333",
  ueberfaellig: "#990000", done: "#999",
};

const ampelBg = {
  gruen: "rgba(0,140,70,0.06)",
  gelb: "rgba(204,119,0,0.06)",
  rot: "rgba(204,51,51,0.06)",
};

const PARTNER_COLORS = ["#008c46", "#0066cc", "#cc7700", "#7700cc"];

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#222" }}>{project.kuerzel}</span>
            {project.isVerbund && (
              <span style={{ ...monoLabel, fontSize: 8, color: "#0066cc", background: "rgba(0,102,204,0.06)", padding: "2px 6px" }}>
                VERBUND
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#999" }}>{project.foerdergeber} · {project.projekttraeger}</div>
        </div>
        <div style={{
          ...monoLabel, fontSize: 9,
          color: hasWarning ? "#cc3333" : "#008c46",
          background: hasWarning ? "rgba(204,51,51,0.06)" : "rgba(0,140,70,0.06)",
          padding: "3px 8px",
        }}>
          {hasWarning ? "WARNUNG" : "IM PLAN"}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>{project.name}</div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginBottom: 4 }}>
        <span>{fmt(totalIst)} von {fmt(project.bewilligt)}</span>
        <span style={{ fontFamily: "'Space Mono', monospace", color: burn > 90 ? "#cc3333" : "#666" }}>{burn.toFixed(0)}%</span>
      </div>
      <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, marginBottom: 12 }}>
        <div style={{
          height: "100%", width: `${Math.min(100, burn)}%`,
          background: burn > 90 ? "#cc3333" : burn > 70 ? "#cc7700" : "#008c46",
          borderRadius: 2, transition: "width 0.6s ease",
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb", marginBottom: 4 }}>
        <span>Laufzeit</span>
        <span style={{ fontFamily: "'Space Mono', monospace" }}>{progress.toFixed(0)}%</span>
      </div>
      <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, marginBottom: 10 }}>
        <div style={{ height: "100%", width: `${progress}%`, background: "#ddd", borderRadius: 2 }} />
      </div>

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
      name: k.kategorie
        .replace("Personaleinzelkosten", "Personal")
        .replace(/Gemeinkosten \(\d+%\)/, "Gemeinkosten")
        .replace("Personalausgaben", "Personal")
        .replace("Sachausgaben", "Sachkosten")
        .replace("Reiseausgaben", "Reisekosten")
        .replace(/Programmpauschale \(\d+%\)/, "Pauschale"),
      Soll: k.soll, Ist: k.ist, abweichung: abw,
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

      {project.finanzierungsplan.some((k) => schwellenwertStatus(k.soll, k.ist) === "rot") && (
        <div style={{
          padding: "12px 16px", marginBottom: 20,
          background: "rgba(204,51,51,0.06)", border: "1px solid rgba(204,51,51,0.15)",
          fontSize: 12, color: "#cc3333", fontWeight: 500,
        }}>
          20%-Schwellenwert überschritten — Änderungsantrag beim Projektträger erforderlich (ANBest-P Nr. 1.2)
        </div>
      )}

      {/* Tabelle */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 100px 100px 80px 60px",
          gap: 8, padding: "8px 12px", borderBottom: "1px solid #eee",
          ...monoLabel, fontSize: 9,
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
              display: "grid", gridTemplateColumns: "1fr 100px 100px 80px 60px",
              gap: 8, padding: "10px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 13,
              background: status === "rot" ? "rgba(204,51,51,0.03)" : "transparent",
            }}>
              <span style={{ color: "#333" }}>{k.kategorie}</span>
              <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#999" }}>{fmt(k.soll)}</span>
              <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#222" }}>{fmt(k.ist)}</span>
              <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: ampelColors[status], fontWeight: status !== "gruen" ? 600 : 400 }}>
                {fmtPct(abw)}
              </span>
              <span style={{ textAlign: "center", fontSize: 14 }}>
                {status === "gruen" ? "\u{1F7E2}" : status === "gelb" ? "\u{1F7E1}" : "\u{1F534}"}
              </span>
            </div>
          );
        })}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 100px 100px 80px 60px",
          gap: 8, padding: "10px 12px", borderTop: "2px solid #eee", fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ color: "#111" }}>Gesamt</span>
          <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#999" }}>{fmt(totalSoll)}</span>
          <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#111" }}>{fmt(totalIst)}</span>
          <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: ampelColors[schwellenwertStatus(totalSoll, totalIst)] }}>
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
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12, border: "1px solid #eee", borderRadius: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
            <Bar dataKey="Soll" fill="#ddd" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Ist" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={ampelColors[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", gap: 24, marginTop: 16, fontSize: 11, color: "#999" }}>
        <span>{"\u{1F7E2}"} {"<"} 15%</span>
        <span>{"\u{1F7E1}"} 15–20%</span>
        <span>{"\u{1F534}"} {">"} 20% (Änderungsantrag)</span>
      </div>
    </div>
  );
}

function MittelabrufView({ project }) {
  const totalAbgerufen = project.abrufe.reduce((s, a) => s + a.betrag, 0);
  const progress = projectProgress(project);

  // Burn rate vs time chart data
  const burnData = [];
  let cumulative = 0;
  for (const a of project.abrufe) {
    cumulative += a.betrag;
    burnData.push({
      quartal: a.quartal,
      Abgerufen: cumulative,
      Planwert: Math.round(project.bewilligt * (burnData.length + 1) / (project.abrufe.length + 2)),
    });
  }

  return (
    <div>
      <div style={{ ...monoLabel, marginBottom: 16, color: "#008c46" }}>
        Mittelabruf-Übersicht · Zahlungsanforderungen via profi-Online
      </div>

      <div style={{
        padding: "12px 16px", marginBottom: 20,
        background: "rgba(0,140,70,0.03)", border: "1px solid rgba(0,140,70,0.1)",
        fontSize: 12, color: "#666", lineHeight: 1.6,
      }}>
        Zahlungsanforderung via profi-Online (Vordruck 3220). Bedarfsprinzip (BHO §44):
        Mittel nur bedarfsgerecht abrufen — überschüssige Mittel lösen Zinsforderung aus (5% über Basiszins).
        Positionen im FiPlan: 0812–0850 (Personal, Sach, Reise, Investitionen, Unteraufträge).
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Abgerufen", value: fmt(totalAbgerufen), color: "#111" },
          { label: "Verbleibend", value: fmt(project.bewilligt - totalAbgerufen), color: "#008c46" },
          { label: "Abrufquote", value: `${((totalAbgerufen / project.bewilligt) * 100).toFixed(1)}%`, color: "#111" },
          { label: "Zeitfortschritt", value: `${progress.toFixed(0)}%`, color: progress > ((totalAbgerufen / project.bewilligt) * 100) + 15 ? "#cc7700" : "#111" },
        ].map((s) => (
          <div key={s.label} style={cardStyle}>
            <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Burn Rate Chart */}
      <div style={{ border: "1px solid #eee", padding: 24, marginBottom: 24 }}>
        <div style={{ ...monoLabel, marginBottom: 16 }}>Kumulierter Mittelabruf vs. Planwert</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={burnData} margin={{ left: 60, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="quartal" tick={{ fontSize: 10, fill: "#999" }} />
            <YAxis tick={{ fontSize: 10, fill: "#aaa" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12, border: "1px solid #eee", borderRadius: 0 }} />
            <Line type="monotone" dataKey="Planwert" stroke="#ddd" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="Abgerufen" stroke="#008c46" strokeWidth={2} dot={{ r: 3, fill: "#008c46" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Abruf-Timeline */}
      <div style={{ ...monoLabel, marginBottom: 12 }}>Zahlungsanforderungen</div>
      <div style={{ display: "grid", gap: 6 }}>
        {project.abrufe.map((a, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "100px 100px 1fr 100px",
            gap: 12, padding: "10px 16px", border: "1px solid #f0f0f0", alignItems: "center",
            background: a.status === "offen" ? "rgba(204,119,0,0.03)" : "#fff",
          }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999" }}>{a.quartal}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#222", fontWeight: 600 }}>
              {a.betrag > 0 ? fmt(a.betrag) : "–"}
            </span>
            <span style={{ fontSize: 11, color: "#bbb" }}>{a.datum}</span>
            <span style={{
              fontSize: 9, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", textAlign: "right",
              color: a.status === "ausgezahlt" ? "#008c46" : a.status === "geprüft" ? "#0066cc" : "#cc7700", fontWeight: 600,
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
      <div style={{ ...monoLabel, marginBottom: 16, color: "#008c46" }}>Fristen & Deadlines</div>

      <div style={{ display: "grid", gap: 8 }}>
        {allFristen.map((f, i) => {
          const ampel = fristAmpel(f);
          const days = daysUntil(f.datum);
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1fr 120px 120px 100px",
              gap: 12, padding: "12px 16px", alignItems: "center",
              border: `1px solid ${ampel === "ueberfaellig" ? "rgba(153,0,0,0.2)" : "#f0f0f0"}`,
              background: ampel === "ueberfaellig" ? "rgba(153,0,0,0.03)" : ampel === "dringend" ? "rgba(204,51,51,0.02)" : "#fff",
            }}>
              <span style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{f.typ}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999" }}>
                {new Date(f.datum).toLocaleDateString("de-DE")}
              </span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: ampelColors[ampel], fontWeight: 600 }}>
                {f.status === "geprüft" || f.status === "erledigt" || f.status === "eingereicht"
                  ? f.status.toUpperCase()
                  : days < 0 ? `${Math.abs(days)} TAGE ÜBERFÄLLIG` : `in ${days} Tagen`}
              </span>
              <span style={{
                fontSize: 9, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", textAlign: "center",
                padding: "3px 8px", fontWeight: 600, color: ampelColors[ampel],
                background: ampel === "done" ? "#f5f5f5" : ampel === "ok" ? ampelBg.gruen : ampel === "bald" ? ampelBg.gelb : ampelBg.rot,
              }}>
                {ampel === "done" ? "ERLEDIGT" : ampel === "ok" ? "OK" : ampel === "bald" ? "BALD" : ampel === "dringend" ? "DRINGEND" : "ÜBERFÄLLIG"}
              </span>
            </div>
          );
        })}
      </div>

      {project.vergaben && project.vergaben.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ ...monoLabel, marginBottom: 12, color: "#008c46" }}>Vergabedokumentation · Unteraufträge</div>
          <div style={{
            padding: "12px 16px", marginBottom: 16,
            background: "rgba(204,119,0,0.04)", border: "1px solid rgba(204,119,0,0.1)",
            fontSize: 11, color: "#888", lineHeight: 1.6,
          }}>
            Vergaberechtsfehler = häufigster Grund für Rückforderungen (Bundesrechnungshof). Ab 1.000 € Vergleichsangebote erforderlich.
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {project.vergaben.map((v, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 100px 80px 100px",
                gap: 12, padding: "10px 16px", border: "1px solid #f0f0f0", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "#333" }}>{v.beschreibung}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#222", fontWeight: 600 }}>{fmt(v.betrag)}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#999" }}>
                  {v.angebote} Angebot{v.angebote !== 1 ? "e" : ""}
                </span>
                <span style={{
                  fontSize: 9, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", textAlign: "center",
                  padding: "3px 8px", fontWeight: 600,
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
// Verbundprojekt-Dashboard
// ---------------------------------------------------------------------------
function VerbundView({ project }) {
  if (!project.isVerbund || !project.partners) return null;

  const partners = project.partners;
  const totalVerbundBewilligt = partners.reduce((s, p) => s + p.bewilligt, 0);
  const totalVerbundIst = partners.reduce((s, p) => s + partnerIst(p), 0);

  const pieData = partners.map((p, i) => ({
    name: p.name.split(" — ")[0].split(" GmbH")[0],
    value: p.bewilligt,
    fill: PARTNER_COLORS[i],
  }));

  return (
    <div>
      <div style={{ ...monoLabel, marginBottom: 16, color: "#008c46" }}>
        Verbundprojekt · {partners.length} Partner · Koordinator: {partners[0].name}
      </div>

      {/* Verbund-Gesamtübersicht */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={cardStyle}>
              <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Verbund-Volumen</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{fmt(totalVerbundBewilligt)}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Verbund-Ist</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#008c46" }}>{fmt(totalVerbundIst)}</div>
            </div>
          </div>

          {/* Partner-Typ Erklärung */}
          <div style={{ border: "1px solid #eee", padding: 16 }}>
            <div style={{ ...monoLabel, marginBottom: 10 }}>Abrechnungsbasen im Verbund</div>
            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.8 }}>
              <div><strong>Fraunhofer IZM</strong> — Kostenbasis, 110% Gemeinkosten, 100% Förderquote</div>
              <div><strong>TU Berlin</strong> — Ausgabenbasis, 20% Programmpauschale, 100% Förderquote</div>
              <div><strong>MobilityTech</strong> — Kostenbasis, 100% GK (KMU-Satz), 80% Förderquote</div>
              <div><strong>Siemens Mobility</strong> — Kostenbasis, 120% GK, 50% Förderquote</div>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div style={{ border: "1px solid #eee", padding: 24 }}>
          <div style={{ ...monoLabel, marginBottom: 16 }}>Budget-Verteilung im Verbund</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12, border: "1px solid #eee", borderRadius: 0 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Partner-Karten */}
      <div style={{ ...monoLabel, marginBottom: 12 }}>Finanzstatus je Partner</div>
      <div style={{ display: "grid", gap: 12 }}>
        {partners.map((p, i) => {
          const ist = partnerIst(p);
          const soll = partnerSoll(p);
          const burnPct = (ist / p.bewilligt) * 100;
          const hasWarning = p.finanzierungsplan.some((k) => schwellenwertStatus(k.soll, k.ist) !== "gruen");

          return (
            <div key={p.id} style={{
              border: `1px solid ${hasWarning ? "rgba(204,119,0,0.3)" : "#eee"}`,
              padding: "16px 20px",
              background: hasWarning ? "rgba(204,119,0,0.02)" : "#fff",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: PARTNER_COLORS[i] }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#999" }}>{p.typ} · {p.rolle} · {p.basis} · {p.gemeinkosten} GK · {p.foerderquote}% FQ</div>
                  </div>
                </div>
                <div style={{
                  ...monoLabel, fontSize: 9, padding: "3px 8px",
                  color: hasWarning ? "#cc7700" : "#008c46",
                  background: hasWarning ? ampelBg.gelb : ampelBg.gruen,
                }}>
                  {p.abrufStatus === "warnung" ? "WARNUNG" : "IM PLAN"}
                </div>
              </div>

              {/* Mini Finanzplan */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(4, auto)", gap: 4, fontSize: 11 }}>
                {p.finanzierungsplan.map((k, j) => {
                  const abw = k.soll > 0 ? ((k.ist - k.soll) / k.soll) * 100 : 0;
                  const status = schwellenwertStatus(k.soll, k.ist);
                  return (
                    <div key={j} style={{ display: "contents" }}>
                      <span style={{ color: "#666", fontSize: 11, padding: "3px 0" }}>{k.kategorie}</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#bbb", textAlign: "right", padding: "3px 8px" }}>{fmt(k.soll)}</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#333", textAlign: "right", padding: "3px 8px" }}>{fmt(k.ist)}</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: ampelColors[status], textAlign: "right", padding: "3px 8px", fontWeight: status !== "gruen" ? 600 : 400 }}>
                        {fmtPct(abw)}
                      </span>
                      <span style={{ fontSize: 12, textAlign: "center", padding: "3px 4px" }}>
                        {status === "gruen" ? "\u{1F7E2}" : status === "gelb" ? "\u{1F7E1}" : "\u{1F534}"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Budget Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb", marginTop: 10, marginBottom: 3 }}>
                <span>{fmt(ist)} / {fmt(p.bewilligt)}</span>
                <span style={{ fontFamily: "'Space Mono', monospace" }}>{burnPct.toFixed(0)}%</span>
              </div>
              <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2 }}>
                <div style={{
                  height: "100%", width: `${Math.min(100, burnPct)}%`,
                  background: PARTNER_COLORS[i], borderRadius: 2,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Belegliste (BMBF-Vordruck 0623a)
// ---------------------------------------------------------------------------
function BeleglisteView({ project }) {
  // Gruppierung nach profi-Online Position
  const nachPosition = {};
  for (const b of DEMO_BELEGLISTE) {
    nachPosition[b.position] = (nachPosition[b.position] || 0) + b.betrag;
  }
  const summe = DEMO_BELEGLISTE.reduce((s, b) => s + b.betrag, 0);

  return (
    <div>
      <div style={{ ...monoLabel, marginBottom: 16, color: "#008c46" }}>
        Belegliste · BMBF-Vordruck 0623a · Q1/2025 · {project.kuerzel}
      </div>

      <div style={{
        padding: "12px 16px", marginBottom: 20,
        background: "rgba(0,102,204,0.04)", border: "1px solid rgba(0,102,204,0.1)",
        fontSize: 12, color: "#555", lineHeight: 1.7,
      }}>
        <strong>Offizielles Format:</strong> Anlage zum zahlenmäßigen Nachweis (Verwendungsnachweis).
        Spaltenstruktur nach BMBF-Vordruck 0623a: Lfd. Nr., Tag der Zahlung, Empfänger,
        Grund der Zahlung, Einzelbetrag, Positionsnummer im Finanzierungsplan.
        Belege chronologisch sortiert, je Kostenart getrennt.
      </div>

      {/* Zusammenfassung */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Belege</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{DEMO_BELEGLISTE.length}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Gesamtbetrag</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{fmt(summe)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>FiPlan-Positionen</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#008c46" }}>{Object.keys(nachPosition).length}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>Vordruck</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#666" }}>0623a</div>
        </div>
      </div>

      {/* Zuordnung nach profi-Online Position */}
      <div style={{ ...monoLabel, marginBottom: 10 }}>Zuordnung nach Finanzierungsplan-Position (profi-Online)</div>
      <div style={{ display: "grid", gap: 6, marginBottom: 24 }}>
        {Object.entries(nachPosition).sort((a, b) => a[0].localeCompare(b[0])).map(([pos, sum]) => (
          <div key={pos} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px", border: "1px solid #f0f0f0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#008c46", fontWeight: 600 }}>{pos}</span>
              <span style={{ fontSize: 12, color: "#333" }}>{PROFI_POSITIONEN[pos] || pos}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#222", fontWeight: 600 }}>{fmt(sum)}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#bbb" }}>
                {((sum / summe) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Belegliste Tabelle nach Vordruck 0623a */}
      <div style={{ ...monoLabel, marginBottom: 10 }}>Einzelbelege nach BMBF-Vordruck 0623a</div>
      <div style={{ overflowX: "auto" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "40px 85px 180px 1fr 90px 55px",
          gap: 4, padding: "6px 10px", borderBottom: "1px solid #eee",
          ...monoLabel, fontSize: 8, minWidth: 750,
        }}>
          <span>Nr.</span>
          <span>Zahltag</span>
          <span>Empfänger/Einzahler</span>
          <span>Grund der Zahlung</span>
          <span style={{ textAlign: "right" }}>Betrag (€)</span>
          <span style={{ textAlign: "center" }}>Pos.</span>
        </div>
        {DEMO_BELEGLISTE.map((b, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "40px 85px 180px 1fr 90px 55px",
            gap: 4, padding: "6px 10px", borderBottom: "1px solid #f8f8f8",
            fontSize: 11, minWidth: 750,
            background: i % 2 === 0 ? "#fff" : "#fafafa",
          }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#999" }}>{b.nr}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#999" }}>{b.zahltag}</span>
            <span style={{ color: "#333", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.empfaenger}</span>
            <span style={{ color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.grund}</span>
            <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#222", fontWeight: 600 }}>{fmtExact(b.betrag)}</span>
            <span style={{ textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#008c46", fontWeight: 600 }}>{b.position}</span>
          </div>
        ))}
        {/* Summenzeile */}
        <div style={{
          display: "grid", gridTemplateColumns: "40px 85px 180px 1fr 90px 55px",
          gap: 4, padding: "8px 10px", borderTop: "2px solid #eee",
          fontSize: 12, fontWeight: 600, minWidth: 750,
        }}>
          <span />
          <span />
          <span />
          <span style={{ color: "#111" }}>Summe</span>
          <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#111" }}>{fmtExact(summe)}</span>
          <span />
        </div>
      </div>

      {/* Hinweis zum offiziellen Format */}
      <div style={{
        marginTop: 20, padding: "14px 16px",
        background: "#fafafa", border: "1px solid #eee",
        fontSize: 11, color: "#888", lineHeight: 1.7,
      }}>
        <div style={{ fontFamily: "'Space Mono', monospace", marginBottom: 6 }}>
          BMBF-Vordruck 0623a · Belegliste (ab 20 Belege) · Anlage zum Verwendungsnachweis
        </div>
        <div>
          Abgabe als Excel (.xls) + Ausdruck · Belege chronologisch und nach Kostenart getrennt ·
          Tag der Zahlung = tatsächlicher Zahlungstag, nicht Buchungstag ·
          Empfänger muss namentlich benannt sein (nicht „Diverse")
        </div>
      </div>
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

  const totalBewilligt = DEMO_PROJECTS.reduce((s, p) => s + p.bewilligt, 0);
  const totalIst = DEMO_PROJECTS.reduce((s, p) => s + p.finanzierungsplan.reduce((ss, k) => ss + k.ist, 0), 0);
  const projectsWithWarning = DEMO_PROJECTS.filter((p) =>
    p.finanzierungsplan.some((k) => schwellenwertStatus(k.soll, k.ist) !== "gruen")
  ).length;
  const upcomingFristen = DEMO_PROJECTS.flatMap((p) => p.fristen)
    .filter((f) => f.status === "offen" && daysUntil(f.datum) <= 90 && daysUntil(f.datum) >= 0).length;

  // Tabs dynamisch je nach Projekt
  const tabs = [
    { key: "finanzplan", label: "Finanzierungsplan" },
    { key: "abruf", label: "Mittelabruf" },
    { key: "fristen", label: "Fristen & Vergabe" },
    ...(project.isVerbund ? [{ key: "verbund", label: "Verbundpartner" }] : []),
    { key: "belegliste", label: "Belegliste" },
  ];

  // Reset tab if switching from Verbund project
  const validTabs = tabs.map((t) => t.key);
  const currentTab = validTabs.includes(activeTab) ? activeTab : "finanzplan";

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
        mit 20%-Schwellenwert-Ampel, Verbundprojekt-Koordination, Mittelabruf-Tracking
        und Beleglisten-Import. Demo mit realistischen Beispieldaten.
      </p>

      {/* Portfolio Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Projekte", value: DEMO_PROJECTS.length, color: "#111" },
          { label: "Fördervolumen", value: `${(totalBewilligt / 1000000).toFixed(1)}M`, color: "#111" },
          { label: "Warnungen", value: projectsWithWarning, color: projectsWithWarning > 0 ? "#cc7700" : "#008c46" },
          { label: `Fristen < 90 Tage`, value: upcomingFristen, color: upcomingFristen > 0 ? "#cc7700" : "#008c46" },
        ].map((s) => (
          <div key={s.label} style={cardStyle}>
            <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Projekt-Auswahl */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {DEMO_PROJECTS.map((p, i) => (
          <ProjectCard
            key={p.id}
            project={p}
            selected={selectedProject === i}
            onClick={() => { setSelectedProject(i); setActiveTab("finanzplan"); }}
          />
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: "none", border: "none",
              borderBottom: currentTab === t.key ? "2px solid #008c46" : "2px solid transparent",
              padding: "12px 20px", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              fontWeight: currentTab === t.key ? 600 : 400,
              color: currentTab === t.key ? "#111" : "#999",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {t.label}
            {t.key === "verbund" && (
              <span style={{ marginLeft: 6, fontSize: 9, fontFamily: "'Space Mono', monospace", color: "#0066cc" }}>
                {project.partners?.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {currentTab === "finanzplan" && <FinanzierungsplanView project={project} />}
      {currentTab === "abruf" && <MittelabrufView project={project} />}
      {currentTab === "fristen" && <FristenView project={project} />}
      {currentTab === "verbund" && project.isVerbund && <VerbundView project={project} />}
      {currentTab === "belegliste" && <BeleglisteView project={project} />}
    </section>
  );
}
