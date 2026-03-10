#!/usr/bin/env python3
"""
LectureRecorder Whisper transcription script.
Usage: python3 transcribe.py <path_to_wav>
Output: JSON to stdout: {"transcript": "..."}

Model options (change WHISPER_MODEL below):
  tiny   - 75MB,  basic quality,    fastest
  base   - 145MB, good quality,     fast      (default)
  small  - 465MB, better quality,   medium
  medium - 1.5GB, excellent quality, slow
"""

import sys
import json
import whisper

WHISPER_MODEL = "base"

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio file path provided"}))
        sys.exit(1)

    wav_path = sys.argv[1]

    try:
        model = whisper.load_model(WHISPER_MODEL)
        result = model.transcribe(wav_path)
        print(json.dumps({"transcript": result["text"].strip()}))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
