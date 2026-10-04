# Gig Visuals

Live visuals for the Block Party set, driven by the room. Point a laptop at the PA,
pick an engine, hit full screen. No click track, no MIDI, nothing to cue.

Two set lists, each its own page:

- **Block Party** → https://rachokthebot-dev.github.io/gig-visuals/
- **Anton 10.2026** → https://rachokthebot-dev.github.io/gig-visuals/anton.html

A switcher at the top of each landing page moves between them. Both share the same
engines, audio analysis and build tools; only the theme file differs
(`js/themes.js` vs `js/themes-anton.js`), and the page reads its name, tagline and
song count from whichever one loaded.

## Anton 10.2026

Fourteen Russian rock songs, read straight out of the Shreddy folder of the same name
(`apps/shreddy/dev.db`). Unlike the Block Party set, Shreddy already holds a **measured**
BPM and musical key for every track, so the tempo prior is exact rather than estimated and
the demo beds sit in each song's real key.

Where Block Party runs dark, this set is built deliberately bright — open sky, spring
light, gold and brass. Each song's scene comes from what it is about: a railway at golden
hour for *Дополнительный 38й*, light through glass for *Стаканы*, Earth from orbit with
the sun rising over the limb for *Трава у дома*.

Open it on the laptop that drives the projector, allow the microphone, press `F`.
No install, no build step, no dependencies — it also runs offline from a local copy.
Not near a PA? Pick **Demo audio** and it plays its own bed.

## The three engines

Picked from a survey of live-visual tools; these are the three that run in a browser
with nothing to install. Implemented here directly rather than embedded, so the whole
thing is one offline folder and every song can theme them.

| Key | Engine | What it is |
| --- | ------ | ---------- |
| `1` | **Hydra** | An `osc → kaleid → modulate → rotate` chain fed back into itself, written as one fragment shader. Symmetrical, hard-edged, snaps on the beat. |
| `2` | **MilkDrop** | Butterchurn's architecture: each frame warps the previous one — zoom, rotate, noise, decay — with the waveform and a beat ring drawn on top. The trails *are* the picture. |
| `3` | **p5** | A flow field of particles over a radial spectrum ring, kicked outward on every detected beat. |
| `4` | **Fractal** | An escape-time Julia set (Burning Ship on the heavier songs), coloured through orbit traps. The constant drifts on the bass, the zoom punches on the beat, and the artwork rides the same trap field. |
| `5` | **Three** | A real 3D scene via three.js. The song's artwork becomes an equirectangular environment map, so the metal carries genuine reflections of the photograph and the room behind it is the photograph too. PBR shading, ACES tone mapping, audio-driven surface displacement. |
| `0` | Auto | Each song uses the engine it was written for. **This is the one to run at the gig.** |

Every song defines parameters for all three, so any engine can carry the whole set.

## Audio sources

Pick one on the landing page:

| Source | What it does |
| ------ | ------------ |
| **Microphone** | The gig setting. Listens to the room; never routed to the speakers, so it can't howl. |
| **My tracks** | Plays your own local audio files, analysed exactly like the mic would be. Nothing is uploaded or published — see below. |
| **Demo audio** | A 30-second stereo clip per song, shipped with the app (`demo/*.mp3`, ~470&nbsp;KB each). Drums, bass and guitar at that song's tempo and key. Loops, so the shared link is never silent. |

All three run through the same analyser, so the visuals react to real sound in every mode.

### Using your own files

Two ways, both local only:

- **Choose audio files…** on the landing page. Files are matched to songs by filename —
  messy `yt-dlp` names like `Nirvana - Smells Like Teen Spirit (Official Music Video).webm`
  match fine. Nothing is uploaded; the browser reads them straight off disk.
- **Drop them in `./tracks/`** and run `./scan-local.sh`. The app picks them up on load.
  `tracks/` is gitignored and never published.

Any song without a file falls back to the demo bed, so a half-filled folder still plays
the whole set. A track running out advances to the next song.

## Controls

On screen, bottom left: back to the landing page, previous, play/pause, next, mute.

