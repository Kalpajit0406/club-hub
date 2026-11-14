"""
ClubHub - Single-command Application Runner
Starts the FastAPI backend and serves the frontend on http://localhost:8000
"""
import sys
import uvicorn

if __name__ == "__main__":
    print("=" * 65)
    print("   ClubHub - The All-in-One Smart Campus Operating System")
    print("   Frontend & Backend running at: http://localhost:8000")
    print("   Interactive OpenAPI Documentation: http://localhost:8000/docs")
    print("=" * 65)
    try:
        uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n[ClubHub] Server stopped cleanly.")
        sys.exit(0)
