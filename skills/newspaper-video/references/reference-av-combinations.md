# Reference audiovisual combinations

Six local clips preserve the source picture and mixed audio for private inspection. This document records source observations and proposed reusable combinations; it does not claim that source sound effects were identified or reproduced. No source clips, photos, paper or SFX are copied into the plugin package.

## Evidence and listening status

**Real listening: not performed.** Available tools supplied decoded media, pixels and numerical audio analysis but no verified audio-listening result. Waveform/spectrogram inspection does not establish a paper sound, whoosh, impact, music bed, narrator quality or synchronization acceptance. Mixed-audio peaks cannot be classified as non-speech without further evidence; every candidate below may be speech, music, an effect or a mixture. Real-time audiovisual review and owner acceptance remain open.

Video contact sheets were visually inspected at approximately0.5s intervals, using nearest integer29fps frames. Additional panel frames were inspected at the times listed below. This is bounded frame review, not continuous normal-speed viewing. Local MP4 derivatives use H.264 CRF18 and AAC256kbps, keep original pixel dimensions and29/1fps, and retain stereo48000Hz audio. Analysis WAV files are mono PCM16 at48000Hz; they are not isolated SFX. Source hashes identify the original full files; derivative hashes and ffprobe evidence are in the private manifest.

## Source identity

| Source | SHA-256 |
|---|---|
| newspaper-origin-5.mp4 | `85763f950bf77fbd3948fc7f5e712b927258226208a3361c737ab9c66bfc4232` |
| newspaper-origin-6.mp4 | `1bba285d01464061ef178ff2d3b14fa9bd99106e921c01af28617bceb754d055` |
| newspaper-origin-7.mp4 | `0c810499fcf3f83c13c544eb89264a9fbdb3f56603e058ca94e0814bc8d6828a` |

## Local clips

Private root: `/Users/swainwong/Desktop/newspaper-video/work/pixel-study-1.9/av/`. Full machine-readable records: `manifest.json`. Each ID has `.mp4`, `.wav`, `-motion.jpg`, and `-audio.png` files. All bounds are start-inclusive/end-exclusive in original-source time.

| ID | Source | Seconds | Source frame interval | Decoded clip frames |
|---|---|---|---|---|
| title-answer-strip-badge | 5 | [42,48) | [1218,1392) | 174 |
| sell-control-panels | 5 | [119,123) | [3451,3567) | 116 |
| checklist | 6 | [54,60) | [1566,1740) | 174 |
| calendar-wipe | 7 | [82,87) | [2378,2523) | 145 |
| portrait-reposition | 7 | [156,162) | [4524,4698) | 174 |
| vote-threshold | 7 | [178,184) | [5162,5336) | 174 |

Frame counts match the requested intervals:174,116,174,145,174,174. Probe confirmed29/1fps and stereo48000Hz audio for all six. These checks establish extraction properties only.

## Panel translation measurements

Coordinates below are native1080×1920 visible-color connected-component bounds(x,y,width,height), not reconstructed full offscreen rectangles. Threshold masks select blue/red surfaces; typography creates holes but does not change their outer bounds. Allow roughly±2px color-edge uncertainty.

| Requested time | Actual source frame/time | Blue visible box | Red visible box |
|---|---|---|---|
|119.3s|3460 /119.310345s|(0,310,422,424)|(950,312,130,424)|
|119.5s|3466 /119.517241s|(58,310,482,425)|(542,312,486,424)|
|119.7s|3471 /119.689655s|(56,310,484,425)|(540,312,486,424)|
|120.0s|3480 /120.000000s|(54,312,484,426)|(538,312,487,426)|

The blue text center moves from approximately178px at119.310s to300px after arrival. Both lettering and panel boundaries move, demonstrating full-card translation with viewport clipping. Red is much farther from its final position at119.310s than blue. The observed motion therefore requires separate panel timing, not one stationary wipe mask. The small later drift is distinct from the large entry travel. Original frames and `panels-strip.jpg` are private evidence.

## Reusable combinations

### Outline title → filled extrusion → answer strip → comparison → badge

Source: `title-answer-strip-badge.mp4`, video5 [42,48)s.

Observed steps: 42.000–43.000s: outlined question under pinned photograph.43.517s: blue fill and extrusion visible.44.483s: red answer strip visible.45.517s: comparison is partly entering at left;46.000s: both sides assembled.47.000s: gold badge visibly oversized;47.517s: smaller settled badge.

Conditions and handoff: Use for question/answer followed by a two-sided relationship. Keep photograph/title anchors persistent and reserve the subtitle lane. Separate fill timing from extrusion visibility and answer-card motion.

