import { useState, useRef } from "react";

// ---------------------------------------------------------------------------
// ETL-Pipeline: Fördermittel-Controlling Prozess
// ---------------------------------------------------------------------------

// profi-Online Positionsnummern
const PROFI_POS = {
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

// --- STEP 1: Raw data sources (messy, different formats) ---
const RAW_EXCEL_FRAUNHOFER = `Datum;Empfaenger;Nettobetrag;Anmerkung;Projekt
15.01.2025;Dr. MÃ¼ller;12.800,00;160h Projektarbeit Jan;KI-QS
22.01.2025;Dell Technologies;4.200,00;GPU-Server Nvidia A100;KI-QS
28.01.2025;DB / Motel One;487,50;Projekttreffen MÃ¼nchen;KI-QS
01.02.2025;M.Sc. Schmidt;8.400,00;140h Datenanalyse;KI-QS
10.02.2025;Fraunhofer IPT;15.000,00;Messprotokoll Sensoren;KI-QS`;

const RAW_CSV_SAP = `BELNR;BUKRS;BUDAT;WRBTR;SGTXT;KOSTL;AUFNR
100234;1000;20250115;12800.00;Gehalt Mueller E13 Jan;4711;KI-QS-2024
100235;1000;20250122;4998.00;RE Dell GPU Server;4711;KI-QS-2024
100236;1000;20250128;487.50;Reise Muenchen Mueller;4720;KI-QS-2024
100237;1000;20250201;8400.00;Gehalt Schmidt E11 Feb;4711;KI-QS-2024
100238;1000;20250210;17850.00;RE Fraunhofer IPT;4730;KI-QS-2024`;

const RAW_PROFI_ONLINE = `Pos.;Bezeichnung;Soll (EUR);Bisher abgerufen;Ausgaben lfd. HJ;Anforderung
0837;Personalkosten;480.000,00;295.000,00;54.960,00;54.960,00
0850;Investitionen;60.000,00;42.000,00;4.998,00;4.998,00
0846;Dienstreisen;24.000,00;11.500,00;487,50;487,50
0843;Sonst. Verwaltung;60.000,00;68.000,00;17.850,00;17.850,00
0831;Gegenstände <800;60.000,00;42.000,00;3.808,00;3.808,00`;

// --- STEP 2: Column mapping rules ---
const COLUMN_MAPPINGS = [
  { quelle: "Excel Fraunhofer", von: "Datum", nach: "Tag der Zahlung", typ: "Datum", notiz: "DD.MM.YYYY → ISO" },
  { quelle: "Excel Fraunhofer", von: "Empfaenger", nach: "Empfänger/Einzahler", typ: "Text", notiz: "Encoding ISO-8859-1 → UTF-8" },
  { quelle: "Excel Fraunhofer", von: "Nettobetrag", nach: "Einzelbetrag (EUR)", typ: "Zahl", notiz: "12.800,00 → 12800.00" },
  { quelle: "Excel Fraunhofer", von: "Anmerkung", nach: "Grund der Zahlung", typ: "Text", notiz: "Freitext" },
  { quelle: "SAP FI Export", von: "BUDAT", nach: "Tag der Zahlung", typ: "Datum", notiz: "YYYYMMDD → ISO" },
  { quelle: "SAP FI Export", von: "SGTXT", nach: "Grund der Zahlung", typ: "Text", notiz: "Buchungstext" },
  { quelle: "SAP FI Export", von: "WRBTR", nach: "Einzelbetrag (EUR)", typ: "Zahl", notiz: "Punkt als Dezimal" },
  { quelle: "SAP FI Export", von: "KOSTL", nach: "Pos. im FiPlan", typ: "Lookup", notiz: "Kostenstelle → Position" },
  { quelle: "profi-Online", von: "Pos.", nach: "Pos. im FiPlan", typ: "Direkt", notiz: "Bereits korrekt (0812–0850)" },
  { quelle: "profi-Online", von: "Ausgaben lfd. HJ", nach: "Einzelbetrag (EUR)", typ: "Zahl", notiz: "Summe je Position" },
];

// --- STEP 2: Transformation examples ---
const TRANSFORM_EXAMPLES = [
  { label: "Datum", vorher: "15.01.2025", nachher: "2025-01-15", regel: "DD.MM.YYYY → ISO 8601" },
  { label: "Betrag", vorher: "12.800,00", nachher: "12800.00", regel: "DE-Format → Dezimal" },
  { label: "Encoding", vorher: "MÃ¼ller", nachher: "Müller", regel: "ISO-8859-1 → UTF-8" },
  { label: "Position", vorher: "KOSTL: 4711", nachher: "0837", regel: "SAP Kostenstelle → FiPlan" },
  { label: "MwSt", vorher: "4.200,00 (netto)", nachher: "4.998,00 (brutto)", regel: "+19% USt berechnet" },
  { label: "GK-Satz", vorher: "PEK: 420.000 €", nachher: "GK: 462.000 €", regel: "×110% (Fraunhofer)" },
];

// --- STEP 2: Gemeinkosten-Berechnung ---
const GK_BERECHNUNGEN = [
  { partner: "Fraunhofer IZM", basis: "Personaleinzelkosten", betrag: 420000, satz: "110%", ergebnis: 462000, typ: "Kostenbasis (AZK)" },
  { partner: "TU Berlin", basis: "Personalausgaben", betrag: 480000, satz: "20%", ergebnis: 96000, typ: "Programmpauschale" },
  { partner: "MobilityTech GmbH", basis: "Personaleinzelkosten", betrag: 280000, satz: "100%", ergebnis: 280000, typ: "Kostenbasis (KMU)" },
  { partner: "Siemens Mobility", basis: "Personaleinzelkosten", betrag: 180000, satz: "120%", ergebnis: 216000, typ: "Kostenbasis (GU)" },
];

// --- STEP 3: Finanzierungsplan zum Abgleich ---
const FIPLAN = [
  { position: "0837", bezeichnung: "Personalkosten", soll: 480000, belegliste: 295000 },
  { position: "0850", bezeichnung: "Investitionen > 800 €", soll: 60000, belegliste: 42000 },
  { position: "0846", bezeichnung: "Dienstreisen", soll: 24000, belegliste: 11500 },
  { position: "0843", bezeichnung: "Sonst. Verwaltung / UA", soll: 60000, belegliste: 68000 },
  { position: "0831", bezeichnung: "Gegenstände bis 800 €", soll: 60000, belegliste: 42000 },
];

// --- STEP 4: Erkannte Fehler ---
const DETECTED_ERRORS = [
  {
    severity: "kritisch",
    titel: "20%-Schwellenwert überschritten — Position 0843",
    beschreibung: "Sonstige Verwaltungsausgaben / Unteraufträge: Ist 68.000 € übersteigt Soll 60.000 € um 13,3%. Bei Fortschreibung des Trends wird der 20%-Schwellenwert im Q3/2025 erreicht. Änderungsantrag vorbereiten.",
    beleg: "Aggregiert (Position 0843)",
    regelwerk: "ANBest-P Nr. 1.2 / NKBF 2017",
    aktion: "Änderungsantrag beim Projektträger (VDI/VDE-IT) einreichen. Umschichtung von Position 0831 prüfen.",
  },
  {
    severity: "kritisch",
    titel: "Unterauftrag ohne 3 Vergleichsangebote",
    beschreibung: "Fraunhofer IPT Messprotokoll Sensorsysteme (17.850 € brutto). Vergaberecht erfordert ab 1.000 € mindestens 3 Vergleichsangebote. Nur 2 Angebote dokumentiert.",
    beleg: "BL-2025-005",
    regelwerk: "UVgO / ANBest-P Nr. 3",
    aktion: "Drittes Vergleichsangebot einholen oder Vergabevermerk mit Begründung erstellen (Alleinstellungsmerkmal).",
  },
  {
    severity: "warnung",
    titel: "Dienstreise ohne Genehmigungsvermerk",
    beschreibung: "Projekttreffen München (487,50 €). Dienstreisegenehmigung nicht in der Belegliste referenziert. Muss als Anlage zum Verwendungsnachweis vorliegen.",
    beleg: "BL-2025-003",
    regelwerk: "BRKG / ANBest-P Nr. 1.4",
    aktion: "Dienstreisegenehmigung nachfordern und Beleg-Nr. zuordnen.",
  },
  {
    severity: "warnung",
    titel: "Möglicher Doppelbeleg — Dr. Müller Jan/Feb",
    beschreibung: "Beleg Nr. 1 (12.800 €, 160h) und Nr. 6 (12.160 €, 152h) zeigen ähnliche Beträge für denselben Mitarbeiter in aufeinanderfolgenden Monaten. Plausibilitätsprüfung: Stundensätze konsistent (80 €/h), kein Doppelbeleg.",
    beleg: "BL-2025-001 / BL-2025-006",
    regelwerk: "Interne Qualitätssicherung",
    aktion: "Kein Handlungsbedarf — Plausibilitätsprüfung bestanden. Stundensatz: 80,00 €/h (TV-L E13, Stufe 3).",
  },
  {
    severity: "hinweis",
    titel: "Cloud-Kosten ohne Projektanteil-Dokumentation",
    beschreibung: "AWS Q1/2025 Abrechnung (8.092 € brutto). Bei geteilter Nutzung muss der Projektanteil nachvollziehbar dokumentiert sein (Nutzungsprotokoll, Tagging).",
    beleg: "BL-2025-012",
    regelwerk: "NKBF 2017 Nr. 4",
    aktion: "AWS Cost Explorer Export mit Projekt-Tag als Anlage beifügen.",
  },
];

// --- STEP 5: Output artifacts ---
const EMAIL_DRAFT = `An: koordinator@fraunhofer-izm.de
CC: controlling@unternehmen.de
Betreff: [KI-QS / 01IS24042] Korrekturanforderung Q1/2025 — Position 0843

Sehr geehrter Herr Dr. Weber,

bei der Prüfung der Belegliste Q1/2025 für das Vorhaben KI-QS
(FKZ 01IS24042) sind folgende Punkte aufgefallen:

1. Position 0843 (Sonst. Verwaltungsausgaben): Ist-Ausgaben
   68.000 € übersteigen den Planansatz 60.000 € um 13,3%.
   → Bitte Umschichtungsantrag nach NKBF 2017 Nr. 1.2 prüfen.

2. Unterauftrag Fraunhofer IPT (17.850 €): Es liegen nur
   2 Vergleichsangebote vor, 3 sind erforderlich (UVgO).
   → Bitte drittes Angebot nachreichen oder Vergabevermerk
     mit Alleinstellungsbegründung erstellen.

3. Dienstreise München (BL-2025-003): Genehmigungsvermerk
   fehlt in der Dokumentation.

Bitte um Rückmeldung bis zum 15.04.2025.

Mit freundlichen Grüßen
Christoph Zapp — Fördermittel-Controlling`;

const ZAF_SUMMARY = `Zahlungsanforderung (Vordruck 3220) — profi-Online
══════════════════════════════════════════════════
Vorhaben:     KI-basierte Qualitätssicherung (KI-QS)
FKZ:          01IS24042
Fördergeber:  BMBF / VDI/VDE-IT
Zeitraum:     Q1/2025 (01.01.2025 — 31.03.2025)

Pos.  Bezeichnung              Bisher       Lfd. HJ     Anforderung
────  ─────────────────────     ──────────   ─────────   ───────────
0837  Personalkosten            295.000 €    54.960 €     54.960 €
0850  Investitionen              42.000 €     4.998 €      4.998 €
0846  Dienstreisen               11.500 €       488 €        488 €
0843  Sonst. Verwaltung          68.000 €    17.850 €     17.850 €
0831  Gegenstände <800 €         42.000 €     3.808 €      3.808 €
────  ─────────────────────     ──────────   ─────────   ───────────
      Angeforderte Bundesmittel                           82.104 €

Abruf gemäß Bedarfsprinzip (BHO §44). Mittel werden
innerhalb von 6 Wochen nach Auszahlung verausgabt.`;

const STATUS_REPORT = `Status-Report für Projektträger VDI/VDE-IT
══════════════════════════════════════════
Vorhaben:  KI-QS (01IS24042) · Berichtszeitraum: Q1/2025

ZEITFORTSCHRITT     ████████░░░░  42% (Monat 15 von 36)
MITTELABFLUSS       ██████░░░░░░  54% (770.500 € von 1.200.000 €)
BURN RATE           ■ Abruf liegt 12% über Zeitfortschritt → im Plan

SCHWELLENWERT-AMPEL
  🟢 0837  Personalkosten        295.000 / 480.000   (–38,5%)
  🟢 0850  Investitionen          42.000 /  60.000   (–30,0%)
  🟢 0846  Dienstreisen           11.500 /  24.000   (–52,1%)
  🟡 0843  Sonst. Verwaltung      68.000 /  60.000   (+13,3%)
  🟢 0831  Gegenstände <800       42.000 /  60.000   (–30,0%)

OFFENE PUNKTE
  ⚠ Änderungsantrag Pos. 0843 vorbereiten (Trend: 20% in Q3)
  ⚠ Vergabedokumentation Fraunhofer IPT vervollständigen
  ℹ Zwischennachweis 2024: eingereicht (30.04.2025)
  ℹ Nächster Mittelabruf: Q2/2025 (Frist: 15.07.2025)`;

// ---------------------------------------------------------------------------
// Helpers & Styles
// ---------------------------------------------------------------------------
const fmt = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtExact = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

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
  fontFamily: "'Space Mono', monospace",
  fontSize: 11,
  lineHeight: 1.7,
  background: "#1a1a2e",
  color: "#a8b2d1",
  border: "1px solid #2a2a4a",
  padding: "16px 20px",
  whiteSpace: "pre",
  overflowX: "auto",
  borderRadius: 0,
};

