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
(thay trang "Welcome to nginx" mặc định, thêm định dạng ảnh AVIF nếu Nginx còn thiếu) → khởi động lại Nginx.
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
bash deploy/install-pi.sh      # build và cài lại

# Cách B: build lại trên máy tính, scp lại thư mục dist rồi chạy
# bash deploy/install-pi.sh --no-build
```

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
| Vẫn thấy trang "Welcome to nginx"           | `sudo rm /etc/nginx/sites-enabled/default && sudo systemctl reload nginx`          |
| Máy khác không vào được                     | Kiểm tra cùng mạng; thử bằng IP thay cho `.local`; nếu có bật tường lửa: `sudo ufw allow 80` |
| `npm ci` báo hết bộ nhớ (Pi 2 GB)           | Tăng swap: sửa `CONF_SWAPSIZE=1024` trong `/etc/dphys-swapfile`, rồi `sudo systemctl restart dphys-swapfile` — hoặc dùng Cách B |
| Script báo Node.js quá cũ                   | Làm lại bước 2 (NodeSource 22.x)                                                   |
| Ảnh không hiện                              | `grep avif /etc/nginx/mime.types` phải có dòng `image/avif`; chạy lại script        |
| Xem lỗi Nginx                               | `sudo nginx -t` và `sudo tail -n 50 /var/log/nginx/error.log`                      |
