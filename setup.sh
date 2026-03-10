#!/bin/bash
set -e

echo "=== LectureRecorder Setup ==="
echo ""

# Node.js check
if ! command -v node &>/dev/null; then
  echo "Error: Node.js not found. Install Node.js 18+ from https://nodejs.org"
  exit 1
fi
echo "✓ node $(node --version)"

# npm install
echo ""
echo "Installing Node.js dependencies..."
npm install
echo "✓ Node.js dependencies installed"

# Compile whisper.cpp
echo ""
echo "Compiling whisper.cpp (one-time build)..."
(cd node_modules/whisper-node/lib/whisper.cpp && make main -j4 2>/dev/null)
echo "✓ whisper.cpp compiled"

# Download model
echo ""
MODELS_DIR="models"
MODEL_FILE="$MODELS_DIR/ggml-base.en.bin"

if [ -f "$MODEL_FILE" ]; then
  echo "✓ Whisper model already downloaded"
else
  mkdir -p "$MODELS_DIR"
  echo "Downloading Whisper base.en model (~142MB)..."
  curl -L "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin" \
    -o "$MODEL_FILE" \
    --progress-bar
  echo "✓ Model downloaded to $MODEL_FILE"
fi

echo ""
echo "=== Setup complete! ==="
echo ""
echo "  Development:  npm run dev"
echo "  Distribution: npm run build  →  release/LectureRecorder.dmg"
echo ""
echo "Data:       ./data/notebooks.json"
echo "Recordings: ./recordings/"
echo "Model:      ./models/ggml-base.en.bin"
