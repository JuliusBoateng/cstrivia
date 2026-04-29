import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Default to 2 workers, but allow override via env
workers = int(os.environ.get("WEB_CONCURRENCY", "2"))

accesslog = "-"
errorlog = "-"
loglevel = "debug"
capture_output = True

preload_app = False

timeout = 120
graceful_timeout = 120
