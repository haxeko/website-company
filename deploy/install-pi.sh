#!/usr/bin/env bash
# Cài website VILLA NEST lên Raspberry Pi (Raspberry Pi OS) — hoặc bất kỳ máy Debian/Ubuntu nào — với Nginx.
#
#   bash deploy/install-pi.sh              # build ngay trên Pi rồi cài (cần Node.js 20.19+ / 22.12+)
#   bash deploy/install-pi.sh --no-build   # dùng thư mục dist/ có sẵn (đã build trên máy khác)
#   PORT=8080 bash deploy/install-pi.sh    # chạy ở cổng khác (khi cổng 80 đã dành cho site khác)
#
# Chạy lại script bất cứ lúc nào để cập nhật website lên phiên bản mới.
set -euo pipefail

WEB_ROOT=/var/www/villa-nest
PORT=${PORT:-80}
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD=1
[[ "${1:-}" == "--no-build" ]] && BUILD=0

cd "$REPO_DIR"
step() { printf '\n\033[1;33m▸ %s\033[0m\n' "$1"; }

if ((BUILD)); then
  step "Kiểm tra Node.js"
  if ! command -v node >/dev/null; then
    echo "Chưa có Node.js. Cài theo docs/RASPBERRY-PI.md (bước 2) hoặc chạy lại với --no-build." >&2
    exit 1
  fi
  NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
  NODE_MINOR=$(node -p 'process.versions.node.split(".")[1]')
  if ((NODE_MAJOR < 20 || (NODE_MAJOR == 20 && NODE_MINOR < 19) || (NODE_MAJOR == 22 && NODE_MINOR < 12) || NODE_MAJOR == 21)); then
    echo "Cần Node.js 20.19+ hoặc 22.12+, đang có $(node -v)." >&2
    exit 1
  fi
  echo "Node.js $(node -v) — OK"

  step "Cài thư viện (npm ci)"
  npm ci --no-audit --no-fund

  step "Build website"
  npm run build
fi

if [[ ! -f dist/index.html ]]; then
  echo "Không tìm thấy dist/index.html — hãy build trước (npm run build) hoặc chép thư mục dist/ vào đây." >&2
  exit 1
fi

step "Cài Nginx"
if ! command -v nginx >/dev/null; then
  sudo apt-get update
  sudo apt-get install -y nginx
fi
nginx -v

step "Chép website vào $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo find "$WEB_ROOT" -mindepth 1 -delete
sudo cp -r dist/. "$WEB_ROOT/"
sudo chmod -R a+rX "$WEB_ROOT"

step "Cấu hình Nginx (cổng $PORT)"
CONF=$(sed -e 's#^\(\s*\)server_name .*#\1server_name _;#' -e "s#^\(\s*\)root .*#\1root $WEB_ROOT;#" \
  -e "s#listen 80;#listen $PORT;#" -e "s#listen \[::\]:80;#listen [::]:$PORT;#" deploy/nginx.conf)
# Pi đã tắt IPv6 thì bỏ dòng listen [::]
[[ -e /proc/net/if_inet6 ]] || CONF=$(sed '/listen \[::\]/d' <<<"$CONF")

# Trang "Welcome to nginx" mặc định của gói nginx
sudo rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf

# Chỉ nhận vai trò "default_server" khi không site nào khác đang giữ trên cổng này,
# để không đụng tới các website khác đã có sẵn trên Pi.
OTHERS=$(sudo grep -lsE "listen[^;]*\b$PORT\b[^;]*default_server" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf 2>/dev/null |
  grep -v 'villa-nest' || true)
if [[ -z "$OTHERS" ]]; then
  CONF=$(sed -E "s#listen (\[::\]:)?$PORT;#listen \1$PORT default_server;#" <<<"$CONF")
else
  echo "Cổng $PORT đã có site mặc định khác: $OTHERS"
  echo "→ VILLA NEST vẫn được cài, nhưng nên chạy ở cổng riêng: PORT=8080 bash deploy/install-pi.sh"
fi

if [[ -d /etc/nginx/sites-available ]]; then
  echo "$CONF" | sudo tee /etc/nginx/sites-available/villa-nest >/dev/null
  sudo ln -sf /etc/nginx/sites-available/villa-nest /etc/nginx/sites-enabled/villa-nest
else
  echo "$CONF" | sudo tee /etc/nginx/conf.d/villa-nest.conf >/dev/null
fi

# Nginx cũ (Raspberry Pi OS Bookworm dùng 1.22) chưa biết định dạng ảnh AVIF.
if ! grep -q 'avif' /etc/nginx/mime.types; then
  sudo sed -i '/^}/i \    image/avif                                       avif;' /etc/nginx/mime.types
  echo "Đã thêm image/avif vào /etc/nginx/mime.types"
fi

if ! sudo nginx -t; then
  # Không để cấu hình lỗi nằm lại trên đĩa (Nginx đang chạy vẫn giữ cấu hình cũ, các site khác không bị ảnh hưởng).
  sudo rm -f /etc/nginx/sites-enabled/villa-nest /etc/nginx/conf.d/villa-nest.conf
  echo "Cấu hình Nginx lỗi — đã gỡ villa-nest ra, các site khác giữ nguyên. Gửi thông báo lỗi ở trên để được hỗ trợ." >&2
  exit 1
fi
sudo systemctl enable nginx >/dev/null 2>&1 || true
sudo systemctl restart nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || sudo nginx

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
SUFFIX=$([[ "$PORT" == 80 ]] && echo "/" || echo ":$PORT/")
step "Xong! Mở website tại:"
echo "  • Trên chính Pi:        http://localhost$SUFFIX"
[[ -n "${IP:-}" ]] && echo "  • Máy khác cùng mạng:   http://$IP$SUFFIX"
echo "  • Hoặc:                http://$(hostname).local$SUFFIX"
