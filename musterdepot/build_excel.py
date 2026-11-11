"""Erzeugt site/Musterdepot_Zapp.xlsx: dieselbe Logik wie depot.py, aber als
nachvollziehbare Excel-Formeln (Rohdaten -> Renditen -> Depot -> Kennzahlen).

Aufruf:  python build_excel.py --quelle simuliert   (oder csv)
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.comments import Comment
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as CL
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation

import depot

ROOT = Path(__file__).resolve().parent
ACC = "2E6B8A"
F = "Arial"
f_norm = Font(name=F, size=10)
f_in = Font(name=F, size=10, color="0000FF")          # Eingaben
f_link = Font(name=F, size=10, color="008000")        # Verweise auf andere Blaetter
f_bold = Font(name=F, size=10, bold=True)
f_head = Font(name=F, size=10, bold=True, color="FFFFFF")
f_title = Font(name=F, size=14, bold=True, color=ACC)
f_note = Font(name=F, size=9, italic=True, color="666666")
fill_head = PatternFill("solid", fgColor=ACC)
fill_key = PatternFill("solid", fgColor="FFFF00")
fill_sub = PatternFill("solid", fgColor="EEF3F6")
thin = Side(style="thin", color="D0D0D0")
PCT, PCT2, EUR, IDX = "0.0%", "0.00%", '#,##0 "€";-#,##0 "€";"-"', "0.00"
DATE = "MMM YYYY"


def head(ws, row, cols, start=1):
    for j, t in enumerate(cols):
        c = ws.cell(row=row, column=start + j, value=t)
        c.font, c.fill = f_head, fill_head
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)


def put(ws, ref, value, font=f_norm, fmt=None, bold=False):
    c = ws[ref]
    c.value = value
    c.font = f_bold if bold else font
    if fmt:
        c.number_format = fmt
    return c


def stil(chart, farben=("2E6B8A", "EB6834"), ymin=None, low_labels=False):
    """Einheitliche Diagrammoptik: gerade Linien, Achsen sichtbar, Jahresbeschriftung."""
    from openpyxl.chart.layout import Layout  # noqa: F401
    for i, s in enumerate(chart.series):
        s.smooth = False
        s.graphicalProperties.line.solidFill = farben[i % len(farben)]
        s.graphicalProperties.line.width = 19050
        if i == 1:
            s.graphicalProperties.line.dashStyle = "dash"
    chart.x_axis.delete = False
    chart.y_axis.delete = False
    chart.x_axis.tickLblSkip = 12
    chart.x_axis.tickMarkSkip = 12
    if ymin is not None:
        chart.y_axis.scaling.min = ymin
    if low_labels:
        chart.x_axis.tickLblPos = "low"


def title(ws, text, sub=None):
    put(ws, "A1", text, f_title)
    if sub:
        put(ws, "A2", sub, f_note)


def bauen(quelle: str, out: Path):
    cfg = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
    kurse = depot.simulierte_kurse(cfg) if quelle == "simuliert" else depot.csv_kurse(cfg)
    P = cfg["positionen"]
    n = len(P)
    T = len(kurse)
    R0 = 5                       # erste Datenzeile in allen Zeitreihen-Blaettern
    RL = R0 + T - 1              # letzte Datenzeile
    fen = 36
    RW = RL - fen + 1            # erste Zeile des VaR-/Kovarianzfensters

    wb = Workbook()
    wb.remove(wb.active)
    order = ["Info", "Übersicht", "Allokation", "Einzelanalyse", "Warnungen", "Stresstests",
             "Depot", "Renditen", "Kovarianz", "Kurse", "Parameter"]
    S = {name: wb.create_sheet(name) for name in order}
    for ws in S.values():
        ws.sheet_view.showGridLines = False

    # ------------------------------------------------------------------ Parameter
    ws = S["Parameter"]
    title(ws, "Parameter", "Blaue Werte sind Eingaben. Änderungen wirken auf alle Blätter.")
    params = [
        ("Startkapital", cfg["startkapital"], EUR, "Startkapital"),
        ("Zielquote Aktien", cfg["zielquote_aktien"], PCT, "Zielquote"),
        ("Toleranzband Aktienquote (± Pp.)", cfg["toleranzband_aktien_pp"] / 100, PCT, "Band"),
        ("Toleranz je Position (relativ)", cfg["toleranz_position_relativ"], PCT, "Toleranz"),
        ("Risikofreier Zins p. a.", cfg["risikofreier_zins_pa"], PCT, "Rf"),
        ("VaR-Konfidenz", cfg["warnregeln"]["var_konfidenz"], PCT, "Konfidenz"),
        ("Warnschwelle Drawdown", cfg["warnregeln"]["drawdown_schwelle"], PCT, "DDSchwelle"),
        ("Trendsignal: Monate gleitender Durchschnitt", cfg["warnregeln"]["trend_monate"], "0", "TrendMonate"),
    ]
    for i, (lab, val, fmt, name) in enumerate(params):
        r = 4 + i
        put(ws, f"A{r}", lab)
        put(ws, f"B{r}", val, f_in, fmt).fill = fill_key
        wb.defined_names[name] = DefinedName(name, attr_text=f"Parameter!$B${r}")
    put(ws, "C5", "Ziel für den Aktienanteil am Gesamtdepot", f_note)
    put(ws, "C11", "Annahme, marktüblich", f_note)
    PR0 = 15
    head(ws, PR0 - 1, ["ID", "Fonds (erfunden)", "Kennung", "Klasse", "Region", "Soll-Gewicht",
                       "Laufende Kosten p. a.", "Duration (Jahre)"])
    for i, p in enumerate(P):
        r = PR0 + i
        for j, (v, fmt) in enumerate([(p["id"], None), (p["name"], None), (p["kennung"], None), (p["klasse"], None),
                                      (p["region"], None), (p["soll"], PCT), (p["ter"], PCT2),
                                      (p.get("duration", 0), "0.0")]):
            put(ws, f"{CL(j + 1)}{r}", v, f_in, fmt)
    PRL = PR0 + n - 1
    put(ws, f"E{PRL + 1}", "Summe", bold=True)
    put(ws, f"F{PRL + 1}", f"=SUM(F{PR0}:F{PRL})", fmt=PCT, bold=True)
    put(ws, f"G{PRL + 1}", "muss 100 % ergeben", f_note)
    wb.defined_names["FondsNamen"] = DefinedName("FondsNamen", attr_text=f"Parameter!$B${PR0}:$B${PRL}")
    SR0 = PRL + 4
    put(ws, f"A{SR0 - 1}", "Stressszenarien", bold=True)
    head(ws, SR0, ["Szenario", "Aktien", "Zinsänderung (Pp.)"])
    for i, s in enumerate(cfg["stresstests"]):
        r = SR0 + 1 + i
        put(ws, f"A{r}", s["name"], f_in)
        put(ws, f"B{r}", s["aktien"], f_in, PCT)
        put(ws, f"C{r}", s["zins_pp"], f_in, "0.0")
    ws.column_dimensions["A"].width = 40
    ws.column_dimensions["B"].width = 38
    for c in "CDEFGH":
        ws.column_dimensions[c].width = 16

    def prow(i, col):  # Verweis auf Parametertabelle
        return f"Parameter!${col}${PR0 + i}"

    # ------------------------------------------------------------------ Kurse (Rohdaten)
    ws = S["Kurse"]
    title(ws, "Rohdaten: Monatsendkurse",
          "Simulierte Testdaten (Startwert 100). Später ersetzt durch echte Monatswerte." if quelle == "simuliert"
          else "Monatsendkurse aus data/kurse_monatlich.csv")
    for i, p in enumerate(P):
        put(ws, f"{CL(2 + i)}3", f"={prow(i, 'E')}", f_link)
    head(ws, 4, ["Datum"] + [p["id"] for p in P])
    for t, (d, row) in enumerate(kurse.iterrows()):
        r = R0 + t
        put(ws, f"A{r}", d.to_pydatetime(), f_in, DATE)
        for i, p in enumerate(P):
            put(ws, f"{CL(2 + i)}{r}", round(float(row[p["id"]]), 4), f_in, "0.00")
    ws.column_dimensions["A"].width = 11
    for i in range(n):
        ws.column_dimensions[CL(2 + i)].width = 13
    ws.freeze_panes = "B5"

    # ------------------------------------------------------------------ Renditen
    ws = S["Renditen"]
    title(ws, "Monatsrenditen je Fonds nach laufenden Kosten",
          "Formel: (Kurs Monat / Kurs Vormonat) × (1 − laufende Kosten / 12) − 1. Spalte K: Depotrendite mit den aktuellen Gewichten (Grundlage für den VaR).")
    put(ws, "A3", "Kosten p. a.", f_note)
    for i in range(n):
        put(ws, f"{CL(2 + i)}3", f"={prow(i, 'G')}", f_link, PCT2)
    head(ws, 4, ["Datum"] + [p["id"] for p in P] + ["Depot (akt. Gewichte)"])
    for t in range(T):
        r = R0 + t
        put(ws, f"A{r}", f"=Kurse!A{r}", f_link, DATE)
        if t == 0:
            continue
        for i in range(n):
            c = CL(2 + i)
            put(ws, f"{c}{r}", f"=(Kurse!{c}{r}/Kurse!{c}{r - 1})*(1-{c}$3/12)-1", fmt=PCT2)
        put(ws, f"K{r}", f"=SUMPRODUCT(B{r}:J{r},Depot!$O${RL}:$W${RL})/Depot!$K${RL}", fmt=PCT2)
    ws["K4"].comment = Comment("Gewichtet mit dem aktuellen Bestand (letzte Zeile im Blatt Depot). "
                               "So misst der VaR das Risiko des heutigen Depots.", "Musterdepot")
    ws.column_dimensions["A"].width = 11
    for i in range(n + 1):
        ws.column_dimensions[CL(2 + i)].width = 12
    ws.column_dimensions["K"].width = 14
    ws.freeze_panes = "B5"

    # ------------------------------------------------------------------ Depot
    ws = S["Depot"]
    title(ws, "Depotfortschreibung mit Rebalancing",
          "B–J: Werte vor Umschichtung · M: Umschichtung ja/nein · O–W: Werte nach Umschichtung · Y–AE: Index, Drawdown, Trend")
    pre = [CL(2 + i) for i in range(n)]          # B..J
    post = [CL(15 + i) for i in range(n)]        # O..W
    put(ws, "A2", "Soll", f_note)
    put(ws, "A3", "Klasse", f_note)
    for i in range(n):
        for cols in (pre, post):
            put(ws, f"{cols[i]}2", f"={prow(i, 'F')}", f_link, PCT)
            put(ws, f"{cols[i]}3", f"={prow(i, 'D')}", f_link)
    head(ws, 4, ["Datum"] + [f"{p['id']} vor" for p in P] + ["Summe", "Aktienquote vor", "Umschichten (1/0)",
                 "Anlass"] + [f"{p['id']} nach" for p in P] +
         ["Umschichtungs-volumen", "Index (Start = 100)", "Monats-rendite", "Höchst-stand", "Drawdown",
          "Aktienteil (Wert)", "Aktienteil gleit. Durchschnitt", "Aktienquote nach"])
    for t in range(T):
        r = R0 + t
        put(ws, f"A{r}", f"=Kurse!A{r}", f_link, DATE)
        for i in range(n):
            if t == 0:
                put(ws, f"{pre[i]}{r}", f"=Startkapital*{pre[i]}$2", fmt=EUR)
            else:
                put(ws, f"{pre[i]}{r}", f"={post[i]}{r - 1}*(1+Renditen!{pre[i]}{r})", fmt=EUR)
            put(ws, f"{post[i]}{r}", f"=IF($M{r}=1,$K{r}*{post[i]}$2,{pre[i]}{r})", fmt=EUR)
        put(ws, f"K{r}", f"=SUM(B{r}:J{r})", fmt=EUR)
        put(ws, f"L{r}", f'=SUMPRODUCT((B$3:J$3="Aktien")*B{r}:J{r})/K{r}', fmt=PCT)
        if t == 0:
            put(ws, f"M{r}", 0, fmt="0")
        else:
            put(ws, f"M{r}", f"=IF(OR(ABS(L{r}-Zielquote)>Band,MONTH(A{r})=1),1,0)", fmt="0")
        put(ws, f"N{r}", f'=IF(M{r}=1,IF(ABS(L{r}-Zielquote)>Band,"Toleranzband verletzt","jährliches Rebalancing"),"")')
        put(ws, f"X{r}", f"=SUMPRODUCT(ABS(O{r}:W{r}-B{r}:J{r}))/2", fmt=EUR)
        put(ws, f"Y{r}", f"=K{r}/$K${R0}*100", fmt=IDX)
        if t > 0:
            put(ws, f"Z{r}", f"=K{r}/K{r - 1}-1", fmt=PCT2)
        put(ws, f"AA{r}", f"=MAX($Y${R0}:Y{r})", fmt=IDX)
        put(ws, f"AB{r}", f"=Y{r}/AA{r}-1", fmt=PCT)
        put(ws, f"AC{r}", f'=SUMPRODUCT((O$3:W$3="Aktien")*O{r}:W{r})', fmt=EUR)
        put(ws, f"AD{r}", f'=IF(ROW()-{R0 - 1}>=TrendMonate,AVERAGE(OFFSET(AC{r},1-TrendMonate,0,TrendMonate,1)),"")', fmt=EUR)
        put(ws, f"AE{r}", f"=AC{r}/K{r}", fmt=PCT)
    ws["M4"].comment = Comment("1, wenn die Aktienquote außerhalb Ziel ± Band liegt oder der Monat ein Januar ist.", "Musterdepot")
    ws["B4"].comment = Comment("Wert nach Umschichtung im Vormonat × (1 + Monatsrendite des Fonds)", "Musterdepot")
    ws.conditional_formatting.add(f"A{R0}:AE{RL}", FormulaRule(formula=[f"$M{R0}=1"], fill=fill_sub))
    ws.column_dimensions["A"].width = 11
    for c in range(2, 32):
        ws.column_dimensions[CL(c)].width = 12
    ws.column_dimensions["N"].width = 20
    ws.freeze_panes = "B5"

    # ------------------------------------------------------------------ Allokation
    ws = S["Allokation"]
    title(ws, "Allokation: Soll und Ist zum letzten Stichtag")
    put(ws, "A2", f"=\"Stand: \"&TEXT(Depot!A{RL},\"MMMM YYYY\")", f_note)
    AR0 = 5
    head(ws, 4, ["ID", "Fonds", "Klasse", "Region", "Soll", "Ist", "Abweichung (Pp.)", "Abweichung relativ",
                 "Status", "Wert", "Bedarf bis Soll", "Anteil am Depotrisiko"])
    for i in range(n):
        r = AR0 + i
        put(ws, f"A{r}", f"={prow(i, 'A')}", f_link)
        put(ws, f"B{r}", f"={prow(i, 'B')}", f_link)
        put(ws, f"C{r}", f"={prow(i, 'D')}", f_link)
        put(ws, f"D{r}", f"={prow(i, 'E')}", f_link)
        put(ws, f"E{r}", f"={prow(i, 'F')}", f_link, PCT)
        put(ws, f"J{r}", f"=Depot!{post[i]}{RL}", f_link, EUR)
        put(ws, f"F{r}", f"=J{r}/Depot!$K${RL}", fmt=PCT)
        put(ws, f"G{r}", f"=(F{r}-E{r})*100", fmt='+0.0;-0.0;0.0')
        put(ws, f"H{r}", f"=F{r}/E{r}-1", fmt='+0.0%;-0.0%;0.0%')
        put(ws, f"I{r}", f'=IF(ABS(H{r})<=Toleranz/2,"im Rahmen",IF(ABS(H{r})<=Toleranz,"beobachten","handeln"))')
        put(ws, f"K{r}", f"=E{r}*Depot!$K${RL}-J{r}", fmt=EUR)
        put(ws, f"L{r}", f"=Kovarianz!N{4 + i}", f_link, PCT)
    AL = AR0 + n - 1
    put(ws, f"D{AL + 1}", "Summe", bold=True)
    for c, fmt in (("E", PCT), ("F", PCT), ("J", EUR), ("K", EUR), ("L", PCT)):
        put(ws, f"{c}{AL + 1}", f"=SUM({c}{AR0}:{c}{AL})", fmt=fmt, bold=True)
    put(ws, f"D{AL + 2}", "Aktienquote", bold=True)
    put(ws, f"F{AL + 2}", f'=SUMIF(C{AR0}:C{AL},"Aktien",F{AR0}:F{AL})', fmt=PCT, bold=True)
    put(ws, f"A{AL + 4}", "Status: Abweichung bis zur halben Toleranz = im Rahmen, bis zur Toleranz = beobachten, darüber = handeln. "
                          "Risikoanteil: Gewicht × Kovarianz mit dem Depot ÷ Depotvarianz (Blatt Kovarianz).", f_note)
    rng = f"I{AR0}:I{AL}"
    ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=['"im Rahmen"'], fill=PatternFill("solid", fgColor="D9F2D9")))
    ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=['"beobachten"'], fill=PatternFill("solid", fgColor="FFF0C2")))
    ws.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=['"handeln"'], fill=PatternFill("solid", fgColor="F8D0D0")))
    widths = [7, 38, 10, 24, 9, 9, 14, 14, 12, 13, 14, 14]
    for j, w in enumerate(widths):
        ws.column_dimensions[CL(j + 1)].width = w
    ch = BarChart()
    ch.type, ch.title, ch.style = "bar", "Soll und Ist", 10
    ch.add_data(Reference(ws, min_col=5, max_col=6, min_row=4, max_row=AL), titles_from_data=True)
    ch.set_categories(Reference(ws, min_col=4, min_row=AR0, max_row=AL))
    ch.y_axis.numFmt, ch.height, ch.width = "0%", 9, 18
    ch.x_axis.delete = False
    ch.y_axis.delete = False
    for s_, col in zip(ch.series, ("EB6834", "2E6B8A")):  # Soll orange, Ist blau wie im Dashboard
        s_.graphicalProperties.solidFill = col
        s_.graphicalProperties.line.solidFill = col
    ws.add_chart(ch, f"B{AL + 6}")

    # ------------------------------------------------------------------ Kovarianz
    ws = S["Kovarianz"]
    title(ws, "Kovarianzmatrix und Risikobeitrag",
          f"Monatsrenditen der letzten {fen} Monate (Blatt Renditen, Zeilen {RW}–{RL}). COVAR = Populationskovarianz; für Risikoanteile kürzt sich die Skalierung heraus.")
    head(ws, 3, ["ID"] + [p["id"] for p in P] + ["Kovarianz mit Depot", "Gewicht", "Gewicht × Kovarianz", "Anteil am Depotrisiko"])
    put(ws, "A2", "Gewicht", f_note)
    for i in range(n):
        put(ws, f"{CL(2 + i)}2", f"=Allokation!F{AR0 + i}", f_link, PCT)
    for i in range(n):
        r = 4 + i
        ci = CL(2 + i)
        put(ws, f"A{r}", P[i]["id"], bold=True)
        for j in range(n):
            cj = CL(2 + j)
            put(ws, f"{cj}{r}", f"=COVAR(Renditen!{ci}${RW}:{ci}${RL},Renditen!{cj}${RW}:{cj}${RL})", fmt="0.000000")
        put(ws, f"K{r}", f"=SUMPRODUCT(B{r}:J{r},$B$2:$J$2)", fmt="0.000000")
        put(ws, f"L{r}", f"=Allokation!F{AR0 + i}", f_link, PCT)
        put(ws, f"M{r}", f"=L{r}*K{r}", fmt="0.000000")
        put(ws, f"N{r}", f"=M{r}/$M${4 + n}", fmt=PCT)
    put(ws, f"L{4 + n}", "Depotvarianz", bold=True)
    put(ws, f"M{4 + n}", f"=SUM(M4:M{3 + n})", fmt="0.000000", bold=True)
    put(ws, f"N{4 + n}", f"=SUM(N4:N{3 + n})", fmt=PCT, bold=True)
    put(ws, f"L{5 + n}", "Volatilität p. a.", bold=True)
    put(ws, f"M{5 + n}", f"=SQRT(M{4 + n}*12)", fmt=PCT, bold=True)
    for c in range(1, 15):
        ws.column_dimensions[CL(c)].width = 12

    # ------------------------------------------------------------------ Uebersicht (Kennzahlen)
    ws = S["Übersicht"]
    title(ws, "Musterdepot 80/20 – Übersicht")
    put(ws, "A2", f"=\"Stand: \"&TEXT(Depot!A{RL},\"DD.MM.YYYY\")&\" · Start \"&TEXT(Depot!A{R0},\"MMMM YYYY\")", f_note)
    zr = f"Depot!Z{R0 + 1}:Z{RL}"
    var_rng = f"Renditen!K{RW}:K{RL}"
    rows = [
        ("Kennzahlen", None, None, None),
        ("Depotwert", f"=Depot!K{RL}", EUR, "Summe der Positionen nach Umschichtung"),
        ("Rendite seit Start", f"=Depot!K{RL}/Depot!K{R0}-1", PCT, "Endwert ÷ Startwert − 1"),
        ("Jahre", f"=COUNT({zr})/12", "0.00", "Anzahl Monatsrenditen ÷ 12"),
        ("Rendite p. a.", "=(1+B6)^(1/B7)-1", PCT, "geometrisch: (1 + Gesamtrendite)^(1/Jahre) − 1"),
        ("Laufendes Jahr", f"=Depot!K{RL}/INDEX(Depot!K{R0}:K{RL},MATCH(DATE(YEAR(Depot!A{RL}),1,0),Depot!A{R0}:A{RL},1))-1", PCT,
         "gegen den Wert am Ende des Vorjahres"),
        ("Letzter Monat", f"=Depot!Z{RL}", PCT, ""),
        ("Volatilität p. a.", f"=STDEV({zr})*SQRT(12)", PCT, "Standardabweichung der Monatsrenditen × √12"),
        ("Sharpe Ratio", "=(B8-Rf)/B11", "0.00", "(Rendite p. a. − risikofreier Zins) ÷ Volatilität"),
        ("Max. Drawdown", f"=MIN(Depot!AB{R0}:AB{RL})", PCT, ""),
        ("… im Monat", f"=INDEX(Depot!A{R0}:A{RL},MATCH(B13,Depot!AB{R0}:AB{RL},0))", DATE, ""),
        ("Drawdown aktuell", f"=Depot!AB{RL}", PCT, "Abstand zum bisherigen Höchststand"),
        ("Aktienquote", f"=Depot!AE{RL}", PCT, ""),
        (None, None, None, None),
        ("Risiko auf einen Monat", None, None, None),
        ("VaR historisch", f"=-PERCENTILE({var_rng},1-Konfidenz)", PCT,
         f"5-%-Quantil der Depotrenditen (aktuelle Gewichte), letzte {fen} Monate"),
        ("VaR historisch in €", "=B19*B5", EUR, ""),
        ("VaR parametrisch", f"=-(AVERAGE({var_rng})-NORMSINV(Konfidenz)*STDEV({var_rng}))", PCT,
         "Normalverteilung; das Dashboard nutzt hier Monte Carlo (gleiche Annahmen, daher nahe beieinander)"),
        ("VaR parametrisch in €", "=B21*B5", EUR, ""),
        ("Expected Shortfall historisch", f'=-AVERAGEIF({var_rng},"<="&-B19)', PCT,
         "Durchschnitt der Monate, die schlechter als der VaR waren"),
        ("Expected Shortfall in €", "=B23*B5", EUR, ""),
    ]
    for i, (lab, f, fmt, note) in enumerate(rows):
        r = 4 + i
        if lab is None:
            continue
        if f is None:
            c = put(ws, f"A{r}", lab, bold=True)
            continue
        put(ws, f"A{r}", lab)
        put(ws, f"B{r}", f, f_link if f.startswith("=Depot!") and f.count("!") == 1 and "/" not in f else f_norm, fmt)
        put(ws, f"C{r}", note, f_note)
    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 16
    ws.column_dimensions["C"].width = 70
    lc = LineChart()
    lc.title, lc.style, lc.height, lc.width = "Wertentwicklung (Start = 100)", 12, 8, 22
    lc.add_data(Reference(S["Depot"], min_col=25, min_row=4, max_row=RL), titles_from_data=True)
    lc.set_categories(Reference(S["Depot"], min_col=1, min_row=R0, max_row=RL))
    lc.x_axis.number_format, lc.legend = "YYYY", None
    stil(lc, ymin=60)
    ws.add_chart(lc, "E4")
    dc = LineChart()
    dc.title, dc.style, dc.height, dc.width = "Drawdown", 12, 7, 22
    dc.add_data(Reference(S["Depot"], min_col=28, min_row=4, max_row=RL), titles_from_data=True)
    dc.set_categories(Reference(S["Depot"], min_col=1, min_row=R0, max_row=RL))
    dc.y_axis.numFmt, dc.x_axis.number_format, dc.legend = "0%", "YYYY", None
    stil(dc, low_labels=True)
    ws.add_chart(dc, "E21")

    # ------------------------------------------------------------------ Warnungen
    ws = S["Warnungen"]
    title(ws, "Warnregeln", "Werden wöchentlich geprüft; ausgelöste Regeln verschicken eine E-Mail.")
    head(ws, 4, ["Regel", "Aktueller Wert", "Schwelle", "Status"])
    warn = [
        ("Drawdown größer Schwelle", "=Übersicht!B15", "=-DDSchwelle", "=IF(B5<C5,\"ausgelöst\",\"ruhig\")", PCT),
        ("Aktienquote außerhalb Toleranzband (Abweichung)", "=Übersicht!B16-Zielquote", "=Band", "=IF(ABS(B6)>C6,\"ausgelöst\",\"ruhig\")", PCT),
        ("Aktienteil unter gleitendem Durchschnitt", f"=Depot!AC{RL}/Depot!AD{RL}-1", 0, "=IF(B7<C7,\"ausgelöst\",\"ruhig\")", PCT),
        ("Monatsverlust größer VaR (parametrisch)", "=Übersicht!B10", "=-Übersicht!B21", "=IF(B8<C8,\"ausgelöst\",\"ruhig\")", PCT),
    ]
    for i, (lab, v, s, st, fmt) in enumerate(warn):
        r = 5 + i
        put(ws, f"A{r}", lab)
        put(ws, f"B{r}", v, fmt=fmt)
        put(ws, f"C{r}", s, fmt=fmt)
        put(ws, f"D{r}", st, bold=True)
    ws.conditional_formatting.add("D5:D8", CellIsRule(operator="equal", formula=['"ausgelöst"'], fill=PatternFill("solid", fgColor="F8D0D0")))
    ws.conditional_formatting.add("D5:D8", CellIsRule(operator="equal", formula=['"ruhig"'], fill=PatternFill("solid", fgColor="D9F2D9")))
    put(ws, "A10", "Hinweis: Das Dashboard prüft die VaR-Regel gegen den Monte-Carlo-VaR, hier gegen den parametrischen. Beide liegen nahe beieinander.", f_note)
    ws.column_dimensions["A"].width = 46
    for c in "BCD":
        ws.column_dimensions[c].width = 16

    # ------------------------------------------------------------------ Stresstests
    ws = S["Stresstests"]
    title(ws, "Stresstests", "Sofortiger Bewertungseffekt: Aktien × Schock; Anleihen × (−Duration × Zinsänderung / 100)")
    head(ws, 4, ["Szenario", "Aktienschock", "Zinsänderung (Pp.)", "Effekt Aktien", "Effekt Anleihen", "Effekt gesamt", "in % des Depots"])
    dur_rng = f"Parameter!$H${PR0}:$H${PRL}"
    for i, s in enumerate(cfg["stresstests"]):
        r = 5 + i
        pr = SR0 + 1 + i
        put(ws, f"A{r}", f"=Parameter!A{pr}", f_link)
        put(ws, f"B{r}", f"=Parameter!B{pr}", f_link, PCT)
        put(ws, f"C{r}", f"=Parameter!C{pr}", f_link, "0.0")
        put(ws, f"D{r}", f'=SUMIF(Allokation!$C${AR0}:$C${AL},"Aktien",Allokation!$J${AR0}:$J${AL})*B{r}', fmt=EUR)
        put(ws, f"E{r}", f'=-SUMPRODUCT((Allokation!$C${AR0}:$C${AL}="Anleihen")*Allokation!$J${AR0}:$J${AL}*{dur_rng})*C{r}/100', fmt=EUR)
        put(ws, f"F{r}", f"=D{r}+E{r}", fmt=EUR, bold=True)
        put(ws, f"G{r}", f"=F{r}/Übersicht!$B$5", fmt=PCT)
    ws.column_dimensions["A"].width = 40
    for c in "BCDEFG":
        ws.column_dimensions[c].width = 15

    # ------------------------------------------------------------------ Einzelanalyse
    ws = S["Einzelanalyse"]
    title(ws, "Einzelanalyse", "Fonds in B3 auswählen (gelbe Zelle). Alle Werte und das Diagramm passen sich an.")
    put(ws, "A3", "Fonds", bold=True)
    sel = put(ws, "B3", P[0]["name"], f_in)
    sel.fill = fill_key
    dv = DataValidation(type="list", formula1="=FondsNamen", allow_blank=False)
    ws.add_data_validation(dv)
    dv.add("B3")
    put(ws, "A4", "Nr.", f_note)
    put(ws, "B4", "=MATCH(B3,FondsNamen,0)", fmt="0")
    # Hilfstabelle (Zeitreihe) ab Spalte H
    HR0 = R0 + 3       # Zeile der ersten Datenzeile in der Hilfstabelle
    head(ws, HR0 - 1, ["Datum", "Fondsrendite", "Fonds-Index", "Depot-Index", "Gewicht", "Höchststand", "Drawdown",
                       "Renditebeitrag", "Umschichtung (€)"], start=8)
    for t in range(T):
        r = HR0 + t
        dr = R0 + t
        put(ws, f"H{r}", f"=Depot!A{dr}", f_link, DATE)
        if t == 0:
            put(ws, f"J{r}", 100, fmt=IDX)
        else:
            put(ws, f"I{r}", f"=INDEX(Renditen!B{dr}:J{dr},$B$4)", fmt=PCT2)
            put(ws, f"J{r}", f"=J{r - 1}*(1+I{r})", fmt=IDX)
            put(ws, f"O{r}", f"=(INDEX(Depot!B{dr}:J{dr},$B$4)-INDEX(Depot!O{dr - 1}:W{dr - 1},$B$4))/Depot!K{dr - 1}", fmt=PCT2)
        put(ws, f"K{r}", f"=Depot!Y{dr}", f_link, IDX)
        put(ws, f"L{r}", f"=INDEX(Depot!O{dr}:W{dr},$B$4)/Depot!K{dr}", fmt=PCT2)
        put(ws, f"M{r}", f"=MAX($J${HR0}:J{r})", fmt=IDX)
        put(ws, f"N{r}", f"=J{r}/M{r}-1", fmt=PCT)
        put(ws, f"P{r}", f'=IF(Depot!M{dr}=1,INDEX(Depot!O{dr}:W{dr},$B$4)-INDEX(Depot!B{dr}:J{dr},$B$4),"")', fmt=EUR)
    HL = HR0 + T - 1
    fr = f"I{HR0 + 1}:I{HL}"
    frw = f"I{HL - fen + 1}:I{HL}"
    drw = f"Depot!Z{RW}:Z{RL}"
    kv = [
        ("Stammdaten", None, None),
        ("Klasse", "=INDEX(Parameter!$D$%d:$D$%d,B4)" % (PR0, PRL), None),
        ("Region", "=INDEX(Parameter!$E$%d:$E$%d,B4)" % (PR0, PRL), None),
        ("Kennung", "=INDEX(Parameter!$C$%d:$C$%d,B4)" % (PR0, PRL), None),
        ("Laufende Kosten p. a.", "=INDEX(Parameter!$G$%d:$G$%d,B4)" % (PR0, PRL), PCT2),
        ("Bestand", None, None),
        ("Positionswert", f"=INDEX(Allokation!J{AR0}:J{AL},B4)", EUR),
        ("Gewicht Soll", f"=INDEX(Allokation!E{AR0}:E{AL},B4)", PCT),
        ("Gewicht Ist", f"=INDEX(Allokation!F{AR0}:F{AL},B4)", PCT),
        ("Status", f"=INDEX(Allokation!I{AR0}:I{AL},B4)", None),
        ("Bedarf bis Soll", f"=INDEX(Allokation!K{AR0}:K{AL},B4)", EUR),
        ("Rendite und Risiko", None, None),
        ("Rendite seit Start", f"=J{HL}/100-1", PCT),
        ("Rendite p. a.", f"=(J{HL}/100)^(12/COUNT({fr}))-1", PCT),
        ("Volatilität p. a.", f"=STDEV({fr})*SQRT(12)", PCT),
        ("Max. Drawdown", f"=MIN(N{HR0}:N{HL})", PCT),
        ("Bester Monat", f"=MAX({fr})", PCT),
        ("Schlechtester Monat", f"=MIN({fr})", PCT),
        ("Beta zum Depot (36 M.)", f"=COVAR({frw},{drw})/VARP({drw})", "0.00"),
        ("Korrelation zum Depot (36 M.)", f"=CORREL({frw},{drw})", "0.00"),
        ("Beitrag zur Depotrendite (Pp.)", f"=SUM(O{HR0 + 1}:O{HL})*100", "0.00"),
        ("… von Depot gesamt (Pp.)", f"=SUM(Depot!Z{R0 + 1}:Z{RL})*100", "0.00"),
        ("Anteil am Depotrisiko", f"=INDEX(Allokation!L{AR0}:L{AL},B4)", PCT),
    ]
    for i, (lab, f, fmt) in enumerate(kv):
        r = 6 + i
        if f is None:
            put(ws, f"A{r}", lab, bold=True)
            continue
        put(ws, f"A{r}", lab)
        put(ws, f"B{r}", f, fmt=fmt)
    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 38
    for c in range(8, 17):
        ws.column_dimensions[CL(c)].width = 12
    ec = LineChart()
    ec.title, ec.style, ec.height, ec.width = "Fonds und Depot (Start = 100)", 12, 8, 20
    ec.add_data(Reference(ws, min_col=10, max_col=11, min_row=HR0 - 1, max_row=HL), titles_from_data=True)
    ec.set_categories(Reference(ws, min_col=8, min_row=HR0, max_row=HL))
    ec.x_axis.number_format = "YYYY"
    ec.legend.position = "b"
    stil(ec, ymin=50)
    ws.add_chart(ec, "A31")
    gc = LineChart()
    gc.title, gc.style, gc.height, gc.width = "Gewicht im Zeitverlauf", 12, 6, 20
    gc.add_data(Reference(ws, min_col=12, min_row=HR0 - 1, max_row=HL), titles_from_data=True)
    gc.set_categories(Reference(ws, min_col=8, min_row=HR0, max_row=HL))
    gc.y_axis.numFmt, gc.x_axis.number_format, gc.legend = "0.0%", "YYYY", None
    stil(gc)
    ws.add_chart(gc, "A48")

    # ------------------------------------------------------------------ Info
    ws = S["Info"]
    title(ws, "Musterdepot-Monitoring · Excel-Fassung")
    lines = [
        ("Was ist das?", True),
        ("Ein fiktives Depot mit 1 Mio. € Startkapital (80 % Aktien, 20 % Anleihen) mit derselben Logik wie das Dashboard auf christoph-zapp.de/musterdepot/.", False),
        ("Jede Zahl ist eine Formel. Sie lässt sich bis zu den Rohdaten im Blatt Kurse zurückverfolgen.", False),
        ("", False),
        ("Rechenweg", True),
        ("1. Kurse: Monatsendkurse je Fonds (Rohdaten).", False),
        ("2. Renditen: Monatsrendite je Fonds nach laufenden Kosten.", False),
        ("3. Depot: Fortschreibung Monat für Monat. Umgeschichtet wird bei Verletzung des Toleranzbands und jährlich im Januar.", False),
        ("4. Übersicht, Allokation, Kovarianz, Stresstests, Warnungen: Auswertung des letzten Stichtags.", False),
        ("5. Einzelanalyse: Fonds auswählen, dann zeigen Kennzahlen und Diagramm den gewählten Fonds.", False),
        ("", False),
        ("Farben", True),
        ("Blau = Eingabe · Schwarz = Formel · Grün = Verweis auf ein anderes Blatt · Gelb hinterlegt = zentrale Annahme oder Auswahl", False),
        ("Hellblau hinterlegte Zeilen im Blatt Depot = Monate mit Umschichtung", False),
        ("", False),
        ("Abweichungen zum Dashboard", True),
        ("Der VaR wird hier historisch und parametrisch (Normalverteilung) berechnet, im Dashboard zusätzlich per Monte-Carlo-Simulation in Python.", False),
        ("", False),
        ("Hinweis", True),
        ("Simulierte Testdaten. " if quelle == "simuliert" else "", False),
        ("Alle Fonds sind frei erfunden und nicht handelbar. Das Musterdepot dient ausschließlich der Darstellung von Reporting- und Risikomethoden und ist keine Anlageberatung.", False),
    ]
    for i, (t, b) in enumerate(lines):
        put(ws, f"A{3 + i}", t, bold=b)
    ws.column_dimensions["A"].width = 130

    for w in wb.worksheets:
        w.sheet_properties.tabColor = ACC if w.title in ("Info", "Übersicht", "Allokation", "Einzelanalyse") else "BBBBBB"
    wb.active = 1
    wb.calculation.fullCalcOnLoad = True   # Excel rechnet beim Öffnen alles neu
    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    print("Excel geschrieben:", out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--quelle", choices=["simuliert", "csv"], default="simuliert")
    ap.add_argument("--out", default=str(ROOT.parent / "public" / "musterdepot" / "Musterdepot_Zapp.xlsx"))
    a = ap.parse_args()
    bauen(a.quelle, Path(a.out))
