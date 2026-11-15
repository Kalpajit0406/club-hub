"""
backend/routers/network.py
Student Peer Network & Collab Feed Router.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from backend.database import get_db
from backend.models import NetworkPost, NetworkPostUpvote, NetworkComment, Student
from backend.schemas import (
    NetworkPostCreate,
    NetworkPostUpdate,
    NetworkPostResponse,
    NetworkCommentCreate,
    NetworkCommentResponse,
    MessageResponse
)
from backend.dependencies import get_current_user, get_optional_current_user

router = APIRouter(prefix="/network", tags=["Network"])


@router.get(
    "/posts",
    response_model=List[NetworkPostResponse],
    summary="Get collab feed posts"
)
def get_posts(
    tag: Optional[str] = Query(None, description="Filter by tag (e.g. #HackathonTeam)"),
    search: Optional[str] = Query(None, description="Search keyword in title or content"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: Optional[Student] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(NetworkPost).options(joinedload(NetworkPost.author))

    if tag and tag.lower() != "all":
        query = query.filter(NetworkPost.tag.ilike(f"%{tag.strip()}%"))

    if search:
        p = f"%{search.strip()}%"
        query = query.filter(or_(NetworkPost.title.ilike(p), NetworkPost.content.ilike(p)))

    posts = query.order_by(NetworkPost.created_at.desc()).offset(skip).limit(limit).all()

    user_upvotes = set()
    if current_user:
        upvotes = db.query(NetworkPostUpvote.post_id).filter(
            NetworkPostUpvote.student_id == current_user.id
        ).all()
        user_upvotes = {u[0] for u in upvotes}

    result = []
    for post in posts:
        resp = NetworkPostResponse.model_validate(post)
        resp.comments_count = db.query(NetworkComment).filter(NetworkComment.post_id == post.id).count()
        resp.has_upvoted = (post.id in user_upvotes) if current_user else False
        result.append(resp)

    return result


@router.post(
    "/posts",
    response_model=NetworkPostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new collab post"
)
def create_post(
    payload: NetworkPostCreate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_post = NetworkPost(
        student_id=current_user.id,
        title=payload.title.strip(),
        content=payload.content.strip(),
        tag=payload.tag.strip() if payload.tag else "#CampusLife",
        upvotes_count=0,
        created_at=datetime.utcnow()
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    resp = NetworkPostResponse.model_validate(new_post)
    resp.author = current_user
    resp.comments_count = 0
    resp.has_upvoted = False
    return resp


@router.post(
    "/posts/{post_id}/upvote",
    summary="Toggle upvote on a post"
)
def toggle_upvote(
    post_id: int,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(NetworkPost).filter(NetworkPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    existing_upvote = db.query(NetworkPostUpvote).filter(
        NetworkPostUpvote.post_id == post_id,
        NetworkPostUpvote.student_id == current_user.id
    ).first()

    if existing_upvote:
        db.delete(existing_upvote)
        post.upvotes_count = max(0, post.upvotes_count - 1)
        has_upvoted = False
        message = "Upvote removed."
    else:
        new_upvote = NetworkPostUpvote(post_id=post_id, student_id=current_user.id)
        db.add(new_upvote)
        post.upvotes_count += 1
        has_upvoted = True
        message = "Post upvoted."

    db.commit()
    return {
        "message": message,
        "upvotes_count": post.upvotes_count,
        "has_upvoted": has_upvoted
    }


@router.get(
    "/posts/{post_id}/comments",
    response_model=List[NetworkCommentResponse],
    summary="Get comments for a post"
)
def get_comments(
    post_id: int,
    db: Session = Depends(get_db)
):
    post = db.query(NetworkPost).filter(NetworkPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    comments = (
        db.query(NetworkComment)
        .options(joinedload(NetworkComment.author))
        .filter(NetworkComment.post_id == post_id)
        .order_by(NetworkComment.created_at.asc())
        .all()
    )
    return comments


@router.post(
    "/posts/{post_id}/comments",
    response_model=NetworkCommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment to a post"
)
def add_comment(
    post_id: int,
    payload: NetworkCommentCreate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(NetworkPost).filter(NetworkPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    new_comment = NetworkComment(
        post_id=post_id,
        student_id=current_user.id,
        content=payload.content.strip(),
        created_at=datetime.utcnow()
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return new_comment


@router.patch(
    "/posts/{post_id}",
    response_model=NetworkPostResponse,
    summary="Edit an existing collaboration post"
)
def update_post(
    post_id: int,
    payload: NetworkPostUpdate,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows the original author to update their collaboration post:
    - title
    - content
    - tag
    Rejects modification by unauthorized users.
    """
    post = (
        db.query(NetworkPost)
        .options(joinedload(NetworkPost.author))
        .filter(NetworkPost.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion post with ID {post_id} not found."
        )

    # Authorization check: only original author
    if post.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this post. Only the original author can edit it."
        )

    if payload.title is not None and payload.title.strip():
        post.title = payload.title.strip()
    if payload.content is not None and payload.content.strip():
        post.content = payload.content.strip()
    if payload.tag is not None and payload.tag.strip():
        post.tag = payload.tag.strip()

    db.commit()
    db.refresh(post)

    resp = NetworkPostResponse.model_validate(post)
    resp.comments_count = db.query(NetworkComment).filter(NetworkComment.post_id == post.id).count()
    upvote = db.query(NetworkPostUpvote).filter(
        NetworkPostUpvote.post_id == post.id,
        NetworkPostUpvote.student_id == current_user.id
    ).first()
    resp.has_upvoted = upvote is not None
    return resp


@router.delete(
    "/posts/{post_id}",
    response_model=MessageResponse,
    summary="Delete a collaboration post"
)
def delete_post(
    post_id: int,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows the original author (or site admin) to delete their collaboration post.
    Cascades removal of comments and upvotes.
    """
    post = db.query(NetworkPost).filter(NetworkPost.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discussion post with ID {post_id} not found."
        )

    if post.student_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this post. Only the author or platform admin can delete it."
        )

    title = post.title
    db.delete(post)
    db.commit()

    return MessageResponse(message=f"Post '{title}' has been successfully deleted.")
