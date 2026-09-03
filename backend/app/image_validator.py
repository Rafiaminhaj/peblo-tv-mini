import io
from PIL import Image

# Specs from reference.json
ARTWORK_SPECS = {
    "poster": {
        "aspect_ratio": 2 / 3,       # 2:3
        "target_width": 600,
        "target_height": 900,
        "aspect_tolerance": 0.05,
        "label": "Poster (2:3 aspect ratio, ~600x900px)"
    },
    "banner": {
        "aspect_ratio": 16 / 9,      # 16:9
        "target_width": 1280,
        "target_height": 720,
        "aspect_tolerance": 0.05,
        "label": "Banner (16:9 aspect ratio, ~1280x720px)"
    },
    "thumbnail": {
        "aspect_ratio": 16 / 9,      # 16:9
        "target_width": 640,
        "target_height": 360,
        "aspect_tolerance": 0.05,
        "label": "Thumbnail (16:9 aspect ratio, ~640x360px)"
    }
}

MAX_FILE_SIZE_BYTES = 200 * 1024  # 200 KB strict ceiling

class ImageValidationError(Exception):
    pass


def validate_artwork_image(file_bytes: bytes, artwork_type: str) -> tuple[int, int, int]:
    """
    Validates image file size, dimensions, and aspect ratio.
    Returns (width, height, file_size_bytes) or raises ImageValidationError with human-readable guidance.
    """
    file_size = len(file_bytes)
    
    # 1. File size ceiling check (200 KB)
    if file_size > MAX_FILE_SIZE_BYTES:
        size_kb = round(file_size / 1024, 1)
        raise ImageValidationError(
            f"File size too large ({size_kb} KB). Maximum allowed size for non-technical editors is 200 KB. Please compress the image."
        )

    # 2. Image format and dimensions check via Pillow
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()
        width, height = image.size
    except Exception:
        raise ImageValidationError("Invalid image file. Please upload a valid JPG or PNG image.")

    if artwork_type not in ARTWORK_SPECS:
        raise ImageValidationError(f"Invalid artwork type '{artwork_type}'. Allowed: poster, banner, thumbnail.")

    spec = ARTWORK_SPECS[artwork_type]
    actual_ratio = width / height
    expected_ratio = spec["aspect_ratio"]

    # 3. Aspect ratio tolerance check
    if abs(actual_ratio - expected_ratio) > spec["aspect_tolerance"]:
        raise ImageValidationError(
            f"Invalid aspect ratio ({width}x{height}). Required: {spec['label']}. Please crop the image before uploading."
        )

    return width, height, file_size
