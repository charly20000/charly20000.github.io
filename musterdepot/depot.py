"""Musterdepot-Monitoring: Rechenkern.

Liest die Konfiguration, holt Monatskurse (simuliert oder aus CSV),
fuehrt das Depot mit Rebalancing-Regel fort und berechnet Kennzahlen,
Risikomasse, Stresstests und Warnsignale. Ergebnis: data.json.

Aufruf:
    python depot.py --quelle simuliert      # Testdaten (Prototyp)
    python depot.py --quelle csv            # data/kurse_monatlich.csv
"""
from __future__ import annotations

import argparse
import json
import math
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent


# ---------------------------------------------------------------------------
# Kursdaten
# ---------------------------------------------------------------------------
def simulierte_kurse(cfg: dict, bis: str | None = None, seed: int = 42) -> pd.DataFrame:
    """Erzeugt plausible Monatskurse (Startwert 100) fuer alle Positionen.

    Faktormodell: gemeinsamer Aktienfaktor + regionale Abweichung,
    Anleihen ueber Zinsaenderung x Duration. Phasen grob angelehnt an
    2022 (Zinswende), 2023/24 (Erholung), Fruehjahr 2025 (Ruecksetzer).
    Es sind TESTDATEN, keine echten Kurse.
    """
    rng = np.random.default_rng(seed)
    start = pd.Timestamp(cfg["startdatum"])
    ende = pd.Timestamp(bis) if bis else pd.Timestamp(date.today()) - pd.offsets.MonthEnd(1)
    # Feste Zufallsreihe bis 2040 erzeugen und danach kuerzen: so bleiben
    # vergangene Monate beim monatlichen Update unveraendert.
    idx = pd.date_range(start, "2040-12-31", freq="ME")
    n = len(idx)

    aktien_drift = np.full(n, 0.007)
    aktien_vol = np.full(n, 0.035)
    zins_drift = np.zeros(n)
    for i, d in enumerate(idx):
        if pd.Timestamp("2022-01-01") <= d <= pd.Timestamp("2022-09-30"):
            aktien_drift[i], aktien_vol[i], zins_drift[i] = -0.012, 0.045, 0.22
        elif pd.Timestamp("2022-10-01") <= d <= pd.Timestamp("2023-12-31"):
            aktien_drift[i], zins_drift[i] = 0.012, 0.02
        elif pd.Timestamp("2025-03-01") <= d <= pd.Timestamp("2025-04-30"):
            aktien_drift[i], aktien_vol[i] = -0.045, 0.06
        elif pd.Timestamp("2026-08-01") <= d <= pd.Timestamp("2026-10-31"):
            aktien_drift[i], aktien_vol[i] = -0.03, 0.045

    beta = {"NA": 1.05, "EU": 0.95, "JP": 0.85, "APX": 0.9, "EM": 1.0, "SC": 1.15}
    idio = {"NA": 0.012, "EU": 0.015, "JP": 0.02, "APX": 0.022, "EM": 0.025, "SC": 0.018}

    faktor = aktien_drift + aktien_vol * rng.standard_normal(n)
    zins_aend = zins_drift + 0.12 * rng.standard_normal(n)  # Prozentpunkte je Monat

    reihen = {}
    for p in cfg["positionen"]:
        if p["klasse"] == "Aktien":
            r = beta[p["id"]] * faktor + idio[p["id"]] * rng.standard_normal(n)
        else:
            dur = p.get("duration", 3.0)
            kupon = 0.0015 + 0.0002 * dur
            spread = 0.002 * rng.standard_normal(n) if p["id"] == "CORP" else 0.0
            r = kupon - dur * zins_aend / 100 + spread
        r[0] = 0.0
        reihen[p["id"]] = 100 * np.cumprod(1 + r)
    return pd.DataFrame(reihen, index=idx).loc[:ende]


def csv_kurse(cfg: dict) -> pd.DataFrame:
    """Monatsendkurse aus data/kurse_monatlich.csv (Spalten: datum + Positions-IDs)."""
    df = pd.read_csv(ROOT / "data" / "kurse_monatlich.csv", parse_dates=["datum"], index_col="datum")
    fehlend = [p["id"] for p in cfg["positionen"] if p["id"] not in df.columns]
    if fehlend:
        raise SystemExit(f"Kurse fehlen fuer: {fehlend}")
    return df.sort_index().loc[cfg["startdatum"]:]


