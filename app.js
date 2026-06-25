const guideData = window.UNBOUND_GUIDE_DATA;

const storageKeys = {
  caught: "unbound-field-guide-caught-v1",
  team: "unbound-field-guide-team-v1",
  badges: "unbound-field-guide-badges-v1",
  theme: "unbound-field-guide-theme-v1",
  syncCode: "unbound-field-guide-sync-code-v1",
  saveMetadata: "unbound-field-guide-save-metadata-v1",
  syncContext: "unbound-field-guide-sync-context-v1",
  localBackups: "unbound-field-guide-local-backups-v1",
};

const saveFormat = "unbound-field-guide-save";
const saveVersion = 1;
const syncEndpoint = (window.UNBOUND_SYNC_ENDPOINT || "").replace(/\/+$/, "");
const maxLocalBackups = 5;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
const TOTAL_BADGES = 8;
const typeChart = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: {
    Fire: 0.5,
    Water: 2,
    Grass: 0.5,
    Poison: 0.5,
    Ground: 2,
    Flying: 0.5,
    Bug: 0.5,
    Rock: 2,
    Dragon: 0.5,
    Steel: 0.5,
  },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: {
    Normal: 2,
    Ice: 2,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Rock: 2,
    Ghost: 0,
    Dark: 2,
    Steel: 2,
    Fairy: 0.5,
  },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

const elements = {
  overviewTeamCount: document.querySelector("#overview-team-count"),
  overviewTeamList: document.querySelector("#overview-team-list"),
  countCaught: document.querySelector("#count-caught"),
  countCaughtTotal: document.querySelector("#count-caught-total"),
  overviewCaughtProgress: document.querySelector("#overview-caught-progress"),
  overviewCaughtPercent: document.querySelector("#overview-caught-percent"),
  overviewCaughtRemaining: document.querySelector("#overview-caught-remaining"),
  badgeCount: document.querySelector("#badge-count"),
  badgeTotal: document.querySelector("#badge-total"),
  overviewBadgeProgress: document.querySelector("#overview-badge-progress"),
  badgeSlotList: document.querySelector("#badge-slot-list"),
  badgeDecrease: document.querySelector("#badge-decrease"),
  badgeIncrease: document.querySelector("#badge-increase"),
  dexSearch: document.querySelector("#dex-search"),
  typeFilter: document.querySelector("#type-filter"),
  locationFilter: document.querySelector("#location-filter"),
  dexGrid: document.querySelector("#dex-grid"),
  dexResultCount: document.querySelector("#dex-result-count"),
  dexLoadMore: document.querySelector("#dex-load-more"),
  typeQuickFilters: document.querySelector("#type-quick-filters"),
  locationSearch: document.querySelector("#location-search"),
  locationGrid: document.querySelector("#location-grid"),
  locationLoadMore: document.querySelector("#location-load-more"),
  locationResultCount: document.querySelector("#location-result-count"),
  specialEncounters: document.querySelector("#special-encounters"),
  tradeSwarmSummary: document.querySelector("#trade-swarm-summary"),
  caughtSummary: document.querySelector("#caught-summary"),
  caughtProgress: document.querySelector("#caught-progress"),
  caughtSearch: document.querySelector("#caught-search"),
  caughtFilter: document.querySelector("#caught-filter"),
  caughtTypeQuickFilters: document.querySelector("#caught-type-quick-filters"),
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
  battleOpponentOne: document.querySelector("#battle-opponent-1"),
  battleOpponentTwo: document.querySelector("#battle-opponent-2"),
  battleSummary: document.querySelector("#battle-summary"),
  battleSuggestions: document.querySelector("#battle-suggestions"),
  saveCaughtCount: document.querySelector("#save-caught-count"),
  saveTeamCount: document.querySelector("#save-team-count"),
  saveLocalRevision: document.querySelector("#save-local-revision"),
  saveLocalModified: document.querySelector("#save-local-modified"),
  importSaveFile: document.querySelector("#import-save-file"),
  syncCode: document.querySelector("#sync-code"),
  syncServiceStatus: document.querySelector("#sync-service-status"),
  syncFreshness: document.querySelector("#sync-freshness"),
  syncFreshnessTitle: document.querySelector("#sync-freshness-title"),
  syncFreshnessDetail: document.querySelector("#sync-freshness-detail"),
  syncConflictActions: document.querySelector("#sync-conflict-actions"),
  syncRecoveryList: document.querySelector("#sync-recovery-list"),
  saveOperationStatus: document.querySelector("#save-operation-status"),
  movePopup: document.querySelector("#move-popup"),
  movePopupContext: document.querySelector("#move-popup-context"),
  movePopupTitle: document.querySelector("#move-popup-title"),
  movePopupBody: document.querySelector("#move-popup-body"),
  backToTop: document.querySelector("#back-to-top"),
};

const INITIAL_CARD_BATCH = 50;

