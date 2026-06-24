# Pokemon Unbound Field Guide

A local static HTML guide generated from the supplied Pokemon Unbound documentation.

Live guide: https://jimineybillybob1.github.io/pokemon-unbound-guide/

Open the guide from the project root with a local static server:

```powershell
& 'C:\Users\james\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 8765 --bind 127.0.0.1
```

Then browse to `http://127.0.0.1:8765/`.

## Build

Regenerate guide data:

```powershell
& 'C:\Users\james\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\build_data.py
```

When available, the build also reads the sibling Dreamstone guide data files in
`C:\Users\james\Documents\Pokemon Dreamstone Mysteries\data` to supplement move power,
accuracy, PP, category, effects, and ability descriptions by matching names. The Unbound
source files remain authoritative for Pokemon, learnsets, locations, items, and availability.

Validate parsed counts and obvious consistency checks:

```powershell
& 'C:\Users\james\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\validate_data.py
```

## Source Coverage

- `Base_Stats.txt`: base stats, types, abilities, hidden abilities, held item slots, egg groups, growth data, EV yield.
- `Evolution Table.txt`: evolution edges, including level, item, trade, map/location, Mega, and Gigantamax methods.
- `Learnsets.txt` / `Learnsets.c`: level-up learnsets.
- `Egg_Moves.txt`: egg moves.
- `Pokemon Unbound Location Guide v2.1.1.1.xlsx`: wild locations, gift/static encounters, legendary/mythical/Ultra Beast locations, trades, swarms, wild held items, TM/HM locations, Mega Stones, and Z-Crystals.
- `Pokemon Unbound Frontier Documentation.xlsx`: Battle Frontier services and move tutors.
- `Pokemon Unbound 2.1.1.1 Trainers Documentation.xlsx`: only Intro and level caps are present locally.

The raw `documentation/` folder is intentionally ignored by git. Keep those source files locally, then run `scripts/build_data.py` to regenerate the committed `data/unbound-data.*` files.

## Visual Assets

- `assets/fonts/pokemon-gb.ttf`: Pokemon GB-style UI font, copied from the Dreamstone guide assets.
- `assets/pokemon/`: compact Pokemon sprites from the Dreamstone guide's vendored PokeSprite assets.
- `assets/items/`: item, TM, Mega Stone, and Z-Crystal icons from the Dreamstone guide asset set.

The generated data includes resolved `sprite` and `icon` paths, and `scripts/validate_data.py` checks that referenced files exist.

## Known Gaps

- Trainer and boss-team features are intentionally not built yet because the local trainer workbook does not include reliable trainer team tables.
- Move and ability detail text is reference-supplemented from the Dreamstone Pokerex data where names match; no local Unbound-specific power, accuracy, PP, category, or description table is present yet.
- Maps, trainer sprites, and cloud sync are left for later passes.
- Some encounter species/form names from spreadsheets do not yet match source constants exactly; validation reports the unmatched count.
