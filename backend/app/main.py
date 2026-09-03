import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base, SessionLocal
from app.models import Show, Season, Episode, Artwork
from app.routers import admin, catalog

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Peblo TV Mini — Backend Platform Engine",
    description="Full-Stack Miniature Streaming Platform Engine for Peblo TV Take-Home Challenge",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file storage for local uploads
os.makedirs("./storage", exist_ok=True)
app.mount("/storage", StaticFiles(directory="./storage"), name="storage")

# Include Routers
app.include_router(admin.router)
app.include_router(catalog.router)


@app.get("/health", tags=["Operability"])
def health_check():
    """Health check endpoint for container orchestrators & monitoring alerts."""
    return {
        "status": "healthy",
        "service": "peblo-tv-mini-backend",
        "database": "connected",
        "storage": os.getenv("STORAGE_PROVIDER", "local")
    }


def seed_database_if_empty():
    """Seeds 95 episode rows across 8 shows from seed_shows.json on first launch."""
    db = SessionLocal()
    try:
        if db.query(Show).count() > 0:
            return

        seed_file = "./seed_data/seed_shows.json"
        if not os.path.exists(seed_file):
            seed_file = "../seed_data/seed_shows.json"

        if os.path.exists(seed_file):
            with open(seed_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            for show_data in data.get("shows", []):
                show = Show(
                    title=show_data["title"],
                    description=show_data.get("description"),
                    section=show_data.get("section", "Animated Stories"),
                    category=show_data.get("category", "General")
                )
                db.add(show)
                db.flush()

                for season_data in show_data.get("seasons", []):
                    season = Season(
                        show_id=show.id,
                        season_number=season_data["season_number"],
                        title=season_data.get("title")
                    )
                    db.add(season)
                    db.flush()

                    for ep_data in season_data.get("episodes", []):
                        ep = Episode(
                            season_id=season.id,
                            title=ep_data["title"],
                            synopsis=ep_data.get("synopsis"),
                            duration_seconds=ep_data.get("duration_seconds", 300),
                            episode_number=ep_data["episode_number"],
                            content_group=ep_data.get("content_group", f"cg_{show.id}_{ep_data['episode_number']}"),
                            language=ep_data.get("language", "en")
                        )
                        db.add(ep)

            db.commit()
            print("Successfully seeded database with initial show catalogue!")
    finally:
        db.close()

# Trigger seeding on startup
@app.on_event("startup")
def startup_event():
    seed_database_if_empty()
