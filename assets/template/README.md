# Newspaper Video starter

Editable 1080×1920 / 30fps newspaper collage. The neutral 20-second example has no narration or music. This folder is copied into each new project; edit the project copy, not installed Skill assets.

Use Node >=22.12, Python 3 and a working Chromium/Chrome:

```sh
npm ci
npm run check
python3 validate_timeline.py src/timeline.json
npm run still
npm run render
```

For installed Chrome, add `--browser-executable=/absolute/path/to/chrome` to the Remotion command. For localhost IPv6 resolution errors set NODE_OPTIONS=--dns-result-order=ipv4first for that command. If npm's shared cache has a permission error, use `npm ci --cache <writable-temporary-folder>`; do not change system cache permissions or force overwrite.

Content: src/timeline.json. Theme: src/theme.json. Reusable paper, pin, tape and neutral illustration files: public/. More layouts: examples/. TypeScript interfaces in src/template.tsx define supported fields; the JSON validator checks frame boundaries and local media existence. Source uses system fonts, which may differ between operating systems.

Rendering is a technical test; view and listen to actual output before accepting a production video. No private voice, channel branding or news-source media is included. Remotion/React dependencies retain their own licenses.
