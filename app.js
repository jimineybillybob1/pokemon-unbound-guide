const guideData = window.UNBOUND_GUIDE_DATA;

const storageKeys = {
  caught: "unbound-field-guide-caught-v1",
  team: "unbound-field-guide-team-v1",
  theme: "unbound-field-guide-theme-v1",
};

const statLabels = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spdef: "SpD",
  spd: "Spe",
};

const natures = [
  { name: "Hardy", boost: "", lower: "" },
  { name: "Lonely", boost: "atk", lower: "def" },
  { name: "Brave", boost: "atk", lower: "spd" },
  { name: "Adamant", boost: "atk", lower: "spa" },
  { name: "Naughty", boost: "atk", lower: "spdef" },
  { name: "Bold", boost: "def", lower: "atk" },
  { name: "Docile", boost: "", lower: "" },
  { name: "Relaxed", boost: "def", lower: "spd" },
  { name: "Impish", boost: "def", lower: "spa" },
  { name: "Lax", boost: "def", lower: "spdef" },
  { name: "Timid", boost: "spd", lower: "atk" },
  { name: "Hasty", boost: "spd", lower: "def" },
  { name: "Serious", boost: "", lower: "" },
  { name: "Jolly", boost: "spd", lower: "spa" },
  { name: "Naive", boost: "spd", lower: "spdef" },
  { name: "Modest", boost: "spa", lower: "atk" },
  { name: "Mild", boost: "spa", lower: "def" },
  { name: "Quiet", boost: "spa", lower: "spd" },
  { name: "Bashful", boost: "", lower: "" },
  { name: "Rash", boost: "spa", lower: "spdef" },
  { name: "Calm", boost: "spdef", lower: "atk" },
  { name: "Gentle", boost: "spdef", lower: "def" },
  { name: "Sassy", boost: "spdef", lower: "spd" },
  { name: "Careful", boost: "spdef", lower: "spa" },
  { name: "Quirky", boost: "", lower: "" },
];

const natureByName = new Map(natures.map((nature) => [nature.name, nature]));

const pokemon = guideData.pokemon.filter((entry) => !entry.isPlaceholder);
const pokemonByConstant = new Map(pokemon.map((entry) => [entry.constant, entry]));
const evolutionParentsByConstant = new Map();
pokemon.forEach((entry) => {
  entry.evolutions.forEach((evolution) => {
    if (!pokemonByConstant.has(evolution.target)) return;
    const parents = evolutionParentsByConstant.get(evolution.target) || [];
    parents.push({ source: entry, evolution });
    evolutionParentsByConstant.set(evolution.target, parents);
  });
});
const pokemonBySearchName = new Map();
pokemon.forEach((entry) => {
  const key = normalize(entry.name);
  if (!pokemonBySearchName.has(key)) pokemonBySearchName.set(key, entry);
});
const moveMetadataByName = new Map(guideData.moves.map((move) => [normalize(move.name), move]));
const abilityMetadataByName = new Map((guideData.abilities || []).map((ability) => [normalize(ability.name), ability]));
const moveTutorNames = new Set(
  guideData.frontier.moveTutors.flatMap((tutor) => tutor.moves.map((move) => normalize(move.move))),
);

const elements = {
  countPokemon: document.querySelector("#count-pokemon"),
  countCaught: document.querySelector("#count-caught"),
  countCaughtTotal: document.querySelector("#count-caught-total"),
  countLocations: document.querySelector("#count-locations"),
  countMoves: document.querySelector("#count-moves"),
  dexSearch: document.querySelector("#dex-search"),
  typeFilter: document.querySelector("#type-filter"),
  locationFilter: document.querySelector("#location-filter"),
  hidePlaceholders: document.querySelector("#hide-placeholders"),
  dexGrid: document.querySelector("#dex-grid"),
  dexResultCount: document.querySelector("#dex-result-count"),
  dexLoadMore: document.querySelector("#dex-load-more"),
  locationSearch: document.querySelector("#location-search"),
  methodFilter: document.querySelector("#method-filter"),
  locationGrid: document.querySelector("#location-grid"),
  locationResultCount: document.querySelector("#location-result-count"),
  locationNav: document.querySelector("#location-nav"),
  locationPrevious: document.querySelector("#location-prev"),
  locationNext: document.querySelector("#location-next"),
  locationPosition: document.querySelector("#location-position"),
  specialEncounters: document.querySelector("#special-encounters"),
  tradeSwarmSummary: document.querySelector("#trade-swarm-summary"),
  caughtSummary: document.querySelector("#caught-summary"),
  caughtProgress: document.querySelector("#caught-progress"),
  caughtSearch: document.querySelector("#caught-search"),
  caughtFilter: document.querySelector("#caught-filter"),
  caughtList: document.querySelector("#caught-list"),
  moveSearch: document.querySelector("#move-search"),
  moveSourceFilter: document.querySelector("#move-source-filter"),
  moveList: document.querySelector("#move-list"),
  moveResultCount: document.querySelector("#move-result-count"),
  tutorResultCount: document.querySelector("#tutor-result-count"),
  moveTutors: document.querySelector("#move-tutors"),
  itemSearch: document.querySelector("#item-search"),
  itemTableFilter: document.querySelector("#item-table-filter"),
  itemTable: document.querySelector("#item-table"),
  itemResultCount: document.querySelector("#item-result-count"),
  stoneSearch: document.querySelector("#stone-search"),
  megaGrid: document.querySelector("#mega-grid"),
  zGrid: document.querySelector("#z-grid"),
  stoneResultCount: document.querySelector("#stone-result-count"),
  expandStones: document.querySelector("#expand-stones"),
  collapseStones: document.querySelector("#collapse-stones"),
  megaPanel: document.querySelector("#mega-panel"),
  zPanel: document.querySelector("#z-panel"),
  teamSummary: document.querySelector("#team-summary"),
  teamGrid: document.querySelector("#team-grid"),
  teamPokemonOptions: document.querySelector("#team-pokemon-options"),
  movePopup: document.querySelector("#move-popup"),
  movePopupContext: document.querySelector("#move-popup-context"),
  movePopupTitle: document.querySelector("#move-popup-title"),
  movePopupBody: document.querySelector("#move-popup-body"),
};

const INITIAL_CARD_BATCH = 50;

