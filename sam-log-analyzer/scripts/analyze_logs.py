#!/usr/bin/env python3
"""SAM Log Analyzer - Extract and summarize key information from SAM output logs.

Usage:
    python analyze_logs.py <log_file> [--mode MODE] [--agent AGENT] [--last N] [--since TIMESTAMP]

Modes:
    summary     - Overview: error/warning counts, agent health, startup checks (default)
    errors      - All ERROR and CRITICAL lines with context
    warnings    - All WARNING lines (deduplicated by message pattern)
    agents      - Agent lifecycle: registrations, de-registrations, health issues
    requests    - LLM request/response tracking and tool calls
    startup     - Startup health check results
    tail        - Last N lines (default 200), filtered by level/agent
"""

import argparse
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

# Log line pattern: "TIMESTAMP | LEVEL | LOGGER | MESSAGE" or "TIMESTAMP - LOGGER - LEVEL - MESSAGE"
LOG_PATTERN = re.compile(
    r"^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2},?\d*)\s*[|\-]\s*(INFO|WARNING|ERROR|CRITICAL|DEBUG)\s*[|\-]\s*(\S+)\s*[|\-]\s*(.*)"
)
# Startup health check pattern
HEALTH_CHECK = re.compile(r"\[StartupCheck\]\s*\[(PASS|FAIL|WARN)\]\s*(.*)")
# Agent registration
AGENT_REG = re.compile(r"Registered new agent '(\w+)'")
AGENT_DEREG = re.compile(r"Removing agent '(\w+)' from registry")
AGENT_TTL = re.compile(r"Agent '(\w+)' TTL expired.*Last seen: (\d+) seconds")
# LLM calls
LLM_CALL = re.compile(r"LiteLLM completion\(\) model=\s*(\S+)")
# Tool invocations
TOOL_CALL = re.compile(r"Invoking tool: (\S+)")
# SSE queue warnings
SSE_QUEUE = re.compile(r"SSE queue full for stream ([\w-]+)")


