"""The Interior page's room in three lights, from the golden-hour photo: morning (cooler,
brighter, the sun no longer orange) and evening (the room dark, the windows night-blue, the
lamps lit: the linear pendant over the table, the cove in the ceiling, the strip under the
kitchen cabinets, the wall-washers on the travertine).

    python interior-light.py <interior crop.png> <out dir>
    (the crop: x 5150–8000 of assets-src/panorama-construction-interior.jpg, full height;
     writes interior-morning.jpg and interior-evening.jpg → assets-src/interior/)"""
import sys, numpy as np, cv2
src, out_dir = sys.argv[1:3]
img = cv2.imread(src).astype(np.float32) / 255      # BGR, the interior crop 2850 × 2668
H, W = img.shape[:2]
lin = img ** 2.2
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

def save(name, l):
    out = np.clip(l, 0, 1) ** (1 / 2.2)
    out += np.random.default_rng(3).normal(0, 0.004, (H, W, 1)).astype(np.float32)
    cv2.imwrite(f'{out_dir}/{name}.jpg', (np.clip(out, 0, 1) * 255).round().astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
    cv2.imwrite(f'{out_dir}/{name}-prev.jpg', cv2.resize((np.clip(out, 0, 1) * 255).astype(np.uint8), (1068, 1000), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])

# ── where the outside shows: the glass doors, the back windows, the sky ─────────────────────────
win = np.zeros((H, W), np.float32)
cv2.rectangle(win, (140, 1000), (560, 1880), 1, -1)        # sliding doors (left)
cv2.rectangle(win, (560, 1265), (1310, 1690), 1, -1)       # back windows
sky = np.zeros((H, W), np.float32)
cv2.fillPoly(sky, [np.array([[0, 0], [700, 0], [0, 1000]], np.int32)], 1)   # the sky, top left
lum = lin @ np.array([0.0722, 0.7152, 0.2126], np.float32)
bright = np.clip((lum - 0.08) * 6, 0, 1)
# … and what is outside the glass line: the terrace and the eave's soffit
terrace = np.zeros((H, W), np.float32)
cv2.fillPoly(terrace, [np.array([[0, 1820], [600, 1890], [1350, 2668], [0, 2668]], np.int32)], 1)
cv2.fillPoly(terrace, [np.array([[0, 520], [1500, 0], [1500, 40], [600, 760], [0, 1110]], np.int32)], 0.8)
outside = np.clip(cv2.GaussianBlur(win, (0, 0), 6) * (0.35 + 0.65 * bright) + cv2.GaussianBlur(sky, (0, 0), 20), 0, 1)
terrace_m = cv2.GaussianBlur(terrace, (0, 0), 24)
# the dining chairs and table stand in front of the back windows: keep them out of the mask
furniture = np.zeros((H, W), np.float32)
cv2.rectangle(furniture, (620, 1630), (1500, 1900), 1, -1)
outside *= 1 - cv2.GaussianBlur(furniture, (0, 0), 8)
cv2.imwrite(f'{out_dir}/mask-outside.png', (outside * 255).astype(np.uint8))

# ── morning: neutral-cool daylight, softer contrast, the garden fresh ────────────────────────────
m = lin * np.array([1.16, 1.0, 0.84], np.float32) * 1.12      # BGR gains: less orange, a touch cooler
mlum = (m @ np.array([0.0722, 0.7152, 0.2126], np.float32))[..., None]
m = mlum + (m - mlum) * 0.82
m = m * 0.92 + 0.012                                          # lifted shadows
green = np.array([0.95, 1.08, 0.9], np.float32)
m = m * (1 - outside[..., None] * 0.5) + (m * green * 1.15) * (outside[..., None] * 0.5)
save('interior-morning', m)

# ── evening: the room dark, night outside, warm lamps ───────────────────────────────────────────
e = lin * 0.085
e *= np.array([1.0, 1.0, 1.04], np.float32)
e *= (1 - 0.55 * terrace_m)[..., None]
night = lin * np.array([1.6, 0.55, 0.28], np.float32) * 0.09 + np.array([0.012, 0.006, 0.002], np.float32)
e = e * (1 - outside[..., None]) + night * outside[..., None]
def glow(cx, cy, rx, ry, strength):
    return np.exp(-(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)) * strength
def line_glow(x0, y0, x1, y1, width, strength):
    m_ = np.zeros((H, W), np.float32)
    cv2.line(m_, (x0, y0), (x1, y1), 1, 6, cv2.LINE_AA)
    return cv2.GaussianBlur(m_, (0, 0), width) * strength
warm = np.array([0.36, 0.64, 1.0], np.float32)                # BGR of 2700 K
L = np.zeros((H, W), np.float32)
L += line_glow(925, 1405, 1195, 1395, 8, 9) + line_glow(925, 1405, 1195, 1395, 40, 22)      # the pendant itself
L += glow(1060, 1720, 420, 160, 0.55)                                                       # its pool on the table
L += line_glow(600, 1085, 1600, 1110, 14, 10) + glow(1100, 1180, 600, 140, 0.25)            # ceiling cove
L += line_glow(1700, 1462, 1990, 1462, 6, 14) + glow(1845, 1540, 200, 90, 0.5)              # under the cabinets
L += glow(2610, 1000, 260, 520, 0.42) + glow(2610, 1400, 300, 420, 0.22)                    # wall-washers on the travertine
L += glow(1800, 1150, 450, 300, 0.12)                                                       # the walnut wall
L += glow(2000, 1900, 900, 260, 0.2) + glow(1500, 2150, 700, 260, 0.12)                     # downlights over the sofa and the rug
L += glow(2250, 1500, 160, 160, 0.18)                                                       # the olive tree's uplight
# the lamps light the room's own colours (lit × albedo), not a flat wash
albedo = np.clip(lin / (cv2.GaussianBlur(lin, (0, 0), 30) + 0.02), 0, 3) * cv2.GaussianBlur(lin, (0, 0), 30) ** 0.5
lit = albedo * warm * L[..., None] * 1.15
e = e + lit * (1 - outside[..., None] * 0.85)
save('interior-evening', e)
save('interior-golden', lin)
print('ok')
