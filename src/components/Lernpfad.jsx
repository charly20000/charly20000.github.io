import { useState } from "react";

// ---------------------------------------------------------------------------
// Lernpfad: SQL → DAX → Power BI → Fabric → KI
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
  fontSize: 12,
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

const kiBrueckeBox = {
  border: "1px solid rgba(0,102,204,0.15)",
  background: "rgba(0,102,204,0.04)",
  padding: "16px 20px",
  marginTop: 20,
};

const STATUS = {
  aktiv: { label: "AKTIV", color: "#008c46", bg: "rgba(0,140,70,0.08)" },
  geplant: { label: "GEPLANT", color: "#999", bg: "#f5f5f5" },
  erledigt: { label: "ERLEDIGT", color: "#fff", bg: "#008c46" },
};

const sqlDaxExamples = [
  {
    label: "Summe nach Kostenstelle",
    sql: `SELECT SUM(umsatz)
FROM buchungen
WHERE monat = '2025-03'
GROUP BY kostenstelle`,
    dax: `CALCULATE(
  SUM(Buchungen[Umsatz]),
  Buchungen[Monat] = "2025-03"
)`,
  },
  {
    label: "Soll/Ist-Abweichung",
    sql: `SELECT region,
  SUM(ist) - SUM(soll) AS abweichung
FROM fiplan
GROUP BY region
HAVING abweichung > 0`,
    dax: `Abweichung =
CALCULATE(
  SUM(FiPlan[Ist]) - SUM(FiPlan[Soll]),
  FILTER(FiPlan, [Ist] > [Soll])
)`,
  },
  {
    label: "Vormonatsvergleich (Time Intelligence)",
    sql: `SELECT monat,
  SUM(umsatz),
  LAG(SUM(umsatz))
    OVER (ORDER BY monat)
FROM umsatz
GROUP BY monat`,
    dax: `Vormonat =
CALCULATE(
  SUM(Umsatz[Betrag]),
  DATEADD(Kalender[Datum], -1, MONTH)
)`,
  },
];

const sollIstData = [
  { position: "Personalkosten", soll: 480000, ist: 465000 },
  { position: "Sachkosten", soll: 120000, ist: 158000 },
  { position: "Dienstreisen", soll: 24000, ist: 21500 },
  { position: "Investitionen", soll: 60000, ist: 52000 },
  { position: "Unterauftr\u00e4ge", soll: 80000, ist: 78000 },
];

const phases = [
  {
    nr: 1,
    title: "SQL \u2192 DAX Br\u00fccke",
    weeks: "Woche 1\u20132",
    status: "aktiv",
    meilensteine: [
      { text: "Erstes DAX-Measure in Power BI Desktop geschrieben", done: false },
    ],
  },
  {
    nr: 2,
    title: "Power BI Dashboard",
    weeks: "Woche 3\u20134",
    status: "geplant",
    meilensteine: [
      { text: "PL-300 Lernpfad gestartet", done: false },
      { text: "F\u00f6rdermittel-Daten in Power BI visualisiert", done: false },
    ],
  },
  {
    nr: 3,
    title: "Microsoft Fabric",
    weeks: "Woche 5\u20136",
    status: "geplant",
    meilensteine: [
      { text: "Fabric Trial aktiviert", done: false },
      { text: "Erster Lakehouse-Import", done: false },
      { text: "End-to-End Pipeline", done: false },
    ],
  },
  {
    nr: 4,
    title: "KI-Integration",
    weeks: "Woche 7\u20138",
    status: "geplant",
    meilensteine: [
      { text: "Claude API in Notebook integriert", done: false },
      { text: "Erste KI-gest\u00fctzte Analyse", done: false },
    ],
  },
];

const kpiCards = [
  { value: "4", label: "PHASEN" },
  { value: "8", label: "WOCHEN" },
  { value: "12", label: "MEILENSTEINE" },
  { value: "SQL \u2192 Fabric", label: "LERNPFAD" },
];

function fmt(n) {
  return n.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function CodeBlock({ children }) {
  return <pre style={codeBlock}>{children}</pre>;
}

function MeilensteinList({ items }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ ...monoLabel, marginBottom: 10 }}>Meilensteine</div>
      {items.map((m, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: m.done ? "none" : "2px solid #ccc",
            background: m.done ? "#008c46" : "transparent",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {m.done && (
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 13, color: m.done ? "#333" : "#888" }}>{m.text}</span>
        </div>
      ))}
    </div>
  );
}

