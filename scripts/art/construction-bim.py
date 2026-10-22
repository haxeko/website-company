"""The Construction page's BIM model: a render of the same view as the panorama (the bare
concrete frame with its pipes, ducts and cable trays), laid exactly onto the photo so the laser
line can divide the two anywhere. The render, enlarged ×4 beforehand (Real-ESRGAN x4plus, as
the panorama was), is matched to the panorama (SIFT features on both at 2000 px, a RANSAC
similarity), warped onto the panorama's pixels and cut to the page's view.

    python construction-bim.py bim-x4.png assets-src/panorama-construction-interior.jpg \
        assets-src/construction-bim.jpg 0 6937"""
import sys, numpy as np, cv2
src, pano_path, out, x0, x1 = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
bim, pano = cv2.imread(src), cv2.imread(pano_path)
SMALL = 2000


def small(img):
    return cv2.cvtColor(cv2.resize(img, (SMALL, round(img.shape[0] * SMALL / img.shape[1])), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)


def scaling(s):
    """Full-size pixel → 2000 px pixel (pixel centres kept), as a 3 × 3 matrix."""
    return np.array([[1 / s, 0, 0.5 / s - 0.5], [0, 1 / s, 0.5 / s - 0.5], [0, 0, 1]])


sift = cv2.SIFT_create(8000)
k1, d1 = sift.detectAndCompute(small(bim), None)
k2, d2 = sift.detectAndCompute(small(pano), None)
good = [a for a, b in cv2.BFMatcher().knnMatch(d1, d2, k=2) if a.distance < 0.7 * b.distance]
p1 = np.float32([k1[a.queryIdx].pt for a in good])
p2 = np.float32([k2[a.trainIdx].pt for a in good])
m, inliers = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=2.0)
# render (full size) → render at 2000 px → panorama at 2000 px → panorama (full size)
full = np.linalg.inv(scaling(pano.shape[1] / SMALL)) @ np.vstack([m, [0, 0, 1]]) @ scaling(bim.shape[1] / SMALL)
warped = cv2.warpAffine(bim, full[:2], (pano.shape[1], pano.shape[0]), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
cv2.imwrite(out, warped[:, x0:x1], [cv2.IMWRITE_JPEG_QUALITY, 93])
print(f'{len(good)} matches, {int(inliers.sum())} kept; render → photo:\n{full[:2].round(4)}')
