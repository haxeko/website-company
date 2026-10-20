"""Security-camera feeds for the Smart Home page's panel, from two Unsplash photos:
a courtyard pool at night (colour, as a starlight camera sees it) and a front gate with a
car behind it (infrared night vision). Wide-angle lens, sensor grain, IR falloff; the
security company's sign by the gate is removed (LaMa inpainting).

    python camera-feeds.py <photos dir> <out dir> <big-lama.pt>
    photos: Unsplash IcpcvUN4fh0 (Declan Sun) and 4b25Ic2VjiQ (ubeyonroad), 1600 px wide, saved
    as <id>.jpg; the -preview.png outputs are what assets-src/cameras/ holds (as JPEG)."""
import sys, numpy as np, cv2, torch
from PIL import Image

src_dir, out_dir, lama_path = sys.argv[1:4]
rng = np.random.default_rng(11)

def load(name):
    return cv2.cvtColor(cv2.imread(f'{src_dir}/{name}.jpg'), cv2.COLOR_BGR2RGB).astype(np.float32) / 255

def lama(img, mask):
    model = torch.jit.load(lama_path, map_location='cpu').eval()
    h, w = img.shape[:2]
    H, W = (h + 7) // 8 * 8, (w + 7) // 8 * 8
    pad = np.zeros((H, W, 3), np.float32); pad[:h, :w] = img
    pm = np.zeros((H, W), np.float32); pm[:h, :w] = mask
    t = torch.from_numpy(pad).permute(2, 0, 1)[None]
    m = torch.from_numpy((pm > 0.5).astype(np.float32))[None, None]
    with torch.no_grad():
        r = model(t, m)[0].permute(1, 2, 0).clamp(0, 1).numpy()[:h, :w]
    soft = cv2.GaussianBlur(cv2.dilate(mask, np.ones((5, 5), np.uint8)), (0, 0), 2)[..., None]
    return img * (1 - soft) + r * soft

def barrel(img, k, out_w, out_h, cx=0.5, cy=0.5, zoom=1.0):
    """Wide-angle lens: samples further out towards the edges (k > 0)."""
    h, w = img.shape[:2]
    ys, xs = np.mgrid[0:out_h, 0:out_w].astype(np.float32)
    nx = (xs - out_w / 2) / (out_w / 2)
    ny = (ys - out_h / 2) / (out_w / 2)
    r2 = nx * nx + ny * ny
    f = (1 + k * r2) / zoom
    half = w / 2
    mx = (cx * w + nx * f * half).astype(np.float32)
    my = (cy * h + ny * f * half).astype(np.float32)
    return np.clip(cv2.remap(img, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT), 0, 1)

def grain(img, amount):
    n = rng.normal(0, amount, img.shape[:2]).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), 0.6)
    return img + n[..., None]

def vignette(h, w, strength, power=2.0):
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xs - w / 2) / (w / 2)) ** 2 + ((ys - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    return 1 - strength * r ** power

def save(img, name, sizes):
    img8 = (np.clip(img, 0, 1) * 255).round().astype(np.uint8)
    full = Image.fromarray(img8)
    for w in sizes:
        im = full.resize((w, round(w * full.height / full.width)), Image.LANCZOS)
        im.save(f'{out_dir}/{name}-{w}.webp', quality=82, method=6)
        im.save(f'{out_dir}/{name}-{w}.avif', quality=60)
    full.save(f'{out_dir}/{name}-preview.png')

# (the tiles of the panel's security screen are close to square: 1.05)
OW, OH = 840, 800

# ── 1. Courtyard pool, colour night mode ──────────────────────────────────────
g = load('IcpcvUN4fh0')
g = barrel(g, 0.14, OW, OH, cx=0.475, cy=0.52, zoom=1.86)
lin = g ** 2.2
lum = (lin @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
lin = lum + (lin - lum) * 0.78                 # a camera's tamer colour
lin *= np.array([0.97, 1.0, 1.02], np.float32)
lin = lin * 1.12
img = np.clip(lin, 0, 1) ** (1 / 2.2)
img = (img - 0.5) * 1.06 + 0.5                 # a little more contrast, as the sensor's curve
img *= vignette(OH, OW, 0.32)[..., None]
img = cv2.GaussianBlur(img, (0, 0), 0.55)      # small lens, compressed stream
img = grain(img, 0.022)
save(img, 'cam-garden', [480, 800])

# ── 2. Front gate, infrared night vision ──────────────────────────────────────
f = load('4b25Ic2VjiQ')
h, w = f.shape[:2]
# The security company's sign by the gate (a brand) goes.
mask = np.zeros((h, w), np.float32)
cv2.fillPoly(mask, [np.array([[968, 660], [1052, 660], [1058, 752], [1062, 846], [1036, 850], [1004, 760], [966, 752]], np.int32)], 1)
f = lama(f, mask)
R, G, B = f[..., 0], f[..., 1], f[..., 2]
lum = 0.3 * R + 0.59 * G + 0.11 * B
green = np.clip((G - np.maximum(R, B)) * 5, 0, 1)        # foliage and lawn shine in infrared
ir = lum * 0.9 + green * 0.42
sat = np.max(f, axis=2) - np.min(f, axis=2)
ys = np.mgrid[0:h, 0:w][0].astype(np.float32) / h
sky = np.clip((lum - 0.5) * 4, 0, 1) * np.clip((0.16 - sat) * 10, 0, 1) * np.clip((0.3 - ys) * 5, 0, 1)
sky = cv2.GaussianBlur(sky, (0, 0), 8)
ir = ir * (1 - 0.92 * sky)                                 # the night sky is black to the camera
ir = np.clip(ir, 0, 1) ** 1.25
# Wall lanterns lit: small blooms (positions in the photo).
lamps = np.zeros((h, w), np.float32)
for (x, y) in [(495, 556), (1000, 556), (622, 380), (1160, 380), (272, 437)]:
    cv2.circle(lamps, (x, y), 9, 1, -1)
ir = 1 - (1 - ir) * (1 - np.clip(cv2.GaussianBlur(lamps, (0, 0), 13) * 1.5 + cv2.GaussianBlur(lamps, (0, 0), 3.5) * 0.9, 0, 1))
ir = barrel(ir[..., None].repeat(3, axis=2), 0.14, OW, OH, cx=0.33, cy=0.53, zoom=1.84)[..., 0]
# The camera's own infrared lamp: bright near the middle, falling off towards the corners.
ir *= vignette(OH, OW, 0.58, 1.6) * 1.18
ir = cv2.GaussianBlur(ir, (0, 0), 0.8)                     # IR is soft
img = np.stack([ir * 0.97, ir, ir * 0.99], axis=2)
img = grain(img, 0.03)
save(img, 'cam-gate', [480, 800])
print('ok')
