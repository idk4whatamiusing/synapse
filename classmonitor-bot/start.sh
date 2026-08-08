#!/data/data/com.termux/files/usr/bin/bash
# Start the daily auto-marker. Run this once in the morning on class days (~09:00).
cd "$(dirname "$0")"

if pgrep -f "auto_marker.py run" > /dev/null 2>&1; then
    echo "Bot is already running."
    echo "Check: ./status.sh"
    exit 1
fi

termux-wake-lock 2> /dev/null
nohup python3 auto_marker.py run > bot.stdout 2>&1 &
echo "Bot started (pid $!). It will mark every class ~4 min after its start time."
echo "Watch progress with: ./status.sh"