const state = {
  view: "dex",
  dexLimit: INITIAL_CARD_BATCH,
  caughtLimit: INITIAL_CARD_BATCH,
  moveLimit: INITIAL_CARD_BATCH,
  locationIndex: 0,
  caught: new Set(readJson(storageKeys.caught, [])),
  team: normalizeTeam(readJson(storageKeys.team, [])),
  caughtFilter: "all",
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeTeam(rawTeam) {
  return Array.from({ length: 6 }, (_, index) => {
    const slot = rawTeam?.[index] || {};
    return createTeamSlot(slot.species, slot);
  });
}

function createTeamSlot(species = "", values = {}) {
  return {
    species: pokemonByConstant.has(species) ? species : "",
    nickname: values.nickname || "",
    ability: values.ability || "",
    nature: natureByName.has(values.nature) ? values.nature : "Hardy",
    moves: Array.from({ length: 4 }, (__, moveIndex) => values.moves?.[moveIndex] || ""),
  };
}

function pokemonFromTeamSearch(value) {
  return pokemonBySearchName.get(normalize(value));
}

function saveCaught() {
  writeJson(storageKeys.caught, [...state.caught]);
}

function saveTeam() {
  writeJson(storageKeys.team, state.team);
}

function caughtCount() {
  return pokemon.filter((entry) => state.caught.has(entry.constant)).length;
}

function isCaught(constant) {
  return state.caught.has(constant);
}

function toggleCaught(constant) {
  if (!constant) return;
  if (state.caught.has(constant)) state.caught.delete(constant);
  else state.caught.add(constant);
  saveCaught();
  renderAll();
}

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function emptyState(text) {
  return createElement("div", "empty-state", text);
}

function typeBadge(type) {
  const badge = createElement("span", `type-badge type-${normalize(type)}`, type);
  return badge;
}

function pill(text) {
  return createElement("span", "pill", text);
}

function pillButton(text, dataset = {}) {
  const button = createElement("button", "pill pill-button", text);
  button.type = "button";
  Object.entries(dataset).forEach(([key, value]) => {
    button.dataset[key] = value;
  });
  return button;
}

function imageNode(src, alt, width = 64, height = 64) {
  const image = document.createElement("img");
  image.src = src || "assets/unbound-mark.png";
  image.alt = alt || "";
  image.width = width;
  image.height = height;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    image.src = "assets/unbound-mark.png";
  });
  return image;
}

function spriteWell(entry, className = "sprite-well", size = 96) {
  const well = createElement("span", className);
  well.append(imageNode(entry?.sprite, entry ? `${entry.name} sprite` : "", size, size));
  return well;
}

function itemIcon(item, className = "item-icon") {
  const icon = createElement("span", className);
  icon.append(imageNode(item?.icon, item?.name || item?.item || "", 44, 44));
  return icon;
}

function caughtToggleButton(constant, compact = false) {
  const button = createElement(
    "button",
    `caught-button${compact ? " caught-button--compact" : ""}`,
    isCaught(constant) ? "Caught" : "Catch",
  );
  button.type = "button";
  button.dataset.toggleCaught = constant;
  button.setAttribute("aria-pressed", isCaught(constant) ? "true" : "false");
  const ball = createElement("span", "caught-button__ball");
  ball.setAttribute("aria-hidden", "true");
  button.prepend(ball);
  return button;
}

function statsNode(stats, bst, markers = {}) {
  const wrapper = createElement("div", "stats");
  for (const [key, label] of Object.entries(statLabels)) {
    const item = createElement("span");
    if (markers.boost === key) item.classList.add("is-boosted");
    if (markers.lower === key) item.classList.add("is-lowered");
    item.append(createElement("b", "", label), document.createTextNode(String(stats[key] ?? 0)));
    wrapper.append(item);
  }
  const bstItem = createElement("span");
  bstItem.append(createElement("b", "", "BST"), document.createTextNode(String(bst || 0)));
  wrapper.append(bstItem);
  return wrapper;
}

function natureSummary(natureName) {
  const nature = natureByName.get(natureName) || natureByName.get("Hardy");
  if (!nature.boost || !nature.lower) return "No stat change";
  return `+10% ${statLabels[nature.boost]}, -10% ${statLabels[nature.lower]}`;
}

function adjustedStatsForNature(stats, natureName) {
  const nature = natureByName.get(natureName) || natureByName.get("Hardy");
  const adjusted = { ...stats };
  if (nature.boost && nature.lower) {
    adjusted[nature.boost] = Math.floor((stats[nature.boost] ?? 0) * 1.1);
    adjusted[nature.lower] = Math.floor((stats[nature.lower] ?? 0) * 0.9);
  }
  return { stats: adjusted, markers: { boost: nature.boost, lower: nature.lower } };
}

function formatBattleValue(value, empty = "-") {
  if (value === null || value === undefined || value === "") return empty;
  if (Number(value) === 0) return empty;
  return String(value);
}

