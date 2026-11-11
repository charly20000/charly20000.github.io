"""Unabhaengige Gegenrechnung der wichtigsten Kennzahlen.

Rechnet aus der Zeitreihe in data.json mit eigenen, einfachen Formeln nach
und bricht mit Fehler ab, wenn etwas nicht passt. Laeuft im Workflow vor
dem Veroeffentlichen.
"""
import json
import math
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent
d = json.loads((ROOT / "site" / "data.json").read_text(encoding="utf-8"))
k, z = d["kennzahlen"], d["zeitreihe"]
idx = [r["index"] for r in z]
fehler = []
anzahl = [0]


def pruefe(name, ist, soll, tol):
    anzahl[0] += 1
    if abs(ist - soll) > tol:
        fehler.append(f"{name}: ausgewiesen {ist}, nachgerechnet {soll:.5f}")


# Gesamtrendite und Rendite p. a.
pruefe("Rendite gesamt", k["rendite_gesamt"], idx[-1] / idx[0] - 1, 0.0005)
jahre = (len(idx) - 1) / 12
pruefe("Rendite p. a.", k["rendite_pa"], (idx[-1] / idx[0]) ** (1 / jahre) - 1, 0.0005)
# Volatilitaet
r = [idx[i] / idx[i - 1] - 1 for i in range(1, len(idx))]
pruefe("Volatilität", k["volatilitaet_pa"], statistics.stdev(r) * math.sqrt(12), 0.0005)
# Drawdown
hoch, dd_min, dd = idx[0], 0.0, 0.0
for v in idx:
    hoch = max(hoch, v)
    dd = v / hoch - 1
    dd_min = min(dd_min, dd)
pruefe("Max. Drawdown", k["max_drawdown"], dd_min, 0.0005)
pruefe("Drawdown aktuell", k["drawdown_aktuell"], dd, 0.0005)
# Allokation
a = d["allokation"]
pruefe("Summe Soll", sum(x["soll"] for x in a), 1.0, 1e-9)
pruefe("Summe Ist", sum(x["ist"] for x in a), 1.0, 0.0005)
pruefe("Summe Positionswerte", sum(x["wert"] for x in a), k["wert"], 5)
pruefe("Aktienquote", d["aktienquote"], sum(x["ist"] for x in a if x["klasse"] == "Aktien"), 0.0005)
pruefe("Bedarf bis Soll gleicht sich aus", sum(x["handlungsbedarf_eur"] for x in a), 0, 10)
# VaR-Plausibilitaet: Expected Shortfall muss groesser als VaR sein
v = d["var"]
anzahl[0] += 1
if not v["expected_shortfall_pct"] >= v["montecarlo_pct"] > 0:
    fehler.append("Expected Shortfall kleiner als VaR oder VaR nicht positiv")
# Stresstest Aktien -20 %
aktien_wert = sum(x["wert"] for x in a if x["klasse"] == "Aktien")
pruefe("Stresstest Aktien −20 %", d["stresstests"][0]["eur"], -0.2 * aktien_wert, 5)

# Einzelanalyse
e = d["einzel"]
pruefe("Renditebeiträge = Summe Depotrenditen", e["renditebeitrag_summe_pp"], e["depot_renditen_summe_pp"], 0.02)
pruefe("Risikobeiträge summieren sich zu 100 %", sum(p["risikobeitrag"] for p in e["positionen"].values()), 1.0, 0.002)
for x in a:
    p = e["positionen"][x["id"]]
    pruefe(f"Gewicht {x['id']} Zeitreihe = Allokation", p["zeitreihe"][-1]["gewicht"], x["ist"], 0.0005)
    pruefe(f"Gesamtrendite {x['id']}", p["rendite_gesamt"], p["zeitreihe"][-1]["index"] / 100 - 1, 0.0005)
n_trade = len(d["rebalancing"])
for i in range(n_trade):
    summe = sum(e["positionen"][x["id"]]["umschichtungen"][i]["betrag"] for x in a)
    pruefe(f"Umschichtung {d['rebalancing'][i]['datum']} gleicht sich aus", summe, 0, 10)

if fehler:
    raise SystemExit("Gegenrechnung fehlgeschlagen:\n  " + "\n  ".join(fehler))
print(f"Gegenrechnung ok: {anzahl[0]} Prüfungen bestanden.")
