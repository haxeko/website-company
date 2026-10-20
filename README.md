# VILLA NEST — Architecture · Interior · Smart Home

Website cao cấp cho thương hiệu **VILLA NEST**. Trang chủ là một **bức toàn cảnh 3D điện ảnh, liền mạch**: ba không
gian **SMART HOME — CONSTRUCTION — INTERIOR** nối tiếp nhau như những bức tường cong của một căn phòng tối — cuối ảnh
này ăn khớp với đầu ảnh kia — và vẫn xoay để chuyển cảnh khi bấm, kéo hay vuốt.

![VILLA NEST — desktop](docs/screenshot-desktop.jpg)

<img src="docs/screenshot-mobile.jpg" width="260" alt="VILLA NEST — iPhone">

## Điểm nổi bật

- **Ba ảnh hòa làm một**: các tấm ảnh được "bản lề" vào nhau trên một đa giác nhìn từ bên trong (tường cong), nên
  mép phải tấm này luôn trùng khít mép trái tấm kia ở mọi khung hình, kể cả khi đang xoay. Hai ảnh kề nhau chồng lên
  nhau một dải hẹp và hòa dần vào nhau (`mask-image`); khi xử lý ảnh, màu và ánh sáng ở hai mép chạm nhau còn được
  kéo về cùng một tông nên đường nối gần như biến mất.
- **Mở màn ~2 giây**: màn hình tối → máy quay lia nhẹ qua bức toàn cảnh, biệt thự hiện ra từ bóng tối và lấy nét →
  logo, menu, nhãn hiện lên sau cùng.
- **Chiều sâu điện ảnh**: ảnh hai bên nghiêng ±12°, nhoè và tối dần ra mép màn hình; mép trên/dưới tan vào bóng tối;
  phản chiếu trên sàn bóng, ánh sáng môi trường đổi màu theo ảnh ở giữa, vignette và film grain.
- **Vòng xoay vô hạn, không giật**: toàn bộ trạng thái là một số liên tục `progress`; mỗi ảnh có hai bản sao quanh
  vòng nên cả hai mép màn hình luôn có ảnh nối tiếp, không bao giờ trống hay nhảy vị trí.
- **Tương tác đầy đủ**: click ảnh bên, kéo chuột, vuốt cảm ứng có quán tính, phím ← →, bánh xe chuột / trackpad,
  hai mũi tên, nhãn bên dưới, hover (ảnh bên nghiêng vào và sáng lên), parallax nhẹ theo chuột, menu toàn màn hình.
- **Ảnh nội bộ, sắc nét**: AVIF (4:4:4, chất lượng cao) + WebP, 5 kích thước tới 3200 px cho màn hình Retina/4K và
  bản dọc cho điện thoại, thu nhỏ bằng Lanczos và làm nét nhẹ. Ảnh được tải
  **và giải mã** trước khi cảnh xuất hiện — không bao giờ có khung trắng khi chuyển cảnh. Không phụ thuộc CDN hay
  Internet (font cũng được đóng gói cục bộ).
- **Nhẹ cho GPU**: chỉ dùng CSS 3D transform / opacity / filter, không WebGL. Tự chuyển sang chế độ nhẹ khi FPS thấp,
  tôn trọng `prefers-reduced-motion`.

## Công nghệ

React 19 · Vite 8 · TypeScript · GSAP 3 · CSS 3D Transforms · CSS Mask Image · sharp (xử lý ảnh) · Montserrat
(Fontsource, tự host).

## Yêu cầu

- **Node.js 20.19+** hoặc **22.12+** (kèm npm 10+).

## Cài đặt & chạy thử

```bash
npm install
npm run dev          # http://localhost:5173  (mở được từ điện thoại cùng mạng LAN: http://<IP-máy>:5173)
```

Các lệnh khác:

| Lệnh                | Tác dụng                                                     |
| ------------------- | ------------------------------------------------------------ |
| `npm run build`     | Kiểm tra TypeScript và build website tĩnh vào `dist/`        |
| `npm run preview`   | Chạy bản build tại http://localhost:4173                     |
| `npm run typecheck` | Chỉ kiểm tra TypeScript                                      |
| `npm run lint`      | Kiểm tra mã nguồn (oxlint)                                   |
| `npm run images`    | Tạo lại toàn bộ ảnh tối ưu từ `assets-src/` (xem phần Thay ảnh) |

