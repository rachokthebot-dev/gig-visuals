#!/bin/sh
# Generates a photoreal artwork set with the local FLUX.2 Klein model.
# Original atmospheric scenes per song - nothing referencing real album art.
#   ./tools/make-photos.sh [prompts.json]
# ~41s per image on an M4 mini.
cd "$(dirname "$0")/.." || exit 1
PROMPTS=${1:-tools/photo-prompts.json}
RAW=.photo-raw
mkdir -p "$RAW" art
python3 - "$RAW" "$PROMPTS" <<'PY'
import json, subprocess, sys, os, time
raw, promptfile = sys.argv[1], sys.argv[2]
prompts = json.load(open(promptfile))
mflux = os.path.expanduser('~/.local/bin/mflux-generate-flux2')
total = sum(len(v) for v in prompts.values())
t0 = time.time(); n = 0
for sid, plist in prompts.items():
    for i, p in enumerate(plist, 1):
        out = os.path.join(raw, f'{sid}-{i}.png')
        n += 1
        if os.path.exists(out):
            print('skip', out, flush=True); continue
        r = subprocess.run([mflux, '--model', 'flux2-klein-4b', '-q', '6',
                            '--width', '1024', '--height', '576', '--steps', '4',
                            '--seed', str(1000 + n), '--prompt', p, '--output', out],
                           capture_output=True, text=True)
        ok = os.path.exists(out)
        print(f'[{n}/{total}] {sid}-{i} {"ok" if ok else "FAILED"} {time.time()-t0:.0f}s', flush=True)
        if not ok: print(r.stderr[-400:], flush=True)
print(f'done in {time.time()-t0:.0f}s')
PY
for f in "$RAW"/*.png; do
  [ -e "$f" ] || continue
  b=$(basename "$f" .png)
  ffmpeg -loglevel error -y -i "$f" -q:v 5 "art/$b.jpg"
done
echo "art/ now holds $(ls art/*.jpg 2>/dev/null | wc -l | tr -d ' ') images"
