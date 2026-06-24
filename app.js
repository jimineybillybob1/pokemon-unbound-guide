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

const pokemon = guideData.pokemon.filter((entry) => !entry.isPlaceholder);
const pokemonByConstant = new Map(pokemon.map((entry) => [entry.constant, entry]));
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
  specialEncounters: document.querySelector("#special-encounters"),
  tradeSwarmSummary: document.querySelector("#trade-swarm-summary"),
  caughtSummary: document.querySelector("#caught-summary"),
  caughtProgress: document.querySelector("#caught-progress"),
  caughtSearch: document.querySelector("#caught-search"),
  caughtList: document.querySelector("#caught-list"),
  moveSearch: document.querySelector("#move-search"),
  moveSourceFilter: document.querySelector("#move-source-filter"),
  moveList: document.querySelector("#move-list"),
  moveResultCount: document.querySelector("#move-result-count"),
  moveTutors: document.querySelector("#move-tutors"),
  itemSearch: document.querySelector("#item-search"),
  itemTableFilter: document.querySelector("#item-table-filter"),
  itemTable: document.querySelector("#item-table"),
  itemResultCount: document.querySelector("#item-result-count"),
  stoneSearch: document.querySelector("#stone-search"),
  megaGrid: document.querySelector("#mega-grid"),
  zGrid: document.querySelector("#z-grid"),
  stoneResultCount: document.querySelector("#stone-result-count"),
  teamSummary: document.querySelector("#team-summary"),
  teamGrid: document.querySelector("#team-grid"),
};

const state = {
  view: "dex",
  dexLimit: 96,
  caught: new Set(readJson(storageKeys.caught, [])),
  team: normalizeTeam(readJson(storageKeys.team, [])),
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
    return {
      species: pokemonByConstant.has(slot.species) ? slot.species : "",
      ability: slot.ability || "",
      moves: Array.from({ length: 4 }, (__, moveIndex) => slot.moves?.[moveIndex] || ""),
    };
  });
}

function saveCaught() {
  writeJson(storageKeys.caught, [...state.caught]);
}

function saveTeam() {
  writeJson(storageKeys.team, state.team);
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

function statsNode(stats, bst) {
  const wrapper = createElement("div", "stats");
  for (const [key, label] of Object.entries(statLabels)) {
    const item = createElement("span");
    item.append(createElement("b", "", label), document.createTextNode(String(stats[key] ?? 0)));
    wrapper.append(item);
  }
  const bstItem = createElement("span");
  bstItem.append(createElement("b", "", "BST"), document.createTextNode(String(bst || 0)));
  wrapper.append(bstItem);
  return wrapper;
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

function renderPokemonCard(entry) {
  const card = createElement("article", `pokemon-card ${state.caught.has(entry.constant) ? "is-caught" : ""}`);

  const caughtButton = createElement(
    "button",
    "caught-button",
    state.caught.has(entry.constant) ? "Caught" : "Mark caught",
  );
  caughtButton.type = "button";
  caughtButton.dataset.toggleCaught = entry.constant;
  const ball = createElement("span", "caught-button__ball");
  ball.setAttribute("aria-hidden", "true");
  caughtButton.prepend(ball);
  card.append(caughtButton);

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
  detailRow.append(pill(`${entry.levelUpLearnset.length} level moves`));
  if (entry.eggMoves.length) detailRow.append(pill(`${entry.eggMoves.length} egg moves`));
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

  const actions = createElement("div", "pokemon-actions");
  const teamButton = createElement("button", "mini-button", "Add To Team");
  teamButton.type = "button";
  teamButton.dataset.addTeam = entry.constant;
  actions.append(teamButton);
  card.append(actions);
  return card;
}

function renderDex(resetLimit = false) {
  if (resetLimit) state.dexLimit = 96;
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
      const text = [location.name, ...location.methods.flatMap((methodItem) => [methodItem.label, ...methodItem.species])]
        .join(" ")
        .toLowerCase();
      return !query || text.includes(query);
    });
}

function renderLocationCard(location) {
  const card = createElement("article", "location-card");
  const header = createElement("header");
  header.append(createElement("h2", "", location.name), pill(`${location.methods.length} methods`));
  card.append(header);
  for (const method of location.methods) {
    const block = createElement("section", "method-block");
    block.append(createElement("h3", "", `${method.label} (${method.species.length})`));
    const list = createElement("div", "species-list");
    method.species.forEach((name) => list.append(pill(name)));
    block.append(list);
    card.append(block);
  }
  return card;
}

function renderLocations() {
  const list = filteredLocations();
  const fragment = document.createDocumentFragment();
  list.forEach((location) => fragment.append(renderLocationCard(location)));
  elements.locationGrid.replaceChildren(fragment);
  elements.locationResultCount.textContent = `Showing ${list.length} locations`;
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
  });
}

