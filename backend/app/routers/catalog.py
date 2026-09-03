import json
import os
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.storage import get_storage_provider

router = APIRouter(prefix="/catalog", tags=["Viewer Catalogue"])

@router.get("")
def get_published_catalogue():
    """
    Serves the published catalogue JSON strictly from storage.
    Fast, atomic, zero DB load per reader request.
    """
    storage = get_storage_provider()
    try:
        content_bytes = storage.read_file("catalogue.json")
        return json.loads(content_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="No published catalogue found. Please ask an administrator to trigger a publish run."
        )


@router.get("/search")
def search_catalogue(
    q: Optional[str] = Query(None, description="Search keyword for show title, episode title, category"),
    category: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    section: Optional[str] = Query(None)
):
    """
    Composite search over the published catalogue.
    Matches show title, episode title, category; all filters compose deterministically.
    """
    storage = get_storage_provider()
    try:
        content_bytes = storage.read_file("catalogue.json")
        catalogue = json.loads(content_bytes.decode("utf-8"))
    except Exception:
        return {"results": [], "total": 0}

    results = []
    q_lower = q.lower() if q else None

    for sec in catalogue.get("sections", []):
        if section and sec.get("section_name").lower() != section.lower():
            continue

        for show in sec.get("shows", []):
            if category and show.get("category").lower() != category.lower():
                continue

            show_title_match = (q_lower in show.get("title", "").lower()) if q_lower else True
            show_category_match = (q_lower in show.get("category", "").lower()) if q_lower else True
            
            matching_episodes = []
            for season in show.get("seasons", []):
                for ep in season.get("episodes", []):
                    if language and language not in ep.get("languages", []):
                        continue
                    
                    ep_title_match = (q_lower in ep.get("title", "").lower()) if q_lower else True
                    if show_title_match or show_category_match or ep_title_match:
                        matching_episodes.append(ep)

            if show_title_match or show_category_match or matching_episodes:
                show_copy = dict(show)
                show_copy["matching_episodes"] = matching_episodes
                results.append(show_copy)

    return {
        "results": results,
        "total": len(results),
        "filters_applied": {
            "q": q,
            "category": category,
            "language": language,
            "section": section
        }
    }
