"""時間経過・進化判定ロジック（純粋関数・副作用なし）。

frontend/src/services/evolution.ts と同一仕様。
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

MAX_HUNGER = 5
MAX_HAPPINESS = 5
MAX_POOP = 3

HUNGER_DECAY_SECONDS = 2 * 60 * 60
HAPPINESS_DECAY_SECONDS = 3 * 60 * 60
POOP_INTERVAL_SECONDS = 4 * 60 * 60

EGG_HATCH_SECONDS = 10 * 60
EGG_HATCH_GENTLE = 3
BABY_TO_CHILD_SECONDS = 12 * 60 * 60
CHILD_TO_ADULT_SECONDS = 36 * 60 * 60

VALID_ACTIONS = ("feed_sea", "feed_land", "feed_magic", "play", "pet", "clean")


def _clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, value))


def create_egg_pet(now: int, name: str = "ぷにちゃん") -> Dict[str, Any]:
    return {
        "name": name,
        "stage": "egg",
        "speciesId": "egg_01",
        "hunger": MAX_HUNGER,
        "happiness": MAX_HAPPINESS,
        "poopCount": 0,
        "points": {"sea": 0, "land": 0, "magic": 0, "active": 0, "gentle": 0},
        "bornAt": now,
        "lastUpdatedAt": now,
    }


def create_new_pet_data(user_id: str, now: int, name: Optional[str] = None) -> Dict[str, Any]:
    return {
        "userId": user_id,
        "currentPet": create_egg_pet(now, name or "ぷにちゃん"),
        "encyclopedia": ["egg_01"],
    }


def reset_pet(data: Dict[str, Any], now: int) -> Dict[str, Any]:
    return {
        **data,
        "currentPet": create_egg_pet(now, data["currentPet"].get("name", "ぷにちゃん")),
    }


def pick_child_species(points: Dict[str, int]) -> str:
    sea, land, magic = points["sea"], points["land"], points["magic"]
    if sea >= land and sea >= magic:
        return "child_sea"
    if land >= magic:
        return "child_land"
    return "child_magic"


def pick_adult_species(child_species_id: str, points: Dict[str, int]) -> str:
    diff = points["gentle"] - points["active"]
    table = {
        "child_sea": ("adult_sea_fish", "adult_sea_shark", "adult_sea_seal"),
        "child_land": ("adult_land_panda", "adult_land_trex", "adult_land_tricera"),
        "child_magic": ("adult_magic_fairy", "adult_magic_dragon", "adult_magic_ghost"),
    }
    gentle_pick, active_pick, balanced_pick = table.get(
        child_species_id, ("adult_magic_ghost", "adult_magic_ghost", "adult_magic_ghost")
    )
    if diff >= 2:
        return gentle_pick
    if diff <= -2:
        return active_pick
    return balanced_pick


def evolve_if_needed(pet: Dict[str, Any], now: int) -> Dict[str, Any]:
    stage = pet["stage"]
    if stage == "egg":
        if pet["points"]["gentle"] >= EGG_HATCH_GENTLE or now - pet["bornAt"] >= EGG_HATCH_SECONDS:
            return {**pet, "stage": "baby", "speciesId": "baby_01"}
        return pet
    if stage == "baby":
        if now - pet["bornAt"] >= BABY_TO_CHILD_SECONDS:
            return {**pet, "stage": "child", "speciesId": pick_child_species(pet["points"])}
        return pet
    if stage == "child":
        if now - pet["bornAt"] >= CHILD_TO_ADULT_SECONDS:
            return {
                **pet,
                "stage": "adult",
                "speciesId": pick_adult_species(pet["speciesId"], pet["points"]),
            }
        return pet
    return pet


def _with_encyclopedia(data: Dict[str, Any], pet: Dict[str, Any]) -> Dict[str, Any]:
    encyclopedia: List[str] = list(data.get("encyclopedia", []))
    if pet["speciesId"] in encyclopedia:
        return {**data, "encyclopedia": encyclopedia}
    return {**data, "encyclopedia": [*encyclopedia, pet["speciesId"]]}


def apply_time_elapsed(data: Dict[str, Any], now: int) -> Dict[str, Any]:
    pet = data["currentPet"]
    if now <= pet["lastUpdatedAt"]:
        return data

    elapsed = now - pet["lastUpdatedAt"]
    hunger_loss = elapsed // HUNGER_DECAY_SECONDS
    happiness_loss = elapsed // HAPPINESS_DECAY_SECONDS
    poop_gain = elapsed // POOP_INTERVAL_SECONDS

    decayed = {
        **pet,
        "hunger": _clamp(pet["hunger"] - hunger_loss, 0, MAX_HUNGER),
        "happiness": _clamp(pet["happiness"] - happiness_loss, 0, MAX_HAPPINESS),
        "poopCount": _clamp(pet["poopCount"] + poop_gain, 0, MAX_POOP),
        "lastUpdatedAt": now,
    }

    evolved = evolve_if_needed(decayed, now)
    return _with_encyclopedia({**data, "currentPet": evolved}, evolved)


def _apply_action_effect(pet: Dict[str, Any], action: str) -> Dict[str, Any]:
    points = pet["points"]

    def with_points(**updates: int) -> Dict[str, int]:
        return {**points, **updates}

    if action == "feed_sea":
        return {**pet, "hunger": _clamp(pet["hunger"] + 1, 0, MAX_HUNGER),
                "points": with_points(sea=points["sea"] + 1)}
    if action == "feed_land":
        return {**pet, "hunger": _clamp(pet["hunger"] + 1, 0, MAX_HUNGER),
                "points": with_points(land=points["land"] + 1)}
    if action == "feed_magic":
        return {**pet, "hunger": _clamp(pet["hunger"] + 1, 0, MAX_HUNGER),
                "points": with_points(magic=points["magic"] + 1)}
    if action == "play":
        return {**pet, "happiness": _clamp(pet["happiness"] + 1, 0, MAX_HAPPINESS),
                "points": with_points(active=points["active"] + 1)}
    if action == "pet":
        return {**pet, "happiness": _clamp(pet["happiness"] + 1, 0, MAX_HAPPINESS),
                "points": with_points(gentle=points["gentle"] + 1)}
    if action == "clean":
        return {**pet, "poopCount": 0}
    raise ValueError(f"Unknown action: {action}")


def apply_action(data: Dict[str, Any], action: str, now: int) -> Dict[str, Any]:
    if action not in VALID_ACTIONS:
        raise ValueError(f"Unknown action: {action}")
    previous_species_id = data["currentPet"]["speciesId"]
    elapsed = apply_time_elapsed(data, now)
    effected = _apply_action_effect(elapsed["currentPet"], action)
    evolved = evolve_if_needed(effected, now)
    next_data = _with_encyclopedia({**elapsed, "currentPet": evolved}, evolved)
    return {
        "data": next_data,
        "evolved": evolved["speciesId"] != previous_species_id,
        "previousSpeciesId": previous_species_id,
    }
