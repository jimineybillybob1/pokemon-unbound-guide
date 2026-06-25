"""
Fetch Pokemon Unbound source data directly from the Dynamic-Pokemon-Expansion repo.

This replaces local documentation files with authoritative data extracted from:
- Skeli789/Complete-Fire-Red-Upgrade (framework)
- Skeli789/Dynamic-Pokemon-Expansion/Unbound (official Unbound ROM hack)

This approach follows ydarissep/Unbound-Pokedex's proven methodology.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import requests

ROOT_DIR = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT_DIR / "documentation" / "fetched-from-repo"

# Repository sources
CFRU_REPO = "https://raw.githubusercontent.com/Skeli789/Complete-Fire-Red-Upgrade/master"
DPE_UNBOUND_REPO = "https://raw.githubusercontent.com/Skeli789/Dynamic-Pokemon-Expansion/Unbound"

# File paths within repos
FILES = {
    "species": f"{DPE_UNBOUND_REPO}/include/species.h",
    "base_stats": f"{DPE_UNBOUND_REPO}/src/Base_Stats.c",
    "learnsets": f"{DPE_UNBOUND_REPO}/src/Learnsets.c",
    "egg_moves": f"{DPE_UNBOUND_REPO}/src/Egg_Moves.c",
    "evolution": f"{DPE_UNBOUND_REPO}/src/Evolution%20Table.c",
    "tm_tutor": f"{DPE_UNBOUND_REPO}/src/TM_Tutor_Tables.c",
    "sprite_table": f"{DPE_UNBOUND_REPO}/src/Front_Pic_Table.c",
    "abilities": f"{CFRU_REPO}/include/constants/abilities.h",
    "moves": f"{CFRU_REPO}/src/Tables/battle_moves.c",
    "move_descriptions": f"{CFRU_REPO}/strings/attack_descriptions.string",
    "move_names": f"{CFRU_REPO}/strings/attack_name_table.string",
    "ability_names": f"{CFRU_REPO}/strings/ability_name_table.string",
    "ability_descriptions": f"{CFRU_REPO}/strings/ability_descriptions.string",
}

DUPLICATE_ABILITIES_URL = "https://raw.githubusercontent.com/ydarissep/Unbound-Pokedex/main/src/abilities/duplicate_abilities.json"
TYPE_CHART_URL = "https://raw.githubusercontent.com/ydarissep/Unbound-Pokedex/main/src/typeChart.json"
ENCOUNTERS_URL = "https://raw.githubusercontent.com/ydarissep/Unbound-Pokedex/main/src/locations/encounters.json"
TUTOR_FLAGS_URL = "https://raw.githubusercontent.com/ydarissep/Unbound-Pokedex/main/src/moves/tutor_flags.json"


def fetch_url(url: str, timeout: int = 10) -> str:
    """Fetch content from a URL with error handling."""
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"[fail] Failed to fetch {url}: {e}")
        return ""


def save_file(path: Path, content: str) -> None:
    """Save content to a file, creating parent directories as needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"[ok] Saved {path.relative_to(ROOT_DIR)}")


def fetch_all_sources() -> dict[str, str]:
    """Fetch all source files from repositories."""
    print("Fetching Unbound source files from repositories...\n")
    sources = {}

    for name, url in FILES.items():
        print(f"Fetching {name}...", end=" ", flush=True)
        content = fetch_url(url)
        if content:
            sources[name] = content
            print("[ok]")
        else:
            print("[fail]")

    # Fetch supplementary data from Unbound-Pokedex.
    supplementary_sources = {
        "duplicate_abilities": (DUPLICATE_ABILITIES_URL, "duplicate_abilities mapping"),
        "type_chart": (TYPE_CHART_URL, "type chart"),
        "encounters": (ENCOUNTERS_URL, "wild encounter data"),
        "tutor_flags": (TUTOR_FLAGS_URL, "tutor flag data"),
    }
    for name, (url, label) in supplementary_sources.items():
        print(f"Fetching {label}...", end=" ", flush=True)
        content = fetch_url(url)
        if content:
            sources[name] = content
            print("[ok]")
        else:
            print("[fail]")

    return sources


def extract_species_constants(text: str) -> dict[str, int]:
    """Extract SPECIES_* constants and their IDs."""
    constants = {}
    for match in re.finditer(r"#define\s+(SPECIES_[A-Z0-9_]+)\s+(\d+)", text):
        name, idx = match.groups()
        if name != "SPECIES_NONE":
            constants[name] = int(idx)
    return constants


def extract_ability_constants(text: str) -> dict[str, int]:
    """Extract ABILITY_* constants and their IDs."""
    constants = {}
    for match in re.finditer(r"#define\s+(ABILITY_[A-Z0-9_]+)\s+(\d+)", text):
        name, idx = match.groups()
        if name != "ABILITY_NONE":
            constants[name] = int(idx)
    return constants


def extract_move_constants(text: str) -> dict[str, int]:
    """Extract MOVE_* constants and their IDs."""
    constants = {}
    for match in re.finditer(r"#define\s+(MOVE_[A-Z0-9_]+)\s+(\d+)", text):
        name, idx = match.groups()
        if name != "MOVE_NONE":
            constants[name] = int(idx)
    return constants


def index_sources(sources: dict[str, str]) -> dict[str, Any]:
    """Create index of constants and metadata from source files."""
    index = {
        "species": extract_species_constants(sources.get("species", "")),
        "abilities": extract_ability_constants(sources.get("abilities", "")),
        "moves": extract_move_constants(sources.get("moves", "")),
        "fetched_at": None,  # Will be set by build script
    }
    return index


def main() -> None:
    """Fetch all sources and save them locally."""
    sources = fetch_all_sources()

    if not sources:
        print("\n[fail] No sources were fetched. Check your internet connection.")
        return

    print(f"\n[ok] Fetched {len(sources)} source files")

    # Save individual source files
    for name, content in sources.items():
        if name in ("duplicate_abilities", "type_chart", "encounters", "tutor_flags"):
            ext = "json"
        else:
            ext = "txt"
        save_file(DOCS_DIR / f"{name}.{ext}", content)

    # Create and save index
    index = index_sources(sources)
    save_file(
        DOCS_DIR / "index.json",
        json.dumps(index, indent=2, ensure_ascii=False) + "\n",
    )

    print(f"\n[ok] All sources saved to {DOCS_DIR.relative_to(ROOT_DIR)}/")
    print("  Use these files for offline builds or as reference.")


if __name__ == "__main__":
    main()