Conflicts to prevent: Do not bounce the photograph or both comparison labels with the badge; do not reveal the complete answer before the title resolves. A left-clipped strip is not evidence for a global screen wipe.

Original replacement candidates: Original dry pencil/marker scrape for fill, a soft cardstock contact for answer arrival, a brief filtered-noise lateral sweep for strip travel, and one muted wood-like tap at badge settlement. These are design proposals, not sounds heard in the source.

Required listening: audition the complete source clip at normal speed, distinguish narrator/music/effects, mark whether each visual landing actually has an effect, and compare any newly authored replacement against narration in context. A waveform coincidence alone cannot close this check.

### Opposed panel translation → seam closure → delayed gold operator

Source: `sell-control-panels.mp4`, video5 [119,123)s.

Observed steps: 119.103s: no panels.119.310s: blue panel comes from left and red from right; the text travels with each surface.119.517s: panels nearly meet.119.690–120.000s: seam remains joined with small background/whole-layout drift.121.517s: plus badge is present;122.000–122.483s: completed comparison holds.

Conditions and handoff: Use for complementary or opposing clauses. Translate whole panels including text, with independent arrival offsets, then reveal the operator after both semantic statements. Preserve fixed panel dimensions and clip at viewport boundaries.

Conflicts to prevent: A stationary panel revealed by changing clip width is visually wrong here. Do not merge panel motion with camera drift. Keep the plus off screen until the clauses are established; do not obscure either large Chinese character.

Original replacement candidates: Original paired low-level noise sweeps panned inward, followed by a short soft thud when the operator settles. Test mono compatibility and avoid two overlapping accents masking narration. Source timbre is unverified.

Required listening: audition the complete source clip at normal speed, distinguish narrator/music/effects, mark whether each visual landing actually has an effect, and compare any newly authored replacement against narration in context. A waveform coincidence alone cannot close this check.

### Explanation card → line drawing → check mark → synchronized count

Source: `checklist.mp4`, video6 [54,60)s.

Observed steps: 54.000–54.483s: eight empty boxes,0/8.55.000s: first mini chart appears with a partially drawn line.55.517s: line progresses.56.000s: first check and1/8.57.000s: second mini chart begins;57.517s: curve has progressed.58.000s: second check and2/8.59.517s: third mini chart begins, while count remains2/8.

Conditions and handoff: Use for cumulative criteria. Reveal a criterion, draw its evidence, then confirm it. Update checkbox, mini-card check and counter as one semantic event. Preserve remaining empty slots.

Conflicts to prevent: Do not tick before the explanatory drawing; avoid counting all visible cards as passed. Keep partially introduced third card uncounted until its evidence is complete. Tiny repeated sound events can clutter speech.

Original replacement candidates: Original quiet graphite line texture during drawing plus a short dry click at each confirmed check. Count changes share the same confirmation accent instead of generating a second sound.

Required listening: audition the complete source clip at normal speed, distinguish narrator/music/effects, mark whether each visual landing actually has an effect, and compare any newly authored replacement against narration in context. A waveform coincidence alone cannot close this check.

### Section change → calendar count/page turns → annotation → full-screen color transition

Source: `calendar-wipe.mp4`, video7 [82,87)s.

Observed steps: 82.000–82.483s: cream portrait/title scene.83.000s: blue paper and section heading.84.000s: calendar1.84.483–85.517s: successive folded/turned pages with changing numerals;85.517s also has red investigation label.86.000s: full red screen.86.483s: new cream portrait scene.

Conditions and handoff: Use for passage of months or repeated administrative steps. Give page leaves their own geometry and numerical state, then hand over to a scene-level transition. The full-red state is observed; wipe direction is not established by0.5s sampling.

Conflicts to prevent: Do not represent page turns as only numeral substitution. Do not assert exact event count from the sampled digits. Transition masks must cover the calendar and subtitle only according to the chosen editorial contract; prevent a torn half-page persisting into the next scene.

Original replacement candidates: Original short paper-flutter recordings per selected turn and a restrained broad sweep for the section transition. Reduce or omit intermediate flutters when pages accelerate; real listening must determine whether source audio does this.

Required listening: audition the complete source clip at normal speed, distinguish narrator/music/effects, mark whether each visual landing actually has an effect, and compare any newly authored replacement against narration in context. A waveform coincidence alone cannot close this check.

### Portrait/card placement → coordinated reposition → chart draw → consequence marker

Source: `portrait-reposition.mp4`, video7 [156,162)s.

Observed steps: 156.000–156.483s: earlier map/radar scene.157.000s: dark transition frame.157.517–158.483s: red scene with portrait high left and empty price chart below/right.159.000s: portrait moves lower left and chart moves upward right.159.517–160.000s: red rising curve draws, war label appears.160.483–161.000s: consequence label and downward arrow appear.161.517s: next blue scene.

