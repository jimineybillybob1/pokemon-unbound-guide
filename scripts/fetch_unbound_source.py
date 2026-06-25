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
from html import unescape
from pathlib import Path
from typing import Any

import requests

ROOT_DIR = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT_DIR / "documentation" / "fetched-from-repo"
GITHUB_API_ROOT = "https://api.github.com/repos/Skeli789/Dynamic-Pokemon-Expansion/contents"

# Repository sources
CFRU_REPO = "https://raw.githubusercontent.com/Skeli789/Complete-Fire-Red-Upgrade/master"
DPE_UNBOUND_REPO = "https://raw.githubusercontent.com/Skeli789/Dynamic-Pokemon-Expansion/Unbound"
VANILLA_FIRERED_REPO = "https://raw.githubusercontent.com/ProfLeonDias/pokefirered/decapitalization"

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
    "vanilla_move_descriptions": f"{VANILLA_FIRERED_REPO}/src/move_descriptions.c",
    "ability_names": f"{CFRU_REPO}/strings/ability_name_table.string",
    "ability_descriptions": f"{CFRU_REPO}/strings/ability_descriptions.string",
}

DUPLICATE_ABILITIES_URL = "https://raw.githubusercontent.com/ydarissep/Unbound-Pokedex/main/src/abilities/duplicate_abilities.json"
TYPE_CHART_URL = "https://raw.githubusercontent.com/ydarissep/Unbound-Pokedex/main/src/typeChart.json"
ENCOUNTERS_URL = "https://raw.githubusercontent.com/ydarissep/Unbound-Pokedex/main/src/locations/encounters.json"
TUTOR_FLAGS_URL = "https://raw.githubusercontent.com/ydarissep/Unbound-Pokedex/main/src/moves/tutor_flags.json"
UNBOUND_WIKI_API = "https://unboundwiki.com/wp-json/wp/v2/wiki"


def fetch_url(url: str, timeout: int = 10) -> str:
    """Fetch content from a URL with error handling."""
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"[fail] Failed to fetch {url}: {e}")
        return ""


def fetch_json(url: str, timeout: int = 10) -> Any:
    """Fetch JSON from a URL with error handling."""
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[fail] Failed to fetch {url}: {e}")
        return None


