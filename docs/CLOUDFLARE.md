# Đưa website lên tên miền qua Cloudflare

Hướng dẫn trỏ tên miền (ví dụ `villanest.vn`) về website VILLA NEST đang chạy trên Raspberry Pi
(`192.168.1.8`, Nginx cổng 80 — xem [RASPBERRY-PI.md](RASPBERRY-PI.md)).

Trong hướng dẫn, thay **`tenmien.vn`** bằng tên miền thật của bạn.

## Chọn cách kết nối

| | **Cách A — Cloudflare Tunnel** (khuyên dùng) | Cách B — Mở cổng modem |
| --- | --- | --- |
| Mở cổng 80/443 trên modem | Không | Có |
| Cần IP tĩnh | Không | Có (hoặc DDNS) |
| Nhà mạng dùng CGNAT (FPT, VNPT, Viettel thường dùng) | Vẫn chạy | **Không chạy** |
| HTTPS | Tự động | Tự cấu hình |
| Lộ IP nhà | Không | Có |

Pi tự mở một kết nối ra ngoài tới Cloudflare; khách truy cập `https://tenmien.vn` → Cloudflare → đường hầm →
Nginx trên Pi. Không cần đụng vào modem.

---

## Bước 1 — Đưa tên miền vào Cloudflare

1. Đăng ký / đăng nhập <https://dash.cloudflare.com>.
2. **Add a domain** (Thêm tên miền) → nhập `tenmien.vn` → chọn gói **Free**.
3. Cloudflare quét các bản ghi DNS hiện có. Nếu đang có bản ghi `A` / `CNAME` cho `tenmien.vn` (`@`) hoặc `www`
   trỏ tới hosting cũ thì **xoá hai bản ghi đó** (bước 4 sẽ tự tạo bản ghi mới). Giữ nguyên các bản ghi email
   (`MX`, `TXT`…) nếu có.
4. Cloudflare đưa ra **2 nameserver**, dạng `xxx.ns.cloudflare.com`.
5. Vào trang quản lý tên miền ở nơi bạn mua (Mắt Bão, PA Việt Nam, Nhân Hòa, Tenten, iNET, Namecheap, GoDaddy…)
   → mục **Nameserver / DNS** → chọn dùng nameserver riêng → thay toàn bộ bằng 2 nameserver của Cloudflare → lưu.
6. Chờ Cloudflare báo tên miền **Active** (thường vài phút đến vài giờ, tối đa 24–48 giờ). Kiểm tra từ máy tính:

   ```bash
   nslookup -type=ns tenmien.vn      # phải thấy *.ns.cloudflare.com
   ```

## Bước 2 — Kiểm tra website trên Pi

Trên Pi:

```bash
curl -s http://localhost/ | grep -o '<title>.*</title>'
```

Phải thấy `<title>VILLA NEST — …</title>`. Nếu thấy `Welcome to nginx`, xử lý theo
[RASPBERRY-PI.md](RASPBERRY-PI.md#xử-lý-sự-cố) trước. (Nếu đã cài website ở cổng khác, ví dụ `PORT=8080`, thì dùng
`http://localhost:8080/` ở lệnh trên và ở bước 4.)

## Bước 3 — Tạo Tunnel và cài `cloudflared` lên Pi

1. Trong Cloudflare: **Networking → Tunnels** (giao diện cũ: **Zero Trust → Networks → Tunnels**) →
   **Create a tunnel** → chọn **Cloudflared** → đặt tên, ví dụ `villa-nest-pi` → **Save**.
2. Ở màn hình cài đặt, chọn hệ điều hành **Debian** và kiến trúc theo Pi. Kiểm tra kiến trúc trên Pi:

   ```bash
   dpkg --print-architecture         # arm64 (Pi OS 64-bit) hoặc armhf (32-bit)
   ```

3. Cloudflare hiện sẵn các lệnh cài kèm **token** riêng của tunnel. Copy và chạy trên Pi. Các lệnh có dạng:

   ```bash
   # Thêm kho phần mềm của Cloudflare và cài cloudflared
   sudo mkdir -p --mode=0755 /usr/share/keyrings
   curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
   echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' \
     | sudo tee /etc/apt/sources.list.d/cloudflared.list
   sudo apt-get update && sudo apt-get install -y cloudflared

   # Cài thành dịch vụ chạy nền, tự khởi động cùng Pi (token lấy từ trang Cloudflare)
   sudo cloudflared service install <TOKEN>
   ```

   > Giữ bí mật token: ai có token đều chạy được tunnel của bạn.

4. Kiểm tra:

   ```bash
   sudo systemctl status cloudflared     # active (running)
   ```

   Trên trang Cloudflare, tunnel chuyển sang trạng thái **Healthy** → **Next**.

## Bước 4 — Gắn tên miền vào tunnel

Trong tunnel vừa tạo → tab **Public hostname** / **Routes** → **Add a public hostname** (thêm 2 dòng):

| Subdomain | Domain | Path | Service type | URL |
| --- | --- | --- | --- | --- |
| *(để trống)* | `tenmien.vn` | *(trống)* | `HTTP` | `localhost:80` |
| `www` | `tenmien.vn` | *(trống)* | `HTTP` | `localhost:80` |

