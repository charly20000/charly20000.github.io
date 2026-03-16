"""
Berliner Arbeitsmarkt-Dashboard – Job-Scraper (Playwright)
Scrapt Controller-Jobs von StepStone, Indeed, Interamt, berlin.de, bund.de.
Bewertet jeden Job mit einem Scoring-System (🟢🟡🔴).
Speichert Ergebnisse in Supabase.
"""

import os
import re
import time
import logging
from urllib.parse import quote
from dataclasses import dataclass, field
from typing import Optional

import requests as req_lib
import urllib3

# Suppress SSL warnings for Arbeitsagentur API (kein gültiges TLS-Zertifikat)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from bs4 import BeautifulSoup
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Page, Browser
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

SEARCH_QUERIES = [
    "Controller",
    "Projektcontroller",
    "Projektcontrolling",
    "Fördermittel Controller",
    "Finanzcontroller",
    "Kostenrechnung Controlling",
    "Reporting Controller",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Scoring-Konfiguration
# ---------------------------------------------------------------------------
SCORING_RULES: dict[str, list[tuple[str, int]]] = {
    "kernkompetenz": [
        (r"projektcontrolling", 15),
        (r"projekt[-\s]?controll", 15),
        (r"fördermittel", 15),
        (r"zuwendungsrecht", 12),
        (r"budgetierung", 10),
        (r"kostenrechnung", 10),
        (r"kosten-?\s?und\s?leistungsrechnung", 10),
        (r"verwendungsnachweis", 12),
        (r"mittelabruf", 10),
        (r"drittmittel", 10),
        (r"reporting", 8),
        (r"berichtswesen", 8),
        (r"controll(ing|er|erin)", 8),
        (r"finanzcontroll", 10),
        (r"beteiligungscontroll", 8),
    ],
    "branche": [
        (r"öffentlich\w*\s*(auftraggeber|verwaltung|dienst|hand)", 12),
        (r"bundesministerium|bund\b", 10),
        (r"ministerium", 10),
        (r"forschung", 8),
        (r"wissenschaft", 8),
        (r"gemeinnützig", 6),
        (r"verein|verband|stiftung", 5),
        (r"ngo|non[-\s]?profit", 5),
        (r"ggmbh|e\.?\s?v\.", 5),
    ],
    "tools": [
        (r"\bsap\b", 10),
        (r"sap.{0,5}(co|ps|fi|bw|hana|s/?4)", 12),
        (r"\betl\b", 8),
        (r"\bolap\b", 8),
        (r"\bbw\b.{0,10}(report|query|analys)", 8),
        (r"excel.{0,15}(pivot|makro|vba|advanced|fortgeschritten)", 6),
        (r"power\s?bi|tableau", 5),
        (r"\bsql\b", 5),
        (r"python", 5),
        (r"\bexcel\b", 3),
    ],
    "level": [
        (r"senior", 10),
        (r"erfahren\w*", 6),
        (r"lead|leitung", 8),
        (r"berufserfahrung.{0,20}\d+\s*jahr", 5),
        (r"referent", 5),
    ],
}

PENALTY_RULES: list[tuple[str, int]] = [
    (r"100\s*%?\s*remote|full\s*remote|remote\s*only", -15),
    (r"berufseinsteiger", -15),
]

# Ausschluss-Keywords im Titel → Score 0, komplett ignoriert
EXCLUSION_KEYWORDS = [
    # Junior / Einstieg
    r"\bjunior\b", r"\bwerkstudent\b", r"\bpraktik\w*\b", r"\btrainee\b",
    r"\bberufseinstieg\b", r"\bberufseinsteiger\w*\b",
    # Leere / generische Titel (berlin.de)
    r"^stellenbezeichnung$",
    # Schule / Bildung
    r"\blehrer\w*\b", r"\blehrkraft\b", r"\bschule\b", r"\bschul\w*",
    r"\brektor\w*\b", r"\bkonrektor\w*\b", r"\bschulleiter\w*\b", r"\bschulleitung\b",
    r"schulrektor", r"sekundarschul", r"grundschul", r"oberschul",
    r"\bbildung\b", r"\bfortbildung\b", r"fortbildung\w*koordinat",
    # Soziales / Pflege / Medizin
    r"\berzieher\w*\b", r"\bpädagog\b", r"\bkita\b",
    r"\bpflege\w*\b", r"\bkrankenpflege\b", r"\bpfleger\w*\b",
    r"\barzt\b", r"\bärztin\b", r"\bmedizin\w*\b",
    r"\bsozialarbeit\w*\b", r"\bsozialpädagog",
    # Facility / Service / Transport
    r"\bhaus(meister|wart|techniker)\b",
    r"\breinigung\b", r"\bküche\b", r"\bkoch\b",
    r"\bsekretär\b", r"\bempfang\b",
    r"\bfahrer\w*\b", r"\bbusfahrer\b", r"\blkw.?fahrer\b",
    # IT-Security (nicht Controlling)
    r"informationssicherheit",
    # Vertrieb / Finanzberatung B2C (kein Controlling)
    r"fördermittel.{0,10}vertrieb", r"fördermittel.{0,10}berater",
    r"\bfinanzberater\b", r"\bfinanzberatung\b",
    r"\bversicherungsmakler\b", r"\bversicherungsberater\b",
    r"\bimmobilienmakler\b",
    r"\btop.?closer\b", r"\bcloser\b",
    r"\bkundendienst\b.*vertrieb", r"\bvertriebsmitarbeiter\b",
    r"mandantenberater", r"customer.?relationship.?manager",
    r"\bb2c\b.*finanz", r"finanz.*\bb2c\b",
]

# Wunscharbeitgeber: Bonus +10
WUNSCH_ARBEITGEBER = [
    r"50\s?hertz",
    r"\bbsr\b|berliner\s+stadtreinigung",
    r"\bbew\b|berliner\s+energiewerke|berliner\s+stadtwerke",
    r"\bgewobag\b",
    r"stadtwerke.*berlin|berliner\s+stadtwerke",
    r"\bbvg\b|berliner\s+verkehrsbetriebe",
    r"\bdegewo\b",
    r"\bhowoge\b",
    r"\bvivantes\b",
    r"\bcharité\b",
]

BERLIN_PATTERNS = [
    r"\bberlin\b",
    r"\bpotsdam\b",
]

# ---------------------------------------------------------------------------
# Verwandte Berufe – Suchbegriffe & eigenes Scoring
# ---------------------------------------------------------------------------
RELATED_SEARCH_QUERIES = [
    "Business Analyst",
    "Data Analyst",
    "Projektmanager öffentliche Verwaltung",
    "Finanzreferent",
    "Grants Manager",
    "Reporting Analyst",
    "Compliance Manager",
    "Risikomanagement",
]

RELATED_SCORING_RULES: dict[str, list[tuple[str, int]]] = {
    "kernkompetenz": [
        (r"business\s?analyst", 15),
        (r"data\s?analyst", 15),
        (r"projektmanag", 12),
        (r"finanzreferent", 15),
        (r"grants?\s?manag", 15),
        (r"reporting\s?analyst", 15),
        (r"compliance", 12),
        (r"risikomanag", 12),
        (r"fördermittel", 12),
        (r"zuwendungsrecht", 10),
        (r"budgetierung", 10),
        (r"kostenrechnung", 8),
        (r"berichtswesen", 8),
        (r"reporting", 8),
        (r"datenanalyse|data\s?analysis", 10),
        (r"finanzcontroll", 10),
        (r"controll(ing|er|erin)", 8),
    ],
    "branche": [
        (r"öffentlich\w*\s*(auftraggeber|verwaltung|dienst|hand)", 15),
        (r"ngo|non[-\s]?profit", 12),
        (r"stiftung", 12),
        (r"gemeinnützig", 10),
        (r"ggmbh|e\.?\s?v\.", 8),
        (r"bundesministerium|bund\b", 10),
        (r"ministerium", 10),
        (r"forschung", 8),
    ],
    "tools": [
        (r"\bsap\b", 8),
        (r"power\s?bi|tableau", 10),
        (r"\bsql\b", 10),
        (r"python", 10),
        (r"\bexcel\b", 5),
        (r"\betl\b", 8),
        (r"machine\s?learning|ml\b", 6),
    ],
    "level": [
        (r"senior", 10),
        (r"erfahren\w*", 6),
        (r"lead|leitung", 8),
        (r"referent", 5),
    ],
}


# ---------------------------------------------------------------------------
# Datenstruktur
# ---------------------------------------------------------------------------
@dataclass
class Job:
    source: str
    title: str
    company: str
    location: str
    url: str
    description: str = ""
    salary_raw: str = ""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    posted_date: Optional[str] = None
    score: int = 0
    score_label: str = "rot"
    tags: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------
def score_job(job: Job) -> tuple[int, str, list[str]]:
    title_lower = job.title.lower()
    text = f"{job.title} {job.description}".lower()
    total = 0
    tags = []

    # Ausschluss-Keywords im Titel → sofort raus
    for pattern in EXCLUSION_KEYWORDS:
        if re.search(pattern, title_lower):
            return 0, "rot", ["ausschluss"]

    # Standort-Check: Berlin muss im location-Feld stehen
    loc_lower = job.location.lower()
    is_berlin = any(re.search(p, loc_lower) for p in BERLIN_PATTERNS)
    if not is_berlin:
        return 0, "rot", ["kein-berlin"]

    for category, rules in SCORING_RULES.items():
        for pattern, points in rules:
            if re.search(pattern, text, re.IGNORECASE):
                total += points
                tag = re.sub(r"[^a-zäöü0-9]", "", pattern.split("(")[0][:20])
                tags.append(tag)

    for pattern, points in PENALTY_RULES:
        if re.search(pattern, text, re.IGNORECASE):
            total += points
            tags.append("penalty")

    # Wunscharbeitgeber-Bonus
    company_text = f"{job.company} {job.title}".lower()
    for pattern in WUNSCH_ARBEITGEBER:
        if re.search(pattern, company_text, re.IGNORECASE):
            total += 10
            tags.append("wunscharbeitgeber")
            break

    total = max(0, min(100, total))

    if total >= 20:
        label = "gruen"
    elif total >= 10:
        label = "gelb"
    else:
        label = "rot"

    return total, label, tags


def score_related_job(job: Job) -> tuple[int, str, list[str]]:
    """Scoring für verwandte Berufe (Business Analyst, Grants Manager etc.)."""
    title_lower = job.title.lower()
    text = f"{job.title} {job.description}".lower()
    total = 0
    tags = ["verwandt"]

    for pattern in EXCLUSION_KEYWORDS:
        if re.search(pattern, title_lower):
            return 0, "rot", ["verwandt", "ausschluss"]

    loc_lower = job.location.lower()
    is_berlin = any(re.search(p, loc_lower) for p in BERLIN_PATTERNS)
    if not is_berlin:
        return 0, "rot", ["verwandt", "kein-berlin"]

    for category, rules in RELATED_SCORING_RULES.items():
        for pattern, points in rules:
            if re.search(pattern, text, re.IGNORECASE):
                total += points
                tag = re.sub(r"[^a-zäöü0-9]", "", pattern.split("(")[0][:20])
                tags.append(tag)

    for pattern, points in PENALTY_RULES:
        if re.search(pattern, text, re.IGNORECASE):
            total += points
            tags.append("penalty")

    company_text = f"{job.company} {job.title}".lower()
    for pattern in WUNSCH_ARBEITGEBER:
        if re.search(pattern, company_text, re.IGNORECASE):
            total += 10
            tags.append("wunscharbeitgeber")
            break

    total = max(0, min(100, total))

    if total >= 20:
        label = "gruen"
    elif total >= 10:
        label = "gelb"
    else:
        label = "rot"

    return total, label, tags


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def parse_salary(raw: str) -> tuple[Optional[int], Optional[int]]:
    if not raw:
        return None, None
    numbers = re.findall(r"(\d[\d.,]*)", raw.replace(".", "").replace(",", "."))
    nums = []
    for n in numbers:
        try:
            val = int(float(n))
            if val > 500:
                nums.append(val)
        except ValueError:
            pass
    if len(nums) >= 2:
        return min(nums), max(nums)
    elif len(nums) == 1:
        return nums[0], nums[0]
    return None, None


def get_page_soup(page: Page, url: str, wait_selector: str = None, wait_ms: int = 3000) -> BeautifulSoup:
    """Navigiert zu URL, wartet auf JS-Rendering, gibt BeautifulSoup zurück."""
    try:
        page.goto(url, timeout=20000, wait_until="domcontentloaded")
        if wait_selector:
            try:
                page.wait_for_selector(wait_selector, timeout=8000)
            except Exception:
                pass
        page.wait_for_timeout(wait_ms)
        # Cookie-Banner wegklicken falls vorhanden
        for btn_text in ["Alle akzeptieren", "Accept all", "Akzeptieren", "Alle Cookies akzeptieren"]:
            try:
                btn = page.get_by_text(btn_text, exact=False).first
                if btn and btn.is_visible():
                    btn.click()
                    page.wait_for_timeout(500)
                    break
            except Exception:
                pass
        return BeautifulSoup(page.content(), "html.parser")
    except Exception as e:
        log.warning(f"Page load failed: {url} – {e}")
        return BeautifulSoup("", "html.parser")


def fetch_description_pw(page: Page, url: str) -> str:
    """Lädt Stellenbeschreibung per Playwright."""
    try:
        page.goto(url, timeout=15000, wait_until="domcontentloaded")
        page.wait_for_timeout(2000)
        # Cookie-Banner
        for btn_text in ["Alle akzeptieren", "Accept all", "Akzeptieren"]:
            try:
                btn = page.get_by_text(btn_text, exact=False).first
                if btn and btn.is_visible():
                    btn.click()
                    page.wait_for_timeout(500)
                    break
            except Exception:
                pass
        soup = BeautifulSoup(page.content(), "html.parser")
        # Entferne Navigation/Header/Footer
        for tag in soup.select("nav, header, footer, script, style"):
            tag.decompose()
        selectors = [
            "div[data-at='job-description']",
            "div.jobsearch-jobDescriptionText",
            "div.listing-content",
            "div.job-description",
            "div.stellenbeschreibung",
            "article",
            "main",
        ]
        for sel in selectors:
            el = soup.select_one(sel)
            if el and len(el.get_text(strip=True)) > 100:
                return el.get_text(" ", strip=True)[:5000]
        return soup.get_text(" ", strip=True)[:3000]
    except Exception as e:
        log.debug(f"Description fetch failed: {url} – {e}")
        return ""


# ---------------------------------------------------------------------------
# Scraper: StepStone (Playwright)
# ---------------------------------------------------------------------------
def scrape_stepstone(page: Page, query: str, max_pages: int = 2) -> list[Job]:
    jobs = []
    for pg in range(1, max_pages + 1):
        q_slug = query.lower().replace(" ", "-").replace("ö", "oe").replace("ü", "ue").replace("ä", "ae")
        url = f"https://www.stepstone.de/jobs/{q_slug}/in-berlin?page={pg}"
        log.info(f"[StepStone] {url}")

        soup = get_page_soup(page, url, wait_selector="article", wait_ms=4000)

        # Verschiedene Selektoren für Job-Cards
        articles = soup.select("article[data-at='job-item']")
        if not articles:
            articles = soup.select("article")
        if not articles:
            articles = soup.select("div[data-testid='job-item']")

        for item in articles:
            try:
                # Titel
                title_tag = item.select_one(
                    "a[data-at='job-item-title'], h2 a, h3 a, "
                    "[data-at='job-item-title'], a[href*='/stellenangebote']"
                )
                if not title_tag:
                    continue
                title = title_tag.get_text(strip=True)
                if not title or len(title) < 3:
                    continue

                href = title_tag.get("href", "")
                if not href:
                    continue
                if not href.startswith("http"):
                    href = "https://www.stepstone.de" + href

                # Firma
                company_tag = item.select_one(
                    "[data-at='job-item-company-name'], "
                    "span[class*='company'], div[class*='company']"
                )
                company = company_tag.get_text(strip=True) if company_tag else ""

                # Ort
                location_tag = item.select_one(
                    "[data-at='job-item-location'], "
                    "span[class*='location'], div[class*='location']"
                )
                location = location_tag.get_text(strip=True) if location_tag else "Berlin"

                jobs.append(Job(
                    source="stepstone",
                    title=title[:300],
                    company=company[:200],
                    location=location[:200],
                    url=href.split("?")[0][:500],
                ))
            except Exception as e:
                log.debug(f"StepStone parse error: {e}")

        time.sleep(1)

    log.info(f"[StepStone] {len(jobs)} Jobs für '{query}'")
    return jobs


# ---------------------------------------------------------------------------
# Scraper: Indeed (Playwright)
# ---------------------------------------------------------------------------
def scrape_indeed(page: Page, query: str, max_pages: int = 2) -> list[Job]:
    jobs = []
    for pg in range(max_pages):
        start = pg * 10
        url = f"https://de.indeed.com/jobs?q={quote(query)}&l=Berlin&start={start}"
        log.info(f"[Indeed] {url}")

        soup = get_page_soup(page, url, wait_selector="div.job_seen_beacon", wait_ms=4000)

        cards = soup.select("div.job_seen_beacon")
        if not cards:
            cards = soup.select("div[class*='jobCard']")
        if not cards:
            cards = soup.select("td.resultContent")

        for card in cards:
            try:
                title_tag = card.select_one(
                    "h2.jobTitle a, a.jcs-JobTitle, "
                    "h2 a, a[data-jk]"
                )
                if not title_tag:
                    continue
                title = title_tag.get_text(strip=True)
                if not title:
                    continue

                href = title_tag.get("href", "")
                if href and not href.startswith("http"):
                    href = "https://de.indeed.com" + href

                company_tag = card.select_one(
                    "span[data-testid='company-name'], span.companyName, "
                    "span[class*='company']"
                )
                company = company_tag.get_text(strip=True) if company_tag else ""

                location_tag = card.select_one(
                    "div[data-testid='text-location'], div.companyLocation"
                )
                location = location_tag.get_text(strip=True) if location_tag else "Berlin"

                salary_tag = card.select_one(
                    "div.salary-snippet-container, "
                    "div[class*='salary'], span[class*='salary']"
                )
                salary_raw = salary_tag.get_text(strip=True) if salary_tag else ""

                jobs.append(Job(
                    source="indeed",
                    title=title[:300],
                    company=company[:200],
                    location=location[:200],
                    url=href[:500],
                    salary_raw=salary_raw,
                ))
            except Exception as e:
                log.debug(f"Indeed parse error: {e}")

        time.sleep(2)

    log.info(f"[Indeed] {len(jobs)} Jobs für '{query}'")
    return jobs


# ---------------------------------------------------------------------------
# Scraper: Interamt (Öffentlicher Dienst)
# ---------------------------------------------------------------------------
def scrape_interamt(page: Page, query: str, max_pages: int = 2) -> list[Job]:
    jobs = []
    for pg in range(1, max_pages + 1):
        url = (
            f"https://www.interamt.de/koop/app/trefferliste"
            f"?1_FTEXT={quote(query)}"
            f"&1_EINSATZORT=Berlin"
            f"&page={pg}"
        )
        log.info(f"[Interamt] {url}")

        soup = get_page_soup(page, url, wait_ms=6000)

        # Interamt rendert Ergebnisse als Links zu Einzelstellen
        # Verschiedene Selektoren für verschiedene Layouts
        cards = soup.select("div.stellenangebot, div.result-item, tr.result-row")
        if not cards:
            cards = soup.select("div[class*='stellen'], div[class*='treffer'], div[class*='result']")

        # Fallback: Alle Links die auf /koop/app/stelle? zeigen
        stelle_links = soup.select("a[href*='/koop/app/stelle?']")
        if not cards and not stelle_links:
            # Zweiter Fallback: alle Links im main-Bereich
            main = soup.select_one("main, div#content, div[role='main'], div.content")
            if main:
                stelle_links = main.select("a[href*='stelle']")

        # Verarbeite Stellen-Links
        seen_urls = set()
        for link in stelle_links:
            try:
                title = link.get_text(strip=True)
                href = link.get("href", "")
                if not title or len(title) < 5 or not href:
                    continue
                if not href.startswith("http"):
                    href = "https://www.interamt.de" + href
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                # Versuche Arbeitgeber aus dem umgebenden Element zu extrahieren
                parent = link.find_parent(["div", "tr", "li"])
                company = ""
                if parent:
                    company_tag = parent.select_one(
                        "span.arbeitgeber, td.arbeitgeber, div.employer, "
                        "span[class*='arbeitgeber'], span[class*='company']"
                    )
                    if company_tag:
                        company = company_tag.get_text(strip=True)

                jobs.append(Job(
                    source="interamt",
                    title=title[:300],
                    company=company[:200],
                    location="Berlin",
                    url=href[:500],
                ))
            except Exception as e:
                log.debug(f"Interamt parse error: {e}")

        # Verarbeite Karten/Zeilen
        for card in cards:
            try:
                link = card.select_one("a[href*='/stelle'], a[href*='trefferliste']")
                if not link:
                    link = card.select_one("a")
                if not link:
                    continue
                title = link.get_text(strip=True)
                href = link.get("href", "")

                if not title or len(title) < 5:
                    continue
                if not href:
                    continue
                if not href.startswith("http"):
                    href = "https://www.interamt.de" + href
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                company_tag = card.select_one(
                    "span.arbeitgeber, td.arbeitgeber, div.employer, "
                    "span[class*='arbeitgeber'], span[class*='company']"
                )
                company = company_tag.get_text(strip=True) if company_tag else ""

                jobs.append(Job(
                    source="interamt",
                    title=title[:300],
                    company=company[:200],
                    location="Berlin",
                    url=href[:500],
                ))
            except Exception as e:
                log.debug(f"Interamt parse error: {e}")

        time.sleep(2)

    log.info(f"[Interamt] {len(jobs)} Jobs für '{query}'")
    return jobs


# ---------------------------------------------------------------------------
# Scraper: berlin.de Karriere (Land Berlin)
# ---------------------------------------------------------------------------
def scrape_berlin_de(page: Page, query: str) -> list[Job]:
    jobs = []
    url = f"https://www.berlin.de/karriereportal/stellensuche/?keyword={quote(query)}"
    log.info(f"[berlin.de] {url}")

    soup = get_page_soup(page, url, wait_ms=6000)

    seen_urls = set()

    # Primär: Links die auf Stellen-Detailseiten zeigen
    detail_links = soup.select(
        "a[href*='stellensuche/'], "
        "a[href*='karriereportal/stellen'], "
        "a[href*='/karriereportal/']"
    )

    for link in detail_links:
        try:
            title = link.get_text(strip=True)
            if not title or len(title) < 5:
                continue
            href = link.get("href", "")
            if not href:
                continue
            if not href.startswith("http"):
                href = "https://www.berlin.de" + href

            # Filtere Navigation-Links raus
            if "keyword=" in href or href.endswith("/stellensuche/"):
                continue
            # Nur Detail-Links (nicht die Suchseite selbst)
            if "/stellensuche/?" in href and "detail" not in href.lower() and "/stellen." not in href:
                continue

            if href in seen_urls:
                continue
            seen_urls.add(href)

            jobs.append(Job(
                source="berlin.de",
                title=title[:300],
                company="Land Berlin",
                location="Berlin",
                url=href[:500],
            ))
        except Exception as e:
            log.debug(f"berlin.de parse error: {e}")

    # Fallback: generische Ergebnis-Container
    cards = soup.select("div.block, li.result-item, div.stellenangebot, div[class*='result']")
    for card in cards:
        try:
            a_tag = card.select_one("a")
            if not a_tag:
                continue
            title = a_tag.get_text(strip=True)
            href = a_tag.get("href", "")
            if not title or len(title) < 5 or not href:
                continue
            if not href.startswith("http"):
                href = "https://www.berlin.de" + href
            if "karriereportal" not in href and "stellen" not in href:
                continue
            if href in seen_urls:
                continue
            seen_urls.add(href)

            jobs.append(Job(
                source="berlin.de",
                title=title[:300],
                company="Land Berlin",
                location="Berlin",
                url=href[:500],
            ))
        except Exception:
            pass

    log.info(f"[berlin.de] {len(jobs)} Jobs für '{query}'")
    return jobs


# ---------------------------------------------------------------------------
# Scraper: bund.de / service.bund.de (Bundesverwaltung)
# ---------------------------------------------------------------------------
def scrape_bund(page: Page, query: str) -> list[Job]:
    jobs = []
    seen_urls = set()

    # Methode 1: service.bund.de Stellensuche (neue URL-Struktur)
    url = (
        f"https://www.service.bund.de/Content/DE/Stellen/Suche/Formular.html"
        f"?nn=4641514&suchbegriff={quote(query)}"
        f"&ort=Berlin&umkreis=25"
    )
    log.info(f"[bund.de] {url}")

    soup = get_page_soup(page, url, wait_ms=6000)

    # Ergebnisliste: verschiedene Selektoren
    links = soup.select(
        "a[href*='Stellenangebote'], "
        "a[href*='stellenangebote'], "
        "a[href*='/IMPORTE/'], "
        "a[href*='stelle']"
    )
    # Auch generische Ergebnis-Container
    result_divs = soup.select(
        "div.result-list div, div.resultList div, "
        "ul.result-list li, table.resultList tr, "
        "div[class*='result'] div[class*='item'], "
        "div[class*='treffer']"
    )

    for link in links:
        try:
            title = link.get_text(strip=True)
            if not title or len(title) < 5:
                continue
            href = link.get("href", "")
            if not href:
                continue
            if not href.startswith("http"):
                href = "https://www.service.bund.de" + href
            # Filtere Navigations- und Such-Links raus
            if any(x in href.lower() for x in ["formular", "ergebnis.html", "suche"]):
                continue
            if href in seen_urls:
                continue
            seen_urls.add(href)

            jobs.append(Job(
                source="bund.de",
                title=title[:300],
                company="Bundesverwaltung",
                location="Berlin",
                url=href[:500],
            ))
        except Exception as e:
            log.debug(f"bund.de parse error: {e}")

    for div in result_divs:
        try:
            a_tag = div.select_one("a")
            if not a_tag:
                continue
            title = a_tag.get_text(strip=True)
            href = a_tag.get("href", "")
            if not title or len(title) < 5 or not href:
                continue
            if not href.startswith("http"):
                href = "https://www.service.bund.de" + href
            if any(x in href.lower() for x in ["formular", "ergebnis", "suche"]):
                continue
            if href in seen_urls:
                continue
            seen_urls.add(href)

            jobs.append(Job(
                source="bund.de",
                title=title[:300],
                company="Bundesverwaltung",
                location="Berlin",
                url=href[:500],
            ))
        except Exception:
            pass

    # Methode 2: Fallback über alte URL
    if len(jobs) == 0:
        url2 = (
            f"https://www.service.bund.de/IMPORTE/Stellenangebote/editor/"
            f"Stellenangebote/ergebnis.html"
            f"?nn=4642046&suchbegriff={quote(query)}"
            f"&ort=Berlin&umkreis=25"
        )
        log.info(f"[bund.de fallback] {url2}")
        soup2 = get_page_soup(page, url2, wait_ms=5000)

        for link in soup2.select("a[href*='Stellenangebote']"):
            try:
                title = link.get_text(strip=True)
                if not title or len(title) < 5:
                    continue
                href = link.get("href", "")
                if not href:
                    continue
                if not href.startswith("http"):
                    href = "https://www.service.bund.de" + href
                if "ergebnis" in href or "suche" in href.lower():
                    continue
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                jobs.append(Job(
                    source="bund.de",
                    title=title[:300],
                    company="Bundesverwaltung",
                    location="Berlin",
                    url=href[:500],
                ))
            except Exception as e:
                log.debug(f"bund.de fallback parse error: {e}")

    log.info(f"[bund.de] {len(jobs)} Jobs für '{query}'")
    return jobs


# ---------------------------------------------------------------------------
# Scraper: Arbeitsagentur (REST API – kein Playwright nötig)
# ---------------------------------------------------------------------------
def scrape_arbeitsagentur(page: Page, query: str, max_pages: int = 2) -> list[Job]:
    """Nutzt die offizielle REST API der Bundesagentur für Arbeit."""
    jobs = []
    api_url = "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs"
    headers = {
        "X-API-Key": "jobboerse-jobsuche",
        "User-Agent": "Mozilla/5.0 (compatible; JobDashboard/1.0)",
    }

    for pg in range(1, max_pages + 1):
        params = {
            "was": query,
            "wo": "Berlin",
            "umkreis": 25,
            "page": pg,
            "size": 25,
            "angebotsart": 1,
            "pav": "false",
        }
        log.info(f"[Arbeitsagentur API] query={query}, page={pg}")

        try:
            resp = req_lib.get(api_url, headers=headers, params=params, timeout=20, verify=False)
            if resp.status_code != 200:
                log.warning(f"[Arbeitsagentur API] HTTP {resp.status_code}")
                continue

            data = resp.json()
            stellenangebote = data.get("stellenangebote", [])
            if not stellenangebote:
                log.info(f"[Arbeitsagentur API] Keine Ergebnisse für '{query}' page {pg}")
                break

            for s in stellenangebote:
                title = s.get("titel", "").strip()
                if not title or len(title) < 5:
                    continue

                company = s.get("arbeitgeber", "").strip()
                arbeitsort = s.get("arbeitsort", {})
                location = arbeitsort.get("ort", "Berlin")
                if arbeitsort.get("plz"):
                    location = f"{location} ({arbeitsort['plz']})"

                refnr = s.get("refnr", "")
                hashid = s.get("hashId", "")
                if hashid:
                    url = f"https://www.arbeitsagentur.de/jobsuche/jobdetail/{hashid}"
                elif refnr:
                    url = f"https://www.arbeitsagentur.de/jobsuche/jobdetail/{refnr}"
                else:
                    continue

                jobs.append(Job(
                    source="arbeitsagentur",
                    title=title[:300],
                    company=company[:200],
                    location=location[:200],
                    url=url[:500],
                ))

            log.info(f"[Arbeitsagentur API] {len(stellenangebote)} Jobs auf Seite {pg}")
            total = data.get("maxErgebnisse", 0)
            if pg * 25 >= total:
                break

        except Exception as e:
            log.warning(f"[Arbeitsagentur API] Fehler: {e}")

        time.sleep(1)

    log.info(f"[Arbeitsagentur] {len(jobs)} Jobs für '{query}'")
    return jobs


# ---------------------------------------------------------------------------
# Scraper: wir-in-berlin.de
# ---------------------------------------------------------------------------
def scrape_wir_in_berlin(page: Page, query: str) -> list[Job]:
    jobs = []
    url = f"https://www.wir-in-berlin.de/stellenangebote?q={quote(query)}"
    log.info(f"[wir-in-berlin] {url}")

    soup = get_page_soup(page, url, wait_ms=6000)

    # Debug: Seite loggen
    page_text = soup.get_text(" ", strip=True)[:200]
    log.info(f"[wir-in-berlin] Page preview: {page_text}")

    seen_urls = set()

    # Breitere Selektor-Suche
    all_links = soup.select("a[href]")
    for link in all_links:
        try:
            href = link.get("href", "")
            title = link.get_text(strip=True)
            if not title or len(title) < 5 or not href:
                continue
            # Nur Links die auf Stellen/Jobs zeigen
            href_lower = href.lower()
            if not any(kw in href_lower for kw in [
                "stellenangebot", "stelle", "job", "karriere", "position"
            ]):
                continue
            # Navigation/Menü-Links filtern
            if any(kw in href_lower for kw in [
                "login", "registr", "impressum", "datenschutz", "kontakt",
                "agb", "cookie", "newsletter"
            ]):
                continue

            if not href.startswith("http"):
                href = "https://www.wir-in-berlin.de" + href
            if href in seen_urls:
                continue
            seen_urls.add(href)

            # Firma aus Eltern-Element extrahieren
            parent = link.find_parent(["div", "li", "article", "section"])
            company = ""
            if parent:
                company_tag = parent.select_one(
                    "span.company, div.employer, span.arbeitgeber, "
                    "span[class*='company'], span[class*='employer'], "
                    "div[class*='company'], p[class*='company']"
                )
                if company_tag:
                    company = company_tag.get_text(strip=True)

            jobs.append(Job(
                source="wir-in-berlin",
                title=title[:300],
                company=company[:200],
                location="Berlin",
                url=href[:500],
            ))
        except Exception as e:
            log.debug(f"wir-in-berlin parse error: {e}")

    log.info(f"[wir-in-berlin] {len(jobs)} Jobs für '{query}'")
    return jobs


# ---------------------------------------------------------------------------
# Scraper: jobvector.de (Controlling Berlin)
# ---------------------------------------------------------------------------
def scrape_jobvector(page: Page, query: str, max_pages: int = 2) -> list[Job]:
    jobs = []
    for pg in range(1, max_pages + 1):
        url = (
            f"https://www.jobvector.de/jobs/{quote(query)}"
            f"?locname=Berlin&radius=30&page={pg}"
        )
        log.info(f"[jobvector] {url}")

        soup = get_page_soup(page, url, wait_ms=5000)

        # Debug: Log page preview
        page_text = soup.get_text(" ", strip=True)[:200]
        log.info(f"[jobvector] Page preview: {page_text}")

        seen_urls = set()

        # Breitere Selektoren
        cards = soup.select(
            "div.job-item, article.job, div.search-result, "
            "li.result-item, div[class*='job'], div[class*='result'], "
            "div[class*='listing']"
        )

        # Fallback: Links zu Stellenanzeigen
        if not cards:
            job_links = soup.select(
                "a[href*='/stelle/'], a[href*='/job/'], "
                "a[href*='/stellenanzeige/'], a[href*='/anzeige/']"
            )
            for link in job_links:
                try:
                    title = link.get_text(strip=True)
                    href = link.get("href", "")
                    if not title or len(title) < 5 or not href:
                        continue
                    if not href.startswith("http"):
                        href = "https://www.jobvector.de" + href
                    if href in seen_urls:
                        continue
                    seen_urls.add(href)

                    jobs.append(Job(
                        source="jobvector",
                        title=title[:300],
                        company="",
                        location="Berlin",
                        url=href.split("?")[0][:500],
                    ))
                except Exception as e:
                    log.debug(f"jobvector link parse error: {e}")

        for card in cards:
            try:
                link = card.select_one(
                    "a[href*='/stelle/'], a[href*='/job/'], "
                    "a[href*='/stellenanzeige/'], h2 a, h3 a, a"
                )
                if not link:
                    continue
                title = link.get_text(strip=True)
                href = link.get("href", "")

                if not title or len(title) < 5:
                    continue
                if not href:
                    continue
                if not href.startswith("http"):
                    href = "https://www.jobvector.de" + href
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                company_tag = card.select_one(
                    "span.company-name, div.company, span.employer, "
                    "span[class*='company'], div[class*='company']"
                )
                company = company_tag.get_text(strip=True) if company_tag else ""

                location_tag = card.select_one(
                    "span.location, div.location, span.job-location, "
                    "span[class*='location'], div[class*='location']"
                )
                location = location_tag.get_text(strip=True) if location_tag else "Berlin"

                jobs.append(Job(
                    source="jobvector",
                    title=title[:300],
                    company=company[:200],
                    location=location[:200],
                    url=href.split("?")[0][:500],
                ))
            except Exception as e:
                log.debug(f"jobvector parse error: {e}")

        time.sleep(2)

    log.info(f"[jobvector] {len(jobs)} Jobs für '{query}'")
    return jobs


# ---------------------------------------------------------------------------
# Deduplizierung
# ---------------------------------------------------------------------------
def deduplicate(jobs: list[Job]) -> list[Job]:
    seen = set()
    unique = []
    for job in jobs:
        key = job.url.split("?")[0].rstrip("/")
        if key not in seen:
            seen.add(key)
            unique.append(job)
    log.info(f"Deduplizierung: {len(jobs)} → {len(unique)} Jobs")
    return unique


# ---------------------------------------------------------------------------
# Supabase Upload
# ---------------------------------------------------------------------------
def upload_to_supabase(jobs: list[Job], supabase: Client) -> int:
    inserted = 0
    for job in jobs:
        row = {
            "source": job.source,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "url": job.url,
            "description": job.description[:5000] if job.description else None,
            "salary_raw": job.salary_raw or None,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "posted_date": job.posted_date,
            "score": job.score,
            "score_label": job.score_label,
            "is_relevant": job.score >= 25,
            "tags": job.tags,
        }
        try:
            supabase.table("jobs").upsert(row, on_conflict="url").execute()
            inserted += 1
        except Exception as e:
            log.warning(f"Supabase insert error: {e}")
    return inserted


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    log.info("=" * 60)
    log.info("Berliner Arbeitsmarkt-Dashboard – Scraper Start")
    log.info("Quellen: StepStone, Indeed, Interamt, berlin.de, bund.de,")
    log.info("         Arbeitsagentur, wir-in-berlin, jobvector")
    log.info("=" * 60)

    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL oder SUPABASE_SERVICE_KEY fehlt in .env!")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    all_jobs: list[Job] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            locale="de-DE",
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()

        # --- StepStone & Indeed: alle Suchbegriffe ---
        for query in SEARCH_QUERIES:
            log.info(f"\n--- Suche: '{query}' ---")
            all_jobs.extend(scrape_stepstone(page, query, max_pages=2))
            all_jobs.extend(scrape_indeed(page, query, max_pages=2))
            time.sleep(1)

        # --- Interamt: spezifischere Queries ---
        interamt_queries = ["Controller", "Projektcontrolling", "Fördermittel", "Finanzcontrolling"]
        for query in interamt_queries:
            all_jobs.extend(scrape_interamt(page, query, max_pages=2))
            time.sleep(1)

        # --- berlin.de ---
        berlin_queries = ["Controller", "Controlling", "Projektcontrolling"]
        for query in berlin_queries:
            all_jobs.extend(scrape_berlin_de(page, query))
            time.sleep(1)

        # --- bund.de ---
        bund_queries = ["Controller", "Projektcontrolling", "Fördermittel"]
        for query in bund_queries:
            all_jobs.extend(scrape_bund(page, query))
            time.sleep(1)

        # --- Arbeitsagentur ---
        aa_queries = ["Controller", "Projektcontrolling", "Finanzcontroller"]
        for query in aa_queries:
            all_jobs.extend(scrape_arbeitsagentur(page, query, max_pages=2))
            time.sleep(1)

        # --- wir-in-berlin.de ---
        wib_queries = ["Controller", "Controlling", "Finanzcontrolling"]
        for query in wib_queries:
            all_jobs.extend(scrape_wir_in_berlin(page, query))
            time.sleep(1)

        # --- jobvector.de ---
        jv_queries = ["Controller", "Controlling"]
        for query in jv_queries:
            all_jobs.extend(scrape_jobvector(page, query, max_pages=2))
            time.sleep(1)

        # Deduplizierung
        all_jobs = deduplicate(all_jobs)
        log.info(f"Gesamt: {len(all_jobs)} unique Controller-Jobs gefunden")

        # Beschreibungen laden + Scoring (Controller-Jobs)
        for i, job in enumerate(all_jobs):
            log.info(f"[{i+1}/{len(all_jobs)}] Details: {job.title[:60]}...")
            job.description = fetch_description_pw(page, job.url)
            job.salary_min, job.salary_max = parse_salary(job.salary_raw)
            job.score, job.score_label, job.tags = score_job(job)

            emoji = {"gruen": "🟢", "gelb": "🟡", "rot": "🔴"}.get(job.score_label, "⚪")
            log.info(f"  {emoji} Score: {job.score} | {job.company} | {job.title[:60]}")
            time.sleep(0.5)

        # === Verwandte Berufe ===
        log.info("\n" + "=" * 60)
        log.info("Verwandte Berufe – Scraping")
        log.info("=" * 60)
        related_jobs: list[Job] = []

        for query in RELATED_SEARCH_QUERIES:
            log.info(f"\n--- Verwandt: '{query}' ---")
            related_jobs.extend(scrape_stepstone(page, query, max_pages=1))
            related_jobs.extend(scrape_indeed(page, query, max_pages=1))
            related_jobs.extend(scrape_interamt(page, query, max_pages=1))
            related_jobs.extend(scrape_arbeitsagentur(page, query, max_pages=1))
            time.sleep(1)

        related_jobs = deduplicate(related_jobs)
        # Entferne Jobs, die schon in Controller-Liste sind
        controller_urls = {j.url.split("?")[0].rstrip("/") for j in all_jobs}
        related_jobs = [j for j in related_jobs if j.url.split("?")[0].rstrip("/") not in controller_urls]
        log.info(f"Verwandte Berufe: {len(related_jobs)} unique Jobs")

        for i, job in enumerate(related_jobs):
            log.info(f"[Verwandt {i+1}/{len(related_jobs)}] {job.title[:60]}...")
            job.description = fetch_description_pw(page, job.url)
            job.salary_min, job.salary_max = parse_salary(job.salary_raw)
            job.score, job.score_label, job.tags = score_related_job(job)

            emoji = {"gruen": "🟢", "gelb": "🟡", "rot": "🔴"}.get(job.score_label, "⚪")
            log.info(f"  {emoji} Score: {job.score} | {job.company} | {job.title[:60]}")
            time.sleep(0.5)

        all_jobs.extend(related_jobs)
        browser.close()

    # Upload
    count = upload_to_supabase(all_jobs, supabase)
    log.info(f"Upload: {count} Jobs in Supabase")

    # Diagnose: Jobs pro Quelle
    from collections import Counter
    source_counts = Counter(j.source for j in all_jobs)
    log.info("=" * 40)
    log.info("DIAGNOSE: Jobs pro Quelle")
    for src, cnt in source_counts.most_common():
        log.info(f"  {src}: {cnt}")
    log.info("=" * 40)

    # Zusammenfassung
    controller = [j for j in all_jobs if "verwandt" not in j.tags]
    verwandt = [j for j in all_jobs if "verwandt" in j.tags]
    gruen = sum(1 for j in all_jobs if j.score_label == "gruen")
    gelb = sum(1 for j in all_jobs if j.score_label == "gelb")
    rot = sum(1 for j in all_jobs if j.score_label == "rot")
    log.info(f"Controller-Jobs: {len(controller)} | Verwandte Berufe: {len(verwandt)}")
    log.info(f"Ergebnis: 🟢 {gruen} | 🟡 {gelb} | 🔴 {rot}")
    log.info("Fertig!")


if __name__ == "__main__":
    main()