const stepCircleStyle = (status) => ({
  width: 36,
  height: 36,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "'Space Mono', monospace",
  flexShrink: 0,
  border: status === "active" ? "2px solid #008c46" : "2px solid transparent",
  background: status === "done" ? "#008c46" : status === "active" ? "#fff" : "#f0f0f0",
  color: status === "done" ? "#fff" : status === "active" ? "#008c46" : "#bbb",
  transition: "all 0.3s ease",
});

const severityColor = { kritisch: "#cc3333", warnung: "#cc7700", hinweis: "#999" };
const severityBg = { kritisch: "rgba(204,51,51,0.06)", warnung: "rgba(204,119,0,0.06)", hinweis: "#f5f5f5" };

// ---------------------------------------------------------------------------
// Pipeline Steps
// ---------------------------------------------------------------------------

// --- STEP 6: Automatisierungspotenzial ---
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

const STEPS = [
  { title: "Dateneingang", subtitle: "Extract", summary: "3 Quellen · 15 Datensätze · 3 Formate" },
  { title: "Transformation", subtitle: "Transform", summary: "10 Mappings · 4 GK-Berechnungen · 6 Konvertierungen" },
  { title: "Validierung & Abgleich", subtitle: "Validate", summary: "Belegliste ↔ Finanzierungsplan · 5 Positionen" },
  { title: "Fehlererkennung", subtitle: "Detect", summary: "2 kritisch · 2 Warnungen · 1 Hinweis" },
  { title: "Ausgabe", subtitle: "Load", summary: "E-Mail · Zahlungsanforderung · Status-Report" },
  { title: "Automatisierungspotenzial", subtitle: "Optimize", summary: "5 Phasen · 15 Prozesse · 100+ Stunden/Jahr Einsparung" },
];

