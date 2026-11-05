#!/usr/bin/env bash
# Cài website VILLA NEST lên Raspberry Pi (Raspberry Pi OS) — hoặc bất kỳ máy Debian/Ubuntu nào — với Nginx.
#
#   bash deploy/install-pi.sh              # build ngay trên Pi rồi cài (cần Node.js 20.19+ / 22.12+)
#   bash deploy/install-pi.sh --no-build   # dùng thư mục dist/ có sẵn (đã build trên máy khác)
#   PORT=8080 bash deploy/install-pi.sh    # chạy ở cổng khác (khi cổng 80 đã dành cho site khác)
#   SERVER_NAME="tenmien.vn www.tenmien.vn" bash deploy/install-pi.sh   # chỉ trả lời cho các tên miền này
#   SITE=villa-nest-web bash deploy/install-pi.sh   # tên cấu hình / thư mục khác (khi "villa-nest" là site khác)
#
# Chạy lại script bất cứ lúc nào để cập nhật website lên phiên bản mới. Script không sửa, không xoá website
# khác trên máy: cấu hình Nginx được sao lưu trước mỗi lần cài (/var/backups/villa-nest/), và cổng, tên miền,
# HTTPS (Certbot) bạn đã đặt cho VILLA NEST được giữ nguyên ở lần cài sau.
set -euo pipefail

SITE=${SITE:-villa-nest}
WEB_ROOT=/var/www/$SITE
# Dự án do trang quản trị (/admin/) lưu: danh sách, ảnh, mật khẩu — không bị đụng tới khi cập nhật website.
DATA_DIR=/var/lib/$SITE
ADMIN_PORT=${ADMIN_PORT:-8787}
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT=/var/backups/villa-nest
BUILD=1
[[ "${1:-}" == "--no-build" ]] && BUILD=0

cd "$REPO_DIR"
step() { printf '\n\033[1;33m▸ %s\033[0m\n' "$1"; }
die() {
  printf '\n\033[1;31m✗ %s\033[0m\n' "$1" >&2
  exit 1
}

# Nhận ra cấu hình / thư mục do chính script này tạo (để không bao giờ đụng vào website khác).
ours_conf() { sudo grep -qs 'location \^~ /assets/slides/' "$1"; }
ours_root() { sudo grep -qs 'VILLA NEST' "$1/index.html"; }

step "Cài Nginx"
if ! command -v nginx >/dev/null; then
  sudo apt-get update
  sudo apt-get install -y nginx
fi
nginx -v

if [[ -d /etc/nginx/sites-available ]]; then
  AVAIL=/etc/nginx/sites-available/$SITE
  ENABLED=/etc/nginx/sites-enabled/$SITE
else
  AVAIL=/etc/nginx/conf.d/$SITE.conf
  ENABLED=$AVAIL
fi

step "Kiểm tra để không đụng vào website khác"
for f in "$AVAIL" "$ENABLED"; do
  if sudo test -e "$f" && ! ours_conf "$f"; then
    die "$f đã có và KHÔNG phải cấu hình VILLA NEST (có thể là một website khác của bạn) — không sửa gì cả.
  Cài VILLA NEST với tên khác:  SITE=villa-nest-web bash deploy/install-pi.sh"
  fi
done
if sudo test -L "$ENABLED" && [[ "$(sudo readlink -f "$ENABLED")" != "$AVAIL" ]]; then
  die "$ENABLED đang trỏ tới $(sudo readlink -f "$ENABLED") (website khác) — không sửa gì cả.
  Cài VILLA NEST với tên khác:  SITE=villa-nest-web bash deploy/install-pi.sh"
fi
if sudo test -d "$WEB_ROOT" && [[ -n "$(sudo ls -A "$WEB_ROOT")" ]] && ! ours_root "$WEB_ROOT"; then
  die "$WEB_ROOT đang chứa một website khác — không xoá.
  Cài VILLA NEST với tên khác:  SITE=villa-nest-web bash deploy/install-pi.sh"
fi
echo "OK"

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

# Giữ lại những gì đã đặt cho VILLA NEST ở lần cài trước: cổng, tên miền, HTTPS của Certbot.
KEEP_CONF=0
NOT_DEFAULT=0
OLD_PORT=
OLD_NAME=
if sudo test -e "$AVAIL"; then
  OLD_PORT=$(sudo sed -nE '/^\s*listen\s+[0-9]+/{s/^\s*listen\s+([0-9]+).*/\1/p;q}' "$AVAIL")
  OLD_NAME=$(sudo sed -nE '/^\s*server_name\s/{s/^\s*server_name\s+([^;]+);.*/\1/p;q}' "$AVAIL")
  sudo grep -qs 'managed by Certbot' "$AVAIL" && KEEP_CONF=1
fi
PORT=${PORT:-${OLD_PORT:-80}}
SERVER_NAME=${SERVER_NAME:-${OLD_NAME:-_}}

