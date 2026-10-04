#!/bin/sh
# Build tracks/manifest.json from whatever audio files are sitting in ./tracks.
# The folder and its contents are gitignored; nothing here is ever published.
cd "$(dirname "$0")" || exit 1
[ -d tracks ] || { echo "No ./tracks folder — create it and drop your audio files in."; exit 1; }
ls tracks | grep -Ei '\.(mp3|m4a|aac|ogg|opus|wav|webm|flac)$' |
  python3 -c 'import json,sys; print(json.dumps([l.rstrip("\n") for l in sys.stdin]))' > tracks/manifest.json
echo "Wrote tracks/manifest.json:"; cat tracks/manifest.json
