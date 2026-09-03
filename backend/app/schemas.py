from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ArtworkSchema(BaseModel):
    id: int
    artwork_type: str
    file_path: str
    width: int
    height: int
    file_size_bytes: int

    model_config = ConfigDict(from_attributes=True)


class EpisodeSchema(BaseModel):
    id: int
    title: str
    synopsis: Optional[str] = None
    duration_seconds: Optional[int] = None
    episode_number: int
    content_group: str
    language: str
    status: str
    artworks: List[ArtworkSchema] = []

    model_config = ConfigDict(from_attributes=True)


class SeasonSchema(BaseModel):
    id: int
    season_number: int
    title: Optional[str] = None
    episodes: List[EpisodeSchema] = []

    model_config = ConfigDict(from_attributes=True)


class ShowSchema(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    section: Optional[str] = None
    category: str
    status: str
    seasons: List[SeasonSchema] = []
    artworks: List[ArtworkSchema] = []

    model_config = ConfigDict(from_attributes=True)


class ShowCreate(BaseModel):
    title: str
    description: Optional[str] = None
    section: Optional[str] = None
    category: str


class EpisodeCreate(BaseModel):
    season_id: int
    title: str
    synopsis: Optional[str] = None
    duration_seconds: Optional[int] = None
    episode_number: int
    content_group: str
    language: str = "en"


class PublishRunSchema(BaseModel):
    id: int
    admin_id: str
    timestamp: datetime
    shows_published_count: int
    episodes_published_count: int
    status: str
    log_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
