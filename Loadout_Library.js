// ============================================
// F90 API - Core Utilities
// v1.0.0 by PrinceF90
// Copy everything from here to END OF F90 API
// and paste at the top of your library
// ============================================

const F90 = {};

// Names that should never be treated as valid characters.
const F90_CONFIG =
{
  BANNED_NAMES: ["you", "adventurer"],
}

// Initializes F90 API state. Owns the character registry.
// Called automatically at library load — no manual init needed.
function initF90()
{
  if (!state.f90) state.f90 = { characters: [] };
}

// Self-initializes on load.
initF90();

// Captures raw unmodified text. Call at the top of each hook before anything mutates text.
F90.captureText = function()
{
  state.f90._textSnapshot = text;
}

// Returns the captured raw text for the current hook.
F90.getTextSnapshot = function()
{
  return state.f90._textSnapshot || "";
}

// Returns true if the current session is multiplayer.
F90.isMultiplayer = function()
{
  if (!info.characters || info.characters.length <= 1) return false;

  for (const name of info.characters)
  {
    if (!name || name.trim() === "") continue;
    if (F90_CONFIG.BANNED_NAMES.some(b => b.toLowerCase() === name.toLowerCase())) continue;
    if (!F90.findCharacter(name)) continue;
    
    return true;
  }

  return false;
}

// Returns a character by name. Case-insensitive.
F90.findCharacter = function(name)
{
  return state.f90.characters.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
}

// Returns the caller name as a clean string by parsing AID's "> Name" input format.
// Returns whatever follows ">". Caller is responsible for handling "You", "I", or invalid names.
F90.getCaller = function()
{
  const input = F90.getTextSnapshot();
  const match = input.match(/>\s*(\S+)/);
  
  return match ? match[1].trim() : null;
}

// Returns the full character object of the active caller.
F90.getCallerCharacter = function()
{
  const name = F90.getCaller();

  if (!name)
  {
    log("F90 > Caller not found.");
    return null;
  }

  if (!F90_CONFIG.BANNED_NAMES.some(b => b.toLowerCase() === name.toLowerCase()))
  {
    return F90.findCharacter(name);
  }

  // Banned name means singleplayer — fall back to player character
  return state.f90.characters.find(c => c.isPlayer) || null;
}

/*
  TEXT
*/

// Appends content to the current text.
F90.addToText = function(content)
{
  text = text.trimEnd() + content;
}

// Replaces the current text entirely.
F90.setText = function(content)
{
  text = content;
}

// Appends content to frontMemory for AI context injection.
F90.addToMemory = function(content)
{
  state.memory.frontMemory = (state.memory.frontMemory || "") + "\n\n" + content;
}

// Parses AID's player input into structured parts.
// Handles DO, SAY, and STORY input formats.
// DO:    "> You action."        → { original, clean: "action",    prepend: "> You" }
// SAY:   "> You say, "text."   → { original, clean: "text",      prepend: "> You say," }
// STORY: "text."                → { original, clean: "text",      prepend: null }
F90.parseInput = function()
{
  const original = F90.getTextSnapshot();

  // SAY/multiplayer SAY — "> Name verb, "quoted content""
  const sayMatch = original.match(/^>\s*\S+\s+\w+,\s*"(.+?)"\.?\s*$/);
  if (sayMatch)
  {
    const prepend = original.match(/^(>\s*\S+\s+\w+,)/)[1].trim();
    return { original, clean: sayMatch[1].trim(), prepend };
  }

  // DO/multiplayer DO — "> Name action."
  const doMatch = original.match(/^>\s*(\S+)\s+(.+?)\.?\s*$/);
  if (doMatch)
  {
    const prepend = `> ${doMatch[1]}`.trim();
    return { original, clean: doMatch[2].trim(), prepend };
  }

  // STORY — no prepend, just strip trailing punctuation
  const clean = original.replace(/[.!?]+$/, "").trim();
  return { original, clean, prepend: null };
}

/*
  NOTIFICATION
*/

// Queues a message to be shown to the player at the end of the output hook.
F90.notify = function(message)
{
  if (!state.f90._notifyQueue) state.f90._notifyQueue = [];
  state.f90._notifyQueue.push(message);
}

