# Pixel reference study

This evidence map covers sixteen screenshots and primary videos5,6,7. Source2,3,4 were additionally sampled only to resolve unmatched screenshots. No copied paper/photo assets are shipped here; local extraction paths are private comparison fixtures. A pixel match is not audiovisual acceptance.

## Screen normalization

Phone screenshots are1125×2436. Video is visible over approximately y0–2160; controls overlap that area. The fitted source5 scale is about1.1215 screenshot pixels per native pixel, with x translation about−43pixels: approximately38 native pixels are cropped on each side. Source6 has the same visible crop proportion but a native720×1280 raster. Simply resizing the screenshot to9:16 is wrong. The JSON stores each measured affine, normalized screenshot and conservative validity mask. Adjacent frames often score similarly; timestamps below are best candidates, not proven original capture timestamps.

## Screenshot map

| Screenshot | Source | Candidate time/frame | Evidence |
|---|---|---|---|
| IMG_4793.PNG | 6 | 30.896552s / 896 | Pinned Washington photograph, two-week timeline, green NVIDIA question |
| IMG_4794.PNG | 6 | 47.862069s / 1388 | Four-stage stock lifecycle board |
| IMG_4795.PNG | 6 | 63.000000s / 1827 | Eight-point checklist board at 4/8 |
| IMG_4796.PNG | 6 | 68.275862s / 1980 | NVDA falling price chart |
| IMG_4797.PNG | 6 | 74.482759s / 2160 | Price chart plus -24%, -33%, 2.5/8 |
| IMG_4798.PNG | 6 | 125.206897s / 3631 | Commerce building and portrait collage |
| IMG_4799.PNG | 6 | 162.793103s / 4721 | Document/Thune portrait and red 3 |
| IMG_4800.PNG | 5 | 36.275862s / 1052 | Meeting photo, opposing portraits, yellow VS |
| IMG_4801.PNG | 5 | 47.241379s / 1370 | Meeting photo, extruded headline, red strip, blue/black inequality |
| IMG_4802.PNG | 5 | 66.689655s / 1934 | Press podium photo, red question, paired portraits and quote |
| IMG_4803.PNG | 5 | 122.275862s / 3546 | Blue/red sell/control comparison with gold plus |
| IMG_4804.PNG | 5 | 163.551724s / 4743 | Vance portrait, 1980, resignation collage |
| IMG_4805.PNG | unresolved | not established | Oil silhouette and price curve with +80% |
| IMG_4806.PNG | unresolved | not established | Wallet emptied headline, wallet icon and ballot icon |
| IMG_4807.PNG | unresolved | not established | Podium photo, stabilization headline, trade card and oil photo |
| IMG_4808.PNG | unresolved | not established | 11.03 flip date and large Today on red paper |

Matched source/layout confidence is high for4793–4804. Other than4801/4803, refined search sampled every3frames (about0.103s). All16 screenshots were visually inspected;5/6/7 were inspected using24-frame overview sheets, followed by dense key-region sheets.4805–4808 do not have reliable matching foregrounds in the available samples. In particular,4806 shares historical newspaper background features with7 and4; that is not evidence that its foreground animation occurs in either video. Video3 produced identical sampled matching frames to5, but a whole-file identity was not asserted.

## Measured key layouts

Boxes below are manual visual bounds in native1080×1920 source coordinates, about±3pixels; not exact vector geometry. Colors are10×10patch RGB medians from decoded source and include lighting/compression.

