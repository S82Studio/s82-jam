#!/usr/bin/env bash
# Cài máy chủ kết nối S82 Jam (aooserver) lên VPS Ubuntu 22.04/24.04.
# Chạy bằng quyền root:  bash setup-server.sh
# Máy chủ chỉ giúp các máy tìm thấy nhau; âm thanh đi thẳng giữa các máy (P2P).
set -euo pipefail

AOO_REPO="https://github.com/essej/aooserver.git"
AOO_COMMIT="81a4cf94cfc0b25a7efa8fdbb4d53a0ecf00f10b"   # ghim phiên bản đã kiểm tra
PORT=10998

echo "== 1. Cài công cụ build"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q build-essential git pkg-config libcurl4-openssl-dev ufw

echo "== 2. Tải và build aooserver"
rm -rf /opt/aooserver-src
git clone -q "$AOO_REPO" /opt/aooserver-src
git -C /opt/aooserver-src checkout -q "$AOO_COMMIT"
make -C /opt/aooserver-src/Builds/LinuxMakefile CONFIG=Release -j"$(nproc)"
install -m 755 /opt/aooserver-src/Builds/LinuxMakefile/build/aooserver /usr/local/bin/aooserver

echo "== 3. Tạo user riêng (không chạy bằng root)"
id s82jam >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin s82jam
mkdir -p /var/log/s82jam && chown s82jam: /var/log/s82jam
touch /etc/s82jam-blocklist.txt

echo "== 4. Dịch vụ tự chạy khi khởi động"
cat > /etc/systemd/system/s82jam-server.service <<EOF
[Unit]
Description=S82 Jam connection server (aooserver)
After=network-online.target
Wants=network-online.target

[Service]
User=s82jam
ExecStart=/usr/local/bin/aooserver -p $PORT -l /var/log/s82jam -b /etc/s82jam-blocklist.txt
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/log/s82jam

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now s82jam-server

echo "== 5. Tường lửa: chỉ mở SSH và cổng S82 Jam"
ufw allow OpenSSH
ufw allow $PORT/tcp
ufw allow $PORT/udp
ufw --force enable

echo "== 6. Xoá log cũ hơn 30 ngày (mỗi ngày)"
echo "0 4 * * * root find /var/log/s82jam -type f -mtime +30 -delete" > /etc/cron.d/s82jam-logs

sleep 2
systemctl --no-pager status s82jam-server | head -5
echo "XONG. Máy chủ chạy ở cổng $PORT (TCP+UDP)."