const state = {
  view: "dex",
  dexLimit: INITIAL_CARD_BATCH,
  locationLimit: INITIAL_CARD_BATCH,
  caughtLimit: INITIAL_CARD_BATCH,
  moveLimit: INITIAL_CARD_BATCH,
  caught: new Set(readJson(storageKeys.caught, [])),
  team: normalizeTeam(readJson(storageKeys.team, [])),
  badges: Math.max(0, Math.min(TOTAL_BADGES, Number(readJson(storageKeys.badges, 0)) || 0)),
  caughtFilter: "all",
  caughtTypeFilter: "all",
  syncCode: localStorage.getItem(storageKeys.syncCode) || "",
  saveMetadata: loadSaveMetadata(),
  syncContext: loadSyncContext(),
  syncSnapshot: null,
  syncStatus: "unchecked",
  cloudHistory: [],
  battleOpponents: ["", ""],
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

function loadSaveMetadata() {
  const stored = readJson(storageKeys.saveMetadata, {});
  return {
    deviceId: uuidPattern.test(stored.deviceId || "") ? stored.deviceId : crypto.randomUUID(),
    revision: Number.isInteger(stored.revision) && stored.revision >= 0 ? stored.revision : 0,
    modifiedAt: typeof stored.modifiedAt === "string" ? stored.modifiedAt : null,
  };
}

function loadSyncContext() {
  const stored = readJson(storageKeys.syncContext, {});
  return {
    code: typeof stored.code === "string" ? stored.code : "",
    lastSyncedRevision:
      Number.isInteger(stored.lastSyncedRevision) && stored.lastSyncedRevision >= 0
        ? stored.lastSyncedRevision
        : null,
    lastSyncedFingerprint:
      typeof stored.lastSyncedFingerprint === "string" ? stored.lastSyncedFingerprint : "",
    lastSyncedAt: typeof stored.lastSyncedAt === "string" ? stored.lastSyncedAt : null,
  };
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

function cleanTeamNickname(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 24);
}

function validAbilityForSpecies(species, ability) {
  const entry = pokemonByConstant.get(species);
  if (!entry) return "";
  const abilities = [...entry.abilities, entry.hiddenAbility].filter(Boolean);
  return abilities.includes(ability) ? ability : abilities[0] || "";
}

function validMoveName(value) {
  const match = moveMetadataByName.get(normalize(value));
  return match?.name || "";
}

function validNatureName(value) {
  return natureByName.has(value) ? value : "Hardy";
}

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function formatSaveDate(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function pokemonFromTeamSearch(value) {
  return pokemonBySearchName.get(normalize(value));
}

function teamSpeciesSuggestions(query, limit = 8) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  const startsWith = [];
  const contains = [];
  pokemon.forEach((entry) => {
    const name = normalize(entry.name);
    if (name.startsWith(normalizedQuery)) startsWith.push(entry);
    else if (name.includes(normalizedQuery)) contains.push(entry);
  });
  return [...startsWith, ...contains].slice(0, limit);
}

function renderTeamSpeciesSuggestionList(input, index) {
  const field = input.closest(".team-species-field");
  if (!field) return;
  const list = field.querySelector("[data-team-species-suggestions]");
  if (!list) return;
  const suggestions = teamSpeciesSuggestions(input.value);
  if (!suggestions.length) {
    list.replaceChildren();
    list.hidden = true;
    return;
  }
  const fragment = document.createDocumentFragment();
  suggestions.forEach((entry) => {
    const button = createElement("button", "team-species-suggestion");
    button.type = "button";
    button.dataset.teamSpeciesPick = `${index}:${entry.constant}`;
    button.textContent = entry.name;
    fragment.append(button);
  });
  list.replaceChildren(fragment);
  list.hidden = false;
}

function battleOpponentInputByIndex(index) {
  return index === 0 ? elements.battleOpponentOne : elements.battleOpponentTwo;
}

function setBattleOpponent(index, constant) {
  state.battleOpponents[index] = pokemonByConstant.has(constant) ? constant : "";
  const input = battleOpponentInputByIndex(index);
  if (input) input.value = state.battleOpponents[index] ? pokemonByConstant.get(state.battleOpponents[index]).name : "";
}

function renderBattleOpponentSuggestionList(input, index) {
  const field = input.closest(".battle-opponent-field");
  if (!field) return;
  const list = field.querySelector("[data-battle-opponent-suggestions]");
  if (!list) return;
  const suggestions = teamSpeciesSuggestions(input.value);
  if (!suggestions.length) {
    list.replaceChildren();
    list.hidden = true;
    return;
  }
  const fragment = document.createDocumentFragment();
  suggestions.forEach((entry) => {
    const button = createElement("button", "team-species-suggestion");
    button.type = "button";
    button.dataset.battleOpponentPick = `${index}:${entry.constant}`;
    button.textContent = entry.name;
    fragment.append(button);
  });
  list.replaceChildren(fragment);
  list.hidden = false;
}

function teamEvolutionTargets(entry) {
  return entry.evolutions
    .map((evolution) => ({
      evolution,
      target: pokemonByConstant.get(evolution.target),
    }))
    .filter((item) => item.target);
}

function evolveTeamSlot(index, targetConstant) {
  const current = state.team[index] || createTeamSlot("");
  const target = pokemonByConstant.get(targetConstant);
  if (!target) return;
  const evolved = createTeamSlot(target.constant, current);
  evolved.nickname = current.nickname;
  evolved.nature = current.nature;
  evolved.ability = validAbilityForSpecies(target.constant, current.ability);
  const allowedMoves = new Set(moveChoicesForPokemon(target).map((move) => move.value));
  evolved.moves = current.moves.map((move) => (allowedMoves.has(move) ? move : ""));
  state.team[index] = evolved;
  const newlyCaught = !state.caught.has(target.constant);
  state.caught.add(target.constant);
  saveTeam();
  if (newlyCaught) saveCaught();
  renderAll();
  switchView("team");
}

function saveCaught() {
  writeJson(storageKeys.caught, [...state.caught]);
  markSaveModified();
}

function saveTeam() {
  writeJson(storageKeys.team, state.team);
  markSaveModified();
  updateOverview();
  renderBattlePlanner();
}

function saveBadges() {
  writeJson(storageKeys.badges, state.badges);
  markSaveModified();
}

function persistSaveMetadata() {
  writeJson(storageKeys.saveMetadata, state.saveMetadata);
}

function persistSyncContext() {
  writeJson(storageKeys.syncContext, state.syncContext);
}

function ensureSyncContext(code) {
  if (state.syncContext.code === code) return;
  state.syncContext = {
    code,
    lastSyncedRevision: null,
    lastSyncedFingerprint: "",
    lastSyncedAt: null,
  };
  state.syncSnapshot = null;
  state.cloudHistory = [];
  persistSyncContext();
  renderRecoveryBackups();
}

function markSaveModified() {
  state.saveMetadata.revision = Math.max(0, state.saveMetadata.revision) + 1;
  state.saveMetadata.modifiedAt = new Date().toISOString();
  persistSaveMetadata();
  state.syncSnapshot = null;
  if (state.syncCode && syncEndpoint) setSyncFreshness("local-newer");
  updateSaveSummary();
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

function quickTypeButton(type) {
  const label = type === "all" ? "All" : type;
  const button = pillButton(label, { quickType: type });
  button.classList.add("type-quick-filter");
  if (type !== "all") button.classList.add(`type-${normalize(type)}`);
  if (elements.typeFilter.value === type) button.classList.add("is-active");
  return button;
}

function caughtQuickTypeButton(type) {
  const label = type === "all" ? "All" : type;
  const button = pillButton(label, { caughtQuickType: type });
  button.classList.add("type-quick-filter", "caught-type-quick-filter");
  if (type !== "all") button.classList.add(`type-${normalize(type)}`);
  if (state.caughtTypeFilter === type) button.classList.add("is-active");
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

function teamDisplayName(slot, entry) {
  return slot.nickname.trim() || entry?.name || "Empty";
}

function spriteWell(entry, className = "sprite-well", size = 96) {
  const well = createElement("span", className);
  well.append(imageNode(entry?.sprite || "assets/pokeball-slot.svg", entry ? `${entry.name} sprite` : "Empty slot", size, size));
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

  const identity = createElement("div", "pokemon-card__identity");
  identity.append(spriteWell(entry));
  const titleBlock = createElement("div", "pokemon-card__title");
  const topLine = createElement("div", "pokemon-card__topline");
  topLine.append(createElement("span", "dex-number", `#${entry.guideNumber}`), caughtToggleButton(entry.constant, true));
  titleBlock.append(topLine);
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
    includePlaceholders: false,
    search: elements.dexSearch.value,
    type: elements.typeFilter.value,
    location: elements.locationFilter.value,
  });
  const fragment = document.createDocumentFragment();
  list.slice(0, state.dexLimit).forEach((entry) => fragment.append(renderPokemonCard(entry)));
  elements.dexGrid.replaceChildren(fragment);
  elements.dexResultCount.textContent = `Showing ${Math.min(list.length, state.dexLimit)} of ${list.length}`;
  elements.dexLoadMore.hidden = state.dexLimit >= list.length;
  renderDexQuickFilters();
  scheduleAutoLoad("dex");
}

function renderDexQuickFilters() {
  const typeOptions = ["all", ...new Set(pokemon.flatMap((entry) => entry.types))].sort((a, b) =>
    a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b),
  );
  elements.typeQuickFilters.replaceChildren(...typeOptions.map((type) => quickTypeButton(type)));
}

