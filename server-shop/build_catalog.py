"""Build prices for every unique item code published in the official manual."""
import json
from pathlib import Path

ROOT = Path(__file__).parent
DISPLAY = {
    "gaz_mask": "Radiation Mask", "gaz_protection": "Min. Radiation Suit",
    "armor_deminer": "Protective Suit", "armor_physic_1": "Metal Helmet",
    "armor_physic_2": "Welding Helmet", "armor_physic_3": "Gladiator Helmet",
    "armor_fire_1": "Leather Jacket", "armor_fire_2": "Kevlar Suit", "armor_fire_3": "SWAT Suit",
    "armor_tesla_1": "Power Armor", "armor_tesla_2": "Tesla Armor",
    "hachet": "Hatchet", "steel_pickaxe": "Metal Pickaxe", "stone_axe": "Metal Axe",
    "9mm": "9MM", "sawed_off_shotgun": "Sawed Off", "bullet_9mm": "Bullet",
    "bullet_sniper": "Heavy Bullet", "bullet_shotgun": "Cartridge",
    "wood_crossarrow": "Crossbow Arrows", "seed_orange": "Orange Seed",
    "seed_tomato": "Tomato Seed", "seed_ghoul": "Ghoul Seed", "seed_tree": "Tree Seed",
    "rotten_crisps": "Expired Crisps", "wood_wall": "Wooden Wall",
    "wood_smallwall": "Wooden Low Wall", "stone_smallwall": "Stone Low Wall",
    "steel_smallwall": "Metal Low Wall", "steel_wall": "Metal Wall",
    "wood_door": "Wooden Low Door", "wood_bigdoor": "Wooden Door",
    "stone_door": "Stone Low Door", "stone_bigdoor": "Stone Door",
    "steel_door": "Metal Low Door", "steel_bigdoor": "Metal Door",
    "woodlight_floor": "Light Wood Floor", "gold_floor": "Golden Floor",
    "uranium_bigdoor": "Uranium Door", "campfire_bbq": "Firepit", "tesla": "Tesla Bench",
    "workbench2": "Research Bench", "weaving": "Weaving Machine", "chest": "Wood chest",
    "steel": "Iron", "electronics": "Electronic Parts", "leather_boar": "Leather",
    "wire": "Big Wire", "medikit": "Medkit", "cable_wall": "Cable - Wall",
    "wood_spike": "Wooden Spike"
}
DISPLAY.update({"cable0": "Cable", "cable1": "Cable", "cable2": "Cable",
                "cable3": "Cable", "cable4": "Cable - Bridge"})

