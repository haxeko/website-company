"""Smart Home wall, v4: the control panel mounted on the travertine and seen at an angle, as on
the Smart Home page — the wall turned further away from the camera, the panel standing off it
with its edge, its shadow and the wall-washer's light.

The screen stays dark glass: the website draws the live screen on top with the CSS twin of the
projection used here (media.json → images.smart-home.screen: x, y, width, height = the screen's
flat rectangle; tilt = perspective(D) rotateY(angle) about its left-centre).

    python smart-home-wall.py <clean stone wall.jpg> <screen preview.png> <out.jpg> 1.55 -900 0.82
    (the wall: the HUUM photo on Unsplash with the thermostat removed; the screen preview only
     lights the stone around the panel)"""
import sys, math, json, numpy as np, cv2

wall_path, ui_path, out = sys.argv[1:4]
src = cv2.imread(wall_path).astype(np.float32) / 255           # BGR
H, W = src.shape[:2]

# The photographed wall already recedes a little: the model the first panel was made with.
OLD_T, OLD_D, OLD_AX, OLD_AY = math.radians(10.0), 9110.0, 3239.0, 2330.0

# The new view.
TILT = 34.0                       # degrees: the right side recedes
D = 6000.0                        # viewing distance, output px
SX, SY, SW, SH = 3420, 1691, 2122, 1278   # the screen glass, flat, output px
BEZEL = 64
DEPTH = 76                        # how far the panel stands off the wall, px
PW, PH = SW + 2 * BEZEL, SH + 2 * BEZEL
AX, AY = SX, SY + SH / 2          # the turn's axis: the screen's left-centre
MAG = float(sys.argv[4]) if len(sys.argv) > 4 else 1.25   # stone texture scale vs the old view
OFF_X = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0   # where on the stone the panel hangs (old units)
th = math.radians(TILT)
c, s = math.cos(th), math.sin(th)

def proj(x, y, z=0.0):
    """Panel-plane point (x from the axis, y from the centre line, z towards the camera) → output px."""
    xr = x * c + z * s
    zr = -x * s + z * c
    k = D / (D - zr)
    return AX + xr * k, AY + y * k

# ── the wall: for every output pixel, the point of the wall plane (z = -DEPTH) it sees ───────────
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dX = xx - AX
xw = (dX * (D + DEPTH * c) + D * DEPTH * s) / (D * c - dX * s)        # along the wall
yw = (yy - AY) * (D + xw * s + DEPTH * c) / D
# … in the photographed wall's own (old-view) coordinates, then into the photo
xo = xw / MAG + OFF_X
yo = yw / MAG
so = 1 / (1 + xo * math.sin(OLD_T) / OLD_D)
mapx = (OLD_AX + xo * math.cos(OLD_T) * so).astype(np.float32)
mapy = (OLD_AY + yo * so).astype(np.float32)
cover = (mapx >= 0) & (mapx <= W - 1) & (mapy >= 0) & (mapy <= H - 1)
print(json.dumps({'uncovered_%': round(100 * (1 - cover.mean()), 2)}))
# landscape crop of the slide (aspect 1.708, centred) and portrait crop (0.976, focus 0.82)
lh = round(W / 1.708); ly0 = (H - lh) // 2
pw_ = round(H * 0.976); px0 = round((W - pw_) * float(sys.argv[6] if len(sys.argv) > 6 else 0.82))
print(json.dumps({'landscape_uncovered_%': round(100 * (1 - cover[ly0:ly0 + lh].mean()), 2),
                  'portrait_uncovered_%': round(100 * (1 - cover[:, px0:px0 + pw_].mean()), 2)}))
