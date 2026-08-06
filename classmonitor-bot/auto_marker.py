#!/usr/bin/env python3
"""
ClassMonitor Auto-Marker
Marks every scheduled class as "Conducted" a few minutes after its class time,
strictly within the class's own time window (the server rejects marks otherwise).

Fully autonomous once started: no confirmations, no pip installs (uses curl).
Runs on Android Termux or on any PC with python3 + curl.

Usage:
  python auto_marker.py run          day-long autonomous run (used by start.sh)
  python auto_marker.py once         single scan: mark every now-open window, then exit
  python auto_marker.py status       read-only report of today's periods
  python auto_marker.py --dry        like 'once' but posts NOTHING
  python auto_marker.py --date YYYY-MM-DD   use this date (status/dry only)
"""

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from urllib.parse import quote

APP_BASE = "https://classmonitorapp.aucseapp.in/ios"
API_BASE = "https://classmonitor.aucseapp.in"

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 "
      "Mobile/15E148 Safari/604.1")

DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(DIR, "config.json")
COOKIE_PATH = os.path.join(DIR, ".cookies.txt")
LOG_PATH = os.path.join(DIR, "auto.log")
PID_PATH = os.path.join(DIR, "bot.pid")

REJECT_MSG = "only be marked during the scheduled class time"


def log(msg):
    line = "[%s] %s" % (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg)
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def load_config():
    if not os.path.exists(CONFIG_PATH):
        log("ERROR: config.json not found next to auto_marker.py")
        sys.exit(2)
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    cfg.setdefault("username", "")
    cfg.setdefault("password", "")
    cfg.setdefault("grace_minutes", 4)
    cfg.setdefault("check_seconds", 180)
    cfg.setdefault("end_time", "18:45")
    return cfg


def curl(args, data=None, timeout=40):
    exe = "curl.exe" if os.name == "nt" else "curl"
    cmd = [exe, "-s", "-m", str(timeout), "-A", UA,
           "-b", COOKIE_PATH, "-c", COOKIE_PATH]
    if data is not None:
        cmd += ["--data", data]
    cmd += args
    try:
        return subprocess.run(cmd, capture_output=True, text=True,
                              encoding="utf-8", errors="replace",
                              timeout=timeout + 5)
    except Exception:
        return None


def login(cfg):
    payload = "role=student&username=%s&password=%s" % (
        quote(cfg.get("username", "")), quote(cfg.get("password", "")))
    r = curl(["-L", APP_BASE + "/"], data=payload)
    if r is None or r.returncode != 0:
        log("login: network error")
        return False
    if "Invalid credentials" in r.stdout:
        log("login: invalid credentials")
        return False
    if "Welcome" in r.stdout or "dashboard.php" in r.stdout:
        return True
    log("login: unexpected response")
    return False


def server_now():
    r = curl([API_BASE + "/get_date_time.php"])
    if r is not None and r.returncode == 0:
        try:
            j = json.loads(r.stdout)
            dt = datetime.strptime(j["datetime"][:19], "%Y-%m-%d %H:%M:%S")
            return dt, j["date"]
        except Exception:
            pass
    now = datetime.now()
    return now, now.strftime("%Y-%m-%d")


def fetch_schedule(cfg, date_str, session):
    url = "%s/schedule.php?date=%s" % (APP_BASE, date_str)
    r = curl([url])
    if r is None or r.returncode != 0:
        return None
    html = r.stdout
    if "login-card" in html or "period-row" not in html:
        # expired session or a 403/error page — try re-login once
        if not session["relogged"]:
            session["relogged"] = True
            log("session problem (login-card or no periods found) - re-logging in")
            if login(cfg):
                r = curl([url])
                return r.stdout if r is not None and r.returncode == 0 else None
        return None
    return html


def parse_time_min(text):
    m = re.match(r"\s*(\d{1,2}):(\d{2})\s*(AM|PM)", text, re.I)
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    ap = m.group(3).upper()
    if ap == "PM" and h != 12:
        h += 12
    if ap == "AM" and h == 12:
        h = 0
    return h * 60 + mi


def fmt_time(mins):
    if mins is None:
        return "?--?"
    h, m = divmod(mins % (24 * 60), 60)
    ap = "AM" if h < 12 else "PM"
    hh = h % 12 or 12
    return "%d:%02d %s" % (hh, m, ap)


def parse_periods(html):
    out = []
    for block in re.split(r'<article class="period-row', html)[1:]:
        m = re.search(r'name="period" value="(\d+)"', block)
        if not m:
            continue
        pid = int(m.group(1))
        tm = re.search(r"<p>Time:\s*([^<]+)</p>", block)
        start = end = None
        if tm and "-" in tm.group(1):
            lo, hi = tm.group(1).split("-", 1)
            start = parse_time_min(lo)
            end = parse_time_min(hi)
        conducted = "state-text success" in block
        out.append({"id": pid, "start": start, "end": end,
                    "conducted": conducted})
    out.sort(key=lambda p: p["id"])
    return out