// Flushes all queued notifications into text.
// Call at the end of the output hook, before modifier.
F90.flushNotify = function()
{
  if (!state.f90._notifyQueue || state.f90._notifyQueue.length === 0) return;

  const messages = state.f90._notifyQueue.map(m => m).join("\n");
  text = `[${messages}]\n\n` + text;
  state.f90._notifyQueue = [];
}

/*
  CHARACTER
*/

// Creates a character in F90's registry.
// Caller defines the character object shape — F90 only requires a name.
// First character created is always the player.
// Returns true on success, false on failure.
F90.createCharacter = function(character)
{
  if (!character || !character.name)
  {
    log("F90 > createCharacter: character object must have a name.");
    return false;
  }

  if (F90.findCharacter(character.name))
  {
    log(`F90 > createCharacter: ${character.name} already exists.`);
    return false;
  }

  if (state.f90.characters.length === 0) character.isPlayer = true;

  state.f90.characters.push(character);
  log(`F90 > Character "${character.name}" created.`);

  return true;
}

// Deletes a character from F90's registry by name.
// Returns true on success, false on failure.
F90.deleteCharacter = function(name)
{
  const idx = state.f90.characters.findIndex(c => c.name.toLowerCase() === name.toLowerCase());

  if (idx === -1)
  {
    log(`F90 > deleteCharacter: ${name} not found.`);
    return false;
  }

  state.f90.characters.splice(idx, 1);
  log(`F90 > deleteCharacter: Character "${name}" deleted.`);

  return true;
}

/*
  STORY CARDS
*/

// Returns a story card by exact title match. Case-sensitive.
F90.findCard = function(title)
{
  return storyCards.find(c => c.title === title) || null;
}

/// Deletes a story card by exact title match.
// Returns true on success, false if not found.
F90.deleteCard = function(title)
{
  const idx = storyCards.findIndex(c => c.title === title);
  if (idx === -1) return false;

  storyCards.splice(idx, 1);
  return true;
}

// Returns all story cards matching the given type. Case-sensitive.
F90.getCardsByType = function(type)
{
  return storyCards.filter(c => c.type === type);
}

// ============================================
// F90 API - Module Runtime
// ============================================

F90._modules = [];

// Registers a module for execution. Priority is optional, per hook, numeric.
// Lower number runs earlier. Unspecified hooks fall to registration order.
// EXAMPLE: F90.registerModule("CSMS", CSMS, { context:0, output: 5 });
F90.registerModule = function(name, fn, priority)
{
  F90._modules.push({
    name:       name,
    fn:         fn,
    priority:   priority || {},
    order:      F90._modules.length,
  });
}

// Runs all registered modules for the given hook, in priority order.
// Failures are logged and execution continues for remaining modules.
F90.run = function(hook)
{
  // Helps user to capture the original input text so on one has to do that manually
  if (hook === "input") F90.captureText();

  const sorted = [...F90._modules].sort((a, b) =>
  {
    const aPriority = a.priority[hook];
    const bPriority = b.priority[hook];

    if (aPriority !== undefined && bPriority !== undefined) return aPriority - bPriority;
    if (aPriority !== undefined) return -1;
    if (bPriority !== undefined) return 1;

    return a.order - b.order;
  });

  for (const module of sorted)
  {
    try
    {
        module.fn(hook);
    }
    catch(e)
    {
      log(`F90 > run: ${module.name} failed on ${hook} - ${e.message}`);
    }
  }

  // Same. F90 API help users to flush notify so they dont have to worry about that and its order and so on
  if (hook === "output") F90.flushNotify();
}



// ========================
// END OF F90 API
// ========================


// ========================
// ADD YOUR MODULES BELOW
// Register at the bottom
// ========================


// ============================================
// LOADOUT - Standalone inventory and equipment
// v1.0.0 by PrinceF90
// ============================================

const LOADOUT_CONFIG =
{
  USE_DEFAULT_CARD: true,
  ACT_PREFIX:       "act_",
  ACT_STOP_WORDS:     ["then", "while", "as", "but", "so", "on", "in", "inside", "onto", "into", "over", "under", "at", "by", "near", "toward"],
  SLOTS: 
  {
    headwear:   "Headwear",
    outfit:     "Outfit",
    armor:      "Armor",
    leftHand:   "Left Hand",
    rightHand:  "Right Hand",
    back:       "Back",
    foot:       "Foot",
  },
}