function KiBruecke({ children }) {
  return (
    <div style={kiBrueckeBox}>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#0066cc",
        fontWeight: 700,
        marginBottom: 8,
      }}>
        KI-Br\u00fccke
      </div>
      <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

// --- Phase Content Components ---

function Phase1Content() {
  return (
    <div>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 20 }}>
        SQL-Wissen als Sprungbrett f\u00fcr DAX nutzen. Vertraute Abfragen in die Power-BI-Welt \u00fcbersetzen.
      </p>

      <div style={{ ...monoLabel, marginBottom: 12 }}>SQL vs. DAX \u2014 Controller-Beispiele</div>

      {sqlDaxExamples.map((ex, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 8 }}>
            {ex.label}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 40px 1fr", gap: 0, alignItems: "stretch" }}>
            <div>
              <div style={{ ...monoLabel, marginBottom: 6, color: "#cc7700" }}>SQL</div>
              <CodeBlock>{ex.sql}</CodeBlock>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#008c46",
              fontSize: 18,
              fontWeight: 700,
            }}>
              \u2192
            </div>
            <div>
              <div style={{ ...monoLabel, marginBottom: 6, color: "#008c46" }}>DAX</div>
              <CodeBlock>{ex.dax}</CodeBlock>
            </div>
          </div>
        </div>
      ))}

      <KiBruecke>
        Claude generiert DAX aus nat\u00fcrlicher Sprache:{" "}
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#0066cc" }}>
          &quot;Zeig mir den rollierenden 12-Monats-Durchschnitt&quot;
        </span>
        <div style={{ marginTop: 8 }}>
          <CodeBlock>{`Rolling_12M =
AVERAGEX(
  DATESINPERIOD(
    Kalender[Datum],
    LASTDATE(Kalender[Datum]),
    -12, MONTH
  ),
  [Monatsumsatz]
)`}</CodeBlock>
        </div>
      </KiBruecke>

      <MeilensteinList items={phases[0].meilensteine} />
    </div>
  );
}

