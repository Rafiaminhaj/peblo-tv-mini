from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Show(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    section = Column(String(100), nullable=True) # e.g. Animated Stories, Learning, Games
    category = Column(String(100), nullable=False) # e.g. Adventure, Math, Moral
    status = Column(String(50), default="draft") # draft, published
    created_at = Column(DateTime, default=datetime.utcnow)

    seasons = relationship("Season", back_populates="show", cascade="all, delete-orphan")
    artworks = relationship("Artwork", back_populates="show", cascade="all, delete-orphan")


class Season(Base):
    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id"), nullable=False)
    season_number = Column(Integer, nullable=False) # 0 = Trailer, 1, 2, ...
    title = Column(String(255), nullable=True)

    show = relationship("Show", back_populates="seasons")
    episodes = relationship("Episode", back_populates="season", cascade="all, delete-orphan")


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    title = Column(String(255), nullable=False)
    synopsis = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    episode_number = Column(Integer, nullable=False)
    
    # Conventions from reference.json
    content_group = Column(String(100), nullable=False) # Groups language variants together
    language = Column(String(10), nullable=False, default="en") # en, hi, ta, etc.
    status = Column(String(50), default="draft") # draft, published

    season = relationship("Season", back_populates="episodes")
    artworks = relationship("Artwork", back_populates="episode", cascade="all, delete-orphan")


class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id"), nullable=True)
    episode_id = Column(Integer, ForeignKey("episodes.id"), nullable=True)
    
    artwork_type = Column(String(50), nullable=False) # poster (2:3), banner (16:9), thumbnail (16:9)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    show = relationship("Show", back_populates="artworks")
    episode = relationship("Episode", back_populates="artworks")


class PublishRun(Base):
    __tablename__ = "publish_runs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    shows_published_count = Column(Integer, nullable=False)
    episodes_published_count = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False) # success, failed
    log_message = Column(Text, nullable=True)
