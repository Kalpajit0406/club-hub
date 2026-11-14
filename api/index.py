import sys
import os
from pathlib import Path

# Add repository root to Python path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Enforce serverless writable SQLite path
if os.getenv("VERCEL"):
    os.environ["DATABASE_URL"] = "sqlite:////tmp/clubclash.db"

from backend.main import app