function renderCaught() {
  const list = caughtFilteredPokemon();
  const caughtCount = pokemon.filter((entry) => state.caught.has(entry.constant)).length;
  const percent = pokemon.length ? Math.round((caughtCount / pokemon.length) * 100) : 0;
  elements.caughtSummary.textContent = `${caughtCount} of ${pokemon.length} caught`;
  elements.caughtProgress.style.width = `${percent}%`;

  const fragment = document.createDocumentFragment();
  list.forEach((entry) => {
    const row = createElement("label", "caught-row");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.caught.has(entry.constant);
    checkbox.dataset.caughtCheckbox = entry.constant;
    const identity = createElement("span", "caught-row__identity");
    identity.append(spriteWell(entry, "caught-row__sprite", 38));
    const copy = createElement("span", "caught-row__copy");
    copy.append(createElement("small", "", `#${entry.guideNumber}`), createElement("strong", "", entry.name));
    identity.append(copy);
    row.append(checkbox, identity);
    fragment.append(row);
  });
  elements.caughtList.replaceChildren(fragment);
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

function filteredMoves() {
  const query = elements.moveSearch.value.trim().toLowerCase();
  const source = elements.moveSourceFilter.value;
  return guideData.moves.filter((move) => {
    const isTutor = moveTutorNames.has(normalize(move.name));
    if (source === "levelUp" && !move.learners.levelUp.length) return false;
    if (source === "egg" && !move.learners.egg.length) return false;
    if (source === "tutor" && !isTutor) return false;
    if (!query) return true;
    const text = [
      move.name,
      move.constant,
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
  title.append(createElement("h2", "", move.name), createElement("p", "", move.constant));
  const counts = createElement("div", "pill-row");
  counts.append(pill(`${move.learners.levelUp.length} level`));
  if (move.learners.egg.length) counts.append(pill(`${move.learners.egg.length} egg`));
  if (moveTutorNames.has(normalize(move.name))) counts.append(pill("Tutor"));
  summary.append(title, counts);
  details.append(summary);

  const groups = createElement("div", "learner-groups");
  if (move.learners.levelUp.length) groups.append(renderLearners("Level-up learners", move.learners.levelUp));
  if (move.learners.egg.length) groups.append(renderLearners("Egg move learners", move.learners.egg));
  details.append(groups);
  return details;
}

function renderMoves() {
  const list = filteredMoves();
  const fragment = document.createDocumentFragment();
  list.slice(0, 180).forEach((move) => fragment.append(renderMoveCard(move)));
  if (!fragment.childNodes.length) fragment.append(emptyState("No moves matched the current filters."));
  elements.moveList.replaceChildren(fragment);
  elements.moveResultCount.textContent = `Showing ${Math.min(list.length, 180)} of ${list.length}`;
}

function renderMoveTutors() {
  const fragment = document.createDocumentFragment();
  guideData.frontier.moveTutors.forEach((tutor) => {
    const card = createElement("section", "tutor-card");
    card.append(createElement("h3", "", tutor.name), createElement("p", "", `${tutor.location} | ${tutor.availability}`));
    const moves = createElement("div", "pill-row");
    tutor.moves.forEach((move) => moves.append(pill(`${move.move}${move.cost ? ` (${move.cost})` : ""}`)));
    card.append(moves);
    fragment.append(card);
  });
  elements.moveTutors.replaceChildren(fragment);
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
    const identity = createElement("div", "team-card__identity");
    identity.append(spriteWell(entry, "team-sprite-well"));
    const copy = createElement("div");
    copy.append(createElement("span", "dex-number", `#${entry.guideNumber}`), createElement("h3", "", entry.name));
    copy.append(renderTypeRow(entry.types));
    identity.append(copy);
    card.append(identity);
  }

  const speciesLabel = createElement("label");
  speciesLabel.append(createElement("span", "", "Pokemon"));
  const select = document.createElement("select");
  select.dataset.teamSpecies = String(index);
  select.append(new Option("Empty slot", ""));
  pokemon.forEach((pokemonEntry) => {
    select.append(new Option(`#${pokemonEntry.guideNumber} ${pokemonEntry.name}`, pokemonEntry.constant));
  });
  select.value = slot.species;
  speciesLabel.append(select);
  card.append(speciesLabel);

  if (!entry) return card;

  card.append(statsNode(entry.stats, entry.bst));

  const abilityLabel = createElement("label");
  abilityLabel.append(createElement("span", "", "Ability"));
  const abilitySelect = document.createElement("select");
  abilitySelect.dataset.teamAbility = String(index);
  const abilities = [...entry.abilities, entry.hiddenAbility].filter(Boolean);
  abilities.forEach((ability) => abilitySelect.append(new Option(ability, ability)));
  if (!abilities.includes(slot.ability)) slot.ability = abilities[0] || "";
  abilitySelect.value = slot.ability;
  abilityLabel.append(abilitySelect);
  card.append(abilityLabel);

  const moves = moveChoicesForPokemon(entry);
  const moveGrid = createElement("div", "team-move-list");
  for (let moveIndex = 0; moveIndex < 4; moveIndex += 1) {
    const moveLabel = createElement("label");
    moveLabel.append(createElement("span", "", `Move ${moveIndex + 1}`));
    const moveSelect = document.createElement("select");
    moveSelect.dataset.teamMove = `${index}:${moveIndex}`;
    moveSelect.append(new Option("No move", ""));
    moves.forEach((move) => moveSelect.append(new Option(move.label, move.value)));
    if (!moves.some((move) => move.value === slot.moves[moveIndex])) slot.moves[moveIndex] = "";
    moveSelect.value = slot.moves[moveIndex];
    moveLabel.append(moveSelect);
    moveGrid.append(moveLabel);
  }
  card.append(moveGrid);

  if (entry.locations.length) {
    card.append(createElement("p", "", `Found: ${entry.locations.slice(0, 4).map((item) => item.location).join(", ")}`));
  }
  return card;
}

function updateOverview() {
  const caughtCount = pokemon.filter((entry) => state.caught.has(entry.constant)).length;
  elements.countPokemon.textContent = String(pokemon.length);
  elements.countCaught.textContent = String(caughtCount);
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
}

function populateFilters() {
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
    state.dexLimit += 96;
    renderDex();
  });

  elements.locationSearch.addEventListener("input", renderLocations);
  elements.methodFilter.addEventListener("change", renderLocations);
  elements.caughtSearch.addEventListener("input", renderCaught);
  elements.moveSearch.addEventListener("input", renderMoves);
  elements.moveSourceFilter.addEventListener("change", renderMoves);
  elements.itemSearch.addEventListener("input", renderItemTable);
  elements.itemTableFilter.addEventListener("change", renderItemTable);
  elements.stoneSearch.addEventListener("input", renderStones);

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

  document.querySelector("#mark-visible-caught").addEventListener("click", () => {
    caughtFilteredPokemon().forEach((entry) => state.caught.add(entry.constant));
    saveCaught();
    renderAll();
  });

  document.querySelector("#clear-visible-caught").addEventListener("click", () => {
    caughtFilteredPokemon().forEach((entry) => state.caught.delete(entry.constant));
    saveCaught();
    renderAll();
  });

  document.querySelector("#clear-team").addEventListener("click", () => {
    state.team = normalizeTeam([]);
    saveTeam();
    renderTeam();
    updateOverview();
  });

  document.addEventListener("click", (event) => {
    const caughtButton = event.target.closest("[data-toggle-caught]");
    if (caughtButton) {
      const constant = caughtButton.dataset.toggleCaught;
      if (state.caught.has(constant)) state.caught.delete(constant);
      else state.caught.add(constant);
      saveCaught();
      renderAll();
    }

    const teamButton = event.target.closest("[data-add-team]");
    if (teamButton) {
      const emptyIndex = state.team.findIndex((slot) => !slot.species);
      const index = emptyIndex === -1 ? 0 : emptyIndex;
      state.team[index] = { species: teamButton.dataset.addTeam, ability: "", moves: ["", "", "", ""] };
      saveTeam();
      switchView("team");
      renderTeam();
    }
  });

  document.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-caught-checkbox]");
    if (checkbox) {
      if (checkbox.checked) state.caught.add(checkbox.dataset.caughtCheckbox);
      else state.caught.delete(checkbox.dataset.caughtCheckbox);
      saveCaught();
      updateOverview();
      renderCaught();
    }

    const speciesSelect = event.target.closest("[data-team-species]");
    if (speciesSelect) {
      const index = Number(speciesSelect.dataset.teamSpecies);
      state.team[index] = { species: speciesSelect.value, ability: "", moves: ["", "", "", ""] };
      saveTeam();
      renderTeam();
    }

    const abilitySelect = event.target.closest("[data-team-ability]");
    if (abilitySelect) {
      state.team[Number(abilitySelect.dataset.teamAbility)].ability = abilitySelect.value;
      saveTeam();
    }

    const moveSelect = event.target.closest("[data-team-move]");
    if (moveSelect) {
      const [slotIndex, moveIndex] = moveSelect.dataset.teamMove.split(":").map(Number);
      state.team[slotIndex].moves[moveIndex] = moveSelect.value;
      saveTeam();
    }
  });
}

populateFilters();
bindEvents();
renderAll();

const initialView = location.hash.replace("#", "");
if (document.querySelector(`[data-view-panel="${initialView}"]`)) {
  switchView(initialView);
}