function renderCaughtQuickFilters() {
  const typeOptions = ["all", ...new Set(pokemon.flatMap((entry) => entry.types))].sort((a, b) =>
    a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b),
  );
  elements.caughtTypeQuickFilters.replaceChildren(...typeOptions.map((type) => caughtQuickTypeButton(type)));
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
  return guideData.locations
    .map((location) => {
      const methods = location.methods;
      const hasWikiMetadata = Boolean(
        location.mapUrl ||
          location.pageUrl ||
          location.exits?.length ||
          location.pointsOfInterest?.length ||
          location.itemLocations?.length,
      );
      return { ...location, methods, hasWikiMetadata };
    })
    .filter((location) => {
      if (!location.methods.length && !location.hasWikiMetadata) return false;
      const text = [
        location.name,
        ...location.methods.flatMap((methodItem) => [methodItem.label, ...locationMethodEntries(methodItem).map((entry) => entry.species)]),
        ...(location.exits || []),
        ...(location.pointsOfInterest || []),
        ...(location.itemLocations || []),
        ...((location.exitsRows || []).flatMap((row) => [row.ref, ...(row.columns || [])])),
        ...((location.pointsOfInterestRows || []).flatMap((row) => [row.ref, ...(row.columns || [])])),
        ...((location.itemLocationRows || []).flatMap((row) => [row.ref, ...(row.columns || []), row.imageLink || ""])),
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
  const actions = createElement("div", "location-card__actions");
  if (location.mapUrl) {
    const mapButton = createElement("a", "text-button location-card__action", "Open Map");
    mapButton.href = location.mapUrl;
    mapButton.target = "_blank";
    mapButton.rel = "noopener noreferrer";
    actions.append(mapButton);
  }
  if (location.pageUrl) {
    const wikiButton = createElement("a", "text-button location-card__action", "Wiki Page");
    wikiButton.href = location.pageUrl;
    wikiButton.target = "_blank";
    wikiButton.rel = "noopener noreferrer";
    actions.append(wikiButton);
  }
  if (actions.childNodes.length) header.append(actions);
  card.append(header);

  const mapPreviewUrl = (mapUrl) => {
    if (!mapUrl) return "";
    return mapUrl.replace("-fullsize", "");
  };

  const buildMetadataSection = (title, items, rows = []) => {
    const rowData = Array.isArray(rows) ? rows.filter((row) => Array.isArray(row.columns) && row.columns.length) : [];
    if (!Array.isArray(items) || (!items.length && !rowData.length)) return null;
    const section = createElement("section", "location-meta-section");
    section.append(createElement("h3", "", title));
    if (rowData.length) {
      if (title === "Item locations") {
        const list = createElement("div", "location-item-list");
        rowData.slice(0, 40).forEach((row) => {
          const item = createElement("article", "location-item-entry");
          const itemName = row.columns[0] || "Item";
          const description = row.columns.slice(1).join(" • ");
          item.append(createElement("strong", "location-item-name", itemName));
          if (description) item.append(createElement("div", "location-item-detail", description));
          if (row.imageLink) {
            const actions = createElement("div", "location-item-actions");
            const imageLink = createElement("button", "location-image-link", "View image");
            imageLink.type = "button";
            imageLink.dataset.openLocationImage = row.imageLink;
            imageLink.dataset.locationImageLabel = itemName;
            actions.append(imageLink);
            item.append(actions);
          }
          list.append(item);
        });
        section.append(list);
        return section;
      }
      const table = createElement("table", "location-reference-table");
      const body = document.createElement("tbody");
      const hasRef = rowData.some((row) => String(row.ref || "").trim().length || row.markerIcon);
      rowData.slice(0, 40).forEach((row) => {
        const tr = document.createElement("tr");
        if (hasRef) {
          const refCell = document.createElement("th");
          if (row.markerIcon) {
            const icon = imageNode(row.markerIcon, row.ref || "Map marker", 24, 24);
            icon.classList.add("location-marker-icon");
            refCell.append(icon);
          } else {
            refCell.textContent = row.ref || "";
          }
          tr.append(refCell);
        }
        const detailCell = document.createElement("td");
        const text = row.columns.join(" • ");
        detailCell.append(document.createTextNode(text));
        tr.append(detailCell);
        body.append(tr);
      });
      table.append(body);
      section.append(table);
    } else {
      const list = createElement("ul", "location-meta-list");
      items.slice(0, 24).forEach((item) => {
        list.append(createElement("li", "", item));
      });
      section.append(list);
    }
    return section;
  };

  const mapAndMeta = createElement("section", "location-map-meta");
  if (location.mapUrl) {
    const mapPane = createElement("a", "location-map-pane");
    mapPane.href = location.mapUrl;
    mapPane.target = "_blank";
    mapPane.rel = "noopener noreferrer";
    mapPane.append(createElement("strong", "", "Map preview"));
    mapPane.append(imageNode(mapPreviewUrl(location.mapUrl), `${location.name} map`, 640, 380));
    mapAndMeta.append(mapPane);
  }

  const metadataPane = createElement("div", "location-map-meta__details");
  const appendToMetadataPane = (title, items, rows) => {
    const section = buildMetadataSection(title, items, rows);
    if (section) metadataPane.append(section);
  };

  appendToMetadataPane("Points of interest", location.pointsOfInterest, location.pointsOfInterestRows);
  appendToMetadataPane("Exits", location.exits, location.exitsRows);
  appendToMetadataPane("Item locations", location.itemLocations, location.itemLocationRows);
  if (metadataPane.childNodes.length) mapAndMeta.append(metadataPane);
  if (mapAndMeta.childNodes.length) card.append(mapAndMeta);

  if (!location.methods.length) {
    card.append(emptyState("No wild encounter records for this location in the current guide data."));
    return card;
  }

  for (const method of location.methods) {
    const block = createElement("section", "method-block");
    const encounters = locationMethodEntries(method);
    block.append(createElement("h3", "", method.label));
    const list = createElement("div", "location-pokemon-list");
    encounters.forEach((encounter) => list.append(renderLocationPokemonRow(encounter)));
    block.append(list);
    card.append(block);
  }
  return card;
}

function renderLocations() {
  const list = filteredLocations();
  const visible = list.slice(0, state.locationLimit);
  elements.locationResultCount.textContent = `Showing ${visible.length} of ${list.length} locations`;
  if (!list.length) {
    elements.locationGrid.replaceChildren(emptyState("No locations matched the current filters."));
    elements.locationLoadMore.hidden = true;
    return;
  }
  const fragment = document.createDocumentFragment();
  visible.forEach((location) => fragment.append(renderLocationCard(location)));
  elements.locationGrid.replaceChildren(fragment);
  elements.locationLoadMore.hidden = visible.length >= list.length;
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
    if (state.caughtTypeFilter !== "all" && !entry.types.includes(state.caughtTypeFilter)) return false;
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
    const topLine = createElement("div", "caught-row__topline");
    topLine.append(createElement("small", "", `#${entry.guideNumber}`), caughtToggleButton(entry.constant, true));
    row.append(topLine);
    const identity = createElement("div", "caught-row__identity");
    identity.append(spriteWell(entry, "caught-row__sprite", 66));
    const copy = createElement("span", "caught-row__copy");
    copy.append(createElement("strong", "", entry.name), renderTypeRow(entry.types));
    identity.append(copy);
    row.append(identity);
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

function openLocationImagePopup(imageUrl, label) {
  if (!imageUrl) return;
  elements.movePopupTitle.textContent = "Location image";
  elements.movePopupContext.textContent = label || "Location item reference";
  const wrapper = createElement("div", "location-image-popup");
  const link = createElement("a", "location-image-popup__link");
  link.href = imageUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.append(imageNode(imageUrl, label || "Location image", 1200, 720));
  wrapper.append(link);
  elements.movePopupBody.replaceChildren(wrapper);
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
      includePlaceholders: false,
      search: elements.dexSearch.value,
      type: elements.typeFilter.value,
      location: elements.locationFilter.value,
    }).length;
    return state.dexLimit < total;
  }
  if (view === "caught") {
    return state.caughtLimit < caughtFilteredPokemon().length;
  }
  if (view === "locations") {
    return state.locationLimit < filteredLocations().length;
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
  if (view === "locations" && canAutoLoad("locations")) {
    state.locationLimit += INITIAL_CARD_BATCH;
    renderLocations();
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
  speciesLabel.className = "team-species-field";
  speciesLabel.append(createElement("span", "", "Pokemon"));
  const speciesSearch = document.createElement("input");
  speciesSearch.type = "search";
  speciesSearch.placeholder = "Search Pokemon";
  speciesSearch.autocomplete = "off";
  speciesSearch.dataset.teamSpeciesSearch = String(index);
  speciesSearch.value = entry?.name || "";
  speciesLabel.append(speciesSearch);
  const speciesSuggestions = createElement("div", "team-species-suggestions");
  speciesSuggestions.dataset.teamSpeciesSuggestions = String(index);
  speciesSuggestions.hidden = true;
  speciesLabel.append(speciesSuggestions);
  card.append(speciesLabel);

  if (!entry) return card;

  const evolutionTargets = teamEvolutionTargets(entry);
  if (evolutionTargets.length) {
    const evolutionActions = createElement("div", "team-evolution-actions");
    evolutionActions.append(createElement("span", "card-label", "Evolution"));
    const actionsRow = createElement("div", "team-evolution-actions__row");
    evolutionTargets.forEach(({ target, evolution }) => {
      const action = createElement("button", "mini-button team-evolution-button");
      action.type = "button";
      action.dataset.teamEvolve = `${index}:${target.constant}`;
      action.textContent = evolution.method ? `Evolve to ${target.name} (${evolution.method})` : `Evolve to ${target.name}`;
      actionsRow.append(action);
    });
    evolutionActions.append(actionsRow);
    card.append(evolutionActions);
  }

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

function typeEffectivenessMultiplier(attackType, defenderTypes) {
  return defenderTypes.reduce((multiplier, defenderType) => {
    const relation = typeChart[attackType]?.[defenderType];
    return multiplier * (relation === undefined ? 1 : relation);
  }, 1);
}

function formatMultiplier(multiplier) {
  if (!Number.isFinite(multiplier)) return "1x";
  if (Number.isInteger(multiplier)) return `${multiplier}x`;
  return `${multiplier.toFixed(2).replace(/\.00$/, "")}x`;
}

function offensiveMovesForSlot(slot) {
  return slot.moves
    .map((moveName) => {
      const metadata = moveMetadataByName.get(normalize(moveName));
      if (!metadata?.type || metadata.category === "Status") return null;
      return { name: moveName, type: metadata.type };
    })
    .filter(Boolean);
}

function bestCoverageMoveAgainst(slot, opponent) {
  const offensiveMoves = offensiveMovesForSlot(slot);
  let best = null;
  offensiveMoves.forEach((move) => {
    const multiplier = typeEffectivenessMultiplier(move.type, opponent.types);
    if (!best || multiplier > best.multiplier) {
      best = { ...move, multiplier };
    }
  });
  return best;
}

function defensiveThreatAgainst(slotEntry, opponents) {
  if (!slotEntry) return { multiplier: 1, type: "" };
  let worst = { multiplier: 1, type: "" };
  opponents.forEach((opponent) => {
    opponent.types.forEach((attackType) => {
      const multiplier = typeEffectivenessMultiplier(attackType, slotEntry.types);
      if (multiplier > worst.multiplier) worst = { multiplier, type: attackType };
    });
  });
  return worst;
}

function recommendBattleTeam(opponents) {
  const required = Math.min(Math.max(opponents.length, 1), 2);
  const candidates = state.team
    .map((slot, index) => ({ slot, index, entry: pokemonByConstant.get(slot.species) }))
    .filter((item) => item.entry);
  if (!candidates.length) return [];

  const scored = candidates.map((candidate) => {
    const coverage = opponents.map((opponent) => ({
      opponent,
      bestMove: bestCoverageMoveAgainst(candidate.slot, opponent),
    }));
    const superEffectiveCount = coverage.filter((item) => item.bestMove && item.bestMove.multiplier > 1).length;
    const coverageScore = coverage.reduce((sum, item) => sum + (item.bestMove?.multiplier || 0), 0);
    const threat = defensiveThreatAgainst(candidate.entry, opponents);
    const weaknessPenalty = Math.max(0, threat.multiplier - 1);
    const score = superEffectiveCount * 120 + coverageScore * 12 - weaknessPenalty * 40;
    return {
      ...candidate,
      score,
      coverage,
      threat,
      superEffectiveCount,
    };
  });

  const eligible = scored.filter((item) => item.superEffectiveCount > 0);
  eligible.sort((a, b) => b.score - a.score || b.superEffectiveCount - a.superEffectiveCount || b.entry.bst - a.entry.bst);
  return eligible.slice(0, required);
}

function renderBattlePlanner() {
  if (!elements.battleSuggestions || !elements.battleOpponentOne || !elements.battleOpponentTwo || !elements.battleSummary) return;

  const selected = state.battleOpponents
    .filter(Boolean)
    .filter((constant, index, list) => list.indexOf(constant) === index)
    .map((constant) => pokemonByConstant.get(constant))
    .filter(Boolean);

  if (!selected.length) {
    elements.battleSummary.textContent = "Pick up to 2 opponents to see team recommendations.";
    elements.battleSuggestions.replaceChildren(emptyState("Choose at least one opposing Pokemon to generate battle picks."));
    return;
  }

  const recommendations = recommendBattleTeam(selected);
  const needed = Math.min(selected.length, 2);
  elements.battleSummary.textContent = `Selected ${selected.length} opponent${selected.length > 1 ? "s" : ""}. Showing ${Math.min(recommendations.length, needed)} recommendation${needed > 1 ? "s" : ""}.`;

  if (!recommendations.length) {
    elements.battleSuggestions.replaceChildren(
      emptyState("No team slot currently has a damaging super-effective move against the selected opponent(s)."),
    );
    return;
  }

  const fragment = document.createDocumentFragment();
  recommendations.forEach((recommendation) => {
    const card = createElement("article", "battle-suggestion-card");
    const header = createElement("header", "battle-suggestion-card__header");
    header.append(spriteWell(recommendation.entry, "battle-suggestion-card__sprite", 64));
    const title = createElement("div");
    title.append(
      createElement("small", "", `Slot ${recommendation.index + 1}`),
      createElement("h3", "", teamDisplayName(recommendation.slot, recommendation.entry)),
    );
    if (recommendation.slot.nickname.trim()) title.append(createElement("p", "team-species-name", recommendation.entry.name));
    header.append(title);
    card.append(header, renderTypeRow(recommendation.entry.types));

    const coverageList = createElement("div", "battle-coverage-list");
    recommendation.coverage.forEach(({ opponent, bestMove }) => {
      const row = createElement("div", "battle-coverage-row");
      row.append(createElement("strong", "", `vs ${opponent.name}`));
      if (!bestMove) {
        row.append(createElement("span", "", "No damaging move selected"));
      } else {
        row.append(
          createElement(
            "span",
            "",
            `${bestMove.name} (${bestMove.type}) · ${formatMultiplier(bestMove.multiplier)}${bestMove.multiplier > 1 ? " super effective" : ""}`,
          ),
        );
      }
      coverageList.append(row);
    });
    card.append(coverageList);

    if (recommendation.threat.multiplier > 1) {
      card.append(
        createElement(
          "p",
          "battle-warning",
          `Risk: weak to ${recommendation.threat.type}-type pressure (${formatMultiplier(recommendation.threat.multiplier)}) from selected opponent(s).`,
        ),
      );
    } else {
      card.append(createElement("p", "battle-safe", "No major type weakness detected against the selected opponent types."));
    }
    fragment.append(card);
  });
  elements.battleSuggestions.replaceChildren(fragment);
}

function updateOverview() {
  const currentCaughtCount = caughtCount();
  const selectedTeam = state.team.map((slot) => ({ slot, entry: pokemonByConstant.get(slot.species) || null }));
  const activeTeam = selectedTeam.filter((item) => item.entry);
  const caughtPercent = pokemon.length ? Math.round((currentCaughtCount / pokemon.length) * 100) : 0;
  const badgePercent = TOTAL_BADGES ? Math.round((state.badges / TOTAL_BADGES) * 100) : 0;

  elements.overviewTeamCount.textContent = `${activeTeam.length} / 6`;
  const teamFragment = document.createDocumentFragment();
  selectedTeam.forEach(({ slot, entry }) => {
    const item = createElement("div", `overview-team-slot${entry ? "" : " is-empty"}`);
    const sprite = entry
      ? spriteWell(entry, "overview-team-slot__sprite has-entry", 96)
      : spriteWell(null, "overview-team-slot__sprite is-placeholder", 96);
    item.append(sprite);
    const copy = createElement("span", "overview-team-slot__copy");
    copy.append(createElement("strong", "", teamDisplayName(slot, entry)));
    item.append(copy);
    teamFragment.append(item);
  });
  elements.overviewTeamList.replaceChildren(teamFragment);

  elements.countCaught.textContent = String(currentCaughtCount);
  elements.countCaughtTotal.textContent = String(pokemon.length);
  elements.overviewCaughtProgress.style.width = `${caughtPercent}%`;
  elements.overviewCaughtPercent.textContent = `${caughtPercent}%`;
  elements.overviewCaughtRemaining.textContent = `${Math.max(0, pokemon.length - currentCaughtCount)} remaining`;

  elements.badgeCount.textContent = String(state.badges);
  elements.badgeTotal.textContent = String(TOTAL_BADGES);
  elements.overviewBadgeProgress.style.width = `${badgePercent}%`;
  elements.badgeDecrease.disabled = state.badges <= 0;
  elements.badgeIncrease.disabled = state.badges >= TOTAL_BADGES;
  const badgeFragment = document.createDocumentFragment();
  for (let index = 0; index < TOTAL_BADGES; index += 1) {
    badgeFragment.append(createElement("span", `badge-slot${index < state.badges ? " is-earned" : ""}`));
  }
  elements.badgeSlotList.replaceChildren(badgeFragment);
}

function updateSaveSummary() {
  if (!elements.saveCaughtCount) return;
  elements.saveCaughtCount.textContent = String(caughtCount());
  elements.saveTeamCount.textContent = String(state.team.filter((slot) => slot.species).length);
  elements.saveLocalRevision.textContent = String(state.saveMetadata.revision);
  elements.saveLocalModified.textContent = formatSaveDate(state.saveMetadata.modifiedAt);
}

function createSaveDocument({ parentRevision = state.syncContext.lastSyncedRevision } = {}) {
  return {
    format: saveFormat,
    version: saveVersion,
    exportedAt: new Date().toISOString(),
    caught: [...state.caught].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    badges: state.badges,
    team: state.team.map((slot) => ({
      species: slot.species,
      nickname: cleanTeamNickname(slot.nickname),
      ability: slot.ability,
      nature: validNatureName(slot.nature),
      moves: slot.moves.map((move) => validMoveName(move)),
    })),
    preferences: {
      theme: currentTheme(),
    },
    sync: {
      revision: state.saveMetadata.revision,
      parentRevision,
      modifiedAt: state.saveMetadata.modifiedAt,
      deviceId: state.saveMetadata.deviceId,
    },
  };
}

function validateTeamSnapshot(input) {
  return Array.from({ length: 6 }, (_, index) => {
    const slot = Array.isArray(input) ? input[index] || {} : {};
    const species = pokemonByConstant.has(slot.species) ? slot.species : "";
    const validated = createTeamSlot(species, {
      nickname: cleanTeamNickname(slot.nickname),
      nature: validNatureName(slot.nature),
      moves: Array.from({ length: 4 }, (__, moveIndex) => validMoveName(slot.moves?.[moveIndex])),
    });
    validated.ability = validAbilityForSpecies(species, slot.ability);
    return validated;
  });
}

function validateSaveDocument(input) {
  if (!input || input.format !== saveFormat || input.version !== saveVersion) {
    throw new Error("This is not a supported Pokemon Unbound Field Guide save.");
  }
  if (!Array.isArray(input.caught) || !Array.isArray(input.team)) {
    throw new Error("The save is missing caught progress or team data.");
  }
  const caught = [...new Set(input.caught.filter((constant) => pokemonByConstant.has(constant)))];
  const badges = Math.max(0, Math.min(TOTAL_BADGES, Number(input.badges) || 0));
  const team = validateTeamSnapshot(input.team);
  const revision = Number(input.sync?.revision);
  const parentRevision = input.sync?.parentRevision;
  return {
    format: saveFormat,
    version: saveVersion,
    exportedAt: typeof input.exportedAt === "string" ? input.exportedAt : null,
    caught,
    badges,
    team,
    preferences: {
      theme: input.preferences?.theme === "dark" ? "dark" : "light",
    },
    sync: {
      revision: Number.isInteger(revision) && revision >= 0 ? revision : 0,
      parentRevision:
        parentRevision === null || (Number.isInteger(parentRevision) && parentRevision >= 0) ? parentRevision : null,
      modifiedAt:
        typeof input.sync?.modifiedAt === "string"
          ? input.sync.modifiedAt
          : typeof input.exportedAt === "string"
            ? input.exportedAt
            : null,
      deviceId: uuidPattern.test(input.sync?.deviceId || "") ? input.sync.deviceId : null,
    },
  };
}

function readLocalBackups() {
  const backups = readJson(storageKeys.localBackups, []);
  return Array.isArray(backups) ? backups : [];
}

function renderRecoveryBackups() {
  if (!elements.syncRecoveryList) return;
  const entries = [];
  readLocalBackups().forEach((backup) => {
    entries.push(`
      <article class="sync-recovery-entry">
        <div><strong>Local backup</strong><span>${formatSaveDate(backup.createdAt)} · ${backup.reason}</span></div>
        <button type="button" data-restore-local="${backup.id}">Restore</button>
      </article>
    `);
  });
  state.cloudHistory.forEach((version) => {
    entries.push(`
      <article class="sync-recovery-entry">
        <div><strong>Cloud revision ${version.revision}</strong><span>${formatSaveDate(version.modifiedAt || version.updatedAt)}</span></div>
        <button type="button" data-restore-cloud="${version.versionId}">Restore locally</button>
      </article>
    `);
  });
  elements.syncRecoveryList.innerHTML = entries.join("") || '<p class="sync-recovery-empty">No recovery versions yet.</p>';
}

function saveLocalBackup(reason) {
  const backups = readLocalBackups();
  backups.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    reason,
    save: createSaveDocument(),
  });
  writeJson(storageKeys.localBackups, backups.slice(0, maxLocalBackups));
  renderRecoveryBackups();
}

function applySaveDocument(input, { source = "import", createBackup = true } = {}) {
  const save = validateSaveDocument(input);
  if (createBackup) {
    saveLocalBackup(source === "cloud" ? "Before loading cloud save" : "Before replacing local save");
  }
  state.caught = new Set(save.caught);
  state.badges = save.badges;
  state.team = validateTeamSnapshot(save.team);
  writeJson(storageKeys.caught, [...state.caught]);
  writeJson(storageKeys.badges, state.badges);
  writeJson(storageKeys.team, state.team);
  document.documentElement.dataset.theme = save.preferences.theme;
  localStorage.setItem(storageKeys.theme, save.preferences.theme);
  if (source === "cloud") {
    state.saveMetadata.revision = save.sync.revision;
    state.saveMetadata.modifiedAt = save.sync.modifiedAt;
    if (save.sync.deviceId) state.saveMetadata.deviceId = save.sync.deviceId;
    persistSaveMetadata();
  } else {
    state.saveMetadata.revision = Math.max(state.saveMetadata.revision, save.sync.revision);
    markSaveModified();
  }
  renderAll();
  return save;
}

function setSaveStatus(message, type = "") {
  if (!elements.saveOperationStatus) return;
  elements.saveOperationStatus.textContent = message;
  elements.saveOperationStatus.dataset.status = type;
}

const bytesToBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");

const base64UrlToBytes = (value) => {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
};

const bytesToHex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

function normalizedSyncCode() {
  const code = elements.syncCode.value.trim().toLowerCase();
  if (!uuidPattern.test(code)) throw new Error("Enter a valid sync UUID, or create a new one.");
  state.syncCode = code;
  localStorage.setItem(storageKeys.syncCode, code);
  ensureSyncContext(code);
  updateSyncControls();
  return code;
}

async function syncIdentity(code) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`unbound:${code}`)));
  return {
    id: bytesToHex(digest),
    key: await crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]),
  };
}

