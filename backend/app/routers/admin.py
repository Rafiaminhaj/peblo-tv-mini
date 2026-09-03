from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Show, Season, Episode, Artwork, PublishRun
from app.schemas import ShowSchema, ShowCreate, EpisodeSchema, EpisodeCreate, PublishRunSchema
from app.image_validator import validate_artwork_image, ImageValidationError
from app.storage import get_storage_provider
from app.validation_report import generate_validation_report
from app.publisher import execute_atomic_publish

router = APIRouter(prefix="/admin", tags=["Admin CMS"])

def verify_role(x_user_role: Optional[str] = Header(None, alias="X-User-Role"), required_role: str = "editor"):
    """Enforces RBAC role checking via request headers."""
    if not x_user_role:
        raise HTTPException(status_code=401, detail="Authentication required: X-User-Role header missing.")
    
    role = x_user_role.lower()
    if required_role == "admin" and role != "admin":
        raise HTTPException(status_code=403, detail="Permission Denied: Admin role required for catalogue publishing.")
    
    if role not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail=f"Permission Denied: Invalid role '{x_user_role}'.")
    
    return role


# Show CRUD
@router.get("/shows", response_model=List[ShowSchema])
def list_shows(db: Session = Depends(get_db), role: str = Depends(verify_role)):
    return db.query(Show).all()


@router.post("/shows", response_model=ShowSchema)
def create_show(show_in: ShowCreate, db: Session = Depends(get_db), role: str = Depends(verify_role)):
    show = Show(
        title=show_in.title,
        description=show_in.description,
        section=show_in.section,
        category=show_in.category
    )
    db.add(show)
    db.commit()
    db.refresh(show)
    return show


# Artwork Upload Endpoint
@router.post("/artwork/upload")
def upload_artwork(
    artwork_type: str = Form(...), # poster, banner, thumbnail
    show_id: Optional[int] = Form(None),
    episode_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    role: str = Depends(verify_role)
):
    if not show_id and not episode_id:
        raise HTTPException(status_code=400, detail="Must specify either show_id or episode_id.")

    file_bytes = file.file.read()
    
    try:
        width, height, file_size = validate_artwork_image(file_bytes, artwork_type)
    except ImageValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

    storage = get_storage_provider()
    subfolder = "shows" if show_id else "episodes"
    saved_path = storage.save_file(file_bytes, file.filename, subfolder=subfolder)

    artwork = Artwork(
        show_id=show_id,
        episode_id=episode_id,
        artwork_type=artwork_type,
        file_path=saved_path,
        file_size_bytes=file_size,
        width=width,
        height=height
    )
    db.add(artwork)
    db.commit()
    db.refresh(artwork)

    return {
        "status": "success",
        "message": f"Successfully uploaded {artwork_type} ({width}x{height}, {round(file_size/1024, 1)} KB).",
        "artwork": {
            "id": artwork.id,
            "artwork_type": artwork.artwork_type,
            "file_path": artwork.file_path,
            "width": artwork.width,
            "height": artwork.height
        }
    }


# Validation Report Endpoint
@router.get("/validation-report")
def get_validation_report(db: Session = Depends(get_db), role: str = Depends(verify_role)):
    return generate_validation_report(db)


# Publish Endpoint (Admin Only!)
@router.post("/catalog/publish")
def publish_catalog(db: Session = Depends(get_db), role: str = Depends(verify_role)):
    if role != "admin":
        raise HTTPException(status_code=403, detail="Permission Denied: Only Admin users can trigger catalogue publication.")

    success, message, data_or_report = execute_atomic_publish(db, admin_id="admin@peblo.tv")
    if not success:
        raise HTTPException(status_code=400, detail={
            "message": message,
            "validation_report": data_or_report
        })

    return {
        "status": "success",
        "message": message,
        "catalogue_summary": data_or_report.get("metadata")
    }


@router.get("/publish-history", response_model=List[PublishRunSchema])
def get_publish_history(db: Session = Depends(get_db), role: str = Depends(verify_role)):
    return db.query(PublishRun).order_by(PublishRun.timestamp.desc()).all()