Lưu lại. Cloudflare tự tạo bản ghi DNS (`CNAME … .cfargotunnel.com`, đám mây màu cam). Sau 1–2 phút mở
**https://tenmien.vn** là thấy website, có sẵn HTTPS.

> Nếu báo *"An A, AAAA, or CNAME record with that host already exists"*: vào **DNS → Records**, xoá bản ghi cũ trùng
> tên (`@` hoặc `www`) rồi lưu lại.

## Bước 5 — Cài đặt nên làm trong Cloudflare

- **SSL/TLS → Edge Certificates → Always Use HTTPS: On** — mọi truy cập `http://` tự chuyển sang `https://`.
- **www → tên miền chính** (để chỉ có một địa chỉ): **Rules → Redirect Rules → Create rule** → chọn mẫu
  *Redirect from WWW to Root* → Deploy.
- **Speed → Optimization → Rocket Loader: Off** — tính năng này viết lại JavaScript, có thể làm hỏng hiệu ứng.
- **Caching**: để mặc định (*Caching Level: Standard* — đừng chọn *Ignore Query String*). Nginx đã gửi sẵn header:
  `index.html` không bị cache (cập nhật là thấy ngay), file JS/CSS có tên băm (cache 1 năm), ảnh cache 30 ngày — đường
  dẫn ảnh có kèm mã theo nội dung file (`…/smart-home-1920.avif?v=91ccea55f4`), nên ảnh nào thay đổi thì địa chỉ đổi
  theo: không cần Purge sau khi cập nhật.

## Bước 6 — Kiểm tra

```bash
curl -sI https://tenmien.vn | grep -iE '^(HTTP|server|cf-cache-status)'
# HTTP/2 200
# server: cloudflare
```

Mở thử trên điện thoại bằng 4G (không dùng Wi-Fi nhà) để chắc chắn người ngoài vào được.

## Cập nhật website sau này

Không cần làm gì thêm với Cloudflare — cập nhật trên Pi như cũ:

```bash
cd ~/villa-nest && git pull && bash deploy/install-pi.sh
```

## (Tuỳ chọn) Đưa ken-dashboard lên subdomain

Cùng tunnel, thêm public hostname `dashboard` · `tenmien.vn` · `HTTP` · `localhost:6969`.

Vì đây là dashboard riêng, nên khoá lại bằng **Cloudflare Access** (miễn phí đến 50 người dùng): **Zero Trust →
Access → Applications → Add an application → Self-hosted** → domain `dashboard.tenmien.vn` → policy *Allow* với
email của bạn. Khi mở trang, Cloudflare gửi mã đăng nhập vào email trước khi cho vào.

## Xử lý sự cố

| Hiện tượng | Cách xử lý |
| --- | --- |
| Lỗi **502 Bad Gateway** | Nginx chưa chạy hoặc sai cổng: `sudo systemctl status nginx`, `curl -I http://localhost/`; URL ở bước 4 phải đúng cổng |
| Lỗi **1033** / tunnel *Down* | `sudo systemctl restart cloudflared`; xem log: `sudo journalctl -u cloudflared -n 50` |
| Hiện **Welcome to nginx** | Site mặc định của Nginx còn bật: `sudo rm /etc/nginx/sites-enabled/default && sudo systemctl reload nginx` (hoặc chạy lại `deploy/install-pi.sh`) |
| Tên miền chưa vào được, Cloudflare báo *Pending* | Nameserver chưa đổi xong ở nơi mua tên miền (bước 1.5); kiểm tra bằng `nslookup -type=ns tenmien.vn` |
| Vẫn thấy bản cũ sau khi cập nhật | Kiểm tra Pi đã chạy bản mới (`git log -1` trong `~/villa-nest`); nếu vẫn cũ: **Purge Everything** trong Cloudflare, rồi Ctrl + F5 trên trình duyệt |

---

## Cách B — Mở cổng modem (chỉ khi không dùng được Tunnel)

1. Làm Bước 1 như trên.
2. Modem: **NAT / Port Forwarding** cổng `80` (và `443` nếu Pi có chứng chỉ) → `192.168.1.8`. Nên đặt IP tĩnh
   cho Pi trong phần DHCP của modem.
3. Tra IP công cộng của nhà: `curl -s https://ifconfig.me`. Nếu IP này khác IP WAN hiển thị trong modem (thường
   bắt đầu bằng `100.64.` – `100.127.`), nhà mạng đang dùng **CGNAT** → không mở cổng được, quay lại Cách A.
4. Cloudflare **DNS → Records → Add record**: `A` · `@` · IP công cộng · **Proxied** (đám mây cam); thêm
   `CNAME` · `www` · `tenmien.vn` · Proxied.
5. **SSL/TLS → Overview**: chọn *Flexible* (Cloudflare ↔ Pi dùng HTTP).
6. IP nhà thay đổi định kỳ → phải cập nhật bản ghi `A` mỗi lần đổi (hoặc dùng script DDNS) — đây là lý do Cách A
   tiện hơn.
