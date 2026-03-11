import { useState } from "react";

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

/* ── syntax-highlight helpers ── */

function highlightSQL(sql) {
  const lines = sql.split("\n");
  let key = 0;
  return lines.map((line, li) => {
    const parts = [];
    let commentIdx = line.indexOf("--");
    let code = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    let comment = commentIdx >= 0 ? line.slice(commentIdx) : "";
    let cursor = 0;
    const regex = /('[^']*')|(\b\d+\.?\d*\b)|(\b(?:SELECT|FROM|WHERE|JOIN|LEFT JOIN|INNER JOIN|CROSS JOIN|ON|GROUP BY|ORDER BY|HAVING|AS|AND|OR|SUM|AVG|COUNT|ROUND|COALESCE|CASE|WHEN|THEN|ELSE|END|DESC|ASC|LIMIT|BETWEEN|IN|IS|NOT|NULL|DISTINCT|UNION|WITH|OVER|PARTITION BY|ROW_NUMBER|LAG|LEAD|EXTRACT|NULLIF|LATERAL|RECURSIVE|MATERIALIZED|FILTER|RANK|DENSE_RANK|NTILE|CTE|PERCENT_RANK|CUME_DIST)\b)/gi;
    let m;
    while ((m = regex.exec(code)) !== null) {
      if (m.index > cursor) {
        parts.push(<span key={`${li}-${key++}`}>{code.slice(cursor, m.index)}</span>);
      }
      if (m[1]) {
        parts.push(<span key={`${li}-${key++}`} style={{ color: "#cc7700" }}>{m[1]}</span>);
      } else if (m[2]) {
        parts.push(<span key={`${li}-${key++}`} style={{ color: "#0066cc" }}>{m[2]}</span>);
      } else if (m[3]) {
        parts.push(<span key={`${li}-${key++}`} style={{ color: "#008c46", fontWeight: 600 }}>{m[3].toUpperCase()}</span>);
      }
      cursor = m.index + m[0].length;
    }
    if (cursor < code.length) {
      parts.push(<span key={`${li}-${key++}`}>{code.slice(cursor)}</span>);
    }
    if (comment) {
      parts.push(<span key={`${li}-${key++}`} style={{ color: "#666" }}>{comment}</span>);
    }
    if (li < lines.length - 1) parts.push("\n");
    return parts;
  });
}

function highlightDAX(dax) {
  const lines = dax.split("\n");
  let key = 0;
  return lines.map((line, li) => {
    const parts = [];
    const regex = /(\b(?:CALCULATE|SUMX|FILTER|ALL|ALLEXCEPT|ALLSELECTED|VALUES|DIVIDE|TOTALYTD|TOTALQTD|TOTALMTD|SELECTEDVALUE|RELATED|RELATEDTABLE|AVERAGEX|MAXX|MINX|COUNTROWS|HASONEVALUE|IF|BLANK|ISBLANK|SWITCH|TRUE|FALSE|VAR|RETURN|ADDCOLUMNS|SUMMARIZE|SUMMARIZECOLUMNS|TOPN|RANKX|DATESYTD|PREVIOUSYEAR|PREVIOUSQUARTER|SAMEPERIODLASTYEAR|DATESINPERIOD|PARALLELPERIOD|FORMAT|CONCATENATEX|DISTINCTCOUNT|KEEPFILTERS|USERELATIONSHIP|CROSSFILTER|TREATAS|DATATABLE|GENERATE|GENERATEALL|UNION|INTERSECT|EXCEPT|NATURALLEFTOUTERJOIN|LOOKUPVALUE|EARLIER|EARLIEST|ISINSCOPE|SELECTEDMEASURE|FIRSTDATE|LASTDATE|MAX|MIN|SUM|AVERAGE|COUNT|COUNTA)\b)|(\b\d+\.?\d*\b)|('[^']*'\[?[^\]]*\]?|\[[^\]]+\])/g;
    let cursor = 0;
    let m;
    let commentIdx = line.indexOf("//");
    let code = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    let comment = commentIdx >= 0 ? line.slice(commentIdx) : "";
    while ((m = regex.exec(code)) !== null) {
      if (m.index > cursor) {
        parts.push(<span key={`${li}-${key++}`}>{code.slice(cursor, m.index)}</span>);
      }
      if (m[1]) {
        parts.push(<span key={`${li}-${key++}`} style={{ color: "#008c46", fontWeight: 600 }}>{m[1]}</span>);
      } else if (m[2]) {
        parts.push(<span key={`${li}-${key++}`} style={{ color: "#0066cc" }}>{m[2]}</span>);
      } else if (m[3]) {
        parts.push(<span key={`${li}-${key++}`} style={{ color: "#cc7700" }}>{m[3]}</span>);
      }
      cursor = m.index + m[0].length;
    }
    if (cursor < code.length) {
      parts.push(<span key={`${li}-${key++}`}>{code.slice(cursor)}</span>);
    }
    if (comment) {
      parts.push(<span key={`${li}-${key++}`} style={{ color: "#666" }}>{comment}</span>);
    }
    if (li < lines.length - 1) parts.push("\n");
    return parts;
  });
}

