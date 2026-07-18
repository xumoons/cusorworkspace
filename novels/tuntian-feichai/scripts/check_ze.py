#!/usr/bin/env python3
import re, sys

def stats(text):
    # strip markdown title line
    lines = text.strip().split('\n')
    body = '\n'.join(l for l in lines if not l.startswith('#'))
    non_ws = re.sub(r'\s+', '', body)
    ze = non_ws.count('则')
    n = len(non_ws)
    dens = ze / (n / 1000) if n else 0
    return n, ze, dens

if __name__ == '__main__':
    for path in sys.argv[1:]:
        with open(path) as f:
            n, ze, dens = stats(f.read())
        ok = 'PASS' if n >= 2500 and dens < 12 else 'FAIL'
        print(f'{path}: chars={n} ze={ze} dens={dens:.2f}/1k [{ok}]')
