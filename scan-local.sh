#!/bin/sh
# Builds manifests for the gitignored local folders: ./tracks (your audio) and
# ./my-art (your images, e.g. album covers). Neither folder is ever committed.
cd "$(dirname "$0")" || exit 1

scan() {
  dir=$1; pattern=$2
  [ -d "$dir" ] || { echo "no ./$dir — skipping"; return; }
  ls "$dir" | grep -Ei "$pattern" |
    python3 -c 'import json,sys; print(json.dumps([l.rstrip("\n") for l in sys.stdin]))' \
    > "$dir/manifest.json"
  n=$(python3 -c "import json;print(len(json.load(open('$dir/manifest.json'))))")
  echo "$dir/manifest.json: $n file(s)"
}

scan tracks '\.(mp3|m4a|aac|ogg|opus|wav|webm|flac)$'
scan my-art '\.(jpg|jpeg|png|webp|gif|avif)$'
scan my-video '\.(mp4|m4v|mov|webm)$'
