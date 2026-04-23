#!/usr/bin/env bash
set -euo pipefail

pip install -r requirements.txt
npm ci
npm run build
python manage.py collectstatic --noinput
