import copy
import http.client
import json
import sqlite3
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from shop import Shop
from server import Handler, Server

ROOT = Path(__file__).resolve().parents[1]


class Clock:
    def __init__(self):
        self.now = 1_800_000_000.0

    def __call__(self):
        return self.now

    def step(self, seconds=2):
        self.now += seconds


class ShopTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = str(Path(self.tmp.name) / "shop.sqlite3")
        self.clock = Clock()
        self.config = json.loads((ROOT / "config.json").read_text())
        self.shop = Shop(self.db, self.config, self.clock)
        self.player = {"id": 2, "gid": 1002, "login": "SyntheticPass_123",
                       "nickname": "Alice", "inventory": [{"name": "Wood", "quantity": 200},
                                                                 {"name": "Iron", "quantity": 20}]}
        self.sequence = 0
        self.tick()
        self.alice = self.shop.sessions[1002].account

    def tearDown(self):
        self.shop.close()
        self.tmp.cleanup()

    def event(self, kind="chat", **extra):
        self.sequence += 1
        return {"id": self.sequence, "type": kind, "birth": self.clock(), **extra}

    def tick(self, events=(), players=None, step=2):
        self.clock.step(step)
        return self.shop.process({"players": [self.player] if players is None else players,
                                  "events": list(events)})["content"]

    def chat(self, text):
        return self.tick([self.event(message=text, gid=self.player["gid"])])

    def account(self):
        return self.shop.account(self.alice)

    def orders(self):
        return [dict(r) for r in self.shop.db.execute("SELECT * FROM orders ORDER BY id")]

    def test_account_creation_password_hash_and_native_login_guard(self):
        row = self.shop.db.execute("SELECT * FROM accounts").fetchone()
        self.assertEqual(row["name"], row["password_hash"].hex())
        self.assertIsInstance(row["password_hash"], bytes)
        self.assertNotIn(b"SyntheticPass_123", row["password_hash"])
        messages = self.chat("?bal")
        self.assertTrue(any(s.startswith("!message-to=2:SyntheticPass_123:") for s in messages))
        self.shop.db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
        self.assertNotIn(b"SyntheticPass_123", Path(self.db).read_bytes())

    def test_different_password_creates_empty_account_and_cannot_take_money(self):
        self.shop.credit(self.alice, 5000)
        self.player["login"] = "WrongPass_123"
        self.tick()
        self.assertNotEqual(self.shop.sessions[self.player["gid"]].account, self.alice)
        self.assertFalse(any(s.startswith("!item-to") for s in self.chat("?buy=ak47")))
        self.assertEqual(self.account()["balance"], 5000)

    def test_same_password_returns_account_after_restart(self):
        self.shop.credit(self.alice, 600)
        self.shop.close()
        self.shop = Shop(self.db, self.config, self.clock)
        self.player["login"] = "SyntheticPass_123"
        self.tick()
        self.assertEqual(self.account()["balance"], 600)
        self.assertEqual(self.shop.db.execute("SELECT count(*) FROM accounts").fetchone()[0], 1)

    def test_two_characters_on_one_account_do_not_earn_twice(self):
        clone = {**self.player, "gid": 1003, "id": 3}
        for _ in range(30):
            self.tick(players=[self.player, clone])
        self.assertEqual(self.account()["balance"], 10)
        self.assertEqual(len(self.shop.sessions), 1)

    def test_online_reward_and_no_reward_for_offline_gap(self):
        for _ in range(30):
            self.tick()
        self.assertEqual(self.account()["balance"], 10)
        self.tick(step=3600)
        self.assertEqual(self.account()["balance"], 10)
        self.tick(players=[])
        self.tick(step=60)
        self.assertEqual(self.account()["balance"], 10)

    def test_buy_reserves_then_charges_only_confirmed_delivery(self):
        self.shop.credit(self.alice, 4000)
        commands = self.chat("?buy=ak47")
        self.assertIn("!item-to=2:SyntheticPass_123:ak47*1", commands)
        self.assertEqual((self.account()["balance"], self.account()["reserved"]), (4000, 3000))
        self.tick([self.event("addItem", player=1002, name="AK47", quantity=1)])
        self.assertEqual((self.account()["balance"], self.account()["reserved"]), (1000, 0))
        self.assertEqual(self.orders()[0]["status"], "confirmed")

    def test_sale_requires_inventory_and_removal_confirmation(self):
        commands = self.chat("?sell=wood*100")
        self.assertIn("!remove-to=2:SyntheticPass_123:wood*100", commands)
        self.assertEqual(self.account()["balance"], 0)
        event = self.event("remove", player=1002, name="Wood", quantity=100)
        self.tick([event])
        self.assertEqual(self.account()["balance"], 100)
        self.tick([event])
        self.assertEqual(self.account()["balance"], 100)

    def test_display_aliases_for_resources_ammunition_medkit(self):
        for sku, display in [("steel", "Iron"), ("electronics", "Electronic Parts"),
                             ("wire", "Big Wire"), ("bullet_9mm", "Bullet"),
                             ("bullet_shotgun", "Cartridge"), ("bullet_sniper", "Heavy Bullet"),
                             ("medikit", "Medkit")]:
            self.assertEqual(self.shop.canonical_item(display), sku)
        commands = self.chat("?sell=steel*10")
        self.assertTrue(any(s.endswith(":steel*10") for s in commands))
        self.tick([self.event("remove", player=1002, name="Iron", quantity=10)])
        self.assertEqual(self.account()["balance"], 50)

    def test_ambiguous_cable_names_use_inventory_item_ids(self):
        wanted = self.config["catalog"]["cable0"]["iid"]
        other = self.config["catalog"]["cable1"]["iid"]
        self.player["inventory"] = [{"name": "Cable", "iid": other, "quantity": 50}]
        self.assertFalse(any(s.startswith("!remove-to") for s in self.chat("?sell=cable0*1")))
        self.player["inventory"].append({"name": "Cable", "iid": wanted, "quantity": 1})
        self.assertTrue(any(s.endswith(":cable0*1") for s in self.chat("?sell=cable0")))

    def test_chat_is_not_lost_behind_many_non_chat_events(self):
        self.shop.credit(self.alice, 100)
        noisy = [self.event("buildingDestroyed", gid=10000+i) for i in range(300)]
        result = self.tick(noisy+[self.event(message="?buy=wood", gid=1002)])
        self.assertTrue(any(s.endswith(":wood*1") and s.startswith("!item-to") for s in result))

    def test_prices_cover_every_unique_official_item(self):
        manual = json.loads((ROOT / "manual-items.json").read_text())
        self.assertEqual(set(manual["items"]), set(self.config["catalog"]))
        self.assertEqual(len(self.config["catalog"]), 147)
        self.assertTrue(all(0 < spec["sell"] <= spec["buy"] for spec in self.config["catalog"].values()))

    def test_every_catalog_item_can_be_bought_and_acknowledged(self):
        self.shop.credit(self.alice, 100000000)
        expected = 100000000
        for sku, spec in self.config["catalog"].items():
            with self.subTest(item=sku):
                commands = self.chat("?buy=" + sku)
                self.assertTrue(any(s.endswith(":" + sku + "*1") and s.startswith("!item-to") for s in commands))
                name = spec.get("aliases", [sku])[0]
                self.tick([self.event("addItem", player=1002, name=name, quantity=1)])
                expected -= spec["buy"]
                # Less than one minute of total simulated play in this loop is
                # not guaranteed. Compare purchase ledger rather than rewards.
                self.assertEqual(self.orders()[-1]["status"], "confirmed")
        spent = -self.shop.db.execute("SELECT sum(amount) FROM ledger WHERE reason='buy'").fetchone()[0]
        self.assertEqual(spent, 100000000-expected)

    def test_split_stack_events_accumulate_without_free_items(self):
        self.shop.credit(self.alice, 1000)
        self.chat("?buy=wood*150")
        self.tick([self.event("addItem", player=1002, name="Wood", quantity=100)])
        self.assertEqual((self.account()["balance"], self.account()["reserved"]), (800, 100))
        self.assertEqual(self.orders()[0]["confirmed_quantity"], 100)
        self.tick([self.event("addItem", player=1002, name="Wood", quantity=50)])
        self.assertEqual((self.account()["balance"], self.account()["reserved"]), (700, 0))
        self.assertEqual(self.orders()[0]["status"], "confirmed")

    def test_split_removals_credit_only_actual_quantity(self):
        self.chat("?sell=wood*150")
        self.tick([self.event("remove", player=1002, name="Wood", quantity=100)])
        self.assertEqual(self.account()["balance"], 100)
        self.tick([self.event("remove", player=1002, name="Wood", quantity=50)])
        self.assertEqual(self.account()["balance"], 150)

    def test_duplicate_events_and_parallel_retries_never_double_sell(self):
        self.chat("?sell=wood*10")
        event = self.event("remove", player=1002, name="Wood", quantity=10)
        payload = {"players": [self.player], "events": [event]}
        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(lambda _: self.shop.process(payload), range(20)))
        self.assertEqual(self.account()["balance"], 10)
        self.assertEqual(self.shop.db.execute("SELECT count(*) FROM ledger WHERE reason='sell'").fetchone()[0], 1)

    def test_repeated_buy_chat_returns_item_command_once(self):
        self.shop.credit(self.alice, 5000)
        event = self.event(message="?buy=ak47", gid=1002)
        first = self.tick([event])
        second = self.tick([event])
        self.assertEqual(sum(s.startswith("!item-to") for s in first+second), 1)
        self.assertEqual(len(self.orders()), 1)

    def test_insufficient_money_resource_and_unknown_item(self):
        self.assertFalse(any(s.startswith("!item-to") for s in self.chat("?buy=ak47")))
        self.assertFalse(any(s.startswith("!remove-to") for s in self.chat("?sell=wood*201")))
        self.chat("?buy=super_hammer")
        self.assertEqual(self.orders(), [])

    def test_one_open_order_prevents_overspend_and_double_sale(self):
        self.shop.credit(self.alice, 3500)
        self.chat("?buy=ak47")
        self.chat("?buy=ak47")
        self.chat("?sell=wood*100")
        self.assertEqual(len(self.orders()), 1)
        self.assertEqual(self.account()["reserved"], 3000)

    def test_old_or_same_snapshot_grant_does_not_confirm_new_buy(self):
        self.shop.credit(self.alice, 5000)
        event = self.event("addItem", player=1002, name="AK47", quantity=1)
        chat = self.event(message="?buy=ak47", gid=1002)
        self.tick([event, chat])
        self.tick([event])
        self.assertEqual(self.orders()[0]["status"], "sent")

    def test_login_switch_does_not_replay_previous_accounts_chat(self):
        self.shop.credit(self.alice, 5000)
        self.player["login"] = "OtherPass_456"
        old = self.event(message="?buy=ak47", gid=1002)
        self.tick([old])
        self.tick([old])
        self.assertEqual(self.orders(), [])
        self.assertEqual(self.shop.account(self.shop.sessions[1002].account)["balance"], 0)

    def test_forged_item_name_amount_and_wrong_recipient_do_not_credit(self):
        self.chat("?sell=wood*10")
        self.tick([self.event("remove", player=1003, name="Wood", quantity=10),
                   self.event("remove", player=1002, name="Stone", quantity=10),
                   self.event("remove", player=1002, name="Wood", quantity=11)])
        self.assertEqual(self.account()["balance"], 0)

    def test_uncertain_delivery_is_not_retried_or_auto_refunded(self):
        self.shop.credit(self.alice, 5000)
        self.chat("?buy=ak47")
        commands = self.tick(step=100)
        self.assertFalse(any(s.startswith("!item-to") for s in commands))
        self.assertEqual(self.orders()[0]["status"], "review")
        self.assertEqual(self.account()["reserved"], 3000)
        self.shop.cancel_uncertain(1)
        self.assertEqual((self.account()["balance"], self.account()["reserved"]), (5000, 0))

    def test_partial_buy_cancellation_releases_only_unconfirmed_hold(self):
        self.shop.credit(self.alice, 1000)
        self.chat("?buy=wood*150")
        self.tick([self.event("addItem", player=1002, name="Wood", quantity=100)])
        self.shop.cancel_uncertain(1)
        self.assertEqual((self.account()["balance"], self.account()["reserved"]), (800, 0))

    def test_pending_buy_ack_survives_process_restart(self):
        self.shop.credit(self.alice, 5000)
        self.chat("?buy=ak47")
        self.shop.close()
        self.shop = Shop(self.db, self.config, self.clock)
        self.tick([self.event("addItem", player=1002, name="AK47", quantity=1)])
        self.assertEqual(self.account()["balance"], 2000)
        self.assertEqual(self.account()["reserved"], 0)

    def test_transaction_rollback_restores_sessions_and_money(self):
        self.shop.credit(self.alice, 1000)
        original = self.shop._outbox
        self.shop._outbox = lambda *_: (_ for _ in ()).throw(RuntimeError("fixture rollback"))
        with self.assertRaises(RuntimeError):
            self.chat("?buy=wood*10")
        self.shop._outbox = original
        self.assertEqual(self.account()["reserved"], 0)
        self.assertEqual(self.orders(), [])
        self.assertIn(1002, self.shop.sessions)

    def test_command_injection_and_invalid_quantities(self):
        self.shop.credit(self.alice, 1000)
        for text in ("?buy=wood!item-all=c4", "?buy=wood*-1", "?sell=wood*0", "?buy=wood*256",
                     "?buy=wood*1.5", "?buy=wood*999999999999", "?sell=wood*10 !item-all=c4"):
            with self.subTest(text=text):
                result = self.chat(text)
                self.assertFalse(any(s.startswith(("!item-to", "!remove-to")) for s in result))
        self.player["login"] = "SyntheticPass_123!item-all=c4"
        self.assertEqual(self.tick(), [])
        self.assertEqual(self.orders(), [])

    def test_same_pid_cannot_confirm_other_gid_order(self):
        self.chat("?sell=wood*10")
        self.tick([self.event("remove", player=2, name="Wood", quantity=10)])
        self.assertEqual(self.account()["balance"], 0)

    def test_changed_account_on_same_gid_cannot_confirm_old_order(self):
        self.shop.credit(self.alice, 5000)
        self.chat("?buy=ak47")
        self.player["login"] = "AnotherPrivatePass_987"
        self.tick([self.event("addItem", player=1002, name="AK47", quantity=1)])
        self.assertEqual(self.account()["balance"], 5000)
        self.assertEqual(self.account()["reserved"], 3000)

    def test_unrelated_late_grant_cannot_settle_expired_order(self):
        self.shop.credit(self.alice, 5000)
        self.chat("?buy=ak47")
        self.tick(step=100)
        self.tick([self.event("addItem", player=1002, name="AK47", quantity=1)])
        self.assertEqual(self.orders()[0]["status"], "review")
        self.assertEqual(self.account()["balance"], 5000)

    def test_help_catalog_and_russian_command_aliases(self):
        for command in ("?help", "?bal", "?shop", "?shop=2", "?shop=999", "/баланс", "/магазин"):
            with self.subTest(command=command):
                self.assertTrue(self.chat(command))
        self.assertTrue(any(s.startswith("!remove-to") for s in self.chat("?sell=wood*10")))

    def test_malformed_payload_has_no_side_effects(self):
        for payload in ([], {}, {"players": [], "events": [None]},
                        {"players": [self.player, self.player], "events": []}):
            with self.subTest(payload=payload):
                with self.assertRaises(ValueError):
                    self.shop.process(payload)
        self.assertEqual(self.account()["balance"], 0)


class HTTPTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.shop = Shop(str(Path(self.tmp.name) / "http.sqlite3"))
        self.server = Server(("127.0.0.1", 0), self.shop)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.shop.close()
        self.tmp.cleanup()

    def request(self, method, path, body=None, headers=None):
        connection = http.client.HTTPConnection(*self.server.server_address, timeout=5)
        connection.request(method, path, body, headers or {})
        response = connection.getresponse()
        status, payload = response.status, json.loads(response.read())
        connection.close()
        return status, payload

    def test_http_protocol_and_health(self):
        code, before = self.request("GET", "/health")
        self.assertEqual(code, 200)
        self.assertFalse(before["webhook_connected"])
        code, result = self.request("POST", "/devast", json.dumps({"players": [], "events": []}))
        self.assertEqual((code, result), (200, {"type": "commands", "content": []}))
        _, after = self.request("GET", "/health")
        self.assertTrue(after["webhook_connected"])
        self.assertEqual(after["server_id"], 67)

    def test_bad_json_and_routes(self):
        self.assertEqual(self.request("POST", "/devast", "{bad")[0], 400)
        self.assertEqual(self.request("POST", "/devast", "[]")[0], 400)
        self.assertEqual(self.request("GET", "/money")[0], 404)

    def test_forwarded_header_cannot_bypass_source_allowlist(self):
        handler = Handler.__new__(Handler)
        handler.server = self.server
        handler.client_address = ("198.51.100.99", 1)
        handler.headers = {"X-Forwarded-For": "127.0.0.1"}
        self.assertFalse(handler._allowed())

    def test_full_http_game_simulation_sell_earn_buy_and_inventory(self):
        clock = Clock()
        self.shop.clock = clock
        player = {"id": 7, "gid": 7007, "login": "DemoPrivatePass_987",
                  "nickname": "Shop integration fixture", "inventory": [{"name": "Uranium", "iid": 55, "quantity": 200}]}
        # Always use the exact IID from the checked catalogue rather than
        # treating a display name as a unique inventory identifier.
        player["inventory"][0]["iid"] = self.shop.config["catalog"]["uranium"]["iid"]
        events, sequence, issued = [], 0, []

        def event(kind, **fields):
            nonlocal sequence
            sequence += 1
            return {"id": sequence, "type": kind, "birth": clock(), **fields}

        def post(text=None, seconds=2):
            clock.step(seconds)
            if text:
                events.append(event("chat", gid=7007, message=text))
            status, response = self.request("POST", "/devast", json.dumps({"players": [player], "events": events}))
            self.assertEqual(status, 200)
            self.assertEqual(response["type"], "commands")
            for command in response["content"]:
                if command.startswith("!message-to="):
                    continue
                verb, body = command.split("=", 1)
                pid, login, item_spec = body.split(":", 2)
                self.assertEqual((int(pid), login), (player["id"], player["login"]))
                code, quantity = item_spec.split("*")
                quantity = int(quantity)
                spec = self.shop.config["catalog"][code]
                display, iid = spec["aliases"][0], spec["iid"]
                if verb == "!remove-to":
                    slot = next(slot for slot in player["inventory"] if slot["iid"] == iid)
                    self.assertGreaterEqual(slot["quantity"], quantity)
                    slot["quantity"] -= quantity
                    events.append(event("remove", player=7007, name=display, quantity=quantity))
                elif verb == "!item-to":
                    player["inventory"].append({"name": display, "iid": iid, "quantity": quantity})
                    events.append(event("addItem", player=7007, name=display, quantity=quantity))
                else:
                    self.fail("Unexpected server command")
                issued.append((verb, code, quantity))

        post()
        account = self.shop.sessions[7007].account
        post("?sell=uranium*200")
        self.assertEqual(self.shop.account(account)["balance"], 0)
        post()
        self.assertEqual(self.shop.account(account)["balance"], 5000)
        post("?buy=ak47")
        post()
        self.assertEqual(self.shop.account(account)["balance"], 2000)
        self.assertTrue(any(s["name"] == "AK47" and s["quantity"] == 1 for s in player["inventory"]))
        for _ in range(30):
            post()
        self.assertEqual(self.shop.account(account)["balance"], 2010)
        self.assertEqual(issued, [("!remove-to", "uranium", 200), ("!item-to", "ak47", 1)])


if __name__ == "__main__":
    unittest.main()
