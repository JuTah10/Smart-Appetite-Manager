---
name: sam-log-analyzer
description: >
  Analyze SAM (Smart Appetite Manager) application logs to diagnose problems, identify errors,
  and troubleshoot agent issues. Use this skill when Claude needs to: (1) Read or analyze logs
  in App/logs/, (2) Debug SAM agent failures, crashes, or unexpected behavior, (3) Investigate
  startup health check failures, (4) Diagnose agent TTL expiry, de-registration, or flapping,
  (5) Check LLM call patterns or tool invocation issues, (6) Understand SSE/web UI connection
  problems, (7) Triage any SAM runtime error. Triggers on: "check logs", "what's wrong with SAM",
  "debug SAM", "analyze errors", "why is agent failing", "check health", "read sam_output.log".
---

# SAM Log Analyzer

## Quick Start

Run the analysis script to get an overview of the current state:

```bash
python3 sam-log-analyzer/scripts/analyze_logs.py App/logs/sam_output.log
```

This produces a summary with error counts, health check results, agent status, and top warnings.

## Analysis Workflow

### 1. Run Summary First

Always start with summary mode to understand the big picture:

```bash
python3 sam-log-analyzer/scripts/analyze_logs.py App/logs/sam_output.log --mode summary
```

### 2. Drill Into Specific Areas

Based on summary findings, drill deeper:

| Finding                        | Next Command                                           |
|-------------------------------|--------------------------------------------------------|
| Errors present                | `--mode errors`                                        |
| Agent TTL issues              | `--mode agents` or `--mode agents --agent AgentName`   |
| Many warnings                 | `--mode warnings`                                      |
| Startup health failures       | `--mode startup`                                       |
| LLM call anomalies            | `--mode requests`                                      |
| Need recent context           | `--mode tail --last 300`                               |
| Filter by level               | `--mode tail --level ERROR`                            |
| Filter by agent               | `--mode tail --agent ShopperAgent`                     |
| Time-bounded analysis         | `--since "2026-03-14 13:00:00"`                        |

### 3. Read Raw Log Sections

For detailed investigation, read specific sections of `App/logs/sam_output.log` directly using the Read tool with offset/limit to examine context around errors found by the script.

### 4. Cross-Reference with Source Code

After identifying the error, check the relevant source:

| Log Logger Pattern                        | Source Location              |
|------------------------------------------|------------------------------|
| `rate_limit_init`                         | `App/src/rate_limit_init.py` |
| `recipe_agent.*` or `mealdb_tools`        | `App/src/recipe_agent/`      |
| `inventory_agent.*`                       | `App/src/inventory_agent/`   |
| `shopper_agent.*` or `grocery_tools`      | `App/src/shopper_agent/`     |
| `receipt_agent.*`                         | `App/src/receipt_agent/`     |
| `solace_agent_mesh.*`                     | Framework code (query Context7) |

### 5. Query Context7 When Needed

For errors in `solace_agent_mesh.*` loggers or SAM framework behavior, query Context7 with library ID `solacelabs/solace-agent-mesh` to understand the framework internals.

## Script Reference

**Path**: `sam-log-analyzer/scripts/analyze_logs.py`

```
python3 sam-log-analyzer/scripts/analyze_logs.py <log_file> [options]

Modes (--mode / -m):
  summary   - Error/warning counts, health checks, agent status (default)
  errors    - All ERROR and CRITICAL entries with full messages
  warnings  - Deduplicated warning patterns with counts and time ranges
  agents    - Agent registrations, de-registrations, TTL events
  requests  - LLM model usage and tool invocation counts
  startup   - Startup health check results
  tail      - Last N lines, optionally filtered

Filters:
  --last N / -n N          Only process last N lines of the log
  --since TIMESTAMP / -s   Only entries after this time (YYYY-MM-DD HH:MM:SS)
  --agent NAME / -a        Filter by agent name (agents/tail modes)
  --level LEVEL / -l       Filter by log level (tail mode)
```

## Diagnostics Reference

For detailed information about SAM agents, external APIs, common problem patterns and their fixes, read `sam-log-analyzer/references/sam-diagnostics.md`.
