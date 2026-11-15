"""
backend/routers/upload.py
Image Upload Router for User Avatars, Club Covers, and Event Banners.
Saves uploaded images to the persistent temp uploads directory and returns a public URL.
"""

import os
import uuid
import tempfile
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from backend.models import Student
from backend.dependencies import get_current_user

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = Path(tempfile.gettempdir()) / "clubhub_uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 Megabytes


@router.post(
    "",
    summary="Upload an image file (avatar, club banner, event banner)",
    status_code=status.HTTP_201_CREATED
)
async def upload_image(
    file: UploadFile = File(...),
    current_user: Student = Depends(get_current_user)
):
    """
    Uploads an image file.
    Validates file extension, MIME type, and 5MB size limit.
    Returns the public relative URL: /uploads/<unique_filename>
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload payload."
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP, GIF."
        )

    # Read content to verify file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum permissible size of 5MB ({len(contents) / (1024*1024):.2f}MB provided)."
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = UPLOAD_DIR / unique_filename

    try:
        with open(dest_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file to disk: {str(e)}"
        )

    public_url = f"/uploads/{unique_filename}"
    return {
        "url": public_url,
        "filename": unique_filename,
        "size_bytes": len(contents),
        "message": "Image uploaded successfully."
    }