async function encryptSave(save, code) {
  const { id, key } = await syncIdentity(code);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(save))),
  );
  return {
    id,
    envelope: {
      version: 2,
      iv: bytesToBase64Url(iv),
      ciphertext: bytesToBase64Url(ciphertext),
      updatedAt: new Date().toISOString(),
      revision: save.sync.revision,
      parentRevision: save.sync.parentRevision,
      modifiedAt: save.sync.modifiedAt || new Date().toISOString(),
      deviceId: save.sync.deviceId,
    },
  };
}

async function decryptSave(envelope, code) {
  if (![1, 2].includes(envelope?.version) || !envelope.iv || !envelope.ciphertext) {
    throw new Error("The cloud save has an unsupported encrypted format.");
  }
  const { key } = await syncIdentity(code);
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlToBytes(envelope.iv) },
      key,
      base64UrlToBytes(envelope.ciphertext),
    );
    return validateSaveDocument(JSON.parse(new TextDecoder().decode(plaintext)));
  } catch {
    throw new Error("The sync UUID could not decrypt this cloud save.");
  }
}

function saveFingerprintPayload(save) {
  const validated = validateSaveDocument(save);
  return {
    caught: [...validated.caught].sort(),
    badges: validated.badges,
    team: validated.team,
    preferences: validated.preferences,
  };
}

