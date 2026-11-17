"""Cut the gathbandhan video (design/wedding/knot-tie-video.mp4, painted on cream paper) out of its background, for
the envelope: assets/tie.mp4, the picture on top and its matte (white = keep) below, which the page combines on a
canvas (one ordinary H.264 file, so it plays everywhere, iPhones included).

The paper is near the white silk's colour, so this doesn't key on a colour: it takes the empty paper (what each pixel
shows whenever nothing covers it), re-lights it to each frame (the window light drifts), and keeps whatever clearly
differs from it, plus fainter differences joined to that (the silk's palest highlights) and anything enclosed (the
silk's middle). Also writes assets/knot-end.webp, the last frame cut out, shown if the video can't play.
--preview=41,76 just writes those frames (1-based) over the envelope's rose, beside the originals, to check by eye.

  python3 scripts/wedding/key-tie-video.py [video] [--end=6.0]
"""
import pathlib
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parents[2]
args = [a for a in sys.argv[1:] if not a.startswith('--')]
SRC = pathlib.Path(args[0]) if args else ROOT / 'design/wedding/knot-tie-video.mp4'
END = next((float(a.split('=')[1]) for a in sys.argv if a.startswith('--end=')), 6.0)  # before the gold shimmer
ASSETS = ROOT / 'src/events/wedding/assets'
OUT_W, OUT_H = 960, 540
DIFF, SAT = 16, 60  # how far from the paper (any channel), or how colourful, a pixel must be to count as cloth/petal
# Fainter than that (the silk's palest highlights are nearly the paper's colour, a little brighter) counts only where
# it joins something that clearly is: the paper's own drifting light never gets in, the silk's highlights do.
FAINT, LIFT = 6, 3
CLOSE = 9  # px: narrow notches bitten into the cloth's outline (a fold's soft underside) are filled
FAINT = next((float(a.split('=')[1]) for a in sys.argv if a.startswith('--faint=')), FAINT)
LIFT = next((float(a.split('=')[1]) for a in sys.argv if a.startswith('--lift=')), LIFT)
CLOSE = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--close=')), CLOSE)
PREVIEW = next(([int(n) for n in a.split('=')[1].split(',')] for a in sys.argv if a.startswith('--preview=')), None)

tmp = pathlib.Path(tempfile.mkdtemp())
subprocess.run(['ffmpeg', '-v', 'error', '-i', SRC, '-t', str(END), f'{tmp}/f%03d.png'], check=True)
paths = sorted(tmp.glob('f*.png'))
load = lambda p: np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
blur = lambda a, r: np.asarray(Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)


def grow(seed, within):
    """The parts of `within` connected to `seed`."""
    cur = seed & within
    while True:
        prev = cur
        for _ in range(8):
            d = cur.copy()
            d[1:] |= cur[:-1]
            d[:-1] |= cur[1:]
            d[:, 1:] |= cur[:, :-1]
            d[:, :-1] |= cur[:, 1:]
            cur = d & within
        if (cur == prev).all():
            return cur