// Inventory action keywords.
const LOADOUT_ACT_KEYWORDS =
{
  take:  ["take", "grab", "pick up", "collect", "retrieve", "get", "acquire", "tuck"],
  drop:  ["drop", "discard", "throw away", "leave", "abandon", "let go of", "put down", "release"],
  give:  ["give", "hand", "pass", "offer", "deliver", "transfer", "slide", "shove"],
  hurl:  ["throw", "toss", "hurl", "fling", "chuck", "lob"],
}

// Initializes LOADOUT. Ensures F90 is ready first.
function initLoadout()
{
  initF90();
}

// Creates and returns a new LOADOUT character object.
function initLoadoutCharacter(name)
{
  const slots = {};
  for (const key of Object.keys(LOADOUT_CONFIG.SLOTS)) slots[key] = null;

  return {
    name:       name,
    slots:      slots,
    inventory:  [],
  };
}

// Strips everything from the first stop word onwards.
// Returns the clean item name.
function extractItem(raw)
{
  const pattern = new RegExp(`\\s+(${LOADOUT_CONFIG.ACT_STOP_WORDS.join("|")})\\s+.*$`, "i");

  return raw
    .replace(/^(the|a|an|some|my|your|his|her|their)\s+/i, "")
    .replace(/[.,!?"]+$/, "")
    .replace(/^[a-zA-Z]+'s\s+/i, "")
    .replace(pattern, "")
    .trim();
}

// Handles loadout commands from player input.
// Supported: loadout add/name, loadout remove/name
function parseLoadoutCommand(input)
{
  log("F90 > parseLoadoutCommand: executing...");
  const match = input.match(/loadout\s+(\w+)(?:\/(.+))?/i);
  if (!match) return;

  const action = match[1].toLowerCase();
  const arg = match[2]?.trim().replace(/[.,!?"]+$/, "") || "";

  log(`F90 > parseLoadoutCommand: action = ${action}`);

  switch(action)
  {
    case "add":
      if (!arg) { F90.notify("Loadout: name required. Usage: loadout add/name"); return; }

      F90.createCharacter(initLoadoutCharacter(arg))
        ? F90.notify(`${arg} added to Loadout.`)
        : F90.notify(`${arg} already exists.`);
      break;

    case "remove":
      if (!arg) { F90.notify("Loadout: name required. Usage: loadout remove/name"); return; }

      const character = F90.findCharacter(arg);
      if (character)
      {
        removeLoadoutCard(character);
        F90.deleteCharacter(arg)
          ? F90.notify(`${arg} removed from Loadout.`)
          : F90.notify(`${arg} not found.`);
      }
      else
      {
        F90.notify(`${arg} not found.`);
      }
      break;

    default:
      F90.notify(`Unknown loadout command: ${action}`);
  }
}

// Returns the story card for a character. Creates one if USE_DEFAULT_CARD is true and it doesn't exist.
// Returns null if no card found and USE_DEFAULT_CARD is false.
function getLoadoutCard(character)
{
  const existing = F90.findCard(character.name);
  if (existing) return existing;

  if (!LOADOUT_CONFIG.USE_DEFAULT_CARD)
  {
    log(`Loadout > getLoadoutCard: no card found for ${character.name}.`);
    return null;
  }

  storyCards.push(
  {
    title:        character.name,
    type:         "Other",
    keys:         "",
    entry:        "",
    description:  "",
  });

  return F90.findCard(character.name);
}

// Removes the story card for a character. Only removes if USE_DEFAULT_CARD is true.
// If false, the card belongs to the user — we don't touch it.
function removeLoadoutCard(character)
{
  if (!LOADOUT_CONFIG.USE_DEFAULT_CARD) return;
  F90.deleteCard(character.name);
}

// Builds the Loadout block content for a character.
function buildLoadoutBlock(character)
{
  const slots = Object.entries(LOADOUT_CONFIG.SLOTS).map(([key, label]) => `${label}: ${character.slots[key] || "Empty"}`).join("\n");

  const items = character.inventory.length > 0
    ? character.inventory.map(i => `- ${i}`).join("\n")
    : "-";

  return `[Loadout]\n${slots}\n\nInventory:\n${items}\n[/Loadout]`;
}

// Writes the Loadout block into the character's card notes.
// If [Loadout][/Loadout] tags exist, rewrites only between them.
// If not, appends to the end of existing notes.
function writeLoadoutToCard(character)
{
  const card = getLoadoutCard(character);
  if (!card) return;

  const block     = buildLoadoutBlock(character);
  const desc      = card.description || "";
  const startTag  = "[Loadout]";
  const endTag    = "[/Loadout]";
  const start     = desc.indexOf(startTag);
  const end       = desc.indexOf(endTag);

  if (start !== -1 && end !== -1)
  {
    // Exist - rewrite only the loadout block, preserve everything outside
    card.description = desc.slice(0, start) + block + desc.slice(end + endTag.length);
  }
  else
  {
    // No block - appends to end of existing notes
    card.description = desc.trimEnd() + (desc.trim() ? "\n\n" : "") + block;
  }
}

// Reflect changes from card
function readLoadoutFromCard(character)
{
  const card = F90.findCard(character.name);
  if (!card || !card.description) return false;

  const startTag = "[Loadout]";
  const endTag = "[/Loadout]";
  const start = card.description.indexOf(startTag);
  const end  = card.description.indexOf(endTag);

  if (start === -1 || end === -1) return false;

  const block = card.description.slice(start + startTag.length, end).trim();
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

  // Parse slots
  for (const [key, label] of Object.entries(LOADOUT_CONFIG.SLOTS))
  {
    const line = lines.find(l => l.toLowerCase().startsWith(label.toLowerCase() + ":"));
    // Missing key - auto-repair
    if (!line) continue;

    const value = line.slice(label.length + 1).trim();
    character.slots[key] = value === "Empty" ? null : value;
  }

  // Parse inventory
  const invStart = lines.findIndex(l => l.toLowerCase() === "inventory:");
  if (invStart !== -1)
  {
    const invLines = lines.slice(invStart + 1).filter(l => l.startsWith("- "));
    character.inventory = invLines.length > 0 && invLines[0].slice(2) !== "-"
      ? invLines.map(l => l.slice(2))
      : [];
  }

  return true;
}

// Adds an item to a character's inventory.
// Optionally removes it from another character first.
function takeItem(caller, item, receiver)
{
  const source = receiver ? F90.findCharacter(receiver) : null;

  // Take from someone
  if (source)
  {
    const idx = source.inventory.findIndex(i => i.toLowerCase() === item.toLowerCase())
    if (idx === -1)
    {
      // Item not exist - the source doesnt have it
      replaceActText(`look for ${item} on ${source.name}, but cannot find it.`);

      return false;
    }

    source.inventory.splice(idx, 1);
    writeLoadoutToCard(source);
  }

  // add to caller inventory
  caller.inventory.push(item);
  writeLoadoutToCard(caller);

  return true;
}

// Removes an item from a character's inventory.
function dropItem(caller, item)
{
  const idx = caller.inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
  if (idx === -1)
  {
    replaceActText(`reach for ${item}, but realize it isn't there.`);
    
    return false;
  }

  // remove from caller inventory
  caller.inventory.splice(idx, 1);
  writeLoadoutToCard(caller);

  return true;
}

// Transfers an item from caller to another character.
function giveItem(caller, item, receiver)
{
  const idx = caller.inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
  if (idx === -1)
  {
    replaceActText(`about to give something but realize it's nowhere to be found.`);
    
    return false;
  }

  const to = receiver ? F90.findCharacter(receiver) : null;
  if (!to)
  {
    replaceActText(`look around, unsure who to give the ${item} to.`);
    
    return false;
  }

  // remove from caller
  caller.inventory.splice(idx, 1);
  // add to receiver
  to.inventory.push(item);

  // update both card
  writeLoadoutToCard(caller);
  writeLoadoutToCard(to);

  return true;
}

// Removes an item from caller's inventory. No receiver tracking.
function hurlItem(caller, item)
{
  const idx = caller.inventory.findIndex(i => i.toLowerCase() === item.toLowerCase());
  if (idx === -1)
  {
    replaceActText(`reach for ${item} to throw, but realize it isn't there.`);
    
    return false;
  }

  caller.inventory.splice(idx, 1);
  writeLoadoutToCard(caller);

  return true;
}

// Parses item and optional receiver from remaining act_ text.
// "sword to Barbara" → { item: "sword", receiver: "Barbara" }
// "sword"            → { item: "sword", receiver: null }
function parseActItemReceiver(remainingText)
{
  const toMatch   = remainingText.match(/^(.+?)\s+to\s+(.+)$/);
  const atMatch   = remainingText.match(/^(.+?)\s+at\s+(.+)$/);
  const fromMatch = remainingText.match(/^(.+?)\s+from\s+(.+)$/);

  let raw      = remainingText;
  let receiver = null;

  const extractReceiver = (match) =>
  {
    return match[2].trim()
      .replace(/[.,!?"]+$/, "")
      .replace(/\s+(too|also|as well|instead|either|then|now)$/i, "")
      .trim();
  }

  if (toMatch)
  {
    const possible = extractReceiver(toMatch);
    raw      = toMatch[1];
    receiver = F90.findCharacter(possible) ? possible : null;
  }
  else if (atMatch)
  {
    const possible = extractReceiver(atMatch);
    raw      = atMatch[1];
    receiver = F90.findCharacter(possible) ? possible : null;
  }
  else if (fromMatch)
  {
    const possible = extractReceiver(fromMatch);
    raw      = fromMatch[1];
    receiver = F90.findCharacter(possible) ? possible : null;
  }

  return { item: extractItem(raw), receiver };
}

// Replace text. Different from F90.setText()
function replaceActText(replacement)
{
  F90.setText(F90.getTextSnapshot().replace(new RegExp(LOADOUT_CONFIG.ACT_PREFIX + "[^\\n]*", "i"), replacement));
}

// Handles act_ prefixed player input. Routes to inventory actions.
function handleActCommand(actText)
{
  // Slice the text from prefiz
  const raw = actText.slice(LOADOUT_CONFIG.ACT_PREFIX.length).trim().toLowerCase();

  let action          = null;
  let matchedKeyword  = null;

  for (const [actionType, keywords] of Object.entries(LOADOUT_ACT_KEYWORDS))
  {
    for (const keyword of keywords)
    {
      if (raw.startsWith(keyword))
      {
        action         = actionType;
        matchedKeyword = keyword;
        break;
      }
    }
    if (action) break;
  }

  if (!action)
  {
    log(`Loadout > handleActCommand: unknown action — ${raw}`);
    return false;
  }

  const remainingWords  = raw.slice(matchedKeyword.length).trim();
  const caller          = F90.getCallerCharacter();

  if (!caller)
  {
    log("Loadout > handleActCommand: no caller found.");
    return false;
  }

  const { item, receiver } = parseActItemReceiver(remainingWords);

  switch(action)
  {
    case "take": return takeItem(caller, item, receiver);
    case "drop": return dropItem(caller, item);
    case "give": return giveItem(caller, item, receiver);
    case "hurl": return hurlItem(caller, item);
  }

  return false;
}

// =============
//    HOOK
// =============

// Handle the input logic
function handleLoadoutInput()
{
  log("F90 > input: executing...");
  const snapShot  = F90.getTextSnapshot();
  const actMatch  = snapShot.match(new RegExp(LOADOUT_CONFIG.ACT_PREFIX + "[^\\n]*", "i"));

  if (actMatch)
  {
    const success = handleActCommand(actMatch[0].trim());
    if (success) text = snapShot.replace(LOADOUT_CONFIG.ACT_PREFIX, "");
  }

  const cmdMatch = snapShot.match(/loadout[^\n]*/i);
  if (cmdMatch) parseLoadoutCommand(cmdMatch[0].trim());
}

// handle the context logic
function handleLoadoutContext()
{
  log("F90 > context: executing...");
  state.f90.characters.forEach(c =>
  {
    // Sync data from card
    readLoadoutFromCard(c);
    // Sync back to card (self-repair on broken data)
    writeLoadoutToCard(c);
  });
}

// Main Loadout entry point. Call from context.js and output.js.
function Loadout(hook)
{
  if (hook === "input") handleLoadoutInput();
  if (hook === "context") handleLoadoutContext();
}

// ========================
// END OF LOADOUT SCRIPT
// ========================

// ========================
// ADD YOUR MODULES BELOW
// Register at the bottom
// ========================

// Your module code here...

// ========================
// REGISTER MODULES HERE
// Always keep this last
// ========================

F90.registerModule("Loadout", Loadout);
// F90.registerModule("YourModule", YourModule);