def parse_timestamp(ts_str):
    for fmt in ("%Y-%m-%d %H:%M:%S,%f", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(ts_str.strip(), fmt)
        except ValueError:
            continue
    return None


def read_log_lines(path, last_n=None, since=None):
    lines = Path(path).read_text(errors="replace").splitlines()
    if last_n:
        lines = lines[-last_n:]
    if since:
        filtered = []
        for line in lines:
            m = LOG_PATTERN.match(line)
            if m:
                ts = parse_timestamp(m.group(1))
                if ts and ts >= since:
                    filtered.append(line)
            elif filtered:  # continuation of previous matching line
                filtered.append(line)
        lines = filtered
    return lines


def parse_lines(lines):
    parsed = []
    for line in lines:
        m = LOG_PATTERN.match(line)
        if m:
            parsed.append({
                "timestamp": m.group(1),
                "level": m.group(2),
                "logger": m.group(3),
                "message": m.group(4),
                "raw": line,
            })
        elif parsed:
            parsed[-1]["message"] += "\n" + line
            parsed[-1]["raw"] += "\n" + line
    return parsed


def mode_summary(entries, lines):
    print("=" * 70)
    print("SAM LOG SUMMARY")
    print("=" * 70)

    # Time range
    timestamps = [e["timestamp"] for e in entries]
    if timestamps:
        print(f"\nTime range: {timestamps[0]} -> {timestamps[-1]}")
    print(f"Total log lines: {len(lines)}")
    print(f"Parsed entries: {len(entries)}")

    # Level counts
    levels = Counter(e["level"] for e in entries)
    print(f"\nLog levels:")
    for level in ["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"]:
        if levels[level]:
            print(f"  {level:10s}: {levels[level]}")

    # Startup health checks
    checks = []
    for e in entries:
        m = HEALTH_CHECK.search(e["message"])
        if m:
            checks.append((m.group(1), m.group(2)))
    if checks:
        print(f"\nStartup Health Checks:")
        for status, desc in checks:
            icon = {"PASS": "+", "FAIL": "X", "WARN": "!"}[status]
            print(f"  [{icon}] {desc}")

    # Agent summary
    registered = set()
    deregistered = set()
    ttl_expired = set()
    for e in entries:
        m = AGENT_REG.search(e["message"])
        if m:
            registered.add(m.group(1))
        m = AGENT_DEREG.search(e["message"])
        if m:
            deregistered.add(m.group(1))
        m = AGENT_TTL.search(e["message"])
        if m:
            ttl_expired.add(m.group(1))

    if registered:
        print(f"\nAgents registered: {', '.join(sorted(registered))}")
    if ttl_expired:
        print(f"Agents with TTL issues: {', '.join(sorted(ttl_expired))}")

    # LLM models used
    models = Counter()
    for e in entries:
        m = LLM_CALL.search(e["message"])
        if m:
            models[m.group(1)] += 1
    if models:
        print(f"\nLLM calls:")
        for model, count in models.most_common():
            print(f"  {model}: {count} calls")

    # Top warnings (deduplicated)
    warn_patterns = Counter()
    for e in entries:
        if e["level"] == "WARNING":
            # Normalize UUIDs and stream IDs for dedup
            msg = re.sub(r"[0-9a-f]{8,}", "...", e["message"][:120])
            warn_patterns[msg] += 1
    if warn_patterns:
        print(f"\nTop warnings (deduplicated):")
        for msg, count in warn_patterns.most_common(10):
            print(f"  [{count:>5}x] {msg}")

    # Top errors
    error_entries = [e for e in entries if e["level"] in ("ERROR", "CRITICAL")]
    if error_entries:
        print(f"\nErrors ({len(error_entries)} total):")
        seen = set()
        for e in error_entries:
            short = e["message"][:150]
            if short not in seen:
                seen.add(short)
                print(f"  [{e['timestamp']}] {short}")

    print()


def mode_errors(entries, lines):
    print("=" * 70)
    print("ERRORS AND CRITICAL ENTRIES")
    print("=" * 70)
    error_entries = [e for e in entries if e["level"] in ("ERROR", "CRITICAL")]
    if not error_entries:
        print("\nNo errors found.")
        return
    print(f"\nFound {len(error_entries)} error(s):\n")
    for e in error_entries:
        print(f"[{e['timestamp']}] [{e['level']}] [{e['logger']}]")
        print(f"  {e['message']}")
        print()


def mode_warnings(entries, lines):
    print("=" * 70)
    print("WARNING ENTRIES (DEDUPLICATED)")
    print("=" * 70)
    warn_patterns = defaultdict(list)
    for e in entries:
        if e["level"] == "WARNING":
            key = re.sub(r"[0-9a-f]{8,}", "...", e["message"][:200])
            warn_patterns[key].append(e)
    if not warn_patterns:
        print("\nNo warnings found.")
        return
    print(f"\nFound {len(warn_patterns)} unique warning pattern(s):\n")
    for pattern, occurrences in sorted(warn_patterns.items(), key=lambda x: -len(x[1])):
        print(f"[{len(occurrences):>5}x] {pattern}")
        print(f"  First: {occurrences[0]['timestamp']}")
        print(f"  Last:  {occurrences[-1]['timestamp']}")
        print()


def mode_agents(entries, lines, agent_filter=None):
    print("=" * 70)
    print("AGENT LIFECYCLE")
    print("=" * 70)
    events = []
    for e in entries:
        m = AGENT_REG.search(e["message"])
        if m:
            agent = m.group(1)
            if not agent_filter or agent_filter.lower() in agent.lower():
                events.append((e["timestamp"], "REGISTERED", agent, e["message"]))
        m = AGENT_DEREG.search(e["message"])
        if m:
            agent = m.group(1)
            if not agent_filter or agent_filter.lower() in agent.lower():
                events.append((e["timestamp"], "DEREGISTERED", agent, e["message"]))
        m = AGENT_TTL.search(e["message"])
        if m:
            agent = m.group(1)
            if not agent_filter or agent_filter.lower() in agent.lower():
                events.append((e["timestamp"], "TTL_EXPIRED", agent, f"Last seen {m.group(2)}s ago"))
        if "HEALTH CRITICAL" in e["message"]:
            events.append((e["timestamp"], "HEALTH_CRIT", "", e["message"]))

    if not events:
        print("\nNo agent lifecycle events found.")
        return
    print(f"\nFound {len(events)} event(s):\n")
    for ts, event_type, agent, msg in events:
        print(f"[{ts}] {event_type:15s} {agent:25s} {msg[:80]}")


def mode_requests(entries, lines):
    print("=" * 70)
    print("LLM REQUESTS & TOOL CALLS")
    print("=" * 70)
    llm_calls = []
    tool_calls = []
    for e in entries:
        m = LLM_CALL.search(e["message"])
        if m:
            llm_calls.append((e["timestamp"], m.group(1)))
        m = TOOL_CALL.search(e["message"])
        if m:
            tool_calls.append((e["timestamp"], m.group(1)))

    if llm_calls:
        models = Counter(m for _, m in llm_calls)
        print(f"\nLLM Calls ({len(llm_calls)} total):")
        for model, count in models.most_common():
            print(f"  {model}: {count}")
    if tool_calls:
        tools = Counter(t for _, t in tool_calls)
        print(f"\nTool Invocations ({len(tool_calls)} total):")
        for tool, count in tools.most_common():
            print(f"  {tool}: {count}")


def mode_startup(entries, lines):
    print("=" * 70)
    print("STARTUP HEALTH CHECKS")
    print("=" * 70)
    checks = []
    for e in entries:
        if "[StartupCheck]" in e["message"]:
            checks.append(e)
    if not checks:
        print("\nNo startup health check entries found.")
        return
    print()
    for e in checks:
        print(f"[{e['timestamp']}] {e['message']}")
    print()


def mode_tail(entries, lines, last_n=200, level=None, agent_filter=None):
    selected = entries[-last_n:] if not level and not agent_filter else entries
    if level:
        selected = [e for e in selected if e["level"] == level.upper()]
    if agent_filter:
        selected = [e for e in selected if agent_filter.lower() in e["message"].lower() or agent_filter.lower() in e["logger"].lower()]
    selected = selected[-last_n:]
    for e in selected:
        print(e["raw"])


def main():
    parser = argparse.ArgumentParser(description="SAM Log Analyzer")
    parser.add_argument("log_file", help="Path to sam_output.log")
    parser.add_argument("--mode", "-m", default="summary",
                        choices=["summary", "errors", "warnings", "agents", "requests", "startup", "tail"],
                        help="Analysis mode (default: summary)")
    parser.add_argument("--agent", "-a", help="Filter by agent name")
    parser.add_argument("--last", "-n", type=int, help="Only process last N lines")
    parser.add_argument("--since", "-s", help="Only process entries since timestamp (YYYY-MM-DD HH:MM:SS)")
    parser.add_argument("--level", "-l", help="Filter by log level (for tail mode)")
    args = parser.parse_args()

    since = None
    if args.since:
        since = parse_timestamp(args.since)
        if not since:
            print(f"Error: Could not parse timestamp '{args.since}'", file=sys.stderr)
            sys.exit(1)

    lines = read_log_lines(args.log_file, last_n=args.last, since=since)
    entries = parse_lines(lines)

    if not entries:
        print("No log entries found matching criteria.")
        sys.exit(0)

    mode_funcs = {
        "summary": lambda: mode_summary(entries, lines),
        "errors": lambda: mode_errors(entries, lines),
        "warnings": lambda: mode_warnings(entries, lines),
        "agents": lambda: mode_agents(entries, lines, args.agent),
        "requests": lambda: mode_requests(entries, lines),
        "startup": lambda: mode_startup(entries, lines),
        "tail": lambda: mode_tail(entries, lines, last_n=args.last or 200, level=args.level, agent_filter=args.agent),
    }
    mode_funcs[args.mode]()


if __name__ == "__main__":
    main()