def is_eligible(period, now_min, grace_min):
    if period["conducted"]:
        return False
    if period["start"] is None or period["end"] is None:
        return False
    return period["start"] + grace_min <= now_min <= period["end"] + 1


def mark(cfg, date_str, pid):
    body = "date=%s&period=%d" % (date_str, pid)
    r = curl([APP_BASE + "/schedule.php"], data=body)
    if r is None or r.returncode != 0:
        return "network-error"
    html = r.stdout
    if REJECT_MSG in html:
        return "rejected-not-in-window"
    if "login-card" in html:
        return "session-lost"
    for p in parse_periods(html):
        if p["id"] == pid and p["conducted"]:
            return "ok"
    return "verify-failed"


def scan(cfg, session, dry=False):
    if not login(cfg):
        log("Could not log in - will retry next cycle.")
        return None
    now, today = server_now()
    html = fetch_schedule(cfg, today, session)
    if html is None:
        log("Could not load schedule for %s (session problem)." % today)
        return None
    periods = parse_periods(html)
    if not periods:
        log("NO classes scheduled today (%s) - holiday guard, nothing to mark." % today)
        return 0
    now_min = now.hour * 60 + now.minute
    log("Today %s (server %s) - %d periods, conducted=%d"
        % (today, now.strftime("%H:%M:%S"), len(periods),
           sum(1 for p in periods if p["conducted"])))
    for p in periods:
        log("    P%-2d %-11s - %-11s %s"
            % (p["id"], fmt_time(p["start"]), fmt_time(p["end"]),
               "CONDUCTED" if p["conducted"] else "not held"))
    due = [p for p in periods
           if is_eligible(p, now_min, cfg["grace_minutes"])]
    if dry:
        log("DRY-RUN: would mark %s"
            % (", ".join("P%d" % p["id"] for p in due) or "nothing (none open yet)"))
        return len(periods)
    for p in due:
        res = mark(cfg, today, p["id"])
        arg = "(%s - %s)" % (fmt_time(p["start"]), fmt_time(p["end"]))
        log("marking P%d %s -> %s" % (p["id"], arg, res))
    return len(periods)


def notify(text):
    try:
        subprocess.run(["termux-notification", "--title", "ClassMonitor",
                        "--content", text], timeout=10)
    except Exception:
        pass


def run_loop(cfg, session):
    now, today = server_now()
    end_h, end_m = map(int, cfg["end_time"].split(":"))
    log("== RUN started: today %s (server %s), working until %s =="
        % (today, now.strftime("%H:%M"), cfg["end_time"]))
    try:
        with open(PID_PATH, "w") as f:
            f.write(str(os.getpid()))
    except Exception:
        pass
    while True:
        n = scan(cfg, session, dry=False)
        if n == 0:
            log("No classes today - exiting.")
            return 0
        now, _ = server_now()
        html = fetch_schedule(cfg, today, session)
        if html:
            ps = parse_periods(html)
            if ps and all(p["conducted"] for p in ps):
                log("ALL classes today are marked - complete.")
                notify("All classes marked")
                return 0
        if now.hour > end_h or (now.hour == end_h and now.minute >= end_m):
            log("End-of-day reached (%s) - exiting." % cfg["end_time"])
            return 0
        time.sleep(max(15, int(cfg["check_seconds"])))


def main(argv):
    args = [a for a in argv[1:]]
    dry = "--dry" in args or "--dry-run" in args
    mode = "run" if "run" in args else \
           "once" if "once" in args else \
           "status" if "status" in args or "--status" in args else \
           "once"
    date_override = None
    for a in args:
        if a.startswith("--date="):
            date_override = a.split("=", 1)[1]

    cfg = load_config()
    session = {"relogged": False}
    now, today = server_now()
    if date_override:
        today = date_override

    if mode == "run":
        return run_loop(cfg, session)
    login(cfg)
    if mode == "status":
        html = fetch_schedule(cfg, today, session)
        if html is None:
            log("Could not load schedule.")
            return 1
        ps = parse_periods(html)
        log("%s - %d periods" % (today, len(ps)))
        for p in ps:
            log("    P%d  %-11s - %-11s %s"
                % (p["id"], fmt_time(p["start"]), fmt_time(p["end"]),
                   "CONDUCTED" if p["conducted"] else "not held"))
        return 0

    n = scan(cfg, session, dry=dry)
    return 0 if n is not None else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))