Conditions and handoff: Use when one subject is linked to a measured consequence. Move photo and chart as separate keyed objects into the final comparison layout; draw data only after the chart has a legible position. Arrow marks narrative consequence, not a literal price trajectory.

Conflicts to prevent: A new static two-column layout misses the repositioning. Do not animate the portrait as a camera zoom while leaving its frame stationary. Avoid letting rising price and downward arrow imply contradictory quantities; label each.

Original replacement candidates: Original gentle card-slide friction for reposition, a subtle tracing texture while the line grows, and one soft tap for the consequence label. Avoid voice-like sounds or dense impacts under narration.

Required listening: audition the complete source clip at normal speed, distinguish narrator/music/effects, mark whether each visual landing actually has an effect, and compare any newly authored replacement against narration in context. A waveform coincidence alone cannot close this check.

### Threshold bar → count accumulation → stop below threshold → contrasting verdict labels

Source: `vote-threshold.mp4`, video7 [178,184)s.

Observed steps: 178.000–179.000s: title/subtitle before bar.179.517s: blue fill and51votes visible with red67threshold.180.000s:54votes.180.483s: green House label.181.000–182.000s:54 holds below67.182.483s: red Senate verdict appears.183.000s: cream next scene.

Conditions and handoff: Use for a count against a fixed requirement. Count and fill must derive from the same value; threshold marker stays fixed. Stop at54/67 rather than visually completing the bar. Verdict labels follow the demonstrated shortfall.

Conflicts to prevent: Never ease the bar past the threshold and back. Do not use a success chime for the failing branch. Keep actual result distinct from required votes; chart units must be explicit.

Original replacement candidates: Original restrained mechanical ticks during selected count steps; one low subdued stop accent below threshold, then separate soft label contacts. This proposed sound language is newly authored and not an extracted source effect.

Required listening: audition the complete source clip at normal speed, distinguish narrator/music/effects, mark whether each visual landing actually has an effect, and compare any newly authored replacement against narration in context. A waveform coincidence alone cannot close this check.

## Mixed-audio energy candidates

Analysis uses20ms RMS windows with10ms hops. Candidate ranking takes positive RMS-level differences, requires window RMS above0.01linear (about−40dBFS), excludes first/last0.1s and suppresses peaks within0.15s. Six highest eligible rises per clip are shown. These are onset candidates, not validated sound events or non-speech detections. Spectrograms use20ms Hann windows,10ms hops and display0–12kHz with a−70..0dB relative magnitude scale. Long-term RMS below is sample RMS, not LUFS.

| Clip | Overall RMS dBFS | Candidate source times(s) |
|---|---|---|
| title-answer-strip-badge | -15.25 | 42.31, 42.6, 45.03, 45.57, 47.22, 47.53 |
| sell-control-panels | -14.68 | 119.78, 120.47, 121.49, 122.26, 122.53, 122.88 |
| checklist | -14.64 | 55.55, 56.34, 58.39, 58.69, 59.22, 59.67 |
| calendar-wipe | -14.93 | 82.41, 84.8, 85.12, 85.3, 86.04, 86.73 |
| portrait-reposition | -15.84 | 157.01, 158.88, 159.27, 160.22, 161.24, 161.6 |
| vote-threshold | -15.52 | 178.43, 178.65, 180.27, 181.13, 181.52, 182.63 |

Potential temporal overlaps warrant listening, not conclusions:45.57s is near the comparison-strip entrance,47.22s near the enlarged badge,121.49s near the plus appearance,86.04s near the full-red transition,160.22s near the consequence phase, and182.63s near the red Senate label. Many other strong rises occur without a new graphic; this is a direct reason not to map every peak to an effect. No non-speech transient has been verified.

## Private paper-caption repair evidence

A separate requested background check found source5/frame435(15.000s) has an unobstructed lower paper region. The original frame0 contains English subtitles. `source5-paper-frame0-caption-recovered.png` replaces only target rectangle(260,1358)–(820,1462) with registered source435 paper pixels. `paper-recovery.json` records the homography,23matching inliers and surrounding-ring RGB MAE about8.9/255. No inpainting, color correction or feathering was used. Source camera/lighting and resampling differ; this is a sourced temporal patch with residual seams, not an exact same-frame clean plate. The patch area remains excluded from recreated-graphics metrics. If exact same-frame pixels are required, mark that region unrecoverable and use an original paper composition.

The private repair is not a sound-combination asset and must not be packaged as a reusable original paper design.