function Phase2Content() {
  return (
    <div>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 20 }}>
        Erstes interaktives Dashboard f\u00fcr Soll/Ist-Vergleich mit Ampel-Logik und DAX-Measures.
      </p>

      <div style={{ ...monoLabel, marginBottom: 12 }}>Soll/Ist-Vergleich mit Ampel</div>

      {/* Mini Dashboard Table */}
      <div style={{ ...card, overflowX: "auto", padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              {["Position", "Soll", "Ist", "Abweichung", "\u0394 %", "Ampel"].map((h) => (
                <th key={h} style={{
                  textAlign: h === "Position" ? "left" : "right",
                  padding: "10px 14px",
                  ...monoLabel,
                  fontSize: 9,
                  color: "#aaa",
                  fontWeight: 400,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sollIstData.map((row, i) => {
              const abw = row.ist - row.soll;
              const pct = abw / row.soll;
              const ampel = Math.abs(pct) > 0.2 ? "rot" : Math.abs(pct) > 0.15 ? "gelb" : "gruen";
              const ampelColor = ampel === "rot" ? "#cc3333" : ampel === "gelb" ? "#cc7700" : "#008c46";
              const ampelBg = ampel === "rot" ? "rgba(204,51,51,0.08)" : ampel === "gelb" ? "rgba(204,119,0,0.08)" : "rgba(0,140,70,0.08)";
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 500, color: "#333" }}>{row.position}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#666" }}>{fmt(row.soll)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#333" }}>{fmt(row.ist)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: abw > 0 ? "#cc3333" : "#008c46" }}>
                    {abw > 0 ? "+" : ""}{fmt(abw)}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 12, color: ampelColor, fontWeight: 600 }}>
                    {(pct * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <span style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: ampelColor,
                      boxShadow: `0 0 6px ${ampelBg}`,
                    }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* DAX Measures */}
      <div style={{ marginTop: 20 }}>
        <div style={{ ...monoLabel, marginBottom: 8 }}>DAX-Measures</div>
        <CodeBlock>{`Abweichung % = DIVIDE([Ist] - [Soll], [Soll])

Ampel =
IF(
  [Abweichung %] > 0.2, "rot",
  IF([Abweichung %] > 0.15, "gelb", "gruen")
)

YTD Kosten =
TOTALYTD(
  SUM(Buchungen[Betrag]),
  Kalender[Datum]
)`}</CodeBlock>
      </div>

      <KiBruecke>
        Claude erkl\u00e4rt Anomalien:{" "}
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#0066cc" }}>
          &quot;Sachkosten Q3 +34% \u2014 Saisonaler Effekt oder Fehler?&quot;
        </span>
        <div style={{ marginTop: 6, fontSize: 12, color: "#888", lineHeight: 1.6 }}>
          Automatische Erkennung von Ausrei\u00dfern und kontextuelle Erkl\u00e4rung m\u00f6glicher Ursachen
          durch KI-Analyse historischer Muster.
        </div>
      </KiBruecke>

      <MeilensteinList items={phases[1].meilensteine} />
    </div>
  );
}

function Phase3Content() {
  const pipelineSteps = [
    { label: "CSV / SAP Export", icon: "\u{1F4C4}" },
    { label: "Fabric Lakehouse", icon: "\u{1F3E0}" },
    { label: "Dataflow Gen2", icon: "\u26A1" },
    { label: "Power BI", icon: "\u{1F4CA}" },
  ];

  return (
    <div>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 20 }}>
        End-to-End Datenpipeline mit Microsoft Fabric: Vom Rohdaten-Import bis zur Visualisierung.
      </p>

      <div style={{ ...monoLabel, marginBottom: 12 }}>Pipeline-Architektur</div>

      {/* Visual Pipeline */}
      <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "center", gap: 0, padding: "24px 20px", flexWrap: "wrap" }}>
        {pipelineSteps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ textAlign: "center", minWidth: 120 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: i === 0 ? "#f5f5f5" : i === pipelineSteps.length - 1 ? "rgba(0,140,70,0.08)" : "rgba(0,102,204,0.06)",
                border: i === pipelineSteps.length - 1 ? "2px solid #008c46" : "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                fontSize: 20,
              }}>
                {step.icon}
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.05em", color: "#666" }}>
                {step.label}
              </div>
            </div>
            {i < pipelineSteps.length - 1 && (
              <div style={{ color: "#ccc", fontSize: 18, margin: "0 8px", marginBottom: 20 }}>\u2192</div>
            )}
          </div>
        ))}
      </div>

      {/* Python Notebook */}
      <div style={{ marginTop: 20 }}>
        <div style={{ ...monoLabel, marginBottom: 8 }}>Fabric Notebook: Belegliste einlesen</div>
        <CodeBlock>{`# Fabric Notebook: Belegliste einlesen
df = spark.read.csv(
    "/lakehouse/files/sap_export.csv",
    header=True,
    sep=";"
)
df = df.withColumn(
    "betrag",
    col("WRBTR").cast("double")
)
df = df.withColumn(
    "position",
    mapping_udf(col("KOSTL"))
)
df.write.format("delta").saveAsTable(
    "gold.belegliste"
)`}</CodeBlock>
      </div>

      <KiBruecke>
        Claude schreibt PySpark-Transformationen und Fabric-Notebooks:{" "}
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#0066cc" }}>
          &quot;Erstelle eine Transformation, die SAP-Kostenstellen auf FiPlan-Positionen mappt&quot;
        </span>
      </KiBruecke>

      <MeilensteinList items={phases[2].meilensteine} />
    </div>
  );
}

