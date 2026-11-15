"""
backend/database.py
SQLAlchemy Database Configuration and Session Management for ClubClash.
"""

import os
import shutil
import tempfile
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from .env file
project_root = Path(__file__).resolve().parent.parent
env_path = project_root / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("sqlite:///."):
    rel_part = DATABASE_URL.replace("sqlite:///", "")
    abs_path = (project_root / rel_part).resolve()
    DATABASE_URL = f"sqlite:///{abs_path.as_posix()}"
elif not DATABASE_URL:
    default_db_file = project_root / "clubclash.db"
    is_writable = False
    try:
        test_file = project_root / ".write_test"
        with open(test_file, "a") as f:
            pass
        if test_file.exists():
            test_file.unlink()
        is_writable = True
    except Exception:
        is_writable = False

    if is_writable and not os.getenv("VERCEL"):
        DATABASE_URL = f"sqlite:///{default_db_file.as_posix()}"
    else:
        temp_dir = Path(tempfile.gettempdir())
        temp_db = temp_dir / "clubclash.db"
        if not temp_db.exists() and default_db_file.exists():
            try:
                shutil.copy2(default_db_file, temp_db)
            except Exception:
                pass
        DATABASE_URL = f"sqlite:///{temp_db.as_posix()}"

# For SQLite, check_same_thread=False allows multiple threads in FastAPI requests
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a SQLAlchemy database session
    and guarantees proper closure after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Creates all database tables defined in models.py if they do not exist.
    Also executes schema migrations for newly added columns if necessary.
    """
    import backend.models  # Ensure models are registered with Base metadata
    Base.metadata.create_all(bind=engine)

    # Automatic column migrations for SQLite
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(students)")).fetchall()
            col_names = [row[1] for row in result]
            if "avatar_url" not in col_names:
                conn.execute(text("ALTER TABLE students ADD COLUMN avatar_url VARCHAR(500)"))
                conn.commit()
    except Exception as e:
        print(f"[DB MIGRATION] Notice: {e}")

