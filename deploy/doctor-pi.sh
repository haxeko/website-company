#!/usr/bin/env bash
# Chẩn đoán các website trên Raspberry Pi — chỉ ĐỌC, không sửa gì: Nginx và từng site, thư mục web,
# cổng đang mở, Cloudflare Tunnel, ứng dụng chạy nền, bộ nhớ.
#
#   bash deploy/doctor-pi.sh                    # tổng quan
#   bash deploy/doctor-pi.sh bacthayxaydung     # kèm tìm một tên miền / tên website trên máy
#
# Gửi toàn bộ kết quả để được hỗ trợ (không in mật khẩu hay token).
KEY=${1:-}
h() { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }
TS='--time-style=+%Y-%m-%d %H:%M'

h "Máy"
. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME ($(uname -m))"
free -h | head -n 2
uptime

h "Nginx"
echo "Dịch vụ: $(systemctl is-active nginx 2>/dev/null)"
nginx -v 2>&1
sudo nginx -t 2>&1 | tail -n 3

h "Site đang bật (sites-enabled, conf.d)"
ls -l "$TS" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null

h "Site có sẵn (sites-available)"
ls -l "$TS" /etc/nginx/sites-available/ 2>/dev/null

h "Từng site: cổng, tên miền, thư mục / ứng dụng"
for f in /etc/nginx/sites-available/* /etc/nginx/conf.d/*; do
  [[ -f "$f" ]] || continue
  if [[ "$f" == /etc/nginx/conf.d/*.conf ]] || [[ -e "/etc/nginx/sites-enabled/$(basename "$f")" ]]; then
    state="ĐANG BẬT"
  else
    state="đang tắt"
  fi
  echo "-- $f  [$state]"
  sudo grep -nE '^\s*(listen|server_name|root|proxy_pass|return|ssl_certificate|include)\b' "$f" | grep -v 'snippets/\|fastcgi' | sed 's/^/     /'
done

h "Thư mục web (/var/www)"
for d in /var/www/*; do
  [[ -d "$d" ]] || continue
  echo "$d  ($(sudo find "$d" -type f 2>/dev/null | wc -l) file, sửa lần cuối $(date -r "$d" '+%Y-%m-%d %H:%M'))"
  title=$(grep -o '<title>[^<]*' "$d/index.html" 2>/dev/null | head -n 1)
  [[ -n "$title" ]] && echo "     ${title#<title>}"
done

h "Sao lưu của script cài VILLA NEST"
ls -1 /var/backups/villa-nest 2>/dev/null || echo "(chưa có)"

h "Cổng đang mở"
sudo ss -ltnp 2>/dev/null | awk 'NR == 1 || /LISTEN/' | sed -E 's/users:\(\("([^"]+)".*/\1/'

h "Thử truy cập trên chính Pi"
for p in 80 443 3000 5000 6969 8000 8080 8888; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 3 "http://127.0.0.1:$p/")
  [[ "$code" != 000 ]] && echo "http://127.0.0.1:$p/  → $code"
done
for name in $(sudo grep -hoE '^\s*server_name\s+[^;]+' /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf 2>/dev/null |
  sed -E 's/^\s*server_name\s+//' | tr ' ' '\n' | grep -vE '^(_|localhost|)$' | sort -u); do
  res=$(curl -s -m 3 -H "Host: $name" http://127.0.0.1/ -w '|%{http_code}')
  echo "Host: $name  → ${res##*|}  $(grep -o '<title>[^<]*' <<<"$res" | head -n 1 | sed 's/<title>//')"
done

h "Cloudflare Tunnel"
if systemctl list-unit-files 2>/dev/null | grep -q '^cloudflared'; then
  echo "Dịch vụ: $(systemctl is-active cloudflared 2>/dev/null)"
  sudo journalctl -u cloudflared -n 200 --no-pager 2>/dev/null |
    grep -iE 'error|ERR |unable|refused|originService|Registered tunnel|Updated to new configuration' | tail -n 12 |
    sed -E 's/(token|TunnelToken)[^ ]*/\1=***/g'
else
  echo "Không có dịch vụ cloudflared."
fi
for c in /etc/cloudflared/config.yml /etc/cloudflared/config.yaml /home/*/.cloudflared/config.yml /root/.cloudflared/config.yml; do
  sudo test -f "$c" && { echo "-- $c"; sudo grep -vE 'credentials|token|secret' "$c" | sed 's/^/     /'; }
done

h "Ứng dụng web khác (pm2 / docker / dịch vụ)"
command -v pm2 >/dev/null && pm2 ls 2>/dev/null
command -v docker >/dev/null && sudo docker ps --format '{{.Names}}  {{.Ports}}  {{.Status}}' 2>/dev/null
systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null |
  grep -iE 'node|pm2|docker|apache|httpd|php|gunicorn|uvicorn|caddy|web|site|dashboard|cloudflared' | awk '{print $1}'

h "Thiếu bộ nhớ (OOM) trong 2 ngày qua"
sudo journalctl -k --since '-2 days' --no-pager 2>/dev/null | grep -iE 'out of memory|killed process' | tail -n 5
echo "(hết)"

if [[ -n "$KEY" ]]; then
  h "Tìm \"$KEY\""
  sudo grep -rIl --exclude-dir=node_modules --exclude-dir=.git -- "$KEY" /etc/nginx /etc/cloudflared /etc/systemd/system \
    /var/www /home/*/.cloudflared /root/.cloudflared 2>/dev/null | head -n 20
  sudo find / -maxdepth 4 -iname "*$KEY*" -not -path '/proc/*' -not -path '/sys/*' 2>/dev/null | head -n 20
  echo "(hết)"
fi
