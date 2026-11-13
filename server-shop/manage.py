"""Local administrator tools; no public money or admin HTTP endpoint."""
import argparse
import getpass
import json
import os
import re
import secrets
import sqlite3
from pathlib import Path

from shop import Shop, password_hash


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default=os.environ.get("SHOP_DB", "data/shop.sqlite3"))
    parser.add_argument("--config", default=str(Path(__file__).with_name("config.json")))
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("accounts")
    sub.add_parser("orders")
    credit = sub.add_parser("credit")
    credit.add_argument("account", type=int)
    credit.add_argument("amount", type=int)
    cancel = sub.add_parser("cancel-order", help="Only after verifying the game did not apply the uncertain command")
    cancel.add_argument("id", type=int)
    reset = sub.add_parser("reset-password")
    reset.add_argument("account", type=int)
    backup = sub.add_parser("backup")
    backup.add_argument("file")
    args = parser.parse_args()
    os.umask(0o077)
    if not Path(args.db).is_file():
        parser.error("Database not found - start the shop first")
    shop = Shop(args.db, json.loads(Path(args.config).read_text()))
    try:
        if args.command == "accounts":
            rows = shop.db.execute("SELECT id,balance,reserved FROM accounts ORDER BY id").fetchall()
            print(json.dumps([dict(r) for r in rows], ensure_ascii=False, indent=2))
        elif args.command == "orders":
            rows = shop.db.execute("SELECT * FROM orders WHERE status IN ('queued','sent','review') ORDER BY id").fetchall()
            print(json.dumps([dict(r) for r in rows], ensure_ascii=False, indent=2))
        elif args.command == "credit":
            shop.credit(args.account, args.amount)
            print("Credited")
        elif args.command == "cancel-order":
            shop.cancel_uncertain(args.id)
            print("Order cancelled; remaining purchase reservation released")
        elif args.command == "reset-password":
            password = getpass.getpass("New password (8-64 letters/digits/_/-): ")
            if not re.fullmatch(r"[\w-]{8,64}", password):
                parser.error("Invalid password")
            if getpass.getpass("Repeat password: ") != password:
                parser.error("Passwords do not match")
            digest = password_hash(password, shop.login_salt)
            result = shop.db.execute("UPDATE accounts SET name=?,salt=?,password_hash=? WHERE id=?",
                                     (digest.hex(), shop.login_salt, digest, args.account))
            if not result.rowcount:
                parser.error("Account not found")
            print("Password changed. Restart the shop to invalidate cached login sessions.")
        elif args.command == "backup":
            destination = Path(args.file)
            if destination.exists() or destination.resolve() == Path(args.db).resolve():
                parser.error("Backup target must be a new file")
            destination.parent.mkdir(parents=True, exist_ok=True)
            with sqlite3.connect(destination) as target:
                shop.db.backup(target)
            print("Backup created")
    finally:
        shop.close()


if __name__ == "__main__":
    main()
