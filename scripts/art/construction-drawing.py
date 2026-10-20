"""The Construction page's drawing: the photographed villa as an architect's line drawing, in
warm light lines on black (the page adds it to its charcoal paper in screen blend). Lines from
an XDoG of the photo after a local contrast normalisation, so the dark garden and the bright
sky draw with the same weight; the sky's clouds and the water's ripples are drawn lighter.

    python construction-drawing.py assets-src/panorama-construction-interior.jpg \
        assets-src/construction-drawing.png 0 6937 0.5"""
import sys, numpy as np, cv2
src, out, x0, x1, scale = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
img = cv2.imread(src)[:, x0:x1]
small = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
g = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
mean = cv2.GaussianBlur(g, (0, 0), 25 * scale / 0.5)
std = np.sqrt(cv2.GaussianBlur((g - mean) ** 2, (0, 0), 25 * scale / 0.5)) + 0.03
n = np.clip((g - mean) / std * 0.18 + 0.5, 0, 1)
n = cv2.bilateralFilter(n, 7, 0.12, 5)
sigma = 1.0 * scale / 0.5
a = cv2.GaussianBlur(n, (0, 0), sigma)
b = cv2.GaussianBlur(n, (0, 0), sigma * 1.6)
d = a - 0.98 * b
eps = -0.01
e = np.where(d >= eps, 1.0, 1.0 + np.tanh(180 * (d - eps)))
lines = 1 - np.clip(e, 0, 1)
h, w = lines.shape
# The sky (bright, smooth, above the roofs) and the pool (below the deck) draw lighter.
ys = np.mgrid[0:h, 0:w][0] / h
texture = cv2.GaussianBlur(np.abs(n - cv2.GaussianBlur(n, (0, 0), 3)), (0, 0), 12)
sky = np.clip((0.45 - ys) * 6, 0, 1) * np.clip((0.06 - texture) * 30, 0, 1)
lines *= 1 - 0.75 * cv2.GaussianBlur(sky, (0, 0), 10)
water = np.clip((ys - 0.72) * 8, 0, 1)
lines *= 1 - 0.35 * water
alpha = np.clip(lines * 1.05, 0, 1)
ink = np.array([0.925, 0.886, 0.84], np.float32)            # BGR: warm white
cv2.imwrite(out, (alpha[..., None] * ink * 255).round().astype(np.uint8))
print(w, h)