step "Sao lưu cấu hình Nginx"
sudo mkdir -p "$BACKUP_ROOT"
BACKUP=$(sudo mktemp -d "$BACKUP_ROOT/$(date +%Y%m%d-%H%M%S)-XXXX")
sudo cp -a /etc/nginx "$BACKUP/nginx"
# Giữ 10 bản gần nhất.
sudo find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d | sort | head -n -10 | xargs -r sudo rm -rf
echo "→ $BACKUP"

restore_nginx() {
  sudo cp -a "$BACKUP/nginx/." /etc/nginx/
  for f in "$AVAIL" "$ENABLED"; do
    sudo test -e "$BACKUP/nginx/${f#/etc/nginx/}" || sudo rm -f "$f"
  done
}

step "Chép website vào $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo find "$WEB_ROOT" -mindepth 1 -delete
sudo cp -r dist/. "$WEB_ROOT/"
sudo chmod -R a+rX "$WEB_ROOT"

# Trang "Welcome to nginx" có sẵn của gói nginx giữ cổng 80 làm trang mặc định. Chỉ tắt nó khi nó còn
# nguyên bản — nếu bạn đã sửa nó hoặc đặt website khác vào /var/www/html thì giữ nguyên.
stock_default() {
  local re='^(server \{|\}|listen (\[::\]:)?80( default_server)?;|root /var/www/html;|index [^;]*;|server_name _;|location / \{|try_files \$uri \$uri/ =404;)$'
  local line
  while IFS= read -r line; do
    line=${line%%#*}
    line=$(sed -E 's/^[[:space:]]+|[[:space:]]+$//g; s/[[:space:]]+/ /g' <<<"$line")
    [[ -z $line ]] && continue
    [[ $line =~ $re ]] || return 1
  done < <(sudo cat "$1")
  [[ -z "$(sudo find /var/www/html -mindepth 1 ! -name 'index.nginx-debian.html' 2>/dev/null | head -n1)" ]]
}
if [[ "$PORT" == 80 ]]; then
  if sudo test -L /etc/nginx/sites-enabled/default; then
    if stock_default /etc/nginx/sites-enabled/default; then
      sudo rm -f /etc/nginx/sites-enabled/default
      echo "Đã tắt trang \"Welcome to nginx\" mặc định (bật lại: sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/)"
    else
      echo "Giữ nguyên /etc/nginx/sites-enabled/default (đã được sửa hoặc đang phục vụ website khác)."
    fi
  fi
  if sudo test -f /etc/nginx/conf.d/default.conf &&
    sudo grep -qs 'Welcome to nginx' /usr/share/nginx/html/index.html &&
    ! sudo grep -qsvE '^\s*(#.*)?$|^\s*(server \{|\}|listen .*80;|server_name localhost;|location (= /50x.html|/) \{|root /usr/share/nginx/html;|index index.html index.htm;|error_page 500 502 503 504 /50x.html;)\s*$' /etc/nginx/conf.d/default.conf; then
    sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled
    echo "Đã tắt trang \"Welcome to nginx\" mặc định (conf.d/default.conf → default.conf.disabled)"
  fi
fi

if ((KEEP_CONF)); then
  step "Giữ nguyên cấu hình Nginx của VILLA NEST (có HTTPS của Certbot): $AVAIL"
else
  step "Cấu hình Nginx (cổng $PORT, tên miền: $SERVER_NAME)"
  CONF=$(sed -e "s#^\(\s*\)server_name .*#\1server_name $SERVER_NAME;#" \
    -e "s|^\(\s*\)root [^;]*;\(.*contents of dist/.*\)$|\1root $WEB_ROOT;\2|" \
    -e "s|/var/lib/villa-nest/|$DATA_DIR/|" -e "s|127\.0\.0\.1:8787|127.0.0.1:$ADMIN_PORT|" \
    -e "s#listen 80;#listen $PORT;#" -e "s#listen \[::\]:80;#listen [::]:$PORT;#" deploy/nginx.conf)
  # Pi đã tắt IPv6 thì bỏ dòng listen [::]
  [[ -e /proc/net/if_inet6 ]] || CONF=$(sed '/listen \[::\]/d' <<<"$CONF")

  # Chỉ nhận vai trò "default_server" khi không site nào khác đang giữ trên cổng này.
  OTHERS=$(sudo grep -lsE "listen[^;]*\b$PORT\b[^;]*default_server" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf 2>/dev/null |
    while read -r f; do [[ "$(sudo readlink -f "$f")" == "$(sudo readlink -f "$AVAIL")" ]] || echo "$f"; done || true)
  if [[ -z "$OTHERS" ]]; then
    CONF=$(sed -E "s#listen (\[::\]:)?$PORT;#listen \1$PORT default_server;#" <<<"$CONF")
  else
    NOT_DEFAULT=1
    echo "Cổng $PORT đã có site mặc định khác: $OTHERS"
    echo "→ VILLA NEST chỉ trả lời cho tên miền: $SERVER_NAME. Để có địa chỉ riêng, cài ở cổng khác:"
    echo "  PORT=8080 bash deploy/install-pi.sh   — hoặc theo tên miền: SERVER_NAME=tenmien.vn bash deploy/install-pi.sh"
  fi

  echo "$CONF" | sudo tee "$AVAIL" >/dev/null
  [[ "$ENABLED" == "$AVAIL" ]] || sudo ln -sf "$AVAIL" "$ENABLED"
fi

# Trang quản trị dự án: một dịch vụ nhỏ (server/admin-server.mjs) chỉ nghe trên máy này; Nginx chuyển /api/admin/ tới nó.
if command -v node >/dev/null && [[ -d node_modules/sharp ]]; then
  step "Trang quản trị dự án (/admin/)"
  RUN_USER=$(id -un)
  sudo mkdir -p "$DATA_DIR"
  sudo chown "$RUN_USER": "$DATA_DIR"
  sudo chmod 755 "$DATA_DIR"
  if [[ ! -f "$DATA_DIR/admin/password.json" ]]; then
    if [[ -t 0 ]]; then
      echo "Đặt mật khẩu để đăng nhập trang quản trị (/admin/):"
      DATA_DIR="$DATA_DIR" node server/admin-password.mjs ||
        echo "Chưa đặt được mật khẩu — đặt sau bằng: DATA_DIR=$DATA_DIR npm run admin:password"
    else
      echo "Chưa có mật khẩu quản trị — đặt bằng: DATA_DIR=$DATA_DIR npm run admin:password"
    fi
  fi
  sed -e "s|@USER@|$RUN_USER|g" -e "s|@REPO@|$REPO_DIR|g" -e "s|@DATA_DIR@|$DATA_DIR|g" \
    -e "s|@NODE@|$(command -v node)|g" -e "s|@PORT@|$ADMIN_PORT|g" deploy/villa-nest-admin.service |
    sudo tee "/etc/systemd/system/$SITE-admin.service" >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable "$SITE-admin" >/dev/null 2>&1 || true
  sudo systemctl restart "$SITE-admin"
  sleep 1
  if systemctl is-active --quiet "$SITE-admin"; then
    echo "Dịch vụ $SITE-admin đang chạy (dữ liệu: $DATA_DIR)"
  else
    echo "Dịch vụ $SITE-admin chưa chạy được — xem: journalctl -u $SITE-admin -n 30"
  fi
  if ((KEEP_CONF)) && ! sudo grep -qs '/api/admin/' "$AVAIL"; then
    echo "Lưu ý: cấu hình Nginx (có HTTPS của Certbot) được giữ nguyên nên chưa có /api/admin/, /data/, /projects/ của"
    echo "trang quản trị — chép các khối location đó từ deploy/nginx.conf vào $AVAIL rồi: sudo nginx -t && sudo systemctl reload nginx"
  fi
else
  echo "(Bỏ qua trang quản trị: cần Node.js và thư viện — chạy script không có --no-build.)"
fi

# Nginx cũ (Raspberry Pi OS Bookworm dùng 1.22) chưa biết định dạng ảnh AVIF.
if ! grep -q 'avif' /etc/nginx/mime.types; then
  sudo sed -i '/^}/i \    image/avif                                       avif;' /etc/nginx/mime.types
  echo "Đã thêm image/avif vào /etc/nginx/mime.types"
fi

if ! sudo nginx -t; then
  # Trả cấu hình về đúng như trước khi cài (Nginx đang chạy vẫn giữ cấu hình cũ, các site khác không bị ảnh hưởng).
  restore_nginx
  die "Cấu hình Nginx lỗi — đã trả cấu hình về như trước khi cài. Gửi thông báo lỗi ở trên để được hỗ trợ."
fi
sudo systemctl enable nginx >/dev/null 2>&1 || true
sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || sudo systemctl restart nginx 2>/dev/null || sudo nginx

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
SUFFIX=$([[ "$PORT" == 80 ]] && echo "/" || echo ":$PORT/")
if ((NOT_DEFAULT)) && [[ "$SERVER_NAME" == "_" ]]; then
  step "Đã cài, nhưng cổng $PORT đang thuộc về website khác"
  echo "  Địa chỉ http://${IP:-localhost}$SUFFIX vẫn mở website kia. Để mở VILLA NEST, cài lại ở cổng riêng:"
  echo "    PORT=8080 bash deploy/install-pi.sh"
else
  step "Xong! Mở website tại:"
  echo "  • Trên chính Pi:        http://localhost$SUFFIX"
  [[ -n "${IP:-}" ]] && echo "  • Máy khác cùng mạng:   http://$IP$SUFFIX"
  echo "  • Hoặc:                http://$(hostname).local$SUFFIX"
  [[ "$SERVER_NAME" != "_" ]] && echo "  • Tên miền:             $SERVER_NAME"
fi
echo
echo "Cấu hình Nginx trước lần cài này được sao lưu ở $BACKUP"
echo "  (khôi phục: sudo cp -a $BACKUP/nginx/. /etc/nginx/ && sudo nginx -t && sudo systemctl reload nginx)"