async function saveFingerprint(save) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(saveFingerprintPayload(save)))),
  );
  return bytesToHex(bytes);
}

function isPristineSave(save) {
  const payload = saveFingerprintPayload(save);
  return !payload.caught.length && payload.badges === 0 && payload.team.every((slot) => !slot.species);
}

function classifySyncStatus({ localSave, cloudSave, localFingerprint, cloudFingerprint, context }) {
  if (!cloudSave) return "no-cloud";
  if (localFingerprint === cloudFingerprint) return "in-sync";
  if (!context.lastSyncedFingerprint) return isPristineSave(localSave) ? "cloud-newer" : "conflict";
  const localChanged = localFingerprint !== context.lastSyncedFingerprint;
  const cloudChanged = cloudFingerprint !== context.lastSyncedFingerprint;
  if (localChanged && cloudChanged) return "conflict";
  if (cloudChanged) return "cloud-newer";
  if (localChanged) return "local-newer";
  return "in-sync";
}

function setSyncFreshness(status, snapshot = state.syncSnapshot) {
  state.syncStatus = status;
  if (!elements.syncFreshness) return;
  const cloudDate = snapshot?.cloudSave?.sync?.modifiedAt || snapshot?.envelope?.updatedAt;
  const messages = {
    unchecked: ["Not checked", "Check before moving between devices."],
    checking: ["Checking...", "Comparing this device with the encrypted cloud save."],
    "no-cloud": ["No cloud save yet", "This device can create the first encrypted cloud revision."],
    "in-sync": ["In sync", `Both copies match. Last cloud change: ${formatSaveDate(cloudDate)}.`],
    "local-newer": ["This device is newer", "Local changes have not been uploaded yet."],
    "cloud-newer": ["Cloud save is newer", `Load the cloud copy from ${formatSaveDate(cloudDate)} before continuing here.`],
    conflict: ["Changes on both copies", "Choose which copy to keep. Your current device will be backed up first."],
    error: ["Could not check", "Your local save has not been changed."],
  };
  const [title, detail] = messages[status] || messages.unchecked;
  elements.syncFreshness.dataset.status = status;
  elements.syncFreshnessTitle.textContent = title;
  elements.syncFreshnessDetail.textContent = detail;
  elements.syncConflictActions.hidden = !["cloud-newer", "conflict"].includes(status);
}

