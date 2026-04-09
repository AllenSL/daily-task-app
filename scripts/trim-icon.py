# -*- coding: utf-8 -*-
"""Remove gray canvas & watermark from app-icon.png; save tight transparent PNG."""
from __future__ import print_function

import os
import shutil
import sys

from PIL import Image


def saturation(rgb):
    r, g, b = [x / 255.0 for x in rgb]
    mx, mn = max(r, g, b), min(r, g, b)
    return 0.0 if mx == 0 else (mx - mn) / mx


def gray_like(t):
    r, g, b = t
    mx, mn = max(r, g, b), min(r, g, b)
    avg = (r + g + b) / 3.0
    return (mx - mn) < 18 and 175 < avg < 252


def opaque_pixel(t):
    s = saturation(t)
    if gray_like(t) and s < 0.07:
        return False
    return True


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(root, "assets", "app-icon.png")
    if not os.path.isfile(path):
        print("missing", path, file=sys.stderr)
        sys.exit(1)

    bak = path + ".bak"
    if not os.path.isfile(bak):
        shutil.copy2(path, bak)

    im = Image.open(path).convert("RGB")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()

    for y in range(h):
        for x in range(w):
            t = px[x, y]
            if opaque_pixel(t):
                opx[x, y] = t + (255,)

    bbox = out.getbbox()
    if not bbox:
        print("empty mask", file=sys.stderr)
        sys.exit(1)

    pad = 4
    l, u, r, b = bbox
    l = max(0, l - pad)
    u = max(0, u - pad)
    r = min(w, r + pad)
    b = min(h, b + pad)
    cropped = out.crop((l, u, r, b))

    side = max(cropped.size[0], cropped.size[1])
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - cropped.size[0]) // 2
    oy = (side - cropped.size[1]) // 2
    square.paste(cropped, (ox, oy), cropped)

    # Normalize size for tray / builder (sharp enough, smaller file than 800+ px)
    target = 512
    if square.size[0] != target:
        square = square.resize((target, target), Image.LANCZOS)

    square.save(path, "PNG")
    print("Wrote", path, square.size)


if __name__ == "__main__":
    main()