# Prices are per unit. Selling yields 25% of the buy price unless a resource
# has an explicitly selected rate. No purchase/sale cycle can mint money.
PRICES = {
    "wood": 2, "stone": 2, "steel": 15, "sulfur": 24, "uranium": 75,
    "electronics": 30, "wire": 9, "small_wire": 6, "animal_fat": 8,
    "animal_tendon": 8, "junk": 5, "leather_boar": 12, "string": 6,
    "shaped_metal": 40, "shaped_uranium": 180, "alloys": 220, "nails": 2,
    "gasoline": 40, "compost": 15,
    "hachet": 80, "stone_pickaxe": 120, "steel_pickaxe": 350, "sulfur_pickaxe": 650,
    "stone_axe": 300, "sulfur_axe": 600, "nail_gun": 900, "hammer": 500,
    "repair_hammer": 450, "wood_spear": 120, "wood_bow": 180, "wood_crossbow": 400,
    "9mm": 600, "desert_eagle": 1200, "mp5": 1800, "shotgun": 2200,
    "ak47": 3000, "sniper": 4500, "sawed_off_shotgun": 1600, "laser_pistol": 2500,
    "dynamite": 1500, "landmine": 1800, "c4": 3500, "laser_submachine": 6000,
    "c4_trigger": 250, "grenade": 1000, "super_hammer": 50000,
    "bullet_9mm": 2, "bullet_sniper": 8, "bullet_shotgun": 5,
    "wood_arrow": 1, "wood_crossarrow": 2, "energy_cells": 5,
    "headscarf": 80, "gaz_mask": 250, "gaz_protection": 450, "radiation_suit": 1000,
    "armor_deminer": 3500, "chapka": 180, "armor_physic_1": 650,
    "armor_physic_2": 1500, "armor_physic_3": 3000, "armor_tesla_1": 5500,
    "winter_coat": 500, "armor_fire_1": 700, "armor_fire_2": 1700,
    "armor_fire_3": 3300, "armor_tesla_2": 8000, "camouflage_gear": 2500,
    "orange": 10, "tomato": 10, "soda": 20, "raw_steak": 15, "cooked_steak": 30,
    "crisps": 15, "tomato_soup": 30, "pumpkin": 15, "acorn": 5,
    "rotten_orange": 2, "rotten_tomato": 2, "rotten_steak": 2,
    "rotten_crisps": 2, "rotten_pumpkin": 2, "rotten_acorn": 1,
    "seed_orange": 30, "seed_tomato": 30, "seed_tree": 40, "seed_ghoul": 100,
    "bandage": 40, "medikit": 150, "radaway": 150, "syringe": 80,
    "chemical_component": 30, "lapadone": 300, "ghoul_drug": 250, "antidote": 200,
    "wood_smallwall": 30, "wood_wall": 50, "wood_door": 60, "wood_bigdoor": 90,
    "wood_floor": 15, "woodlight_floor": 20, "wood_spike": 50,
    "stone_smallwall": 60, "stone_wall": 100, "stone_door": 120, "stone_bigdoor": 160,
    "steel_smallwall": 180, "steel_wall": 300, "steel_door": 350, "steel_bigdoor": 450,
    "tiling_floor": 25, "stone_floor": 25, "red_floor": 50, "gold_floor": 100,
    "stone_cave": 500, "bunker_wall": 1000, "uranium_wall": 1800, "uranium_bigdoor": 2200,
    "workbench": 100, "campfire": 40, "campfire_bbq": 80, "smelter": 180,
    "tesla": 1500, "workbench2": 700, "weaving": 250, "sleeping_bag": 100,
    "chest": 100, "fridge": 300, "can": 15, "agitator": 900, "extractor": 1200,
    "welding_machine": 800, "cable0": 10, "cable1": 10, "cable2": 10,
    "cable3": 10, "cable4": 10, "cable_wall": 60, "automatic_door": 250,
    "lamp": 80, "platform": 120, "switch": 80,
    "gate_or": 100, "gate_not": 100, "gate_and": 100, "gate_xor": 120, "gate_timer": 150
}
RESOURCE_SELL = {"wood": 1, "stone": 1, "steel": 5, "sulfur": 8, "uranium": 25,
                 "electronics": 10, "wire": 3, "small_wire": 2}


def main():
    manual = json.loads((ROOT / "manual-items.json").read_text())
    items = list(dict.fromkeys(manual["items"]))
    if set(items) != set(PRICES):
        raise ValueError(f"Missing/extra prices: {set(items)^set(PRICES)}")
    config = json.loads((ROOT / "config.json").read_text())
    client = json.loads((ROOT / "client-items-reference.json").read_text())["items"]
    catalog = {}
    for code in items:
        display = DISPLAY.get(code, code.replace("_", " ").title())
        catalog[code] = {"name": display, "buy": PRICES[code],
                         "sell": RESOURCE_SELL.get(code, max(1, PRICES[code]//4)),
                         "aliases": [display]}
        matches = [r for r in client if r["name"].lower() == display.lower()]
        if len(matches) == 1:
            catalog[code]["name"] = matches[0]["name"]
            catalog[code]["aliases"] = [matches[0]["name"]]
            catalog[code]["iid"] = matches[0]["iid"]
        elif code in ("cable0", "cable1", "cable2", "cable3"):
            catalog[code]["iid"] = matches[int(code[-1])]["iid"]
    config["catalog"] = catalog
    (ROOT / "config.json").write_text(json.dumps(config, ensure_ascii=False, indent=2)+"\n")
    print(f"Catalog contains {len(catalog)} unique documented items")


if __name__ == "__main__":
    main()
