"""evolution.py のユニットテスト（frontend/src/services/evolution.test.ts と同等）。"""

import pytest

from evolution import (
    BABY_TO_CHILD_SECONDS,
    CHILD_TO_ADULT_SECONDS,
    EGG_HATCH_SECONDS,
    apply_action,
    apply_time_elapsed,
    create_new_pet_data,
    evolve_if_needed,
    pick_adult_species,
    pick_child_species,
)

NOW = 1_800_000_000


def points(**overrides):
    base = {"sea": 0, "land": 0, "magic": 0, "active": 0, "gentle": 0}
    base.update(overrides)
    return base


def pet(**overrides):
    base = {
        "name": "ぷにちゃん",
        "stage": "egg",
        "speciesId": "egg_01",
        "hunger": 5,
        "happiness": 5,
        "poopCount": 0,
        "points": points(),
        "bornAt": NOW,
        "lastUpdatedAt": NOW,
    }
    base.update(overrides)
    return base


def data(pet_overrides=None, encyclopedia=None):
    return {
        "userId": "daughter-01",
        "currentPet": pet(**(pet_overrides or {})),
        "encyclopedia": list(encyclopedia) if encyclopedia is not None else ["egg_01"],
    }


class TestApplyTimeElapsed:
    def test_hunger_decays_every_2_hours(self):
        result = apply_time_elapsed(data({"hunger": 5}), NOW + 2 * 3600)
        assert result["currentPet"]["hunger"] == 4

    def test_hunger_never_below_zero(self):
        result = apply_time_elapsed(data({"hunger": 1}), NOW + 100 * 3600)
        assert result["currentPet"]["hunger"] == 0

    def test_happiness_decays_every_3_hours(self):
        result = apply_time_elapsed(data({"happiness": 5}), NOW + 6 * 3600)
        assert result["currentPet"]["happiness"] == 3

    def test_happiness_never_below_zero(self):
        result = apply_time_elapsed(data({"happiness": 1}), NOW + 100 * 3600)
        assert result["currentPet"]["happiness"] == 0

    def test_poop_increases_every_4_hours(self):
        result = apply_time_elapsed(data({"poopCount": 0}), NOW + 8 * 3600)
        assert result["currentPet"]["poopCount"] == 2

    def test_poop_capped_at_3(self):
        result = apply_time_elapsed(data({"poopCount": 2}), NOW + 100 * 3600)
        assert result["currentPet"]["poopCount"] == 3

    def test_last_updated_at_advances(self):
        result = apply_time_elapsed(data(), NOW + 3600)
        assert result["currentPet"]["lastUpdatedAt"] == NOW + 3600

    def test_now_before_last_updated_is_noop(self):
        before = data({"hunger": 3})
        assert apply_time_elapsed(before, NOW - 10) is before


class TestEggToBaby:
    def test_gentle_3_hatches(self):
        result = evolve_if_needed(pet(points=points(gentle=3)), NOW)
        assert result["stage"] == "baby"
        assert result["speciesId"] == "baby_01"

    def test_10_minutes_hatches(self):
        result = evolve_if_needed(pet(), NOW + EGG_HATCH_SECONDS)
        assert result["stage"] == "baby"
        assert result["speciesId"] == "baby_01"

    def test_no_hatch_without_conditions(self):
        result = evolve_if_needed(pet(points=points(gentle=2)), NOW + EGG_HATCH_SECONDS - 1)
        assert result["stage"] == "egg"


class TestBabyToChild:
    def test_sea_branch(self):
        result = evolve_if_needed(
            pet(stage="baby", speciesId="baby_01", points=points(sea=3, land=1, magic=0)),
            NOW + BABY_TO_CHILD_SECONDS,
        )
        assert result["speciesId"] == "child_sea"

    def test_land_branch(self):
        result = evolve_if_needed(
            pet(stage="baby", speciesId="baby_01", points=points(sea=1, land=4, magic=2)),
            NOW + BABY_TO_CHILD_SECONDS,
        )
        assert result["speciesId"] == "child_land"

    def test_magic_branch(self):
        result = evolve_if_needed(
            pet(stage="baby", speciesId="baby_01", points=points(sea=1, land=2, magic=5)),
            NOW + BABY_TO_CHILD_SECONDS,
        )
        assert result["speciesId"] == "child_magic"

    def test_tie_break_priority(self):
        assert pick_child_species(points(sea=2, land=2, magic=2)) == "child_sea"
        assert pick_child_species(points(sea=0, land=2, magic=2)) == "child_land"
        assert pick_child_species(points()) == "child_sea"

    def test_not_yet_12_hours(self):
        result = evolve_if_needed(
            pet(stage="baby", speciesId="baby_01"),
            NOW + BABY_TO_CHILD_SECONDS - 1,
        )
        assert result["stage"] == "baby"


