#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'TEXT'
Install the Devast.io shop on a dedicated Ubuntu 24.04 VPS.
Usage: sudo bash deploy/install-vps.sh --game-source IP_OR_CIDR[,IP_OR_CIDR...]

Use the game server's actual outbound IP(s), not the player's home IP.
The installer preserves existing shop configuration and the SQLite database.
TEXT
}

game_sources=''
while (($#)); do
  case "$1" in
    --game-source)
      if (($# < 2)); then usage; exit 2; fi
      game_sources="$2"
      shift 2
      ;;
    --help|-h) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done
if [[ -z "$game_sources" ]]; then usage; exit 2; fi

/usr/bin/python3 - "$game_sources" <<'PY'
import ipaddress, sys
if sys.version_info < (3, 10):
    raise SystemExit('Python 3.10+ is required; select Ubuntu 24.04')
for value in sys.argv[1].split(','):
    network = ipaddress.ip_network(value.strip())
    if network.prefixlen == 0:
        raise SystemExit('An unrestricted source network is not allowed')
PY

if [[ "$EUID" -ne 0 ]]; then
  printf '%s\n' 'Run the installer with sudo on the intended VPS.' >&2
  exit 1
fi
if ! command -v systemctl >/dev/null; then
  printf '%s\n' 'This installer requires Linux with systemd.' >&2
  exit 1
fi

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if ! id devast-shop >/dev/null 2>&1; then
  useradd --system --no-create-home --shell /usr/sbin/nologin devast-shop
fi
install -d -m 755 /opt/devast-shop
install -d -m 700 -o devast-shop -g devast-shop /var/lib/devast-shop
for name in shop.py server.py manage.py; do
  install -m 644 "$project_dir/$name" "/opt/devast-shop/$name"
done
if [[ ! -f /opt/devast-shop/config.json ]]; then
  install -m 644 "$project_dir/config.json" /opt/devast-shop/config.json
fi
install -m 644 "$project_dir/deploy/devast-shop.service" /etc/systemd/system/devast-shop.service
umask 077
{
  printf '%s\n' 'SHOP_HOST=0.0.0.0' 'SHOP_PORT=8000'
  printf 'SHOP_ALLOWED_SOURCES=%s\n' "$game_sources"
} >/etc/devast-shop.env
systemctl daemon-reload
systemctl enable --now devast-shop
systemctl restart devast-shop
systemctl --no-pager --full status devast-shop
printf '%s\n' \
  'Receiver installed. The database is /var/lib/devast-shop/shop.sqlite3.' \
  'Allow TCP 8000 from the game IP(s) in the cloud firewall.' \
  'Then enable the native !start-webhook=PUBLIC_VPS_IP subscription on server 67.'