/* ── preset query map — realistic SAP CO / Controlling queries ── */

const PRESETS = {
  "Kostenstellenbericht mit Abweichungsanalyse Q1": {
    sql: `-- Kostenstellenbericht: Plan/Ist/Abweichung mit Vorjahresvergleich
WITH cte_kosten AS (
    SELECT
        ks.kostenstelle_nr,
        ks.bezeichnung,
        ks.bereichsleiter,
        ka.kostenartgruppe,
        SUM(CASE WHEN b.werttyp = 'IST' THEN b.betrag ELSE 0 END) AS ist,
        SUM(CASE WHEN b.werttyp = 'PLAN' THEN b.betrag ELSE 0 END) AS plan,
        SUM(CASE WHEN b.werttyp = 'IST'
            AND b.geschaeftsjahr = EXTRACT(YEAR FROM CURRENT_DATE) - 1
            THEN b.betrag ELSE 0 END) AS ist_vj
    FROM co_buchungen b
    JOIN dim_kostenstelle ks ON b.kostenstelle_id = ks.id
    JOIN dim_kostenart ka ON b.kostenart_id = ka.id
    WHERE b.geschaeftsjahr = EXTRACT(YEAR FROM CURRENT_DATE)
        AND b.periode BETWEEN 1 AND 3
    GROUP BY ks.kostenstelle_nr, ks.bezeichnung,
             ks.bereichsleiter, ka.kostenartgruppe
)
SELECT
    kostenstelle_nr,
    bezeichnung,
    kostenartgruppe,
    ist,
    plan,
    ist - plan AS abweichung_abs,
    ROUND((ist - plan) / NULLIF(plan, 0) * 100, 1) AS abw_pct,
    ist_vj,
    ROUND((ist - ist_vj) / NULLIF(ist_vj, 0) * 100, 1) AS yoy_pct
FROM cte_kosten
WHERE ABS(ist - plan) > 5000
ORDER BY ABS(ist - plan) DESC`,
    dax: `// Measure: Kostenstellenbericht mit Abweichung
Ist Kosten =
CALCULATE(
    SUM('CO_Buchungen'[Betrag]),
    'CO_Buchungen'[Werttyp] = "IST"
)

Plan Kosten =
CALCULATE(
    SUM('CO_Buchungen'[Betrag]),
    'CO_Buchungen'[Werttyp] = "PLAN"
)

Abweichung % =
VAR _Ist = [Ist Kosten]
VAR _Plan = [Plan Kosten]
RETURN
    DIVIDE(_Ist - _Plan, _Plan, 0) * 100

// Vorjahresvergleich mit Time Intelligence
Ist Kosten VJ =
CALCULATE(
    [Ist Kosten],
    SAMEPERIODLASTYEAR('Kalender'[Datum])
)

YoY Veränderung % =
DIVIDE(
    [Ist Kosten] - [Ist Kosten VJ],
    [Ist Kosten VJ], 0
) * 100`,
    explanation: "Vollständiger Kostenstellenbericht mit CTE für Plan/Ist-Vergleich und Vorjahresvergleich. Filter auf wesentliche Abweichungen >€5.000. Das DAX-Pendant nutzt Time Intelligence (SAMEPERIODLASTYEAR) für den YoY-Vergleich — setzt eine korrekte Kalender-Beziehung im Datenmodell voraus.",
    tables: "co_buchungen (Fakt), dim_kostenstelle, dim_kostenart, Kalender (Datum-Dimension)",
    model: "Star Schema: Faktentabelle CO_Buchungen mit Fremdschlüsseln zu Dimensionen Kostenstelle, Kostenart, Kalender, Werttyp (Plan/Ist/Obligo)",
    complexity: "Mittel",
  },
  "Deckungsbeitragsrechnung mehrstufig nach Profit Center": {
    sql: `-- Mehrstufige DB-Rechnung nach Profit Center (CO-PA)
SELECT
    pc.profit_center,
    pc.bezeichnung,
    pc.segment,
    SUM(u.nettoumsatz) AS umsatz,
    SUM(u.erloesschmaelerung) AS erloesschm,
    SUM(u.nettoumsatz) - SUM(u.erloesschmaelerung) AS nettoumsatz_ii,
    SUM(u.materialeinzelkosten) AS mek,
    SUM(u.fertigungseinzelkosten) AS fek,
    SUM(u.sondereinzelkosten_fert) AS sefk,
    -- DB I
    SUM(u.nettoumsatz) - SUM(u.erloesschmaelerung)
        - SUM(u.materialeinzelkosten)
        - SUM(u.fertigungseinzelkosten)
        - SUM(u.sondereinzelkosten_fert) AS db_1,
    -- DB I Marge
    ROUND(
        (SUM(u.nettoumsatz) - SUM(u.erloesschmaelerung)
         - SUM(u.materialeinzelkosten)
         - SUM(u.fertigungseinzelkosten)
         - SUM(u.sondereinzelkosten_fert))
        / NULLIF(SUM(u.nettoumsatz), 0) * 100, 1
    ) AS db1_marge,
    -- Fixkosten-Deckung
    SUM(u.fixkosten_fertigung) AS fix_fert,
    SUM(u.fixkosten_vertrieb) AS fix_vt,
    SUM(u.fixkosten_verwaltung) AS fix_vw
FROM ergebnis_marktsegment u  -- CO-PA Daten
JOIN dim_profit_center pc ON u.profit_center_id = pc.id
WHERE u.geschaeftsjahr = 2024
GROUP BY pc.profit_center, pc.bezeichnung, pc.segment
ORDER BY db_1 DESC`,
    dax: `// Mehrstufige Deckungsbeitragsrechnung
DB I =
SUMX(
    'Ergebnis_Marktsegment',
    'Ergebnis_Marktsegment'[Nettoumsatz]
    - 'Ergebnis_Marktsegment'[Erloesschmaelerung]
    - 'Ergebnis_Marktsegment'[MEK]
    - 'Ergebnis_Marktsegment'[FEK]
    - 'Ergebnis_Marktsegment'[SEFK]
)

DB I Marge =
DIVIDE([DB I], SUM('Ergebnis_Marktsegment'[Nettoumsatz]), 0)

// DB II = DB I - zurechenbare Fixkosten Fertigung
DB II =
[DB I] - SUM('Ergebnis_Marktsegment'[Fixkosten_Fertigung])

// DB III = DB II - zurechenbare Fixkosten Vertrieb
DB III =
[DB II] - SUM('Ergebnis_Marktsegment'[Fixkosten_Vertrieb])

// Betriebsergebnis = DB III - Verwaltungsfixkosten
Betriebsergebnis =
[DB III] - SUM('Ergebnis_Marktsegment'[Fixkosten_Verwaltung])`,
    explanation: "Mehrstufige Deckungsbeitragsrechnung nach dem Schema der Ergebnis- und Marktsegmentrechnung (CO-PA in SAP). Unterscheidet zwischen variablen Kosten (MEK, FEK, SEFK) und verschiedenen Fixkostenstufen. Die DB I-Marge zeigt die Profitabilität vor Fixkostendeckung — entscheidend für Make-or-Buy und Sortimentsentscheidungen.",
    tables: "Ergebnis_Marktsegment (CO-PA), dim_Profit_Center, dim_Produkt, dim_Kunde",
    model: "CO-PA Schema: Ergebnistabelle mit Wertfeldern (Umsatz, MEK, FEK, etc.) und Merkmalen (Profit Center, Produkt, Kunde, Region)",
    complexity: "Komplex",
  },
  "Forecast Hochrechnung mit saisonaler Gewichtung": {
    sql: `-- Forecast: Gewichtete Hochrechnung mit saisonalen Faktoren
WITH monatsdaten AS (
    SELECT
        ks.kostenstelle_nr,
        ks.bezeichnung,
        b.periode,
        SUM(b.betrag) AS ist_monat,
        sf.saisonfaktor  -- z.B. Jan=0.08, Feb=0.07, Dez=0.12
    FROM co_buchungen b
    JOIN dim_kostenstelle ks ON b.kostenstelle_id = ks.id
    JOIN saisonfaktoren sf ON sf.periode = b.periode
        AND sf.kostenartgruppe = 'GESAMT'
    WHERE b.geschaeftsjahr = 2024
        AND b.werttyp = 'IST'
    GROUP BY ks.kostenstelle_nr, ks.bezeichnung,
             b.periode, sf.saisonfaktor
),
forecast AS (
    SELECT
        kostenstelle_nr,
        bezeichnung,
        SUM(ist_monat) AS ist_ytd,
        COUNT(DISTINCT periode) AS ist_monate,
        -- Gewichtete Hochrechnung
        SUM(ist_monat) / NULLIF(SUM(saisonfaktor), 0) AS forecast_jahr,
        -- Lineare Hochrechnung zum Vergleich
        SUM(ist_monat) / NULLIF(COUNT(DISTINCT periode), 0) * 12
            AS forecast_linear
    FROM monatsdaten
    GROUP BY kostenstelle_nr, bezeichnung
)
SELECT
    kostenstelle_nr,
    bezeichnung,
    ist_ytd,
    ROUND(forecast_jahr, 0) AS fc_saisonal,
    ROUND(forecast_linear, 0) AS fc_linear,
    ROUND(forecast_jahr - forecast_linear, 0) AS delta_methode,
    ROUND(
        (forecast_jahr - forecast_linear)
        / NULLIF(forecast_linear, 0) * 100, 1
    ) AS delta_pct
FROM forecast
ORDER BY forecast_jahr DESC`,
    dax: `// Saisonale Forecast-Hochrechnung
// Saisonfaktoren als separate Tabelle im Modell

Ist YTD =
TOTALYTD(
    SUM('CO_Buchungen'[Betrag]),
    'Kalender'[Datum],
    'CO_Buchungen'[Werttyp] = "IST"
)

// Kumulierter Saisonfaktor (wie viel % des Jahres ist verbucht)
Saison Kumuliert =
CALCULATE(
    SUM('Saisonfaktoren'[Faktor]),
    FILTER(
        'Saisonfaktoren',
        'Saisonfaktoren'[Periode] <= MAX('Kalender'[MonatNr])
    )
)

// Saisonaler Forecast
Forecast Saisonal =
DIVIDE([Ist YTD], [Saison Kumuliert], 0)

// Vergleich: Linearer Forecast
Forecast Linear =
VAR _Monate = DISTINCTCOUNT('Kalender'[MonatNr])
RETURN
    DIVIDE([Ist YTD], _Monate, 0) * 12

// Delta: Saisonal vs Linear
Forecast Delta % =
DIVIDE(
    [Forecast Saisonal] - [Forecast Linear],
    [Forecast Linear], 0
) * 100`,
    explanation: "Saisonale Forecast-Hochrechnung: Statt linearer Extrapolation (Ist/Monate × 12) berücksichtigt diese Methode saisonale Gewichtungsfaktoren. Beispiel: Wenn Q1 historisch nur 23% des Jahresumsatzes ausmacht (statt 25% bei linearer Verteilung), wird der Forecast entsprechend korrigiert. Die Differenz zwischen den Methoden zeigt die Saisonalität der Kostenstelle.",
    tables: "co_buchungen, dim_kostenstelle, Kalender, Saisonfaktoren (historisch berechnet)",
    model: "Erweitertes Star Schema mit Saisonfaktoren-Tabelle. Faktoren aus 3-Jahres-Durchschnitt der historischen Monatsverteilung berechnet.",
    complexity: "Komplex",
  },
  "Working Capital Analyse nach Geschäftsbereich": {
    sql: `-- Working Capital: Forderungen, Vorräte, Verbindlichkeiten
SELECT
    gb.geschaeftsbereich,
    -- Forderungen aus LuL
    SUM(CASE WHEN k.kontenklasse = 'FORD_LUL'
        THEN s.saldo ELSE 0 END) AS forderungen,
    -- DSO (Days Sales Outstanding)
    ROUND(
        SUM(CASE WHEN k.kontenklasse = 'FORD_LUL'
            THEN s.saldo ELSE 0 END)
        / NULLIF(u.umsatz_12m / 365, 0), 1
    ) AS dso,
    -- Vorräte
    SUM(CASE WHEN k.kontenklasse = 'VORRAETE'
        THEN s.saldo ELSE 0 END) AS vorraete,
    -- DIO (Days Inventory Outstanding)
    ROUND(
        SUM(CASE WHEN k.kontenklasse = 'VORRAETE'
            THEN s.saldo ELSE 0 END)
        / NULLIF(u.hk_12m / 365, 0), 1
    ) AS dio,
    -- Verbindlichkeiten aus LuL
    SUM(CASE WHEN k.kontenklasse = 'VERB_LUL'
        THEN s.saldo ELSE 0 END) AS verbindlichkeiten,
    -- DPO (Days Payable Outstanding)
    ROUND(
        SUM(CASE WHEN k.kontenklasse = 'VERB_LUL'
            THEN s.saldo ELSE 0 END)
        / NULLIF(u.materialaufwand_12m / 365, 0), 1
    ) AS dpo,
    -- Cash Conversion Cycle
    ROUND(
        SUM(CASE WHEN k.kontenklasse = 'FORD_LUL'
            THEN s.saldo ELSE 0 END)
        / NULLIF(u.umsatz_12m / 365, 0)
        + SUM(CASE WHEN k.kontenklasse = 'VORRAETE'
            THEN s.saldo ELSE 0 END)
        / NULLIF(u.hk_12m / 365, 0)
        - SUM(CASE WHEN k.kontenklasse = 'VERB_LUL'
            THEN s.saldo ELSE 0 END)
        / NULLIF(u.materialaufwand_12m / 365, 0)
    , 1) AS ccc_tage
FROM sachkonten_salden s
JOIN dim_konto k ON s.konto_id = k.id
JOIN dim_geschaeftsbereich gb ON s.gb_id = gb.id
CROSS JOIN umsatz_rolling u
WHERE s.stichtag = CURRENT_DATE
GROUP BY gb.geschaeftsbereich, u.umsatz_12m,
         u.hk_12m, u.materialaufwand_12m
ORDER BY ccc_tage DESC`,
    dax: `// Working Capital Analyse
Forderungen =
CALCULATE(
    SUM('Salden'[Saldo]),
    'Konten'[Kontenklasse] = "FORD_LUL"
)

DSO =
DIVIDE(
    [Forderungen],
    DIVIDE([Umsatz Rolling 12M], 365),
    0
)

Vorräte =
CALCULATE(
    SUM('Salden'[Saldo]),
    'Konten'[Kontenklasse] = "VORRAETE"
)

DIO =
DIVIDE(
    [Vorräte],
    DIVIDE([HK Rolling 12M], 365),
    0
)

Verbindlichkeiten LuL =
CALCULATE(
    SUM('Salden'[Saldo]),
    'Konten'[Kontenklasse] = "VERB_LUL"
)

DPO =
DIVIDE(
    [Verbindlichkeiten LuL],
    DIVIDE([Materialaufwand Rolling 12M], 365),
    0
)

// Cash Conversion Cycle
CCC = [DSO] + [DIO] - [DPO]`,
    explanation: "Working-Capital-Analyse mit Cash Conversion Cycle (CCC = DSO + DIO - DPO). Berechnet die Kapitalbindungsdauer je Geschäftsbereich auf Basis der Rolling-12-Months-Werte. Ein hoher CCC bindet Liquidität — Ziel ist die Minimierung durch Forderungsmanagement, Bestandsoptimierung und Zahlungsziel-Verhandlungen.",
    tables: "Sachkonten_Salden, dim_Konto (Kontenklasse), dim_Geschaeftsbereich, Umsatz_Rolling (Rolling 12M aggregiert)",
    model: "FI-Datenmodell: Sachkontensalden mit Kontenklassen-Mapping. Rolling-Werte als semi-additive Measures (LastNonEmpty/LastDate).",
    complexity: "Komplex",
  },
  "Gemeinkostencontrolling mit Umlageverfahren": {
    sql: `-- Innerbetriebliche Leistungsverrechnung (ILV)
-- Stufenleiterverfahren: Hilfskostenstellen → Hauptkostenstellen
WITH umlage AS (
    SELECT
        hks.kostenstelle_nr AS hilfs_kst,
        hks.bezeichnung AS hilfs_bez,
        SUM(b.betrag) AS primaerkosten,
        zks.kostenstelle_nr AS empf_kst,
        zks.bezeichnung AS empf_bez,
        uv.verteilschluessel,  -- qm, MA-Anzahl, kWh, Stück
        uv.anteil_pct
    FROM co_buchungen b
    JOIN dim_kostenstelle hks ON b.kostenstelle_id = hks.id
    JOIN umlage_verteilung uv ON hks.id = uv.hilfs_kst_id
    JOIN dim_kostenstelle zks ON uv.empf_kst_id = zks.id
    WHERE hks.kst_typ = 'HILFS'
        AND b.geschaeftsjahr = 2024
        AND b.periode BETWEEN 1 AND 3
    GROUP BY hks.kostenstelle_nr, hks.bezeichnung,
             zks.kostenstelle_nr, zks.bezeichnung,
             uv.verteilschluessel, uv.anteil_pct
)
SELECT
    hilfs_kst,
    hilfs_bez,
    empf_kst,
    empf_bez,
    verteilschluessel,
    anteil_pct,
    ROUND(primaerkosten * anteil_pct / 100, 2) AS umlage_betrag
FROM umlage
ORDER BY hilfs_kst, anteil_pct DESC`,
    dax: `// Gemeinkostenumlage: Sekundärkostenverrechnung
// Hilfs-KSt → Haupt-KSt nach Verteilschlüssel

Primärkosten Hilfs-KSt =
CALCULATE(
    SUM('CO_Buchungen'[Betrag]),
    'Kostenstellen'[KSt_Typ] = "HILFS",
    'CO_Buchungen'[Werttyp] = "IST"
)

Umlagebetrag =
SUMX(
    FILTER(
        'Umlage_Verteilung',
        'Umlage_Verteilung'[Hilfs_KSt] =
            SELECTEDVALUE('Kostenstellen'[KSt_Nr])
    ),
    [Primärkosten Hilfs-KSt]
        * 'Umlage_Verteilung'[Anteil_Pct] / 100
)

// GK-Zuschlagssatz Fertigung
GK-Zuschlag Fertigung % =
DIVIDE(
    CALCULATE(
        SUM('CO_Buchungen'[Betrag]),
        'Kostenarten'[Gruppe] = "FGK"
    ),
    CALCULATE(
        SUM('CO_Buchungen'[Betrag]),
        'Kostenarten'[Gruppe] = "FEK"
    ),
    0
) * 100`,
    explanation: "Innerbetriebliche Leistungsverrechnung im Stufenleiterverfahren. Hilfskostenstellen (IT, Facility, Kantine, Energie) werden nach definierten Verteilschlüsseln (m², MA-Anzahl, kWh, Maschinenstunden) auf Hauptkostenstellen umgelegt. Grundlage für korrekte Gemeinkostenzuschlagssätze in der Kalkulation. In SAP CO: Transaktion KSV5 / KSU5.",
    tables: "co_buchungen, dim_kostenstelle (mit KSt_Typ: HILFS/HAUPT), Umlage_Verteilung, dim_kostenart",
    model: "CO-OM Schema: Kostenstellen-Hierarchie mit Hilfs/Haupt-Unterscheidung. Umlage-Verteilung als Mapping-Tabelle mit Schlüsseln und Anteilen.",
    complexity: "Komplex",
  },
  "Investitionscontrolling: ROI und Amortisation": {
    sql: `-- Investitionscontrolling: Budgetstatus, ROI, Amortisation
SELECT
    inv.invest_nr,
    inv.bezeichnung,
    inv.kategorie,          -- Erweiterung, Ersatz, Rationalisierung
    inv.genehmigt_datum,
    inv.budget,
    SUM(b.betrag) AS ist_kosten,
    ROUND(SUM(b.betrag) / NULLIF(inv.budget, 0) * 100, 1)
        AS budget_auslastung,
    inv.erwarteter_cashflow_pa,
    -- Statischer ROI
    ROUND(
        inv.erwarteter_cashflow_pa
        / NULLIF(inv.budget, 0) * 100, 1
    ) AS roi_statisch,
    -- Amortisationsdauer (statisch)
    ROUND(
        inv.budget / NULLIF(inv.erwarteter_cashflow_pa, 0), 1
    ) AS amortisation_jahre,
    -- Status-Ampel
    CASE
        WHEN SUM(b.betrag) > inv.budget * 1.1 THEN 'ROT'
        WHEN SUM(b.betrag) > inv.budget * 0.9 THEN 'GELB'
        ELSE 'GRUEN'
    END AS ampel
FROM investitionen inv
LEFT JOIN invest_buchungen b ON inv.id = b.invest_id
WHERE inv.geschaeftsjahr >= 2023
    AND inv.status = 'AKTIV'
GROUP BY inv.invest_nr, inv.bezeichnung, inv.kategorie,
         inv.genehmigt_datum, inv.budget,
         inv.erwarteter_cashflow_pa
ORDER BY budget_auslastung DESC`,
    dax: `// Investitions-Tracking
Budget Auslastung % =
DIVIDE(
    CALCULATE(SUM('Invest_Buchungen'[Betrag])),
    SELECTEDVALUE('Investitionen'[Budget]),
    0
) * 100

// Statischer ROI
ROI % =
DIVIDE(
    SELECTEDVALUE('Investitionen'[Cashflow_pa]),
    SELECTEDVALUE('Investitionen'[Budget]),
    0
) * 100

// Amortisationsdauer
Payback Jahre =
DIVIDE(
    SELECTEDVALUE('Investitionen'[Budget]),
    SELECTEDVALUE('Investitionen'[Cashflow_pa]),
    0
)

// Ampel (für bedingte Formatierung)
Invest Ampel =
VAR _Auslastung = [Budget Auslastung %]
RETURN
    SWITCH(
        TRUE(),
        _Auslastung > 110, "ROT",
        _Auslastung > 90, "GELB",
        "GRUEN"
    )`,
    explanation: "Investitionscontrolling mit Budget-Tracking, statischem ROI und Amortisationsdauer. Die Ampellogik warnt bei >90% Budgetausschöpfung (Gelb) und >110% (Rot). In der Praxis ergänzt durch dynamische Verfahren (NPV, IRR) und Post-Investment-Reviews nach 12 Monaten Nutzung.",
    tables: "Investitionen (Stammdaten), Invest_Buchungen (Ist-Kosten), Kalender",
    model: "Investitions-Datenmodell: Stammdaten mit Budget, geplantem Cashflow, Kategorie. Buchungen als Faktentabelle mit Periodenbezug.",
    complexity: "Mittel",
  },
};

