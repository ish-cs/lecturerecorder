# PLAN 2

Refactor the transcription pipeline to replace the Python Whisper subprocess with whisper-node (Node.js bindings for whisper.cpp). Steps:

1. Install whisper-node: `npm install whisper-node`
2. Download and bundle the base.en.bin model into `models/base.en.bin` using whisper-node's model downloader
3. Update the transcription logic in electron/main.js to use whisper-node instead of spawning a Python subprocess
4. Remove all Python dependencies (transcribe.py, ffmpeg-python, openai-whisper, torch) from setup.sh and README
5. Keep ffmpeg for audio conversion (webm → wav) but install it as an npm package using `ffmpeg-static` so it's bundled and doesn't require brew
6. Replace any `brew install ffmpeg` references with the ffmpeg-static npm package
7. Add electron-builder to devDependencies and create a complete electron-builder config in package.json that:
   - Targets macOS .dmg
   - Bundles the models/ folder inside the app
   - Sets app name to "LectureRecorder"
   - Sets a bundle ID of com.lecturerecorder.app
   - Includes all necessary node_modules
8. Add a `npm run build` script that runs `vite build` then `electron-builder`
9. Test that `npm run build` produces a working .dmg in the `dist/` folder
10. Update README with two sections: "Development" (npm run dev) and "Distribution" (npm run build → share the .dmg from dist/)

The final .dmg should be fully self-contained. A friend on a fresh Mac should be able to install it and use it with no terminal, no Python, no brew, and no setup steps.

Restyle the entire LectureRecorder UI to match a high-end editorial print aesthetic. Specific requirements:

Colors:
- Background: pure white (#ffffff)
- Text: near-black (#111111)
- Sidebar background: #f5f5f5
- Accents and active states: pure black, no color
- Borders: thin, 1px, #e0e0e0
- No dark mode

Typography:
- Headings and notebook/page names: bold condensed sans-serif, uppercase, tight letter-spacing (use "Barlow Condensed" or "Anton" from Google Fonts)
- Body text in the note canvas: serif font, justified alignment (use "Playfair Display" or "Lora" from Google Fonts)
- Transcript panel text: small, monospace, #444444
- Recording timer: large, bold, condensed uppercase

Layout:
- Generous white space throughout
- Sidebar: white/light grey, clean, no rounded corners, flat
- Buttons: no rounded corners, flat, black fill with white text or outlined black
- Record button: solid black circle, no color
- Active page in sidebar: bold black text + thin left border, no background fill
- Toolbar: minimal, icon-only or text-only, no colored icons

Overall feel: looks like it was designed for a premium print magazine, not a tech app. Clean, authoritative, zero visual noise.