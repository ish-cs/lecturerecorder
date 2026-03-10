# LectureRecorder

A local-first desktop application for recording lectures and taking notes with automatic speech-to-text transcription. Built with Electron, React, and Whisper (whisper.cpp).

## Overview

LectureRecorder allows students and researchers to:
- Create notebooks to organize lectures by class/course
- Add pages for individual lectures
- Record audio directly within the app
- Automatically transcribe recordings using Whisper (runs entirely on-device, no cloud)
- Take rich-text notes alongside transcripts
- Export transcripts to clipboard

**Key Features:**
- 100% local processing — no internet required after initial setup
- No Python, no cloud services, no external dependencies beyond Node.js
- Self-contained macOS application (.dmg) that can be shared with others
- Rich text editor with formatting (bold, italic, headings, lists, code blocks, quotes)
- Microphone permission handling with visual feedback
- Recording timer with pause/resume functionality

## Technology Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | Electron 28 |
| Frontend | React 18 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Rich Text Editor | TipTap 2 |
| Transcription | whisper.cpp (via whisper-node) |
| Audio Processing | ffmpeg-static |
| Packaging | electron-builder |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   IPC       │  │  File I/O   │  │  whisper.cpp        │ │
│  │   Handlers  │  │  (notebooks │  │  (transcription)    │ │
│  │             │  │   recordings)│  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    contextBridge (preload.js)
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Electron Renderer Process                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                      React App                          ││
│  │  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌───────┐ ││
│  │  │ Sidebar │  │ Recorder  │  │ PageCanvas│  │Transcript││
│  │  │         │  │   Bar     │  │           │  │  Panel  │ ││
│  │  └─────────┘  └──────────┘  └───────────┘  └───────┘ ││
│  │                                                          ││
│  │  ┌──────────────┐  ┌────────────────┐                 ││
│  │  │ useNotebooks  │  │  useRecorder   │                 ││
│  │  │   (state)     │  │  (audio capture)│                 ││
│  │  └──────────────┘  └────────────────┘                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js 18+** — Download from [nodejs.org](https://nodejs.org)
- **Xcode Command Line Tools** (for compiling whisper.cpp) — Run `xcode-select --install`

No Python, no ffmpeg (via Homebrew), no other dependencies required.

## Setup

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup - installs npm dependencies, compiles whisper.cpp, downloads model
./setup.sh
```

The setup script performs the following:
1. Verifies Node.js is installed
2. Runs `npm install` to install all dependencies
3. Compiles the whisper.cpp binary from source
4. Downloads the Whisper `base.en` model (~142MB) to `models/ggml-base.en.bin`

## Development

```bash
npm run dev
```

This launches the Electron app in development mode with:
- Hot module replacement (HMR) for React changes
- Vite dev server on port 5173
- Electron window with developer tools

The app will open at http://localhost:5173 (or similar).

## Distribution

```bash
npm run build
```

This command:
1. Runs `vite build` to bundle the frontend and Electron main process
2. Runs `electron-builder` to create the macOS .dmg installer

Output:
- **Location:** `release/LectureRecorder-1.0.0.dmg` (Intel)
- **Location:** `release/LectureRecorder-1.0.0-arm64.dmg` (Apple Silicon)

The .dmg is fully self-contained. A friend on a fresh Mac can install it with no terminal, no Python, no brew — just open the .dmg and drag the app to Applications.

## Usage

### 1. Create a Notebook
Click **"+ New notebook"** in the sidebar to create a new notebook. Notebooks are typically used to represent classes or courses (e.g., "Anthro 3AC", "CS 101").

### 2. Add a Page
Click **"+ New page"** within a notebook to add a new lecture page. Pages default to the current date but can be renamed.

### 3. Record Audio
1. Select a page in the sidebar
2. Click the **red Record button** in the top bar
3. Grant microphone permission when prompted
4. Recording starts — the timer displays elapsed time
5. Use **Pause** to temporarily stop recording
6. Click **Stop** when finished

### 4. Automatic Transcription
When you stop recording:
1. The audio is saved as a WebM file
2. Converted to WAV format (16kHz mono, required by Whisper)
3. Transcribed using whisper.cpp running entirely on-device
4. The transcript appears in the Transcript panel

### 5. View and Copy Transcript
1. Click the **Transcript** button in the top bar to show/hide the transcript panel
2. Click **Copy to Clipboard** to copy the full transcript
3. Paste into the note canvas or any other application

### 6. Take Notes
Use the rich text editor in the PageCanvas:
- **Bold:** Click B or Ctrl+B
- **Italic:** Click I or Ctrl+I
- **Headings:** H1, H2, H3 buttons
- **Lists:** Bullet list, numbered list
- **Code:** Inline code, code blocks
- **Quotes:** Blockquote

### 7. Rename and Organize
- **Double-click** any notebook or page name to rename it
- Use the **×** button to delete notebooks or pages (appears on hover)

## Data Storage

All data is stored locally in the application directory:

| Location | Contents |
|----------|----------|
| `data/notebooks.json` | All notebooks, pages, titles, content, and transcripts |
| `recordings/` | WAV audio files for each recording (named by page ID) |
| `models/ggml-base.en.bin` | Whisper model file (~142MB) |

### Data Structure (notebooks.json)

```json
{
  "notebooks": [
    {
      "id": "uuid-here",
      "name": "Course Name",
      "createdAt": "ISO-timestamp",
      "pages": [
        {
          "id": "uuid-here",
          "name": "Lecture Title",
          "createdAt": "ISO-timestamp",
          "content": "Rich text HTML content",
          "recordingPath": "recordings/page-id.wav",
          "transcript": "Transcribed text here..."
        }
      ]
    }
  ]
}
```

**Backup:** Simply copy the `data/` and `recordings/` folders to back up your data.

## Whisper Model Options

The default `base.en` model is English-only and optimized for speed. To change the model:

1. Download a different model from [ggerganov/whisper.cpp](https://huggingface.co/ggerganov/whisper.cpp)
2. Place it in the `models/` directory
3. Update `getModelPath()` in `electron/main.js`

| Model | Size | Quality | Speed |
|-------|------|---------|-------|
| tiny.en | 75MB | Basic | Fastest |
| base.en | 142MB | Good (default) | Fast |
| small.en | 466MB | Better | Medium |
| medium.en | 1.5GB | Excellent | Slow |

## Project Structure

```
lecturerecorder/
├── electron/
│   ├── main.js           # Electron main process (IPC, file I/O, transcription)
│   └── preload.js       # Context bridge for secure IPC
├── src/
│   ├── index.jsx        # React entry point
│   ├── App.jsx          # Main application component
│   ├── components/
│   │   ├── Sidebar.jsx       # Notebook/page navigation
│   │   ├── PageCanvas.jsx    # Rich text editor (TipTap)
│   │   ├── RecorderBar.jsx   # Recording controls
│   │   └── TranscriptPanel.jsx # Transcript display & copy
│   ├── hooks/
│   │   ├── useNotebooks.js   # Notebook CRUD operations
│   │   └── useRecorder.js    # Audio recording logic
│   └── styles/
│       └── globals.css   # Global styles & Tailwind
├── models/
│   └── ggml-base.en.bin  # Whisper model (downloaded)
├── data/
│   └── notebooks.json    # User data (created at runtime)
├── recordings/           # Audio files (created at runtime)
├── scripts/
│   └── transcribe.py     # Legacy Python script (not used)
├── release/              # Built .dmg files
├── index.html            # HTML entry point
├── package.json          # Dependencies & scripts
├── vite.config.js        # Vite + Electron configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── setup.sh             # Setup script
```

## Configuration Files

### package.json

Key scripts:
- `npm run dev` — Start development server
- `npm run build` — Build production .dmg
- `npm run preview` — Preview production build

Build configuration:
- App ID: `com.lecturerecorder.app`
- Product Name: `LectureRecorder`
- Target: macOS (arm64 + x64)
- Category: Education

### vite.config.js

Uses:
- `@vitejs/plugin-react` for React HMR
- `vite-plugin-electron/simple` for Electron integration

### tailwind.config.js

Custom colors:
- `app`: #1a1a1a (main background)
- `sidebar`: #141414 (sidebar background)
- `transcript`: #242424 (transcript panel)
- `accent`: #6366f1 (indigo accent)

## Troubleshooting

### Microphone Permission Denied
If you see "Microphone access denied", go to **System Preferences > Security & Privacy > Privacy > Microphone** and enable access for LectureRecorder.

### Whisper Model Not Found
If transcription fails with "Model not found", run the setup script again:
```bash
./setup.sh
```

### Transcription Errors
Check the console output in the terminal where you ran `npm run dev`. The main process logs whisper.cpp stdout/stderr for debugging.

### Data Not Saving
Ensure the application has write permissions to its directory. The app stores data in:
- Development: `./data/` and `./recordings/`
- Production: `~/Library/Application Support/LectureRecorder/`

## License

This project is provided as-is for educational and personal use.

## Acknowledgments

- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) — Pure C++ Whisper implementation
- [whisper-node](https://github.com/ariyaratnima/whisper-node) — Node.js bindings for whisper.cpp
- [TipTap](https://tiptap.dev/) — Headless rich text editor
- [Electron](https://www.electronjs.org/) — Cross-platform desktop framework
