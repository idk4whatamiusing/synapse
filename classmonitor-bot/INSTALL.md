# ClassMonitor Auto-Marker — Android Setup Guide

Marks every scheduled class as **Conducted** ~4 minutes after its class time starts,
fully automatically, every class day. You only press ONE command in the morning.

> Note: the script sends an iPhone-Safari user-agent string on purpose — the
> server WAF **blocks** Android/Chrome user-agents with HTTP 403. It's just a
> string; it works identically on Android. Don't "fix" it.

---

## 1) Install Termux (10 min, one-time)

1. Install **Termux** from F-Droid (NOT the Play Store version — it's outdated):
   - https://f-droid.org/en/packages/com.termux/
2. Open Termux. Update packages (first run takes a few minutes):
   ```
   pkg update && pkg upgrade -y
   ```
3. Install what the bot needs:
   ```
   pkg install -y python curl termux-api
   ```
4. Grant Termux storage access (needed to copy files from Download):
   ```
   termux-setup-storage
   ```
   (Accept the permission popup. Then, in Android Settings, also enable
   *Storage* permission for Termux.)
5. **Important — battery optimization:** Android Settings → Apps → Termux →
   Battery → select **Unrestricted**. Otherwise Android may kill the bot mid-day.

---

## 2) Copy the bot folder to the phone

From this PC, move/send the whole **`classmonitor-bot`** folder to the phone
(e.g. via Google Drive / OneDrive / Bluetooth / USB → `Download/`).

Then in Termux:
```
cp -r /storage/emulated/0/Download/classmonitor-bot ~/classmonitor
cd ~/classmonitor
```
Check the config matches your login (it ships pre-filled with your account):
```
nano config.json
```
(save with Ctrl+X → Y → Enter). Settings:
- `grace_minutes` — marks this many minutes after class start (default 4)
- `check_seconds` — how often it scans (default 180 = every 3 min)
- `end_time` — stop working at this time (default 18:45)

Make scripts executable:
```
chmod +x start.sh status.sh stop.sh
```

---

## 3) Test (read-only) before going live

Everything below touches NOTHING — it only reads your schedule:
```
./status.sh
```
You should see all 8 periods with times and current state (Conducted / not held).

Dry-run (would-mark report, posts nothing):
```
python3 auto_marker.py --dry
```

---

## 4) Daily use — the ONLY command you run

Every class day, at ~09:00 (classes start 09:30), open Termux and run:
```
./start.sh
```
That's it. The bot then:
- logs in with your account
- every 3 minutes checks today's schedule against the server clock
- marks each class Conducted as soon as it's ~4 min into its time window
  (P1 ~09:34, P2 ~10:34, … P8 ~16:34)
- never touches already-Conducted classes
- on a holiday (no classes on the schedule page) it marks nothing and exits
- logs everything to `~/classmonitor/auto.log`

Check progress any time:
```
./status.sh
```
Stop it early (e.g. you got a day-off):
```
./stop.sh
```

> Tip: you can keep Termux open or close it — `start.sh` runs the bot with a
> wake-lock, so it survives screen-off. If the phone reboots, just run
> `./start.sh` again.

---

## Log format (`auto.log`)
```
[2026-08-05 09:34:12] Today 2026-08-05 (server 09:34:15) - 8 periods, conducted=1
[2026-08-05 09:34:12] marking P1 (9:30 AM - 10:25 AM) -> ok
```
Possible mark results: `ok` · `rejected-not-in-window` (too early/late — will retry next scan) · `network-error` · `session-lost`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `login: invalid credentials` | Wrong username/password in `config.json` |
| `Could not log in` | Check internet; server briefly down — it retries every 3 min |
| 403 pages | You changed the user-agent — restore the iPhone UA in `auto_marker.py` |
| Bot not marking on time | Battery optimization not disabled for Termux (step 1.5) |
| Marking `rejected-not-in-window` forever | Your phone clock differs from the server clock — bot uses the server clock; check if class times changed |
| `no classes today` on a class day | Holiday guard working, or the routine page changed — check `python3 auto_marker.py status --date=YYYY-MM-DD` |