## Build & triển khai bằng Nginx

```bash
npm run build                                    # → thư mục dist/
sudo mkdir -p /var/www/villa-nest
sudo cp -r dist/. /var/www/villa-nest/
sudo cp deploy/nginx.conf /etc/nginx/conf.d/villa-nest.conf   # sửa server_name / root cho phù hợp
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ten-mien-cua-ban.vn      # (tuỳ chọn) bật HTTPS
```

File [`deploy/nginx.conf`](deploy/nginx.conf) đã cấu hình sẵn: gzip, cache 1 năm cho JS/CSS/font có hash, cache 30
ngày cho ảnh, `no-cache` cho `index.html` (triển khai bản mới là thấy ngay), header bảo mật cơ bản, và chuyển mọi URL
lạ về trang chủ. Nếu Nginx của bạn cũ hơn 1.24 và chưa biết định dạng AVIF, thêm dòng `image/avif avif;` vào
`/etc/nginx/mime.types`.

**Raspberry Pi:** xem hướng dẫn riêng [`docs/RASPBERRY-PI.md`](docs/RASPBERRY-PI.md) — có script cài tự động
`bash deploy/install-pi.sh`.

Bản build dùng đường dẫn tương đối (`base: './'`) nên có thể đặt ở gốc tên miền hoặc trong thư mục con
(ví dụ `https://example.com/villa/`). Website cần được phục vụ qua HTTP (Nginx, `npm run preview`, hoặc bất kỳ
static server nào); mở trực tiếp `dist/index.html` bằng `file://` sẽ bị trình duyệt chặn module JavaScript.

## Cấu trúc thư mục

```
├── assets-src/                 Ảnh gốc độ phân giải cao (đầu vào của npm run images)
├── deploy/
│   ├── nginx.conf              Cấu hình Nginx mẫu
│   └── install-pi.sh           Script cài lên Raspberry Pi / Debian / Ubuntu
├── docs/                       Ảnh chụp màn hình, hướng dẫn Raspberry Pi
├── public/
│   ├── assets/slides/          Tấm toàn cảnh đã tối ưu: AVIF/WebP ngang, dọc, ambient (sinh tự động)
│   └── favicon.svg
├── scripts/optimize-images.mjs Pipeline ảnh: chỉnh màu, cắt tấm, hòa mép, resize, mã hoá AVIF/WebP
└── src/
    ├── App.tsx                 Ghép Header, Menu, Loader và HeroCarousel
    ├── config/animation.ts     ★ Toàn bộ thông số hiệu ứng / chuyển động / bố cục
    ├── data/
    │   ├── slides.ts           Nội dung 3 lĩnh vực (nhãn, mô tả ảnh, credit)
    │   └── media.json          Cấu hình ảnh: kích thước, điểm lấy nét, chỉnh màu (dùng chung với script)
    ├── components/
    │   ├── HeroCarousel/
    │   │   ├── HeroCarousel.tsx    Markup + nạp trước ảnh + nối React với engine
    │   │   ├── CarouselEngine.ts   Engine GSAP: progress, kéo/vuốt/phím/wheel, intro, chế độ nhẹ
    │   │   ├── carouselMath.ts     Toán thuần: trạng thái CENTER/LEFT/RIGHT, mask làm mềm cạnh
    │   │   ├── SlideImage.tsx      <picture> AVIF/WebP, art-direction ngang/dọc
    │   │   └── HeroCarousel.css
    │   ├── Header/             Logo + nút menu hamburger
    │   ├── MenuOverlay/        Menu toàn màn hình
    │   └── Loader/             Vạch tiến trình tối giản khi ảnh đang tải
    ├── styles/                 tokens.css (màu, font, khoảng cách) · global.css
    └── utils/device.ts         Nhận diện chế độ chất lượng & media query
```

## Tinh chỉnh hiệu ứng