`←` `→` `space` song · `1` `2` `3` engine · `0` auto · `P` play/pause · `M` mute ·
`S` set list · `H` hide HUD · `F` full screen · `Esc` landing page.
Clicking a row in the set list jumps to that song.

Mute silences the speakers only — the analyser sits upstream, so the visuals keep
reacting while muted.

## The set

| # | Song | Artist | Engine | Look |
|---|------|--------|--------|------|
| 1 | Smells Like Teen Spirit | Nirvana | MilkDrop | Nevermind pool — chlorine blue, bleached yellow |
| 2 | Come Out and Play | The Offspring | Hydra | Scorched orange on black, hard snap |
| 3 | Seether | Veruca Salt | p5 | Candy violet, sugar-rush particles |
| 4 | Man in the Box | Alice In Chains | MilkDrop | Bile green; the only theme that zooms *inward* |
| 5 | Sweet Child O' Mine | Guns N' Roses | Hydra | Desert gold and blood red, slow sepia bloom |
| 6 | Possum Kingdom | Toadies | p5 | Black water, moon-silver, one red eye |
| 7 | Back On the Chain Gang | Pretenders | Hydra | 80s chrome, cold blue with amber |
| 8 | Immigrant Song | Led Zeppelin | MilkDrop | Ice and fire — cyan glacier torn by molten orange |

## How the listening works

`js/audio.js`:

- **Bands** — bass 30–160 Hz, low-mid 160–600, mid 600–2.5k, high 2.5k–9k, plus RMS level.
- **Onsets** — spectral flux weighted toward the low-mid where the kit sits, with an
  adaptive threshold (mean + 1.6σ over the last second) and a 120 ms refractory gap.
- **Tempo** — normalised autocorrelation of the flux envelope over a 6-second window,
  searching lags for 60–200 BPM, re-estimated three times a second.
- **Octave lock** — each song's `bpm` in `js/themes.js` is a *prior*, not a setting. It
  tilts the autocorrelation score and folds the winner toward itself, which is what stops
  the usual half-/double-time flip. Detected tempo always wins.
- **Beat phase** — free-runs at the detected period and is *nudged* toward each onset
  rather than snapped, so one stray hit can't derail it.

The BPM readout in the HUD shows what it's locked to; the bar underneath is confidence.

### Reference tempos are approximate

The `bpm` values in `js/themes.js` are my estimates. Correct any that are off and
detection gets better immediately — they only steer the octave, nothing else.

## Running it locally

    ./run.sh          # http://localhost:8777

