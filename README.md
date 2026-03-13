# Loadout
**An inventory and equipment tracking system for AI Dungeon.**
by PrinceF90

---

> ⚠️ **Pre-release.** Loadout is stable and functional but has not been officially announced yet. You're early — feel free to look around.

---

## What is Loadout?

Loadout tracks what every character in your adventure is wearing, carrying, and holding. Equipment slots, inventory, item transfers between characters — all managed automatically through natural player actions.

Built on [F90 API](https://github.com/NikolaiF90/F90API). Works standalone with no dependency on CSMS or any other script.

## What it does

- Tracks equipment slots per character — headwear, outfit, armor, hands, back, foot
- Tracks carried inventory separately from equipped items
- Responds to natural act_ commands — `act_take`, `act_drop`, `act_give`, `act_hurl`
- Writes character loadout data to story cards automatically
- Auto-repairs missing or malformed data gracefully

## Requirements

- [F90 API](https://github.com/NikolaiF90/F90API) — must be installed first

## Status

Core system is complete. Official release and full documentation coming soon.

---

*Part of the F90 scripting ecosystem for AI Dungeon.*
