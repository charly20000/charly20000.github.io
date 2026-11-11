# Musterdepot-Monitoring

Monatliches Kapitalanlagereporting und Risikoüberwachung für ein fiktives Depot mit 1 Mio. € Startkapital (80 % Aktien / 20 % Anleihen). Projekt 3 auf [christoph-zapp.de](https://christoph-zapp.de).

**Stand:** Prototyp mit simulierten Testdaten. Echte Monatskurse kommen im nächsten Schritt dazu (siehe unten).

## Aufbau im Website-Repository

| Baustein | Datei | Inhalt |
|---|---|---|
| Konfiguration | `musterdepot/config.json` | Positionen (erfundene Musterfonds), Soll-Gewichte, laufende Kosten, Duration, Toleranzband, Warnschwellen, Stressszenarien |
| Rechenkern | `musterdepot/depot.py` | Depot fortschreiben inkl. Rebalancing, Kennzahlen, VaR (historisch + Monte Carlo), Expected Shortfall, Stresstests, Warnregeln, Einzelanalyse je Fonds → `musterdepot/site/data.json` (nicht im Repo) |
| Gegenrechnung | `musterdepot/gegenrechnung.py` | Rechnet 37 Kennzahlen und Summenregeln unabhängig nach, bricht bei Abweichung ab |
| Seite | `musterdepot/template.html` + `build_site.py` | → `public/musterdepot/index.html`, erreichbar unter christoph-zapp.de/musterdepot/ |
| Excel-Fassung | `musterdepot/build_excel.py` | → `public/musterdepot/Musterdepot_Zapp.xlsx`, dieselbe Rechnung als Formeln |
| Warn-Mail (optional, nicht aktiv) | `musterdepot/alerts.py` | Würde eine Mail bei *neu* ausgelösten Regeln senden. Im Workflow bewusst nicht eingebunden. |
| Automatik | `.github/workflows/musterdepot.yml` | Montags und am 2. jedes Monats: rechnen → prüfen → bauen → committen. Danach startet `deploy.yml` und veröffentlicht die Seite. |

## Lokal ausprobieren

```bash
cd musterdepot
pip install -r requirements.txt
python depot.py --quelle simuliert
python gegenrechnung.py
python build_site.py
python build_excel.py
```

## Einmalig einrichten

Nichts nötig. Optional unter *Actions → Musterdepot aktualisieren → Run workflow* einmal manuell starten.

## Rechtliches

- **Impressum und Datenschutz:** Die Unterseite verlinkt `/#impressum` und `/#datenschutz`. Die Datenschutzerklärung nennt GitHub Pages als Hoster.
- **Cookies / § 25 TDDDG:** Keine Cookies, kein Tracking, keine Inhalte von Dritten. Die Schriften kommen lokal aus `/fonts`. Das muss so bleiben.
- **Keine Anlageberatung:** Die Fonds sind erfunden, der Hinweis auf der Seite bleibt sichtbar.
- **Kursdaten-Lizenz:** Bei der Umstellung auf echte Daten die Nutzungsbedingungen prüfen. Öffentlich nur abgeleitete Kennzahlen und indexierte Verläufe zeigen, die Quelle nennen.
- **Barrierefreiheit:** Diagramme haben Tabellenansichten, Status wird mit Symbol und Text gezeigt.

## Nächster Schritt: echte Marktdaten (Startprompt für Claude Code)

> Lies musterdepot/README.md, config.json und depot.py. Ziel: Die neun erfundenen Musterfonds sollen von echten Monatswerten getrieben werden statt von simulierten Kursen.
> 1. Schlage zwei bis drei kostenlose Datenquellen vor: je Region ein Aktienindex, für die Anleihen Renditen oder Rentenindizes. Nenne jeweils die Nutzungsbedingungen, ob eine öffentliche Darstellung abgeleiteter Werte erlaubt ist, und die Grenzen. Noch nichts bauen.
> 2. Nach meiner Auswahl: Schreibe `musterdepot/fetch_prices.py`, das die Werte ab 2021-11 holt und `musterdepot/data/kurse_monatlich.csv` schreibt. Trage die Datenreihen in config.json ein.
> 3. Ergänze im Workflow einen Abrufschritt und stelle auf `--quelle csv` um. Lass die Gegenrechnung laufen.
> 4. Für die wöchentliche Warnprüfung: Nimm den letzten verfügbaren Wert als vorläufigen Monatswert, markiere ihn auf der Seite als „vorläufig“, und ersetze ihn am Monatsende.
> Erkläre mir jeden Schritt, bevor du ihn umsetzt.

---
Fiktives Depot. Keine Anlageberatung.