function updateSyncControls() {
  if (!elements.syncCode) return;
  const configured = Boolean(syncEndpoint);
  const hasCode = Boolean(state.syncCode);
  elements.syncCode.value = state.syncCode;
  document.querySelector("#check-cloud-save").disabled = !configured || !hasCode;
  document.querySelector("#upload-cloud-save").disabled = !configured || !hasCode;
  document.querySelector("#download-cloud-save").disabled = !configured || !hasCode;
  document.querySelector("#refresh-sync-history").disabled = !configured || !hasCode;
  document.querySelector("#copy-sync-code").disabled = !hasCode;
  document.querySelector("#forget-sync-code").disabled = !hasCode;
  elements.syncServiceStatus.textContent = configured
    ? "Cloud sync service connected. Saves are encrypted before upload."
    : "Cloud sync is not connected yet. Export and import already work; complete the Cloudflare setup to enable it.";
  elements.syncServiceStatus.dataset.connected = String(configured);
  if (!configured || !hasCode) setSyncFreshness("unchecked");
}

async function fetchCloudSnapshot(code = normalizedSyncCode()) {
  if (!syncEndpoint) throw new Error("Cloud sync is not connected yet.");
  const { id } = await syncIdentity(code);
  const response = await fetch(`${syncEndpoint}/saves/${id}`);
  if (response.status === 404) return { id, envelope: null, cloudSave: null };
  if (!response.ok) throw new Error("The encrypted cloud save could not be downloaded.");
  const envelope = await response.json();
  return { id, envelope, cloudSave: await decryptSave(envelope, code) };
}

async function checkSyncStatus({ quiet = false } = {}) {
  if (!quiet) setSyncFreshness("checking");
  try {
    const code = normalizedSyncCode();
    const remote = await fetchCloudSnapshot(code);
    const localSave = createSaveDocument();
    const localFingerprint = await saveFingerprint(localSave);
    const cloudFingerprint = remote.cloudSave ? await saveFingerprint(remote.cloudSave) : "";
    const status = classifySyncStatus({
      localSave,
      cloudSave: remote.cloudSave,
      localFingerprint,
      cloudFingerprint,
      context: state.syncContext,
    });
    state.syncSnapshot = { ...remote, localSave, localFingerprint, cloudFingerprint };
    if (status === "in-sync" && remote.cloudSave) {
      recordSyncBaseline(code, remote.cloudSave, cloudFingerprint);
    }
    setSyncFreshness(status, state.syncSnapshot);
    return state.syncSnapshot;
  } catch (error) {
    setSyncFreshness("error");
    throw error;
  }
}

function recordSyncBaseline(code, save, fingerprint) {
  state.syncContext = {
    code,
    lastSyncedRevision: save.sync.revision,
    lastSyncedFingerprint: fingerprint,
    lastSyncedAt: new Date().toISOString(),
  };
  persistSyncContext();
}

