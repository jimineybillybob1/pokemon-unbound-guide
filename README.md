# Pokemon Unbound Field Guide

A local static HTML guide generated from the authoritative Pokemon Unbound ROM hack sources.

**Live guide:** https://jimineybillybob1.github.io/pokemon-unbound-guide/

Open the guide from the project root with a local static server:

```powershell
& 'C:\Users\james\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 8765 --bind 127.0.0.1
```

Then browse to `http://127.0.0.1:8765/`.

## Build

### Option 1: Fetch from Official Repositories (Recommended)

This fetches the latest authoritative core source data directly from the Unbound ROM hack sources:

```powershell
# Fetch source files from GitHub repositories
& 'C:\Users\james\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\fetch_unbound_source.py

# Build guide data using fetched sources
& 'C:\Users\james\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_data.py
```

**Advantages:**
- Always uses latest official Unbound ROM hack data
- Direct from `Skeli789/Dynamic-Pokemon-Expansion/Unbound` (authoritative source)
- Includes supplementary data from `ydarissep/Unbound-Pokedex`
- Pulls refined Unbound-Pokedex support datasets such as wild encounters and tutor flags

**Current limitation:** the fetched source bundle covers the ROM/CFRU text sources and Unbound-Pokedex JSON helpers, but the build still relies on the local Unbound Excel workbooks for frontier services, trades, swarms, item tables, and other workbook-derived sections.

### Option 2: Build from Local Documentation Files

If you have the official Pokemon Unbound documentation files, keep them in `documentation/` and run:

```powershell
& 'C:\Users\james\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_data.py
```

**Documentation files required:**
- `Base_Stats.txt` — base stats, types, abilities, held items
- `Evolution Table.txt` — evolution edges and methods
- `Learnsets.txt` — level-up move learnsets
- `Egg_Moves.txt` — egg move lists
- `Pokemon Unbound Location Guide v*.xlsx` — wild encounters, trades, gift/static encounters
- `Pokemon Unbound Frontier Documentation.xlsx` — Battle Frontier tutors and services

The raw `documentation/` folder is intentionally ignored by git.

### Validate Parsed Data

```powershell
& 'C:\Users\james\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\validate_data.py
```

## Data Sources

### Primary Sources (ROM Hack)

The guide uses data from **two authoritative repositories:**

1. **`Skeli789/Dynamic-Pokemon-Expansion/Unbound`** — Official Unbound ROM hack
   - Species constants and IDs
   - Base stats, types, abilities, held items
   - Level-up learnsets
   - Egg moves
   - Evolution chains
   - TM/HM learnable moves
   - Move tutors
   - Sprite and form tables

2. **`Skeli789/Complete-Fire-Red-Upgrade/master`** — CFRU framework
   - Move definitions (power, accuracy, PP, type, category, priority)
   - Ability definitions
   - Move and ability descriptions
   - Move tutor availability

### Supplementary Sources

- **`ydarissep/Unbound-Pokedex`**
  - `duplicate_abilities.json` — Ability variations across Pokémon forms
  - `typeChart.json` — Type effectiveness data
  - `encounters.json` — Structured wild encounter tables used as the preferred wild-location reference
  - `tutor_flags.json` — Tutor-group metadata for move compatibility checks

## Architecture

```
scripts/
  fetch_unbound_source.py    Fetch latest data from GitHub repositories
  parse_rom_source.py        Parse fetched ROM source files
  build_data.py              Main build script (works with both local and fetched sources)
  validate_data.py           Validate parsed data for consistency

data/
  unbound-data.json          Generated guide data (JSON)
  unbound-data.js            Generated guide data (JavaScript bundle)

documentation/
  fetched-from-repo/         Auto-populated by fetch_unbound_source.py
    species.txt
    base_stats.txt
    learnsets.txt
    egg_moves.txt
    evolution.txt
    tm_tutor.txt
    sprite_table.txt
    abilities.txt
    moves.txt
    move_descriptions.txt
    move_names.txt
    ability_names.txt
    ability_descriptions.txt
    duplicate_abilities.json
    type_chart.json
    encounters.json
    tutor_flags.json
    index.json
```

## Visual Assets

- `assets/fonts/pokemon-gb.ttf` — Pokemon GB-style UI font
- `assets/pokemon/` — Pokémon sprites (from PokeSprite assets)
- `assets/items/` — Item, TM, Mega Stone, and Z-Crystal icons

