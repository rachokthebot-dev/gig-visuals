#!/bin/sh
# Serve on localhost so getUserMedia is allowed (file:// blocks the mic in most browsers).
PORT=${1:-8777}
echo "Gig visuals -> http://localhost:$PORT"
( sleep 1; open "http://localhost:$PORT" ) 2>/dev/null &
exec python3 -m http.server "$PORT" --bind 127.0.0.1
