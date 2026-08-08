#!/data/data/com.termux/files/usr/bin/bash
cd "$(dirname "$0")"
pkill -f "auto_marker.py run" && echo "Bot stopped." || echo "Bot was not running."
termux-wake-unlock 2> /dev/null