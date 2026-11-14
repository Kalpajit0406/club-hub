"""
backend/firebase_auth.py
Firebase Integration Module for ClubClash (Project: club-hub-9c2de).
Supports Firebase Authentication ID token verification, Firebase Cloud Storage,
and seamless mapping of Firebase user profiles to SQLite Student records.
"""

import os
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment configuration
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "club-hub-9c2de")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "club-hub-9c2de.appspot.com")
FIREBASE_ENABLED = os.getenv("FIREBASE_ENABLED", "False").lower() in ("true", "1", "t")

_firebase_app = None


def init_firebase():
    """
    Initializes the Firebase Admin SDK using service account credentials
    or default application credentials if enabled.
    """
    global _firebase_app
    if not FIREBASE_ENABLED:
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials

        if not firebase_admin._apps:
            if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
                cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
                _firebase_app = firebase_admin.initialize_app(cred, {
                    "projectId": FIREBASE_PROJECT_ID,
                    "storageBucket": FIREBASE_STORAGE_BUCKET
                })
            else:
                # Initialize with Project ID only
                _firebase_app = firebase_admin.initialize_app(options={
                    "projectId": FIREBASE_PROJECT_ID,
                    "storageBucket": FIREBASE_STORAGE_BUCKET
                })
            print(f"[FIREBASE] Initialized Firebase Admin SDK for project '{FIREBASE_PROJECT_ID}'")
        return _firebase_app
    except ImportError:
        print("[FIREBASE] firebase-admin package is not installed. Run 'pip install firebase-admin' to enable.")
        return None
    except Exception as e:
        print(f"[FIREBASE WARNING] Failed to initialize Firebase Admin SDK: {e}")
        return None


def verify_firebase_id_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Firebase ID token issued by Firebase Authentication (e.g. Google Sign-In).
    Returns decoded token dictionary containing 'uid', 'email', 'name', etc.
    """
    try:
        import firebase_admin
        from firebase_admin import auth

        init_firebase()
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"[FIREBASE TOKEN ERROR] Verification failed: {e}")
        return None

