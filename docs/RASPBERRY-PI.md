# Cài VILLA NEST lên Raspberry Pi

Hướng dẫn đưa website lên Raspberry Pi bằng Nginx. Website sẽ chạy trong mạng nội bộ (LAN), **không cần Internet**,
vì ảnh, font và mã nguồn đều nằm sẵn trên Pi.

## Bạn cần gì

| Thành phần   | Khuyến nghị                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| Máy          | Raspberry Pi 4 hoặc 5 (RAM ≥ 2 GB). Pi 3 / Zero 2 W chỉ nên dùng cách B.        |
| Hệ điều hành | Raspberry Pi OS **64-bit** (Bookworm hoặc mới hơn), bản Lite hay Desktop đều được |
| Thẻ nhớ      | ≥ 16 GB                                                                         |
| Mạng         | Pi và máy tính/điện thoại cùng một mạng Wi-Fi/LAN                               |

Có hai cách cài:

- **Cách A — build ngay trên Pi** (đơn giản nhất, cần Pi 4/5).
- **Cách B — build trên máy tính, chỉ chép kết quả sang Pi** (nhẹ nhất cho Pi, phù hợp Pi đời cũ).

---

## Bước 1 — Chuẩn bị Pi

1. Dùng **Raspberry Pi Imager** ghi Raspberry Pi OS (64-bit) vào thẻ nhớ. Trong phần cài đặt nâng cao của Imager:
   đặt **hostname** (ví dụ `villanest`), tạo user/mật khẩu, nhập Wi-Fi và **bật SSH**.
2. Cắm thẻ, bật Pi, rồi từ máy tính đăng nhập:

   ```bash
   ssh <user>@villanest.local
   ```

3. Cập nhật hệ thống và cài Git:

   ```bash
   sudo apt update && sudo apt full-upgrade -y
   sudo apt install -y git
   ```

## Cách A — Build trên Pi

**2. Cài Node.js 22** (bản trong kho của Raspberry Pi OS quá cũ):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v      # phải là v22.12 trở lên
```

**3. Lấy mã nguồn và chạy script cài đặt:**

```bash
git clone -b claude/villa-nest-hero https://github.com/haxeko/website-company.git villa-nest
cd villa-nest
bash deploy/install-pi.sh
```

Script sẽ tự: cài thư viện → build → cài Nginx → chép website vào `/var/www/villa-nest` → cấu hình Nginx
(thay trang "Welcome to nginx" mặc định, thêm định dạng ảnh AVIF nếu Nginx còn thiếu) → cài **trang quản trị dự án**
(lần đầu sẽ hỏi đặt mật khẩu, xem [Trang quản trị dự án](#trang-quản-trị-dự-án)) → khởi động lại Nginx.
Pi 4 mất khoảng 2–4 phút, phần lớn là `npm ci`. Cuối cùng script in ra địa chỉ để mở website.

> Repo đang để private? `git clone` sẽ hỏi đăng nhập GitHub — dùng
> [Personal Access Token](https://github.com/settings/tokens) thay cho mật khẩu, hoặc dùng Cách B.

## Cách B — Build trên máy tính, chép sang Pi

Trên **máy tính** (Windows/macOS/Linux, đã có Node.js 22):

```bash
git clone -b claude/villa-nest-hero https://github.com/haxeko/website-company.git villa-nest
cd villa-nest
npm install
npm run build
scp -r dist deploy <user>@villanest.local:~/villa-nest/
```

(Nếu thư mục `~/villa-nest` chưa có trên Pi, chạy trước `ssh <user>@villanest.local mkdir -p villa-nest`.
Trên Windows có thể dùng WinSCP để chép hai thư mục `dist` và `deploy`.)

Trên **Pi**:

```bash
cd ~/villa-nest
bash deploy/install-pi.sh --no-build
```

(Cách B không có trang quản trị dự án — nó cần Node.js và thư viện trên Pi; website hiện các dự án có sẵn trong bản
build.)

### Pi đã có website khác (ví dụ một dashboard)

Script không sửa, không xoá website khác:

- Trước mỗi lần cài, toàn bộ cấu hình Nginx được **sao lưu** vào `/var/backups/villa-nest/<thời-gian>/` (giữ 10 bản).
- Nếu tên `villa-nest` (file cấu hình hoặc thư mục `/var/www/villa-nest`) đang là của **một website khác**, script
  dừng lại và không động vào gì. Khi đó cài VILLA NEST với tên khác: `SITE=villa-nest-web bash deploy/install-pi.sh`.
- Trang `default` chỉ bị tắt khi nó còn là trang "Welcome to nginx" nguyên bản; nếu bạn đã sửa nó hoặc đặt website
  vào `/var/www/html` thì giữ nguyên.
- Nếu cổng 80 đã có website khác làm trang mặc định, VILLA NEST nên chạy ở cổng riêng hoặc theo tên miền:

```bash
PORT=8080 bash deploy/install-pi.sh                              # → http://<IP-của-Pi>:8080/
SERVER_NAME="tenmien.vn www.tenmien.vn" bash deploy/install-pi.sh  # chỉ trả lời cho tên miền này
```

Cổng, tên miền và HTTPS (Certbot) đã đặt được giữ nguyên ở các lần cài sau. Nếu cấu hình mới bị lỗi, script trả toàn
bộ cấu hình về như trước khi cài.

### Kiểm tra / chẩn đoán

```bash
bash deploy/doctor-pi.sh                  # chỉ đọc: các site Nginx, thư mục web, cổng, Cloudflare Tunnel, bộ nhớ
bash deploy/doctor-pi.sh tenmien          # kèm tìm một tên miền / tên website trên máy
```

Khôi phục cấu hình Nginx về một bản sao lưu:

```bash
ls /var/backups/villa-nest/
sudo cp -a /var/backups/villa-nest/<thời-gian>/nginx/. /etc/nginx/ && sudo nginx -t && sudo systemctl reload nginx
```

## Mở website

- Trên chính Pi: `http://localhost/`
- Từ điện thoại / máy tính cùng mạng: `http://villanest.local/` hoặc `http://<IP-của-Pi>/`
  (xem IP bằng lệnh `hostname -I`).