const PRESET_KEYS = Object.keys(PRESETS);

const COMPLEXITY_COLORS = {
  Einfach: "#008c46",
  Mittel: "#cc7700",
  Komplex: "#cc3333",
};

/* ── component ── */

export default function ControllerGPT() {
  const [currentQuery, setCurrentQuery] = useState("");
  const [activeResult, setActiveResult] = useState(null);

  function handleSubmit() {
    const trimmed = currentQuery.trim();
    if (!trimmed) return;
    const match = PRESET_KEYS.find(
      (k) => k === trimmed || k.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      setActiveResult({ query: match, ...PRESETS[match] });
    } else {
      const words = trimmed.toLowerCase().split(/\s+/);
      const found = PRESET_KEYS.find((k) => {
        const kw = k.toLowerCase();
        return words.filter((w) => w.length > 3 && kw.includes(w)).length >= 1;
      });
      if (found) {
        setActiveResult({ query: found, ...PRESETS[found] });
      } else {
        const first = PRESET_KEYS[0];
        setActiveResult({ query: first, ...PRESETS[first] });
      }
    }
  }

  function selectPreset(key) {
    setCurrentQuery(key);
    setActiveResult({ query: key, ...PRESETS[key] });
  }

  return (
    <section
      id="controllergpt"
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "120px 32px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ ...monoLabel, letterSpacing: "0.3em", color: "#008c46", marginBottom: 12 }}>
        11 — Controller-GPT
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px", color: "#111", lineHeight: 1.3 }}>
        Controlling-Fragen → <span style={{ fontWeight: 700 }}>SQL + DAX</span>
      </h2>
      <p style={{ color: "#999", fontSize: 14, lineHeight: 1.6, maxWidth: 750, marginBottom: 12 }}>
        Natürlichsprachliche Controlling-Anfragen in ausführbare SQL-Queries (PostgreSQL) und
        Power BI DAX-Measures übersetzen. Datenmodell: Star Schema mit SAP CO-naher Struktur
        (Kostenstellen, Kostenarten, Profit Center, Ergebnis-Marktsegmente).
      </p>
      <p style={{ fontSize: 12, color: "#bbb", marginBottom: 40, fontFamily: "'Space Mono', monospace" }}>
        Queries: CTE, Window Functions, Time Intelligence | DAX: CALCULATE, SUMMARIZECOLUMNS, Semi-additive
      </p>

      {/* ── Brücke diagram ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          marginBottom: 48,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Controlling-Frage", sub: "Natürliche Sprache", bg: "#f7f7f7", color: "#333" },
          null,
          { label: "Claude API", sub: "Kontext: Kontenrahmen, KSt-Struktur, CO-PA", bg: "#1a1a2e", color: "#a8b2d1" },
          null,
          { label: "SQL", sub: "PostgreSQL / SAP HANA", bg: "#008c46", color: "#fff" },
          { label: "\u2194", sub: "", bg: "transparent", color: "#999", isArrowOnly: true },
          { label: "DAX", sub: "Power BI / SSAS", bg: "#cc7700", color: "#fff" },
        ].map((item, i) =>
          item === null ? (
            <div
              key={i}
              style={{
                width: 40,
                height: 2,
                background: "#ccc",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: -4,
                  top: -4,
                  fontSize: 10,
                  color: "#999",
                }}
              >
                →
              </div>
            </div>
          ) : item.isArrowOnly ? (
            <div
              key={i}
              style={{
                fontSize: 18,
                color: item.color,
                padding: "0 4px",
                fontWeight: 300,
              }}
            >
              {item.label}
            </div>
          ) : (
            <div
              key={i}
              style={{
                background: item.bg,
                color: item.color,
                padding: "12px 16px",
                textAlign: "center",
                minWidth: 100,
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {item.label}
              </div>
              {item.sub && (
                <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{item.sub}</div>
              )}
            </div>
          )
        )}
      </div>

      {/* ── Input area ── */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ ...monoLabel, marginBottom: 8 }}>Controlling-Frage eingeben</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="z.B. Zeige die Abweichungsanalyse für alle Kostenstellen Q1"
            style={{
              flex: 1,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              padding: "12px 16px",
              border: "1px solid #ddd",
              background: "#fafafa",
              outline: "none",
              borderRadius: 0,
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "#1a1a2e",
              color: "#fff",
              border: "none",
              padding: "12px 20px",
              cursor: "pointer",
              borderRadius: 0,
            }}
          >
            Übersetzen
          </button>
        </div>
      </div>

      {/* ── Preset buttons ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 48,
        }}
      >
        {PRESET_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => selectPreset(key)}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: activeResult && activeResult.query === key ? "#fff" : "#555",
              background:
                activeResult && activeResult.query === key ? "#1a1a2e" : "#f5f5f5",
              border: "1px solid #eee",
              padding: "6px 12px",
              cursor: "pointer",
              borderRadius: 0,
              transition: "all 0.15s",
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* ── Results ── */}
      {activeResult && (
        <div>
          {/* SQL + DAX side by side */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ ...monoLabel, marginBottom: 6 }}>SQL (PostgreSQL)</div>
              <div style={{ ...codeBlock, maxHeight: 400, overflowY: "auto" }}>{highlightSQL(activeResult.sql)}</div>
            </div>
            <div>
              <div style={{ ...monoLabel, marginBottom: 6 }}>DAX (Power BI)</div>
              <div style={{ ...codeBlock, maxHeight: 400, overflowY: "auto" }}>{highlightDAX(activeResult.dax)}</div>
            </div>
          </div>

          {/* Explanation + Datenmodell + Complexity */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div style={card}>
              <div style={{ ...monoLabel, marginBottom: 8 }}>Erklärung</div>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.6, margin: 0 }}>
                {activeResult.explanation}
              </p>
            </div>

            <div style={card}>
              <div style={{ ...monoLabel, marginBottom: 8 }}>Datenmodell</div>
              <p style={{ fontSize: 12, color: "#555", lineHeight: 1.5, margin: "0 0 8px" }}>
                <strong>Tabellen:</strong> {activeResult.tables}
              </p>
              <p style={{ fontSize: 11, color: "#888", lineHeight: 1.5, margin: "0 0 12px" }}>
                {activeResult.model}
              </p>
              <div style={{ ...monoLabel, marginBottom: 6 }}>Komplexität</div>
              <span
                style={{
                  display: "inline-block",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: "#fff",
                  background: COMPLEXITY_COLORS[activeResult.complexity] || "#999",
                  padding: "4px 12px",
                }}
              >
                {activeResult.complexity}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── KI-Brücke box ── */}
      <div
        style={{
          border: "1px solid #0066cc",
          borderLeft: "3px solid #0066cc",
          padding: "20px 24px",
          background: "rgba(0,102,204,0.03)",
          marginTop: 32,
        }}
      >
        <div style={{ ...monoLabel, color: "#0066cc", marginBottom: 10 }}>
          KI-Brücke — Domänenspezifisches Prompt Engineering
        </div>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
          <strong>Herausforderung:</strong> Generische LLMs erzeugen syntaktisch korrekte,
          aber fachlich falsche Queries (falsche Joins, fehlende Periodenabgrenzung, inkorrekte
          Aggregationsebenen). Controller-GPT löst dies durch:
          <br /><br />
          <strong>1. Datenmodell als System-Prompt:</strong> Das vollständige Star Schema
          (Tabellen, Spalten, Datentypen, Beziehungen) wird als Kontext übergeben. Das Modell
          kennt die Unterschiede zwischen CO-OM (Gemeinkosten), CO-PC (Produktkosten) und CO-PA
          (Ergebnisrechnung).
          <br /><br />
          <strong>2. Controlling-Fachlogik:</strong> Regeln wie "MEK ist variabel, FGK enthält
          fixe und variable Anteile", "Umlagen vor DB-Berechnung" oder "Semi-additive Measures
          für Bestandskennzahlen" sind als Few-Shot-Examples hinterlegt.
          <br /><br />
          <strong>3. Dual Output:</strong> SQL für ETL/Data Engineering, DAX für Self-Service BI.
          Der Controller wählt je nach Use Case — die Fachlogik bleibt identisch.
        </div>
      </div>
    </section>
  );
}
