"""Warn-Mail: verschickt eine E-Mail, wenn eine Warnregel neu ausgeloest wurde.

Liest site/data.json, vergleicht mit data/warnstatus.json (letzter Stand) und
meldet nur Regeln, die seit dem letzten Lauf neu aktiv geworden sind. So kommt
nicht jede Woche dieselbe Mail.

Zugangsdaten kommen ausschliesslich aus Umgebungsvariablen (GitHub Secrets):
    SMTP_HOST (z. B. posteo.de), SMTP_PORT (587), SMTP_USER, SMTP_PASS, MAIL_TO
Fehlen sie, wird die Mail nur auf der Konsole ausgegeben (Trockenlauf).
"""
from __future__ import annotations

import json
import os
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATUS = ROOT / "data" / "warnstatus.json"
SEITE = "https://christoph-zapp.de/musterdepot/"  # öffentliche Projektseite


def mail_text(data: dict, neu: list[dict]) -> tuple[str, str]:
    k = data["kennzahlen"]
    betreff = f"Musterdepot: {len(neu)} Warnregel(n) ausgelöst – Stand {data['meta']['stand']}"
    zeilen = [f"Stand: {data['meta']['stand']} ({data['meta']['quelle']})", "",
              "Neu ausgelöst:"]
    zeilen += [f"  • {w['regel']}: {w['wert']}" for w in neu]
    zeilen += ["", "Weiterhin aktiv:"]
    rest = [w for w in data["warnungen"] if w["aktiv"] and w not in neu]
    zeilen += [f"  • {w['regel']}: {w['wert']}" for w in rest] or ["  –"]
    zeilen += ["", f"Depotwert: {k['wert']:,.0f} €".replace(",", "."),
               "Drawdown aktuell: " + next(w["wert"] for w in data["warnungen"] if w["id"] == "drawdown"),
               "Aktienquote: " + next(w["wert"] for w in data["warnungen"] if w["id"] == "band"),
               "", f"Details: {SEITE}",
               "", "Automatische Nachricht aus dem Musterdepot-Monitoring. Fiktives Depot, keine Anlageberatung."]
    return betreff, "\n".join(zeilen)


def senden(betreff: str, text: str) -> bool:
    host, user, pw, to = (os.environ.get(v) for v in ("SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_TO"))
    if not all([host, user, pw, to]):
        print("Trockenlauf (keine SMTP-Zugangsdaten):\n", betreff, "\n", text, sep="")
        return False
    msg = EmailMessage()
    msg["Subject"], msg["From"], msg["To"] = betreff, user, to
    msg.set_content(text)
    with smtplib.SMTP(host, int(os.environ.get("SMTP_PORT", "587")), timeout=30) as s:
        s.starttls(context=ssl.create_default_context())
        s.login(user, pw)
        s.send_message(msg)
    print("Warn-Mail verschickt an", to)
    return True


def main():
    data = json.loads((ROOT / "site" / "data.json").read_text(encoding="utf-8"))
    vorher = json.loads(STATUS.read_text(encoding="utf-8")) if STATUS.exists() else {}
    neu = [w for w in data["warnungen"] if w["aktiv"] and not vorher.get(w["id"], False)]
    if neu:
        senden(*mail_text(data, neu))
    else:
        print("Keine neu ausgelösten Warnregeln.")
    STATUS.parent.mkdir(exist_ok=True)
    STATUS.write_text(json.dumps({w["id"]: w["aktiv"] for w in data["warnungen"]}, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
