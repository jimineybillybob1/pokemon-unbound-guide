"""
Build Unbound guide data using fetched ROM source files.

This module provides functions to parse Unbound source files fetched from:
- Skeli789/Dynamic-Pokemon-Expansion/Unbound (base game data)
- Skeli789/Complete-Fire-Red-Upgrade (framework/utilities)
- ydarissep/Unbound-Pokedex (ability mappings, type chart)

Integrates with build_data.py for seamless local/fetched source switching.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


def read_text(path: Path) -> str:
    """Read text file with error handling."""
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def parse_species_from_source(text: str) -> dict[str, dict]:
    """
    Extract species constants and names from species.h.
    
    Format:
        #define SPECIES_PIKACHU 25
    """
    species = {}
    for match in re.finditer(r"#define\s+(SPECIES_[A-Z0-9_]+)\s+(\d+)", text):
        constant = match.group(1)
        species_id = int(match.group(2))
        if constant != "SPECIES_NONE":
            species[constant] = {"constant": constant, "id": species_id}
    return species


def parse_base_stats_from_source(text: str) -> dict[str, dict]:
    """
    Extract base stats from Base_Stats.c.
    
    Format:
        [SPECIES_PIKACHU] = {
            .baseHP = 35,
            .baseAttack = 55,
            ...
        }
    """
    stats = {}
    field_re = re.compile(r"\.(\w+)\s*=\s*([^,\n]+),")
    markers = list(re.finditer(r"\[SPECIES_([A-Z0-9_]+)\]\s*=", text))

    for index, match in enumerate(markers):
        species_id = match.group(1)
        if species_id == "NONE":
            continue

        constant = f"SPECIES_{species_id}"
        start = match.end()
        end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
        fields = {
            field: value.strip()
            for field, value in field_re.findall(text[start:end])
        }

        if not fields:
            continue

        def parse_int(value: str) -> int:
            match = re.search(r"-?\d+", value)
            return int(match.group(0)) if match else 0

        stats[constant] = {
            "constant": constant,
            "baseHP": parse_int(fields.get("baseHP", "0")),
            "baseAttack": parse_int(fields.get("baseAttack", "0")),
            "baseDefense": parse_int(fields.get("baseDefense", "0")),
            "baseSpAttack": parse_int(fields.get("baseSpAttack", "0")),
            "baseSpDefense": parse_int(fields.get("baseSpDefense", "0")),
            "baseSpeed": parse_int(fields.get("baseSpeed", "0")),
            "type1": fields.get("type1", "").replace('"', "").strip(),
            "type2": fields.get("type2", "").replace('"', "").strip(),
            "ability1": fields.get("ability1", "").strip(),
            "ability2": fields.get("ability2", "").strip(),
            "hiddenAbility": fields.get("hiddenAbility", "").strip(),
            "catchRate": parse_int(fields.get("catchRate", "0")),
            "expYield": parse_int(fields.get("expYield", "0")),
            "growthRate": fields.get("growthRate", "").strip(),
            "eggGroup1": fields.get("eggGroup1", "").strip(),
            "eggGroup2": fields.get("eggGroup2", "").strip(),
            "item1": fields.get("item1", "").strip(),
            "item2": fields.get("item2", "").strip(),
        }

    return stats


def parse_moves_from_source(text: str) -> dict[str, dict]:
    """
    Extract move constants and metadata from battle_moves.c.
    
    Format:
        [MOVE_TACKLE] = {
            .power = 40,
            .type = TYPE_NORMAL,
            ...
        }
    """
    moves = {}
    field_re = re.compile(r"\.(\w+)\s*=\s*([^,\n]+),")
    markers = list(re.finditer(r"\[MOVE_([A-Z0-9_]+)\]\s*=", text))

    for index, match in enumerate(markers):
        move_id = match.group(1)
        if move_id == "NONE":
            continue

        constant = f"MOVE_{move_id}"
        start = match.end()
        end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
        fields = {
            field: value.strip()
            for field, value in field_re.findall(text[start:end])
        }

        if not fields:
            continue

        def parse_int(value: str) -> int:
            match = re.search(r"-?\d+", value)
            return int(match.group(0)) if match else 0

        moves[constant] = {
            "constant": constant,
            "power": parse_int(fields.get("power", "0")),
            "type": fields.get("type", "").strip(),
            "accuracy": parse_int(fields.get("accuracy", "100")),
            "pp": parse_int(fields.get("pp", "0")),
            "category": fields.get("category", "").strip(),
            "priority": parse_int(fields.get("priority", "0")),
        }

    return moves


def parse_abilities_from_source(text: str) -> dict[str, dict]:
    """
    Extract ability constants from abilities.h.
    
    Format:
        #define ABILITY_STATIC 9
    """
    abilities = {}
    for match in re.finditer(r"#define\s+(ABILITY_[A-Z0-9_]+)\s+(\d+)", text):
        constant = match.group(1)
        ability_id = int(match.group(2))
        if constant != "ABILITY_NONE":
            abilities[constant] = {"constant": constant, "id": ability_id}
    return abilities


def parse_learnsets_from_source(text: str) -> dict[str, list[dict]]:
    """
    Extract level-up learnsets from Learnsets.c.
    
    Format:
        static const struct LevelUpMove sPikachuLevelUpLearnset[] = {
            LEVEL_UP_MOVE(1, MOVE_THUNDERBOLT),
            ...
        };
    """
    learnsets = {}
    table_re = re.compile(
        r"static const struct LevelUpMove\s+(s\w+LevelUpLearnset)\[\]\s*=\s*\{(.*?)\n\};",
        re.S,
    )
    move_re = re.compile(r"LEVEL_UP_MOVE\(\s*(\d+)\s*,\s*(MOVE_[A-Z0-9_]+)\s*\)")
    mapping_re = re.compile(
        r"\[SPECIES_([A-Z0-9_]+)\]\s*=\s*(s\w+LevelUpLearnset|sEmptyMoveset),"
    )

    tables = {
        name: [
            {"level": int(level), "moveConstant": move_constant}
            for level, move_constant in move_re.findall(body)
        ]
        for name, body in table_re.findall(text)
    }

    for species_id, table_name in mapping_re.findall(text):
        constant = f"SPECIES_{species_id}"
        learnsets[constant] = tables.get(table_name, [])

    return learnsets


def parse_egg_moves_from_source(text: str) -> dict[str, list[str]]:
    """
    Extract egg moves from Egg_Moves.c.
    
    Format:
        egg_moves(PIKACHU, MOVE_THUNDER, MOVE_THUNDERBOLT)
    """
    egg_moves = {}
    for match in re.finditer(r"egg_moves\(\s*([A-Z0-9_]+)\s*,(.*?)\)", text, re.S):
        species = f"SPECIES_{match.group(1)}"
        moves = re.findall(r"MOVE_[A-Z0-9_]+", match.group(2))
        egg_moves[species] = moves
    return egg_moves


def parse_evolution_from_source(text: str) -> dict[str, list[dict]]:
    """
    Extract evolution data from Evolution Table.c.
    
    Format:
        [SPECIES_CHARMANDER] = {
            {EVO_LEVEL, 16, SPECIES_CHARMELEON},
            ...
        }
    """
    evolutions = {}
    markers = list(re.finditer(r"\[SPECIES_([A-Z0-9_]+)\]\s*=", text))

    for index, marker in enumerate(markers):
        species = f"SPECIES_{marker.group(1)}"
        start = marker.end()
        end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
        chunk = text[start:end]

        entries = []
        # Simple regex to find evolution entries
        for evo_match in re.finditer(
            r"\{(EVO_[A-Z0-9_]+),\s*([^}]*?)(SPECIES_[A-Z0-9_]+)([^}]*?)\}", chunk
        ):
            method = evo_match.group(1)
            target = evo_match.group(3)
            if target:
                entries.append({"method": method, "target": target})

        if entries:
            evolutions[species] = entries

    return evolutions


def load_duplicate_abilities(path: Path) -> dict[str, dict]:
    """Load ability duplicate mappings from ydarissep's JSON."""
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def load_type_chart(path: Path) -> dict[str, dict]:
    """Load type effectiveness chart from ydarissep's JSON."""
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def parse_all_sources(fetched_dir: Path) -> dict[str, Any]:
    """Parse all fetched source files and return structured data."""
    print("Parsing fetched Unbound source files...\n")

    species_text = read_text(fetched_dir / "species.txt")
    base_stats_text = read_text(fetched_dir / "base_stats.txt")
    moves_text = read_text(fetched_dir / "moves.txt")
    abilities_text = read_text(fetched_dir / "abilities.txt")
    learnsets_text = read_text(fetched_dir / "learnsets.txt")
    egg_moves_text = read_text(fetched_dir / "egg_moves.txt")
    evolution_text = read_text(fetched_dir / "evolution.txt")

    parsed = {
        "species": parse_species_from_source(species_text),
        "baseStats": parse_base_stats_from_source(base_stats_text),
        "moves": parse_moves_from_source(moves_text),
        "abilities": parse_abilities_from_source(abilities_text),
        "learnsets": parse_learnsets_from_source(learnsets_text),
        "eggMoves": parse_egg_moves_from_source(egg_moves_text),
        "evolutions": parse_evolution_from_source(evolution_text),
        "duplicateAbilities": load_duplicate_abilities(
            fetched_dir / "duplicate_abilities.json"
        ),
        "typeChart": load_type_chart(fetched_dir / "type_chart.json"),
    }

    print(f"✓ Parsed {len(parsed['species'])} species")
    print(f"✓ Parsed {len(parsed['baseStats'])} base stat blocks")
    print(f"✓ Parsed {len(parsed['moves'])} moves")
    print(f"✓ Parsed {len(parsed['abilities'])} abilities")
    print(f"✓ Parsed {len(parsed['learnsets'])} learnsets")
    print(f"✓ Parsed {len(parsed['eggMoves'])} egg move sets")
    print(f"✓ Parsed {len(parsed['evolutions'])} evolution chains")

    return parsed
