/* Local audio files. They never leave the machine and are never committed —
   either dropped into a gitignored ./tracks folder (listed by its manifest)
   or picked by hand with the file input. */
window.GV = window.GV || {};
GV.Tracks = GV.Match.store('tracks', ['mp3', 'm4a', 'aac', 'ogg', 'opus', 'wav', 'webm', 'flac']);
