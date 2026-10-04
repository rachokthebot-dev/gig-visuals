#!/bin/sh
# Generates the photoreal artwork set with the local FLUX.2 Klein model.
# Original atmospheric scenes per song - nothing referencing real album art.
# ~41s per image on an M4 mini, 24 images, so budget around 17 minutes.
cd "$(dirname "$0")/.." || exit 1
RAW=.photo-raw
mkdir -p "$RAW" art
python3 - "$RAW" <<'PY'
import json, subprocess, sys, os, time
raw = sys.argv[1]
prompts = json.load(open('tools/photo-prompts.json'))
mflux = os.path.expanduser('~/.local/bin/mflux-generate-flux2')
t0 = time.time()
n = 0
for sid, plist in prompts.items():
    for i, p in enumerate(plist, 1):
        out = os.path.join(raw, f'{sid}-{i}.png')
        if os.path.exists(out):
            print('skip', out); continue
        r = subprocess.run([mflux, '--model', 'flux2-klein-4b', '-q', '6',
                            '--width', '1024', '--height', '576', '--steps', '4',
                            '--seed', str(1000 + n), '--prompt', p, '--output', out],
                           capture_output=True, text=True)
        ok = os.path.exists(out)
        print(f'[{n+1}/24] {sid}-{i} {"ok" if ok else "FAILED"} {time.time()-t0:.0f}s', flush=True)
        if not ok:
            print(r.stderr[-400:], flush=True)
        n += 1
print(f'done in {time.time()-t0:.0f}s')
PY
for f in "$RAW"/*.png; do
  [ -e "$f" ] || continue
  b=$(basename "$f" .png)
  ffmpeg -loglevel error -y -i "$f" -q:v 5 "art/$b.jpg"
done
echo "art/ now holds $(ls art/*.jpg 2>/dev/null | wc -l | tr -d ' ') images"