Một số điện thoại Android không phân giải được tên `.local` — khi đó dùng địa chỉ IP. Nên đặt IP tĩnh cho Pi trong
trang quản trị router (DHCP reservation) để địa chỉ không đổi.

## Cập nhật website

```bash
cd ~/villa-nest
git pull                       # Cách A
bash deploy/install-pi.sh      # build và cài lại (dự án trong trang quản trị giữ nguyên)

# Cách B: build lại trên máy tính, scp lại thư mục dist rồi chạy
# bash deploy/install-pi.sh --no-build
```

## Trang quản trị dự án

Cách A cài kèm trang quản trị: một dịch vụ nhỏ tên `villa-nest-admin` (Node.js) chỉ nghe trên chính Pi
(`127.0.0.1:8787`), Nginx chuyển `/api/admin/` tới nó. Mở **`http://<IP-của-Pi>/admin/`** (hay
`https://tenmien.vn/admin/`) và đăng nhập bằng mật khẩu đặt lúc cài. Cách dùng: xem phần
[Thêm / sửa dự án](../README.md#thêm--sửa-dự-án) trong README.

```bash
cd ~/villa-nest && npm run admin:password      # đặt / đổi mật khẩu (ít nhất 10 ký tự; máy đang đăng nhập phải đăng nhập lại)
sudo systemctl status villa-nest-admin         # dịch vụ có đang chạy không
sudo systemctl restart villa-nest-admin        # khởi động lại
sudo journalctl -u villa-nest-admin -n 50      # xem lỗi
```

Dự án, ảnh và mật khẩu nằm trong **`/var/lib/villa-nest/`** — cập nhật website không đụng tới. Sao lưu (nên làm định
kỳ, rồi chép file ra máy khác):

```bash
tar czf ~/villa-nest-du-an-$(date +%F).tar.gz -C /var/lib villa-nest
```

Khôi phục từ bản sao lưu:

```bash
sudo systemctl stop villa-nest-admin
sudo rm -rf /var/lib/villa-nest && sudo tar xzf ~/villa-nest-du-an-<ngày>.tar.gz -C /var/lib
sudo chown -R "$USER": /var/lib/villa-nest && sudo systemctl start villa-nest-admin
```

- Cài với tên khác (`SITE=…`): dịch vụ là `<tên>-admin`, dữ liệu ở `/var/lib/<tên>/`, đổi mật khẩu bằng
  `DATA_DIR=/var/lib/<tên> npm run admin:password`.
- Cấu hình Nginx đã có HTTPS của Certbot được giữ nguyên, nên chưa có các khối `/api/admin/`, `/data/`, `/projects/`
  của trang quản trị — script sẽ nhắc: chép các khối `location` đó từ `deploy/nginx.conf` vào cấu hình đang dùng, rồi
  `sudo nginx -t && sudo systemctl reload nginx`. (Dùng Cloudflare Tunnel thì không gặp trường hợp này.)
- Trang quản trị không xuất hiện trong website, không cho máy tìm kiếm lập chỉ mục; khi đưa lên tên miền nên khoá thêm
  bằng Cloudflare Access (xem [CLOUDFLARE.md](CLOUDFLARE.md#tuỳ-chọn-nên-làm-khoá-trang-quản-trị-bằng-cloudflare-access)).

## (Tuỳ chọn) Pi làm màn hình trình chiếu ở showroom

Dùng Raspberry Pi OS **Desktop**, nối Pi với TV/màn hình, bật **tự đăng nhập vào desktop**
(`sudo raspi-config` → *System Options* → *Boot / Auto Login*). Sau đó tạo file tự chạy Chromium toàn màn hình:

```bash
mkdir -p ~/.config/labwc
echo 'chromium --kiosk --noerrdialogs --disable-infobars --incognito http://localhost/ &' >> ~/.config/labwc/autostart
sudo reboot
```

- Nếu máy báo không có lệnh `chromium`, thay bằng `chromium-browser` (bản Raspberry Pi OS cũ hơn).
- Bản Raspberry Pi OS cũ dùng Wayfire thay vì labwc: thêm vào `~/.config/wayfire.ini` mục
  `[autostart]` với dòng `kiosk = chromium --kiosk http://localhost/`.
- Pi 4 hiển thị màn hình 4K sẽ khá nặng: đặt độ phân giải 1920×1080 hoặc mở `http://localhost/?quality=low`
  (tắt blur, phản chiếu và grain). Website cũng tự chuyển sang chế độ nhẹ nếu thấy chuyển cảnh bị chậm.
- Thoát chế độ kiosk: `Alt + F4`.

## Xử lý sự cố

| Hiện tượng                                  | Cách xử lý                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| Vẫn thấy trang "Welcome to nginx"           | Thường do script dừng sớm (chưa có Node.js → chưa có `dist/`). Cài Node.js (bước 2) rồi chạy lại script; xoá cache trình duyệt (Ctrl + F5) |
| Máy khác không vào được                     | Kiểm tra cùng mạng; thử bằng IP thay cho `.local`; nếu có bật tường lửa: `sudo ufw allow 80` |
| `npm ci` báo hết bộ nhớ (Pi 2 GB)           | Tăng swap: sửa `CONF_SWAPSIZE=1024` trong `/etc/dphys-swapfile`, rồi `sudo systemctl restart dphys-swapfile` — hoặc dùng Cách B |
| Script báo Node.js quá cũ                   | Làm lại bước 2 (NodeSource 22.x)                                                   |
| Ảnh không hiện                              | `grep avif /etc/nginx/mime.types` phải có dòng `image/avif`; chạy lại script        |
| Xem lỗi Nginx                               | `sudo nginx -t` và `sudo tail -n 50 /var/log/nginx/error.log`                      |
| Một website khác trên Pi không vào được      | Chạy `bash deploy/doctor-pi.sh` và gửi kết quả; khôi phục cấu hình từ `/var/backups/villa-nest/` (ở trên) |
| Trang quản trị báo *"Máy chủ quản trị không trả lời"* | `sudo systemctl restart villa-nest-admin`; vẫn lỗi thì xem `sudo journalctl -u villa-nest-admin -n 50` |
| Quên mật khẩu trang quản trị                | `cd ~/villa-nest && npm run admin:password` đặt mật khẩu mới                        |
| *"Sai mật khẩu nhiều lần — thử lại sau …"*   | Chờ 15 phút, hoặc `sudo systemctl restart villa-nest-admin`                          |
| Đã lưu nhưng website vẫn hiện như cũ        | Mở lại trang (Ctrl + F5); kiểm tra dự án có ảnh bìa và đang bật *Hiện trên website*  |

## Đưa lên tên miền

Để mọi người truy cập bằng `https://tenmien.vn` (không cần mở cổng modem), xem [CLOUDFLARE.md](CLOUDFLARE.md).