Serve over `localhost` or https; browsers refuse microphone access from `file://`.

    mkdir tracks && cp ~/Music/blockparty/*.mp3 tracks/ && ./scan-local.sh

…and the app will play your own files on the next load.

## Changing the look

Everything is in `js/themes.js` — one entry per song: three palette colours, a background,
the preferred engine, a parameter block per engine, and the `audio` block (root note, drive,
and 16-step drum/bass/guitar patterns) that the demo bed plays. No other file needs touching
to re-skin or re-score a song.

## Artwork

All four engines take artwork, each in its own way. Press `I` to toggle it.

- **MilkDrop** injects the picture into the feedback buffer, so the warp zooms, rotates
  and smears it into the trails and each beat re-forms it.
- **Hydra** samples it through the kaleid coordinates, so the symmetry is built out of the
  picture rather than out of the oscillator.
- **p5** lays it under the flow field, where the particles ride over and gradually scatter it.
- **Fractal** blends it through the orbit-trap field, so picture and fractal share one image.

On every song change the image is revealed clearly for about half a second and then
dissolves into the visuals as the reveal decays.

`art/*.jpg` ships with the app — **three photoreal images per song** (24 in all, 1.8 MB,
1024×576), generated locally with FLUX.2 Klein 4B via `mflux`. Prompts live in
`tools/photo-prompts.json`: original atmospheric scenes chosen to match each song's palette
and mood, not reproductions of anyone's artwork. Regenerate with `./tools/make-photos.sh`
(~41 s per image, about 16 minutes for the set).

Procedural maths — fractals, oscillators, noise — is abstract by construction and can never
look photographic. Realism in these visuals comes from the source material, which is why the
artwork is a photograph rather than something generated at runtime. `tools/make-art.js`
still produces the abstract palette-derived set if you prefer it.

While a song plays the app cycles its three images every 9 seconds, each change riding the
same reveal that a song change uses — a three-minute song isn't one static picture.

    node tools/make-art.js
    cd art && for f in *.png; do ffmpeg -y -i "$f" -q:v 5 "${f%.png}.jpg"; done && rm *.png

### Using your own images or video

All four engines accept a **video clip** as readily as a still — a `<video>` is re-uploaded
to the texture every frame and everything else is identical. Photographic *motion* is the
most convincing realism cue available short of real 3D.

Album covers and footage are someone else's work, so they're handled exactly like the
recordings — locally only, never committed:

- **Use your own images or clips…** on the landing page, or
- drop stills in `./my-art/` and clips in `./my-video/`, then run `./scan-local.sh`.
  Both folders are gitignored.

Files are matched by filename, falling back to the generated art for anything unmatched.
Covers are usually named for the album rather than the track, so after the title pass
there's a second pass on artist alone — applied only where that artist appears exactly
once in the set, which keeps the attribution unambiguous. In testing,
`Nirvana - Nevermind (album cover).jpg` and `The Offspring - Smash.jpg` both land on the
right song, while `IMG_4821.jpg` is correctly left alone.

Two notes on the injection, both of which took measuring to get right: the buffer settles
at roughly `injection / (1 - decay)`, so the amount is normalised against each song's decay
— otherwise the artwork is three times stronger on *Immigrant Song* than on *Man in the
Box*. And it's weighted by the image's own luminance, so bright features seed the warp
while flat dark areas don't wash the frame out.

## The demo clips

`demo/*.mp3` are generated, not sampled — generic drum, bass and power-chord patterns in
each song's key and tempo. They're a backing bed, not the songs, which is why they can ship
publicly. For the real recordings use **My tracks**; those stay on your machine.

Regenerate them with:

    node tools/render-demo.js
    cd demo && for f in *.wav; do \
      ffmpeg -y -i "$f" -af loudnorm=I=-16:TP=-1.5:LRA=11 \
             -codec:a libmp3lame -b:a 96k -ac 1 "${f%.wav}.mp3"; done && rm *.wav

`tools/render-demo.js` reads the patterns straight out of `js/themes.js`, so editing a
song's `audio` block and re-running is all it takes. The loudness pass matters: peak
normalising alone left the sparse arrangements far quieter than the dense ones, and
visual brightness tracks level.

### Making them sound played rather than programmed

Oscillators through a clipper sound like oscillators through a clipper. What moves a
synthesised rock bed toward sounding performed, roughly in order of effect:

- **Double-tracked guitars.** Each chord is rendered as two independent takes with
  separate detuning and pick timing, panned hard left and right. Measured channel
  correlation is 0.57–0.77; a single take panned wide stays at 1.0 and sounds flat.
- **A cabinet, not a lowpass.** Highpass at 95 Hz, presence lift at 2.6 kHz, a scooped
  450 Hz, then two poles rolling off above ~6 kHz. That curve is most of "guitar".
- **Asymmetric clipping**, so the distortion generates even harmonics as well as odd.
- **Metallic hats** — six inharmonic squares, the classic recipe — instead of filtered
  white noise, which always just sounds like filtered white noise.
- **A room.** A Schroeder reverb, detuned per channel, fed mostly from the snare.
- **Humanisation** — a few ms of timing scatter and real velocity variation per hit.

Two things worth knowing about the result:

Detection lands within 1–2 BPM on all eight clips, but *confidence* is lower than it was
against the rigid version (0.2–0.9 rather than 0.3–0.9). The humanisation is the cause,
and that is the correct trade: a metronomic grid autocorrelates beautifully and sounds
like a drum machine. A real band scores lower too. *Man in the Box* sits lowest because
its half-time pattern puts a snare only on the three, which is genuinely ambiguous.

And the honest limit: this is still synthesis. It should read as a decent programmed
rehearsal demo, not as a recording. For the actual songs, use **My tracks**.
