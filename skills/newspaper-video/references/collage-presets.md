# Sixteen reusable collage compositions

`python3 scripts/collage_demo.py /absolute/path/to/NEW_FIXTURE`

The command requires Python 3, copies the package template and procedural SFX into a new directory, then writes `src/timeline.json`, `FIXTURE.md`, and `layout-source-info.json`. It refuses an existing destination. No original screenshot, person photo, logo, chart, or reference-video frame is copied. All photo slots use `template-example.svg`; charts use explicitly synthetic fixtures. The copied SFX remain unscheduled. The result has 16 scenes of 400 frames each, totaling 6,400 frames at 30 fps, without narration or music.

`collage-presets.json` is the editable catalog. Each entry maps a screenshot number to `collage`, which follows the template's `src/collage.tsx` schema. The generator refreshes board `spec` objects from `reference-boards-fixtures.json` using each preset's `boardFixtures` mapping. Optional `boardOverrides` replace named top-level fields after the refresh (the early market example delays its score/deltas). This preserves the specialized stage, eight-condition and market board behavior instead of flattening a board into an image. The catalog also includes an immediately inspectable board spec.

| Screenshot | Preset | Composition |
|---|---|---|
| IMG_4793 | photo-timeline-question | Slanted evidence photo, period sticker, four date anchors, large closing question |
| IMG_4794 | four-stage-teaching-board | Full four-stage chalkboard with staged curves, labels and markers |
| IMG_4795 | eight-check-teaching-board | Eight-condition status strip and four explanatory mini-plots |
| IMG_4796 | market-path-and-secondary | Main price path and secondary series; early review frame |
| IMG_4797 | market-score-and-deltas | Same market board family at its score/delta stage; later review frame |
| IMG_4798 | building-portrait-headline | Building photo, pinned portrait, date strip and headline |
| IMG_4799 | document-portrait-number | Tall document, portrait, headline and oversized count |
| IMG_4800 | meeting-versus-portraits | Wide meeting image above two portrait cards and a central VS tile |
| IMG_4801 | meeting-question-answer-strip | Meeting photo, question, red answer strip, shallow comparison row |
| IMG_4802 | podium-quote-and-portraits | Podium image, question/date, two portrait cards and central quote |
| IMG_4803 | complementary-roles-hero | Large two-color comparison with oversized complementary-role titles |
| IMG_4804 | portrait-year-resignation | Portrait, oversized year, successive labels and resignation stamp |
| IMG_4805 | red-chapter-and-rising-chart | Red chapter image, headline and compact rising synthetic chart; caption below data |
| IMG_4806 | phrase-wallet-ballot | Separate phrase scraps, diagonal wallet and ballot-box symbols |
| IMG_4807 | podium-trade-and-photo | Podium photo, two-part headline and staggered lower cards |
| IMG_4808 | red-date-today-impact | Red paper chapter, dark date strip, oversized rotated TODAY and condition strip |

## Coordinates and evidence

All boxes use full 1080 × 1920 **video-content coordinates**, not phone-screen coordinates. Phone status, navigation, playback and account UI are excluded from fixture content. These are reusable layout estimates, not a claim of pixel-calibrated reproduction of all sixteen screenshots. The catalog records its measurement status per entry. IMG_4801 incorporates source-video calibrated boxes supplied during analysis; 4805 and 4806 were checked against their full-resolution screenshots. Other layouts were measured from the supplied contact sheet and need local source-frame comparison before fidelity claims.

For the measured source-video viewport, the analysis found screenshot magnification approximately 1.1215 with 38 pixels cropped at the left. That transform is recorded only where used. Do not silently apply it to differently framed screenshots. Source video observations at 29 fps convert to 30 fps with `round(source_frame * 30 / 29)`; catalog entrances are authored demonstration timing, not timing inferred from static screenshots. Existing board fixture anchors are already 30 fps and must not be converted again.

## Staging and safe areas

Each node's `at`, `settle`, and `end` is scene-local. Captions use composition-global start/end values, as required by the template. Boards start at zero and remain active for all 400 scene frames. Comparison rows reveal left side, right side, then the relationship badge. Separate primary actions enter sequentially. Phrase scraps and quote/tag pairs declare a shared group when they form one coordinated message. Only a static support photo explicitly disables motion focus; active layers are not blanket-exempted.

The conservative validator checks occupied bounds, entry translation, rotation, competing motion and caption intersections. Intentional photo/sticker overlap requires a named pair and a reason. IMG_4805 uses the compact `line-chart` node, with readable unit/source rows and the caption below the chart. This deliberately adapts the screenshot's caption overlay to keep data visible; it is recorded in `sourceGeometry.adaptation`. All catalog caption boxes remain clear of node bounds. The fixture marker is synthetic review text; production captions must be measured again with the final bilingual copy.

## Validation and reuse

Install the copied template dependencies with a supported Node version, run `npm run check`, validate each scene with `validateCollage(scene.collage, scene.end - scene.start)`, then render the sample frames recorded in `layout-source-info.json`. Review frame images for actual line wrapping, font fallback, chart visibility, overlaps and hierarchy. Geometry validation and compilation do not establish rendered visual quality or listening acceptance.

The generated source-info file binds the catalog, board fixtures and output timeline by SHA256. It records screenshot mapping and sample frames, without packaging reference pixels. Keep rendered comparisons and source assets local. For pixel metrics use `pixel-compare-api.md`, label reused source assets separately from recreated graphics, and avoid whole-image fidelity claims when copied imagery dominates.
