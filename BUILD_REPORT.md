# 13 — The Facility · Build report (2026-11-11)

**Deliverable:** `/Users/michaelvanderpool/Desktop/13-build/13.html` (157 KB, single file, inline CSS/JS, procedural art, synthesized WebAudio; no external references; sha256 `27767cfe…a1cc`). Open locally in a desktop browser. Source modules in `src/`, built by `node build.js`; baseline appendices materialized in `baseline/` (the four JS module hashes matched the document; the HTML hash did not, which I attribute to Markdown transport).

## What was built
- Revised Floor 13 opening: awakening scene (taps 3/pause/2, tattoo, AI voice, footsteps), assessment room with both choices (try the door → lights up + warning; lie back → "Compliance noted"), scripted escort past opaque sealed doors, isolation in Cell 13 (bed, sink, camera, smooth door).
- Electrical ability: hold E on the camera housing (crackle, no hum) → camera dies and restarts on release; >4 s offline draws an operator check. Cell door: hold E to feel for the live latch trace; door-open telemetry dispatches the single humanoid operator (footsteps as cue, no countdown).
- Service alcove and storage niche as hide zones; both the alcove route and the dash route lead to observing the operator open the Testing 1 door. 4×4 pattern lock with full attempt history on `G.attempts`; solution is chosen at reveal from clue-consistent (four contacts, one line) patterns never submitted anywhere, with a fallback to any unused 4-cell set; attempts and solution persist across saves; other cells reject everything and record attempts; three failures draw a check. Manual entry once, then auto-apply at compatible locks (the Floor 13 lift control = Floor 12 access).
- Mandatory one-time captive encounter at the observation window; security response in the lift lobby; circuit console interrupts it for 10 s and can be repeated.
- Floors 12–1, both journeys, per the recipe table: timed credentials, interlocks, hazards with per-tile state, lures with miss/reset, conveyor/belt phases, decoys with reset, code combination keypad, cognitive sequence, airlocks, drone/handoff windows. Floor 12 has the scanner-vs-service-stair alternative with its own prerequisite (breaker + landing release) and consequence (stair alert patrol on Floor 11); both reach Floor 11.
- Surface choice with equal Leave/Return buttons; Return re-enters through the vehicle bay breach; Floor 13 return ends in containment, rescue-hatch breach (carved into collision) and the reunion montage. Both endings are distinct terminal states that save as finished and resume to their ending.
- Stealth: patrol/investigate/pursue, 160 px / 60° cone, wall and closed-door occlusion, hide zones, hearing by stance, one-attempt capture timing, grace on success, checkpoint reset on failure/timeout with durable progress kept. Fixed 60 Hz accumulator; pause/journal/scenes/puzzles freeze simulation; keys cleared on blur.
- Versioned validated saves (`thirteen_v2`), old v1 and corrupt saves explained in the UI; options (sound captions, mute, reduced motion); keyboard-navigable dialogs; 13 optional memory fragments keyed once per floor with a Floor 6 childhood vignette.
- Test hooks (`window.__13`) exist only when the page is opened with `#test`.

## Acceptance checks
| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Revised opening; both choices → escort/cell; camera restart; latch; AI check on prolonged fault; both corridor approaches; E not through walls; captive once | **Passed** | `test/play.js` runs female/table/alcove and male/door/dash through Floor 13 with the live operator (`build/test-play.log`); `test/extra.js` checks wall-side and diagonal reach; captive second use is not a scene |
| 2 | Drive every recipe/transition; Leave visits 13 states; Return visits 26 and physically reaches the reunion; zero memories; finished saves keep the ending | **Passed** (with caveat) | `build/test-play.log`: 13 and 26 states listed, both endings saved and resumed. Caveat: on floors 12–1 the driver deactivated patrol robots and parked the lure subjects for walking segments; Floor 13 ran with security live. Stealth is verified separately (check 4) |
| 3 | Blocked/expired path and successful retry for every lock and timed puzzle; containment misses and resets | **Passed** | Each floor solver exercises the deny/expiry/wrong-input/miss path before the success path (spoof expiry, wrong lane, sequence mismatch, airlock interlock + vestibule lockdown, arcing floor, drone home, wrong code, auth expiry, decoy reset, empty seals, restraint miss, hatch interlock…) — see `test/solvers.js` and the log |
| 4 | Occlusion, noise investigation, pursuit, capture success/failure, safe recovery; pause, blur, restart; save/reload mid-timer in each journey | **Passed** | `build/test-stealth.log` 8/8; reload during Floor 5 auth window (escape) and Floor 10 venting (return) in the play run: timers rebuilt from a safe state, flags kept |
| 5 | Collect a fragment, journal, reload; no duplicate on descent; childhood and reunion coherent with/without it | **Passed** | `build/test-misc.log` and `build/test-extra.log` (reunion with and without memory; ending text acknowledges count) |
| 6 | Startup/console errors, asset requests, legibility at smaller viewport, keyboard navigation; report browsers | **Passed / partly verified** | Headless **Google Chrome (macOS, via puppeteer-core)** only: 0 console errors across all suites, exactly 1 request (the file), title/options keyboard navigation, 900 px viewport screenshots in `build/shot-*.png` (layout collapses to one column; canvas 876 px). **Not verified:** Firefox, Safari, Edge, viewports under 900 px, real audio output |

Also run: `node --check` on the extracted script (pass), the four baseline Node module suites (pass, unchanged).

## Material deviations from the brief
- Stairwell alternative exists only on Floor 12→11 (the documented example); other floors have no stair routes (left open as the document allows).
- Floors 12–1 use the six-room skeleton with per-floor geometry edits rather than fully unique architecture; Floor 13 is bespoke.
- Presentation is placeholder-grade: procedural pixel sprites, canvas-text signage, caption-driven scenes with simple procedural illustrations, synthesized SFX and an ambient drone (no composed score). The montage is six ~4 s skippable vignettes, not a 120 s cut.
- "Little Star" is used as provisional nickname copy; the Morse message, altered character and reply remain undefined in-game.
- Lure puzzles require the player to step clear of the subject's path (touch = capture with one Space attempt); messages say so.
- Window lengths are my defaults (spoof 14 s, restraint 10 s, sterilization 14 s, sync 18 s, auth 16 s, handoff 14 s, drone 16 s, circuit 10 s).

## Known defects / limits
- Escort response timing was tuned only against the automated routes (walk/run); a slow walking dash can meet the operator at the lobby junction.
- Entities do not collide with each other; robots can overlap the player.
- Patrol fairness on floors 12–1 is verified structurally and by the stealth suite, not by a full stealth playthrough.
- HUD timer bars show internal timer names (e.g. "SPOOF"); some wall labels overlap corridor tiles.
- Art, lighting, music and cutscene animation are far below the stated visual ambition.