wall = cv2.remap(src, mapx, mapy, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

# ── evening light, in the wall's own coordinates: a wall-washer above the panel, dark falloff ───
lin = np.clip(wall, 0, 1) ** 2.2
cxw = SW / 2
pool = np.exp(-(((xw - cxw) / 2300) ** 2 + ((yw + 1150) / 1750) ** 2))
side = np.exp(-(((xw + 3300) / 2200) ** 2)) * 0.14
lin *= (0.07 + 0.6 * pool + side)[..., None]
lin *= np.array([0.86, 0.97, 1.08], np.float32)                   # BGR: warm 2700 K
wall = lin

# ── the panel, drawn flat on a canvas and put in place with the glass plane's homography ─────────
M = 160
CW, CH = PW + 2 * M, PH + 2 * M
def rrect(w, h, r, ox, oy):
    a = np.zeros((CH, CW), np.float32)
    cv2.rectangle(a, (ox + r, oy), (ox + w - r, oy + h), 1, -1)
    cv2.rectangle(a, (ox, oy + r), (ox + w, oy + h - r), 1, -1)
    for qx, qy in [(ox + r, oy + r), (ox + w - r, oy + r), (ox + r, oy + h - r), (ox + w - r, oy + h - r)]:
        cv2.circle(a, (qx, qy), r, 1, -1, lineType=cv2.LINE_AA)
    return a
alpha = rrect(PW, PH, 30, M, M)
screen = rrect(SW, SH, 14, M + BEZEL, M + BEZEL)
cv_, cu_ = np.mgrid[0:CH, 0:CW].astype(np.float32)
vt = np.clip((cv_ - M) / PH, 0, 1)
ut = np.clip((cu_ - M) / PW, 0, 1)
panel = np.zeros((CH, CW, 3), np.float32)
panel[:] = np.array([0.0046, 0.0042, 0.0038], np.float32)          # matte black glass bezel
panel = panel * (1 - screen[..., None]) + np.float32(0.0026) * screen[..., None]
# brushed-bronze rim round the front, brighter on top (the light is above)
rim = (alpha - cv2.erode(alpha, np.ones((9, 9), np.uint8))).clip(0, 1)
rimcol = np.array([0.14, 0.22, 0.31], np.float32) * (0.3 + 0.7 * (1 - vt))[..., None]
panel = panel * (1 - rim[..., None]) + rimcol * rim[..., None]
# the wall-washer's light on the glass, strongest at the top left
sheen = np.clip(1 - (ut * 0.85 + vt * 1.3), 0, 1) ** 2.2 * 0.03 * alpha
panel += sheen[..., None] * np.array([0.85, 0.93, 1.0], np.float32)

def canvas_to_panel(u, v):
    return u - (M + BEZEL), v - (M + PH / 2)
src_q = np.float32([[0, 0], [CW, 0], [CW, CH], [0, CH]])
dst_q = np.float32([proj(*canvas_to_panel(u, v)) for u, v in src_q])
Hm = cv2.getPerspectiveTransform(src_q, dst_q)
warp = lambda a, f=cv2.INTER_LINEAR: cv2.warpPerspective(a, Hm, (W, H), flags=f)
wp, wa = warp(panel, cv2.INTER_CUBIC), warp(alpha)

# ── its left edge, seen past the front: the depth of the panel (dark anodised metal) ─────────────
x0 = -BEZEL
top, bot = -PH / 2 + 30, PH / 2 - 30
edge = np.float32([proj(x0, top, 0), proj(x0, bot, 0), proj(x0, bot, -DEPTH), proj(x0, top, -DEPTH)])
emask = np.zeros((H, W), np.float32)
cv2.fillConvexPoly(emask, np.round(edge * 8).astype(np.int32), 1, lineType=cv2.LINE_AA, shift=3)
# rounded ends: the corners' radius continues on the edge
for yy_ in (top, bot):
    a0, a1 = proj(x0 + 30, yy_ + (-30 if yy_ < 0 else 30), 0), proj(x0 + 30, yy_ + (-30 if yy_ < 0 else 30), -DEPTH)
emask = cv2.GaussianBlur(emask, (0, 0), 0.8)
ev = np.clip((yy - edge[0][1]) / max(1.0, edge[1][1] - edge[0][1]), 0, 1)
edgecol = np.array([0.016, 0.017, 0.019], np.float32) * (1.0 + 2.6 * (1 - ev) ** 1.5)[..., None]
# a fine highlight where the front meets the edge
fx0, fy0 = proj(x0, top, 0)
fx1, fy1 = proj(x0, bot, 0)
hl = np.zeros((H, W), np.float32)
cv2.line(hl, (int(round(fx0 * 8)), int(round(fy0 * 8))), (int(round(fx1 * 8)), int(round(fy1 * 8))), 1, 3, cv2.LINE_AA, shift=3)
hl = cv2.GaussianBlur(hl, (0, 0), 1.2) * (0.25 + 0.75 * (1 - ev))
edgecol = edgecol + (hl * 0.13)[..., None] * np.array([0.72, 0.84, 1.0], np.float32)

# ── the screen's own light on the stone around it ───────────────────────────────────────────────
ui = cv2.imread(ui_path).astype(np.float32) / 255
ui = cv2.resize(ui, (SW, SH), interpolation=cv2.INTER_AREA) ** 2.2
uic = np.zeros((CH, CW, 3), np.float32)
uic[M + BEZEL:M + BEZEL + SH, M + BEZEL:M + BEZEL + SW] = ui
lum = warp(uic).mean(axis=2) * 0.55
glow = cv2.GaussianBlur(lum, (0, 0), 240) * 1.5 + cv2.GaussianBlur(lum, (0, 0), 80) * 0.45
wall += (glow[..., None] * np.array([0.55, 0.62, 0.70], np.float32)) * (1 - wa[..., None])

# ── its shadow on the stone: the light comes from above, the panel stands DEPTH px off ─────────
foot = np.zeros((H, W), np.float32)
def wall_pt(x, y):
    return proj(x, y, -DEPTH)
for (ox, oy, blur, dark) in [(0.3, 1.5, 58, 0.78), (0.08, 0.42, 11, 0.66)]:
    q = np.float32([wall_pt(x0 + ox * DEPTH, -PH / 2 + oy * DEPTH * 1.6), wall_pt(PW - BEZEL + ox * DEPTH, -PH / 2 + oy * DEPTH * 1.6),
                    wall_pt(PW - BEZEL + ox * DEPTH, PH / 2 + oy * DEPTH * 1.6), wall_pt(x0 + ox * DEPTH, PH / 2 + oy * DEPTH * 1.6)])
    m = np.zeros((H, W), np.float32)
    cv2.fillConvexPoly(m, np.round(q * 8).astype(np.int32), 1, lineType=cv2.LINE_AA, shift=3)
    m = cv2.GaussianBlur(m, (0, 0), blur) * dark
    foot = foot + m - foot * m
wall *= (1 - np.clip(foot, 0, 0.9))[..., None]

comp = wall * (1 - emask[..., None]) + edgecol * emask[..., None]
comp = comp * (1 - wa[..., None]) + wp * wa[..., None]
img = np.clip(comp, 0, 1) ** (1 / 2.2)
img += np.random.default_rng(7).normal(0, 0.006, (H, W, 1)).astype(np.float32)
img8 = (np.clip(img, 0, 1) * 255).round().astype(np.uint8)
cv2.imwrite(out, img8, [cv2.IMWRITE_JPEG_QUALITY, 95])
corners = [proj(a, b) for a, b in [(0, -SH / 2), (SW, -SH / 2), (SW, SH / 2), (0, SH / 2)]]
frame_left = min(edge[:, 0])
info = {'screen_quad': [[round(x, 1), round(y, 1)] for x, y in corners], 'frame_left': round(float(frame_left), 1),
        'bezel_eff': round(SX - float(frame_left), 1), 'top_centre': [round(v, 1) for v in proj(SW / 2, -PH / 2)],
        'centre': [round(v, 1) for v in proj(SW / 2, 0)]}
print(json.dumps(info))
cv2.imwrite(out.replace('.jpg', '-prev.jpg'), cv2.resize(img8, (1400, 933), interpolation=cv2.INTER_AREA))
x0p, y0p = int(SX - 700), int(SY - 600)
cv2.imwrite(out.replace('.jpg', '-zoom.jpg'), cv2.resize(img8[y0p:y0p + 2400, x0p:x0p + 3400], (1200, 847), interpolation=cv2.INTER_AREA))
