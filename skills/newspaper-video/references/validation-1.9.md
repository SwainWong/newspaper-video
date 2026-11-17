# 1.9.0 validation · 2026-11-17

The package now includes16 editable collage fixtures,3 richer teaching boards, two distinct comparison layouts, outlined-to-filled titles, whole-card reposition, a corrected ballot icon, and node-action SFX cues. It preserves1.8 effects and platform manifests. Root README was reviewed and synchronized with these inputs, outputs, handoffs and restrictions.

## Executed checks

- Python repository suite:53tests passed, including six collage project/asset/plan regressions and15pixel comparison tests. Fresh fixture paths are generated in temporary directories; no user-home install is required.
- `tests/collage_runtime.cjs`:35checks passed using actual esbuild/React SSR, all16fixtures, geometry/focus/caption collisions, entry/ink/reposition timing, ballot symbol, and sound anchors.
- TypeScript and both template timeline/motion validators: passed for the6,400-frame16-scene fixture at30fps. Compilation and input validation do not establish visual quality.
- Cross-agent native validators: Claude Code2.1.326 strict JSON plugin+marketplace checks passed; WorkBuddy2.165.0 runtime validated six platform plugin/marketplace files, all exit0. These are manifest checks, not account-level installation or rendering in those apps. The old global Claude CLI remains unchanged. Runtime wrapper/proxy startup issues were avoided using the installed native binary and isolated config/environment.
- Private reconstruction:24seconds,540×960,30fps,H.264/AAC; full decode passed. Fifteen actual output frames were visually inspected across question-fill-answer-comparison, opposed panel entry and delayed badge, and phrase-wallet-ballot stages.1080×1920 settled stills were also inspected. Continuous normal-speed viewing, real listening and owner acceptance remain open.

- Final16-layout synthetic reel:6,400frames,213.33seconds,540×960,30fps; full decode and3six-second GIF decode checks passed. All16settled scene samples were generated for inspection; source/render hashes are in the showcase manifest. No voice/BGM/SFX are scheduled in this synthetic catalog reel.

## Bounded pixel regression

`pixel-regression-1.9.json` records exact image hashes, rectangles and RGB MAE. Lower means closer per pixel; no universal pass threshold has been chosen. Baseline uses the old1.8 split component in the same target comparison rectangle, rather than a different full film.

| Region | Initial1.9 prototype | Final candidate | Old1.8 component |
|---|---:|---:|---:|
|4801headline|44.537|43.110|not measured|
|4801answer strip|46.814|46.814|not measured|
|4801comparison strip|17.879|16.792|not measured|
|4803context label|51.842|39.187|51.842|
|4803comparison panels|17.581|15.309|97.832|

These metrics cover recreated graphics only in explicitly declared rectangles. Paper/photos were reused in the private diagnostic fixture and are recorded separately. They are not shipped. Font weight, headline letterforms, answer spacing, photographic crop and paper alignment still differ.4806 has no reliable matching source-video foreground, so its motion is authored from screenshot composition; no source-motion fidelity is claimed. No all16-layout pixel-perfect result is claimed.

## Remaining boundaries

The package's global composition gate conservatively reserves full collage scenes; full-screen transitions must use an independent interlude rather than overlap them. Internal grouped actions are checked in the renderer. Graphics/box checks do not prove glyph layout, sound timbre, narrative truth, source rights or owner acceptance. Procedural SFX are original replacement candidates and have not been genuinely listened to. The latest episode background script remains a separate, unapproved artifact and is absent from this package.