async function uploadCurrentSave({ force = false } = {}) {
  const code = normalizedSyncCode();
  const snapshot = await checkSyncStatus();
  if (["cloud-newer", "conflict"].includes(state.syncStatus) && !force) {
    setSaveStatus("Cloud changes were found. Choose which copy to keep; nothing was overwritten.", "warning");
    return false;
  }
  if (state.syncStatus === "in-sync" && !force) {
    setSaveStatus("This device already matches the cloud save.", "success");
    return true;
  }
  const cloudRevision = snapshot.cloudSave?.sync?.revision || 0;
  if (state.saveMetadata.revision <= cloudRevision || state.saveMetadata.revision < 1) {
    state.saveMetadata.revision = cloudRevision;
    markSaveModified();
  }
  const save = createSaveDocument({ parentRevision: snapshot.cloudSave ? cloudRevision : null });
  const fingerprint = await saveFingerprint(save);
  const { id, envelope } = await encryptSave(save, code);
  const response = await fetch(`${syncEndpoint}/saves/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(envelope),
  });
  if (response.status === 409) {
    await checkSyncStatus();
    setSaveStatus("The cloud save changed during upload. Choose which copy to keep; nothing was overwritten.", "warning");
    return false;
  }
  if (!response.ok) throw new Error("The encrypted save could not be uploaded.");
  recordSyncBaseline(code, save, fingerprint);
  state.syncSnapshot = { id, envelope, cloudSave: save, localSave: save, localFingerprint: fingerprint, cloudFingerprint: fingerprint };
  setSyncFreshness("in-sync", state.syncSnapshot);
  setSaveStatus("Encrypted save uploaded. This device and cloud are now in sync.", "success");
  return true;
}

async function loadCloudSave({ force = false } = {}) {
  const code = normalizedSyncCode();
  const snapshot = await checkSyncStatus();
  if (!snapshot.cloudSave) throw new Error("No cloud save exists for this UUID yet.");
  if (state.syncStatus === "in-sync" && !force) {
    setSaveStatus("This device already matches the cloud save.", "success");
    return true;
  }
  if (["local-newer", "conflict"].includes(state.syncStatus) && !force) {
    elements.syncConflictActions.hidden = false;
    setSaveStatus("This device also has changes. Choose which copy to keep; nothing was overwritten.", "warning");
    return false;
  }
  applySaveDocument(snapshot.cloudSave, { source: "cloud" });
  recordSyncBaseline(code, snapshot.cloudSave, snapshot.cloudFingerprint);
  state.syncSnapshot = { ...snapshot, localSave: snapshot.cloudSave, localFingerprint: snapshot.cloudFingerprint };
  setSyncFreshness("in-sync", state.syncSnapshot);
  setSaveStatus("Cloud save loaded. The previous local copy is available under Recovery versions.", "success");
  return true;
}

async function loadCloudHistory() {
  if (!syncEndpoint) throw new Error("Cloud sync is not connected yet.");
  const code = normalizedSyncCode();
  const { id } = await syncIdentity(code);
  const response = await fetch(`${syncEndpoint}/saves/${id}/history`);
  if (!response.ok) throw new Error("Cloud recovery versions could not be loaded.");
  state.cloudHistory = (await response.json()).versions || [];
  renderRecoveryBackups();
}

async function restoreCloudVersion(versionId) {
  if (!syncEndpoint) throw new Error("Cloud sync is not connected yet.");
  const code = normalizedSyncCode();
  const { id } = await syncIdentity(code);
  const response = await fetch(`${syncEndpoint}/saves/${id}/history/${encodeURIComponent(versionId)}`);
  if (!response.ok) throw new Error("That cloud recovery version is no longer available.");
  const save = await decryptSave(await response.json(), code);
  if (!window.confirm(`Restore cloud revision ${save.sync.revision} to this device? The current local save will be backed up first.`)) return;
  applySaveDocument(save, { source: "recovery" });
  setSyncFreshness("local-newer");
  setSaveStatus("Recovery version restored locally. Review it, then save it to the cloud when ready.", "success");
}

function restoreLocalBackup(id) {
  const backup = readLocalBackups().find((entry) => entry.id === id);
  if (!backup) throw new Error("That local backup is no longer available.");
  if (!window.confirm("Restore this local backup? The current save will be backed up first.")) return;
  applySaveDocument(backup.save, { source: "recovery" });
  setSaveStatus("Local backup restored.", "success");
}

async function copySyncCode() {
  const code = normalizedSyncCode();
  await navigator.clipboard.writeText(code);
  elements.syncCode.focus();
  elements.syncCode.select();
  setSaveStatus("Sync UUID copied to the clipboard.", "success");
}

function exportSave() {
  const blob = new Blob([`${JSON.stringify(createSaveDocument(), null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `unbound-field-guide-save-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setSaveStatus("Save exported. Keep the file somewhere safe.", "success");
}

async function importSaveFile(file) {
  if (!file) return;
  try {
    const save = validateSaveDocument(JSON.parse(await file.text()));
    if (!window.confirm("Replace this device's current Unbound progress with the imported save?")) return;
    applySaveDocument(save);
    setSaveStatus("Save imported successfully.", "success");
  } catch (error) {
    setSaveStatus(error.message || "The selected save could not be imported.", "error");
  }
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
  renderDexQuickFilters();
  renderCaughtQuickFilters();
}

function renderAll() {
  updateOverview();
  updateSaveSummary();
  renderDex();
  renderLocations();
  renderSpecialSections();
  renderCaught();
  renderMoves();
  renderMoveTutors();
  renderItemTable();
  renderStones();
  renderTeam();
  renderBattlePlanner();
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
  elements.dexLoadMore.addEventListener("click", () => {
    state.dexLimit += INITIAL_CARD_BATCH;
    renderDex();
  });
  elements.typeQuickFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-type]");
    if (!button) return;
    elements.typeFilter.value = button.dataset.quickType;
    renderDex(true);
  });

  elements.locationSearch.addEventListener("input", () => {
    state.locationLimit = INITIAL_CARD_BATCH;
    renderLocations();
  });
  elements.locationLoadMore.addEventListener("click", () => {
    state.locationLimit += INITIAL_CARD_BATCH;
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
  elements.caughtTypeQuickFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-caught-quick-type]");
    if (!button) return;
    state.caughtTypeFilter = button.dataset.caughtQuickType;
    state.caughtLimit = INITIAL_CARD_BATCH;
    renderCaughtQuickFilters();
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

  document.querySelector("#export-save").addEventListener("click", exportSave);
  document.querySelector("#import-save-button").addEventListener("click", () => {
    elements.importSaveFile.click();
  });
  elements.importSaveFile.addEventListener("change", (event) => {
    importSaveFile(event.target.files?.[0]);
    event.target.value = "";
  });
  document.querySelector("#create-sync-code").addEventListener("click", () => {
    state.syncCode = crypto.randomUUID();
    localStorage.setItem(storageKeys.syncCode, state.syncCode);
    ensureSyncContext(state.syncCode);
    updateSyncControls();
    setSyncFreshness("unchecked");
    setSaveStatus("New private sync UUID created. Save it somewhere secure.", "success");
  });
  elements.syncCode.addEventListener("input", () => {
    state.syncCode = elements.syncCode.value.trim();
    if (state.syncCode) localStorage.setItem(storageKeys.syncCode, state.syncCode);
    else localStorage.removeItem(storageKeys.syncCode);
    state.syncSnapshot = null;
    state.cloudHistory = [];
    renderRecoveryBackups();
    updateSyncControls();
    setSyncFreshness("unchecked");
  });
  document.querySelector("#copy-sync-code").addEventListener("click", () => {
    copySyncCode().catch((error) => setSaveStatus(error.message, "error"));
  });
  document.querySelector("#check-cloud-save").addEventListener("click", () => {
    checkSyncStatus()
      .then(() => setSaveStatus("Save freshness check complete.", "success"))
      .catch((error) => setSaveStatus(error.message || "Cloud status check failed.", "error"));
  });
  document.querySelector("#upload-cloud-save").addEventListener("click", async () => {
    try {
      await uploadCurrentSave();
    } catch (error) {
      setSaveStatus(error.message || "Cloud upload failed.", "error");
    }
  });
  document.querySelector("#download-cloud-save").addEventListener("click", async () => {
    try {
      const snapshot = await checkSyncStatus();
      if (!snapshot.cloudSave) throw new Error("No cloud save exists for this UUID yet.");
      if (
        state.syncStatus === "cloud-newer" &&
        !window.confirm("Load the newer cloud save? The current local save will be backed up first.")
      ) {
        return;
      }
      await loadCloudSave();
    } catch (error) {
      setSaveStatus(error.message || "Cloud download failed.", "error");
    }
  });
  document.querySelector("#use-local-save").addEventListener("click", async () => {
    if (!window.confirm("Keep this device's save and replace the current cloud copy? Both copies will remain in Recovery versions.")) return;
    try {
      await uploadCurrentSave({ force: true });
    } catch (error) {
      setSaveStatus(error.message || "Cloud upload failed.", "error");
    }
  });
  document.querySelector("#use-cloud-save").addEventListener("click", async () => {
    if (!window.confirm("Use the cloud save on this device? The current local copy will be backed up first.")) return;
    try {
      await loadCloudSave({ force: true });
    } catch (error) {
      setSaveStatus(error.message || "Cloud download failed.", "error");
    }
  });
  document.querySelector("#refresh-sync-history").addEventListener("click", () => {
    loadCloudHistory()
      .then(() => setSaveStatus("Recovery versions refreshed.", "success"))
      .catch((error) => setSaveStatus(error.message || "Recovery versions could not be loaded.", "error"));
  });
  elements.syncRecoveryList.addEventListener("click", (event) => {
    const localButton = event.target.closest("[data-restore-local]");
    const cloudButton = event.target.closest("[data-restore-cloud]");
    try {
      if (localButton) restoreLocalBackup(localButton.dataset.restoreLocal);
      if (cloudButton) {
        restoreCloudVersion(cloudButton.dataset.restoreCloud).catch((error) =>
          setSaveStatus(error.message || "Recovery failed.", "error"),
        );
      }
    } catch (error) {
      setSaveStatus(error.message || "Recovery failed.", "error");
    }
  });
  document.querySelector("#forget-sync-code").addEventListener("click", () => {
    state.syncCode = "";
    state.syncContext = {
      code: "",
      lastSyncedRevision: null,
      lastSyncedFingerprint: "",
      lastSyncedAt: null,
    };
    state.syncSnapshot = null;
    state.cloudHistory = [];
    localStorage.removeItem(storageKeys.syncCode);
    localStorage.removeItem(storageKeys.syncContext);
    renderRecoveryBackups();
    updateSyncControls();
    setSaveStatus("This device forgot the sync UUID. The encrypted cloud save was not deleted.", "success");
  });

  document.querySelector("#theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(storageKeys.theme, next);
    markSaveModified();
  });

  document.querySelector("#reset-progress").addEventListener("click", () => {
    if (!confirm("Reset caught tracker and team builder data for this browser?")) return;
    state.caught.clear();
    state.team = normalizeTeam([]);
    state.badges = 0;
    saveCaught();
    saveTeam();
    saveBadges();
    renderAll();
  });

  document.querySelector("#clear-team").addEventListener("click", () => {
    state.team = normalizeTeam([]);
    saveTeam();
    renderTeam();
    updateOverview();
  });

  elements.badgeDecrease.addEventListener("click", () => {
    state.badges = Math.max(0, state.badges - 1);
    saveBadges();
    updateOverview();
  });
  elements.badgeIncrease.addEventListener("click", () => {
    state.badges = Math.min(TOTAL_BADGES, state.badges + 1);
    saveBadges();
    updateOverview();
  });

  elements.backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("click", (event) => {
    const suggestionButton = event.target.closest("[data-team-species-pick]");
    if (suggestionButton) {
      const [slotIndex, constant] = suggestionButton.dataset.teamSpeciesPick.split(":");
      state.team[Number(slotIndex)] = createTeamSlot(constant);
      saveTeam();
      renderTeam();
      return;
    }

    const battlePickButton = event.target.closest("[data-battle-opponent-pick]");
    if (battlePickButton) {
      const [slotIndex, constant] = battlePickButton.dataset.battleOpponentPick.split(":");
      setBattleOpponent(Number(slotIndex), constant);
      const list = battlePickButton.closest("[data-battle-opponent-suggestions]");
      if (list) list.hidden = true;
      renderBattlePlanner();
      return;
    }

    if (!event.target.closest(".team-species-field")) {
      document.querySelectorAll("[data-team-species-suggestions]").forEach((list) => {
        list.hidden = true;
      });
    }
    if (!event.target.closest(".battle-opponent-field")) {
      document.querySelectorAll("[data-battle-opponent-suggestions]").forEach((list) => {
        list.hidden = true;
      });
    }

    const evolveButton = event.target.closest("[data-team-evolve]");
    if (evolveButton) {
      const [slotIndex, constant] = evolveButton.dataset.teamEvolve.split(":");
      evolveTeamSlot(Number(slotIndex), constant);
      return;
    }

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

    const locationImageButton = event.target.closest("[data-open-location-image]");
    if (locationImageButton) {
      openLocationImagePopup(
        locationImageButton.dataset.openLocationImage,
        locationImageButton.dataset.locationImageLabel || "Item location",
      );
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
      return;
    }

    const battleSearch = event.target.closest("[data-battle-opponent-search]");
    if (battleSearch) {
      const index = Number(battleSearch.dataset.battleOpponentSearch);
      const matched = pokemonFromTeamSearch(battleSearch.value);
      if (battleSearch.value.trim() && !matched) {
        setBattleOpponent(index, state.battleOpponents[index]);
        return;
      }
      setBattleOpponent(index, matched?.constant || "");
      renderBattlePlanner();
    }
  });

  document.addEventListener("input", (event) => {
    const speciesSearch = event.target.closest("[data-team-species-search]");
    if (speciesSearch) {
      const index = Number(speciesSearch.dataset.teamSpeciesSearch);
      const value = speciesSearch.value.trim();
      renderTeamSpeciesSuggestionList(speciesSearch, index);
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
      return;
    }

    const battleSearch = event.target.closest("[data-battle-opponent-search]");
    if (battleSearch) {
      const index = Number(battleSearch.dataset.battleOpponentSearch);
      const value = battleSearch.value.trim();
      renderBattleOpponentSuggestionList(battleSearch, index);
      const matched = pokemonFromTeamSearch(value);
      if (!value && state.battleOpponents[index]) {
        setBattleOpponent(index, "");
        renderBattlePlanner();
      } else if (matched && state.battleOpponents[index] !== matched.constant) {
        setBattleOpponent(index, matched.constant);
        renderBattlePlanner();
      }
    }
  });

  document.addEventListener("focusin", (event) => {
    const speciesSearch = event.target.closest("[data-team-species-search]");
    if (speciesSearch) {
      const index = Number(speciesSearch.dataset.teamSpeciesSearch);
      renderTeamSpeciesSuggestionList(speciesSearch, index);
      return;
    }
    const battleSearch = event.target.closest("[data-battle-opponent-search]");
    if (!battleSearch) return;
    const index = Number(battleSearch.dataset.battleOpponentSearch);
    renderBattleOpponentSuggestionList(battleSearch, index);
  });

  window.addEventListener("scroll", () => {
    elements.backToTop.classList.toggle("is-visible", window.scrollY > 420);
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 360) return;
    loadNextBatch(state.view);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && syncEndpoint && state.syncCode) {
      checkSyncStatus({ quiet: true }).catch(() => setSyncFreshness("error"));
    }
  });
}

elements.caughtFilter.value = state.caughtFilter;
persistSaveMetadata();
if (state.syncCode) ensureSyncContext(state.syncCode);
populateFilters();
updateSyncControls();
renderRecoveryBackups();
bindEvents();
renderAll();

const initialView = location.hash.replace("#", "");
if (document.querySelector(`[data-view-panel="${initialView}"]`)) {
  switchView(initialView);
}
if (syncEndpoint && state.syncCode) {
  checkSyncStatus({ quiet: true }).catch(() => setSyncFreshness("error"));
}
