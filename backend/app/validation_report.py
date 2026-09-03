from sqlalchemy.orm import Session
from app.models import Show, Season, Episode, Artwork

def generate_validation_report(db: Session) -> dict:
    """
    Generates a human-readable validation report of issues currently blocking publish.
    Grouped by category so content editors can act without asking an engineer.
    """
    shows = db.query(Show).all()
    
    missing_sections = []
    missing_artworks = []
    missing_durations = []
    duplicate_variants = []

    content_group_lang_map = {}

    for show in shows:
        # Check 1: Show section requirement
        if not show.section:
            missing_sections.append({
                "show_id": show.id,
                "title": show.title,
                "reason": "Show is missing an assigned section (e.g., 'Animated Stories', 'Learning')."
            })

        # Check 2: Show poster artwork requirement
        has_poster = any(art.artwork_type == "poster" for art in show.artworks)
        if not has_poster:
            missing_artworks.append({
                "entity_type": "show",
                "entity_id": show.id,
                "title": show.title,
                "reason": "Show is missing a required 2:3 Poster artwork."
            })

        for season in show.seasons:
            for episode in season.episodes:
                # Check 3: Episode duration requirement
                if not episode.duration_seconds or episode.duration_seconds <= 0:
                    missing_durations.append({
                        "show_title": show.title,
                        "episode_id": episode.id,
                        "title": episode.title,
                        "reason": "Episode duration is missing or 0 seconds."
                    })

                # Check 4: Episode artwork requirement
                has_thumb = any(art.artwork_type == "thumbnail" for art in episode.artworks)
                if not has_thumb:
                    missing_artworks.append({
                        "entity_type": "episode",
                        "entity_id": episode.id,
                        "title": f"{show.title} - S{season.season_number}E{episode.episode_number}: {episode.title}",
                        "reason": "Episode is missing a required 16:9 Thumbnail artwork."
                    })

                # Check 5: Duplicate (content_group, language) check
                key = (episode.content_group, episode.language)
                if key in content_group_lang_map:
                    duplicate_variants.append({
                        "content_group": episode.content_group,
                        "language": episode.language,
                        "conflicting_episodes": [
                            content_group_lang_map[key],
                            f"{show.title} - S{season.season_number}E{episode.episode_number}"
                        ],
                        "reason": f"Duplicate variant for group '{episode.content_group}' in language '{episode.language}'."
                    })
                else:
                    content_group_lang_map[key] = f"{show.title} - S{season.season_number}E{episode.episode_number}"

    is_publish_blocked = bool(
        missing_sections or missing_artworks or missing_durations or duplicate_variants
    )

    return {
        "is_publish_blocked": is_publish_blocked,
        "total_issues_count": len(missing_sections) + len(missing_artworks) + len(missing_durations) + len(duplicate_variants),
        "issues": {
            "missing_sections": missing_sections,
            "missing_artworks": missing_artworks,
            "missing_durations": missing_durations,
            "duplicate_language_variants": duplicate_variants,
        }
    }