Mọi thông số nằm trong [`src/config/animation.ts`](src/config/animation.ts). Khi chạy `npm run dev`, lưu file là
trang tự cập nhật.

| Thông số             | Mặc định        | Ý nghĩa                                                                     |
| -------------------- | --------------- | --------------------------------------------------------------------------- |
| `transitionDuration` | `1.1`           | Thời gian (giây) chuyển một slide khi click / phím / nhãn                   |
| `ease`               | `power3.inOut`  | Easing của GSAP cho chuyển cảnh                                             |
| `releaseEase`        | `power3.out`    | Easing khi thả tay sau khi kéo/vuốt (giữ quán tính)                         |
| `dragSensitivity`    | `1`             | Độ nhạy kéo/vuốt: 1 = ảnh bám theo ngón tay 1:1                             |
| `flickVelocity`      | `0.35`          | Tốc độ (slide/giây) tối thiểu để một cú vuốt nhanh được tính là chuyển slide |
| `sideRotate`         | `12`            | Góc (độ) giữa hai tấm kề nhau — độ cong của bức tường: trái +12°, phải −12°. Nên 6–20 |
| `sideOpacity`        | `1`             | Độ đục ảnh hai bên (giữ 1 để toàn cảnh liền mạch)                           |
| `sideBlur`           | `3`             | Độ nhoè (px) ảnh hai bên (0 = tắt filter blur)                              |
| `sideBrightness`     | `0.62`          | Độ sáng ảnh hai bên (1 = giữ nguyên)                                        |
| `perspective`        | `1300`          | Khoảng phối cảnh CSS (px); càng nhỏ 3D càng mạnh                            |
| `fadeStrength`       | `0.5`           | Độ mềm của mép trên/dưới: 0 ≈ cạnh gọn, 1 = rất mềm, mơ màng                 |
| `seam`               | `0.22`          | Bề rộng dải hòa trộn giữa hai ảnh kề nhau (lấy từ `media.json`, xem Thay ảnh) |
| `reflection`         | `0.22`          | Độ đậm phản chiếu trên sàn (0 = tắt)                                        |
| `ambientLight`       | `0.36`          | Độ mạnh ánh sáng màu hắt ra phòng từ ảnh trung tâm (0 = tắt)                |
| `parallaxTilt`       | `2`             | Góc nghiêng tối đa (độ) theo chuột trên desktop (0 = tắt)                   |
| `hover.*`            | —               | Ảnh bên khi rê chuột: sáng lên, bớt nhoè                                    |
| `intro.duration`     | `2.2`           | Thời gian lia máy và lấy nét của cảnh mở màn                                |
| `layouts.portrait`   | —               | Bố cục điện thoại / màn hình dọc (mỗi tấm rộng 80%, perspective 1000…)      |
| `layouts.landscape`  | —               | Bố cục desktop (mỗi tấm rộng 58% màn hình, tỉ lệ 3:2…)                      |

Màu sắc và font nằm trong [`src/styles/tokens.css`](src/styles/tokens.css): nền `#101113`, chữ `#F4F0E9`,
chữ phụ `#A6A6A6`, điểm nhấn `#C8AA78`.

## Thay ảnh

1. Đặt ảnh gốc ngang, chất lượng cao (khuyến nghị ≥ 3000 px chiều rộng) vào `assets-src/`, ví dụ
   `assets-src/construction.jpg`.
2. Chỉnh `src/data/media.json` nếu cần:
   - `order` — thứ tự ảnh trên bức toàn cảnh (ảnh cuối nối vòng về ảnh đầu),
   - `focus` — điểm canh khi cắt ảnh cho tấm ngang `[x, y]` (0–1),
   - `portraitFocusX` — vị trí cắt ngang cho tấm dọc trên điện thoại,
   - `grade` — chỉnh màu: `exposure`, `contrast`, `saturation`, `greens` (giảm xanh lá), `warmth`,
   - `geometry` — tỉ lệ tấm (`landscapeAspect`, `portraitAspect`) và `seam` (bề rộng dải hòa trộn),
   - `harmonize` — mức kéo màu hai mép chạm nhau về cùng tông (`strength` 0–1) và độ sâu vào trong ảnh (`reach`).
