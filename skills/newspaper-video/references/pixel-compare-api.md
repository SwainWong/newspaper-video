# Local pixel comparison API

`python3 scripts/pixel_compare.py PLAN.json --output NEW_DIRECTORY`

Requires Python 3 and Pillow (`python3 -m pip install Pillow`). NumPy and OpenCV are not required. Inputs and outputs stay local. Ship the script and this contract; do not commit reference frames, source photos, rendered comparisons, or reports to the plugin package.

The output directory must not exist. Invalid input exits nonzero; a failed run can leave an incomplete directory, which is never a completed report. Use a fresh directory after fixing the input. The command does not modify any reference or candidate input.

## Plan

Paths resolve relative to the plan file. Both crops and the alignment policy are mandatory; no implicit registration, image search, or trimming occurs.

```json
{
  "cases": [
    {
      "id": "opening-frame",
      "reference": {
        "path": "reference.png",
        "crop": [0, 0, 1920, 1080]
      },
      "candidate": {
        "path": "rendered.png",
        "crop": [0, 0, 1920, 1080]
      },
      "alignment": {"size": [1920, 1080], "resize": "none"},
      "ignore_rects": [[0, 1030, 1920, 50]],
      "regions": [
        {"name": "title", "kind": "recreated_graphics", "rect": [100, 100, 700, 150]},
        {"name": "source-photo", "kind": "reused_source_asset", "rect": [900, 100, 800, 700]}
      ],
      "thresholds": {"channel_error": 20, "max_mae": 5, "max_exceed_fraction": 0.1}
    }
  ]
}
```

Thresholds in the example are illustrative caller choices, not recommended acceptance criteria. Omit `thresholds` to obtain MAE without a pass criterion. `channel_error` alone requests an exceedance fraction without a pass criterion. `max_exceed_fraction` requires `channel_error`. Case IDs must be unique ASCII letters, numbers, underscores or hyphens.

- Input PNGs must be opaque. Explicitly flatten transparent inputs before comparison. RGB conversion uses stored channel values; this is not a color-managed perceptual comparison.
- Crops and rectangles use integer `[x, y, width, height]`, half-open bounds, positive dimensions, entirely inside their image. Crops refer to original image coordinates. Regions, ignored rectangles, and masks refer to aligned coordinates.
- `alignment.size` is `[width, height]` with positive integers. `resize` must be `none`, `nearest`, `bilinear`, `bicubic`, or `lanczos`. With `none`, both cropped images must already match the target. Any resampling is part of the evidence and may affect scores.
- Optional `sha256` on `reference`, `candidate`, or `ignore_mask` pins the exact original PNG bytes. A mismatch aborts. Without expected hashes, the report records the bytes read, but does not establish that they are the intended/current candidate. Pin expected hashes for regression comparisons.
- Optional `ignore_mask` is `{"path":"ignored-ui.png","sha256":"EXPECTED_HASH"}`. This must be a grayscale `L` PNG, exactly the aligned size, with only 0 and 255 values. White is ignored; black is evaluated. It combines with `ignore_rects` by exclusion. A mask may not hide all evaluated pixels or an entire declared region.
- Optional `regions` separately labels `recreated_graphics` and `reused_source_asset`. Opposite kinds may not overlap. Within-kind overlaps are counted once in the kind aggregate. Region names are unique. Their provenance is author-declared and must be reviewed; the script cannot identify copied pixels automatically.

## Report and diagnostics

`report.json` records the plan SHA256, original reference/candidate/mask SHA256, original dimensions, crops, alignment, exclusions, thresholds, region definitions, metrics and PNG artifact SHA256. The original bytes are read once, so their hashes bind the actual decoded inputs. To audit a report later, compare its hashes to the files; the script does not assert that external files have remained unchanged after the run.

Each case emits:

- `CASE-side-by-side.png`: aligned reference left and candidate right.
- `CASE-overlay.png`: 50/50 blend.
- `CASE-heatmap.png`: black-to-red maximum absolute channel error, mapped directly from 0 to 255 without contrast normalization.

Excluded pixels appear neutral gray in all three diagnostics. This makes exclusions visible but does not establish that the exclusions are justified.

`overall_geometry` describes all evaluated pixels. `regions` gives each region's metrics. `aggregates_by_origin` reports separate unions of recreated graphics and reused source assets. `coverage` reports evaluated graphics, source and unclassified pixel counts, plus reused-source fraction. If no nonempty recreated graphics are declared, `graphics_aggregate_available` is false and the graphics aggregate is null. The overall metric must not be substituted for a graphics aggregate.

For each evaluated pixel and RGB channel, let `d = abs(reference - candidate)`:

- `mean_absolute_rgb_error = sum(d) / (3 * evaluated_pixels)`, range 0–255.
- `fraction_pixels_any_channel_above_threshold` is the fraction of pixels where **any** channel error is strictly greater than the supplied `channel_error`; otherwise null.
- `requested_threshold_checks` contains only the caller-requested MAE/fraction limit checks (`<=`). There is no universal pass/fail, useful-similarity result, or pixel-perfect declaration.

A mostly copied photo can make the overall score look close while the recreated graphics differ substantially. Always review source coverage, recreated-graphics metrics and diagnostics together. Even zero error only proves equality of the selected, transformed pixels. All outputs are explicitly scoped to image geometry; they do not establish perceptual similarity, useful composition, motion fidelity, audio/listening review or owner acceptance. `acceptance` remains `not_assessed`.

Run the fixtures with:

```sh
python3 -m unittest discover -s tests -p test_pixel_compare.py -v
```