The build script resolves sprite and icon paths automatically. Run `validate_data.py` to check that all referenced assets exist.

## Workflow

### To update the guide with latest Unbound data:

1. **Fetch latest source files** (runs once or periodically):
   ```powershell
   python scripts\fetch_unbound_source.py
   ```

2. **Rebuild guide data**:
   ```powershell
   python scripts\build_data.py
   ```

3. **Validate for consistency**:
   ```powershell
   python scripts\validate_data.py
   ```

4. **Commit the changes**:
   ```powershell
   git add data/unbound-data.* && git commit -m "Update guide data"
   ```

The `documentation/fetched-from-repo/` directory is ignored by git, so only the built `data/unbound-data.*` files are committed.

## Enable Encrypted Cloud Sync

The guide now includes a **Save & Sync** tab. Export and import always work locally. Optional cloud sync uses the
Worker in `sync-worker/`, stores only browser-encrypted save data, and treats the UUID as the private recovery key.
Losing the UUID means losing access to that cloud save. Cloud saves expire after 400 days without a new upload.

Each device tracks a local revision and the last encrypted cloud revision it saw. The guide checks freshness when it
opens, returns to the foreground, or is checked manually. It reports **in sync**, **this device is newer**,
**cloud save is newer**, or **changes on both copies**. A conflict never overwrites automatically: the user chooses
which copy to keep, the current local save is backed up, and the Worker retains up to eight encrypted cloud revisions.
Up to five replacement-time backups are also retained locally in the browser.

One-time Cloudflare setup:

1. Create a [Cloudflare account](https://dash.cloudflare.com/) and enable a `workers.dev` subdomain if prompted.
2. In Cloudflare, create a Workers KV namespace named `unbound-field-guide-saves` and copy its namespace ID.
3. Create a Cloudflare API token using the **Edit Cloudflare Workers** template. It needs permission to deploy
   Workers and edit Workers KV.
4. Copy the Cloudflare account ID from the dashboard.
5. In the GitHub repository, open **Settings > Secrets and variables > Actions** and add:
   - Secret `CLOUDFLARE_API_TOKEN`
   - Secret `CLOUDFLARE_ACCOUNT_ID`
   - Variable `CLOUDFLARE_KV_NAMESPACE_ID`
6. Run the **Deploy sync Worker** workflow from the GitHub Actions tab.
7. Copy the deployed Worker URL, such as
   `https://unbound-field-guide-sync.<your-subdomain>.workers.dev`.
8. Choose one of these ways to expose the endpoint to the site:
   - **Recommended:** switch GitHub Pages to **GitHub Actions** and set the repository variable
     `UNBOUND_SYNC_ENDPOINT`, then run the **Deploy GitHub Pages** workflow.
   - **Simple/manual:** edit `sync-config.js` and set `window.UNBOUND_SYNC_ENDPOINT` to the Worker URL.

Relevant Cloudflare documentation:

- [Workers KV getting started](https://developers.cloudflare.com/kv/get-started/)
- [Deploy Workers with GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)

## Known Limitations

- **Trainer teams** — Not included in the guide build
- **Move/ability metadata** — Depends on fetched-from-repo CFRU files being present; run `scripts\fetch_unbound_source.py` before rebuilding if you want full move and ability detail coverage
- **Maps** — Map data not yet included

## Data Quality Notes

### Move & Ability Descriptions

The build script uses fetched **CFRU** move and ability definitions plus **Unbound-Pokedex** duplicate-ability mappings to populate move details and ability descriptions. If the fetched source files are missing, the guide falls back to basic stats and names only.

### Wild Encounter Locations

When `documentation/fetched-from-repo/encounters.json` is available, the guide prefers the structured wild encounter data from **Unbound-Pokedex** for `guideData.locations`, while still using the local Unbound workbooks for gift/static encounters, trades, swarms, frontier data, and item tables.

### Pokemon Matching

Species names from local documentation are normalized and matched against constants. Some regional form names may not match exactly; `validate_data.py` reports unmatched counts.

## Contributing

To improve the data:

- Add move/ability descriptions to the Unbound source repositories
- Update regional form naming in spreadsheets to match SPECIES_* constants
- Report mismatches found by `validate_data.py`

## Dependencies

- Python 3.10+
- `openpyxl` — for parsing Excel workbooks
- `requests` — for fetching from GitHub

Install with:
```powershell
pip install openpyxl requests
```
