"""Cut a painting off a flat chroma-key background (green or blue), for pieces whose white bits (rice grains) would
vanish with a white background.

How strongly a pixel is the key colour (its green, or blue, above its other two channels) sets how transparent it is,
so soft shadows on the key go too; the key's tint is pulled out of the edges (and any spill on the subject). Then the
piece is cropped and scaled like scripts/mehendi/cut-marigold.py.

  python3 scripts/wedding/cut-chroma.py design/wedding/feet.jpeg src/events/wedding/assets/feet.webp 1100
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

LO, HI = 28, 64  # key strength (key channel minus the larger other one): below LO solid, above HI fully transparent


def cut(src):
    a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    h, w, _ = a.shape
    border = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    key = np.median(border, 0)
    k = int(np.argmax(key))  # 1 = green, 2 = blue
    others = [c for c in range(3) if c != k]
    strength = a[..., k] - a[..., others].max(-1)
    alpha = 1 - np.clip((strength - LO) / (HI - LO), 0, 1)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
    # Edges: take the key colour out of the blend, then clamp any leftover tint (spill) in the key channel.
    al = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((a - (1 - al) * key) / al, 0, 255)
    rgb[..., k] = np.minimum(rgb[..., k], rgb[..., others].max(-1))
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8)), 'green' if k == 1 else 'blue'


def crop(img, max_side, pad=4):
    x0, y0, x1, y1 = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    img = img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))
    s = min(1, max_side / max(img.size))
    return img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)


if __name__ == '__main__':
    src, out, size = sys.argv[1], sys.argv[2], int(sys.argv[3])
    img, keyed = cut(src)
    piece = crop(img, size)
    piece.save(out, 'WEBP', quality=86, method=6)
    print(out, piece.size, f'(keyed on {keyed})')