def smooth(a, step=8, radius=4):
    """A heavily blurred copy of a float image (block-averaged, blurred small, scaled back up)."""
    h, w = a.shape
    small = a[: h // step * step, : w // step * step].reshape(h // step, step, w // step, step).mean((1, 3))
    k = np.exp(-0.5 * (np.arange(-2 * radius, 2 * radius + 1) / radius) ** 2)
    k /= k.sum()
    pad = np.pad(small, 2 * radius, mode='edge')
    pad = np.apply_along_axis(lambda r: np.convolve(r, k, 'same'), 1, pad)
    pad = np.apply_along_axis(lambda c: np.convolve(c, k, 'same'), 0, pad)
    small = pad[2 * radius: -2 * radius, 2 * radius: -2 * radius]
    return np.asarray(Image.fromarray(small.astype(np.float32), 'F').resize((w, h), Image.BILINEAR))


def relit(xs, ps, cloth):
    """The paper as lit in this frame: the plate, scaled by how much lighter or darker the bare paper is now."""
    bare = ~np.asarray(Image.fromarray(cloth.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(15))).astype(bool)
    ratio = np.where(bare, xs.mean(-1) / np.maximum(ps.mean(-1), 1), 0)
    weight = smooth(bare.astype(np.float32))
    return ps * np.where(weight > 0.05, smooth(ratio) / np.maximum(weight, 1e-3), 1)[..., None]


def background(x, plate):
    """True where the frame shows bare paper: near the plate, not colourful, and connected to the frame's border."""
    xs, ps = blur(x, 1), blur(plate, 6)
    colourful = xs.max(-1) - xs.min(-1) > SAT
    ps = relit(xs, ps, (np.abs(xs - ps).max(-1) > DIFF) | colourful)
    diff = np.abs(xs - ps).max(-1)
    strong = (diff > DIFF) | colourful
    fg = grow(strong, strong | (diff > FAINT) | (xs.mean(-1) - ps.mean(-1) > LIFT))
    fg = np.asarray(Image.fromarray(fg.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(CLOSE)).filter(ImageFilter.MinFilter(CLOSE))) > 0
    m = Image.fromarray((~fg).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    m = m.copy()
    for p in [(0, 0), (m.width - 1, 0), (0, m.height - 1), (m.width - 1, m.height - 1)]:
        if m.getpixel(p) == 255:
            ImageDraw.floodfill(m, p, 128)
    return np.asarray(m) == 128


# The empty paper: first guess the opening frame, then average every frame wherever it shows bare paper.
first = load(paths[0])
total, count = np.zeros_like(first), np.zeros(first.shape[:2], np.float32)
for p in paths:
    x = load(p)
    bg = background(x, first)
    total += x * bg[..., None]
    count += bg
plate = np.where(count[..., None] > 0, total / np.maximum(count, 1)[..., None], first)

if PREVIEW:  # --preview=41,76: those frames (1-based) cut out over the envelope's rose, side by side with the original
    tiles = []
    for n in PREVIEW:
        x = load(paths[n - 1])
        keep = Image.fromarray((~background(x, plate)).astype(np.uint8) * 255).filter(ImageFilter.MinFilter(3))
        a = np.asarray(keep.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)[..., None] / 255
        comp = x * a + np.array([207, 155, 147]) * (1 - a)
        tiles += [Image.fromarray(x.astype(np.uint8)), Image.fromarray(comp.astype(np.uint8))]
    sheet = Image.new('RGB', (1280, 720 * len(PREVIEW)))
    for k, t in enumerate(tiles):
        sheet.paste(t.resize((640, 360)).crop((0, 0, 640, 360)), ((k % 2) * 640, (k // 2) * 360))
    sheet = sheet.crop((0, 0, 1280, 360 * len(PREVIEW)))
    sheet.save(tmp / 'preview.jpg', quality=90)
    print(tmp / 'preview.jpg')
    sys.exit()

frames = tmp / 'out'
frames.mkdir()
for i, p in enumerate(paths):
    x = load(p)
    bg = background(x, plate)
    keep = Image.fromarray((~bg).astype(np.uint8) * 255).filter(ImageFilter.MinFilter(3))
    a = np.asarray(keep.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    # Pull the paper out of the soft edge's colours.
    al = np.maximum(a, 1e-3)[..., None]
    rgb = np.where(a[..., None] > 0.02, np.clip((x - (1 - al) * plate) / al, 0, 255), x)
    pic = Image.fromarray(rgb.astype(np.uint8)).resize((OUT_W, OUT_H), Image.LANCZOS)
    matte = Image.fromarray((a * 255).astype(np.uint8)).resize((OUT_W, OUT_H), Image.LANCZOS).convert('RGB')
    stacked = Image.new('RGB', (OUT_W, OUT_H * 2))
    stacked.paste(pic, (0, 0))
    stacked.paste(matte, (0, OUT_H))
    stacked.save(frames / f'{i:03d}.png')
    if i == len(paths) - 1:
        end = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8)).resize((OUT_W, OUT_H), Image.LANCZOS)
        end.save(ASSETS / 'knot-end.webp', quality=88, method=6)

subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', f'{frames}/%03d.png', '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an',
                ASSETS / 'tie.mp4'], check=True)
print(f'{len(paths)} frames -> {ASSETS / "tie.mp4"} ({(ASSETS / "tie.mp4").stat().st_size / 1e6:.2f} MB), knot-end.webp')
