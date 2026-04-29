"""
WSGI config for website project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os
import sys

print(f"[WSGI] PID {os.getpid()} - module import start", file=sys.stderr, flush=True)

from django.core.wsgi import get_wsgi_application
print("[WSGI] imported get_wsgi_application", file=sys.stderr, flush=True)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'website.settings')
print("[WSGI] settings module set", file=sys.stderr, flush=True)

print("[WSGI] before get_wsgi_application", file=sys.stderr, flush=True)
application = get_wsgi_application()
print("[WSGI] after get_wsgi_application", file=sys.stderr, flush=True)
