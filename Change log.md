# Changelog

All notable changes to Loadout will be documented here.
Versions are ordered latest first. Timestamps are UTC.

---

## [v1.1.0] - 2026-03-14T00:00:00Z

### Added
- `equipItem` - moves item from inventory into a specified equipment slot. Displaced item automatically moves to inventory.
- `unequipItem` - removes item from equipment slot and returns it to inventory.
- `parseActEquip` - parses equip commands, resolves target slot via positioning keys or item name inference.
- `resolveSlot` - fuzzy slot resolver against `SLOT_ALIASES`. Exact alias match first, partial label match as fallback. Ambiguous matches return null.
- `LOADOUT_CONFIG.SLOT_ALIASES` - per-slot alias lists for natural slot targeting. User-extensible for custom slots.
- `LOADOUT_ACT_FLAT` - pre-built flat keyword list sorted longest first. Built once at load.
- `cleanText` - shared utility for stripping articles, possessives, and trailing punctuation.
- Equip keywords: `wear`, `equip`, `put on`, `don`, `carry`
- Unequip keywords: `take off`, `unequip`, `remove`, `doff`, `unwear`
- Positioning keys for equip: `on`, `in`, `as`, `at`, `over`
- Natural verb conjugations supported across all keywords - `hands`, `handing`, `handed` all resolve correctly.

### Changed
- `handleLoadoutInput` now finds ALL `act_` commands in a single input and executes them sequentially. First failure cancels remaining commands.
- `extractReceiver` extracted from `parseActItemReceiver` into a standalone function.
- `extractItem` updated to call `cleanText` instead of duplicating article and possessive stripping.
- `replaceActText` now accepts the specific matched string to replace, preventing stale snapshot issues with multiple commands.
- `handleActCommand` now returns `{ success, replacement }` instead of booleans. Text mutation responsibility moved up to `handleLoadoutInput`.
- All item functions (`takeItem`, `dropItem`, `giveItem`, `hurlItem`) now return null on success or a failure narrative string. No longer mutate text directly.
- Multi-word keywords sorted longest first across all action groups - prevents `take` matching before `take off`.

---

## [v1.0.0] - 2026-03-13T00:00:00Z

### Added
- Character registration via `loadout add/name` and `loadout remove/name`
- Equipment slots per character: Headwear, Outfit, Armor, Left Hand, Right Hand, Back, Foot
- Inventory tracking per character
- Card sync - reads and writes loadout data between `[Loadout]` and `[/Loadout]` tags in story card description
- Auto-repair - missing or malformed card data repaired on next write
- `takeItem`, `dropItem`, `giveItem`, `hurlItem` - core inventory actions
- `act_` prefixed command system with configurable prefix via `LOADOUT_CONFIG.ACT_PREFIX`
- F90 API module system integration via `F90.registerModule`