# ---------------------------------------------------------------------------
# Depotfortschreibung mit Rebalancing
# ---------------------------------------------------------------------------
def fortschreiben(cfg: dict, kurse: pd.DataFrame):
    ids = [p["id"] for p in cfg["positionen"]]
    soll = np.array([p["soll"] for p in cfg["positionen"]])
    ter_m = np.array([p["ter"] for p in cfg["positionen"]]) / 12
    ist_aktie = np.array([p["klasse"] == "Aktien" for p in cfg["positionen"]])
    band = cfg["toleranzband_aktien_pp"] / 100
    ziel = cfg["zielquote_aktien"]

    px = kurse[ids].to_numpy()
    stueck = cfg["startkapital"] * soll / px[0]
    werte, vorher, quoten, events = [], [], [], []
    for t in range(len(px)):
        if t > 0:
            stueck = stueck * (1 - ter_m)  # laufende Kosten
        w = stueck * px[t]
        vorher.append(w.copy())
        gesamt = w.sum()
        q_aktien = w[ist_aktie].sum() / gesamt
        datum = kurse.index[t]
        grund = None
        if t > 0 and abs(q_aktien - ziel) > band:
            grund = f"Aktienquote {pct(q_aktien)} außerhalb des Toleranzbands"
        elif t > 0 and datum.month == 1:
            grund = "jährliches Rebalancing"
        if grund:
            umschichtung = np.abs(gesamt * soll - w).sum() / 2
            events.append({"datum": datum.strftime("%Y-%m"), "grund": grund,
                           "volumen": round(float(umschichtung), 0),
                           "aktienquote_vorher": round(float(q_aktien), 4),
                           "trades": {i: round(float(x), 0) for i, x in zip(ids, gesamt * soll - w)}})
            stueck = gesamt * soll / px[t]
            w = stueck * px[t]
        werte.append(w)
        quoten.append(w[ist_aktie].sum() / w.sum())
    werte = pd.DataFrame(werte, index=kurse.index, columns=ids)
    vorher = pd.DataFrame(vorher, index=kurse.index, columns=ids)
    return werte, vorher, pd.Series(quoten, index=kurse.index), events


def fondsrenditen(cfg: dict, kurse: pd.DataFrame) -> pd.DataFrame:
    """Monatsrenditen je Fonds nach laufenden Kosten (ohne Umschichtungseffekte)."""
    ids = [p["id"] for p in cfg["positionen"]]
    ter_m = pd.Series({p["id"]: p["ter"] / 12 for p in cfg["positionen"]})
    return ((1 + kurse[ids].pct_change()) * (1 - ter_m) - 1).dropna()


# ---------------------------------------------------------------------------
# Kennzahlen und Risiko
# ---------------------------------------------------------------------------
def kennzahlen(gesamt: pd.Series, rf: float) -> dict:
    r = gesamt.pct_change().dropna()
    jahre = len(r) / 12
    rendite_pa = (gesamt.iloc[-1] / gesamt.iloc[0]) ** (1 / jahre) - 1
    vol_pa = r.std(ddof=1) * math.sqrt(12)
    hoch = gesamt.cummax()
    dd = gesamt / hoch - 1
    lfd_jahr = gesamt[gesamt.index.year == gesamt.index[-1].year]
    vorjahr_ende = gesamt[gesamt.index.year < gesamt.index[-1].year]
    basis = vorjahr_ende.iloc[-1] if len(vorjahr_ende) else gesamt.iloc[0]
    return {
        "wert": round(float(gesamt.iloc[-1]), 0),
        "rendite_gesamt": round(float(gesamt.iloc[-1] / gesamt.iloc[0] - 1), 4),
        "rendite_pa": round(float(rendite_pa), 4),
        "rendite_lfd_jahr": round(float(lfd_jahr.iloc[-1] / basis - 1), 4),
        "rendite_letzter_monat": round(float(r.iloc[-1]), 4),
        "volatilitaet_pa": round(float(vol_pa), 4),
        "sharpe": round(float((rendite_pa - rf) / vol_pa), 2) if vol_pa > 0 else None,
        "max_drawdown": round(float(dd.min()), 4),
        "max_drawdown_datum": dd.idxmin().strftime("%Y-%m"),
        "drawdown_aktuell": round(float(dd.iloc[-1]), 4),
    }, dd


