"""
Re-Scoring: Aktualisiert alle Jobs in Supabase mit dem neuen Scoring.
Nutzt die gleiche score_job() Logik wie scraper.py.
"""
import os
import re
import logging
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# Import scoring config from scraper
from scraper import score_job, score_related_job, Job

def main():
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Alle Jobs laden
    result = sb.table("jobs").select("*").execute()
    jobs = result.data
    log.info(f"Geladene Jobs: {len(jobs)}")

    updated = 0
    for j in jobs:
        job = Job(
            source=j["source"],
            title=j["title"] or "",
            company=j["company"] or "",
            location=j["location"] or "",
            url=j["url"],
            description=j["description"] or "",
        )
        is_verwandt = "verwandt" in (j.get("tags") or [])
        if is_verwandt:
            new_score, new_label, new_tags = score_related_job(job)
        else:
            new_score, new_label, new_tags = score_job(job)

        if new_score != j["score"] or new_label != j["score_label"]:
            sb.table("jobs").update({
                "score": new_score,
                "score_label": new_label,
                "is_relevant": new_score >= 10,
                "tags": new_tags,
            }).eq("id", j["id"]).execute()
            updated += 1

            old_emoji = {"gruen": "🟢", "gelb": "🟡", "rot": "🔴"}.get(j["score_label"], "⚪")
            new_emoji = {"gruen": "🟢", "gelb": "🟡", "rot": "🔴"}.get(new_label, "⚪")
            if new_label != j["score_label"]:
                log.info(f"  {old_emoji} {j['score']:3d} → {new_emoji} {new_score:3d} | {j['company'][:25]} | {j['title'][:50]}")

    # Zusammenfassung
    result2 = sb.table("jobs").select("score_label").execute()
    gruen = sum(1 for j in result2.data if j["score_label"] == "gruen")
    gelb = sum(1 for j in result2.data if j["score_label"] == "gelb")
    rot = sum(1 for j in result2.data if j["score_label"] == "rot")
    log.info(f"Update: {updated} Jobs geändert")
    log.info(f"Ergebnis: 🟢 {gruen} | 🟡 {gelb} | 🔴 {rot} | Gesamt: {len(result2.data)}")

if __name__ == "__main__":
    main()
