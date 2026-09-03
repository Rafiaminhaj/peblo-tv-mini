import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Show, Season, Episode, Artwork, PublishRun
from app.storage import get_storage_provider
from app.validation_report import generate_validation_report

def execute_atomic_publish(db: Session, admin_id: str = "admin@peblo.tv") -> tuple[bool, str, dict]:
    """
    Executes an atomic publish job:
    1. Runs validation report - aborts if blocked.
    2. Builds catalogue JSON with content_group language collapse.
    3. Writes via storage provider using atomic temp file swap.
    4. Records PublishRun log.
    """
    report = generate_validation_report(db)
    if report["is_publish_blocked"]:
        run = PublishRun(
            admin_id=admin_id,
            shows_published_count=0,
            episodes_published_count=0,
            status="failed",
            log_message=f"Publish aborted due to {report['total_issues_count']} validation blocking issues."
        )
        db.add(run)
        db.commit()
        return False, run.log_message, report

    storage = get_storage_provider()
    shows = db.query(Show).all()
    
    sections_map = {}
    total_published_shows = 0
    total_published_episodes = 0

    for show in shows:
        if not show.section:
            continue

        section_name = show.section
        if section_name not in sections_map:
            sections_map[section_name] = []

        # Find show artwork
        poster_art = next((art.file_path for art in show.artworks if art.artwork_type == "poster"), None)
        banner_art = next((art.file_path for art in show.artworks if art.artwork_type == "banner"), None)

        show_entry = {
            "id": show.id,
            "title": show.title,
            "description": show.description,
            "category": show.category,
            "poster_url": poster_art,
            "banner_url": banner_art,
            "seasons": [],
            "trailers": [] # Season 0
        }

        for season in show.seasons:
            is_trailer_season = (season.season_number == 0)
            
            # Content group language variant collapse
            grouped_episodes = {}
            for ep in season.episodes:
                thumb_art = next((art.file_path for art in ep.artworks if art.artwork_type == "thumbnail"), None)
                
                cg = ep.content_group
                if cg not in grouped_episodes:
                    grouped_episodes[cg] = {
                        "content_group": cg,
                        "episode_number": ep.episode_number,
                        "title": ep.title,
                        "synopsis": ep.synopsis,
                        "duration_seconds": ep.duration_seconds,
                        "thumbnail_url": thumb_art,
                        "languages": [ep.language],
                        "language_variants": {
                            ep.language: {
                                "episode_id": ep.id,
                                "title": ep.title,
                                "duration_seconds": ep.duration_seconds
                            }
                        }
                    }
                else:
                    grouped_episodes[cg]["languages"].append(ep.language)
                    grouped_episodes[cg]["language_variants"][ep.language] = {
                        "episode_id": ep.id,
                        "title": ep.title,
                        "duration_seconds": ep.duration_seconds
                    }
                
                total_published_episodes += 1

            season_episodes = list(grouped_episodes.values())
            season_episodes.sort(key=lambda x: x["episode_number"])

            if is_trailer_season:
                show_entry["trailers"].extend(season_episodes)
            else:
                show_entry["seasons"].append({
                    "season_number": season.season_number,
                    "title": season.title or f"Season {season.season_number}",
                    "episodes": season_episodes
                })

        sections_map[section_name].append(show_entry)
        total_published_shows += 1

    catalogue_data = {
        "metadata": {
            "published_at": datetime.utcnow().isoformat(),
            "published_by": admin_id,
            "version": "1.0",
            "shows_count": total_published_shows,
            "episodes_count": total_published_episodes
        },
        "sections": [
            {"section_name": sec, "shows": shows_list}
            for sec, shows_list in sections_map.items()
        ]
    }

    # Atomic write
    catalogue_json_str = json.dumps(catalogue_data, indent=2)
    saved_path = storage.write_atomic_json(catalogue_json_str, "catalogue.json")

    # Record run
    run = PublishRun(
        admin_id=admin_id,
        shows_published_count=total_published_shows,
        episodes_published_count=total_published_episodes,
        status="success",
        log_message=f"Successfully published catalogue ({total_published_shows} shows, {total_published_episodes} episodes) to {saved_path}."
    )
    db.add(run)
    db.commit()

    return True, run.log_message, catalogue_data
