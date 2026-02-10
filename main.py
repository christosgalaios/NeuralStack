import json
import logging
import os
from datetime import datetime
from pathlib import Path

from agents.discovery import DiscoveryAgent
from agents.content import ContentAgent
from agents.validation import ValidationAgent
from agents.distribution import DistributionAgent


BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
SITE_DIR = BASE_DIR / "site"
POSTS_DIR = SITE_DIR / "posts"
LOG_FILE = DATA_DIR / "pipeline.log"
PERFORMANCE_FILE = DATA_DIR / "performance.json"
TOPICS_FILE = DATA_DIR / "topics.json"


def setup_logging() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LOG_FILE.touch(exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(LOG_FILE, encoding="utf-8"),
            logging.StreamHandler(),
        ],
    )


def ensure_initial_files() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SITE_DIR.mkdir(parents=True, exist_ok=True)
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    if not TOPICS_FILE.exists():
        TOPICS_FILE.write_text("[]", encoding="utf-8")

    if not PERFORMANCE_FILE.exists():
        PERFORMANCE_FILE.write_text(
            json.dumps(
                {
                    "runs": [],
                    "articles_published": 0,
                    "last_run": None,
                    "errors": [],
                },
                indent=2,
            ),
            encoding="utf-8",
        )

    index_file = SITE_DIR / "index.md"
    if not index_file.exists():
        index_file.write_text(
            "# NeuralStack Autonomous Tech Insights\n\n"
            "Welcome to an automatically updated collection of deep-dive articles on\n"
            "developer tools, compatibility guides, and translated tech insights.\n\n"
            "New long-form posts are generated and validated daily.\n",
            encoding="utf-8",
        )


def load_performance() -> dict:
    try:
        return json.loads(PERFORMANCE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"runs": [], "articles_published": 0, "last_run": None, "errors": []}


def save_performance(data: dict) -> None:
    PERFORMANCE_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def run_pipeline() -> None:
    setup_logging()
    ensure_initial_files()

    performance = load_performance()
    run_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": "started",
        "generated_topics": 0,
        "generated_articles": 0,
        "published_articles": 0,
        "errors": [],
    }

    try:
        logging.info("Starting DiscoveryAgent.")
        discovery = DiscoveryAgent(DATA_DIR)
        new_topics = discovery.run()
        run_entry["generated_topics"] = len(new_topics)

        logging.info("Starting ContentAgent.")
        content = ContentAgent(DATA_DIR, POSTS_DIR)
        drafts = content.run(new_topics)
        run_entry["generated_articles"] = len(drafts)

        logging.info("Starting ValidationAgent.")
        validator = ValidationAgent(DATA_DIR, POSTS_DIR)
        approved_drafts = validator.run(drafts)

        logging.info("Starting DistributionAgent.")
        distribution = DistributionAgent(DATA_DIR, SITE_DIR, POSTS_DIR)
        published_files = distribution.run(approved_drafts)
        run_entry["published_articles"] = len(published_files)

        run_entry["status"] = "success"
        logging.info("Pipeline completed successfully.")
    except Exception as exc:  # self-healing via logging + graceful failure
        logging.exception("Pipeline failed with an unhandled exception.")
        run_entry["status"] = "failed"
        run_entry["errors"].append(str(exc))
    finally:
        performance["runs"].append(run_entry)
        performance["last_run"] = run_entry["timestamp"]
        performance["articles_published"] = performance.get("articles_published", 0) + run_entry.get(
            "published_articles", 0
        )
        performance_errors = performance.get("errors", [])
        performance_errors.extend(run_entry.get("errors", []))
        performance["errors"] = performance_errors
        save_performance(performance)


if __name__ == "__main__":
    run_pipeline()