def value_at_risk(werte: pd.DataFrame, renditen: pd.DataFrame, konf: float, fenster: int = 36,
                  sims: int = 20000, seed: int = 7) -> dict:
    """1-Monats-VaR auf den aktuellen Bestand, historisch und per Monte Carlo.

    Grundlage sind die Fondsrenditen der letzten Monate, gewichtet mit den
    aktuellen Gewichten (Umschichtungen verfaelschen so nichts)."""
    r = renditen[werte.columns].tail(fenster)
    gewichte = (werte.iloc[-1] / werte.iloc[-1].sum()).to_numpy()
    depot_r = r.to_numpy() @ gewichte
    wert = float(werte.iloc[-1].sum())
    var_hist = -np.quantile(depot_r, 1 - konf)
    rng = np.random.default_rng(seed)
    mu, cov = r.mean().to_numpy(), r.cov().to_numpy()
    sim = rng.multivariate_normal(mu, cov, size=sims) @ gewichte
    var_mc = -np.quantile(sim, 1 - konf)
    es_mc = -sim[sim <= -var_mc].mean()
    return {
        "konfidenz": konf, "fenster_monate": len(r), "simulationen": sims,
        "historisch_pct": round(float(var_hist), 4), "historisch_eur": round(var_hist * wert, 0),
        "montecarlo_pct": round(float(var_mc), 4), "montecarlo_eur": round(var_mc * wert, 0),
        "expected_shortfall_pct": round(float(es_mc), 4), "expected_shortfall_eur": round(es_mc * wert, 0),
        "verteilung": [round(float(x), 4) for x in np.quantile(sim, np.linspace(0.005, 0.995, 60))],
    }


def stresstests(cfg: dict, werte: pd.DataFrame) -> list[dict]:
    letzte = werte.iloc[-1]
    gesamt = float(letzte.sum())
    erg = []
    for s in cfg["stresstests"]:
        verlust = 0.0
        for p in cfg["positionen"]:
            w = float(letzte[p["id"]])
            if p["klasse"] == "Aktien":
                verlust += w * s["aktien"]
            else:
                verlust += -w * p.get("duration", 0) * s["zins_pp"] / 100
        erg.append({"name": s["name"], "eur": round(verlust, 0), "pct": round(verlust / gesamt, 4)})
    return erg


def allokation(cfg: dict, werte: pd.DataFrame) -> list[dict]:
    letzte = werte.iloc[-1]
    gesamt = float(letzte.sum())
    tol = cfg["toleranz_position_relativ"]
    out = []
    for p in cfg["positionen"]:
        ist = float(letzte[p["id"]]) / gesamt
        abw_rel = ist / p["soll"] - 1
        status = "ok" if abs(abw_rel) <= tol / 2 else ("beobachten" if abs(abw_rel) <= tol else "handeln")
        out.append({"id": p["id"], "name": p["name"], "kennung": p["kennung"], "klasse": p["klasse"],
                    "region": p["region"], "soll": p["soll"], "ist": round(ist, 4),
                    "ter": p["ter"], "duration": p.get("duration"),
                    "abweichung_pp": round((ist - p["soll"]) * 100, 2),
                    "abweichung_rel": round(abw_rel, 4), "status": status,
                    "wert": round(float(letzte[p["id"]]), 0),
                    "handlungsbedarf_eur": round(p["soll"] * gesamt - float(letzte[p["id"]]), 0)})
    return out


def pct(x: float, nachkomma: int = 1, vorzeichen: bool = False) -> str:
    """Prozent im deutschen Format, z. B. -7,9 %."""
    f = f"{{:{'+' if vorzeichen else ''}.{nachkomma}f}}".format(x * 100)
    return f.replace("-", "−").replace(".", ",") + " %"


