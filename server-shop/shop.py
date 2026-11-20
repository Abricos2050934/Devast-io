"""Devast.io server shop. Python standard library only; no client modifications."""
from __future__ import annotations

import hashlib
import hmac
import json
import math
import re
import secrets
import sqlite3
import threading
import time
from dataclasses import dataclass
from pathlib import Path

MAX_MONEY = 1_000_000_000_000
LOGIN = re.compile(r"[\w-]{8,64}\Z")
SKU = re.compile(r"[a-z0-9_]{1,40}\Z")
HELP = "Команды ?bal ?shop=страница ?price=предмет ?buy=предмет*число ?sell=предмет*число ?help"


def item_key(value):
    """Native inventory/events use display names; commands use underscore names."""
    return re.sub(r"[^a-z0-9]+", "_", str(value).lower()).strip("_")


def integer(value, minimum=0):
    return type(value) is int and value >= minimum


def password_hash(password, salt):
    return hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=32)


@dataclass
class Session:
    gid: int
    pid: int
    account: int
    login: str
    fingerprint: bytes
    last_seen: float


class Shop:
    def __init__(self, database, config=None, clock=time.time):
        self.config = config or json.loads(Path(__file__).with_name("config.json").read_text())
        self._validate_config()
        self.item_aliases = {}
        for code, spec in self.config["catalog"].items():
            for name in spec.get("aliases", []):
                alias = item_key(name)
                if alias in self.item_aliases and self.item_aliases[alias] != code:
                    self.item_aliases[alias] = None  # e.g. four cable variants named Cable
                else:
                    self.item_aliases[alias] = code
        self.clock = clock
        self.lock = threading.RLock()
        self.sessions = {}
        self.failed_auth = {}
        self._fingerprint_key = secrets.token_bytes(32)
        self.last_webhook = None
        self.snapshot_count = 0
        self.db = sqlite3.connect(database, check_same_thread=False, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA busy_timeout=10000")
        self.db.executescript("""
          CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE,
            salt BLOB NOT NULL, password_hash BLOB NOT NULL,
            balance INTEGER NOT NULL CHECK(balance>=0),
            reserved INTEGER NOT NULL DEFAULT 0 CHECK(reserved>=0 AND reserved<=balance),
            play_seconds REAL NOT NULL DEFAULT 0, created REAL NOT NULL
          );
          CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY, account INTEGER NOT NULL REFERENCES accounts(id),
            gid INTEGER NOT NULL, pid INTEGER NOT NULL, kind TEXT NOT NULL,
            item TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price INTEGER NOT NULL,
            status TEXT NOT NULL, created REAL NOT NULL, sent REAL,
            confirmed_quantity INTEGER NOT NULL DEFAULT 0
          );
          CREATE UNIQUE INDEX IF NOT EXISTS one_open_order ON orders(account)
            WHERE status IN ('queued','sent','review');
          CREATE TABLE IF NOT EXISTS ledger (
            id INTEGER PRIMARY KEY, account INTEGER NOT NULL REFERENCES accounts(id),
            amount INTEGER NOT NULL, reason TEXT NOT NULL,
            reference TEXT NOT NULL UNIQUE, created REAL NOT NULL
          );
          CREATE TABLE IF NOT EXISTS seen_events (
            event_key TEXT PRIMARY KEY, seen_at REAL NOT NULL
          );
          CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value BLOB NOT NULL);
        """)
        self.db.execute("INSERT OR IGNORE INTO meta VALUES('login_salt',?)", (secrets.token_bytes(16),))
        self.login_salt = self.db.execute("SELECT value FROM meta WHERE key='login_salt'").fetchone()[0]

    def _validate_config(self):
        c = self.config
        if c.get("event_player_reference", "gid") not in ("gid", "pid"):
            raise ValueError("Invalid event player reference")
        for field in ("server_id", "reward_seconds", "max_snapshot_gap_seconds",
                      "confirmation_timeout_seconds", "max_commands_per_response",
                      "max_new_authentications_per_tick"):
            if not integer(c.get(field), 1):
                raise ValueError("Invalid config field: " + field)
        for field in ("starting_balance", "reward_coins"):
            if not integer(c.get(field)) or c[field] > MAX_MONEY:
                raise ValueError("Invalid config field: " + field)
        if not isinstance(c.get("catalog"), dict) or not c["catalog"]:
            raise ValueError("Empty catalog")
        for key, spec in c["catalog"].items():
            if not SKU.fullmatch(key) or not isinstance(spec, dict):
                raise ValueError("Invalid catalog item")
            buy, sell = spec.get("buy"), spec.get("sell")
            if not integer(buy, 1) or buy > MAX_MONEY:
                raise ValueError("Invalid buy price")
            if sell is not None and (not integer(sell, 1) or sell > buy):
                raise ValueError("Invalid sell price")
            if not isinstance(spec.get("aliases", []), list) or any(
                    not isinstance(name, str) for name in spec.get("aliases", [])):
                raise ValueError("Invalid aliases")

    def canonical_item(self, name):
        raw = str(name).strip().lower()
        if raw in self.config["catalog"]:
            return raw
        return self.item_aliases.get(item_key(name))

    def item_matches(self, code, name, iid=None):
        spec = self.config["catalog"][code]
        if integer(iid) and integer(spec.get("iid")):
            return iid == spec["iid"]
        canonical = self.canonical_item(name)
        if canonical:
            return canonical == code
        return item_key(name) in {item_key(alias) for alias in spec.get("aliases", [])}

    def close(self):
        with self.lock:
            self.db.close()

    def _fingerprint(self, login):
        return hmac.digest(self._fingerprint_key, login.encode(), "sha256")

    def _message(self, session, text, messages):
        # Login is validated before a Session exists. Never accept command syntax
        # in a chat reply. Password-bearing native commands are never logged.
        text = re.sub(r"[!\r\n:]", " ", str(text))[:210]
        if len(messages) < 20:
            messages.append(f"!message-to={session.pid}:{session.login}:{text}")

    def account(self, reference):
        with self.lock:
            field = "id" if isinstance(reference, int) or str(reference).isdigit() else "name"
            row = self.db.execute(f"SELECT id,balance,reserved,play_seconds FROM accounts WHERE {field}=?",
                                  (reference,)).fetchone()
            return dict(row) if row else None

    def _authenticate(self, players, now, messages):
        old_sessions = self.sessions
        sessions, new_gids, used_accounts = {}, set(), set()
        auth_budget = self.config["max_new_authentications_per_tick"]
        for p in players:
            gid, pid, login = p.get("gid"), p.get("id"), p.get("login", "")
            if not integer(gid, 1) or not integer(pid, 1) or not isinstance(login, str):
                continue
            if not LOGIN.fullmatch(login):
                continue
            fingerprint = self._fingerprint(login)
            old = old_sessions.get(gid)
            if old and old.pid == pid and hmac.compare_digest(old.fingerprint, fingerprint):
                account_id = old.account
            else:
                if self.failed_auth.get(gid, 0) > now or auth_budget <= 0:
                    continue
                auth_budget -= 1
                # Password alone is the account credential. Use a deliberately
                # slow, salted deterministic lookup; no plaintext login is saved.
                digest = password_hash(login, self.login_salt)
                name = digest.hex()
                row = self.db.execute("SELECT * FROM accounts WHERE name=?", (name,)).fetchone()
                if row:
                    if not hmac.compare_digest(row["password_hash"], digest):
                        self.failed_auth[gid] = now + 15
                        continue
                    account_id = row["id"]
                else:
                    account_id = self.db.execute(
                        "INSERT INTO accounts(name,salt,password_hash,balance,created) VALUES(?,?,?,?,?)",
                        (name, self.login_salt, digest, self.config["starting_balance"], now)
                    ).lastrowid
                new_gids.add(gid)
            if account_id in used_accounts:
                self.failed_auth[gid] = now + 15
                self._message(Session(gid, pid, 0, login, fingerprint, now),
                              "Этот аккаунт уже используется другим персонажем.", messages)
                continue  # Never earn twice or trade from two characters on one account.
            used_accounts.add(account_id)
            session = Session(gid, pid, account_id, login, fingerprint, now)
            sessions[gid] = session
            if gid in new_gids:
                self._message(session, f"Магазин - аккаунт #{account_id} активен. {HELP}", messages)
            elif old:
                elapsed = now - old.last_seen
                if 0 < elapsed <= self.config["max_snapshot_gap_seconds"]:
                    self._reward(session, elapsed, now, messages)
        self.sessions = sessions
        self.failed_auth = {gid: until for gid, until in self.failed_auth.items()
                            if until > now and any(p.get("gid") == gid for p in players)}
        return new_gids

    def _credit(self, account_id, amount, reason, reference, now):
        if not integer(amount, 1):
            return False
        row = self.db.execute("SELECT balance FROM accounts WHERE id=?", (account_id,)).fetchone()
        if row["balance"] + amount > MAX_MONEY:
            return False
        self.db.execute("INSERT INTO ledger(account,amount,reason,reference,created) VALUES(?,?,?,?,?)",
                        (account_id, amount, reason, reference, now))
        self.db.execute("UPDATE accounts SET balance=balance+? WHERE id=?", (amount, account_id))
        return True

    def _reward(self, session, elapsed, now, messages):
        row = self.db.execute("SELECT play_seconds FROM accounts WHERE id=?", (session.account,)).fetchone()
        total = row["play_seconds"] + elapsed
        periods = int(total // self.config["reward_seconds"])
        self.db.execute("UPDATE accounts SET play_seconds=? WHERE id=?",
                        (total % self.config["reward_seconds"], session.account))
        amount = periods * self.config["reward_coins"]
        if amount and self._credit(session.account, amount, "play", "play:" + secrets.token_hex(16), now):
            self._message(session, f"За время в игре +{amount} монет. ?bal", messages)

    def _event_key(self, event):
        if (not integer(event.get("id")) or not isinstance(event.get("type"), str)
                or isinstance(event.get("birth"), bool)
                or not isinstance(event.get("birth"), (float, int))
                or not math.isfinite(event["birth"])):
            return None
        return json.dumps([event["id"], event["birth"], event["type"]], separators=(",", ":"))

    def _event_gid(self, value, players):
        if isinstance(value, dict):
            return value.get("gid") if integer(value.get("gid"), 1) else None
        if not integer(value, 1):
            return None
        if self.config.get("event_player_reference", "gid") == "gid":
            return value
        matches = [p["gid"] for p in players if p.get("id") == value and integer(p.get("gid"), 1)]
        return matches[0] if len(matches) == 1 else None

    def _confirm(self, event, players, now, messages):
        kind = {"addItem": "buy", "remove": "sell"}.get(event["type"])
        if not kind:
            return
        gid = self._event_gid(event.get("player"), players)
        quantity = event.get("quantity")
        if gid is None or not integer(quantity, 1):
            return
        # Event GID, item, actual quantity and creation time must agree. There
        # is at most one outstanding order for an authenticated account.
        row = self.db.execute(
            "SELECT * FROM orders WHERE gid=? AND kind=? AND status IN ('sent','review') ORDER BY id LIMIT 1",
            (gid, kind)).fetchone()
        if (not row or not self.item_matches(row["item"], event.get("name", ""), event.get("iid"))
                or event["birth"] < row["sent"] - 10
                or event["birth"] > row["sent"] + self.config["confirmation_timeout_seconds"]):
            return
        current = self.sessions.get(gid)
        if any(p.get("gid") == gid for p in players) and (
                not current or current.account != row["account"] or current.pid != row["pid"]):
            return  # A reused entity/PID or changed login cannot settle another account's trade.
        remaining = row["quantity"] - row["confirmed_quantity"]
        if quantity > remaining:
            return  # Ambiguous unrelated admin grant/removal; do not guess.
        amount = quantity * row["unit_price"]
        if kind == "buy":
            self.db.execute("UPDATE accounts SET balance=balance-?,reserved=reserved-? WHERE id=?",
                            (amount, amount, row["account"]))
            self.db.execute("INSERT INTO ledger(account,amount,reason,reference,created) VALUES(?,?,?,?,?)",
                            (row["account"], -amount, "buy", f"order:{row['id']}:{self._event_key(event)}", now))
        else:
            if not self._credit(row["account"], amount, "sell", f"order:{row['id']}:{self._event_key(event)}", now):
                self.db.execute("UPDATE orders SET status='review' WHERE id=?", (row["id"],))
                return
        confirmed = row["confirmed_quantity"] + quantity
        status = "confirmed" if confirmed == row["quantity"] else row["status"]
        self.db.execute("UPDATE orders SET status=?,confirmed_quantity=? WHERE id=?",
                        (status, confirmed, row["id"]))
        session = self.sessions.get(gid)
        if session and session.account == row["account"]:
            text = (f"Покупка #{row['id']} - выдано {row['item']} x{quantity}, списано {amount}."
                    if kind == "buy" else f"Продажа #{row['id']} - {row['item']} x{quantity}, +{amount} монет.")
            self._message(session, text, messages)

    def _inventory_count(self, player, item):
        slots = player.get("inventory", [])
        if not isinstance(slots, list):
            return 0
        return sum(slot["quantity"] for slot in slots if isinstance(slot, dict)
                   and self.item_matches(item, slot.get("name", ""), slot.get("iid")) and integer(slot.get("quantity"), 1))

    def _chat(self, text, session, player, now, messages):
        if not isinstance(text, str) or len(text) > 256:
            return
        text = text.strip()
        if text.startswith("?"):
            keyword, separator, value = text.partition("=")
            aliases = {"?bal": "/balance", "?shop": "/shop", "?help": "/help",
                       "?buy": "/buy", "?sell": "/sell", "?price": "/price"}
            if keyword.lower() not in aliases:
                return
            text = aliases[keyword.lower()]
            if separator:
                text += " " + (value.replace("*", " ") if keyword.lower() in ("?buy", "?sell") else value)
        parts = text.split()
        if not parts or not parts[0].startswith("/"):
            return
        command = parts[0].lower()
        command = {"/баланс": "/balance", "/магазин": "/shop", "/купить": "/buy",
                   "/продать": "/sell", "/помощь": "/help"}.get(command, command)
        if command == "/help":
            self._message(session, HELP, messages)
        elif command == "/price" and len(parts) == 2:
            spec = self.config["catalog"].get(self.canonical_item(parts[1]))
            self._message(session, (f"{parts[1].lower()} - купить {spec['buy']}, продать {spec['sell']}"
                                    if spec else "Такого предмета нет. ?shop"), messages)
        elif command == "/balance":
            row = self.db.execute("SELECT balance,reserved FROM accounts WHERE id=?", (session.account,)).fetchone()
            pending = self.db.execute("SELECT id,status FROM orders WHERE account=? AND status IN ('queued','sent','review')",
                                      (session.account,)).fetchone()
            self._message(session, f"Аккаунт #{session.account}. Доступно {row['balance']-row['reserved']} монет. Резерв {row['reserved']}."
                          + (f" Заказ #{pending['id']} - {pending['status']}." if pending else ""), messages)
        elif command == "/shop":
            if len(parts) > 2 or (len(parts) == 2 and not parts[1].isdigit()):
                self._message(session, "Используй ?shop=страница", messages)
                return
            items = list(self.config["catalog"].items())
            pages = (len(items) + 3) // 4
            page = int(parts[1]) if len(parts) == 2 else 1
            if not 1 <= page <= pages:
                self._message(session, f"Страницы магазина 1-{pages}", messages)
                return
            self._message(session, f"Магазин {page}/{pages}. Цены за 1 шт. ?buy=предмет", messages)
            for code, spec in items[(page-1)*4:page*4]:
                self._message(session, f"{code} - купить {spec['buy']}"
                              + (f", продать {spec['sell']}" if spec["sell"] is not None else ""), messages)
        elif command in ("/buy", "/sell"):
            if len(parts) not in (2, 3) or not SKU.fullmatch(parts[1].lower()):
                self._message(session, "Пример ?buy=wood*100 или ?sell=wood*100", messages)
                return
            code = self.canonical_item(parts[1])
            if len(parts) == 3 and (not parts[2].isdigit() or len(parts[2]) > 3):
                self._message(session, "Количество должно быть целым от 1 до 255", messages)
                return
            quantity = int(parts[2]) if len(parts) == 3 else 1
            spec = self.config["catalog"].get(code)
            kind = "buy" if command == "/buy" else "sell"
            if not 1 <= quantity <= 255 or not spec or spec.get(kind) is None:
                self._message(session, "Предмет недоступен или неверное количество. ?shop", messages)
                return
            if self.db.execute("SELECT 1 FROM orders WHERE account=? AND status IN ('queued','sent','review')",
                               (session.account,)).fetchone():
                self._message(session, "Дождись подтверждения предыдущего заказа. ?bal", messages)
                return
            cost = spec[kind] * quantity
            if kind == "buy":
                row = self.db.execute("SELECT balance,reserved FROM accounts WHERE id=?", (session.account,)).fetchone()
                if row["balance"] - row["reserved"] < cost:
                    self._message(session, f"Недостаточно монет. Нужно {cost}. ?bal", messages)
                    return
                self.db.execute("UPDATE accounts SET reserved=reserved+? WHERE id=?", (cost, session.account))
            elif self._inventory_count(player, code) < quantity:
                self._message(session, "В инвентаре недостаточно ресурсов для продажи", messages)
                return
            order = self.db.execute(
                "INSERT INTO orders(account,gid,pid,kind,item,quantity,unit_price,status,created) VALUES(?,?,?,?,?,?,?,'queued',?)",
                (session.account, session.gid, session.pid, kind, code, quantity, spec[kind], now)).lastrowid
            self._message(session, f"Заказ #{order} принят. Ожидается подтверждение сервера.", messages)

    def _outbox(self, now, messages):
        commands = []
        limit = self.config["max_commands_per_response"]
        rows = self.db.execute("SELECT * FROM orders WHERE status='queued' ORDER BY id").fetchall()
        for row in rows:
            if len(commands) >= limit:
                break
            session = self.sessions.get(row["gid"])
            if not session or session.account != row["account"] or session.pid != row["pid"]:
                if row["kind"] == "buy":
                    self.db.execute("UPDATE accounts SET reserved=reserved-? WHERE id=?",
                                    ((row["quantity"] - row["confirmed_quantity"]) * row["unit_price"], row["account"]))
                self.db.execute("UPDATE orders SET status='cancelled' WHERE id=?", (row["id"],))
                continue
            verb = "item-to" if row["kind"] == "buy" else "remove-to"
            commands.append(f"!{verb}={session.pid}:{session.login}:{row['item']}*{row['quantity']}")
            # Persist before writing the HTTP response. Never auto-resend an
            # uncertain command: the game protocol supplies no idempotency key.
            self.db.execute("UPDATE orders SET status='sent',sent=? WHERE id=?", (now, row["id"]))
        return commands + messages[:max(0, limit-len(commands))]

    def process(self, payload):
        if not isinstance(payload, dict):
            raise ValueError("Expected an object")
        players, events = payload.get("players"), payload.get("events")
        if not isinstance(players, list) or not isinstance(events, list) or len(players) > 1000 or len(events) > 20000:
            raise ValueError("Invalid players/events arrays")
        if any(not isinstance(p, dict) for p in players) or any(not isinstance(e, dict) for e in events):
            raise ValueError("Invalid player/event")
        # Reject ambiguous snapshots instead of attributing trades to the wrong player.
        valid_players = [p for p in players if integer(p.get("gid"), 1) and integer(p.get("id"), 1)]
        if (len({p["gid"] for p in valid_players}) != len(valid_players)
                or len({p["id"] for p in valid_players}) != len(valid_players)):
            raise ValueError("Duplicate player identifiers")
        with self.lock:
            now = self.clock()
            saved_sessions = dict(self.sessions)
            saved_failed = dict(self.failed_auth)
            self.db.execute("BEGIN IMMEDIATE")
            try:
                messages = []
                new_gids = self._authenticate(valid_players, now, messages)
                player_by_gid = {p["gid"]: p for p in valid_players}
                new_events = []
                for event in events:
                    key = self._event_key(event)
                    if not key or not now - 120 <= event["birth"] <= now + 15:
                        continue
                    cursor = self.db.execute("INSERT OR IGNORE INTO seen_events VALUES(?,?)", (key, now))
                    if cursor.rowcount:
                        new_events.append(event)
                # Acknowledgements are handled before new purchases, so a grant
                # already in this snapshot cannot confirm a new order.
                for event in new_events:
                    self._confirm(event, valid_players, now, messages)
                chat_events = (event for event in new_events if event["type"] == "chat")
                for chat_index, event in enumerate(chat_events):
                    if chat_index >= 200:
                        break
                    if event["type"] != "chat":
                        continue
                    gid = event.get("gid")
                    session = self.sessions.get(gid) if integer(gid, 1) else None
                    if session and gid not in new_gids:
                        self._chat(event.get("message"), session, player_by_gid[gid], now, messages)
                expired = self.db.execute("SELECT * FROM orders WHERE status='sent' AND sent<?",
                                          (now-self.config["confirmation_timeout_seconds"],)).fetchall()
                for row in expired:
                    self.db.execute("UPDATE orders SET status='review' WHERE id=?", (row["id"],))
                    session = self.sessions.get(row["gid"])
                    if session and session.account == row["account"]:
                        self._message(session, f"Заказ #{row['id']} ждёт проверки администратором - подтверждение не пришло.", messages)
                commands = self._outbox(now, messages)
                self.db.execute("DELETE FROM seen_events WHERE seen_at<?", (now-86400*7,))
                self.db.execute("COMMIT")
            except BaseException:
                self.db.execute("ROLLBACK")
                self.sessions, self.failed_auth = saved_sessions, saved_failed
                raise
            self.last_webhook = now
            self.snapshot_count += 1
            return {"type": "commands", "content": commands}

    def credit(self, name, amount):
        with self.lock:
            row = self.account(name)
            if not row or not integer(amount, 1):
                raise ValueError("Unknown account or invalid amount")
            self.db.execute("BEGIN IMMEDIATE")
            try:
                if not self._credit(row["id"], amount, "admin", "admin:"+secrets.token_hex(16), self.clock()):
                    raise ValueError("Balance limit")
                self.db.execute("COMMIT")
            except BaseException:
                self.db.execute("ROLLBACK")
                raise

    def cancel_uncertain(self, order_id):
        """Local administrator only, after inspecting the game. Never auto-refund."""
        with self.lock:
            self.db.execute("BEGIN IMMEDIATE")
            try:
                row = self.db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
                if not row or row["status"] not in ("queued", "sent", "review"):
                    raise ValueError("Order is not open")
                if row["kind"] == "buy":
                    self.db.execute("UPDATE accounts SET reserved=reserved-? WHERE id=?",
                                    ((row["quantity"] - row["confirmed_quantity"]) * row["unit_price"], row["account"]))
                self.db.execute("UPDATE orders SET status='cancelled' WHERE id=?", (order_id,))
                self.db.execute("COMMIT")
            except BaseException:
                self.db.execute("ROLLBACK")
                raise