-4801/frame1370: photo outer region approximately(40,140)–(1044,560); headline(50,590)–(952,740), red strip(90,750)–(890,910), comparison strip(40,938)–(1044,1178), gold disk(450,965)–(630,1150). Title is heavy Chinese sans with thick down/right dark extrusion; red strip is cream Song-style serif text, slightly counterclockwise; main comparison labels are sans, secondary labels bold serif. Main subtitle box(359,1250)–(722,1348), English(383,1365)–(697,1420). Sample blue#23355a at(100,1000), dark#1f1914 at(900,1000), gold#d8be4c at(540,1100). Font family identities are not recoverable from pixels alone.
-4803/frame3546: panel(49,304)–(1029,732), center divider x539. Disk outer approximately(445,426)–(638,615); inner(455,435)–(623,602). Plus is visibly tilted. Sell/control characters are thin sans at roughly150px glyph height; secondary labels are Song-style bold at roughly35px. Top label(67,158)–(340,252), Chinese subtitle(147,1250)–(933,1348), English(248,1365)–(832,1420). Blue#212e4a at(100,350), red#9e1c1c at(900,350), gold#dec450 at(540,570), dark#19130f at(100,180). These are spatially varying shaded surfaces, not flat fills.
-4806/screenshot coordinates only: first black headline card approximately(8,394)–(399,550), red wallet word(419,383)–(737,554), lower red headline(7,552)–(593,793). Yellow wallet tile bounds(52,893)–(445,1279), about−6degrees; navy ballot tile approximately(543,1490)–(1034,1890), about+17degrees; red Run label(622,1332)–(1008,1563), about−8degrees. Headline is large cream Song-style serif with dark offset shadows. The diagonal spatial relationship is observable; actual travel direction, onset, speed, bounce, and exit are not. UI overlays obscure parts of the lower icon. Do not turn a plausible trajectory into a source-verified trajectory.

## Motion evidence windows

Dense source5 contact sheets are local4801-motion.jpg and4803-motion.jpg. Timing below is observed at0.5s sampling, so transitions are bounded, not exact edit points.

-4801:42.0–43.0s headline remains outlined; by43.5s it fills dark blue with extrusion. Red answer strip is in place by44.5s. Comparison starts entering from the left at45.5s and is complete by46.0s. Gold less-than disk is oversized at47.0s and settles by47.5s. Scene changes between48.0 and48.5s.
-4803: no comparison at119.0s; two color panels are visible separated at119.5s and meet by120.0s. Gold plus appears by121.5s;122.0–123.0s holds the completed comparison. Lower caption is added by124.0s. The key screenshot best candidate is122.275862s, though neighboring frames have similar residuals.

## Primary-video graphical layout inventory

- Video5: paper/title0s; pinned podium10.85s; red question and notes21.70s; meeting/portraits32.55–36.28s; headline/inequality43.40–48s; torn black title54.25s; press/paired quotes65.10s; date/polaroid75.95s; policy comparison86.81s; yellow note plus red word97.66s; document highlight108.51s; sell/control119.36–125s; pinned group130.21s; torn title141.06s; split compromise151.91s; portrait/year/resignation162.76s; gavel timeline173.61s; paired portraits184.46s; quote scraps195.31s; statement note206.16s; photo/quote217.01s; chart227.86s; title/portrait238.71s; portrait/yellow label249.57s.
- Video6: light opening0s; pinned street8.10s; speaker identity16.20s; overlapping school/speaker24.29s; chalkboard32.39–64.78s; price chart68.28–74.48s; horizontal performance bars80.98s; filmstrip/stage label89.08s; price high97.17s; dated portrait105.27s; market-cap chart113.37s; Commerce collage121.47–126s; dark-building editorial/timeline129.56–137.66s; note and price card145.76s; export label153.86s; document/portrait/count161.96s; customers collage170.05s; dark pull quote178.15s; historical chart186.25s.
- Video7: blue paper0s; labeled state map12.09s; portrait/calendar24.18s; university/speaker36.28s; chamber photo48.37s; red filmstrip60.46s; television portrait72.55s; calendar84.64s; portrait/list96.74–108.83s; red quotation120.92s; speaker/60year133.01s; divided portrait145.10s; red/cream split157.20s; impeachment type169.29s; vote bar181.38s; portrait/title193.47s; party bars205.56s; split comparison217.66s; timeline229.75s; subpoena241.84s; dark interstitial253.93s; newspaper clipping266.02s; portrait/yellow conclusion278.12s.

## Comparison boundaries

Clean source frames are references, never recreated output. Copied photo/paper areas must be tagged reused_source_asset and removed from recreated-graphics similarity metrics. No complete source graphics panel may be relabeled a reusable photo. Source photo and paper paths are local only. Validity masks are conservative; source matching uses compressed/resampled images, not lossless equality. This study does not verify listening, full-speed viewing, rights clearance, or owner approval.
