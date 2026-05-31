from pathlib import Path

def get_frontend_dir() -> Path:
    project_root = Path(__file__).resolve().parent.parent.parent   # two levels up: -> project root
    frontend_dir = project_root / "frontend"
    return frontend_dir