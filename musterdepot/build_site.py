"""Erzeugt site/index.html aus template.html und site/data.json (Daten eingebettet)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "site" / "data.json").read_text(encoding="utf-8"))
html = (ROOT / "template.html").read_text(encoding="utf-8")
payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
OUT = ROOT.parent / "public" / "musterdepot"
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "index.html").write_text(html.replace("/*DATA*/null", payload), encoding="utf-8")
print("public/musterdepot/index.html geschrieben")
