import sys
import os
from pathlib import Path

# Add repository root to Python path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Enforce serverless writable SQLite path
os.environ["DATABASE_URL"] = "sqlite:////tmp/clubclash.db"

from backend.main import app
from backend.database import init_db
from backend.seed import seed_data

# Ensure database and seed data are initialized on serverless cold start
try:
    init_db()
    seed_data()
except Exception as e:
    print(f"[SERVERLESS INIT ERROR] {e}")
