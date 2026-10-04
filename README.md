# Block Party — Gig Visuals

Live visuals for the Block Party set, driven by the room. Point a laptop at the PA,
pick an engine, hit full screen. No click track, no MIDI, nothing to cue.

**→ https://rachokthebot-dev.github.io/gig-visuals/**

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
| `0` | Auto | Each song uses the engine it was written for. **This is the one to run at the gig.** |

Every song defines parameters for all three, so any engine can carry the whole set.

## Audio sources

Pick one on the landing page:

| Source | What it does |
| ------ | ------------ |
| **Microphone** | The gig setting. Listens to the room; never routed to the speakers, so it can't howl. |
| **My tracks** | Plays your own local audio files, analysed exactly like the mic would be. Nothing is uploaded or published — see below. |
| **Demo audio** | A 30-second clip per song, shipped with the app (`demo/*.mp3`, ~350&nbsp;KB each). Drums, bass and guitar at that song's tempo and key. Loops, so the shared link is never silent. |

All three run through the same analyser, so the visuals react to real sound in every mode.

### Using your own files

Two ways, both local only:

- **Choose audio files…** on the landing page. Files are matched to songs by filename —
  messy `yt-dlp` names like `Nirvana - Smells Like Teen Spirit (Official Music Video).webm`
  match fine. Nothing is uploaded; the browser reads them straight off disk.
- **Drop them in `./tracks/`** and run `./scan-tracks.sh`. The app picks them up on load.
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

    mkdir tracks && cp ~/Music/blockparty/*.mp3 tracks/ && ./scan-tracks.sh

…and the app will play your own files on the next load.

## Changing the look

Everything is in `js/themes.js` — one entry per song: three palette colours, a background,
the preferred engine, a parameter block per engine, and the `audio` block (root note, drive,
and 16-step drum/bass/guitar patterns) that the demo bed plays. No other file needs touching
to re-skin or re-score a song.

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

Detection against the shipped clips lands within 1–2 BPM on all eight. Confidence is
lower on *Man in the Box* (~0.3) because its half-time pattern puts a snare only on the
three, which makes the autocorrelation genuinely ambiguous — the reference tempo carries
it to the right answer.
