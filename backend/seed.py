"""
backend/seed.py
Database Seeding Script for ClubHub.
Kept empty to ensure the application starts with a clean, unpopulated database.
"""

from backend.database import init_db


def seed_data():
    """
    Ensures database schema is initialized.
    No mock or test data is inserted.
    """
    init_db()
