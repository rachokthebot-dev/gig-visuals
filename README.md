# Block Party — Gig Visuals

Live visuals for the Block Party set, driven by the room. Point a laptop at the PA,
pick an engine, hit full screen. No click track, no MIDI, nothing to cue.

**→ https://rachokthebot-dev.github.io/gig-visuals/**

Open it on the laptop that drives the projector, allow the microphone, press `F`.
No install, no build step, no dependencies — it also runs offline from a local copy.

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

## Controls

`←` `→` `space` song · `1` `2` `3` engine · `0` auto · `S` set list · `H` hide HUD · `F` full screen.
Clicking a row in the set list jumps to that song.

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
**Preview (no mic)** runs a synthetic beat at each song's reference tempo, so you can
check the themes with no audio at all — useful for picking looks before rehearsal.

## Changing the look

Everything visual is in `js/themes.js` — one entry per song: three palette colours, a
background, the preferred engine, and a parameter block per engine. No other file needs
touching to re-skin a song.
