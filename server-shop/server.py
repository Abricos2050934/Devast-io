"""HTTP receiver for the documented Devast.io POST /devast on port 8000."""
from __future__ import annotations

import argparse
import ipaddress
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from shop import Shop

MAX_BODY = 8 * 1024 * 1024


class Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, address, shop, allowed_sources=()):
        self.shop = shop
        self.allowed_sources = [ipaddress.ip_network(cidr.strip()) for cidr in allowed_sources if cidr.strip()]
        super().__init__(address, Handler)


class Handler(BaseHTTPRequestHandler):
    server_version = "DevastShop/1"

    def setup(self):
        super().setup()
        self.connection.settimeout(15)

    def log_message(self, *_):
        pass  # No payloads, chat commands or password-bearing logins in logs.

    def _allowed(self):
        peer = ipaddress.ip_address(self.client_address[0])
        # Forwarded headers are untrusted. Use the socket peer address only.
        return peer.is_loopback or any(peer in network for network in self.server.allowed_sources)

    def _reply(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass  # An uncertain delivery remains held for operator review.

    def do_GET(self):
        if not self._allowed():
            return self._reply(403, {"error": "source_not_allowed"})
        if self.path != "/health":
            return self._reply(404, {"error": "not_found"})
        shop = self.server.shop
        with shop.lock:
            age = None if shop.last_webhook is None else max(0, shop.clock()-shop.last_webhook)
            self._reply(200, {"ok": True, "server_id": shop.config["server_id"],
                              "webhook_connected": age is not None and age <= 10,
                              "last_webhook_age_seconds": age, "snapshots": shop.snapshot_count})

    def do_POST(self):
        if not self._allowed():
            return self._reply(403, {"error": "source_not_allowed"})
        if self.path != "/devast":
            return self._reply(404, {"error": "not_found"})
        if self.headers.get("Transfer-Encoding"):
            return self._reply(400, {"error": "content_length_required"})
        try:
            length = int(self.headers.get("Content-Length", "-1"))
        except ValueError:
            length = -1
        if length < 0:
            return self._reply(411, {"error": "content_length_required"})
        if length > MAX_BODY:
            return self._reply(413, {"error": "payload_too_large"})
        try:
            raw = self.rfile.read(length)
            if len(raw) != length:
                return self._reply(400, {"error": "incomplete_payload"})
            payload = json.loads(raw)
            result = self.server.shop.process(payload)
        except (ValueError, UnicodeDecodeError, RecursionError):
            return self._reply(400, {"error": "invalid_payload"})
        except Exception:
            # Transaction rollback occurs in Shop.process. Do not log secrets
            # from an exception or return a command batch after an error.
            return self._reply(500, {"error": "processing_failed"})
        self._reply(200, result)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default=os.environ.get("SHOP_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("SHOP_PORT", "8000")))
    parser.add_argument("--db", default=os.environ.get("SHOP_DB", "data/shop.sqlite3"))
    parser.add_argument("--config", default=os.environ.get("SHOP_CONFIG", str(Path(__file__).with_name("config.json"))))
    parser.add_argument("--allowed-sources", default=os.environ.get("SHOP_ALLOWED_SOURCES", ""))
    args = parser.parse_args()
    if not ipaddress.ip_address(args.host).is_loopback and not args.allowed_sources.strip():
        parser.error("Public binding requires SHOP_ALLOWED_SOURCES with the game server's source IP/CIDR")
    os.umask(0o077)
    Path(args.db).parent.mkdir(parents=True, exist_ok=True)
    shop = Shop(args.db, json.loads(Path(args.config).read_text()))
    server = Server((args.host, args.port), shop, args.allowed_sources.split(","))
    print(f"Devast shop for server {shop.config['server_id']} listening on {args.host}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        shop.close()


if __name__ == "__main__":
    main()
