#!/usr/bin/env python3
"""Wordcount gate for chapter drafts."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1] / "chapters"
MIN_CHARS = 2500


def count(text: str) -> int:
    return len("".join(ch for ch in text if not ch.isspace()))


def main() -> int:
    files = sorted(ROOT.glob("第*.md"))
    if len(sys.argv) > 1:
        files = [ROOT / a for a in sys.argv[1:]]
    bad = []
    for f in files:
        n = count(f.read_text(encoding="utf-8"))
        mark = "OK" if n >= MIN_CHARS else "SHORT"
        print(f"{mark:5} {n:5} {f.name}")
        if n < MIN_CHARS:
            bad.append(f.name)
    print(f"\nchecked={len(files)} short={len(bad)} gate={MIN_CHARS}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
