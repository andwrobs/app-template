"""Synchronize fenced source listings, or check them without changing files."""

import argparse
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
BLOCK = re.compile(
    r"^(?P<indent> *)```(?P<language>\w+)\n"
    r"(?P=indent)// (?P<path>(?:src|test-utils|framework)/[^\n]+)\n"
    r"(?P<body>.*?)^(?P=indent)```",
    re.MULTILINE | re.DOTALL,
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    changed = []
    missing = []
    snippets = 0
    for doc in sorted((ROOT / "docs").rglob("*.md")):
        original = doc.read_text()

        def replace(match):
            nonlocal snippets
            snippets += 1
            path = match["path"].strip()
            source = (ROOT / path).resolve()
            if not source.is_relative_to(ROOT) or not source.is_file():
                missing.append(f"{doc.relative_to(ROOT)}: {path}")
                return match[0]
            indent = match["indent"]
            body = "\n".join(indent + line if line else "" for line in source.read_text().rstrip().splitlines())
            return f'{indent}```{match["language"]}\n{indent}// {path}\n{body}\n{indent}```'

        updated = BLOCK.sub(replace, original)
        if original != updated:
            changed.append(str(doc.relative_to(ROOT)))
            if not args.check:
                doc.write_text(updated)
    if missing:
        print("Missing or invalid snippet sources:\n" + "\n".join(missing), file=sys.stderr)
        return 1
    if args.check and changed:
        print("Run python3 sync-docs.py to update:\n" + "\n".join(changed), file=sys.stderr)
        return 1
    print(f"{'Checked' if args.check else 'Synced'} {snippets} source snippets; {len(changed)} documents {'need updates' if args.check else 'updated'}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