// ---------------------------------------------------------------------------
// Step 0: Dateneingang (Extract)
// ---------------------------------------------------------------------------
function ExtractView() {
  const sources = [
    { label: "Excel — Fraunhofer IZM", format: "XLSX · ISO-8859-1 · Semikolon", data: RAW_EXCEL_FRAUNHOFER, issues: ["Encoding: Umlaute defekt (MÃ¼ller)", "Spaltenname 'Nettobetrag' statt 'Einzelbetrag'", "Fehlende Spalte: Positionsnummer im FiPlan"] },
    { label: "SAP FI Export (DATEV)", format: "CSV · UTF-8 · Semikolon", data: RAW_CSV_SAP, issues: ["Datumsformat: YYYYMMDD (nicht lesbar)", "Betrag: Punkt als Dezimal (US-Format)", "Interne Felder: BELNR, BUKRS, KOSTL"] },
    { label: "profi-Online Export", format: "CSV · UTF-8 · Semikolon", data: RAW_PROFI_ONLINE, issues: ["Aggregiert je Position (keine Einzelbelege)", "Deutsche Zahlenformate mit Punkt als Tsd.-Trenner", "Fehlend: Empfänger, Zahlungsdatum je Beleg"] },
  ];

  return (
    <div>
      <div style={{ padding: "12px 16px", marginBottom: 24, background: "rgba(0,102,204,0.04)", border: "1px solid rgba(0,102,204,0.1)", fontSize: 12, color: "#555", lineHeight: 1.7 }}>
        <strong>Ausgangslage:</strong> Drei verschiedene Datenquellen mit unterschiedlichen Formaten, Encoding und Spaltenstrukturen.
        Der Controller muss diese zusammenführen, bereinigen und gegen den Finanzierungsplan abgleichen.
      </div>

      <div style={{ display: "grid", gap: 24 }}>
        {sources.map((src) => (
          <div key={src.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ ...monoLabel, color: "#008c46", fontSize: 10 }}>{src.label}</div>
              <div style={{ ...monoLabel, fontSize: 9, color: "#999" }}>{src.format}</div>
            </div>
            <div style={codeBlock}>{src.data}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {src.issues.map((issue) => (
                <span key={issue} style={{ fontSize: 10, color: "#cc7700", background: "rgba(204,119,0,0.06)", padding: "3px 8px", fontFamily: "'Space Mono', monospace" }}>
                  {issue}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Transformation
// ---------------------------------------------------------------------------
function TransformView() {
  return (
    <div>
      {/* Column Mapping */}
      <div style={{ ...monoLabel, color: "#008c46", marginBottom: 12 }}>Spalten-Mapping · Quelle → Zielformat (BMBF 0623a)</div>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "140px 120px 24px 150px 60px 1fr",
          gap: 4, padding: "6px 12px", borderBottom: "1px solid #eee", ...monoLabel, fontSize: 8,
        }}>
          <span>Quelle</span><span>Feld (Roh)</span><span /><span>Zielfeld</span><span>Typ</span><span>Regel</span>
        </div>
        {COLUMN_MAPPINGS.map((m, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "140px 120px 24px 150px 60px 1fr",
            gap: 4, padding: "8px 12px", borderBottom: "1px solid #f8f8f8", fontSize: 11,
            background: i % 2 === 0 ? "#fff" : "#fafafa",
          }}>
            <span style={{ color: "#999", fontSize: 10 }}>{m.quelle}</span>
            <span style={{ fontFamily: "'Space Mono', monospace", color: "#a8b2d1", fontSize: 10 }}>{m.von}</span>
            <span style={{ color: "#008c46", fontWeight: 700, textAlign: "center" }}>→</span>
            <span style={{ fontFamily: "'Space Mono', monospace", color: "#222", fontSize: 10, fontWeight: 600 }}>{m.nach}</span>
            <span style={{ ...monoLabel, fontSize: 8, color: m.typ === "Lookup" ? "#0066cc" : "#bbb" }}>{m.typ}</span>
            <span style={{ color: "#888", fontSize: 10 }}>{m.notiz}</span>
          </div>
        ))}
      </div>

      {/* Format-Konvertierungen */}
      <div style={{ ...monoLabel, color: "#008c46", marginBottom: 12 }}>Format-Konvertierungen</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
        {TRANSFORM_EXAMPLES.map((t) => (
          <div key={t.label} style={{ border: "1px solid #eee", padding: "14px 16px" }}>
            <div style={{ ...monoLabel, fontSize: 9, marginBottom: 8 }}>{t.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#cc3333", textDecoration: "line-through", opacity: 0.7 }}>{t.vorher}</span>
              <span style={{ color: "#008c46", fontWeight: 700 }}>→</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#008c46", fontWeight: 600 }}>{t.nachher}</span>
            </div>
            <div style={{ fontSize: 10, color: "#999" }}>{t.regel}</div>
          </div>
        ))}
      </div>

      {/* Gemeinkosten-Berechnung */}
      <div style={{ ...monoLabel, color: "#008c46", marginBottom: 12 }}>Gemeinkosten-Berechnung je Verbundpartner</div>
      <div style={{ display: "grid", gap: 8 }}>
        {GK_BERECHNUNGEN.map((g) => (
          <div key={g.partner} style={{ border: "1px solid #eee", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{g.partner}</div>
              <div style={{ fontSize: 10, color: "#999" }}>{g.typ}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
              <span style={{ color: "#666" }}>{fmt(g.betrag)}</span>
              <span style={{ color: "#999" }}>×</span>
              <span style={{ color: "#0066cc", fontWeight: 600 }}>{g.satz}</span>
              <span style={{ color: "#008c46", fontWeight: 700 }}>=</span>
              <span style={{ color: "#008c46", fontWeight: 700 }}>{fmt(g.ergebnis)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Validierung & Abgleich
// ---------------------------------------------------------------------------
function ValidationView() {
  return (
    <div>
      <div style={{ padding: "12px 16px", marginBottom: 24, background: "rgba(0,140,70,0.03)", border: "1px solid rgba(0,140,70,0.1)", fontSize: 12, color: "#666", lineHeight: 1.7 }}>
        Abgleich der aggregierten Belegliste gegen den bewilligten Finanzierungsplan.
        Überschreitungen {">"} 20% erfordern einen Änderungsantrag (ANBest-P Nr. 1.2).
      </div>

      <div style={{ ...monoLabel, color: "#008c46", marginBottom: 12 }}>Belegliste ↔ Finanzierungsplan</div>

      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "55px 1fr 100px 24px 100px 80px 60px",
        gap: 8, padding: "8px 12px", borderBottom: "1px solid #eee", ...monoLabel, fontSize: 8,
      }}>
        <span>Pos.</span><span>Bezeichnung</span>
        <span style={{ textAlign: "right" }}>Soll (FiPlan)</span>
        <span />
        <span style={{ textAlign: "right" }}>Ist (Belege)</span>
        <span style={{ textAlign: "right" }}>Abweichung</span>
        <span style={{ textAlign: "center" }}>Status</span>
      </div>

      {FIPLAN.map((p) => {
        const abw = p.soll > 0 ? ((p.belegliste - p.soll) / p.soll) * 100 : 0;
        const status = abw > 20 ? "rot" : abw > 15 ? "gelb" : "gruen";
        const statusColors = { gruen: "#008c46", gelb: "#cc7700", rot: "#cc3333" };
        return (
          <div key={p.position} style={{
            display: "grid", gridTemplateColumns: "55px 1fr 100px 24px 100px 80px 60px",
            gap: 8, padding: "10px 12px", borderBottom: "1px solid #f5f5f5", fontSize: 12,
            background: status === "rot" ? "rgba(204,51,51,0.03)" : status === "gelb" ? "rgba(204,119,0,0.02)" : "transparent",
          }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#008c46", fontWeight: 600 }}>{p.position}</span>
            <span style={{ color: "#333" }}>{p.bezeichnung}</span>
            <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#999" }}>{fmt(p.soll)}</span>
            <span style={{ textAlign: "center", color: statusColors[status], fontWeight: 700 }}>↔</span>
            <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#222", fontWeight: 600 }}>{fmt(p.belegliste)}</span>
            <span style={{ textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 11, color: statusColors[status], fontWeight: status !== "gruen" ? 700 : 400 }}>
              {abw > 0 ? "+" : ""}{abw.toFixed(1)}%
            </span>
            <span style={{ textAlign: "center", fontSize: 14 }}>
              {status === "gruen" ? "\u{1F7E2}" : status === "gelb" ? "\u{1F7E1}" : "\u{1F534}"}
            </span>
          </div>
        );
      })}

      {/* Vergaberecht-Check */}
      <div style={{ marginTop: 32 }}>
        <div style={{ ...monoLabel, color: "#008c46", marginBottom: 12 }}>Vergaberecht-Prüfung · Unteraufträge</div>
        <div style={{ display: "grid", gap: 6 }}>
          {[
            { beschreibung: "Fraunhofer IPT — Messprotokoll", betrag: 17850, angebote: 2, ok: false },
            { beschreibung: "Cloud Computing AWS Q1/2025", betrag: 8092, angebote: 3, ok: true },
            { beschreibung: "ML-Beratung extern", betrag: 45000, angebote: 3, ok: true },
          ].map((v) => (
            <div key={v.beschreibung} style={{
              display: "grid", gridTemplateColumns: "1fr 90px 90px 80px",
              gap: 12, padding: "10px 16px", alignItems: "center",
              border: `1px solid ${v.ok ? "#eee" : "rgba(204,119,0,0.3)"}`,
              background: v.ok ? "#fff" : "rgba(204,119,0,0.02)",
            }}>
              <span style={{ fontSize: 12, color: "#333" }}>{v.beschreibung}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#222", fontWeight: 600 }}>{fmtExact(v.betrag)}</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: v.ok ? "#999" : "#cc7700" }}>
                {v.angebote}/3 Angebote
              </span>
              <span style={{
                fontSize: 9, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", textAlign: "center",
                padding: "3px 8px", fontWeight: 600,
                color: v.ok ? "#008c46" : "#cc7700",
                background: v.ok ? "rgba(0,140,70,0.06)" : "rgba(204,119,0,0.06)",
              }}>
                {v.ok ? "OK" : "PRÜFEN"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Fehlererkennung
// ---------------------------------------------------------------------------
function ErrorDetectionView() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Kritisch", count: DETECTED_ERRORS.filter((e) => e.severity === "kritisch").length, color: "#cc3333" },
          { label: "Warnung", count: DETECTED_ERRORS.filter((e) => e.severity === "warnung").length, color: "#cc7700" },
          { label: "Hinweis", count: DETECTED_ERRORS.filter((e) => e.severity === "hinweis").length, color: "#999" },
        ].map((s) => (
          <div key={s.label} style={cardStyle}>
            <div style={{ ...monoLabel, marginBottom: 6, fontSize: 9 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {DETECTED_ERRORS.map((err, i) => (
          <div key={i} style={{
            border: `1px solid ${err.severity === "kritisch" ? "rgba(204,51,51,0.2)" : err.severity === "warnung" ? "rgba(204,119,0,0.2)" : "#eee"}`,
            background: severityBg[err.severity],
            padding: "16px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{
                ...monoLabel, fontSize: 9, padding: "2px 8px", fontWeight: 700,
                color: severityColor[err.severity],
                background: err.severity === "kritisch" ? "rgba(204,51,51,0.12)" : err.severity === "warnung" ? "rgba(204,119,0,0.12)" : "#eee",
              }}>
                {err.severity.toUpperCase()}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#222" }}>{err.titel}</span>
            </div>

            <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7, marginBottom: 10 }}>
              {err.beschreibung}
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: "#999" }}>
                <span style={{ ...monoLabel, fontSize: 8, marginRight: 4 }}>BELEG</span>
                {err.beleg}
              </span>
              <span style={{ fontSize: 10, color: "#999" }}>
                <span style={{ ...monoLabel, fontSize: 8, marginRight: 4 }}>REGELWERK</span>
                {err.regelwerk}
              </span>
            </div>

            <div style={{
              padding: "8px 12px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.04)",
              fontSize: 11, color: "#444", lineHeight: 1.6,
            }}>
              <span style={{ ...monoLabel, fontSize: 8, color: "#008c46", marginRight: 6 }}>AKTION</span>
              {err.aktion}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Ausgabe (Load)
// ---------------------------------------------------------------------------
function OutputView() {
  const [activeOutput, setActiveOutput] = useState("email");
  const outputs = [
    { key: "email", label: "E-Mail-Entwurf" },
    { key: "zaf", label: "Zahlungsanforderung" },
    { key: "status", label: "Status-Report" },
  ];

  const content = { email: EMAIL_DRAFT, zaf: ZAF_SUMMARY, status: STATUS_REPORT };
  const descriptions = {
    email: "Automatisch generierte Korrekturanforderung an den Verbundkoordinator. Referenziert die in Schritt 3–4 erkannten Probleme mit Beleg-Nr., Regelwerk und konkreter Handlungsanweisung.",
    zaf: "Zahlungsanforderung nach profi-Online Vordruck 3220. Aggregiert die geprüften Belege je Finanzierungsplan-Position. Berücksichtigt bereits erhaltene Zahlungen und berechnet den Abrufbetrag.",
    status: "Kompakt-Report für den Projektträger mit Ampel-Übersicht, Burn Rate, Schwellenwert-Status und offenen Punkten. Grundlage für den Zwischennachweis.",
  };

  return (
    <div>
      <div style={{ padding: "12px 16px", marginBottom: 24, background: "rgba(0,140,70,0.03)", border: "1px solid rgba(0,140,70,0.1)", fontSize: 12, color: "#666", lineHeight: 1.7 }}>
        Aus den validierten Daten generierte Dokumente. In der Praxis: automatisierter Export nach
        profi-Online, E-Mail-Versand an Verbundpartner, PDF-Report für den Projektträger.
      </div>

      {/* Output type tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #eee" }}>
        {outputs.map((o) => (
          <button key={o.key} onClick={() => setActiveOutput(o.key)} style={{
            background: "none", border: "none",
            borderBottom: activeOutput === o.key ? "2px solid #008c46" : "2px solid transparent",
            padding: "10px 20px", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
            fontWeight: activeOutput === o.key ? 600 : 400,
            color: activeOutput === o.key ? "#111" : "#999",
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {o.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "#777", marginBottom: 12, lineHeight: 1.6 }}>
        {descriptions[activeOutput]}
      </div>

      <div style={codeBlock}>{content[activeOutput]}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Automatisierungspotenzial
// ---------------------------------------------------------------------------
function AutomationView() {
  const [expandedPhase, setExpandedPhase] = useState(null);

  // Gesamtrechnung
  const allProzesse = AUTOMATION_PHASES.flatMap((p) => p.prozesse);
  const totalManuell = allProzesse.reduce((s, p) => s + p.zeitManuell, 0);
  const totalAuto = allProzesse.reduce((s, p) => s + p.zeitAuto, 0);
  const totalErsparnis = totalManuell - totalAuto;
  // Pro Quartal, hochgerechnet auf Jahr (4 Quartale laufend + 1× Antrag + 1× VN)
  const jahrManuell = totalManuell * 4;
  const jahrAuto = totalAuto * 4;
  const jahrErsparnis = jahrManuell - jahrAuto;

  return (
    <div>
      <div style={{ padding: "12px 16px", marginBottom: 24, background: "rgba(0,140,70,0.03)", border: "1px solid rgba(0,140,70,0.1)", fontSize: 12, color: "#666", lineHeight: 1.7 }}>
        <strong>Prozessanalyse:</strong> Welche manuellen Tätigkeiten im Fördermittel-Controlling lassen sich automatisieren?
        Zeitschätzungen basieren auf einem mittelgroßen BMBF-Verbundprojekt (3–5 Partner, 2–3 Mio. € Volumen).
      </div>

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
          <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>≈ {Math.round(jahrErsparnis / 8)} Arbeitstage</div>
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
          const maxH = totalManuell;
          return (
            <div key={phase.phase} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#333", fontWeight: 500 }}>{phase.phase}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#999" }}>
                  {phManuell}h → {phAuto}h
                </span>
              </div>
              <div style={{ display: "flex", gap: 4, height: 16 }}>
                <div style={{
                  width: `${(phManuell / maxH) * 100}%`, background: "rgba(204,51,51,0.15)",
                  borderLeft: "3px solid #cc3333", display: "flex", alignItems: "center", paddingLeft: 6,
                }}>
                  <span style={{ fontSize: 9, fontFamily: "'Space Mono', monospace", color: "#cc3333" }}>{phManuell}h manuell</span>
                </div>
                {phAuto > 0 && (
                  <div style={{
                    width: `${Math.max(3, (phAuto / maxH) * 100)}%`, background: "rgba(0,140,70,0.15)",
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
      <div style={{ display: "grid", gap: 0 }}>
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
                <span style={{ color: "#008c46", fontWeight: 700, fontSize: 12 }}>→</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#008c46" }}>{phAuto}h</span>
                <span style={{
                  ...monoLabel, fontSize: 9, padding: "2px 6px",
                  color: "#008c46", background: "rgba(0,140,70,0.06)",
                }}>
                  –{Math.round((1 - phAuto / phManuell) * 100)}%
                </span>
                <span style={{
                  fontSize: 14, color: isOpen ? "#008c46" : "#ccc",
                  transition: "transform 0.3s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}>
                  ▾
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
                      {/* Manuell vs Auto */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 32px 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ ...monoLabel, fontSize: 8, color: "#cc3333", marginBottom: 6 }}>MANUELL · {proc.zeitManuell}h</div>
                          <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6 }}>{proc.manuell}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#008c46", fontWeight: 700, fontSize: 16 }}>→</span>
                        </div>
                        <div>
                          <div style={{ ...monoLabel, fontSize: 8, color: "#008c46", marginBottom: 6 }}>AUTOMATISIERT · {proc.zeitAuto}h</div>
                          <div style={{ fontSize: 11, color: "#333", lineHeight: 1.6, fontWeight: 500 }}>{proc.automatisiert}</div>
                        </div>
                      </div>

                      {/* Risiko + Zeitbalken */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f5f5f5" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ ...monoLabel, fontSize: 8, color: "#cc7700" }}>RISIKO</span>
                          <span style={{ fontSize: 10, color: "#888" }}>{proc.risiko}</span>
                        </div>
                        <div style={{
                          fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700,
                          color: "#008c46", background: "rgba(0,140,70,0.06)", padding: "2px 8px",
                        }}>
                          –{proc.zeitManuell - proc.zeitAuto}h ({Math.round((1 - proc.zeitAuto / proc.zeitManuell) * 100)}%)
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
                <span style={{ fontSize: 11, color: "#333", lineHeight: 1.4 }}>{p.automatisiert.split(":")[0].split("→")[0].trim()}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#cc3333", textAlign: "right" }}>{p.zeitManuell}h</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#008c46", textAlign: "right" }}>{p.zeitAuto}h</span>
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, textAlign: "right",
                  color: "#008c46",
                }}>
                  –{p.ersparnis}h/Zyklus
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
        <span style={{ color: "#e6e6e6" }}>Einsparung pro Projekt/Jahr:</span> <span style={{ color: "#008c46", fontWeight: 700 }}>{jahrErsparnis} Stunden ≈ {Math.round(jahrErsparnis / 8)} Arbeitstage</span><br />
        <span style={{ color: "#e6e6e6" }}>Bei 5 Projekten parallel:</span> <span style={{ color: "#008c46", fontWeight: 700 }}>{jahrErsparnis * 5} Stunden ≈ {Math.round((jahrErsparnis * 5) / 8)} Arbeitstage/Jahr</span><br />
        <span style={{ color: "#e6e6e6" }}>Zusätzlich:</span> <span style={{ color: "#cc7700" }}>Rückforderungsrisiko minimiert</span> durch Echtzeit-Prüfung
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function FoerdermittelPipeline() {
  const [activeStep, setActiveStep] = useState(null);
  const sectionRef = useRef(null);

  const stepComponents = [ExtractView, TransformView, ValidationView, ErrorDetectionView, OutputView, AutomationView];

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
        Daten-<span style={{ fontWeight: 700 }}>Pipeline</span>
      </h2>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 650 }}>
        ETL-Prozess für BMBF/BMWK-Förderprojekte. Vom Rohdaten-Import aus Excel, SAP und profi-Online
        über Transformation und Validierung bis zur automatisierten Fehlererkennung und Dokumentenausgabe.
        Interaktive Demo mit realistischen Beispieldaten.
      </p>

      {/* Mini Progress Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 48, padding: "16px 0" }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <button
              onClick={() => setActiveStep(activeStep === i ? null : i)}
              style={{
                ...stepCircleStyle(activeStep === i ? "active" : i < (activeStep ?? -1) ? "done" : "pending"),
                cursor: "pointer",
                position: "relative",
              }}
              title={step.title}
            >
              {activeStep === i ? i + 1 : i < (activeStep ?? -1) ? "✓" : i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < (activeStep ?? -1) ? "#008c46" : "#eee", transition: "background 0.3s" }} />
            )}
          </div>
        ))}
      </div>

      {/* Pipeline Steps */}
      <div style={{ display: "grid", gap: 0 }}>
        {STEPS.map((step, i) => {
          const isActive = activeStep === i;
          const StepComponent = stepComponents[i];

          return (
            <div key={i}>
              {/* Connector line */}
              {i > 0 && (
                <div style={{ display: "flex", paddingLeft: 17 }}>
                  <div style={{ width: 2, height: 24, background: "#eee" }} />
                </div>
              )}

              {/* Step header */}
              <button
                onClick={() => setActiveStep(isActive ? null : i)}
                style={{
                  display: "flex", alignItems: "center", gap: 16, width: "100%",
                  background: "none", border: "1px solid #eee", padding: "16px 20px",
                  cursor: "pointer", transition: "all 0.2s",
                  borderColor: isActive ? "#008c46" : "#eee",
                  borderWidth: isActive ? 2 : 1,
                }}
              >
                <div style={stepCircleStyle(isActive ? "active" : "pending")}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#222" }}>{step.title}</span>
                    <span style={{ ...monoLabel, fontSize: 9, color: "#0066cc", background: "rgba(0,102,204,0.06)", padding: "2px 8px" }}>
                      {step.subtitle}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#999", fontFamily: "'Space Mono', monospace" }}>
                    {step.summary}
                  </div>
                </div>
                <div style={{
                  fontSize: 18, color: isActive ? "#008c46" : "#ccc",
                  transition: "transform 0.3s", transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                }}>
                  ▾
                </div>
              </button>

              {/* Step content */}
              <div style={{
                maxHeight: isActive ? 3000 : 0,
                overflow: "hidden",
                transition: "max-height 0.4s ease",
              }}>
                <div style={{ padding: "24px 20px", borderLeft: "2px solid #008c46", marginLeft: 17, marginTop: 0 }}>
                  <StepComponent />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, padding: "16px 0", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb" }}>
        <span style={{ fontFamily: "'Space Mono', monospace" }}>FKZ 01IS24042 · BMBF / VDI/VDE-IT · NKBF 2017</span>
        <span style={{ fontFamily: "'Space Mono', monospace" }}>Demo · Fiktive Daten</span>
      </div>
    </section>
  );
}
