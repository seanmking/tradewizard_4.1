#!/usr/bin/env python3
import os
import logging
from supabase import create_client
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(asctime)s - SEED - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def main():
    load_dotenv()
    # Load Supabase credentials
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        logger.error("Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_KEY in .env.")
        return
    sb = create_client(url, key)

    # Fetch up to 5 assessments ready to seed (llm_ready = false and raw_content not null)
    resp = (
        sb.table("Assessments")
          .select("id")
          .eq("llm_ready", False)
          .not_.is_("raw_content", None)
          .limit(5)
          .execute()
    )
    records = resp.data or []
    if not records:
        logger.info("No assessments to seed.")
        return

    # Seed each assessment by setting llm_ready = true
    for rec in records:
        aid = rec.get("id")
        try:
            sb.table("Assessments").update({"llm_ready": True}).eq("id", aid).execute()
            logger.info(f"Seeded assessment: {aid}")
        except Exception as e:
            logger.error(f"Failed to seed {aid}: {e}")

    logger.info("Seeding complete.")

if __name__ == "__main__":
    main()