3. Chạy `npm run images` (luôn xử lý cả ba ảnh vì các mép phụ thuộc lẫn nhau; mất vài phút).
   Muốn xem nhanh đường nối trước: `PANORAMA_PREVIEW=preview.jpg node scripts/optimize-images.mjs` sẽ ghép ba ảnh
   thành một tấm `preview.jpg` rồi dừng.
4. Cập nhật mô tả `alt`, nhãn và thông tin tác giả trong `src/data/slides.ts`.

## Điều khiển

| Thiết bị    | Thao tác                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------ |
| Chuột       | Click ảnh bên, kéo trái/phải, cuộn bánh xe, mũi tên ‹ ›, click nhãn, rê chuột lên ảnh bên  |
| Cảm ứng     | Vuốt trái/phải (vuốt dọc không bị chặn), chạm ảnh bên, chạm nhãn                           |
| Bàn phím    | ← → chuyển slide; Tab tới nhãn / mũi tên / menu, Enter để chọn; Esc đóng menu              |

## Hiệu năng & khả năng tiếp cận

- Ảnh được chọn theo màn hình (`srcset`/`sizes`, AVIF trước, WebP dự phòng) và giải mã trước khi hiển thị.
- Chỉ animate `transform`, `opacity`, `filter`; engine chỉ chạy vòng render khi có chuyển động.
- **Chế độ nhẹ** (không blur, không phản chiếu, không grain) tự bật khi hai lần chuyển cảnh chạy dưới 40 FPS,
  hoặc khi thiết bị rất yếu / bật Tiết kiệm dữ liệu. Ép chế độ bằng `?quality=low` hoặc `?quality=high`.
- `prefers-reduced-motion`: bỏ parallax, rút ngắn chuyển cảnh còn ~0,45 s, mở màn chỉ là fade.
- Có nhãn ARIA cho carousel và nút, vùng `aria-live` đọc tên lĩnh vực hiện tại, focus hiển thị rõ khi dùng bàn phím.

## Trình duyệt hỗ trợ

Chrome / Edge 111+, Firefox 114+, Safari 16.4+ (iPhone / iPad iOS 16.4+), Chrome Android — theo mục tiêu build mặc
định của Vite 8.

## Đã kiểm thử

Kiểm thử tự động bằng Playwright (Chromium) trên bản build:

- Desktop 1920×1080, 1440×900, 1280×720, 2560×1080; iPhone 14 Pro (cảm ứng), Android 360×800, iPad dọc 820×1180,
  điện thoại xoay ngang 844×390.
- Click ảnh bên, kéo chuột, kéo ngắn bật lại, vuốt cảm ứng, vuốt nhanh, vuốt dọc bị bỏ qua, phím ← → (kể cả bấm dồn
  dập qua điểm lặp vòng), bánh xe / trackpad (một cử chỉ = một slide), mũi tên, nhãn, menu, Esc, logo.
- Kiểm tra từng khung hình 60 fps bằng đồng hồ giả lập: không có ảnh nào nhảy vị trí hay nhấp nháy khi lặp vòng.
- Không có lỗi console, không có request ra ngoài Internet, không có thanh cuộn ngang; chạy đúng sau Nginx với cấu hình
  trong `deploy/nginx.conf`.

## Bản quyền ảnh

Ảnh minh hoạ lấy từ Unsplash, dùng theo [Unsplash License](https://unsplash.com/license) (miễn phí cho mục đích
thương mại). Thay bằng ảnh dự án thật của VILLA NEST trước khi ra mắt chính thức.

- Construction — [Arthur BAUDRY](https://unsplash.com/photos/modern-house-exterior-glows-with-lights-4vioYQ9Nn9Y)
- Smart Home — [HUUM](https://unsplash.com/photos/a-hand-holding-a-black-device-NohN3BIkAZM)
- Interior — [Lumbardh Plluzhina](https://unsplash.com/photos/a-modern-living-room-with-a-large-window-7NvBEeHDY7M)
