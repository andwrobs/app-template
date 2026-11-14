"""Build the reference ZIP without dependencies, generated output, or metadata."""

from pathlib import Path
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / "app-reference.zip"
EXCLUDED = {"node_modules", ".react-router", "build", "coverage", "__pycache__", ".git", ".DS_Store", "__MACOSX"}


def files(directory):
    for path in sorted(directory.iterdir()):
        if path.is_symlink() or path.name in EXCLUDED:
            continue
        if path.is_dir():
            yield from files(path)
        elif path.is_file() and not path.name.endswith((".tsbuildinfo", ".pyc", ".zip", ".log")):
            yield path


def main():
    subprocess.run([sys.executable, str(ROOT / "sync-docs.py"), "--check"], check=True)
    sources = list(files(ROOT))
    # A fixed timestamp and permissions make identical sources produce identical ZIPs.
    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for source in sources:
            entry = zipfile.ZipInfo(source.relative_to(ROOT).as_posix(), date_time=(2026, 11, 13, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, source.read_bytes())
    with zipfile.ZipFile(OUTPUT) as archive:
        assert archive.testzip() is None
        for source in sources:
            assert archive.read(source.relative_to(ROOT).as_posix()) == source.read_bytes()
    print(f"Created and verified {OUTPUT} ({len(sources)} files, {OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
