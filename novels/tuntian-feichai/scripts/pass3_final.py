#!/usr/bin/env python3
"""PASS3 final: clean overwrite chapters 140-150."""
import re
from pathlib import Path

BASE = Path("/workspace/novels/tuntian-feichai/chapters")
SLOGANS = [
    "可吞可不吞", "可吞亦可不吞", "吞序不吞人", "吞序，不吞人",
    "阵可以换，人不能再当桩", "我可以欠你命，不能欠你糊涂", "药线能接",
]

# Full clean chapters - written inline in separate write calls below via exec of CH dict
# Import from module body after definition

def report(name, content):
    lines = content.strip().split("\n")
    body = "\n".join(l for l in lines if not l.startswith("#"))
    non_ws = re.sub(r"\s+", "", body)
    ze = non_ws.count("则")
    n = len(non_ws)
    dens = ze / (n / 1000) if n else 0
    sc = sum(content.count(s) for s in SLOGANS)
    ok = n >= 2500 and dens < 12 and sc <= 2
    print(f"{name}: chars={n} ze={ze} dens={dens:.2f}/1k slogan_total={sc} [{'PASS' if ok else 'FAIL'}]")
    return ok