function Phase4Content() {
  return (
    <div>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 20 }}>
        KI-gest\u00fctzte Analyse und Anomalie-Erkennung direkt in der Datenpipeline.
      </p>

      <div style={{ ...monoLabel, marginBottom: 12 }}>Integration: Claude API in Fabric Notebook</div>

      <CodeBlock>{`import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{
        "role": "user",
        "content": f"""Analysiere diese Kostenabweichungen
und erkläre mögliche Ursachen:
{abweichungen_text}"""
    }]
)`}</CodeBlock>

      {/* Integration Points */}
      <div style={{ marginTop: 20 }}>
        <div style={{ ...monoLabel, marginBottom: 12 }}>Integrationspunkte</div>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            {
              title: "Anomalie-Erkennung auf Buchungsdaten",
              desc: "Claude API im Fabric Notebook analysiert Buchungsmuster und identifiziert ungew\u00f6hnliche Abweichungen in Echtzeit.",
            },
            {
              title: "Copilot in Power BI",
              desc: "Nat\u00fcrliche Sprache \u2192 DAX: Fachanwender stellen Fragen, KI generiert die passenden Measures und Visualisierungen.",
            },
            {
              title: "KI-gest\u00fctzte Datenqualit\u00e4tspr\u00fcfung",
              desc: "Automatische Erkennung von Dubletten, fehlenden Belegen und inkonsistenten Buchungss\u00e4tzen vor dem Reporting.",
            },
          ].map((item, i) => (
            <div key={i} style={{ ...card }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#222", marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <KiBruecke>
        Claude als Controlling-Assistent: Automatische Kommentierung von Abweichungen, Erstellung von
        Management-Summaries und Handlungsempfehlungen auf Basis der Finanzdaten.
      </KiBruecke>

      <MeilensteinList items={phases[3].meilensteine} />
    </div>
  );
}

// --- Main Component ---

export default function Lernpfad() {
  const [expanded, setExpanded] = useState({ 0: true, 1: false, 2: false, 3: false });

  const toggle = (i) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));

  const phaseContent = [
    <Phase1Content key={0} />,
    <Phase2Content key={1} />,
    <Phase3Content key={2} />,
    <Phase4Content key={3} />,
  ];

  return (
    <section id="lernpfad" style={{ padding: "120px 32px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Section Header */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: "#008c46",
        marginBottom: 12,
      }}>
        07 \u2014 Lernpfad
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 300, color: "#111", marginBottom: 16, lineHeight: 1.3 }}>
        <span style={{ fontWeight: 700 }}>Roadmap</span>
      </h2>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 8, maxWidth: 600 }}>
        Vom SQL-Know-how zu Microsoft Fabric &amp; KI-Integration.
      </p>
      <p style={{ fontSize: 14, color: "#999", marginBottom: 48, maxWidth: 600 }}>
        Strukturierter Lernplan mit Meilensteinen, Live-Beispielen und Nachweis.
      </p>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 }}>
        {kpiCards.map((kpi, i) => (
          <div key={i} style={{ ...card, textAlign: "center", padding: "20px 16px" }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 24,
              fontWeight: 700,
              color: "#111",
              marginBottom: 6,
            }}>
              {kpi.value}
            </div>
            <div style={monoLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: 40 }}>
        {/* Vertical line */}
        <div style={{
          position: "absolute",
          left: 15,
          top: 0,
          bottom: 0,
          width: 1,
          background: "#e0e0e0",
        }} />

        {phases.map((phase, i) => {
          const st = STATUS[phase.status];
          const isExpanded = expanded[i];
          const isActive = phase.status === "aktiv";
          const isDone = phase.status === "erledigt";

          return (
            <div key={i} style={{ marginBottom: 24, position: "relative" }}>
              {/* Timeline circle */}
              <div style={{
                position: "absolute",
                left: -31,
                top: 20,
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: isDone ? "#008c46" : isActive ? "#fff" : "#fff",
                border: isDone ? "none" : isActive ? "3px solid #008c46" : "2px solid #ccc",
                zIndex: 2,
                boxShadow: isActive ? "0 0 0 4px rgba(0,140,70,0.12)" : "none",
              }} />

              {/* Phase Card */}
              <div style={{
                border: isActive ? "1px solid rgba(0,140,70,0.25)" : "1px solid #eee",
                background: "#fff",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}>
                {/* Header */}
                <div
                  onClick={() => toggle(i)}
                  style={{
                    padding: "16px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      color: isActive ? "#008c46" : "#ccc",
                      minWidth: 28,
                    }}>
                      {String(phase.nr).padStart(2, "0")}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: "#222" }}>
                        {phase.title}
                      </div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#aaa", marginTop: 2 }}>
                        {phase.weeks}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      color: st.color,
                      background: st.bg,
                      padding: "4px 10px",
                      fontWeight: 600,
                    }}>
                      {st.label}
                    </span>
                    <span style={{
                      fontSize: 16,
                      color: "#ccc",
                      transition: "transform 0.3s ease",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      display: "inline-block",
                    }}>
                      \u25BC
                    </span>
                  </div>
                </div>

                {/* Content */}
                {isExpanded && (
                  <div style={{
                    padding: "0 24px 24px",
                    borderTop: "1px solid #f0f0f0",
                    paddingTop: 20,
                  }}>
                    {phaseContent[i]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