function pokemonSearchText(entry) {
  return [
    entry.name,
    entry.constant,
    entry.types.join(" "),
    entry.abilities.join(" "),
    entry.hiddenAbility,
    entry.heldItems.map((item) => item.item).join(" "),
    entry.locations.map((location) => `${location.location} ${location.method}`).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function filteredPokemon({ includePlaceholders = false, search = "", type = "all", location = "all" } = {}) {
  const query = search.trim().toLowerCase();
  return guideData.pokemon.filter((entry) => {
    if (!includePlaceholders && entry.isPlaceholder) return false;
    if (type !== "all" && !entry.types.includes(type)) return false;
    if (location !== "all" && !entry.locations.some((item) => item.location === location)) return false;
    if (query && !pokemonSearchText(entry).includes(query)) return false;
    return true;
  });
}

function renderTypeRow(types) {
  const row = createElement("div", "type-row");
  types.forEach((type) => row.append(typeBadge(type)));
  return row;
}

function evolutionNavButton(target, method) {
  const button = createElement("button", "mini-button evolution-button");
  button.type = "button";
  button.dataset.focusPokemon = target.constant;
  button.append(createElement("strong", "", target.name));
  if (method) button.append(createElement("small", "", method));
  return button;
}

function renderEvolutionNav(entry) {
  const parents = evolutionParentsByConstant.get(entry.constant) || [];
  const children = entry.evolutions
    .map((evolution) => ({ target: pokemonByConstant.get(evolution.target), method: evolution.method }))
    .filter((item) => item.target);
  if (!parents.length && !children.length) return null;

  const section = createElement("div", "evolution-links");
  if (parents.length) {
    const group = createElement("div", "evolution-link-group");
    group.append(createElement("span", "card-label", "Evolves from"));
    const row = createElement("div", "evolution-button-row");
    parents.forEach(({ source, evolution }) => row.append(evolutionNavButton(source, evolution.method)));
    group.append(row);
    section.append(group);
  }

  if (children.length) {
    const group = createElement("div", "evolution-link-group");
    group.append(createElement("span", "card-label", "Evolves to"));
    const row = createElement("div", "evolution-button-row");
    children.forEach(({ target, method }) => row.append(evolutionNavButton(target, method)));
    group.append(row);
    section.append(group);
  }

  return section;
}

function renderPokemonCard(entry) {
  const card = createElement("article", `pokemon-card ${state.caught.has(entry.constant) ? "is-caught" : ""}`);
  card.dataset.pokemonCard = entry.constant;
  card.append(caughtToggleButton(entry.constant));

  const identity = createElement("div", "pokemon-card__identity");
  identity.append(spriteWell(entry));
  const titleBlock = createElement("div", "pokemon-card__title");
  titleBlock.append(createElement("span", "dex-number", `#${entry.guideNumber}`));
  titleBlock.append(createElement("h2", "", entry.name));
  titleBlock.append(renderTypeRow(entry.types));
  identity.append(titleBlock);
  card.append(identity);

  const abilityText = [
    entry.abilities.length ? `Abilities: ${entry.abilities.join(", ")}` : "",
    entry.hiddenAbility ? `Hidden: ${entry.hiddenAbility}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  if (abilityText) card.append(createElement("p", "pokemon-note-line", abilityText));

  if (entry.heldItems.length) {
    const heldItems = createElement("div", "held-item-row");
    entry.heldItems.forEach((heldItem) => {
      const item = createElement("span", "held-item-chip");
      item.append(itemIcon(heldItem, "item-icon item-icon--small"));
      item.append(createElement("span", "", `${heldItem.item} (${heldItem.slot})`));
      heldItems.append(item);
    });
    card.append(heldItems);
  }

  card.append(statsNode(entry.stats, entry.bst));

  const detailRow = createElement("div", "pill-row");
  detailRow.append(
    pillButton(`${entry.levelUpLearnset.length} level moves`, {
      openMovePopup: entry.constant,
      moveGroup: "levelUp",
    }),
  );
  if (entry.eggMoves.length) {
    detailRow.append(
      pillButton(`${entry.eggMoves.length} egg moves`, {
        openMovePopup: entry.constant,
        moveGroup: "egg",
      }),
    );
  }
  if (entry.tmHmMoves?.length) {
    detailRow.append(
      pillButton(`${entry.tmHmMoves.length} TM/HM moves`, {
        openMovePopup: entry.constant,
        moveGroup: "tmHm",
      }),
    );
  }
  if (entry.locations.length) detailRow.append(pill(`${entry.locations.length} locations`));
  if (entry.evolutions.length) detailRow.append(pill(`${entry.evolutions.length} evolutions`));
  card.append(detailRow);

  if (entry.locations.length) {
    const locationText = entry.locations
      .slice(0, 3)
      .map((location) => `${location.location} (${location.method})`)
      .join("; ");
    card.append(createElement("p", "pokemon-note-line", locationText));
  }

  const evolutionNav = renderEvolutionNav(entry);
  if (evolutionNav) card.append(evolutionNav);
  return card;
}

function renderDex(resetLimit = false) {
  if (resetLimit) state.dexLimit = INITIAL_CARD_BATCH;
  const list = filteredPokemon({
    includePlaceholders: !elements.hidePlaceholders.checked,
    search: elements.dexSearch.value,
    type: elements.typeFilter.value,
    location: elements.locationFilter.value,
  });
  const fragment = document.createDocumentFragment();
  list.slice(0, state.dexLimit).forEach((entry) => fragment.append(renderPokemonCard(entry)));
  elements.dexGrid.replaceChildren(fragment);
  elements.dexResultCount.textContent = `Showing ${Math.min(list.length, state.dexLimit)} of ${list.length}`;
  elements.dexLoadMore.hidden = state.dexLimit >= list.length;
  scheduleAutoLoad("dex");
}

function focusDexPokemon(constant) {
  const target = pokemonByConstant.get(constant);
  if (!target) return;
  switchView("dex");
  elements.dexSearch.value = target.name;
  elements.typeFilter.value = "all";
  elements.locationFilter.value = "all";
  if (target.isPlaceholder) elements.hidePlaceholders.checked = false;
  renderDex(true);
  const card = elements.dexGrid.querySelector(`[data-pokemon-card="${constant}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("is-focused");
  window.setTimeout(() => card.classList.remove("is-focused"), 1800);
}

function filteredLocations() {
  const query = elements.locationSearch.value.trim().toLowerCase();
  const method = elements.methodFilter.value;
  return guideData.locations
    .map((location) => {
      const methods = location.methods.filter((item) => method === "all" || item.label === method);
      return { ...location, methods };
    })
    .filter((location) => {
      if (!location.methods.length) return false;
      const text = [
        location.name,
        ...location.methods.flatMap((methodItem) => [methodItem.label, ...locationMethodEntries(methodItem).map((entry) => entry.species)]),
      ]
        .join(" ")
        .toLowerCase();
      return !query || text.includes(query);
    });
}

function locationPokemonEntry(name) {
  return pokemonBySearchName.get(normalize(name));
}

function locationMethodEntries(method) {
  if (Array.isArray(method.encounters) && method.encounters.length) return method.encounters;
  return (method.species || []).map((species) => ({ species }));
}

function renderLocationPokemonRow(encounter) {
  const name = encounter.species;
  const entry = locationPokemonEntry(name);
  const row = createElement("div", `location-pokemon-row${entry && isCaught(entry.constant) ? " is-caught" : ""}`);
  const identity = createElement("button", "location-pokemon-row__identity location-pokemon-row__toggle");
  identity.type = "button";
  if (entry) identity.dataset.toggleCaught = entry.constant;
  if (entry) identity.append(spriteWell(entry, "location-pokemon-row__sprite", 72));
  else identity.append(spriteWell(null, "location-pokemon-row__sprite", 72));
  const copy = createElement("span", "location-pokemon-row__copy");
  copy.append(createElement("strong", "", name));
  if (entry?.types?.length) copy.append(renderTypeRow(entry.types));
  identity.append(copy);
  row.append(identity);

  const meta = createElement("span", "location-pokemon-row__meta");
  if (encounter.rate) meta.append(pill(`Encounter ${encounter.rate}%`));
  if (entry) meta.append(caughtToggleButton(entry.constant, true));
  row.append(meta);
  return row;
}

function renderLocationCard(location) {
  const card = createElement("article", "location-card");
  const header = createElement("header");
  header.append(createElement("h2", "", location.name));
  card.append(header);
  for (const method of location.methods) {
    const block = createElement("section", "method-block");
    const encounters = locationMethodEntries(method);
    block.append(createElement("h3", "", `${method.label} (${encounters.length})`));
    const list = createElement("div", "location-pokemon-list");
    encounters.forEach((encounter) => list.append(renderLocationPokemonRow(encounter)));
    block.append(list);
    card.append(block);
  }
  return card;
}

function renderLocations() {
  const list = filteredLocations();
  state.locationIndex = Math.max(0, Math.min(state.locationIndex, list.length - 1));
  elements.locationNav.hidden = !list.length;
  elements.locationPrevious.disabled = state.locationIndex <= 0;
  elements.locationNext.disabled = state.locationIndex >= list.length - 1;
  elements.locationResultCount.textContent = `Showing ${list.length} locations`;
  elements.locationPosition.textContent = list.length
    ? `Location ${state.locationIndex + 1} of ${list.length}`
    : "Location 0 of 0";
  if (!list.length) {
    elements.locationGrid.replaceChildren(emptyState("No locations matched the current filters."));
    return;
  }
  elements.locationGrid.replaceChildren(renderLocationCard(list[state.locationIndex]));
}

function renderSpecialSections() {
  const special = createElement("div");
  const giftCard = createElement("article", "data-mini-card");
  giftCard.append(createElement("h3", "", `Gift/static encounters (${guideData.giftStatic.length})`));
  giftCard.append(
    createElement(
      "p",
      "",
      guideData.giftStatic
        .slice(0, 12)
        .map((entry) => `${entry.pokemon} - ${entry.location}`)
        .join("; "),
    ),
  );
  special.append(giftCard);

  const legendaryCard = createElement("article", "data-mini-card");
  legendaryCard.append(createElement("h3", "", `Legendary, mythical, Ultra Beast (${guideData.legendary.length})`));
  legendaryCard.append(
    createElement(
      "p",
      "",
      guideData.legendary
        .slice(0, 12)
        .map((entry) => `${entry.pokemon} - ${entry.locations.join(", ")}`)
        .join("; "),
    ),
  );
  special.append(legendaryCard);
  elements.specialEncounters.replaceChildren(special);

  const tradeSummary = createElement("div");
  const trades = createElement("article", "data-mini-card");
  trades.append(createElement("h3", "", `Trades (${guideData.trades.length})`));
  trades.append(
    createElement(
      "p",
      "",
      guideData.trades.map((entry) => `${entry.location}: ${entry.send} -> ${entry.receive}`).join("; "),
    ),
  );
  tradeSummary.append(trades);

  const swarms = createElement("article", "data-mini-card");
  swarms.append(createElement("h3", "", `Swarms (${guideData.swarms.length} days)`));
  swarms.append(
    createElement(
      "p",
      "",
      guideData.swarms
        .slice(0, 4)
        .map((day) => `Day ${day.day}: ${day.entries.slice(0, 6).map((entry) => entry.pokemon).join(", ")}`)
        .join("; "),
    ),
  );
  tradeSummary.append(swarms);
  elements.tradeSwarmSummary.replaceChildren(tradeSummary);
}

function caughtFilteredPokemon() {
  return filteredPokemon({
    search: elements.caughtSearch.value,
    includePlaceholders: false,
    type: "all",
    location: "all",
  }).filter((entry) => {
    if (state.caughtFilter === "caught") return isCaught(entry.constant);
    if (state.caughtFilter === "uncaught") return !isCaught(entry.constant);
    return true;
  });
}

function renderCaught() {
  const list = caughtFilteredPokemon();
  const currentCaughtCount = caughtCount();
  const percent = pokemon.length ? Math.round((currentCaughtCount / pokemon.length) * 100) : 0;
  elements.caughtSummary.textContent = `${currentCaughtCount} of ${pokemon.length} caught`;
  elements.caughtProgress.style.width = `${percent}%`;

  const fragment = document.createDocumentFragment();
  list.slice(0, state.caughtLimit).forEach((entry) => {
    const row = createElement("div", `caught-row${isCaught(entry.constant) ? " is-caught" : ""}`);
    const identity = createElement("button", "caught-row__identity caught-row__toggle");
    identity.type = "button";
    identity.dataset.toggleCaught = entry.constant;
    identity.append(spriteWell(entry, "caught-row__sprite", 38));
    const copy = createElement("span", "caught-row__copy");
    copy.append(createElement("small", "", `#${entry.guideNumber}`), createElement("strong", "", entry.name), renderTypeRow(entry.types));
    identity.append(copy);
    row.append(identity, caughtToggleButton(entry.constant, true));
    fragment.append(row);
  });
  if (!fragment.childNodes.length) fragment.append(emptyState("No Pokemon matched the current tracker filters."));
  elements.caughtList.replaceChildren(fragment);
  elements.caughtSummary.textContent = `${currentCaughtCount} of ${pokemon.length} caught | Showing ${Math.min(list.length, state.caughtLimit)} of ${list.length}`;
  scheduleAutoLoad("caught");
}

function learnerText(learner) {
  return learner.level === undefined ? learner.name : `${learner.name} Lv. ${learner.level}`;
}

function renderLearners(title, learners) {
  const group = createElement("section");
  group.append(createElement("h3", "", `${title} (${learners.length})`));
  const list = createElement("div", "learner-list");
  learners.slice(0, 80).forEach((learner) => list.append(pill(learnerText(learner))));
  if (learners.length > 80) list.append(pill(`+${learners.length - 80} more`));
  group.append(list);
  return group;
}

function renderMovePopupEntries(entries, emptyText = "No moves available.") {
  const fragment = document.createDocumentFragment();
  if (!entries.length) {
    fragment.append(emptyState(emptyText));
    return fragment;
  }
  entries.forEach((entry) => {
    const card = createElement("article", "move-popup-card");
    const header = createElement("div", "move-popup-card__header");
    const copy = createElement("div", "move-popup-card__title");
    copy.append(createElement("h3", "pokemon-font-title", entry.label || entry.move));
    if (entry.detail) copy.append(createElement("p", "", entry.detail));
    header.append(copy);
    const badge = entry.move ? caughtMoveTypeBadge(entry.move) : null;
    if (badge) header.append(badge);
    card.append(header);
    if (entry.move) card.append(moveDetailsNode(entry.move));
    fragment.append(card);
  });
  return fragment;
}

function caughtMoveTypeBadge(moveName) {
  const metadata = moveMetadataByName.get(normalize(moveName));
  return metadata?.type ? typeBadge(metadata.type) : null;
}

function openMovePopup(title, context, entries, emptyText) {
  elements.movePopupTitle.textContent = title;
  elements.movePopupContext.textContent = context;
  elements.movePopupBody.replaceChildren(renderMovePopupEntries(entries, emptyText));
  if (typeof elements.movePopup.showModal === "function") elements.movePopup.showModal();
  else elements.movePopup.setAttribute("open", "open");
}

function openPokemonMovePopup(constant, group) {
  const entry = pokemonByConstant.get(constant);
  if (!entry) return;
  if (group === "levelUp") {
    openMovePopup(
      entry.name,
      "Level-up moves",
      entry.levelUpLearnset.map((move) => ({
        move: move.move,
        label: move.move,
        detail: `Level ${move.level}`,
      })),
      "No level-up moves were found.",
    );
    return;
  }
  if (group === "egg") {
    openMovePopup(
      entry.name,
      "Egg moves",
      entry.eggMoves.map((move) => ({
        move: move.move,
        label: move.move,
      })),
      "No egg moves were found.",
    );
    return;
  }
  if (group === "tmHm") {
    openMovePopup(
      entry.name,
      "TM / HM moves",
      (entry.tmHmMoves || []).map((move) => ({
        move: move.move,
        label: move.move,
        detail: `${move.number}${move.type ? ` - ${move.type}` : ""}`,
      })),
      "No TM/HM compatibility was found.",
    );
  }
}

function filteredMoves() {
  const query = elements.moveSearch.value.trim().toLowerCase();
  const source = elements.moveSourceFilter.value;
  return guideData.moves.filter((move) => {
    if (source === "levelUp" && !move.learners.levelUp.length) return false;
    if (source === "egg" && !move.learners.egg.length) return false;
    if (!query) return true;
    const text = [
      move.name,
      ...move.learners.levelUp.map((learner) => learner.name),
      ...move.learners.egg.map((learner) => learner.name),
    ]
      .join(" ")
      .toLowerCase();
    return text.includes(query);
  });
}

function renderMoveCard(move) {
  const details = document.createElement("details");
  details.className = "move-card";
  const summary = document.createElement("summary");
  const title = createElement("div");
  title.append(createElement("h2", "pokemon-font-title", move.name));
  const counts = createElement("div", "pill-row");
  counts.append(pill(`${move.learners.levelUp.length} level`));
  if (move.learners.egg.length) counts.append(pill(`${move.learners.egg.length} egg`));
  if (moveTutorNames.has(normalize(move.name))) counts.append(pill("Tutor"));
  summary.append(title, counts);
  details.append(summary);
  details.append(moveDetailsNode(move.name));

  const groups = createElement("div", "learner-groups");
  if (move.learners.levelUp.length) groups.append(renderLearners("Level-up learners", move.learners.levelUp));
  if (move.learners.egg.length) groups.append(renderLearners("Egg move learners", move.learners.egg));
  details.append(groups);
  return details;
}

function renderMoves() {
  const list = filteredMoves();
  const fragment = document.createDocumentFragment();
  list.slice(0, state.moveLimit).forEach((move) => fragment.append(renderMoveCard(move)));
  if (!fragment.childNodes.length) fragment.append(emptyState("No moves matched the current filters."));
  elements.moveList.replaceChildren(fragment);
  elements.moveResultCount.textContent = `Showing ${Math.min(list.length, state.moveLimit)} of ${list.length}`;
  scheduleAutoLoad("moves");
}

function renderMoveTutors() {
  const fragment = document.createDocumentFragment();
  guideData.frontier.moveTutors.forEach((tutor) => {
    const card = createElement("section", "tutor-card");
    card.append(createElement("h3", "pokemon-font-title", tutor.name), createElement("p", "", `${tutor.location} | ${tutor.availability}`));
    const moves = createElement("div", "pill-row");
    tutor.moves.forEach((move) => moves.append(pill(`${move.move}${move.cost ? ` (${move.cost})` : ""}`)));
    card.append(moves);
    fragment.append(card);
  });
  elements.moveTutors.replaceChildren(fragment);
  elements.tutorResultCount.textContent = `Showing ${guideData.frontier.moveTutors.length} tutors`;
}

function itemRowsForTable() {
  const table = elements.itemTableFilter.value;
  if (table === "wildHeldItems") return guideData.items.wildHeldItems;
  if (table === "frontierServices") return guideData.frontier.services;
  return guideData.items.tmHm;
}

function renderItemTable() {
  const table = elements.itemTableFilter.value;
  const query = elements.itemSearch.value.trim().toLowerCase();
  const rows = itemRowsForTable().filter((row) => JSON.stringify(row).toLowerCase().includes(query));
  const header = document.createElement("thead");
  const body = document.createElement("tbody");
  const headerRow = document.createElement("tr");

  const columns =
    table === "wildHeldItems"
      ? [
          ["number", "No."],
          ["pokemon", "Pokemon"],
          ["items", "Items"],
        ]
      : table === "frontierServices"
        ? [
            ["name", "Service"],
            ["location", "Location"],
            ["availability", "Availability"],
            ["cost", "Cost"],
            ["details", "Details"],
            ["offerings", "Offerings"],
          ]
        : [
            ["number", "No."],
            ["name", "Name"],
            ["type", "Type"],
            ["location", "Location"],
          ];

  columns.forEach(([, label]) => headerRow.append(createElement("th", "", label)));
  header.append(headerRow);

  rows.forEach((row) => {
    const tableRow = document.createElement("tr");
    columns.forEach(([key]) => {
      const cell = document.createElement("td");
      const value = row[key];
      if (key === "name" && row.icon) {
        const item = createElement("span", "table-item");
        item.append(itemIcon(row, "item-icon item-icon--small"), createElement("span", "", value || ""));
        cell.append(item);
      } else if (key === "items" && Array.isArray(value)) {
        const itemList = createElement("div", "table-item-list");
        value.forEach((heldItem) => {
          const item = createElement("span", "table-item");
          item.append(itemIcon(heldItem, "item-icon item-icon--tiny"));
          item.append(createElement("span", "", `${heldItem.item}${heldItem.slot ? ` (${heldItem.slot})` : ""}`));
          itemList.append(item);
        });
        if (!itemList.childNodes.length) itemList.append(createElement("span", "", "None listed"));
        cell.append(itemList);
      } else if (Array.isArray(value)) {
        cell.textContent = value.map((item) => (typeof item === "string" ? item : item.item || "")).join(", ");
      } else {
        cell.textContent = value || "";
      }
      tableRow.append(cell);
    });
    body.append(tableRow);
  });
  elements.itemTable.replaceChildren(header, body);
  elements.itemResultCount.textContent = `Showing ${rows.length} rows`;
}

function renderStones() {
  const query = elements.stoneSearch.value.trim().toLowerCase();
  const matches = (item) => JSON.stringify(item).toLowerCase().includes(query);
  const mega = guideData.items.megaStones.filter(matches);
  const z = guideData.items.zCrystals.filter(matches);

  const megaFragment = document.createDocumentFragment();
  mega.forEach((item) => megaFragment.append(renderItemCard(item)));
  const zFragment = document.createDocumentFragment();
  z.forEach((item) => zFragment.append(renderItemCard(item)));
  elements.megaGrid.replaceChildren(megaFragment);
  elements.zGrid.replaceChildren(zFragment);
  elements.stoneResultCount.textContent = `Showing ${mega.length + z.length} items`;
}

function canAutoLoad(view) {
  if (view === "dex") {
    const total = filteredPokemon({
      includePlaceholders: !elements.hidePlaceholders.checked,
      search: elements.dexSearch.value,
      type: elements.typeFilter.value,
      location: elements.locationFilter.value,
    }).length;
    return state.dexLimit < total;
  }
  if (view === "caught") {
    return state.caughtLimit < caughtFilteredPokemon().length;
  }
  if (view === "moves") {
    return state.moveLimit < filteredMoves().length;
  }
  return false;
}

function loadNextBatch(view) {
  if (view === "dex" && canAutoLoad("dex")) {
    state.dexLimit += INITIAL_CARD_BATCH;
    renderDex();
    return true;
  }
  if (view === "caught" && canAutoLoad("caught")) {
    state.caughtLimit += INITIAL_CARD_BATCH;
    renderCaught();
    return true;
  }
  if (view === "moves" && canAutoLoad("moves")) {
    state.moveLimit += INITIAL_CARD_BATCH;
    renderMoves();
    return true;
  }
  return false;
}

function scheduleAutoLoad(view) {
  if (state.view !== view) return;
  window.requestAnimationFrame(() => {
    if (state.view !== view) return;
    if (document.documentElement.scrollHeight <= window.innerHeight + 140) {
      loadNextBatch(view);
    }
  });
}

function renderItemCard(item) {
  const card = createElement("article", "item-card");
  const header = createElement("header", "item-card__header");
  header.append(itemIcon(item, "item-icon item-icon--large"));
  const copy = createElement("span");
  copy.append(createElement("small", "", item.number ? `#${item.number}` : "Item"), createElement("h3", "", item.name));
  header.append(copy);
  card.append(header);
  if (item.type) card.append(renderTypeRow([item.type]));
  card.append(createElement("p", "", item.location));
  return card;
}

function metadataValueGrid(values) {
  const grid = createElement("dl", "metadata-grid");
  values.forEach(([label, value]) => {
    const item = createElement("div");
    item.append(createElement("dt", "", label), createElement("dd", "", value));
    grid.append(item);
  });
  return grid;
}

function moveDetailsNode(moveName) {
  if (!moveName) return document.createDocumentFragment();
  const metadata = moveMetadataByName.get(normalize(moveName));
  const card = createElement("div", "metadata-card metadata-card--move");
  const header = createElement("div", "metadata-card__header");
  header.append(createElement("strong", "", moveName));
  if (metadata?.type) header.append(typeBadge(metadata.type));
  card.append(header);

  if (!metadata?.metadataSource) {
    card.append(createElement("p", "", "Move details are not available in the local/reference metadata."));
    return card;
  }

  card.append(
    metadataValueGrid([
      ["Category", metadata.category || "-"],
      ["Power", formatBattleValue(metadata.power)],
      ["Accuracy", formatBattleValue(metadata.accuracy)],
      ["PP", formatBattleValue(metadata.pp)],
      ["Priority", metadata.priority === undefined || metadata.priority === null ? "-" : String(metadata.priority)],
      ["Contact", metadata.contact ? "Yes" : "No"],
    ]),
  );
  const description = metadata.effect || metadata.description;
  if (description) card.append(createElement("p", "", description));
  return card;
}

function abilityDetailsNode(abilityName) {
  if (!abilityName) return document.createDocumentFragment();
  const metadata = abilityMetadataByName.get(normalize(abilityName));
  const card = createElement("div", "metadata-card metadata-card--ability");
  card.append(createElement("strong", "", abilityName));
  if (metadata?.description) {
    card.append(createElement("p", "", metadata.description));
  } else {
    card.append(createElement("p", "", "Ability details are not available in the local/reference metadata."));
  }
  return card;
}

function moveChoicesForPokemon(entry) {
  const choices = [];
  const seen = new Set();
  for (const move of entry.levelUpLearnset) {
    if (seen.has(move.move)) continue;
    seen.add(move.move);
    choices.push({ value: move.move, label: `Lv. ${move.level} ${move.move}` });
  }
  for (const move of entry.eggMoves) {
    if (seen.has(move.move)) continue;
    seen.add(move.move);
    choices.push({ value: move.move, label: `Egg ${move.move}` });
  }
  return choices;
}

function renderTeam() {
  const selectedPokemon = state.team.map((slot) => pokemonByConstant.get(slot.species)).filter(Boolean);
  const typeCounts = new Map();
  selectedPokemon.forEach((entry) => entry.types.forEach((type) => typeCounts.set(type, (typeCounts.get(type) || 0) + 1)));
  const summary = document.createDocumentFragment();
  summary.append(pill(`${selectedPokemon.length} / 6 selected`));
  [...typeCounts.entries()].forEach(([type, count]) => summary.append(pill(`${type} x${count}`)));
  elements.teamSummary.replaceChildren(summary);

  const fragment = document.createDocumentFragment();
  state.team.forEach((slot, index) => fragment.append(renderTeamCard(slot, index)));
  elements.teamGrid.replaceChildren(fragment);
}

function renderTeamCard(slot, index) {
  const card = createElement("article", "team-card");
  const entry = pokemonByConstant.get(slot.species);
  const header = createElement("header");
  header.append(createElement("h2", "", `Slot ${index + 1}`), entry ? pill(`${entry.bst} BST`) : pill("Empty"));
  card.append(header);

  if (entry) {
    const shownName = slot.nickname.trim() || entry.name;
    const identity = createElement("div", "team-card__identity");
    identity.append(spriteWell(entry, "team-sprite-well"));
    const copy = createElement("div");
    copy.append(createElement("h3", "", shownName));
    if (slot.nickname.trim()) copy.append(createElement("small", "team-species-name", entry.name));
    copy.append(renderTypeRow(entry.types));
    identity.append(copy);
    card.append(identity);
  }

  const speciesLabel = createElement("label");
  speciesLabel.append(createElement("span", "", "Pokemon"));
  const speciesSearch = document.createElement("input");
  speciesSearch.type = "search";
  speciesSearch.setAttribute("list", "team-pokemon-options");
  speciesSearch.placeholder = "Search Pokemon";
  speciesSearch.autocomplete = "off";
  speciesSearch.dataset.teamSpeciesSearch = String(index);
  speciesSearch.value = entry?.name || "";
  speciesLabel.append(speciesSearch);
  card.append(speciesLabel);

  if (!entry) return card;

  const formGrid = createElement("div", "team-form-grid");

  const nicknameLabel = createElement("label");
  nicknameLabel.append(createElement("span", "", "Nickname"));
  const nicknameInput = document.createElement("input");
  nicknameInput.type = "text";
  nicknameInput.placeholder = entry.name;
  nicknameInput.maxLength = 24;
  nicknameInput.dataset.teamNickname = String(index);
  nicknameInput.value = slot.nickname;
  nicknameLabel.append(nicknameInput);
  formGrid.append(nicknameLabel);

  const natureLabel = createElement("label");
  natureLabel.append(createElement("span", "", "Nature"));
  const natureSelect = document.createElement("select");
  natureSelect.dataset.teamNature = String(index);
  natures.forEach((nature) => {
    const suffix = nature.boost ? ` (+${statLabels[nature.boost]} / -${statLabels[nature.lower]})` : " (neutral)";
    natureSelect.append(new Option(`${nature.name}${suffix}`, nature.name));
  });
  natureSelect.value = slot.nature;
  natureLabel.append(natureSelect);
  formGrid.append(natureLabel);

  const abilityLabel = createElement("label");
  abilityLabel.append(createElement("span", "", "Ability"));
  const abilitySelect = document.createElement("select");
  abilitySelect.dataset.teamAbility = String(index);
  const abilities = [...entry.abilities, entry.hiddenAbility].filter(Boolean);
  abilities.forEach((ability) => abilitySelect.append(new Option(ability, ability)));
  if (!abilities.includes(slot.ability)) slot.ability = abilities[0] || "";
  abilitySelect.value = slot.ability;
  abilityLabel.append(abilitySelect);
  formGrid.append(abilityLabel);
  card.append(formGrid);

  card.append(createElement("p", "nature-note", natureSummary(slot.nature)));
  const adjusted = adjustedStatsForNature(entry.stats, slot.nature);
  card.append(statsNode(adjusted.stats, entry.bst, adjusted.markers));
  card.append(abilityDetailsNode(slot.ability));

  const moves = moveChoicesForPokemon(entry);
  const moveGrid = createElement("div", "team-move-list");
  for (let moveIndex = 0; moveIndex < 4; moveIndex += 1) {
    const moveSlot = createElement("div", "team-move-slot");
    const moveLabel = createElement("label");
    moveLabel.append(createElement("span", "", `Move ${moveIndex + 1}`));
    const moveSelect = document.createElement("select");
    moveSelect.dataset.teamMove = `${index}:${moveIndex}`;
    moveSelect.append(new Option("No move", ""));
    moves.forEach((move) => moveSelect.append(new Option(move.label, move.value)));
    if (!moves.some((move) => move.value === slot.moves[moveIndex])) slot.moves[moveIndex] = "";
    moveSelect.value = slot.moves[moveIndex];
    moveLabel.append(moveSelect);
    moveSlot.append(moveLabel);
    if (slot.moves[moveIndex]) moveSlot.append(moveDetailsNode(slot.moves[moveIndex]));
    moveGrid.append(moveSlot);
  }
  card.append(moveGrid);

  if (entry.locations.length) {
    card.append(createElement("p", "", `Found: ${entry.locations.slice(0, 4).map((item) => item.location).join(", ")}`));
  }
  return card;
}

function updateOverview() {
  const currentCaughtCount = caughtCount();
  elements.countPokemon.textContent = String(pokemon.length);
  elements.countCaught.textContent = String(currentCaughtCount);
  elements.countCaughtTotal.textContent = String(pokemon.length);
  elements.countLocations.textContent = String(guideData.locations.length);
  elements.countMoves.textContent = String(guideData.moves.length);
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll("[data-view-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
  });
  document.querySelectorAll(".view-tab").forEach((tab) => {
    const active = tab.dataset.view === view;
    tab.classList.toggle("is-active", active);
    if (active) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  history.replaceState(null, "", `#${view}`);
  scheduleAutoLoad(view);
}

function populateFilters() {
  if (elements.teamPokemonOptions) {
    const options = pokemon.map((entry) => new Option(entry.name, entry.name));
    elements.teamPokemonOptions.replaceChildren(...options);
  }

  const typeOptions = ["all", ...new Set(pokemon.flatMap((entry) => entry.types))].sort((a, b) =>
    a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b),
  );
  elements.typeFilter.replaceChildren(...typeOptions.map((type) => new Option(type === "all" ? "All types" : type, type)));

  const locations = ["all", ...new Set(pokemon.flatMap((entry) => entry.locations.map((item) => item.location)))].sort(
    (a, b) => (a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)),
  );
  elements.locationFilter.replaceChildren(
    ...locations.map((location) => new Option(location === "all" ? "All locations" : location, location)),
  );

  const methods = ["all", ...new Set(guideData.locations.flatMap((location) => location.methods.map((method) => method.label)))].sort(
    (a, b) => (a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)),
  );
  elements.methodFilter.replaceChildren(
    ...methods.map((method) => new Option(method === "all" ? "All methods" : method, method)),
  );
}

function renderAll() {
  updateOverview();
  renderDex();
  renderLocations();
  renderSpecialSections();
  renderCaught();
  renderMoves();
  renderMoveTutors();
  renderItemTable();
  renderStones();
  renderTeam();
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });
  document.querySelectorAll("[data-open-view]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      switchView(link.dataset.openView);
    });
  });

  elements.dexSearch.addEventListener("input", () => renderDex(true));
  elements.typeFilter.addEventListener("change", () => renderDex(true));
  elements.locationFilter.addEventListener("change", () => renderDex(true));
  elements.hidePlaceholders.addEventListener("change", () => renderDex(true));
  elements.dexLoadMore.addEventListener("click", () => {
    state.dexLimit += INITIAL_CARD_BATCH;
    renderDex();
  });

  elements.locationSearch.addEventListener("input", () => {
    state.locationIndex = 0;
    renderLocations();
  });
  elements.methodFilter.addEventListener("change", () => {
    state.locationIndex = 0;
    renderLocations();
  });
  elements.locationPrevious.addEventListener("click", () => {
    state.locationIndex = Math.max(0, state.locationIndex - 1);
    renderLocations();
  });
  elements.locationNext.addEventListener("click", () => {
    state.locationIndex += 1;
    renderLocations();
  });
  elements.caughtSearch.addEventListener("input", () => {
    state.caughtLimit = INITIAL_CARD_BATCH;
    renderCaught();
  });
  elements.caughtFilter.addEventListener("change", () => {
    state.caughtFilter = elements.caughtFilter.value;
    state.caughtLimit = INITIAL_CARD_BATCH;
    renderCaught();
  });
  elements.moveSearch.addEventListener("input", () => {
    state.moveLimit = INITIAL_CARD_BATCH;
    renderMoves();
  });
  elements.moveSourceFilter.addEventListener("change", () => {
    state.moveLimit = INITIAL_CARD_BATCH;
    renderMoves();
  });
  elements.itemSearch.addEventListener("input", renderItemTable);
  elements.itemTableFilter.addEventListener("change", renderItemTable);
  elements.stoneSearch.addEventListener("input", renderStones);
  elements.expandStones.addEventListener("click", () => {
    elements.megaPanel.open = true;
    elements.zPanel.open = true;
  });
  elements.collapseStones.addEventListener("click", () => {
    elements.megaPanel.open = false;
    elements.zPanel.open = false;
  });

  document.querySelector("#theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(storageKeys.theme, next);
  });

  document.querySelector("#reset-progress").addEventListener("click", () => {
    if (!confirm("Reset caught tracker and team builder data for this browser?")) return;
    state.caught.clear();
    state.team = normalizeTeam([]);
    saveCaught();
    saveTeam();
    renderAll();
  });

  document.querySelector("#clear-team").addEventListener("click", () => {
    state.team = normalizeTeam([]);
    saveTeam();
    renderTeam();
    updateOverview();
  });

  document.addEventListener("click", (event) => {
    const evolutionButton = event.target.closest("[data-focus-pokemon]");
    if (evolutionButton) {
      focusDexPokemon(evolutionButton.dataset.focusPokemon);
      return;
    }

    const popupButton = event.target.closest("[data-open-move-popup]");
    if (popupButton) {
      openPokemonMovePopup(popupButton.dataset.openMovePopup, popupButton.dataset.moveGroup);
      return;
    }

    const caughtButton = event.target.closest("[data-toggle-caught]");
    if (caughtButton) {
      toggleCaught(caughtButton.dataset.toggleCaught);
    }
  });

  document.addEventListener("change", (event) => {
    const speciesSearch = event.target.closest("[data-team-species-search]");
    if (speciesSearch) {
      const index = Number(speciesSearch.dataset.teamSpeciesSearch);
      const matched = pokemonFromTeamSearch(speciesSearch.value);
      if (speciesSearch.value.trim() && !matched) {
        speciesSearch.value = pokemonByConstant.get(state.team[index].species)?.name || "";
        return;
      }
      state.team[index] = createTeamSlot(matched?.constant || "");
      saveTeam();
      renderTeam();
    }

    const abilitySelect = event.target.closest("[data-team-ability]");
    if (abilitySelect) {
      state.team[Number(abilitySelect.dataset.teamAbility)].ability = abilitySelect.value;
      saveTeam();
      renderTeam();
    }

    const natureSelect = event.target.closest("[data-team-nature]");
    if (natureSelect) {
      const index = Number(natureSelect.dataset.teamNature);
      state.team[index].nature = natureSelect.value;
      saveTeam();
      renderTeam();
    }

    const moveSelect = event.target.closest("[data-team-move]");
    if (moveSelect) {
      const [slotIndex, moveIndex] = moveSelect.dataset.teamMove.split(":").map(Number);
      state.team[slotIndex].moves[moveIndex] = moveSelect.value;
      saveTeam();
      renderTeam();
    }

    const nicknameInput = event.target.closest("[data-team-nickname]");
    if (nicknameInput) {
      state.team[Number(nicknameInput.dataset.teamNickname)].nickname = nicknameInput.value;
      saveTeam();
      renderTeam();
    }
  });

  document.addEventListener("input", (event) => {
    const speciesSearch = event.target.closest("[data-team-species-search]");
    if (speciesSearch) {
      const index = Number(speciesSearch.dataset.teamSpeciesSearch);
      const value = speciesSearch.value.trim();
      const matched = pokemonFromTeamSearch(value);
      if (!value && state.team[index].species) {
        state.team[index] = createTeamSlot("");
        saveTeam();
        renderTeam();
      } else if (matched && state.team[index].species !== matched.constant) {
        state.team[index] = createTeamSlot(matched.constant);
        saveTeam();
        renderTeam();
      }
      return;
    }

    const nicknameInput = event.target.closest("[data-team-nickname]");
    if (nicknameInput) {
      state.team[Number(nicknameInput.dataset.teamNickname)].nickname = nicknameInput.value;
      saveTeam();
    }
  });

  window.addEventListener("scroll", () => {
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 360) return;
    loadNextBatch(state.view);
  });
}

elements.caughtFilter.value = state.caughtFilter;
populateFilters();
bindEvents();
renderAll();

const initialView = location.hash.replace("#", "");
if (document.querySelector(`[data-view-panel="${initialView}"]`)) {
  switchView(initialView);
}
