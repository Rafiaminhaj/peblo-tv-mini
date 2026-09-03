import io
import pytest
from PIL import Image
from app.image_validator import validate_artwork_image, ImageValidationError

def create_dummy_image_bytes(width: int, height: int, format: str = "JPEG") -> bytes:
    img = Image.new("RGB", (width, height), color="red")
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()

def test_valid_poster_image():
    # 2:3 aspect ratio (600x900)
    data = create_dummy_image_bytes(600, 900)
    w, h, sz = validate_artwork_image(data, "poster")
    assert w == 600
    assert h == 900

def test_invalid_aspect_ratio():
    # Square 500x500 for poster (expects 2:3)
    data = create_dummy_image_bytes(500, 500)
    with pytest.raises(ImageValidationError) as exc:
        validate_artwork_image(data, "poster")
    assert "Invalid aspect ratio" in str(exc.value)

def test_file_size_limit_exceeded():
    # Large dummy payload > 200 KB
    large_data = b"0" * (205 * 1024)
    with pytest.raises(ImageValidationError) as exc:
        validate_artwork_image(large_data, "banner")
    assert "File size too large" in str(exc.value)