# ---------------------------------------------------------------------------
# Warnregeln
# ---------------------------------------------------------------------------
def warnungen(cfg: dict, k: dict, aktienquote: pd.Series, werte: pd.DataFrame, var: dict) -> list[dict]:
    regeln = cfg["warnregeln"]
    ziel, band = cfg["zielquote_aktien"], cfg["toleranzband_aktien_pp"] / 100
    ids_aktien = [p["id"] for p in cfg["positionen"] if p["klasse"] == "Aktien"]
    aktien = werte[ids_aktien].sum(axis=1)
    sma = aktien.rolling(regeln["trend_monate"]).mean()
    q = float(aktienquote.iloc[-1])
    liste = [
        {"id": "drawdown", "regel": f"Drawdown größer {pct(regeln['drawdown_schwelle'], 0)}",
         "aktiv": k["drawdown_aktuell"] < -regeln["drawdown_schwelle"],
         "wert": pct(k['drawdown_aktuell'])},
        {"id": "band", "regel": f"Aktienquote außerhalb {pct(ziel - band, 0)} bis {pct(ziel + band, 0)}",
         "aktiv": abs(q - ziel) > band, "wert": pct(q)},
        {"id": "trend", "regel": f"Aktienteil unter {regeln['trend_monate']}-Monats-Durchschnitt",
         "aktiv": bool(aktien.iloc[-1] < sma.iloc[-1]),
         "wert": pct(aktien.iloc[-1] / sma.iloc[-1] - 1, vorzeichen=True) + " zum Durchschnitt"},
        {"id": "var", "regel": f"Monatsverlust größer VaR {pct(var['konfidenz'], 0)} (Monte Carlo)",
         "aktiv": k["rendite_letzter_monat"] < -var["montecarlo_pct"],
         "wert": pct(k["rendite_letzter_monat"], vorzeichen=True) + " gegen " + pct(-var["montecarlo_pct"])},
    ]
    return liste, sma


def einzelanalyse(cfg: dict, kurse: pd.DataFrame, werte: pd.DataFrame, vorher: pd.DataFrame,
                  renditen: pd.DataFrame, events: list[dict], fenster: int = 36) -> dict:
    """Kennzahlen und Zeitreihen je Position fuer die Detailansicht."""
    ids = [p["id"] for p in cfg["positionen"]]
    gesamt = werte.sum(axis=1)
    depot_r = gesamt.pct_change().dropna()
    # Renditebeitrag: Wertaenderung der Position vor Umschichtung / Depotwert Vormonat
    beitrag = (vorher - werte.shift(1)).iloc[1:].div(gesamt.shift(1).iloc[1:], axis=0)
    # Risikobeitrag: Anteil an der Depotvarianz (aktuelle Gewichte, letzte Monate)
    w = (werte.iloc[-1] / gesamt.iloc[-1])[ids]
    cov = renditen[ids].tail(fenster).cov()
    marg = cov @ w
    var_depot = float(w @ marg)
    risikobeitrag = w * marg / var_depot
    aktien_ids = [p["id"] for p in cfg["positionen"] if p["klasse"] == "Aktien"]
    out = {}
    for p in cfg["positionen"]:
        i = p["id"]
        r = renditen[i]
        jahre = len(r) / 12
        idx = (1 + r).cumprod()
        idx = pd.concat([pd.Series([1.0], index=[kurse.index[0]]), idx])
        dd = idx / idx.cummax() - 1
        rt = r.tail(fenster)
        beta = float(rt.cov(depot_r.tail(fenster)) / depot_r.tail(fenster).var())
        out[i] = {
            "rendite_pa": round(float(idx.iloc[-1] ** (1 / jahre) - 1), 4),
            "rendite_gesamt": round(float(idx.iloc[-1] - 1), 4),
            "volatilitaet_pa": round(float(r.std(ddof=1) * math.sqrt(12)), 4),
            "max_drawdown": round(float(dd.min()), 4),
            "max_drawdown_datum": dd.idxmin().strftime("%Y-%m"),
            "bester_monat": [r.idxmax().strftime("%Y-%m"), round(float(r.max()), 4)],
            "schlechtester_monat": [r.idxmin().strftime("%Y-%m"), round(float(r.min()), 4)],
            "korrelation_depot": round(float(rt.corr(depot_r.tail(fenster))), 2),
            "beta_depot": round(beta, 2),
            "renditebeitrag_pp": round(float(beitrag[i].sum() * 100), 2),
            "risikobeitrag": round(float(risikobeitrag[i]), 4),
            "zeitreihe": [{"datum": d.strftime("%Y-%m"), "index": round(float(idx.loc[d] * 100), 2),
                           "gewicht": round(float(werte.loc[d, i] / gesamt.loc[d]), 4),
                           "drawdown": round(float(dd.loc[d]), 4)} for d in kurse.index],
            "umschichtungen": [{"datum": e["datum"], "grund": e["grund"], "betrag": e["trades"][i]}
                               for e in events],
        }
    return {"positionen": out, "renditebeitrag_summe_pp": round(float(beitrag.sum().sum() * 100), 2),
            "depot_renditen_summe_pp": round(float(depot_r.sum() * 100), 2)}


