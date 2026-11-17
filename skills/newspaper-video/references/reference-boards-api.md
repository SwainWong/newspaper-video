# Editable reference teaching boards

`assets/template/src/reference-boards.tsx` exports `ReferenceBoardSpec`, `ReferenceBoard({spec,frame,width,height})` and `validateReferenceBoard(spec,duration): string[]`. Call validation at the JSON boundary before rendering. Local frames use explicit `{at,settle}` pairs, both within the event duration. `frame` is event-local. Nothing consults wall clock time or random numbers.

The SVG uses native rectangular geometry: stage `1000 × 840`, check `1000 × 900`, market `1000 × 1040`. Pass proportional `width` and `height` to preserve the measured layout. The component itself has no square wrapper, newspaper background, position or transform; the caller owns those. Market has a light upper chart panel and transparent lower chart/badge area. Stage/check use charcoal panels and a double hairline border.

## Shared contract

All kinds require `title`, `source`, `unit`, `timeUnit`, ascending numeric `domain` and `timeDomain`, and `setup:{at,settle}`. Points are `{time,value}` and use numeric x spacing. Required source and units identify the supplied material; they do not verify its truth. Do not reuse synthetic fixture numbers as real observations.

Optional `theme` has `fontFamily`, `background`, `text`, `muted`, `green`, `yellow`, `red`, `border`. Colors are six-digit hex; font families must be installed or bundled by the caller. Default is Arial/sans-serif, not a claim to identify the original font. Dimensions are externally selectable and the source coordinates remain stable. Source text must be concise enough to fit the footer at the actual output scale.

## Stage board

`kind:'stage-board'`, `schematic:true`, and exactly four `segments`. Each segment has `label`, `note`, `color`, `points`, `reveal` and `caption`. Consecutive segments share the same boundary point and follow setup → trace → caption timing. Segment boundaries determine the vertical dividers and tinted columns. A single continuous track changes color at each boundary. Optional segment `emphasis:true` adds an inset colored outline. Bottom circled numbers, labels and short notes follow each trace.

Optional `marker:{type,time,value,reveal}` accepts `check`, `clock`, `range` (double-ended vertical arrow), or `arrow`. The marker is positioned using actual axis coordinates, never arbitrary screenshot pixels. Reference screenshots IMG_4794 and source6 36–42 seconds inform the geometry and progression; the final four-part arrangement also follows the supplied screenshot.

## Check board

`kind:'check-board'`, `instruction`, exactly eight `statuses`, and exactly four `miniPlots`. Status fields: `label`, `pass:true|false|null`, `reveal`. Count increases only after a passing status settles. All eight boxes remain present, including unchecked conditions; the lower content remains a 2 × 2 chart grid.

Each miniPlot supplies its own `title`, `source`, `unit`, `timeUnit`, `domain`, `timeDomain`, `reveal`, `statusIndex` (0–7), and 1–4 `series`. A series requires `points`, `color`, `reveal`; `dashed`, `label`, and `mode:'line'|'dots'` are optional. Dots use supplied positions without drawing a connecting path. MiniPlots may contain `benchmark:{value,label,color}` and a marker as above. Series reveal follows panel reveal. A chart's status is read from its selected status index. Reference IMG_4795 and source6 54–60 seconds establish the empty-box → mini-chart → check/count sequence. Eight status boxes do not imply that the four visible charts alone verify all eight conditions.

## Market board

`kind:'market-board'`, `points`, `line`, `endpoint`, `benchmark:{value,label,reveal}`, `secondary:{title,source,points,domain,unit,reveal}`, `score:{value,total,label,reveal}`, and `deltas:[{value,unit,label,reveal}]` (0–3).

The upper observed path uses green for upward segments and red for downward segments, an explicit endpoint label, and a dashed benchmark. Its stripe grid, light panel, fine outline, faint secondary plot and tilted red score follow IMG_4796/4797 and source6 68–74 seconds. The secondary plot shares the time domain but declares its own vertical domain/unit. Deltas and score are supplied editorial data; the component does not derive a scoring method or imply that their labels establish financial evidence. Provide documented calculations and sources in the production review. Line points are linearly connected; animation reveals the supplied track without generating observations.

## Fixtures and review boundary

`reference-boards-fixtures.json` contains three JSON-roundtrippable synthetic examples with frame/dimensions and a common duration. It deliberately labels charts as synthetic. Its numbers are illustrative inputs, not copied claims about a stock. `tests/reference_boards_runtime.cjs` can verify a bundled module using available React dependencies. Rendered stills establish rendering and sampled layout only, not continuous-motion, listening, factual or owner acceptance. Pixel matching against source imagery must use actual reference crops and may not be described as equality when the fixture data differs.
