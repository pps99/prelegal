import os

_project_root = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("TEMPLATES_DIR", os.path.join(_project_root, "templates"))
os.environ.setdefault("DB_PATH", "/tmp/prelegal_test.db")
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")
