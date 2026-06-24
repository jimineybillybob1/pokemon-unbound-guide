from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT_DIR / "data" / "unbound-data.json"


def main() -> int:
    if not DATA_PATH.exists():
        print(f"Missing generated data: {DATA_PATH}")
        return 1

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    counts = data.get("sourceCounts", {})
    errors: list[str] = []
    warnings: list[str] = []

    def check(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    def warn(condition: bool, message: str) -> None:
        if not condition:
            warnings.append(message)

    pokemon = data.get("pokemon", [])
    real_pokemon = [entry for entry in pokemon if not entry.get("isPlaceholder")]
    moves = data.get("moves", [])
    locations = data.get("locations", [])
    items = data.get("items", {})
    frontier = data.get("frontier", {})

    pokemon_constants = [entry.get("constant") for entry in pokemon]
    duplicate_pokemon = sorted({value for value in pokemon_constants if pokemon_constants.count(value) > 1})
    move_constants = [entry.get("constant") for entry in moves]
    duplicate_moves = sorted({value for value in move_constants if move_constants.count(value) > 1})

    check(len(pokemon) >= 900, f"Expected at least 900 Pokemon/form records, found {len(pokemon)}")
    check(len(pokemon) == len(set(pokemon_constants)), f"Duplicate Pokemon constants: {duplicate_pokemon[:10]}")
    check(
        all(entry.get("name") and entry.get("types") and entry.get("bst") for entry in real_pokemon),
        "A real Pokemon/form record is missing name, types, or BST",
    )
    check(counts.get("pokemonWithLearnsets", 0) >= 900, "Too few Pokemon have level-up learnsets")
    check(counts.get("pokemonWithEvolutions", 0) >= 500, "Too few Pokemon have evolution entries")

    check(len(moves) >= 500, f"Expected at least 500 learned move records, found {len(moves)}")
    check(len(moves) == len(set(move_constants)), f"Duplicate move constants: {duplicate_moves[:10]}")
    check(
        all("levelUp" in move.get("learners", {}) and "egg" in move.get("learners", {}) for move in moves),
        "A move record is missing learner groups",
    )

    check(len(locations) >= 50, f"Expected at least 50 wild encounter locations, found {len(locations)}")
    check(all(location.get("methods") for location in locations), "A location has no encounter methods")
    check(counts.get("giftStatic", 0) >= 40, "Gift/static encounter count is unexpectedly low")
    check(counts.get("legendary", 0) >= 60, "Legendary/mythical/Ultra Beast count is unexpectedly low")
    check(counts.get("trades", 0) >= 6, "Trade count is unexpectedly low")
    check(counts.get("swarms", 0) >= 30, "Swarm schedule count is unexpectedly low")

    check(len(items.get("wildHeldItems", [])) >= 900, "Wild held item rows are unexpectedly low")
    check(len(items.get("tmHm", [])) >= 120, "TM/HM rows are unexpectedly low")
    check(len(items.get("megaStones", [])) >= 45, "Mega Stone rows are unexpectedly low")
    check(len(items.get("zCrystals", [])) >= 30, "Z-Crystal rows are unexpectedly low")

    check(len(frontier.get("services", [])) >= 15, "Battle Frontier service count is unexpectedly low")
    check(len(frontier.get("moveTutors", [])) >= 8, "Move tutor count is unexpectedly low")
    check(
        all(tutor.get("moves") for tutor in frontier.get("moveTutors", [])),
        "A Battle Frontier move tutor has no moves",
    )

    unmatched = data.get("warnings", {}).get("unmatchedLocationSpecies", [])
    warn(len(unmatched) <= 100, f"{len(unmatched)} location species names did not match base stats records")
    warn(
        data.get("trainers", {}).get("trainerTeamsAvailable"),
        data.get("trainers", {}).get("gap", "Trainer team availability is unknown"),
    )
    warn(
        data.get("warnings", {}).get("moveMetadata") is None,
        data.get("warnings", {}).get("moveMetadata", ""),
    )

    summary = {
        "counts": counts,
        "warnings": warnings,
        "errors": errors,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
