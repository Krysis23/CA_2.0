#!/usr/bin/env python3
"""
cleanup_temp.py — Automated Storage Cleanup for CA Agent 2.0
──────────────────────────────────────────────────────────────────────────────
Purges uploaded financial artifacts (bank statements, PDFs, images) in the
temp/ directory that are older than the specified retention threshold.

Prevents disk exhaustion on cloud hosts (Render, Railway, VPS, Docker).

Usage:
    python cleanup_temp.py                     # Deletes files older than 1 day
    python cleanup_temp.py --days 2            # Deletes files older than 2 days
    python cleanup_temp.py --hours 12          # Deletes files older than 12 hours
    python cleanup_temp.py --dry-run           # Preview files without deleting
    python cleanup_temp.py --dir /app/temp     # Custom target directory
──────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import argparse
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("cleanup_temp")


def resolve_temp_dir(specified_dir: str | None = None) -> Path:
    """
    Resolves the temp directory path with sensible defaults and environment overrides.
    """
    if specified_dir:
        return Path(specified_dir).resolve()

    # Check environment variable
    env_dir = os.environ.get("TEMP_UPLOAD_DIR") or os.environ.get("UPLOAD_FOLDER")
    if env_dir:
        return Path(env_dir).resolve()

    # Common deployment locations
    project_root = Path(__file__).resolve().parent
    local_temp = project_root / "temp"
    docker_temp = Path("/app/temp")
    vps_temp = Path("/var/www/ca-agent/temp")

    if local_temp.is_dir():
        return local_temp
    if docker_temp.is_dir():
        return docker_temp
    if vps_temp.is_dir():
        return vps_temp

    return local_temp


def format_bytes(num_bytes: int) -> str:
    """Formats raw byte count into human-readable string."""
    for unit in ["B", "KB", "MB", "GB"]:
        if num_bytes < 1024.0:
            return f"{num_bytes:.2f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.2f} TB"


def cleanup_temp_files(
    target_dir: Path,
    retention_seconds: float,
    dry_run: bool = False,
    verbose: bool = False,
) -> tuple[int, int, int]:
    """
    Scans target_dir and removes files modified before (now - retention_seconds).
    Returns (scanned_count, deleted_count, bytes_freed).
    """
    if not target_dir.exists():
        logger.warning(f"Target directory does not exist: {target_dir}")
        return 0, 0, 0

    if not target_dir.is_dir():
        logger.error(f"Target path is not a directory: {target_dir}")
        sys.exit(1)

    # Basic safety safeguard: directory name must contain 'temp' or 'upload'
    dir_name = target_dir.name.lower()
    if "temp" not in dir_name and "upload" not in dir_name:
        logger.error(
            f"Safety check failed: '{target_dir}' does not appear to be a temp/upload directory. Aborting."
        )
        sys.exit(1)

    now = time.time()
    cutoff_time = now - retention_seconds
    scanned_count = 0
    deleted_count = 0
    bytes_freed = 0

    logger.info(f"Scanning target directory: {target_dir}")
    logger.info(
        f"Retention threshold: {retention_seconds / 3600:.1f} hours ({retention_seconds / 86400:.2f} days)"
    )
    if dry_run:
        logger.info("DRY-RUN MODE ENABLED: No files will actually be deleted.")

    # Protected file names that should never be removed
    KEEP_FILES = {".gitkeep", ".gitignore", "README.md", "readme.txt"}

    for item in target_dir.iterdir():
        if item.is_file():
            scanned_count += 1
            if item.name.lower() in KEEP_FILES:
                continue

            try:
                stat = item.stat()
                mtime = stat.st_mtime
                file_size = stat.st_size

                if mtime < cutoff_time:
                    age_hours = (now - mtime) / 3600
                    if dry_run:
                        if verbose:
                            logger.info(
                                f"[DRY-RUN] Would delete: {item.name} ({format_bytes(file_size)}, age: {age_hours:.1f}h)"
                            )
                        deleted_count += 1
                        bytes_freed += file_size
                    else:
                        item.unlink()
                        if verbose:
                            logger.info(
                                f"[DELETED] {item.name} ({format_bytes(file_size)}, age: {age_hours:.1f}h)"
                            )
                        deleted_count += 1
                        bytes_freed += file_size
            except Exception as e:
                logger.error(f"Failed to inspect/remove '{item.name}': {e}")

    logger.info("=" * 60)
    logger.info(f"Cleanup Summary:")
    logger.info(f"  • Files scanned : {scanned_count}")
    logger.info(f"  • Files removed : {deleted_count} {'(simulated)' if dry_run else ''}")
    logger.info(f"  • Disk freed    : {format_bytes(bytes_freed)}")
    logger.info("=" * 60)

    return scanned_count, deleted_count, bytes_freed


def main():
    parser = argparse.ArgumentParser(
        description="Automated storage cleanup utility for CA Agent 2.0 temp upload directory."
    )
    parser.add_argument(
        "--dir",
        type=str,
        default=None,
        help="Path to the temp directory (defaults to auto-detection: ./temp, /app/temp, /var/www/ca-agent/temp)",
    )
    parser.add_argument(
        "--days",
        type=float,
        default=1.0,
        help="Retention period in days (default: 1.0 day / 24 hours)",
    )
    parser.add_argument(
        "--hours",
        type=float,
        default=None,
        help="Retention period in hours (overrides --days if specified)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate cleanup without deleting any files",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print each file evaluated",
    )

    args = parser.parse_args()

    # Calculate retention in seconds
    if args.hours is not None:
        retention_seconds = args.hours * 3600
    else:
        retention_seconds = args.days * 86400

    target_dir = resolve_temp_dir(args.dir)
    cleanup_temp_files(
        target_dir=target_dir,
        retention_seconds=retention_seconds,
        dry_run=args.dry_run,
        verbose=args.verbose,
    )


if __name__ == "__main__":
    main()
