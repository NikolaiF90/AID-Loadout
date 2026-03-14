# Changelog

All notable changes to Loadout will be documented here.
Versions are ordered latest first. Timestamps are UTC.

---

## [v1.1.0] - 2026-03-14T00:00:00Z

### New Features
- **Equip system** - move items from your inventory directly into equipment slots. Just say where you want it: `act_wear helmet on head`, `act_equip blazer over body`, `act_put on ring in left hand`.
- **Unequip system** - take items off and they land back in your inventory automatically. `act_take off helmet`, `act_remove blazer`, `act_unequip ring`.
- **Multi-command input** - chain multiple actions in a single turn. `act_take sword and act_wear sword on right hand`. Each action sees the result of the previous one. First failure stops the chain.
- **Natural slot targeting** - say body parts or natural terms instead of slot names. `head`, `body`, `chest`, `feet`, `left hand` all resolve to the right slot automatically.
- **Slot aliases** - configurable per slot in `LOADOUT_CONFIG.SLOT_ALIASES`. Add your own terms for custom slots.
- **Natural verb conjugations** - `hands`, `handing`, `handed`, `grabs`, `dropping` all work without needing exact keyword matches.

### Optimization
- Keyword list now pre-built and sorted at load time instead of every command. Longer keywords always match before shorter ones - prevents `take` matching before `take off`.
- `cleanText` utility extracted as shared function - article, possessive, and punctuation stripping no longer duplicated across multiple functions.
- `extractReceiver` extracted as standalone function.

### Bug Fixes
- Multi-command inputs no longer get swallowed as a single command.
- Conjugated keywords like `act_hands` no longer leave trailing letters in the parsed item name.
- Failure narratives now replace the correct command when multiple act_ commands are present in the same input.

---

## [v1.0.0] - 2026-03-13T00:00:00Z

### New Features
- **Character registration** - add and remove characters via `loadout add/name` and `loadout remove/name`.
- **Equipment slots** - each character tracks Headwear, Outfit, Armor, Left Hand, Right Hand, Back, and Foot.
- **Inventory tracking** - items carried but not equipped are stored separately per character.
- **Story card sync** - loadout data written to and read from character story cards automatically. Place `[Loadout][/Loadout]` anywhere in your card notes to control positioning.
- **Auto-repair** - missing or broken card data is detected and repaired automatically.
- **Inventory actions** - `act_take`, `act_drop`, `act_give`, `act_hurl` with natural language support.
- **Configurable prefix** - change `act_` to anything you want via `LOADOUT_CONFIG.ACT_PREFIX`.
- **F90 API integration** - runs alongside any other F90 API compatible script with no conflicts.
