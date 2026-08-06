#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"
echo "== running? =="
pgrep -af "auto_marker.py run" || echo "not running"
echo
echo "== last log lines =="
tail -n 20 auto.log 2> /dev/null || echo "(no log yet)"
echo
echo "== today status =="
python3 auto_marker.py status 2> /dev/null || echo "(status fetch failed)"