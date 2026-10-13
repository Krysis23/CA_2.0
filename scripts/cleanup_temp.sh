#!/usr/bin/env bash
# ==============================================================================
# scripts/cleanup_temp.sh — Automated Storage Cleanup for CA Agent 2.0
# ==============================================================================
# Cron specification (Daily at 02:00 AM):
#   0 2 * * * /var/www/ca-agent/scripts/cleanup_temp.sh >> /var/log/ca-agent-cleanup.log 2>&1
# Or in crontab -e:
#   0 2 * * * find /var/www/ca-agent/temp -type f -mtime +1 -delete
# ==============================================================================

set -euo pipefail

# 1. Target directory resolution (supports environment variable or default paths)
TARGET_DIR="${TEMP_UPLOAD_DIR:-}"

if [[ -z "$TARGET_DIR" ]]; then
  if [[ -d "/app/temp" ]]; then
    TARGET_DIR="/app/temp"
  elif [[ -d "/var/www/ca-agent/temp" ]]; then
    TARGET_DIR="/var/www/ca-agent/temp"
  elif [[ -d "$(dirname "$0")/../temp" ]]; then
    TARGET_DIR="$(cd "$(dirname "$0")/../temp" && pwd)"
  else
    echo "[ERROR] Could not resolve temp directory. Exiting." >&2
    exit 1
  fi
fi

# 2. Safety check: Ensure directory exists and path includes 'temp'
if [[ ! -d "$TARGET_DIR" ]]; then
  echo "[WARNING] Target directory does not exist: $TARGET_DIR" >&2
  exit 0
fi

if [[ "$TARGET_DIR" != *"temp"* && "$TARGET_DIR" != *"upload"* ]]; then
  echo "[ERROR] Safety check failed: $TARGET_DIR does not contain 'temp' or 'upload'. Aborting." >&2
  exit 1
fi

RETENTION_DAYS="${CLEANUP_RETENTION_DAYS:-1}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting storage cleanup on: $TARGET_DIR (Files older than $RETENTION_DAYS days)"

# 3. Count matching files before deletion
FILE_COUNT=$(find "$TARGET_DIR" -type f ! -name ".gitkeep" ! -name ".gitignore" -mtime +"$RETENTION_DAYS" | wc -l || echo "0")

if [[ "$FILE_COUNT" -gt 0 ]]; then
  # 4. Delete files
  find "$TARGET_DIR" -type f ! -name ".gitkeep" ! -name ".gitignore" -mtime +"$RETENTION_DAYS" -delete
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Successfully removed $FILE_COUNT stale file(s)."
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] No expired files found. Zero files removed."
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleanup finished."