class TestChildToAdult:
    @pytest.mark.parametrize(
        "child_id,p,expected",
        [
            ("child_sea", points(gentle=4, active=2), "adult_sea_fish"),
            ("child_sea", points(gentle=1, active=3), "adult_sea_shark"),
            ("child_sea", points(gentle=3, active=2), "adult_sea_seal"),
            ("child_land", points(gentle=5, active=3), "adult_land_panda"),
            ("child_land", points(gentle=0, active=2), "adult_land_trex"),
            ("child_land", points(gentle=2, active=2), "adult_land_tricera"),
            ("child_magic", points(gentle=2, active=0), "adult_magic_fairy"),
            ("child_magic", points(gentle=0, active=2), "adult_magic_dragon"),
            ("child_magic", points(gentle=1, active=1), "adult_magic_ghost"),
        ],
    )
    def test_adult_branches(self, child_id, p, expected):
        assert pick_adult_species(child_id, p) == expected

    def test_36_hours_evolves_to_adult(self):
        result = evolve_if_needed(
            pet(stage="child", speciesId="child_sea", points=points(gentle=4, active=0)),
            NOW + CHILD_TO_ADULT_SECONDS,
        )
        assert result["stage"] == "adult"
        assert result["speciesId"] == "adult_sea_fish"

    def test_not_yet_36_hours(self):
        result = evolve_if_needed(
            pet(stage="child", speciesId="child_sea", points=points(gentle=4, active=0)),
            NOW + CHILD_TO_ADULT_SECONDS - 1,
        )
        assert result["stage"] == "child"


class TestApplyAction:
    def test_feed_sea(self):
        result = apply_action(data({"hunger": 3}), "feed_sea", NOW)
        assert result["data"]["currentPet"]["hunger"] == 4
        assert result["data"]["currentPet"]["points"]["sea"] == 1

    def test_feed_land(self):
        result = apply_action(data(), "feed_land", NOW)
        assert result["data"]["currentPet"]["points"]["land"] == 1

    def test_feed_magic(self):
        result = apply_action(data(), "feed_magic", NOW)
        assert result["data"]["currentPet"]["points"]["magic"] == 1

    def test_play(self):
        result = apply_action(data({"happiness": 2}), "play", NOW)
        assert result["data"]["currentPet"]["happiness"] == 3
        assert result["data"]["currentPet"]["points"]["active"] == 1

    def test_pet(self):
        result = apply_action(data({"happiness": 2}), "pet", NOW)
        assert result["data"]["currentPet"]["happiness"] == 3
        assert result["data"]["currentPet"]["points"]["gentle"] == 1

    def test_clean(self):
        result = apply_action(data({"poopCount": 3}), "clean", NOW)
        assert result["data"]["currentPet"]["poopCount"] == 0

    def test_hunger_capped_at_5(self):
        result = apply_action(data({"hunger": 5}), "feed_sea", NOW)
        assert result["data"]["currentPet"]["hunger"] == 5

    def test_pet_three_times_hatches_with_evolved_flag(self):
        current = data()
        evolved = False
        for _ in range(3):
            result = apply_action(current, "pet", NOW)
            current = result["data"]
            evolved = result["evolved"]
        assert current["currentPet"]["stage"] == "baby"
        assert evolved is True

    def test_evolution_registers_encyclopedia(self):
        current = data()
        for _ in range(3):
            current = apply_action(current, "pet", NOW)["data"]
        assert "baby_01" in current["encyclopedia"]

    def test_time_elapsed_applied_on_action(self):
        result = apply_action(data({"hunger": 5}), "clean", NOW + 4 * 3600)
        assert result["data"]["currentPet"]["hunger"] == 3
        assert result["data"]["currentPet"]["poopCount"] == 0

    def test_unknown_action_raises(self):
        with pytest.raises(ValueError):
            apply_action(data(), "dance", NOW)


class TestCreateNewPetData:
    def test_initial_state(self):
        created = create_new_pet_data("daughter-01", NOW)
        assert created["currentPet"]["speciesId"] == "egg_01"
        assert created["currentPet"]["stage"] == "egg"
        assert created["encyclopedia"] == ["egg_01"]