# ---------------------------------------------------------------------------
def berechnen(quelle: str, bis: str | None = None) -> dict:
    cfg = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
    kurse = simulierte_kurse(cfg, bis) if quelle == "simuliert" else csv_kurse(cfg)
    werte, vorher, aktienquote, events = fortschreiben(cfg, kurse)
    renditen = fondsrenditen(cfg, kurse)
    gesamt = werte.sum(axis=1)
    k, dd = kennzahlen(gesamt, cfg["risikofreier_zins_pa"])
    var = value_at_risk(werte, renditen, cfg["warnregeln"]["var_konfidenz"])
    warn, sma = warnungen(cfg, k, aktienquote, werte, var)
    ids_aktien = [p["id"] for p in cfg["positionen"] if p["klasse"] == "Aktien"]
    aktien = werte[ids_aktien].sum(axis=1)
    return {
        "meta": {"name": cfg["name"], "stand": kurse.index[-1].strftime("%Y-%m-%d"),
                 "start": kurse.index[0].strftime("%Y-%m-%d"), "startkapital": cfg["startkapital"],
                 "quelle": "Simulierte Testdaten" if quelle == "simuliert" else "Monatsendkurse (CSV)",
                 "testdaten": quelle == "simuliert", "zielquote_aktien": cfg["zielquote_aktien"],
                 "toleranzband_pp": cfg["toleranzband_aktien_pp"], "rebalancing": cfg["rebalancing"]},
        "kennzahlen": k,
        "zeitreihe": [{"datum": d.strftime("%Y-%m"), "index": round(float(v / gesamt.iloc[0] * 100), 2),
                       "drawdown": round(float(dd.loc[d]), 4), "aktienquote": round(float(aktienquote.loc[d]), 4),
                       "aktien_index": round(float(aktien.loc[d] / aktien.iloc[0] * 100), 2),
                       "aktien_sma": None if pd.isna(sma.loc[d]) else round(float(sma.loc[d] / aktien.iloc[0] * 100), 2)}
                      for d, v in gesamt.items()],
        "allokation": allokation(cfg, werte),
        "aktienquote": round(float(aktienquote.iloc[-1]), 4),
        "var": var,
        "stresstests": stresstests(cfg, werte),
        "rebalancing": [{k2: v2 for k2, v2 in e.items() if k2 != "trades"} for e in events],
        "warnungen": warn,
        "einzel": einzelanalyse(cfg, kurse, werte, vorher, renditen, events),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quelle", choices=["simuliert", "csv"], default="simuliert")
    ap.add_argument("--bis", help="Stichtag JJJJ-MM-TT (nur simuliert)")
    ap.add_argument("--out", default=str(ROOT / "site" / "data.json"))
    a = ap.parse_args()
    data = berechnen(a.quelle, a.bis)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    aktiv = [w["regel"] for w in data["warnungen"] if w["aktiv"]]
    print(f"Stand {data['meta']['stand']}: Wert {data['kennzahlen']['wert']:,.0f} €, aktive Warnungen: {aktiv or 'keine'}")


if __name__ == "__main__":
    main()
