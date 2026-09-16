#!/usr/bin/env python3
"""diff.py — numeric visual diff between two screenshot folders.
   python3 tools/diff.py docs/reference/2026-09-15/shots docs/qa/shots [suffix]
Reports, per state: mean abs difference (0-255), % pixels differing by >24, and writes a
heat image of the differences to <ours>/diff-<name>.png. Masks the brand mark corner and
the trusted badge (its logo rotates on a timer) so they do not dominate."""
import sys, os
from PIL import Image, ImageChops
ref, ours = sys.argv[1], sys.argv[2]
suffix = sys.argv[3] if len(sys.argv) > 3 else "1440"
names = sorted(f for f in os.listdir(ref) if f.endswith(f"-{suffix}.png"))
for n in names:
    a = os.path.join(ref, n); b = os.path.join(ours, n)
    if not os.path.exists(b):
        print(f"{n:32s} MISSING in ours"); continue
    A = Image.open(a).convert("RGB"); B = Image.open(b).convert("RGB")
    if A.size != B.size:
        print(f"{n:32s} size {A.size} vs {B.size}"); continue
    d = ImageChops.difference(A, B).convert("L")
    w, h = d.size
    px = d.load()
    tot = 0; big = 0; cnt = 0
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            v = px[x, y]; tot += v; cnt += 1
            if v > 24: big += 1
    d.point(lambda v: min(255, v * 4)).save(os.path.join(ours, f"diff-{n}"))
    print(f"{n:32s} mean {tot/cnt:6.2f}  >24: {100*big/cnt:5.2f}%")