def save_file(path: Path, content: str) -> None:
    """Save content to a file, creating parent directories as needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"[ok] Saved {path.relative_to(ROOT_DIR)}")


def strip_html_tags(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html)


def html_to_lines(html: str) -> list[str]:
    if not html:
        return []
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    text = re.sub(r"</(p|li|tr|h2|h3|h4|div|table|section)>", "\n", text, flags=re.IGNORECASE)
    text = unescape(strip_html_tags(text)).replace("\xa0", " ")
    seen: set[str] = set()
    lines: list[str] = []
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip(" \t-:|")
        if not line:
            continue
        if line in {"Back to", "Back to:", "(Click for full-size)", "Click for full-size"}:
            continue
        if line in seen:
            continue
        seen.add(line)
        lines.append(line)
    return lines


def parse_unboundwiki_index_rows(index_html: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    row_pattern = re.compile(
        r"<tr>\s*<td><strong>(.*?)</strong></td>\s*<td>(.*?)</td>\s*<td>.*?</td>\s*</tr>",
        re.IGNORECASE | re.DOTALL,
    )
    link_pattern = re.compile(
        r'href="https://unboundwiki\.com/locations/([^"/]+)/"',
        re.IGNORECASE,
    )
    for match in row_pattern.finditer(index_html):
        name_cell, linked_cell = match.groups()
        link_match = link_pattern.search(name_cell)
        slug = clean(link_match.group(1)) if link_match else ""
        name = clean(unescape(strip_html_tags(name_cell)))
        linked_locations = html_to_lines(linked_cell)
        if not name:
            continue
        rows.append(
            {
                "name": name,
                "slug": slug,
                "pageUrl": f"https://unboundwiki.com/locations/{slug}/" if slug else "",
                "linkedLocations": linked_locations,
            }
        )
    return rows


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\xa0", " ")).strip()


def extract_html_section_lines(content_html: str, headings: tuple[str, ...]) -> list[str]:
    heading_pattern = re.compile(r"<h([23])[^>]*>(.*?)</h\1>", re.IGNORECASE | re.DOTALL)
    heading_matches = list(heading_pattern.finditer(content_html))
    extracted: list[str] = []
    for index, match in enumerate(heading_matches):
        heading_text = clean(unescape(strip_html_tags(match.group(2)))).lower()
        if not any(token in heading_text for token in headings):
            continue
        start = match.end()
        end = heading_matches[index + 1].start() if index + 1 < len(heading_matches) else len(content_html)
        extracted.extend(html_to_lines(content_html[start:end]))
    return extracted


def extract_html_sections(content_html: str, headings: tuple[str, ...]) -> list[str]:
    heading_pattern = re.compile(r"<h([23])[^>]*>(.*?)</h\1>", re.IGNORECASE | re.DOTALL)
    heading_matches = list(heading_pattern.finditer(content_html))
    sections: list[str] = []
    for index, match in enumerate(heading_matches):
        heading_text = clean(unescape(strip_html_tags(match.group(2)))).lower()
        if not any(token in heading_text for token in headings):
            continue
        start = match.end()
        end = heading_matches[index + 1].start() if index + 1 < len(heading_matches) else len(content_html)
        sections.append(content_html[start:end])
    return sections


def parse_html_table_rows(section_html: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    table_pattern = re.compile(r"<table\b[^>]*>(.*?)</table>", re.IGNORECASE | re.DOTALL)
    row_pattern = re.compile(r"<tr\b[^>]*>(.*?)</tr>", re.IGNORECASE | re.DOTALL)
    cell_pattern = re.compile(r"<t[hd]\b[^>]*>(.*?)</t[hd]>", re.IGNORECASE | re.DOTALL)

    auto_ref = 1
    for table_html in table_pattern.findall(section_html):
        for row_html in row_pattern.findall(table_html):
            cells = []
            for cell_html in cell_pattern.findall(row_html):
                value = clean(unescape(strip_html_tags(cell_html)))
                if value:
                    cells.append(value)
            if not cells:
                continue
            lowered = [cell.lower() for cell in cells]
            if lowered == ["item", "details", "image"] or lowered == ["item", "location", "image"]:
                continue
            if len(cells) == 1 and cells[0].lower() == "image":
                continue
            first = cells[0]
            marker_match = re.match(r"^#?\s*(\d+)\.?$", first)
            marker = marker_match.group(1) if marker_match else str(auto_ref)
            auto_ref += 1
            rows.append({"ref": marker, "columns": cells})
    return rows


def parse_section_reference_rows(content_html: str, headings: tuple[str, ...]) -> list[dict[str, object]]:
    structured: list[dict[str, object]] = []
    for section_html in extract_html_sections(content_html, headings):
        structured.extend(parse_html_table_rows(section_html))
    if not structured:
        fallback_lines = extract_html_section_lines(content_html, headings)
        structured = [{"ref": "", "columns": [line]} for line in fallback_lines]
    return structured


def extract_unboundwiki_map_url(content_html: str, slug: str) -> str:
    fullsize_match = re.search(r'href="([^"]*map[^"]*fullsize[^"]*)"', content_html, flags=re.IGNORECASE)
    if fullsize_match:
        return clean(unescape(fullsize_match.group(1)))
    slug_pattern = re.escape(slug)
    image_match = re.search(
        rf'src="([^"]*/locations/{slug_pattern}/[^"]*map[^"]*\.(?:jpg|jpeg|png|webp))"',
        content_html,
        flags=re.IGNORECASE,
    )
    if image_match:
        return clean(unescape(image_match.group(1)))
    return ""


def fetch_unboundwiki_locations() -> list[dict[str, object]]:
    index_posts = fetch_json(f"{UNBOUND_WIKI_API}?slug=locations", timeout=20)
    if not isinstance(index_posts, list) or not index_posts:
        print("[fail] Failed to fetch UnboundWiki location index")
        return []

    index_html = (
        index_posts[0].get("content", {}).get("rendered", "")
        if isinstance(index_posts[0], dict)
        else ""
    )
    if not index_html:
        print("[fail] UnboundWiki location index content was empty")
        return []

    index_rows = parse_unboundwiki_index_rows(index_html)
    if not index_rows:
        print("[fail] Could not parse UnboundWiki location rows")
        return []

    output: list[dict[str, object]] = []
    for row in index_rows:
        slug = clean(row.get("slug"))
        linked_locations = row.get("linkedLocations", [])
        record: dict[str, object] = {
            "name": row.get("name", ""),
            "slug": slug,
            "pageUrl": row.get("pageUrl", ""),
            "mapUrl": "",
            "linkedLocations": linked_locations if isinstance(linked_locations, list) else [],
            "exits": linked_locations if isinstance(linked_locations, list) else [],
            "pointsOfInterest": [],
            "itemLocations": [],
            "exitsRows": [],
            "pointsOfInterestRows": [],
            "itemLocationRows": [],
            "source": "UnboundWiki",
        }
        if slug:
            posts = fetch_json(f"{UNBOUND_WIKI_API}?slug={slug}", timeout=20)
            if isinstance(posts, list) and posts and isinstance(posts[0], dict):
                post = posts[0]
                content_html = post.get("content", {}).get("rendered", "")
                title_rendered = post.get("title", {}).get("rendered", "")
                if title_rendered:
                    record["name"] = clean(unescape(strip_html_tags(title_rendered)))
                if post.get("link"):
                    record["pageUrl"] = clean(post["link"])
                if content_html:
                    record["mapUrl"] = extract_unboundwiki_map_url(content_html, slug)
                    record["itemLocationRows"] = parse_section_reference_rows(content_html, ("item locations",))
                    record["pointsOfInterestRows"] = parse_section_reference_rows(
                        content_html, ("notable locations", "points of interest")
                    )
                    exits_rows = parse_section_reference_rows(content_html, ("exits",))
                    if exits_rows:
                        record["exitsRows"] = exits_rows

                    # Flat strings are still included for backward compatibility.
                    record["itemLocations"] = [row["columns"][-1] for row in record.get("itemLocationRows", []) if row.get("columns")]
                    record["pointsOfInterest"] = [
                        row["columns"][-1] for row in record.get("pointsOfInterestRows", []) if row.get("columns")
                    ]
                    if record.get("exitsRows"):
                        record["exits"] = [row["columns"][-1] for row in record["exitsRows"] if row.get("columns")]
        output.append(record)
    return output


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


def fetch_compatibility_directory(directory: str) -> dict[str, str]:
    """Fetch all files from a compatibility directory in the Unbound branch."""
    url = f"{GITHUB_API_ROOT}/{directory}?ref=Unbound"
    listing = fetch_json(url)
    if not isinstance(listing, list):
        return {}

    files: dict[str, str] = {}
    for entry in listing:
        if not isinstance(entry, dict) or entry.get("type") != "file":
            continue
        download_url = entry.get("download_url")
        name = entry.get("name")
        if not download_url or not name:
            continue
        content = fetch_url(download_url)
        if content:
            files[f"{directory}/{name}"] = content
    return files


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

    print("Fetching UnboundWiki location metadata...", end=" ", flush=True)
    wiki_locations = fetch_unboundwiki_locations()
    if wiki_locations:
        save_file(DOCS_DIR / "unboundwiki_locations.json", json.dumps(wiki_locations, indent=2, ensure_ascii=False) + "\n")
        print(f"[ok] ({len(wiki_locations)})")
    else:
        print("[fail]")

    compatibility_dirs = {
        "src/tm_compatibility": "tm_compatibility",
        "src/tutor_compatibility": "tutor_compatibility",
    }
    for repo_dir, local_dir in compatibility_dirs.items():
        print(f"Fetching {local_dir} files...", end=" ", flush=True)
        files = fetch_compatibility_directory(repo_dir)
        if files:
            print(f"[ok] ({len(files)})")
            for relative_name, content in files.items():
                save_file(DOCS_DIR / relative_name.removeprefix("src/"), content)
        else:
            print("[fail]")

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
