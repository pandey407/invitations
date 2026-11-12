# Cuts the painted marigold art (design/mehendi/*.jpeg, plain white background) into transparent WebP.
#
#   python3 scripts/mehendi/cut-marigold.py SRC OUT.webp MAX_SIDE          one piece (a basket)
#   python3 scripts/mehendi/cut-marigold.py SRC OUT_DIR --split            a sheet of loose pieces, one file each:
#                                                                          petal-N, flower-N, leaf-N .webp
# Background = near-white pixels connected to the image border, plus white pockets enclosed by the art (gaps
# between spilled flowers) bigger than POCKET pixels. Small pale highlights inside petals stay.
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

POCKET = 250


def cut(src):
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(np.float32)
    whiteish = (a.min(-1) > 236) & (a.max(-1) - a.min(-1) < 20)
    m = Image.fromarray(whiteish.astype(np.uint8) * 255).copy()  # copy: floodfill is a no-op on array-backed images
    for x, y in [(0, 0), (m.width - 1, 0), (0, m.height - 1), (m.width - 1, m.height - 1)]:
        if m.getpixel((x, y)) == 255:
            ImageDraw.floodfill(m, (x, y), 128)
    # Enclosed white pockets: whatever near-white is left (255) after the border fill, if big enough.
    while True:
        rest = np.asarray(m)
        ys, xs = np.nonzero(rest == 255)
        if not len(ys):
            break
        ImageDraw.floodfill(m, (int(xs[0]), int(ys[0])), 60)
        pocket = np.asarray(m) == 60
        m.paste(128 if pocket.sum() > POCKET else 0, mask=Image.fromarray(pocket.astype(np.uint8) * 255))
    bg = np.asarray(m) == 128
    # Soft one-pixel edge, then pull the white fringe out of the edge colours.
    alpha = np.asarray(Image.fromarray((~bg).astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
    al = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((a - (1 - al) * 255) / al, 0, 255)
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8))


def crop(img, max_side, pad=4):
    x0, y0, x1, y1 = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))
    k = min(1, max_side / max(img.size))
    return img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)


def pieces(img):
    """Each separate piece on the sheet: its crop, size and how green it is (leaves)."""
    solid = Image.fromarray((np.asarray(img.getchannel('A')) > 128).astype(np.uint8) * 255).copy()
    arr = np.asarray(img)
    out = []
    while True:
        s = np.asarray(solid)
        ys, xs = np.nonzero(s == 255)
        if not len(ys):
            return out
        ImageDraw.floodfill(solid, (int(xs[0]), int(ys[0])), 100)
        comp = np.asarray(solid) == 100
        cy, cx = np.nonzero(comp)
        solid.paste(0, mask=Image.fromarray(comp.astype(np.uint8) * 255))
        if len(cy) < 400:
            continue  # stray speck
        box = (cx.min(), cy.min(), cx.max() + 1, cy.max() + 1)
        # Keep only this piece (and its soft edge), not bits of neighbours inside its box.
        own = Image.fromarray(comp.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))
        piece = img.copy()
        piece.putalpha(Image.fromarray(np.minimum(np.asarray(img.getchannel('A')), np.asarray(own))))
        piece = piece.crop(box)
        px = arr[cy, cx, :3].astype(np.float32)
        green = float(np.mean(px[:, 1] > px[:, 0]))
        out.append({'img': piece, 'area': len(cy), 'green': green})


if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    img = cut(src)
    if '--split' in sys.argv:
        d = Path(out)
        d.mkdir(parents=True, exist_ok=True)
        found = pieces(img)
        big = max(p['area'] for p in found)
        n = {'petal': 0, 'flower': 0, 'leaf': 0}
        for p in sorted(found, key=lambda p: -p['area']):
            kind = 'leaf' if p['green'] > 0.5 else 'flower' if p['area'] > big * 0.35 else 'petal'
            n[kind] += 1
            size = {'petal': 140, 'flower': 220, 'leaf': 200}[kind]
            crop(p['img'], size, pad=2).save(d / f'{kind}-{n[kind]}.webp', 'WEBP', quality=86, method=6)
        print(out, n)
    else:
        piece = crop(img, int(sys.argv[3]))
        piece.save(out, 'WEBP', quality=84, method=6)
        print(out, piece.size)
